import { useEffect, ReactNode } from 'react';

interface SecurityProtectionProps {
  children: ReactNode;
}

const SecurityProtection = ({ children }: SecurityProtectionProps) => {
  useEffect(() => {
    // === KEYBOARD SHORTCUT BLOCKING ===
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
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
        return false;
      }

      // Block Cmd+Option+I (Mac DevTools)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }

      // Block Cmd+Option+J (Mac Console)
      if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault();
        return false;
      }

      // Block Cmd+Option+U (Mac View Source)
      if (e.metaKey && e.altKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
    };

    // === RIGHT-CLICK BLOCKING ===
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // === DEVTOOLS DETECTION ===
    let devToolsOpen = false;
    const threshold = 160;

    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          // Clear console when DevTools detected
          console.clear();
          console.log('%c⚠️ Security Notice', 'color: red; font-size: 24px; font-weight: bold;');
          console.log('%cThis browser feature is intended for developers.', 'font-size: 14px;');
        }
      } else {
        devToolsOpen = false;
      }
    };

    // === CONSOLE CLEARING ===
    const clearConsoleInterval = setInterval(() => {
      if (process.env.NODE_ENV === 'production') {
        console.clear();
      }
    }, 5000);

    // === DEBUGGER TRAP (Production only) ===
    const debuggerTrap = () => {
      if (process.env.NODE_ENV === 'production') {
        // This makes stepping through code difficult
        (function() { debugger; })();
      }
    };

    const debuggerInterval = setInterval(() => {
      if (process.env.NODE_ENV === 'production') {
        debuggerTrap();
      }
    }, 1000);

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
      clearInterval(debuggerInterval);
    };
  }, []);

  return <>{children}</>;
};

export default SecurityProtection;
