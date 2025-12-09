import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiLock } from 'react-icons/fi';
import Input from '../../components/input/Input';
import Button from '../../components/button/Button';
import Form from '../../components/form/Form';
import styles from './Login.module.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nik: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for NIK input - only numeric and max 16 digits
    if (name === 'nik') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      // Limit to 16 digits
      const limitedValue = numericValue.slice(0, 16);
      
      setFormData({
        ...formData,
        [name]: limitedValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleLogin = async (e) => {
    // prevent default handled by Form, but keep guard in case called directly
    if (e?.preventDefault) e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store JWT token and user data in localStorage
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('token_type', data.data.token_type);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('token_expires_at', Date.now() + (data.data.expires_in * 1000));

        navigate('/beranda');
      } else {
        // Handle errors
        if (data.errors) {
          setErrors(data.errors);
        } else {
          const errorMessage = data.message || 'Login gagal. Silakan coba lagi.';
          setErrors({ general: errorMessage });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Terjadi kesalahan koneksi. Silakan coba lagi.';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles['login-page']}>
      <div className={styles['login-container']}>
        {/* Decorative Circles */}
        <div className={`${styles.circle} ${styles['circle-2']}`}></div>
        <div className={`${styles.circle} ${styles['circle-1']}`}></div>

        {/* Login Card */}
        <div className={styles['login-card']}>
          <div className={styles['login-content']}>
            <Form onSubmit={handleLogin} className={styles['login-form']}>
              <div className={styles['login-header']}>
                <h1>Selamat Datang</h1>
              </div>
              <Input
                label="NIK"
                type="text"
                name="nik"
                placeholder="Masukkan NIK (16 digit)"
                value={formData.nik}
                onChange={handleChange}
                required
                pattern="[0-9]{16}"
                maxLength={16}
                error={errors.nik?.[0]}
                disabled={isSubmitting}
              />

              <Input
                label="Kata Sandi"
                type="password"
                name="password"
                placeholder="Masukkan Kata Sandi"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                error={errors.password?.[0]}
                disabled={isSubmitting}
                allowPasswordToggle
              />

              {errors.general && <div className={styles['login-error']}>{errors.general}</div>}

              <div className={styles['forgot-password']}>
                <a href="/forgot-password">Lupa Password?</a>
              </div>

              <Button 
                type="submit" 
                variant="success" 
                size="large" 
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Masuk...' : 'Login'}
              </Button>

              <div className={styles['register-link']}>
                <a href="/register">Belum Punya Akun?</a>
              </div>
            </Form>

            <div className={styles['login-footer']}>
              <p>Petugas Rumah Sakit</p>
              <p>PKU Muhammadiyah Gombong</p>
            </div>
          </div>
        </div>

        {/* Right Side Image with Logo */}
        <div className={styles['right-panel']}>
          <div className={styles['logo-container']}>
            <img src="favicon.ico" alt="Logo Muhammadiyah" className={styles.logo} />
          </div>
          <div className={styles['building-image']}></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
