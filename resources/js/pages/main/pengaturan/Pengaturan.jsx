import { useState, useEffect, useRef } from 'react';
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
import { getProvinceNameById, getRegencyNameById, getDistrictNameById, getVillageNameById,
         getProvinces, getRegencies, getDistricts, getVillages } from '../../../services/indonesiaRegion';
import { toDateInput } from '../../../utils/dateFormatter';
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
  const initialLoadRef = useRef(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [accountErrors, setAccountErrors] = useState({});
  const isRegionId = (value) => !!value && /^\d+(\.\d+)*$/.test(String(value));

  // Delete account states
  const [deleteStep, setDeleteStep] = useState(0); // 0: hidden, 1: first confirm, 2: second confirm, 3: final confirm
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteErrors, setDeleteErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [debugLog, setDebugLog] = useState(null); // { payload, status, data }

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

    // Only load initial data once — use ref so guard is set synchronously,
    // preventing loops caused by unstable fetchRegencies/fetchDistricts/fetchVillages refs
    if (!user || initialLoadRef.current) return;
    initialLoadRef.current = true;

    // Load cascading regions first, then set form data
    const loadInitialData = async () => {
      const capWords = (s = '') =>
        s ? String(s).toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : '';

      // Resolve a stored value (may be a numeric ID OR a plain name) to { id, name }.
      // When it's a name we reverse-lookup the ID so dropdowns can be populated.
      const resolveProvince = async (stored) => {
        if (!stored) return { id: '', name: '' };
        if (isRegionId(stored)) {
          const name = await getProvinceNameById(stored).catch(() => '') || '';
          return { id: stored, name };
        }
        const name = capWords(stored);
        const list = await getProvinces().catch(() => []);
        const match = list.find(p => p.label.toLowerCase() === name.toLowerCase());
        return { id: match?.value || '', name };
      };

      const resolveRegency = async (provinceId, stored) => {
        if (!stored || !provinceId) return { id: '', name: '' };
        if (isRegionId(stored)) {
          const name = await getRegencyNameById(provinceId, stored).catch(() => '') || '';
          return { id: stored, name };
        }
        const name = capWords(stored);
        const list = await getRegencies(provinceId).catch(() => []);
        const match = list.find(r => r.label.toLowerCase() === name.toLowerCase());
        return { id: match?.value || '', name };
      };

      const resolveDistrict = async (regencyId, stored) => {
        if (!stored || !regencyId) return { id: '', name: '' };
        if (isRegionId(stored)) {
          const name = await getDistrictNameById(regencyId, stored).catch(() => '') || '';
          return { id: stored, name };
        }
        const name = capWords(stored);
        const list = await getDistricts(regencyId).catch(() => []);
        const match = list.find(d => d.label.toLowerCase() === name.toLowerCase());
        return { id: match?.value || '', name };
      };

      const resolveVillage = async (districtId, stored) => {
        if (!stored || !districtId) return { id: '', name: '' };
        if (isRegionId(stored)) {
          const name = await getVillageNameById(districtId, stored).catch(() => '') || '';
          return { id: stored, name };
        }
        const name = capWords(stored);
        const list = await getVillages(districtId).catch(() => []);
        const match = list.find(v => v.label.toLowerCase() === name.toLowerCase());
        return { id: match?.value || '', name };
      };

      // Resolve sequentially — each level needs the ID from the previous
      const prov = await resolveProvince(user.province);
      if (prov.id) await fetchRegencies(prov.id);

      const reg = await resolveRegency(prov.id, user.regency);
      if (reg.id) await fetchDistricts(reg.id);

      const dist = await resolveDistrict(reg.id, user.district);
      if (dist.id) await fetchVillages(dist.id);

      const vill = await resolveVillage(dist.id, user.village);

      // Set form — *Id fields = numeric IDs (for <select> matching)
      //              named fields = human names (for PUT payload)
      setProfileData({
        fotoProfil: null,
        nip: user.nip || '',
        nik: user.nik || '',
        name: user.name || '',
        birthDate: toDateInput(user.tanggal_lahir),
        birthPlace: user.tempat || '',
        gender: user.jenis_kelamin || '',
        religion: user.agama || '',
        phone: user.phone || '',
        provinsiId:  prov.id,
        provinsi:    prov.name,
        kabupatenId: reg.id,
        kabupaten:   reg.name,
        kecamatanId: dist.id,
        kecamatan:   dist.name,
        kelurahanId: vill.id,
        kelurahan:   vill.name,
        address: user.address || '',
        statusKepegawaian: user.status_kepegawaian || '',
        jabatan: user.jabatan || '',
        unitKerja: user.unit_kerja || '',
        tanggalMulaiBekerja: toDateInput(user.tanggal_mulai_kerja)
      });

      setAccountData({
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        confirmPassword: ''
      });
    };

    loadInitialData();
    fetchProfilePicture();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, user]);

  const fetchProfilePicture = async () => {
    try {
      const response = await authenticatedFetch('/api/profile/foto-profil');
      const data = await response.json();
      if (data.success && data.data.foto_profil_url) {
        // Add cache buster to prevent caching issues
        const imageUrl = data.data.foto_profil_url + '?t=' + Date.now();
        setProfilePicture(imageUrl);
      }
    } catch (error) {
      // silently ignore — picture just won't show
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
      // Build region payload — only include a field when it has an actual value.
      // Empty strings must be omitted so the backend's ?? fallback uses the
      // existing stored value instead of overwriting with ''.
      const regionPayload = {};
      const _prov = profileData.provinsi || profileData.provinsiId;
      const _reg  = profileData.kabupaten || profileData.kabupatenId;
      const _dist = profileData.kecamatan || profileData.kecamatanId;
      const _vill = profileData.kelurahan || profileData.kelurahanId;
      if (_prov) regionPayload.province = _prov;
      if (_reg)  regionPayload.regency  = _reg;
      if (_dist) regionPayload.district = _dist;
      if (_vill) regionPayload.village  = _vill;

      const payload = {
        nip: profileData.nip,
        nik: profileData.nik,
        name: profileData.name,
        phone: profileData.phone,
        jenis_kelamin: profileData.gender,
        agama: profileData.religion,
        tempat: profileData.birthPlace,
        tanggal_lahir: profileData.birthDate,
        ...regionPayload,
        address: profileData.address,
        status_kepegawaian: profileData.statusKepegawaian,
        jabatan: profileData.jabatan,
        unit_kerja: profileData.unitKerja,
        tanggal_mulai_kerja: profileData.tanggalMulaiBekerja,
      };

      const response = await authenticatedFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Always capture debug info
      setDebugLog({
        payload,
        status: response.status,
        data,
        userContext: {
          province:  user?.province,
          regency:   user?.regency,
          district:  user?.district,
          village:   user?.village,
          alamat_lengkap: user?.alamat_lengkap,
        },
        formState: {
          provinsiId:  profileData.provinsiId,
          provinsi:    profileData.provinsi,
          kabupatenId: profileData.kabupatenId,
          kabupaten:   profileData.kabupaten,
          kecamatanId: profileData.kecamatanId,
          kecamatan:   profileData.kecamatan,
          kelurahanId: profileData.kelurahanId,
          kelurahan:   profileData.kelurahan,
        },
      });

      if (response.ok && data.success) {
        refreshUser();
        navigate('/profil');
      } else {
        if (data.errors) {
          setProfileErrors(data.errors);
        } else {
          setProfileErrors({ general: data.message || 'Gagal memperbarui profil' });
        }
      }
    } catch (error) {
      setDebugLog({ error: String(error) });
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

    if (deleteConfirmText !== 'HAPUS AKUN SAYA' && deleteConfirmText !== 'NONAKTIFKAN AKUN SAYA') {
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
        navigate('/login', { state: { message: 'Akun Anda telah dinonaktifkan.' } });
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
                        onError={() => setAvatarError(true)}
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
                    pattern="[0-9]{7,18}"
                    maxLength={18}
                    minLength={7}
                    placeholder="Masukkan NIP (7-18 digit, opsional)"
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
                  <h3 className={styles['danger-zone-title']}>Nonaktifkan Akun?</h3>
                </div>
                <p className={styles['danger-zone-description']}>
                  Menonaktifkan akun akan mencegah Anda masuk kembali. Hubungi administrator untuk pengaktifan kembali.
                </p>
                <Button 
                  variant="danger" 
                  size="medium" 
                  type="button" 
                  icon={<MdDeleteForever />}
                  onClick={() => setDeleteStep(1)}
                >
                  Nonaktifkan Akun Saya
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
                  <h2>Nonaktifkan Akun?</h2>
                </div>
                <div className={styles['modal-body']}>
                  <p>Apakah Anda yakin ingin menonaktifkan akun Anda?</p>
                  <p className={styles['warning-text']}>
                    Menonaktifkan akun akan mencegah Anda login. Data Anda akan tetap tersimpan.
                  </p>
                </div>
                <div className={styles['modal-actions']}>
                  <Button variant="outline" size="medium" onClick={resetDeleteModal}>
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
                  <Button variant="outline" size="medium" onClick={resetDeleteModal}>
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
                      <p>Ketik <strong>NONAKTIFKAN AKUN SAYA</strong> untuk mengkonfirmasi:</p>
                      <Input
                        name="deleteConfirmText"
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder="NONAKTIFKAN AKUN SAYA"
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
                  <Button variant="outline" size="medium" onClick={resetDeleteModal} disabled={isDeleting}>
                    Batal
                  </Button>
                  <Button 
                    variant="danger" 
                    size="medium" 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || (deleteConfirmText !== 'NONAKTIFKAN AKUN SAYA' && deleteConfirmText !== 'HAPUS AKUN SAYA')}
                  >
                    {isDeleting ? 'Memproses...' : 'Nonaktifkan Akun'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* ── DEBUG MODAL — appears after Simpan Perubahan ──────── */}
      {debugLog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace',
            fontSize: '12px', width: '100%', maxWidth: 600,
            borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            {/* header */}
            <div style={{ padding: '10px 16px', background: '#333', borderRadius: '8px 8px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: 13 }}>
                🐛 Submit Debug &nbsp;
                <span style={{ color: debugLog.status >= 500 ? '#f48771' : debugLog.status >= 400 ? '#ce9178' : '#4ec9b0' }}>
                  HTTP {debugLog.status ?? 'ERROR'}
                </span>
              </span>
              <button onClick={() => setDebugLog(null)}
                style={{ background: 'none', border: 'none', color: '#d4d4d4', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', padding: '12px 16px' }}>

              {/* Payload sent */}
              <p style={{ color: '#9cdcfe', margin: '0 0 6px' }}>── Payload Sent ──</p>
              {debugLog.payload
                ? <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
                    {Object.entries(debugLog.payload).map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ color: '#ce9178', paddingRight: 12, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{k}</td>
                        <td style={{ color: '#b5cea8', wordBreak: 'break-all' }}>{JSON.stringify(v)}</td>
                      </tr>
                    ))}
                  </table>
                : <p style={{ color: '#f48771' }}>No payload (JS error before fetch)</p>
              }

              {/* Server response */}
              <p style={{ color: '#9cdcfe', margin: '0 0 6px' }}>── Server Response ──</p>
              <pre style={{ margin: '0 0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                background: '#252526', padding: 8, borderRadius: 4, color: '#b5cea8' }}>
                {JSON.stringify(debugLog.data ?? debugLog.error, null, 2)}
              </pre>

              {/* DB (user context before submit) */}
              <p style={{ color: '#9cdcfe', margin: '0 0 6px' }}>── DB Values (before submit) ──</p>
              {debugLog.userContext && (
                <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12 }}>
                  {Object.entries(debugLog.userContext).map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ color: '#ce9178', paddingRight: 12, whiteSpace: 'nowrap' }}>{k}</td>
                      <td style={{ color: '#b5cea8', wordBreak: 'break-all' }}>{JSON.stringify(v)}</td>
                    </tr>
                  ))}
                </table>
              )}

              {/* Form state */}
              <p style={{ color: '#9cdcfe', margin: '0 0 6px' }}>── Form State (at submit) ──</p>
              {debugLog.formState && (
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  {Object.entries(debugLog.formState).map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ color: '#ce9178', paddingRight: 12, whiteSpace: 'nowrap' }}>{k}</td>
                      <td style={{ color: v ? '#4ec9b0' : '#f48771' }}>{JSON.stringify(v) || '(empty)'}</td>
                    </tr>
                  ))}
                </table>
              )}

            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Pengaturan;
