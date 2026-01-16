import { useEffect, ReactNode, useCallback } from 'react';

interface SecurityProtectionProps {
  children: ReactNode;
}

const HONEYPOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/security-honeypot`;

const SecurityProtection = ({ children }: SecurityProtectionProps) => {
  // Report suspicious activity to backend honeypot
  const reportToHoneypot = useCallback(async (eventType: string, metadata: Record<string, unknown> = {}) => {
    try {
      // Get local attempt count
      const storageKey = `security_attempts_${eventType}`;
      const currentAttempts = parseInt(sessionStorage.getItem(storageKey) || '0', 10) + 1;
      sessionStorage.setItem(storageKey, String(currentAttempts));

      // Only report to backend after 2 local attempts (reduce noise)
      if (currentAttempts < 2) return;

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

      // If blocked, show warning and optionally redirect
      if (data.blocked) {
        console.clear();
        console.log('%c🚫 ACCESS RESTRICTED', 'color: red; font-size: 30px; font-weight: bold;');
        console.log('%cYour activity has been logged and access is temporarily restricted.', 'font-size: 16px;');
        
        // Store blocked status
        sessionStorage.setItem('security_blocked', 'true');
        sessionStorage.setItem('security_blocked_until', data.blocked_until || '');
      }
    } catch {
      // Fail silently - don't break the app if honeypot is unavailable
    }
  }, []);

  // Check if user is blocked on mount
  const checkBlockStatus = useCallback(async () => {
    try {
      const response = await fetch(HONEYPOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_only: true }),
      });

      const data = await response.json();
      
      if (data.blocked) {
        sessionStorage.setItem('security_blocked', 'true');
        console.clear();
        console.log('%c🚫 ACCESS RESTRICTED', 'color: red; font-size: 30px; font-weight: bold;');
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

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
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

      // Block Cmd+Option+U (Mac View Source)
      if (e.metaKey && e.altKey && e.key === 'u') {
        e.preventDefault();
        reportToHoneypot('repeated_inspection', { method: 'Cmd+Option+U' });
        return false;
      }
    };

    // === RIGHT-CLICK BLOCKING ===
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportToHoneypot('repeated_inspection', { method: 'right_click' });
      return false;
    };

    // === DEVTOOLS DETECTION ===
    let devToolsOpen = false;
    const threshold = 160;
    let devToolsReported = false;

    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          // Report only once per session for resize-based detection
          if (!devToolsReported) {
            devToolsReported = true;
            reportToHoneypot('devtools_detected', { method: 'resize_detection' });
          }
          // Clear console when DevTools detected
          console.clear();
          console.log('%c⚠️ Security Notice', 'color: red; font-size: 24px; font-weight: bold;');
          console.log('%cThis browser feature is intended for developers.', 'font-size: 14px;');
          console.log('%cUnauthorized access attempts are logged and may result in access restriction.', 'font-size: 12px; color: orange;');
        }
      } else {
        devToolsOpen = false;
      }
    };

    // === CONSOLE CLEARING (every 30 seconds to reduce overhead) ===
    const clearConsoleInterval = setInterval(() => {
      if (import.meta.env.PROD) {
        console.clear();
      }
    }, 30000);

    // Debugger trap removed - was causing UI freezes

    // === DRAG PREVENTION ===
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // === COPY PREVENTION ===
    const handleCopy = (e: ClipboardEvent) => {
      // Allow copying in input/textarea elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // === SELECT PREVENTION ===
    const handleSelectStart = (e: Event) => {
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
    window.addEventListener('resize', detectDevTools);

    // Initial DevTools check
    detectDevTools();

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('resize', detectDevTools);
      clearInterval(clearConsoleInterval);
    };
  }, [reportToHoneypot, checkBlockStatus]);

  return <>{children}</>;
};

export default SecurityProtection;
