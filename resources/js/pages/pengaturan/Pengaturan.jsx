import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Button from '../../components/button/Button';
import Input from '../../components/input/Input';
import Form from '../../components/form/Form';
import Card from '../../components/card/Card';
import Tabs from '../../components/tabs/Tabs';
import { useIndonesiaRegion } from '../../hooks/useIndonesiaRegion';
import { buildRegionStateUpdate } from '../../utils/regionForm';
import { MdPerson, MdCameraAlt, MdLock, MdSave } from 'react-icons/md';
import { authenticatedFetch, isAuthenticated } from '../../utils/auth';
import styles from './Pengaturan.module.css';

const Pengaturan = () => {
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('https://i.pravatar.cc/300?img=64');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'account'
  const isRegionId = (value) => !!value && /^\d+$/.test(String(value));

  const { provinces, regencies, districts, villages, fetchRegencies, fetchDistricts, fetchVillages } =
    useIndonesiaRegion();

  const [profileData, setProfileData] = useState({
    fotoProfil: null,
    nip: '',
    nik: '',
    name: '',
    birthDate: '',
    birthPlace: '',
    religion: '',
    phone: '',
    provinsiId: '',
    kabupatenId: '',
    kecamatanId: '',
    kelurahanId: '',
    address: ''
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

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await authenticatedFetch('/api/me');
        const data = await response.json();

        if (response.ok && data.success) {
          const user = data.data;
          setProfileData({
            fotoProfil: null,
            nip: user.nip || '',
            nik: user.nik || '',
            name: user.name || '',
            birthDate: user.date_of_birth || '',
            birthPlace: user.place_of_birth || '',
            religion: user.religion || '',
            phone: user.phone || '',
            provinsiId: user.province || '',
            kabupatenId: user.regency || '',
            kecamatanId: user.district || '',
            kelurahanId: user.village || '',
            address: user.address || ''
          });

          setAccountData({
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            confirmPassword: ''
          });

          // Prefetch cascading regions without blocking initial render
          const preloadRegions = [];
          if (isRegionId(user.province)) {
            preloadRegions.push(fetchRegencies(user.province));
          }
          if (isRegionId(user.regency)) {
            preloadRegions.push(fetchDistricts(user.regency));
          }
          if (isRegionId(user.district)) {
            preloadRegions.push(fetchVillages(user.district));
          }
          if (preloadRegions.length) {
            Promise.allSettled(preloadRegions).catch(() => {});
          }
        } else {
          console.error('Failed to fetch user data:', data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, fetchRegencies, fetchDistricts, fetchVillages]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) =>
      buildRegionStateUpdate({
        name,
        value,
        state: prev,
        provinces,
        regencies,
        districts,
        villages
      })
    );

    if (name === 'provinsiId') {
      fetchRegencies(value).catch(() => {});
    }
    if (name === 'kabupatenId') {
      fetchDistricts(value).catch(() => {});
    }
    if (name === 'kecamatanId') {
      fetchVillages(value).catch(() => {});
    }
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
        setAvatarError(false);
        setProfileData((prev) => ({
          ...prev,
          fotoProfil: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async () => {
    console.log('Simpan profil:', profileData);
    // TODO: Implement API call to update profile
    alert('Profil berhasil diperbarui!');
  };

  const handleAccountSubmit = async () => {
    if (accountData.password && accountData.password !== accountData.confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok!');
      return;
    }
    console.log('Simpan akun:', accountData);
    // TODO: Implement API call to update account
    alert('Akun berhasil diperbarui!');
  };

  if (loading) {
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
                    {!avatarError ? (
                      <img src={avatarUrl} alt="Foto Profil" onError={() => setAvatarError(true)} />
                    ) : (
                      <MdPerson className={styles['photo-placeholder']} />
                    )}
                    <div className={styles['photo-overlay']}>
                      <input
                        type="file"
                        id="photoUpload"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className={styles.hiddenInput}
                      />
                      <Button
                        variant="inverse"
                        size="small"
                        icon={<MdCameraAlt />}
                        onClick={() => document.getElementById('photoUpload').click()}
                      >
                        Ganti Foto
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
                    value={profileData.nik}
                    onChange={handleProfileChange}
                    maxLength={16}
                    placeholder="Masukkan NIK (16 digit)"
                    required
                  />
                  <Input
                    label="NIP"
                    name="nip"
                    value={profileData.nip}
                    onChange={handleProfileChange}
                    maxLength={18}
                    placeholder="Masukkan NIP (18 digit, opsional)"
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
                  />
                  <Input
                    label="Nomor Telepon"
                    name="phone"
                    type="tel"
                    value={accountData.phone}
                    onChange={handleAccountChange}
                    placeholder="Contoh: 081234567890"
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
                  />
                  <Input
                    label="Tempat Lahir"
                    name="birthPlace"
                    value={profileData.birthPlace}
                    onChange={handleProfileChange}
                    placeholder="Masukkan tempat lahir"
                    required
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
                  />
                </Form.Row>

                <h3 className={styles['form-section-title']}>Informasi Kepegawaian</h3>
                <Form.Row columns={2}>
                  <Input
                    label="Status Kepegawaian"
                    name="statusKepegawaian"
                    value={profileData.statusKepegawaian}
                    onChange={handleProfileChange}
                    placeholder="Masukkan status kepegawaian"
                    required
                  />
                  <Input
                    label="Jabatan"
                    name="jabatanId"
                    value={profileData.jabatan}
                    onChange={handleProfileChange}
                    placeholder="Masukkan jabatan"
                    required
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
                  />
                  <Input
                    label="Tanggal Mulai Bekerja"
                    name="tanggalMulaiBekerja"
                    type='date'
                    value={profileData.tanggalMulaiBekerja}
                    onChange={handleProfileChange}
                    placeholder="Masukkan tanggal mulai bekerja"
                    required
                  />
                </Form.Row>
              </div>
            </div>

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
              <div className={styles['form-section']}>
                <h3 className={styles['form-section-title']}>Informasi Akun</h3>
                <Form.Row columns={1}>
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={accountData.email}
                    onChange={handleAccountChange}
                    placeholder="email@example.com"
                    required
                  />
                </Form.Row>

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
                  />
                </Form.Row>
              </div>
            </div>

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
    </MainLayout>
  );
};

export default Pengaturan;
