import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '../../components/button/Button';
import Form from '../../components/form/Form';
import { MdRefresh } from 'react-icons/md';
import StatusBanner from '../../components/status/StatusBanner';
import styles from './VerifyEmail.module.css';

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [banner, setBanner] = useState({ message: '', type: 'info' });
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
      navigate('/register');
    }
  }, [location, navigate]);

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value && newCode.every((digit) => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
        localStorage.removeItem('pending_verification_email');
        setBanner({ message: 'Email berhasil diverifikasi! Silakan login.', type: 'success' });
        setTimeout(() => navigate('/login'), 700);
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
        setBanner({ message: 'Kode verifikasi baru telah dikirim ke email Anda', type: 'success' });
        setTimeLeft(15 * 60);
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
      <div className={styles.bannerArea}>
        <StatusBanner
          message={banner.message}
          type={banner.type}
          onClose={() => setBanner({ message: '', type: 'info' })}
        />
      </div>
      <div className={styles.overlay}></div>
      <div className={styles.card}>
        <div className={styles['header-row']}>
          <div className={styles['top-bar']}>
            <p className={styles['eyebrow']}>Verifikasi Email</p>
          </div>
          <h1>Masukkan Kode Verifikasi</h1>
          <p className={styles['subtitle']}>
            {userName && `Halo ${userName}! `}
            Kami telah mengirim 6 digit kode ke <strong>{email}</strong>
          </p>
        </div>

        <Form
          className={styles.form}
          onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
        >
          <p className={styles['helper-note']}>
            Masukkan kode yang baru saja dikirim. Tempel langsung jika Anda menyalin kode.
          </p>
          <div className={styles['code-section']}>
            <label className={styles['label']}>Kode 6 Digit</label>
            
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
                  Kode akan kedaluwarsa dalam <strong>{formatTime(timeLeft)}</strong>
                </>
              ) : (
                <span className={styles['expired']}>Kode telah kedaluwarsa</span>
              )}
            </div>
          </div>

          <div className={styles['actions']}>
            <Button
              type="submit"
              variant="success"
              size="large"
              fullWidth
              disabled={code.some((digit) => digit === '') || isSubmitting}
            >
              {isSubmitting ? 'Memverifikasi...' : 'Verifikasi'}
            </Button>

            <div className={styles['resend-section']}>
              <span className={styles['resend-text']}>Tidak menerima kode?</span>
              <Button
                type="button"
                variant="inverse"
                size="small"
                onClick={handleResendCode}
                disabled={!canResend || isResending}
                icon={<MdRefresh />}
              >
                {isResending ? 'Mengirim...' : 'Kirim Ulang'}
              </Button>
            </div>
          </div>
        </Form>

        <div className={styles['footer']}>
          <div className={styles['footer-row']}>
            <p>Belum punya akun?</p>
            <Link to="/register" className={styles['login-link']}>Buat di sini</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
