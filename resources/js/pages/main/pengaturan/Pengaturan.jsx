import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Banner from '../../../components/banner/Banner';
import Button from '../../../components/button/Button';
import Input from '../../../components/input/Input';
import Form from '../../../components/form/Form';
import Card from '../../../components/card/Card';
import Tabs from '../../../components/tabs/Tabs';
import { useIndonesiaRegion } from '../../../hooks/useIndonesiaRegion';
import { buildRegionStateUpdate } from '../../../utils/regionForm';
import { MdPerson, MdCameraAlt, MdLock, MdSave, MdWarning, MdDeleteForever } from 'react-icons/md';
import { useUser } from '../../../contexts/UserContext';
import { authenticatedFetch, isAuthenticated, clearAuth } from '../../../utils/auth';
import styles from './Pengaturan.module.css';

const Pengaturan = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser, clearUser } = useUser();
  const [avatarError, setAvatarError] = useState(false);
  const [banner, setBanner] = useState({ message: '', variant: '' });
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'account'
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [accountErrors, setAccountErrors] = useState({});
  const isRegionId = (value) => !!value && /^\d+$/.test(String(value));

  // Delete account states
  const [deleteStep, setDeleteStep] = useState(0); // 0: hidden, 1: first confirm, 2: second confirm, 3: final confirm
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteErrors, setDeleteErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const { provinces, regencies, districts, villages, fetchRegencies, fetchDistricts, fetchVillages } =
    useIndonesiaRegion();

  const [profileData, setProfileData] = useState({
    fotoProfil: null,
    nip: '',
    nik: '',
    name: '',
    birthDate: '',
    birthPlace: '',
    gender: '',
    religion: '',
    phone: '',
    provinsiId: '',
    kabupatenId: '',
    kecamatanId: '',
    kelurahanId: '',
    address: '',
    statusKepegawaian: '',
    jabatan: '',
    unitKerja: '',
    tanggalMulaiBekerja: ''
  });

  const [accountData, setAccountData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Only load initial data once when user data first becomes available
    if (user && !initialDataLoaded) {
      // Load cascading regions first, then set form data
      const loadInitialData = async () => {
        // Load regions sequentially to avoid race conditions
        // Each fetch resets downstream data, so we must load in order
        if (isRegionId(user.province)) {
          await fetchRegencies(user.province);
        }
        if (isRegionId(user.regency)) {
          await fetchDistricts(user.regency);
        }
        if (isRegionId(user.district)) {
          await fetchVillages(user.district);
        }

        // Now set the form data after regions are loaded
        setProfileData({
          fotoProfil: null,
          nip: user.nip || '',
          nik: user.nik || '',
          name: user.name || '',
          birthDate: user.tanggal_lahir || '',
          birthPlace: user.tempat || '',
          gender: user.jenis_kelamin || '',
          religion: user.agama || '',
          phone: user.phone || '',
          provinsiId: user.province || '',
          kabupatenId: user.regency || '',
          kecamatanId: user.district || '',
          kelurahanId: user.village || '',
          address: user.address || '',
          statusKepegawaian: user.status_kepegawaian || '',
          jabatan: user.jabatan || '',
          unitKerja: user.unit_kerja || '',
          tanggalMulaiBekerja: user.tanggal_mulai_kerja || ''
        });

        setAccountData({
          email: user.email || '',
          phone: user.phone || '',
          password: '',
          confirmPassword: ''
        });

        setInitialDataLoaded(true);
      };

      loadInitialData();
      fetchProfilePicture();
    }
  }, [navigate, user, initialDataLoaded, fetchRegencies, fetchDistricts, fetchVillages]);

  const fetchProfilePicture = async () => {
    try {
      const response = await authenticatedFetch('/api/profile/foto-profil');
      const data = await response.json();
      if (data.success && data.data.foto_profil_url) {
        // Add cache buster to prevent caching issues
        const imageUrl = data.data.foto_profil_url + '?t=' + Date.now();
        setProfilePicture(imageUrl);
        console.log('Fetched profile picture:', imageUrl);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Force numeric-only inputs for identity and phone fields with sensible length caps
    if (name === 'nik') {
      processedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (name === 'nip') {
      processedValue = value.replace(/\D/g, '').slice(0, 18);
    } else if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 15);
    }

    setProfileData((prev) =>
      buildRegionStateUpdate({
        name,
        value: processedValue,
        state: prev,
        provinces,
        regencies,
        districts,
        villages
      })
    );

    if (name === 'provinsiId') {
      fetchRegencies(processedValue).catch(() => {});
    }
    if (name === 'kabupatenId') {
      fetchDistricts(processedValue).catch(() => {});
    }
    if (name === 'kecamatanId') {
      fetchVillages(processedValue).catch(() => {});
    }
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 15);
    }

    setAccountData((prev) => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setBanner({ message: 'Hanya file gambar yang diizinkan', variant: 'error' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setBanner({ message: 'Ukuran file maksimal 2MB', variant: 'error' });
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('foto_profil', file);

      const response = await fetch('/api/profile/foto-profil', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add cache buster to force image reload
        const imageUrl = data.data.foto_profil_url + '?t=' + Date.now();
        setProfilePicture(imageUrl);
        setAvatarError(false);
        await refreshUser();
        setBanner({ message: 'Foto profil berhasil diupload', variant: 'success' });
        
        // Log for debugging
        console.log('Profile picture uploaded:', {
          url: data.data.foto_profil_url,
          path: data.data.foto_profil,
          cachedUrl: imageUrl
        });
      } else {
        throw new Error(data.message || 'Gagal upload foto profil');
      }
    } catch (error) {
      setBanner({ message: 'Gagal upload foto profil: ' + error.message, variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    
    try {
      const payload = {
        nip: profileData.nip,
        nik: profileData.nik,
        name: profileData.name,
        phone: profileData.phone,
        jenis_kelamin: profileData.gender,
        agama: profileData.religion,
        tempat: profileData.birthPlace,
        tanggal_lahir: profileData.birthDate,
        province: profileData.provinsiId,
        regency: profileData.kabupatenId,
        district: profileData.kecamatanId,
        village: profileData.kelurahanId,
        address: profileData.address,
        status_kepegawaian: profileData.statusKepegawaian,
        jabatan: profileData.jabatan,
        unit_kerja: profileData.unitKerja,
        tanggal_mulai_kerja: profileData.tanggalMulaiBekerja,
      };

      const response = await authenticatedFetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        refreshUser(); // Refresh user context
        navigate('/profil');
      } else {
        if (data.errors) {
          setProfileErrors(data.errors);
        } else {
          setProfileErrors({ general: data.message || 'Gagal memperbarui profil' });
        }
      }
    } catch (error) {
      setProfileErrors({ general: 'Terjadi kesalahan saat memperbarui profil' });
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountErrors({});

    if (accountData.password && accountData.password !== accountData.confirmPassword) {
      setAccountErrors({ confirmPassword: 'Konfirmasi password tidak cocok.' });
      return;
    }

    try {
      const payload = {
        email: accountData.email,
      };

      if (accountData.password) {
        payload.password = accountData.password;
      }

      const response = await authenticatedFetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        refreshUser(); // Refresh user context
        setAccountData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
      } else {
        if (data.errors) {
          setAccountErrors(data.errors);
        } else {
          setAccountErrors({ general: data.message || 'Gagal memperbarui akun' });
        }
      }
    } catch (error) {
      setAccountErrors({ general: 'Terjadi kesalahan saat memperbarui akun' });
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteErrors({});

    if (deleteConfirmText !== 'HAPUS AKUN SAYA') {
      setDeleteErrors({ confirmText: 'Teks konfirmasi tidak sesuai' });
      return;
    }

    if (!deletePassword) {
      setDeleteErrors({ password: 'Password wajib diisi' });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await authenticatedFetch('/api/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deletePassword,
          confirmation_text: deleteConfirmText,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear auth and redirect to login
        clearAuth();
        if (clearUser) clearUser();
        navigate('/login', { state: { message: 'Akun Anda telah berhasil dihapus.' } });
      } else {
        if (data.errors) {
          setDeleteErrors(data.errors);
        } else {
          setDeleteErrors({ general: data.message || 'Gagal menghapus akun' });
        }
      }
    } catch (error) {
      setDeleteErrors({ general: 'Terjadi kesalahan saat menghapus akun' });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetDeleteModal = () => {
    setDeleteStep(0);
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteErrors({});
  };

  if (userLoading) {
    return (
      <MainLayout title="Pengaturan" subtitle="Kelola profil dan akun Anda">
        <div className={styles['skeleton-page']}>
          <div className={styles['skeleton-bar']} />
          <div className={styles['skeleton-tabs']}>
            <div className={styles['skeleton-tab']} />
            <div className={styles['skeleton-tab']} />
          </div>
          <div className={styles['skeleton-card']}>
            <div className={styles['skeleton-photo']} />
            <div className={styles['skeleton-lines']}>
              <div className={styles['skeleton-line']} />
              <div className={styles['skeleton-line']} />
              <div className={styles['skeleton-line']} />
              <div className={styles['skeleton-line']} />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Banner message={banner.message} variant={banner.variant} autoRefresh={banner.variant === 'success'} />
      <header className={styles['page-header']}>
        <h1 className={styles['page-title']}>Pengaturan</h1>
        <p className={styles['page-subtitle']}>Ubah informasi profil dan pengaturan akun Anda.</p>
      </header>

      <div className={styles['settings-card']}>
        <Tabs
          tabs={[
            { key: 'profile', label: 'Edit Profil' },
            { key: 'account', label: 'Edit Akun' }
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'profile' && (
          <Form onSubmit={handleProfileSubmit} className={styles['settings-form']}>
            <div className={styles['settings-body']}>
              <Card variant="secondary" padding="normal">
                <div className={styles['photo-section']}>
                  <div className={styles['photo-avatar']}>
                    {profilePicture && !avatarError ? (
                      <img 
                        src={profilePicture} 
                        alt="Foto Profil" 
                        onError={(e) => {
                          console.error('Image failed to load:', profilePicture);
                          setAvatarError(true);
                        }}
                        onLoad={() => console.log('Image loaded successfully:', profilePicture)}
                      />
                    ) : (
                      <div className={styles['avatar-initials']}>
                        {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className={styles['photo-overlay']}>
                      <input
                        type="file"
                        id="photoUpload"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className={styles.hiddenInput}
                        disabled={uploading}
                      />
                      <Button
                        variant="inverse"
                        size="small"
                        icon={<MdCameraAlt />}
                        onClick={() => document.getElementById('photoUpload').click()}
                        disabled={uploading}
                      >
                        {uploading ? 'Mengupload...' : 'Ganti Foto'}
                      </Button>
                    </div>
                  </div>
                  <div className={styles['photo-info']}>
                    <p className={styles['photo-info-title']}>Foto Profil</p>
                    <ul className={styles['photo-info-list']}>
                      <li>Format: JPG, PNG (maks 2MB)</li>
                      <li>Rasio: 1:1 (persegi)</li>
                      <li>Wajah jelas dan terlihat</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className={styles['form-section']}>
                <h3 className={styles['form-section-title']}>Informasi Identitas</h3>
                <Form.Row columns={2}>
                  <Input
                    label="NIK"
                    name="nik"
                    type="text"
                    value={profileData.nik}
                    onChange={handleProfileChange}
                    inputMode="numeric"
                    pattern="[0-9]{16}"
                    maxLength={16}
                    placeholder="Masukkan NIK (16 digit)"
                    required
                    error={Array.isArray(profileErrors.nik) ? profileErrors.nik[0] : profileErrors.nik}
                  />
                  <Input
                    label="NIP"
                    name="nip"
                    type="text"
                    value={profileData.nip}
                    onChange={handleProfileChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={18}
                    placeholder="Masukkan NIP (18 digit, opsional)"
                    error={Array.isArray(profileErrors.nip) ? profileErrors.nip[0] : profileErrors.nip}
                  />
                </Form.Row>

                <Form.Row columns={2}>
                  <Input
                    label="Nama Lengkap"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    placeholder="Masukkan nama sesuai KTP"
                    required
                    error={Array.isArray(profileErrors.name) ? profileErrors.name[0] : profileErrors.name}
                  />
                  <Input
                    label="Nomor Telepon"
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    inputMode="tel"
                    pattern="[0-9]{10,15}"
                    maxLength={15}
                    placeholder="Contoh: 081234567890"
                    error={Array.isArray(profileErrors.phone) ? profileErrors.phone[0] : profileErrors.phone}
                  />
                </Form.Row>

                <Form.Row columns={2}>
                  <Input
                    label="Tanggal Lahir"
                    type="date"
                    name="birthDate"
                    value={profileData.birthDate}
                    onChange={handleProfileChange}
                    placeholder="Pilih tanggal lahir"
                    required
                    error={Array.isArray(profileErrors.birthDate) ? profileErrors.birthDate[0] : profileErrors.birthDate}
                  />
                  <Input
                    label="Tempat Lahir"
                    name="birthPlace"
                    value={profileData.birthPlace}
                    onChange={handleProfileChange}
                    placeholder="Masukkan tempat lahir"
                    required
                    error={Array.isArray(profileErrors.birthPlace) ? profileErrors.birthPlace[0] : profileErrors.birthPlace}
                  />
                </Form.Row>

                <Form.Row columns={2}>
                  <Input
                    label="Jenis Kelamin"
                    name="gender"
                    type="select"
                    value={profileData.gender}
                    onChange={handleProfileChange}
                    options={[
                      { value: 'Laki-laki', label: 'Laki-laki' },
                      { value: 'Perempuan', label: 'Perempuan' }
                    ]}
                    placeholder="Pilih jenis kelamin"
                    required
                    error={Array.isArray(profileErrors.gender) ? profileErrors.gender[0] : profileErrors.gender}
                  />
                  <Input
                    label="Agama"
                    name="religion"
                    type="select"
                    value={profileData.religion}
                    onChange={handleProfileChange}
                    options={[
                      { value: 'Islam', label: 'Islam' },
                      { value: 'Kristen Protestan', label: 'Kristen Protestan' },
                      { value: 'Katolik', label: 'Katolik' },
                      { value: 'Hindu', label: 'Hindu' },
                      { value: 'Buddha', label: 'Buddha' },
                      { value: 'Konghucu', label: 'Konghucu' },
                      { value: 'Lainnya', label: 'Lainnya' }
                    ]}
                    placeholder="Pilih agama"
                    required
                    error={Array.isArray(profileErrors.religion) ? profileErrors.religion[0] : profileErrors.religion}
                  />
                </Form.Row>

                <h3 className={styles['form-section-title']}>Alamat</h3>
                <Form.Row columns={2}>
                  <Input
                    label="Provinsi"
                    name="provinsiId"
                    type="select"
                    value={profileData.provinsiId}
                    onChange={handleProfileChange}
                    options={provinces}
                    placeholder="Pilih Provinsi"
                    required
                    error={Array.isArray(profileErrors.provinsiId) ? profileErrors.provinsiId[0] : profileErrors.provinsiId}
                  />
                  <Input
                    label="Kabupaten/Kota"
                    name="kabupatenId"
                    type="select"
                    value={profileData.kabupatenId}
                    onChange={handleProfileChange}
                    options={regencies}
                    placeholder="Pilih Kabupaten/Kota"
                    required
                    error={Array.isArray(profileErrors.kabupatenId) ? profileErrors.kabupatenId[0] : profileErrors.kabupatenId}
                  />
                </Form.Row>

                <Form.Row columns={2}>
                  <Input
                    label="Kecamatan"
                    name="kecamatanId"
                    type="select"
                    value={profileData.kecamatanId}
                    onChange={handleProfileChange}
                    options={districts}
                    placeholder="Pilih Kecamatan"
                    required
                    error={Array.isArray(profileErrors.kecamatanId) ? profileErrors.kecamatanId[0] : profileErrors.kecamatanId}
                  />
                  <Input
                    label="Kelurahan/Desa"
                    name="kelurahanId"
                    type="select"
                    value={profileData.kelurahanId}
                    onChange={handleProfileChange}
                    options={villages}
                    placeholder="Pilih Kelurahan/Desa"
                    required
                    error={Array.isArray(profileErrors.kelurahanId) ? profileErrors.kelurahanId[0] : profileErrors.kelurahanId}
                  />
                </Form.Row>

                <Form.Row columns={1}>
                  <Input
                    label="Alamat Detail"
                    name="address"
                    type="textarea"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    placeholder="Masukkan alamat detail (jalan, nomor rumah, RT/RW)"
                    rows={3}
                    required
                    error={Array.isArray(profileErrors.address) ? profileErrors.address[0] : profileErrors.address}
                  />
                </Form.Row>

                <h3 className={styles['form-section-title']}>Informasi Kepegawaian</h3>
                <Form.Row columns={2}>
                  <Input
                    label="Status Kepegawaian"
                    name="statusKepegawaian"
                    type='select'
                    value={profileData.statusKepegawaian}
                    onChange={handleProfileChange}
                    options={[
                      { value: 'Karyawan Tetap', label: 'Karyawan Tetap' },
                      { value: 'Karyawan Kontrak', label: 'Karyawan Kontrak' },
                      { value: 'Tenaga Honorer/Sukarelawan', label: 'Tenaga Honorer/Sukarelawan' },
                      { value: 'Perawat Praktik Mandiri', label: 'Perawat Praktik Mandiri' }
                    ]}
                    placeholder="Pilih status kepegawaian"
                    required
                    error={
                      Array.isArray(profileErrors.statusKepegawaian)
                        ? profileErrors.statusKepegawaian[0]
                        : profileErrors.statusKepegawaian
                    }
                  />
                  <Input
                    label="Jabatan"
                    name="jabatan"
                    value={profileData.jabatan}
                    onChange={handleProfileChange}
                    placeholder="Masukkan jabatan"
                    required
                    error={Array.isArray(profileErrors.jabatan) ? profileErrors.jabatan[0] : profileErrors.jabatan}
                  />
                </Form.Row>

                <Form.Row columns={2}>
                  <Input
                    label="Unit Kerja"
                    name="unitKerja"
                    value={profileData.unitKerja}
                    onChange={handleProfileChange}
                    placeholder="Masukkan unit kerja"
                    required
                    error={Array.isArray(profileErrors.unitKerja) ? profileErrors.unitKerja[0] : profileErrors.unitKerja}
                  />
                  <Input
                    label="Tanggal Mulai Bekerja"
                    name="tanggalMulaiBekerja"
                    type='date'
                    value={profileData.tanggalMulaiBekerja}
                    onChange={handleProfileChange}
                    placeholder="Masukkan tanggal mulai bekerja"
                    required
                    error={
                      Array.isArray(profileErrors.tanggalMulaiBekerja)
                        ? profileErrors.tanggalMulaiBekerja[0]
                        : profileErrors.tanggalMulaiBekerja
                    }
                  />
                </Form.Row>
              </div>
            </div>

            {profileErrors.general && (
              <div className={styles['form-error']}>
                {Array.isArray(profileErrors.general) ? profileErrors.general[0] : profileErrors.general}
              </div>
            )}

            <div className={styles['settings-actions']}>
              <Button variant="danger" size="medium" type="button" onClick={() => navigate('/profil')}>
                Batal
              </Button>
              <Button variant="success" size="medium" type="submit" icon={<MdSave />}>
                Simpan Perubahan
              </Button>
            </div>
          </Form>
        )}

        {/* Edit Account Tab */}
        {activeTab === 'account' && (
          <Form onSubmit={handleAccountSubmit} className={styles['settings-form']}>
            <div className={styles['settings-body']}>
              <div className={styles['account-grid']}>
                <div className={styles['form-section']}>
                  <h3 className={styles['form-section-title']}>Informasi Akun</h3>
                  <p className={styles['form-section-description']}>
                    Ubah email yang terhubung dengan akun Anda.
                  </p>
                  <Form.Row columns={1}>
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={accountData.email}
                      onChange={handleAccountChange}
                      placeholder="email@example.com"
                      required
                      error={Array.isArray(accountErrors.email) ? accountErrors.email[0] : accountErrors.email}
                    />
                  </Form.Row>
                </div>

                <div className={`${styles['form-section']} ${styles['password-panel']}`}>
                  <h3 className={styles['form-section-title']}>Ubah Password</h3>
                  <p className={styles['form-section-description']}>
                    Kosongkan jika tidak ingin mengubah password
                  </p>
                  <Form.Row columns={1}>
                    <Input
                      label="Password Baru"
                      name="password"
                      type="password"
                      value={accountData.password}
                      onChange={handleAccountChange}
                      placeholder="Minimal 8 karakter"
                      minLength={8}
                      error={Array.isArray(accountErrors.password) ? accountErrors.password[0] : accountErrors.password}
                      allowPasswordToggle
                    />
                  </Form.Row>

                  <Form.Row columns={1}>
                    <Input
                      label="Konfirmasi Password"
                      name="confirmPassword"
                      type="password"
                      value={accountData.confirmPassword}
                      onChange={handleAccountChange}
                      placeholder="Ketik ulang password baru"
                      minLength={8}
                      error={
                        Array.isArray(accountErrors.confirmPassword)
                          ? accountErrors.confirmPassword[0]
                          : accountErrors.confirmPassword
                      }
                      allowPasswordToggle
                    />
                  </Form.Row>
                </div>
              </div>

              {/* Danger Zone - Delete Account */}
              <div className={styles['danger-zone']}>
                <div className={styles['danger-zone-header']}>
                  <MdWarning className={styles['danger-icon']} />
                  <h3 className={styles['danger-zone-title']}>Hapus Akun?</h3>
                </div>
                <p className={styles['danger-zone-description']}>
                  Setelah akun dihapus, semua data Anda akan hilang secara permanen dan tidak dapat dipulihkan.
                </p>
                <Button 
                  variant="danger" 
                  size="medium" 
                  type="button" 
                  icon={<MdDeleteForever />}
                  onClick={() => setDeleteStep(1)}
                >
                  Hapus Akun Saya
                </Button>
              </div>
            </div>

            {accountErrors.general && (
              <div className={styles['form-error']}>
                {Array.isArray(accountErrors.general) ? accountErrors.general[0] : accountErrors.general}
              </div>
            )}

            <div className={styles['settings-actions']}>
              <Button variant="danger" size="medium" type="button" onClick={() => navigate('/profil')}>
                Batal
              </Button>
              <Button variant="success" size="medium" type="submit" icon={<MdSave />}>
                Simpan Perubahan
              </Button>
            </div>
          </Form>
        )}
      </div>

      {/* Delete Account Modal - Triple Confirmation */}
      {deleteStep > 0 && (
        <div className={styles['modal-overlay']} onClick={resetDeleteModal}>
          <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
            {/* Step 1: First Confirmation */}
            {deleteStep === 1 && (
              <>
                <div className={styles['modal-header-danger']}>
                  <MdWarning className={styles['modal-warning-icon']} />
                  <h2>Hapus Akun?</h2>
                </div>
                <div className={styles['modal-body']}>
                  <p>Apakah Anda yakin ingin menghapus akun Anda?</p>
                  <p className={styles['warning-text']}>
                    Tindakan ini akan menghapus semua data Anda termasuk:
                  </p>
                  <ul className={styles['warning-list']}>
                    <li>Profil dan informasi pribadi</li>
                    <li>Foto profil</li>
                    <li>Dokumen yang telah diunggah</li>
                    <li>Riwayat pendidikan</li>
                    <li>Data penugasan</li>
                  </ul>
                </div>
                <div className={styles['modal-actions']}>
                  <Button variant="secondary" size="medium" onClick={resetDeleteModal}>
                    Batal
                  </Button>
                  <Button variant="danger" size="medium" onClick={() => setDeleteStep(2)}>
                    Ya, Lanjutkan
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Second Confirmation */}
            {deleteStep === 2 && (
              <>
                <div className={styles['modal-header-danger']}>
                  <MdWarning className={styles['modal-warning-icon']} />
                  <h2>Konfirmasi</h2>
                </div>
                <div className={styles['modal-body']}>
                  <p className={styles['warning-text-bold']}>
                    Apakah Anda yakin? Data tidak dapat dipulihkan!
                  </p>
                  <p>
                    Langkah selanjutnya akan meminta Anda untuk memasukkan password dan konfirmasi teks.
                  </p>
                </div>
                <div className={styles['modal-actions']}>
                  <Button variant="secondary" size="medium" onClick={resetDeleteModal}>
                    Batal
                  </Button>
                  <Button variant="danger" size="medium" onClick={() => setDeleteStep(3)}>
                    Ya, Saya Mengerti
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Final Confirmation with Password */}
            {deleteStep === 3 && (
              <>
                <div className={styles['modal-header-danger']}>
                  <MdDeleteForever className={styles['modal-warning-icon']} />
                  <h2>Konfirmasi Akhir</h2>
                </div>
                <div className={styles['modal-body']}>
                  <p className={styles['warning-text-bold']}>
                    Ini adalah langkah terakhir. Tidak ada jalan kembali!
                  </p>
                  
                  <div className={styles['delete-form']}>
                    <Input
                      label="Password Anda"
                      name="deletePassword"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Masukkan password untuk konfirmasi"
                      error={Array.isArray(deleteErrors.password) ? deleteErrors.password[0] : deleteErrors.password}
                      allowPasswordToggle
                    />

                    <div className={styles['confirm-text-section']}>
                      <p>Ketik <strong>HAPUS AKUN SAYA</strong> untuk mengkonfirmasi:</p>
                      <Input
                        name="deleteConfirmText"
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder="HAPUS AKUN SAYA"
                        error={deleteErrors.confirmText}
                      />
                    </div>
                  </div>

                  {deleteErrors.general && (
                    <div className={styles['delete-error']}>
                      {Array.isArray(deleteErrors.general) ? deleteErrors.general[0] : deleteErrors.general}
                    </div>
                  )}
                </div>
                <div className={styles['modal-actions']}>
                  <Button variant="secondary" size="medium" onClick={resetDeleteModal} disabled={isDeleting}>
                    Batal
                  </Button>
                  <Button 
                    variant="danger" 
                    size="medium" 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== 'HAPUS AKUN SAYA'}
                  >
                    {isDeleting ? 'Menghapus...' : 'Hapus Akun Permanen'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Pengaturan;
