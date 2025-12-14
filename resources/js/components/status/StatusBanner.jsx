import './StatusBanner.css';

const StatusBanner = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  return (
    <div className={`status-banner status-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button
          className="status-banner__close"
          onClick={onClose}
          aria-label="Tutup pesan"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default StatusBanner;
