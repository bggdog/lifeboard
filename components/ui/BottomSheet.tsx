'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
      <div
        ref={backdropRef}
        onClick={(e) => {
          if (e.target === backdropRef.current) {
            onClose();
          }
        }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center bottom-sheet-backdrop"
      >
        <div
          ref={sheetRef}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col safe-area-bottom bottom-sheet-content"
        >
        {/* Header */}
        {(title || true) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
            {title && (
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            )}
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 transition-colors touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scroll-container px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-neutral-200 px-6 py-4 flex-shrink-0 safe-area-bottom">
            {footer}
          </div>
        )}
      </div>

    </div>
  );
}
