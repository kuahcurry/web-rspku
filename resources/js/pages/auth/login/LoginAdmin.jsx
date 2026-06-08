import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/input/Input';
import Button from '../../../components/button/Button';
import Form from '../../../components/form/Form';
import { useRecaptchaToken } from '../../../hooks/useRecaptcha';
import styles from './Login.module.css';
import logoImg from '../../../assets/logo.webp';

function LoginAdmin() {
  const navigate = useNavigate();
  const getRecaptchaToken = useRecaptchaToken();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleAdminLogin = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken('admin_login');
      
      if (!recaptchaToken) {
        setErrors({ general: 'reCAPTCHA verification failed. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          recaptcha_token: recaptchaToken
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store JWT token and admin info with admin-specific keys
        localStorage.setItem('admin_access_token', data.data.access_token);
        localStorage.setItem('admin_token_type', data.data.token_type);
        localStorage.setItem('admin_user', JSON.stringify(data.data.user));
        
        const expiresAt = Date.now() + (data.data.expires_in * 1000);
        localStorage.setItem('admin_token_expires_at', expiresAt.toString());
        
        navigate('/dashboard');
      } else {
        setErrors({ 
          general: data.message || 'Email atau password salah' 
        });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' });
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
            <Form onSubmit={handleAdminLogin} className={styles['login-form']}>
              <div className={styles['login-header']}>
                <img src={logoImg} alt="Logo Muhammadiyah" className={styles['header-logo']} />
                <h1>Admin Login</h1>
                <h2>RS PKU Muhammadiyah Gombong</h2>
              </div>

              <Input
                key="email-input"
                label="Email"
                type="email"
                name="email"
                placeholder="Masukkan email"
                value={formData.email}
                onChange={handleChange}
                required
                error={errors.email?.[0]}
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
                minLength={6}
                error={errors.password?.[0]}
                disabled={isSubmitting}
                allowPasswordToggle
              />

              {errors.general && <div className={styles['login-error']}>{errors.general}</div>}

              <Button 
                type="submit" 
                variant="success" 
                size="large" 
                className={styles['login-button']}
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Masuk...' : 'Login'}
              </Button>
            </Form>

            <div className={styles['login-footer']}>
              <p>Petugas Rumah Sakit</p>
              <p>PKU Muhammadiyah Gombong</p>
            </div>
          </div>
        </div>

        {/* Right Side Image with Logo */}
        <div className={styles['right-panel']}>
          <div className={styles['building-image']}></div>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;
