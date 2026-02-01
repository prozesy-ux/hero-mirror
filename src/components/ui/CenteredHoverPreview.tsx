import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface CenteredHoverPreviewProps {
  children: React.ReactNode;
  content: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
  disabled?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

const CenteredHoverPreview = ({
  children,
  content,
  openDelay = 400,
  closeDelay = 300, // Increased for smoother UX
  disabled = false,
  className,
  onOpenChange,
}: CenteredHoverPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const clearAllTimeouts = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleTriggerMouseEnter = useCallback(() => {
    if (disabled) return;
    clearAllTimeouts();
    openTimeoutRef.current = setTimeout(handleOpen, openDelay);
  }, [disabled, clearAllTimeouts, handleOpen, openDelay]);

  const handleTriggerMouseLeave = useCallback(() => {
    clearAllTimeouts();
    closeTimeoutRef.current = setTimeout(handleClose, closeDelay);
  }, [clearAllTimeouts, handleClose, closeDelay]);

  // Backdrop: start close timer when mouse enters backdrop area
  const handleBackdropMouseEnter = useCallback(() => {
    clearAllTimeouts();
    closeTimeoutRef.current = setTimeout(handleClose, closeDelay);
  }, [clearAllTimeouts, handleClose, closeDelay]);

  // Content: cancel close timer when mouse enters preview content
  const handleContentMouseEnter = useCallback(() => {
    clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Content: start close timer when mouse leaves preview content
  const handleContentMouseLeave = useCallback(() => {
    clearAllTimeouts();
    closeTimeoutRef.current = setTimeout(handleClose, closeDelay);
  }, [clearAllTimeouts, handleClose, closeDelay]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        contentRef.current && 
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClose]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
      >
        {children}
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9998]">
          {/* Backdrop overlay - starts close timer when mouse enters */}
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={handleClose}
            onMouseEnter={handleBackdropMouseEnter}
          />
          
          {/* Centered content - keeps preview open while mouse is here */}
          <div
            ref={contentRef}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[700px] max-w-[95vw] max-h-[90vh] overflow-auto",
              "z-[9999] bg-white rounded-lg border border-black/10 shadow-2xl",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              className
            )}
            onMouseEnter={handleContentMouseEnter}
            onMouseLeave={handleContentMouseLeave}
          >
            {content}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default CenteredHoverPreview;
