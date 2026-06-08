import React from 'react';
import styles from './PasswordRequirements.module.css';

const PasswordRequirements = ({ password, show = true }) => {
  if (!show) return null;

  const requirements = [
    { 
      label: 'Minimal 8 karakter', 
      met: password.length >= 8 
    },
    { 
      label: 'Mengandung huruf besar (A-Z)', 
      met: /[A-Z]/.test(password) 
    },
    { 
      label: 'Mengandung huruf kecil (a-z)', 
      met: /[a-z]/.test(password) 
    },
    { 
      label: 'Mengandung angka (0-9)', 
      met: /[0-9]/.test(password) 
    },
    { 
      label: 'Mengandung karakter khusus (!@#$%^&*)', 
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password) 
    }
  ];

  return (
    <div className={styles.requirements}>
      <p className={styles.title}>Password harus memenuhi:</p>
      <ul className={styles.list}>
        {requirements.map((req, index) => (
          <li 
            key={index} 
            className={`${styles.requirement} ${req.met ? styles.met : ''}`}
          >
            <span className={styles.icon}>{req.met ? '✓' : '○'}</span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirements;
