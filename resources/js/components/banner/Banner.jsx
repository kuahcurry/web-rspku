import { useEffect } from 'react';
import styles from './Banner.module.css';

const Banner = ({ message, variant = 'info', onClose, autoRefresh = false }) => {
  useEffect(() => {
    if (autoRefresh && message) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoRefresh, message]);

  if (!message) return null;

  return (
    <div className={`${styles.banner} ${styles[variant]}`}>
      <div className={styles.content}>
        <span>{message}</span>
        {onClose && !autoRefresh && (
          <button onClick={onClose} className={styles.closeBtn}>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Banner;
