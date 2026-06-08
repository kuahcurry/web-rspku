import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '../../../components/button/Button';
import Form from '../../../components/form/Form';
import { MdRefresh, MdWarning, MdCheckCircle } from 'react-icons/md';
import styles from './VerifikasiEmail.module.css';

const OTP_VALIDITY_SECONDS    = 15 * 60; // 15 minutes — must match backend
const RESEND_COOLDOWN_SECONDS = 3 * 60;  // 3 minutes before resend is available
const MAX_RESENDS             = 3;

function VerifikasiEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const [code, setCode]         = useState(['', '', '', '', '', '']);
  const [email, setEmail]       = useState('');
  const [userName, setUserName] = useState('');

  // OTP expiry countdown (15 min)
  const [otpTimeLeft, setOtpTimeLeft] = useState(OTP_VALIDITY_SECONDS);

  // Resend cooldown countdown (3 min) — counts down to 0, then button unlocks
  const [resendTimeLeft, setResendTimeLeft] = useState(RESEND_COOLDOWN_SECONDS);

  const [resendCount, setResendCount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending]   = useState(false);
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');

  const inputRefs = useRef([]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isOtpExpired = otpTimeLeft <= 0;
  const canResend    = resendTimeLeft <= 0 && !isOtpExpired && resendCount < MAX_RESENDS;
  const maxResendHit = resendCount >= MAX_RESENDS;

  // ─── Bootstrap: read email from navigation state or localStorage ────────────

  useEffect(() => {
    const stateEmail  = location.state?.email;
    const stateName   = location.state?.name;
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

  // ─── OTP expiry countdown ───────────────────────────────────────────────────

  useEffect(() => {
    if (otpTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpTimeLeft]);

  // ─── Resend cooldown countdown ──────────────────────────────────────────────

  useEffect(() => {
    if (resendTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setResendTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimeLeft]);

  // ─── Input handlers ─────────────────────────────────────────────────────────

  const handleInputChange = (index, value) => {
    if (!/^\d$/.test(value) && value !== '') return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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

  // ─── Verify OTP ─────────────────────────────────────────────────────────────

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
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, verification_code: codeToVerify }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.removeItem('pending_verification_email');
        navigate('/login');
      } else {
        setError(data.message || 'Kode verifikasi tidak valid');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Resend OTP ─────────────────────────────────────────────────────────────

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/resend-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.max_resend_reached) {
        // Backend already deleted the pending record
        localStorage.removeItem('pending_verification_email');
        setError('Batas pengiriman ulang tercapai. Anda akan diarahkan ke halaman pendaftaran...');
        setTimeout(() => navigate('/register'), 3000);
        return;
      }

      if (response.ok && data.success) {
        const newCount = data.resend_count ?? resendCount + 1;
        setResendCount(newCount);
        setOtpTimeLeft(OTP_VALIDITY_SECONDS);      // reset OTP timer to 15 min
        setResendTimeLeft(RESEND_COOLDOWN_SECONDS); // reset resend cooldown to 3 min
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setSuccessMsg(`Kode baru telah dikirim! Sisa pengiriman ulang: ${MAX_RESENDS - newCount}x`);
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setError(data.message || 'Gagal mengirim kode baru. Silakan coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsResending(false);
    }
  };

  // ─── Wrong email ────────────────────────────────────────────────────────────

  const handleWrongEmail = async () => {
    try {
      if (email) {
        await fetch('/api/delete-pending-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      }
    } catch {
      // ignore — still redirect
    }
    localStorage.removeItem('pending_verification_email');
    navigate('/register', { state: { fromVerification: true } });
  };

  // ─── Resend button label ────────────────────────────────────────────────────

  const resendLabel = () => {
    if (isResending)       return 'Mengirim...';
    if (maxResendHit)      return 'Batas tercapai';
    if (isOtpExpired)      return 'Kode expired';
    if (resendTimeLeft > 0) return `Kirim Ulang (${formatTime(resendTimeLeft)})`;
    return 'Kirim Ulang';
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles['verify-page']}>
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
                  className={`${styles['code-input']}${isOtpExpired ? ` ${styles['code-input--expired']}` : ''}`}
                  disabled={isSubmitting || isOtpExpired}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Error / Success messages */}
            {error && (
              <div className={styles['error-message']} style={{ display: 'flex', alignItems: 'center' }}>
                <MdWarning style={{ marginRight: 6, flexShrink: 0 }} />
                {error}
              </div>
            )}
            {successMsg && (
              <div className={styles['success-message']} style={{ display: 'flex', alignItems: 'center' }}>
                <MdCheckCircle style={{ marginRight: 6, flexShrink: 0 }} />
                {successMsg}
              </div>
            )}

            {/* OTP expiry timer */}
            <div className={styles['timer']}>
              {!isOtpExpired ? (
                <>
                  Kode berlaku selama{' '}
                  <strong className={otpTimeLeft < 60 ? styles['timer--urgent'] : ''}>
                    {formatTime(otpTimeLeft)}
                  </strong>
                </>
              ) : (
                <span className={styles['expired']}>
                  Kode telah kedaluwarsa. Klik <strong>Kirim Ulang</strong> untuk mendapatkan kode baru.
                </span>
              )}
            </div>

            {/* Resend cooldown hint (only shown while OTP still valid and cooldown active) */}
            {!isOtpExpired && resendTimeLeft > 0 && (
              <div className={styles['resend-hint']}>
                Kirim ulang tersedia dalam <strong>{formatTime(resendTimeLeft)}</strong>
              </div>
            )}

            {/* Resend usage counter */}
            {resendCount > 0 && (
              <div className={styles['resend-counter']}>
                Pengiriman ulang: {resendCount}/{MAX_RESENDS}
              </div>
            )}
          </div>

          <div className={styles['actions']}>
            <Button
              type="submit"
              variant="success"
              size="large"
              fullWidth
              disabled={code.some((d) => d === '') || isSubmitting || isOtpExpired}
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
                {resendLabel()}
              </Button>
            </div>
          </div>
        </Form>

        <div className={styles['footer']}>
          <div className={styles['footer-row']}>
            <p>Belum punya akun?</p>
            <Link to="/register" className={styles['login-link']}>Buat di sini</Link>
          </div>
          <div className={styles['footer-row']}>
            <p>E-mail yang anda kirim salah?</p>
            <button
              type="button"
              style={{
                color: 'var(--secondary-light)',
                fontWeight: 700,
                fontSize: 'inherit',
                textDecoration: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'opacity 0.2s ease, text-decoration 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9';
                e.target.style.textDecoration = 'underline';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
                e.target.style.textDecoration = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
              onClick={handleWrongEmail}
            >
              Klik di sini untuk mengubah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifikasiEmail;
