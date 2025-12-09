import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import Button from '../../components/button/Button';
import { useIndonesiaRegion } from '../../hooks/useIndonesiaRegion';
import styles from './Register.module.css';

function Register() {
  const navigate = useNavigate();
  const {
    provinces,
    regencies,
    districts,
    villages,
    loading,
    fetchRegencies,
    fetchDistricts,
    fetchVillages
  } = useIndonesiaRegion();

  const [formData, setFormData] = useState({
    nip: '',
    nik: '',
    name: '',
    email: '',
    phone: '',
    province: '',
    regency: '',
    district: '',
    village: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Only allow numbers for nik, nip, and phone with sensible length limits
    if (name === 'nik') {
      processedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (name === 'nip') {
      processedValue = value.replace(/\D/g, '').slice(0, 18);
    } else if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 15);
    }

    // Handle cascade dropdown untuk wilayah
    if (name === 'province') {
      fetchRegencies(processedValue);
      setFormData(prev => ({
        ...prev,
        province: processedValue,
        regency: '',
        district: '',
        village: ''
      }));
      return;
    } else if (name === 'regency') {
      fetchDistricts(processedValue);
      setFormData(prev => ({
        ...prev,
        regency: processedValue,
        district: '',
        village: ''
      }));
      return;
    } else if (name === 'district') {
      fetchVillages(processedValue);
      setFormData(prev => ({
        ...prev,
        district: processedValue,
        village: ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translateMessage = (message) => {
    if (!message) return '';
    const normalized = message.toLowerCase();

    const map = [
      { key: 'has already been taken', text: 'Sudah terdaftar.' },
      { key: 'must be a valid email address', text: 'Format email tidak valid.' },
      { key: 'must not be greater than 15 characters', text: 'Tidak boleh lebih dari 15 karakter.' },
      { key: 'must be at least 8 characters', text: 'Minimal 8 karakter.' },
      { key: 'must match password', text: 'Konfirmasi kata sandi tidak sesuai.' },
      { key: 'confirm password field must match password', text: 'Konfirmasi kata sandi tidak sesuai.' },
      { key: 'password confirmation', text: 'Konfirmasi kata sandi tidak sesuai.' },
      { key: 'is required', text: 'Wajib diisi.' },
    ];

    const found = map.find(({ key }) => normalized.includes(key));

    // Special case for "has already been taken" to keep field context
    if (found && found.key === 'has already been taken') {
      if (normalized.includes('nip')) return 'NIP sudah terdaftar.';
      if (normalized.includes('nik')) return 'NIK sudah terdaftar.';
      if (normalized.includes('email')) return 'Email sudah terdaftar.';
      return 'Data sudah terdaftar.';
    }

    if (found) return found.text;

    return message;
  };

  const translateErrors = (errs = {}) => {
    const translated = {};
    Object.entries(errs).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        translated[field] = messages.map(translateMessage);
      } else {
        translated[field] = translateMessage(messages);
      }
    });
    return translated;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Submit IDs directly (no conversion needed)
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Registration successful
        navigate('/login');
      } else {
        // Handle validation errors
        if (data.errors) {
          setErrors(translateErrors(data.errors));
        } else {
          const message = translateMessage(data.message) || 'Registrasi gagal. Silakan coba lagi.';
          setErrors({ general: message });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = 'Terjadi kesalahan. Silakan coba lagi.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles['register-page']}>
      <div className={styles['register-container']}>
        {/* Left Side Image with Logo */}
        <div className={styles['left-panel']}>
          <div className={styles['logo-container']}>
            <img src="favicon.ico" alt="Logo Muhammadiyah" className={styles.logo} />
          </div>
          <div className={styles['building-image']}></div>
        </div>

        {/* Decorative Circles */}
        <div className={`${styles.circle} ${styles['circle-2']}`}></div>
        <div className={`${styles.circle} ${styles['circle-1']}`}></div>
        <div className={`${styles.circle} ${styles['circle-3']}`}></div>

        {/* Register Card */}
        <div className={styles['register-card']}>
          <div className={styles['register-content']}>
            <div className={styles['register-header']}>
              <h1>Daftar Akun</h1>
            </div>
            
            <Form onSubmit={handleRegister} className={styles['register-form']}>
              <Form.Row columns={2}>
                <Input
                label="NIK"
                type="text"
                name="nik"
                placeholder="Masukkan NIK"
                value={formData.nik}
                  onChange={handleChange}
                required
                maxLength={16}
                minLength={16}
                error={errors.nik?.[0]}
                disabled={isSubmitting}
              />

                <Input
                label="NIP"
                type="text"
                name="nip"
                placeholder="Masukkan NIP"
                value={formData.nip}
                onChange={handleChange}
                required
                maxLength={18}
                error={errors.nip?.[0]}
                disabled={isSubmitting}
              />
              </Form.Row>

              <Input
                label="Nama Lengkap"
                type="text"
                name="name"
                placeholder="Masukkan Nama Lengkap"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={3}
                error={errors.name?.[0]}
                disabled={isSubmitting}
              />

              <Form.Row columns={2}>
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
                  label="Nomor Telepon"
                  type="tel"
                  name="phone"
                  placeholder="Masukkan Nomor Telepon"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10,15}"
                  maxLength={15}
                  required
                  error={errors.phone?.[0]}
                  disabled={isSubmitting}
                />
              </Form.Row>
              
              <Form.Row columns={2}>
                <Input
                  type="select"
                  label="Provinsi"
                  name="province"
                  placeholder="Pilih Provinsi"
                  options={provinces}
                  value={formData.province}
                  onChange={handleChange}
                  required
                  disabled={loading || provinces.length === 0 || isSubmitting}
                  error={errors.province?.[0]}
                />

                <Input
                  type="select"
                  label="Kota/Kabupaten"
                  name="regency"
                  placeholder="Pilih Kota/Kabupaten"
                  options={regencies}
                  value={formData.regency}
                  onChange={handleChange}
                  required
                  disabled={!formData.province || regencies.length === 0 || isSubmitting}
                  error={errors.regency?.[0]}
                />
              </Form.Row>

              <Form.Row columns={2}>
                <Input
                  type="select"
                  label="Kecamatan"
                  name="district"
                  placeholder="Pilih Kecamatan"
                  options={districts}
                  value={formData.district}
                  onChange={handleChange}
                  required
                  disabled={!formData.regency || districts.length === 0 || isSubmitting}
                  error={errors.district?.[0]}
                />

                <Input
                  type="select"
                  label="Desa/Kelurahan"
                  name="village"
                  placeholder="Pilih Desa/Kelurahan"
                  options={villages}
                  value={formData.village}
                  onChange={handleChange}
                  required
                  disabled={!formData.district || villages.length === 0 || isSubmitting}
                  error={errors.village?.[0]}
                />
              </Form.Row>

              <Input
                label="Alamat Detail"
                type="textarea"
                name="address"
                placeholder="Masukkan Alamat Detail (jalan, nomor rumah, RT/RW)"
                value={formData.address}
                onChange={handleChange}
                variant='filled'
                required
                error={errors.address?.[0]}
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

              <Input
                label="Konfirmasi Kata Sandi"
                type="password"
                name="confirmPassword"
                placeholder="Masukkan Kata Sandi yang Sama"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                error={errors.confirmPassword?.[0]}
                disabled={isSubmitting}
                allowPasswordToggle
              />
            </Form>

            {errors.general && (
              <div className={styles['register-error']}>
                {errors.general}
              </div>
            )}

            <Button 
              type="submit" 
              variant="success" 
              size="large" 
              fullWidth
              disabled={isSubmitting}
              onClick={handleRegister}
            >
                {isSubmitting ? 'Mendaftar...' : 'Daftar'}
            </Button>

            <div className={styles['login-link']}>
              <a href="/login">Sudah Punya Akun?</a>
            </div>

            <div className={styles['register-footer']}>
              <p>Petugas Rumah Sakit</p>
              <p>PKU Muhammadiyah Gombong</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
