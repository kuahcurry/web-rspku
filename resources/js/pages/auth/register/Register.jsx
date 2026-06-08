import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import { useIndonesiaRegion } from '../../../hooks/useIndonesiaRegion';
import { useRecaptchaToken } from '../../../hooks/useRecaptcha';
import styles from './Register.module.css';
import logoImg from '../../../assets/logo.webp';
import { MdInfo } from 'react-icons/md';


function Daftar() {
  const navigate = useNavigate();
  const getRecaptchaToken = useRecaptchaToken();
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

  // Prefill from localStorage if redirected from verification correction
  let initialFormData = {
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
  };
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  try {
    const saved = localStorage.getItem('pending_registration_data');
    if (saved) {
      initialFormData = { ...initialFormData, ...JSON.parse(saved) };
      localStorage.removeItem('pending_registration_data');
      setHasLoadedFromStorage(true);
    }
  } catch {}
  const [formData, setFormData] = useState(initialFormData);

  // Trigger fetches for prefilled region data
  useEffect(() => {
    if (hasLoadedFromStorage && formData.province && regencies.length === 0) {
      fetchRegencies(formData.province);
    }
  }, [hasLoadedFromStorage, formData.province, regencies.length, fetchRegencies]);

  useEffect(() => {
    if (hasLoadedFromStorage && formData.regency && districts.length === 0 && regencies.length > 0) {
      fetchDistricts(formData.regency);
    }
  }, [hasLoadedFromStorage, formData.regency, districts.length, regencies.length, fetchDistricts]);

  useEffect(() => {
    if (hasLoadedFromStorage && formData.district && villages.length === 0 && districts.length > 0) {
      fetchVillages(formData.district);
    }
  }, [hasLoadedFromStorage, formData.district, villages.length, districts.length, fetchVillages]);

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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

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

  const getFieldDisplayName = (fieldName) => {
    const fieldMap = {
      'nik': 'NIK',
      'nip': 'NIP',
      'name': 'Nama Lengkap',
      'email': 'Email',
      'phone': 'Nomor Telepon',
      'province': 'Provinsi',
      'regency': 'Kota/Kabupaten',
      'district': 'Kecamatan',
      'village': 'Desa/Kelurahan',
      'address': 'Alamat Detail',
      'password': 'Kata Sandi',
      'confirmPassword': 'Konfirmasi Kata Sandi'
    };
    return fieldMap[fieldName] || fieldName;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation for NIK and NIP
    const newErrors = {};
    if (!formData.nik || formData.nik.length !== 16) {
      newErrors.nik = ["NIK harus terdiri dari 16 digit."];
    }
    if (!formData.nip || formData.nip.length < 8 || formData.nip.length > 18) {
      newErrors.nip = ["NIP harus terdiri dari 8 sampai 18 digit."];
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorFields = Object.keys(newErrors).map(getFieldDisplayName);
      setValidationErrors(errorFields);
      setShowValidationModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken('register');
      if (!recaptchaToken) {
        setErrors({ general: 'reCAPTCHA verification failed. Please try again.' });
        setIsSubmitting(false);
        return;
      }
      // Submit IDs directly (no conversion needed)
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptcha_token: recaptchaToken
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Registration successful, navigate to verification page
        if (data.data?.requires_verification) {
          navigate('/verifikasi-email', {
            state: {
              email: data.data.email,
              name: data.data.name,
              registrationData: formData // Pass all registration data for correction
            }
          });
        } else {
          // Fallback to login if no verification required
          navigate('/login');
        }
      } else {
        // Handle validation errors
        if (data.errors) {
          const translatedErrors = translateErrors(data.errors);
          setErrors(translatedErrors);
          const errorFields = Object.keys(data.errors).map(getFieldDisplayName);
          setValidationErrors(errorFields);
          setShowValidationModal(true);
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
          <div className={styles['building-image']}></div>
        </div>

        {/* Decorative Circles */}
        <div className={`${styles.circle} ${styles['circle-2']}`}></div>
        <div className={`${styles.circle} ${styles['circle-1']}`}></div>
        <div className={`${styles.circle} ${styles['circle-3']}`}></div>

        {/* Register Card */}
        <div className={styles['register-card']}>
          <div className={styles['register-content']}>
            {/* Logo */}
            <div className={styles['header-logo-container']}>
              <img src={logoImg} alt="Logo Muhammadiyah" className={styles['header-logo']} />
            </div>
            
            <div className={styles['register-header']}>
              <h1>Daftar Akun</h1>
              <button 
                type="button" 
                className={styles['info-button']} 
                onClick={() => setShowInfoModal(true)}
                aria-label="Informasi Data yang Diperlukan"
              >
                <MdInfo size={24} />
                <span>Data yang Diperlukan</span>
              </button>
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
                pattern="[0-9]{16}"
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
                minLength={8}
                pattern="[0-9]{8,18}"
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
            </Form>

            <div className={styles['auth-links']}>
              <div className={styles['auth-row']}>
                <p>Sudah punya akun?</p>
                <Link to="/login" className={styles['auth-link']}>Masuk di sini</Link>
              </div>
            </div>

            <div className={styles['register-footer']}>
              <p>Petugas Rumah Sakit</p>
              <p>PKU Muhammadiyah Gombong</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error Modal */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Perhatian!"
        size="medium"
        variant="warning"
      >
        <div className={styles['validation-modal-content']}>
          <p className={styles['validation-intro']}>Data di bawah ini perlu diisi dan disesuaikan sesuai format:</p>
          <ul className={styles['validation-list']}>
            {validationErrors.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
          <p className={styles['validation-note']}>Silakan periksa kembali formulir dan pastikan semua data terisi dengan benar.</p>
        </div>
      </Modal>

      {/* Info Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Data yang Diperlukan untuk Pendaftaran"
        size="large"
        variant="primary"
      >
        <div className={styles['modal-content']}>
          <p className={styles['modal-intro']}>Silakan siapkan data-data berikut untuk melakukan pendaftaran:</p>
          
          <div className={styles['data-section']}>
            <h3>1. Data Identitas</h3>
            <ul>
              <li>
                <strong>NIK (Nomor Induk Kependudukan)</strong>
                <p>16 digit angka sesuai KTP Anda</p>
              </li>
              <li>
                <strong>NIP (Nomor Induk Pegawai)</strong>
                <p>8-18 digit angka NIP pegawai rumah sakit</p>
              </li>
              <li>
                <strong>Nama Lengkap</strong>
                <p>Nama lengkap sesuai dokumen identitas</p>
              </li>
            </ul>
          </div>

          <div className={styles['data-section']}>
            <h3>2. Data Kontak</h3>
            <ul>
              <li>
                <strong>Email</strong>
                <p>Alamat email aktif untuk verifikasi akun</p>
              </li>
              <li>
                <strong>Nomor Telepon</strong>
                <p>10-15 digit nomor telepon yang dapat dihubungi</p>
              </li>
            </ul>
          </div>

          <div className={styles['data-section']}>
            <h3>3. Alamat Lengkap</h3>
            <ul>
              <li>
                <strong>Provinsi</strong>
                <p>Pilih provinsi tempat tinggal Anda</p>
              </li>
              <li>
                <strong>Kota/Kabupaten</strong>
                <p>Pilih kota atau kabupaten sesuai domisili</p>
              </li>
              <li>
                <strong>Kecamatan</strong>
                <p>Pilih kecamatan tempat tinggal</p>
              </li>
              <li>
                <strong>Desa/Kelurahan</strong>
                <p>Pilih desa atau kelurahan sesuai alamat KTP</p>
              </li>
              <li>
                <strong>Alamat Detail</strong>
                <p>Nama jalan, nomor rumah, RT/RW, dan informasi lainnya</p>
              </li>
            </ul>
          </div>

          <div className={styles['data-section']}>
            <h3>4. Keamanan Akun</h3>
            <ul>
              <li>
                <strong>Kata Sandi</strong>
                <p>Minimal 8 karakter, kombinasikan huruf besar, huruf kecil, angka, dan simbol</p>
              </li>
              <li>
                <strong>Konfirmasi Kata Sandi</strong>
                <p>Masukkan kata sandi yang sama untuk konfirmasi</p>
              </li>
            </ul>
          </div>

          <div className={styles['modal-note']}>
            <strong>⚠️ Catatan Penting:</strong>
            <ul>
              <li>Pastikan semua data yang diisi sesuai dengan dokumen resmi</li>
              <li>Email yang Anda daftarkan akan digunakan untuk verifikasi akun</li>
              <li>Simpan kata sandi Anda dengan aman</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Daftar;
