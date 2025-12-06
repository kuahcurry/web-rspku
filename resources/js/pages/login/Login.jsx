import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiLock } from 'react-icons/fi';
import Input from '../../components/input/Input';
import Button from '../../components/button/Button';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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

        // Redirect to dashboard
        navigate('/beranda');
      } else {
        // Handle errors
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Login gagal. Silakan coba lagi.' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Decorative Circles */}
        <div className="circle circle-2"></div>
        <div className="circle circle-1"></div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-content">
            <form onSubmit={handleLogin} className="login-form">
              <div className="login-header">
                <h1>Selamat Datang</h1>
              </div>
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="Masukkan Email"
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
                minLength={8}
                error={errors.password?.[0]}
                disabled={isSubmitting}
              />

              {errors.general && <p className="login-error">{errors.general}</p>}

              <div className="forgot-password">
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

              <div className="register-link">
                <a href="/register">Belum Punya Akun?</a>
              </div>
            </form>

            <div className="login-footer">
              <p>Petugas Rumah Sakit</p>
              <p>PKU Muhammadiyah Gombong</p>
            </div>
          </div>
        </div>

        {/* Right Side Image with Logo */}
        <div className="right-panel">
          <div className="logo-container">
            <img src="favicon.ico" alt="Logo Muhammadiyah" className="logo" />
          </div>
          <div className="building-image"></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
