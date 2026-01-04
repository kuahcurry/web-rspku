import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/button/Button';
import Input from '../../../components/input/Input';
import Form from '../../../components/form/Form';
import { MdRefresh } from 'react-icons/md';
import styles from './LupaPassword.module.css';

function LupaSandi() {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const stepLabels = {
    1: 'Kirim kode reset',
    2: 'Verifikasi kode',
    3: 'Reset password'
  };
  const [formData, setFormData] = useState({
    email: '',
    code: ['', '', '', '', '', ''],
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  // Timer effect for code expiration
  useEffect(() => {
    if (step !== 2) return;
    
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
  }, [timeLeft, step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // Handle code input change
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...formData.code];
    newCode[index] = value.slice(-1);
    setFormData({ ...formData, code: newCode });
    setErrors({ ...errors, code: null });

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all digits are filled
    if (index === 5 && value && newCode.every((digit) => digit !== '')) {
      handleVerifyCode(null, newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.code[index] && index > 0) {
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
      setFormData({ ...formData, code: newCode });
      inputRefs.current[5]?.focus();
      handleVerifyCode(null, digits);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setErrors({});

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Kode reset baru telah dikirim ke email Anda');
        setTimeLeft(15 * 60);
        setCanResend(false);
        setFormData({ ...formData, code: ['', '', '', '', '', ''] });
        inputRefs.current[0]?.focus();
      } else {
        setErrors({ general: data.message || 'Gagal mengirim kode baru' });
      }
    } catch (error) {
      console.error('Resend error:', error);
      setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setIsResending(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Kode reset password telah dikirim ke email Anda');
        setTimeLeft(15 * 60); // Reset timer
        setCanResend(false);
        setStep(2);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Gagal mengirim kode reset' });
        }
      }
    } catch (error) {
      console.error('Send code error:', error);
      setErrors({ general: 'Terjadi kesalahan koneksi. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e, codeString = null) => {
    if (e) e.preventDefault();
    
    const codeToVerify = codeString || formData.code.join('');
    
    if (codeToVerify.length !== 6) {
      setErrors({ code: ['Silakan masukkan kode 6 digit'] });
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/verify-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          code: codeToVerify
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Kode valid. Silakan masukkan password baru');
        setStep(3);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Kode tidak valid' });
        }
        // Reset code inputs on error
        setFormData({ ...formData, code: ['', '', '', '', '', ''] });
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setErrors({ general: 'Terjadi kesalahan koneksi. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    setMessage('');

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: ['Password tidak cocok'] });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code.join(''),
          password: formData.password,
          password_confirmation: formData.password_confirmation
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Password berhasil direset! Silakan login dengan password baru.');
        window.location.href = '/masuk';
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Gagal reset password' });
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors({ general: 'Terjadi kesalahan koneksi. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles['forgot-page']}>
      <div className={styles.overlay}></div>
      <div className={styles.card}>
        <div className={styles['header-row']}>
          <div className={styles['top-bar']}>
            <p className={styles['eyebrow']}>Pemulihan Akun</p>
          </div>
          <h1>Lupa Password</h1>
          <p className={styles.subtitle}>
            {step === 1 && 'Masukkan email Anda untuk menerima kode reset password.'}
            {step === 2 && 'Masukkan kode verifikasi yang dikirim ke email Anda.'}
            {step === 3 && 'Buat password baru Anda.'}
          </p>
          <div className={styles.progress} aria-hidden="true">
            <div
              className={styles['progress-fill']}
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {message && (
          <div className={styles['success-message']}>
            {message}
          </div>
        )}

        {errors.general && (
          <div className={styles['error-message']}>
            {errors.general}
          </div>
        )}

        {step === 1 && (
          <Form onSubmit={handleSendCode} className={styles.form}>
            <p className={styles['helper-note']}>
              Pastikan email aktif dan dapat menerima pesan agar kode tidak terlewat.
            </p>
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Masukkan email Anda"
              value={formData.email}
              onChange={handleChange}
              required
              error={errors.email?.[0]}
              disabled={isSubmitting}
              iconPosition="left"
              variant="filled"
              size="large"
            />

            <Button
              type="submit"
              variant="success"
              size="large"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Kode Reset'}
            </Button>
          </Form>
        )}

        {step === 2 && (
          <Form onSubmit={(e) => handleVerifyCode(e)} className={styles.form}>
            <p className={styles['helper-note']}>
              Masukkan kode yang baru saja dikirim ke <strong>{formData.email}</strong>. Tempel langsung jika Anda menyalin kode.
            </p>
            
            <div className={styles['code-section']}>
              <label className={styles['label']}>Kode 6 Digit</label>
              
              <div className={styles['code-inputs']}>
                {formData.code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={styles['code-input']}
                    disabled={isSubmitting}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {errors.code && (
                <div className={styles['code-error']}>
                  {errors.code[0]}
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
                disabled={formData.code.some((digit) => digit === '') || isSubmitting}
              >
                {isSubmitting ? 'Memverifikasi...' : 'Verifikasi Kode'}
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

              <Button
                type="button"
                variant="outline"
                size="medium"
                fullWidth
                onClick={() => {
                  setStep(1);
                  setFormData({ ...formData, code: ['', '', '', '', '', ''] });
                }}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            </div>
          </Form>
        )}

        {step === 3 && (
          <Form onSubmit={handleResetPassword} className={styles.form}>
            <p className={styles['helper-note']}>
              Gunakan kombinasi huruf, angka, dan simbol untuk keamanan maksimal.
            </p>
            <Input
              label="Password Baru"
              type="password"
              name="password"
              placeholder="Masukkan password baru"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              error={errors.password?.[0]}
              disabled={isSubmitting}
              allowPasswordToggle
              variant="filled"
              size="large"
            />

            <Input
              label="Konfirmasi Password"
              type="password"
              name="password_confirmation"
              placeholder="Masukkan ulang password baru"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
              minLength={8}
              error={errors.password_confirmation?.[0]}
              disabled={isSubmitting}
              allowPasswordToggle
              variant="filled"
              size="large"
            />

            <Button
              type="submit"
              variant="success"
              size="large"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Mereset...' : 'Reset Password'}
            </Button>
          </Form>
        )}

        <div className={styles.footer}>
          <p>Ingat password Anda?</p>
          <Link to="/login" className={styles['login-link']}>Kembali ke Login</Link>
        </div>
      </div>
    </div>
  );
}

export default LupaSandi;
