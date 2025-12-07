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
    setFormData({
      ...formData,
      [name]: value
    });

    // Handle cascade dropdown untuk wilayah
    if (name === 'province') {
      fetchRegencies(value);
      setFormData(prev => ({
        ...prev,
        province: value,
        regency: '',
        district: '',
        village: ''
      }));
    } else if (name === 'regency') {
      fetchDistricts(value);
      setFormData(prev => ({
        ...prev,
        regency: value,
        district: '',
        village: ''
      }));
    } else if (name === 'district') {
      fetchVillages(value);
      setFormData(prev => ({
        ...prev,
        district: value,
        village: ''
      }));
    }
  };

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Convert IDs to names before submitting
      const provinceName = provinces.find(p => p.value === formData.province)?.label || formData.province;
      const regencyName = regencies.find(r => r.value === formData.regency)?.label || formData.regency;
      const districtName = districts.find(d => d.value === formData.district)?.label || formData.district;
      const villageName = villages.find(v => v.value === formData.village)?.label || formData.village;

      const submitData = {
        ...formData,
        province: provinceName,
        regency: regencyName,
        district: districtName,
        village: villageName,
      };

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Registration successful
        alert('Registrasi berhasil! Silakan login.');
        navigate('/login');
      } else {
        // Handle validation errors
        if (data.errors) {
          setErrors(data.errors);
        } else {
          alert(data.message || 'Registrasi gagal. Silakan coba lagi.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
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
                  minLength={16}
                  maxLength={16}
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
                  pattern="[0-9]{10,13}"
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
              />
            </Form>

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
