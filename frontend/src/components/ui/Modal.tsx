import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'parchment' | 'wood' | 'jade';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  variant = 'parchment'
}) => {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jade-dark/80 backdrop-blur-sm animate-fadeIn">
      
      {/* Click Outside to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Content */}
      <Card 
        variant={variant === 'jade' ? 'jade' : variant === 'wood' ? 'wood' : 'parchment'} 
        className="w-full max-w-lg border-2 border-gold relative shadow-2xl z-10"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
          <h2 className="text-xl font-extrabold tracking-widest text-gold text-gold-glow uppercase font-martial">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gold hover:bg-gold/10 hover:text-gold-light transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </Card>
    </div>
  );
};
