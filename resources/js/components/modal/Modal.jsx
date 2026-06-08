import { useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer,
  variant = 'default', // default, primary, success, danger, warning
  size = 'medium',
  padding = 'normal', // compact, normal, spacious
  showCloseButton = true,
  glass = false,
  closeOnEscape = true,
  closeOnOverlay = true,
  className = ''
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

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

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-container modal-${size} modal-${padding} modal-${variant} ${glass ? 'modal-glass' : ''} ${className}`}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {showCloseButton && (
              <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                <MdClose size={24} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
