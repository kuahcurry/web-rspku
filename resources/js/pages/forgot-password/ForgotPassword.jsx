import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/button/Button';
import Input from '../../components/input/Input';
import Form from '../../components/form/Form';
import StatusBanner from '../../components/status/StatusBanner';
import styles from './ForgotPassword.module.css';

function ForgotPassword() {
  const [banner, setBanner] = useState({ message: '', type: 'info' });
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const stepLabels = {
    1: 'Kirim kode reset',
    2: 'Verifikasi kode',
    3: 'Reset password'
  };
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleVerifyCode = async (e) => {
    e.preventDefault();
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
          code: formData.code
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
          code: formData.code,
          password: formData.password,
          password_confirmation: formData.password_confirmation
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBanner({ message: 'Password berhasil direset! Silakan login dengan password baru.', type: 'success' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 700);
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
          <Form onSubmit={handleVerifyCode} className={styles.form}>
            <p className={styles['helper-note']}>
              Periksa juga folder spam. Kode biasanya berlaku beberapa menit.
            </p>
            <Input
              label="Kode Verifikasi"
              type="text"
              name="code"
              placeholder="Masukkan kode 6 digit"
              value={formData.code}
              onChange={handleChange}
              required
              maxLength={6}
              error={errors.code?.[0]}
              disabled={isSubmitting}
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
              {isSubmitting ? 'Memverifikasi...' : 'Verifikasi Kode'}
            </Button>

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

export default ForgotPassword;
