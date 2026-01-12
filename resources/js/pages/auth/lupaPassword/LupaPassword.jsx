import { useState, useRef } from 'react';
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
  const [canResend, setCanResend] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

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

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...formData.code];
    newCode[index] = value.slice(-1);
    setFormData({ ...formData, code: newCode });
    setErrors({ ...errors, code: null });

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value && newCode.every((digit) => digit !== '')) {
      handleVerifyCode(null, newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCodePaste(e);
    }
  };

  const handleCodePaste = async (e) => {
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

  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    const isResend = step === 2;
    
    setErrors({});
    if (isResend) {
      setIsResending(true);
    } else {
      setIsSubmitting(true);
    }
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
        setMessage(isResend ? 'Kode baru telah dikirim ke email Anda' : 'Kode reset password telah dikirim ke email Anda');
        if (!isResend) setStep(2);
        setFormData({ ...formData, code: ['', '', '', '', '', ''] });
        setCanResend(false);
        setTimeout(() => setCanResend(true), 60000); // Can resend after 1 minute
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
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
      setIsResending(false);
    }
  };

  const handleVerifyCode = async (e, verificationCode = null) => {
    if (e) e.preventDefault();
    const codeToVerify = verificationCode || formData.code.join('');
    
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
          setErrors({ code: [data.message || 'Kode tidak valid'] });
        }
        setFormData({ ...formData, code: ['', '', '', '', '', ''] });
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setErrors({ general: 'Terjadi kesalahan koneksi. Silakan coba lagi.' });
      setFormData({ ...formData, code: ['', '', '', '', '', ''] });
      inputRefs.current[0]?.focus();
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
              Pastikan email aktif dan terdaftar serta dapat menerima pesan agar kode tidak terlewat.
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
              Periksa juga folder spam. Kode biasanya berlaku beberapa menit.
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
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    onPaste={handleCodePaste}
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
                  onClick={handleSendCode}
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
                onClick={() => setStep(1)}
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
