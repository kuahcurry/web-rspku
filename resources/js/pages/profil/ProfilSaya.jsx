import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Button from '../../components/button/Button';
import { FaEdit } from 'react-icons/fa';
import { useUser } from '../../contexts/UserContext';
import { isAuthenticated } from '../../utils/auth';
import { getProvinceNameById, getRegencyNameById, getDistrictNameById, getVillageNameById } from '../../services/indonesiaRegion';
import { formatDateToIndonesian } from '../../utils/dateFormatter';
import styles from './ProfilSaya.module.css';

const ProfileSaya = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [avatarError, setAvatarError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('https://i.pravatar.cc/300?img=64');
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
    }
  }, [navigate, user]);

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

      {/* Profile Header Card */}
      <div className={styles.section}>
        <div className={styles['profile-header-card']}>
        <div className={styles['profile-header-content']}>
          <div className={styles['profile-header-left']}>
            <div className={styles['profile-header-avatar']}>
              {!avatarError ? (
                <img src={avatarUrl} alt="Foto Profil" onError={() => setAvatarError(true)} />
              ) : (
                <MdPerson className={styles['avatar-placeholder']} />
              )}
            </div>
            <div className={styles['profile-header-info']}>
              <h2 className={styles['profile-header-name']}>{formData.namaLengkap || 'Nama Lengkap'}</h2>
              <p className={styles['profile-header-nik']}>
                {formData.nik ? `NIK: ${formData.nik}` : 'NIK belum tersedia'}
              </p>
              <p className={styles['profile-header-nik']}>
                {formData.nip ? `NIP: ${formData.nip}` : 'NIP belum tersedia'}
              </p>
            </div>
          </div>
          <div className={styles['profile-header-right']}>
            <Button variant="inverse" size="medium" icon={<FaEdit />} iconPosition="left" onClick={() => navigate('/pengaturan')}>
              Edit Profil
            </Button>
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className={styles['section-wrapper']}>
          <div className={styles['section-header']}>
            <div className={styles['section-header-left']}>
              <h3 className={styles['section-title']}>Informasi Pribadi</h3>
            </div>
          </div>
          <div className={styles['section-content']}>
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
        </div>
      </div>

        {/* Employment Information */}
      <div className={styles['section-wrapper']}>
          <div className={styles['section-header']}>
            <div className={styles['section-header-left']}>
              <h3 className={styles['section-title']}>Informasi Kepegawaian</h3>
            </div>
          </div>
          <div className={styles['section-content']}>
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
                <span className={styles['info-value']}>{formData.tanggalMulaiBekerja ? formatDateToIndonesian(formData.tanggalMulaiBekerja) : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfileSaya;
