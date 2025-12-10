import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/button/Button';
import Card from '../../components/card/Card';
import styles from './VerifyEmail.module.css';

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Get email from location state or localStorage
    const stateEmail = location.state?.email;
    const stateName = location.state?.name;
    const storedEmail = localStorage.getItem('pending_verification_email');

    if (stateEmail) {
      setEmail(stateEmail);
      setUserName(stateName || '');
      localStorage.setItem('pending_verification_email', stateEmail);
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // No email found, redirect to register
      navigate('/register');
    }
  }, [location, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value && newCode.every((digit) => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePaste(e);
    }
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData?.getData('text') || (await navigator.clipboard.readText());
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newCode = digits.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      // Auto-submit
      handleVerify(digits);
    }
  };

  const handleVerify = async (verificationCode = null) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Silakan masukkan kode 6 digit');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          code: codeToVerify
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear stored email
        localStorage.removeItem('pending_verification_email');
        
        // Show success message
        alert('Email berhasil diverifikasi! Silakan login.');
        
        // Redirect to login
        navigate('/login');
      } else {
        setError(data.message || 'Kode verifikasi tidak valid');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/resend-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Kode verifikasi baru telah dikirim ke email Anda');
        setTimeLeft(15 * 60); // Reset timer
        setCanResend(false);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Gagal mengirim kode baru');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles['verify-page']}>
      <div className={styles['verify-container']}>
        <div className={styles['verify-header']}>
          <div className={styles['icon']}>✉️</div>
          <h1>Verifikasi Email</h1>
          <p className={styles['subtitle']}>
            {userName && `Halo ${userName}! `}
            Kami telah mengirim kode verifikasi ke
          </p>
          <p className={styles['email']}>{email}</p>
        </div>

        <Card variant="primary" padding="large" className={styles['verify-card']}>
          <div className={styles['code-section']}>
            <label className={styles['label']}>Masukkan Kode Verifikasi</label>
            
            <div className={styles['code-inputs']}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={styles['code-input']}
                  disabled={isSubmitting}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div className={styles['error-message']}>
                {error}
              </div>
            )}

            <div className={styles['timer']}>
              {timeLeft > 0 ? (
                <>
                  ⏰ Kode akan kedaluwarsa dalam <strong>{formatTime(timeLeft)}</strong>
                </>
              ) : (
                <span className={styles['expired']}>⚠️ Kode telah kedaluwarsa</span>
              )}
            </div>
          </div>

          <div className={styles['actions']}>
            <Button
              variant="primary"
              size="large"
              onClick={() => handleVerify()}
              disabled={code.some((digit) => digit === '') || isSubmitting}
              className={styles['verify-button']}
            >
              {isSubmitting ? 'Memverifikasi...' : 'Verifikasi'}
            </Button>

            <div className={styles['resend-section']}>
              <p>Tidak menerima kode?</p>
              <Button
                variant="outline"
                size="small"
                onClick={handleResendCode}
                disabled={!canResend || isResending}
                className={styles['resend-button']}
              >
                {isResending ? 'Mengirim...' : 'Kirim Ulang Kode'}
              </Button>
            </div>
          </div>
        </Card>

        <div className={styles['footer']}>
          <p>Sudah punya akun terverifikasi?</p>
          <a href="/login" className={styles['login-link']}>Masuk di sini</a>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
