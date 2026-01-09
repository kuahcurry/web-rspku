import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdPerson } from 'react-icons/md';
import Input from '../../../components/input/Input';
import Button from '../../../components/button/Button';
import Form from '../../../components/form/Form';
import styles from './Login.module.css';
import logoImg from '../../../assets/logo.webp';

// Dummy admin credentials
const DUMMY_ADMIN = {
  username: 'admin',
  password: 'admin123'
};

function LoginAdmin() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
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

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      if (formData.username === DUMMY_ADMIN.username && formData.password === DUMMY_ADMIN.password) {
        localStorage.setItem('admin_token', 'dummy_admin_token_' + Date.now());
        localStorage.setItem('admin_user', JSON.stringify({
          id: 1,
          username: 'admin',
          name: 'Administrator',
          role: 'admin'
        }));
        navigate('/admin/dashboard');
      } else {
        setErrors({ 
          general: 'Username atau password salah. Gunakan: admin / admin123' 
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
                key="username-input"
                label="Username"
                type="text"
                name="username"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={handleChange}
                required
                error={errors.username?.[0]}
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

              <div className={styles['demo-info']}>
                <strong>Demo:</strong> admin / admin123
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

              <div className={styles['auth-links']}>
                <div className={styles['auth-row']}>
                  <Link to="/login" className={styles['switch-login']}>
                    <MdPerson size={16} />
                    <span>Login sebagai User</span>
                  </Link>
                </div>
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
          <div className={styles['building-image']}></div>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;
