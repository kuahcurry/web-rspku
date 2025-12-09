import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Button from '../../components/button/Button';
import { FaEdit } from 'react-icons/fa';
import { MdPerson } from 'react-icons/md';
import { useUser } from '../../contexts/UserContext';
import { isAuthenticated, authenticatedFetch } from '../../utils/auth';
import { getProvinceNameById, getRegencyNameById, getDistrictNameById, getVillageNameById } from '../../services/indonesiaRegion';
import { formatDateToIndonesian } from '../../utils/dateFormatter';
import styles from './ProfilSaya.module.css';

const ProfileSaya = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [avatarError, setAvatarError] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [regionNames, setRegionNames] = useState({
    province: '',
    regency: '',
    district: '',
    village: ''
  });

  const [formData, setFormData] = useState({
    namaLengkap: '',
    nik: '',
    nip: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    agama: '',
    nomorTelepon: '',
    email: '',
    alamatDetail: '',
    kelurahanId: '',
    kecamatanId: '',
    kabupatenId: '',
    provinsiId: '',
    statusKepegawaian: '',
    jabatan: '',
    unitKerja: '',
    tanggalMulaiBekerja: ''
  });

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Update form data when user data is loaded
    if (user) {
      setFormData({
        namaLengkap: user.name || '',
        nik: user.nik || '',
        nip: user.nip || '',
        tempatLahir: user.tempat || '',
        tanggalLahir: user.tanggal_lahir || '',
        jenisKelamin: user.jenis_kelamin || '',
        agama: user.agama || '',
        nomorTelepon: user.phone || '',
        email: user.email || '',
        alamatDetail: user.address || '',
        kelurahanId: user.village || '',
        kecamatanId: user.district || '',
        kabupatenId: user.regency || '',
        provinsiId: user.province || '',
        statusKepegawaian: user.status_kepegawaian || '',
        jabatan: user.jabatan || '',
        unitKerja: user.unit_kerja || '',
        tanggalMulaiBekerja: user.tanggal_mulai_kerja || ''
      });

      // Fetch region names
      fetchRegionNames(user);
      
      // Fetch profile picture
      fetchProfilePicture();
    }
  }, [navigate, user]);

  const fetchProfilePicture = async () => {
    try {
      console.log('[ProfilSaya] Fetching profile picture');
      const response = await authenticatedFetch('/api/profile/foto-profil');
      console.log('[ProfilSaya] Response status:', response.status);
      const data = await response.json();
      console.log('[ProfilSaya] API Response:', data);
      if (data.success && data.data.foto_profil_url) {
        console.log('[ProfilSaya] Setting profile picture:', data.data.foto_profil_url);
        setProfilePicture(data.data.foto_profil_url);
      } else {
        console.log('[ProfilSaya] No profile picture URL in response');
      }
    } catch (error) {
      console.error('[ProfilSaya] Error fetching profile picture:', error);
    }
  };

  // Fetch region names from IDs
  const fetchRegionNames = async (userData) => {
    if (!userData) return;

    try {
      const [provinceName, regencyName, districtName, villageName] = await Promise.all([
        userData.province ? getProvinceNameById(userData.province) : null,
        userData.province && userData.regency ? getRegencyNameById(userData.province, userData.regency) : null,
        userData.regency && userData.district ? getDistrictNameById(userData.regency, userData.district) : null,
        userData.district && userData.village ? getVillageNameById(userData.district, userData.village) : null
      ]);

      setRegionNames({
        province: provinceName || '',
        regency: regencyName || '',
        district: districtName || '',
        village: villageName || ''
      });
    } catch (error) {
      console.error('Error fetching region names:', error);
    }
  };

  if (userLoading) {
    return (
      <MainLayout
        title="Profil Saya"
        subtitle="Data pribadi dan kepegawaian yang diperlukan untuk melengkapi informasi tenaga kesehatan."
      >
        <div className={styles['skeleton-page']}>
          <div className={styles['skeleton-bar']} />
          <div className={styles['skeleton-card']}>
            <div className={styles['skeleton-photo']} />
            <div className={styles['skeleton-lines']}>
              <div className={styles['skeleton-line']} />
              <div className={styles['skeleton-line']} />
              <div className={styles['skeleton-line']} />
            </div>
          </div>
          <div className={styles['skeleton-grid']}>
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className={styles['skeleton-tile']} />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Profil Saya"
      subtitle="Data pribadi dan kepegawaian yang diperlukan untuk melengkapi informasi tenaga kesehatan."
    >
      <header className={styles['page-header']}>
        <h1 className={styles['page-title']}>Profil Saya</h1>
        <p className={styles['page-subtitle']}>Lihat informasi profil dan data diri Anda.</p>
      </header>

      <div className={styles['page-body']}>
        {/* Profile Header Card */}
        <section className={styles['hero-section']}>
          <div className={styles['profile-hero-card']}>
            <div className={styles['profile-hero-overlay']} />
            <div className={styles['profile-hero-content']}>
              <div className={styles['profile-hero-left']}>
                <div className={styles['profile-hero-avatar']}>
                  {profilePicture && !avatarError ? (
                    <img 
                      src={profilePicture} 
                      alt="Foto Profil" 
                      onLoad={() => console.log('[ProfilSaya] Image loaded successfully:', profilePicture)}
                      onError={(e) => {
                        console.error('[ProfilSaya] Image failed to load:', profilePicture, 'Error:', e);
                        setAvatarError(true);
                      }} 
                    />
                  ) : (
                    <div className={styles['avatar-initials']}>
                      {formData.namaLengkap?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className={styles['profile-hero-identity']}>
                  <h2 className={styles['profile-hero-name']}>{formData.namaLengkap || 'Nama Lengkap'}</h2>
                  <div className={styles['profile-hero-ids']}>
                    <div className={styles['hero-id']}>
                      <span className={styles['id-label']}>NIK</span>
                      <span className={styles['id-value']}>{formData.nik || 'Belum ada'}</span>
                    </div>
                    <div className={styles['hero-id']}>
                      <span className={styles['id-label']}>NIP</span>
                      <span className={styles['id-value']}>{formData.nip || 'Belum ada'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles['profile-hero-right']}>
                <div className={styles['hero-actions']}>
                  <Button
                    variant="inverse"
                    size="medium"
                    icon={<FaEdit />}
                    iconPosition="left"
                    onClick={() => navigate('/pengaturan')}
                  >
                    Edit Profil
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles['sections-grid']}>
          <section className={styles['section-card']}>
            <div className={styles['section-head']}>
              <div>
                <h3 className={styles['section-title']}>Informasi Pribadi</h3>
              </div>
            </div>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Email</span>
                <span className={styles['info-value']}>{formData.email || '-'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Nomor Telepon</span>
                <span className={styles['info-value']}>{formData.nomorTelepon || '-'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Tempat, Tanggal Lahir</span>
                <span className={styles['info-value']}>
                  {formData.tempatLahir && formData.tanggalLahir
                    ? `${formData.tempatLahir}, ${formatDateToIndonesian(formData.tanggalLahir)}`
                    : '-'}
                </span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Jenis Kelamin</span>
                <span className={styles['info-value']}>{formData.jenisKelamin || '-'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Agama</span>
                <span className={styles['info-value']}>{formData.agama || '-'}</span>
              </div>
              <div className={`${styles['info-item']} ${styles['full-width']}`}>
                <span className={styles['info-label']}>Alamat</span>
                <span className={styles['info-value']}>
                  {formData.alamatDetail && (regionNames.village || regionNames.district || regionNames.regency || regionNames.province)
                    ? `${formData.alamatDetail}${regionNames.village ? ', ' + regionNames.village : ''}${regionNames.district ? ', ' + regionNames.district : ''}${regionNames.regency ? ', ' + regionNames.regency : ''}${regionNames.province ? ', ' + regionNames.province : ''}`
                    : (formData.alamatDetail || '-')}
                </span>
              </div>
            </div>
          </section>

          <section className={styles['section-card']}>
            <div className={styles['section-head']}>
              <div>
                <h3 className={styles['section-title']}>Informasi Kepegawaian</h3>
              </div>
            </div>
            <div className={styles['info-grid']}>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Status Kepegawaian</span>
                <span className={styles['info-value']}>{formData.statusKepegawaian || '-'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Jabatan</span>
                <span className={styles['info-value']}>{formData.jabatan || '-'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Unit Kerja</span>
                <span className={styles['info-value']}>{formData.unitKerja || '-'}</span>
              </div>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Tanggal Mulai Bekerja</span>
                <span className={styles['info-value']}>
                  {formData.tanggalMulaiBekerja ? formatDateToIndonesian(formData.tanggalMulaiBekerja) : '-'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfileSaya;
