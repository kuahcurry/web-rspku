import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdInfo, MdWarning, MdClose } from 'react-icons/md';
import './Popup.css';

const Popup = ({ 
  message, 
  type = 'info', // info, success, error, warning
  duration = 3000,
  position = 'top-right', // top-right, top-left, top-center, bottom-right, bottom-left, bottom-center
  isVisible,
  onClose,
  closable = true,
  action,
  actionLabel,
  onActionClick
}) => {
  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleActionClick = () => {
    if (onActionClick) onActionClick();
    handleClose();
  };

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <MdCheckCircle size={24} />,
    error: <MdError size={24} />,
    warning: <MdWarning size={24} />,
    info: <MdInfo size={24} />
  };

  return (
    <div className={`popup popup-${type} popup-${position}`}>
      <div className="popup-icon">{icons[type]}</div>
      <div className="popup-content">
        <div className="popup-message">{message}</div>
        {(action || actionLabel) && (
          <button className="popup-action" onClick={handleActionClick}>
            {actionLabel || action}
          </button>
        )}
      </div>
      {closable && (
        <button className="popup-close" onClick={handleClose}>
          <MdClose size={20} />
        </button>
      )}
    </div>
  );
};

export default Popup;
