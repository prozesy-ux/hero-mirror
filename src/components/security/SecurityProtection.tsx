import { useEffect, ReactNode, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

interface SecurityProtectionProps {
  children: ReactNode;
}

const HONEYPOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/security-honeypot`;

const SecurityProtection = ({ children }: SecurityProtectionProps) => {
  const location = useLocation();
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
  
  // Check if user is on dashboard routes (where we allow more interactions)
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  // Report suspicious activity to backend honeypot
  const reportToHoneypot = useCallback(async (eventType: string, metadata: Record<string, unknown> = {}) => {
    try {
      // Get local attempt count
      const storageKey = `security_attempts_${eventType}`;
      const currentAttempts = parseInt(sessionStorage.getItem(storageKey) || '0', 10) + 1;
      sessionStorage.setItem(storageKey, String(currentAttempts));

      // Only report to backend after 2 local attempts (reduce noise)
      if (currentAttempts < 2) return;

      // Prevent repeated reporting for same event type in session
      const reportedKey = `security_reported_${eventType}`;
      if (sessionStorage.getItem(reportedKey) === 'true') return;

      const response = await fetch(HONEYPOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          metadata: {
            ...metadata,
            local_attempts: currentAttempts,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
          },
        }),
      });

      const data = await response.json();
      
      // Mark as reported to prevent spam
      sessionStorage.setItem(reportedKey, 'true');

      // If blocked, show warning and update state
      if (data.blocked) {
        setIsBlocked(true);
        setBlockedUntil(data.blocked_until || null);
        sessionStorage.setItem('security_blocked', 'true');
        sessionStorage.setItem('security_blocked_until', data.blocked_until || '');
      }
    } catch {
      // Fail silently - don't break the app if honeypot is unavailable
    }
  }, []);

  // Check if user is blocked on mount
  const checkBlockStatus = useCallback(async () => {
    // Check local storage first
    if (sessionStorage.getItem('security_blocked') === 'true') {
      setIsBlocked(true);
      setBlockedUntil(sessionStorage.getItem('security_blocked_until'));
      return;
    }
    
    try {
      const response = await fetch(HONEYPOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_only: true }),
      });

      const data = await response.json();
      
      if (data.blocked) {
        setIsBlocked(true);
        setBlockedUntil(data.blocked_until || null);
        sessionStorage.setItem('security_blocked', 'true');
      }
    } catch {
      // Fail silently
    }
  }, []);

  useEffect(() => {
    // Check block status on mount
    checkBlockStatus();

    // === KEYBOARD SHORTCUT BLOCKING ===
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        reportToHoneypot('devtools_detected', { method: 'F12' });
        return false;
      }

      // Block Ctrl+Shift+I (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        reportToHoneypot('devtools_detected', { method: 'Ctrl+Shift+I' });
        return false;
      }

      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        reportToHoneypot('devtools_detected', { method: 'Ctrl+Shift+J' });
        return false;
      }

      // Block Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        reportToHoneypot('devtools_detected', { method: 'Ctrl+Shift+C' });
        return false;
      }

      // Block Ctrl+U (View Source) - but not on dashboard
      if (e.ctrlKey && e.key === 'u' && !isDashboardRoute) {
        e.preventDefault();
        reportToHoneypot('repeated_inspection', { method: 'Ctrl+U' });
        return false;
      }

      // Block Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+K (Firefox Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        reportToHoneypot('devtools_detected', { method: 'Ctrl+Shift+K' });
        return false;
      }

      // Block Cmd+Option+I (Mac DevTools)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        reportToHoneypot('devtools_detected', { method: 'Cmd+Option+I' });
        return false;
      }

      // Block Cmd+Option+J (Mac Console)
      if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault();
        reportToHoneypot('devtools_detected', { method: 'Cmd+Option+J' });
        return false;
      }

      // Block Cmd+Option+U (Mac View Source) - but not on dashboard
      if (e.metaKey && e.altKey && e.key === 'u' && !isDashboardRoute) {
        e.preventDefault();
        reportToHoneypot('repeated_inspection', { method: 'Cmd+Option+U' });
        return false;
      }
    };

    // === RIGHT-CLICK BLOCKING (only on non-dashboard routes) ===
    const handleContextMenu = (e: MouseEvent) => {
      if (isDashboardRoute) return; // Allow right-click on dashboard
      e.preventDefault();
      reportToHoneypot('repeated_inspection', { method: 'right_click' });
      return false;
    };

    // === DEVTOOLS DETECTION (debounced) ===
    let devToolsOpen = false;
    const threshold = 160;
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          // Only report once per session for resize-based detection
          const resizeReportedKey = 'security_reported_devtools_resize';
          if (sessionStorage.getItem(resizeReportedKey) !== 'true') {
            sessionStorage.setItem(resizeReportedKey, 'true');
            reportToHoneypot('devtools_detected', { method: 'resize_detection' });
          }
        }
      } else {
        devToolsOpen = false;
      }
    };

    // Debounced resize handler to prevent performance issues
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(detectDevTools, 500);
    };

    // === CONSOLE CLEARING (every 60 seconds to reduce overhead) ===
    const clearConsoleInterval = setInterval(() => {
      if (import.meta.env.PROD && !isDashboardRoute) {
        console.clear();
      }
    }, 60000);

    // === DRAG PREVENTION ===
    const handleDragStart = (e: DragEvent) => {
      if (isDashboardRoute) return; // Allow drag on dashboard
      e.preventDefault();
      return false;
    };

    // === COPY PREVENTION (only on non-dashboard routes) ===
    const handleCopy = (e: ClipboardEvent) => {
      if (isDashboardRoute) return; // Allow copy on dashboard (users need to copy prompts)
      
      // Allow copying in input/textarea elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // === SELECT PREVENTION (only on non-dashboard routes) ===
    const handleSelectStart = (e: Event) => {
      if (isDashboardRoute) return; // Allow selection on dashboard
      
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('resize', handleResize);

    // Initial DevTools check (once, not on resize)
    detectDevTools();

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('resize', handleResize);
      clearInterval(clearConsoleInterval);
      clearTimeout(resizeTimeout);
    };
  }, [reportToHoneypot, checkBlockStatus, isDashboardRoute]);

  // Show blocked UI if user is blocked
  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            Your access has been temporarily restricted due to suspicious activity. 
            {blockedUntil && (
              <span className="block mt-2 text-sm text-gray-500">
                Try again after: {new Date(blockedUntil).toLocaleString()}
              </span>
            )}
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem('security_blocked');
              sessionStorage.removeItem('security_blocked_until');
              window.location.reload();
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SecurityProtection;