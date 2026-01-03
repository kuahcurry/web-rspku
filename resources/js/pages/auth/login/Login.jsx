import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { MdAdminPanelSettings, MdPerson } from 'react-icons/md';
import Input from '../../../components/input/Input';
import Button from '../../../components/button/Button';
import Form from '../../../components/form/Form';
import { useUser } from '../../../contexts/UserContext';
import styles from './Login.module.css';
import logoImg from '../../../assets/logo.webp';

// Dummy admin credentials
const DUMMY_ADMIN = {
  username: 'admin',
  password: 'admin123'
};

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useUser();
  
  // Initialize login mode from URL param or default to 'user'
  const [loginMode, setLoginMode] = useState(() => {
    return searchParams.get('mode') === 'admin' ? 'admin' : 'user';
  });
  
  const [formData, setFormData] = useState({
    nik: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminLogin = loginMode === 'admin';

  // Reset form when switching between admin/user login
  useEffect(() => {
    setFormData({
      nik: '',
      username: '',
      password: ''
    });
    setErrors({});
  }, [loginMode]);

  const handleModeSwitch = (mode) => {
    setLoginMode(mode);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for NIK input - only numeric and max 16 digits
    if (name === 'nik' && !isAdminLogin) {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      // Limit to 16 digits
      const limitedValue = numericValue.slice(0, 16);
      
      setFormData(prev => ({
        ...prev,
        [name]: limitedValue
      }));
    } else {
      // Allow all characters for username and password
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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

        // Refresh user context to load user data immediately
        await refreshUser();
        
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
            <Form onSubmit={isAdminLogin ? handleAdminLogin : handleLogin} className={styles['login-form']}>
              <div className={styles['login-header']}>
                <img src={logoImg} alt="Logo Muhammadiyah" className={styles['header-logo']} />
                <h1>Selamat Datang</h1>
                <h2>RS PKU Muhammadiyah Gombong</h2>
              </div>

              {/* Login Mode Tabs */}
              <div className={styles['login-tabs']}>
                <button
                  type="button"
                  className={`${styles['tab-btn']} ${!isAdminLogin ? styles['tab-active'] : ''}`}
                  onClick={() => handleModeSwitch('user')}
                >
                  <MdPerson size={18} />
                  <span>User</span>
                </button>
                <button
                  type="button"
                  className={`${styles['tab-btn']} ${isAdminLogin ? styles['tab-active'] : ''}`}
                  onClick={() => handleModeSwitch('admin')}
                >
                  <MdAdminPanelSettings size={18} />
                  <span>Admin</span>
                </button>
              </div>

              {isAdminLogin ? (
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
              ) : (
                <Input
                  key="nik-input"
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
              )}

              <Input
                label="Kata Sandi"
                type="password"
                name="password"
                placeholder="Masukkan Kata Sandi"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={isAdminLogin ? 6 : 8}
                error={errors.password?.[0]}
                disabled={isSubmitting}
                allowPasswordToggle
              />

              {errors.general && <div className={styles['login-error']}>{errors.general}</div>}

              {isAdminLogin && (
                <div className={styles['demo-info']}>
                  <strong>Demo:</strong> admin / admin123
                </div>
              )}

              {!isAdminLogin && (
                <div className={styles['forgot-password']}>
                  <Link to="/lupa-password">Lupa Password?</Link>
                </div>
              )}

              <Button 
                type="submit" 
                variant="success" 
                size="large" 
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Masuk...' : 'Login'}
              </Button>

              {!isAdminLogin && (
                <div className={styles['auth-links']}>
                  <div className={styles['auth-row']}>
                    <p>Belum punya akun?</p>
                    <Link to="/register" className={styles['auth-link']}>Buat di sini</Link>
                  </div>
                </div>
              )}
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

export default Login;
