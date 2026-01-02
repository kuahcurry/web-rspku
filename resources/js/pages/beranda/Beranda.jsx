import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import {
  FaChevronRight
} from 'react-icons/fa';
import { useUser } from '../../contexts/UserContext';
import { isAuthenticated, authenticatedFetch } from '../../utils/auth';
import { getDistrictNameById } from '../../services/indonesiaRegion';
import { formatDateToIndonesian } from '../../utils/dateFormatter';
import { fetchDashboardData } from '../../services/apiService';
import styles from './Beranda.module.css';

const getStatusVariant = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aktif') return 'success';
  if (normalized === 'segera habis') return 'warning';
  if (normalized === 'sudah habis' || normalized === 'habis') return 'danger';
  return 'secondary';
};

const Beranda = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [avatarError, setAvatarError] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [districtName, setDistrictName] = useState(null);
  const [progressData, setProgressData] = useState({
    dataPribadi: 0,
    dokumenLegalitas: 0,
    pendidikanPrestasi: 0,
    penugasan: 0,
    kredensialKewenangan: 0,
    etikDisiplin: 0
  });
  const [loading, setLoading] = useState(true);
  
  // State for actual data from each section
  const [dokumenData, setDokumenData] = useState([]);
  const [pendidikanData, setPendidikanData] = useState({});
  const [prestasiData, setPrestasiData] = useState({ Prestasi: [], Penghargaan: [], 'Kompetensi Utama': [] });
  const [penugasanData, setPenugasanData] = useState({ Penugasan: [], Pengabdian: [] });
  const [kredensialData, setKredensialData] = useState([]);
  const [kewenanganData, setKewenanganData] = useState({ SPK: [], RKK: [] });
  const [etikData, setEtikData] = useState({ etik: [], disiplin: [] });

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Wait for user data to be loaded before fetching
    if (user) {
      fetchAllData();
    }
  }, [navigate, user]);

  useEffect(() => {
    // Fetch district name if user has district ID
    const fetchDistrictName = async () => {
      if (user && user.regency && user.district) {
        const name = await getDistrictNameById(user.regency, user.district);
        setDistrictName(name);
      }
    };

    fetchDistrictName();
  }, [user]);

  useEffect(() => {
    // Fetch profile picture
    const fetchProfilePicture = async () => {
      try {
        const response = await authenticatedFetch('/api/profile/foto-profil');
        const data = await response.json();
        if (data.success && data.data.foto_profil_url) {
          setProfilePicture(data.data.foto_profil_url);
        }
      } catch (error) {
        console.error('[Beranda] Error fetching profile picture:', error);
      }
    };

    if (user) {
      fetchProfilePicture();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch all data with caching for better performance
      const data = await fetchDashboardData();
      
      const dokumenData = data.dokumen;
      const pendidikanData = data.pendidikan;
      const penugasanData = data.penugasan;
      const kredensialData = data.kredensial;
      const kewenanganData = data.kewenangan;
      const etikData = data.etik;
      const prestasiData = data.prestasi;

      // Calculate Data Pribadi (15 fields, 9 already filled from registration)
      const dataPribadiFieldsMap = {
        name: user?.name,
        nik: user?.nik,
        tempat: user?.tempat,
        tanggal_lahir: user?.tanggal_lahir,
        jenis_kelamin: user?.jenis_kelamin,
        agama: user?.agama,
        phone: user?.phone,
        address: user?.address,
        province: user?.province,
        regency: user?.regency,
        district: user?.district,
        village: user?.village,
        email: user?.email,
        tanggal_mulai_kerja: user?.tanggal_mulai_kerja,
        status_kepegawaian: user?.status_kepegawaian
      };
      
      const dataPribadiFields = Object.values(dataPribadiFieldsMap);
      const filledFields = dataPribadiFields.filter(field => {
        // Consider 0 as a valid value, only filter out null, undefined, and empty strings
        if (field === null || field === undefined) return false;
        if (typeof field === 'string' && field.trim() === '') return false;
        return true;
      }).length;
      const dataPribadiPercentage = Math.round((filledFields / 15) * 100);

      // Calculate Dokumen Legalitas (3 types: Surat Keterangan, STR, SIP)
      let dokumenCount = 0;
      if (dokumenData.success && dokumenData.data && Array.isArray(dokumenData.data)) {
        const hasSuratKeterangan = dokumenData.data.some(doc => doc.jenis_dokumen === 'Surat Keterangan');
        const hasSTR = dokumenData.data.some(doc => doc.jenis_dokumen === 'STR');
        const hasSIP = dokumenData.data.some(doc => doc.jenis_dokumen === 'SIP');
        
        if (hasSuratKeterangan) dokumenCount++;
        if (hasSTR) dokumenCount++;
        if (hasSIP) dokumenCount++;
      }
      const dokumenPercentage = Math.round((dokumenCount / 3) * 100);

      // Calculate Pendidikan dan Prestasi (6 sections: Ijazah, Sertifikat Pelatihan, Workshop, Prestasi, Penghargaan, Kompetensi Utama)
      let pendidikanCount = 0;
      if (pendidikanData.success && pendidikanData.data) {
        if (pendidikanData.data.Ijazah?.length > 0) pendidikanCount++;
        if (pendidikanData.data['Sertifikat Pelatihan']?.length > 0) pendidikanCount++;
        if (pendidikanData.data['Sertifikat Workshop']?.length > 0) pendidikanCount++;
      }
      if (prestasiData.success && prestasiData.data) {
        if (prestasiData.data.Prestasi?.length > 0) pendidikanCount++;
        if (prestasiData.data.Penghargaan?.length > 0) pendidikanCount++;
        if (prestasiData.data['Kompetensi Utama']?.length > 0) pendidikanCount++;
      }
      const pendidikanPercentage = Math.round((pendidikanCount / 6) * 100);

      // Calculate Penugasan (2 types: Penugasan, Pengabdian)
      let penugasanCount = 0;
      if (penugasanData.success && penugasanData.data) {
        if (penugasanData.data.Penugasan?.length > 0) penugasanCount++;
        if (penugasanData.data.Pengabdian?.length > 0) penugasanCount++;
      }
      const penugasanPercentage = Math.round((penugasanCount / 2) * 100);

      // Calculate Kredensial & Kewenangan Klinis (3 sections: Kredensial, SPK, RKK)
      let kredensialCount = 0;
      if (kredensialData.success && kredensialData.data?.riwayat?.length > 0) kredensialCount++;
      if (kewenanganData.success && kewenanganData.data) {
        if (kewenanganData.data.SPK?.length > 0) kredensialCount++;
        if (kewenanganData.data.RKK?.length > 0) kredensialCount++;
      }
      const kredensialPercentage = Math.round((kredensialCount / 3) * 100);

      // Calculate Riwayat Etik & Disiplin (2 types: Etik, Disiplin)
      let etikCount = 0;
      if (etikData.success && etikData.data) {
        if (etikData.data.etik?.length > 0) etikCount++;
        if (etikData.data.disiplin?.length > 0) etikCount++;
      }
      const etikPercentage = Math.round((etikCount / 2) * 100);

      setProgressData({
        dataPribadi: dataPribadiPercentage,
        dokumenLegalitas: dokumenPercentage,
        pendidikanPrestasi: pendidikanPercentage,
        penugasan: penugasanPercentage,
        kredensialKewenangan: kredensialPercentage,
        etikDisiplin: etikPercentage
      });
      
      // Store actual data for display
      const storedDokumen = dokumenData.success && Array.isArray(dokumenData.data) ? dokumenData.data : [];
      const storedPendidikan = pendidikanData.success ? pendidikanData.data : {};
      const storedPrestasi = prestasiData.success ? prestasiData.data : { Prestasi: [], Penghargaan: [], 'Kompetensi Utama': [] };
      const storedPenugasan = penugasanData.success ? penugasanData.data : { Penugasan: [], Pengabdian: [] };
      const storedKredensial = kredensialData.success && kredensialData.data?.riwayat ? kredensialData.data.riwayat : [];
      const storedKewenangan = kewenanganData.success ? kewenanganData.data : { SPK: [], RKK: [] };
      const storedEtik = etikData.success ? etikData.data : { etik: [], disiplin: [] };
      
      setDokumenData(storedDokumen);
      setPendidikanData(storedPendidikan);
      setPrestasiData(storedPrestasi);
      setPenugasanData(storedPenugasan);
      setKredensialData(storedKredensial);
      setKewenanganData(storedKewenangan);
      setEtikData(storedEtik);
      
      console.log('=== STORED DATA FOR DISPLAY ===');
      console.log('Dokumen stored:', storedDokumen.length, 'items');
      console.log('Sample Dokumen:', storedDokumen[0]);
      console.log('Pendidikan stored:', Object.keys(storedPendidikan).map(k => `${k}: ${storedPendidikan[k]?.length || 0}`));
      console.log('Sample Ijazah:', storedPendidikan.Ijazah?.[0]);
      console.log('Sample Pelatihan:', storedPendidikan['Sertifikat Pelatihan']?.[0]);
      console.log('Sample Workshop:', storedPendidikan['Sertifikat Workshop']?.[0]);
      console.log('Prestasi stored:', storedPrestasi.Prestasi?.length || 0, 'prestasi,', storedPrestasi.Penghargaan?.length || 0, 'penghargaan,', storedPrestasi['Kompetensi Utama']?.length || 0, 'kompetensi utama');
      console.log('Sample Prestasi:', storedPrestasi.Prestasi?.[0]);
      console.log('Sample Penghargaan:', storedPrestasi.Penghargaan?.[0]);
      console.log('Sample Kompetensi Utama:', storedPrestasi['Kompetensi Utama']?.[0]);
      console.log('Penugasan stored:', storedPenugasan.Penugasan?.length || 0, 'penugasan,', storedPenugasan.Pengabdian?.length || 0, 'pengabdian');
      console.log('Sample Penugasan:', storedPenugasan.Penugasan?.[0]);
      console.log('Kredensial stored:', storedKredensial.length, 'items');
      console.log('Sample Kredensial:', storedKredensial[0]);
      console.log('Kewenangan stored:', storedKewenangan.SPK?.length || 0, 'SPK,', storedKewenangan.RKK?.length || 0, 'RKK');
      console.log('Sample SPK:', storedKewenangan.SPK?.[0]);
      console.log('Sample RKK:', storedKewenangan.RKK?.[0]);
      console.log('Etik stored:', storedEtik.etik?.length || 0, 'etik,', storedEtik.disiplin?.length || 0, 'disiplin');
      console.log('Sample Etik:', storedEtik.etik?.[0]);
      console.log('Sample Disiplin:', storedEtik.disiplin?.[0]);
      console.log('===============================');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate work duration in years and months
  const calculateWorkDuration = (startDate) => {
    if (!startDate) return null;
    const today = new Date();
    const start = new Date(startDate);
    const years = today.getFullYear() - start.getFullYear();
    const months = today.getMonth() - start.getMonth();
    const totalMonths = years * 12 + months;
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    
    if (displayYears === 0) {
      return `${displayMonths} Bulan`;
    } else if (displayMonths === 0) {
      return `${displayYears} Tahun`;
    }
    return `${displayYears} Tahun ${displayMonths} Bulan`;
  };

  // Get progress color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage === 100) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const userData = user || {};
  const age = calculateAge(userData.tanggal_lahir);
  const workDuration = calculateWorkDuration(userData.tanggal_mulai_kerja);

  if (userLoading || loading) {
    return (
      <MainLayout 
        title="Beranda" 
        subtitle="Ringkasan informasi profil, progress pengisian, dan data terbaru Anda."
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Memuat data...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Beranda" 
      subtitle="Ringkasan informasi profil, progress pengisian, dan data terbaru Anda."
    >
      <header className={styles['page-header']}>
        <h1 className={styles['page-title']}>Beranda</h1>
        <p className={styles['page-subtitle']}>
          Ringkasan informasi profil, progress pengisian, dan data terbaru Anda.
        </p>
      </header>

      <div className={styles['page-body']}>
        {/* Header Profil */}
        <section className={styles.section}>
          <div className={styles['profile-card']}>
            <div className={styles['profile-content']}>
              <div className={styles['profile-left']}>
                <div className={styles['profile-avatar']}>
                  {profilePicture && !avatarError ? (
                    <img
                      src={profilePicture}
                      alt={userData?.name || 'User'}
                      onError={(e) => {
                        console.error('[Beranda] Image failed to load:', profilePicture, 'Error:', e);
                        setAvatarError(true);
                      }}
                    />
                  ) : (
                    <div className={styles['avatar-initials']}>
                      {userData?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className={styles['profile-info']}>
                  <h2 className={styles['profile-name']}>{userData.name || 'Nama Tidak Tersedia'}</h2>
                  <p className={styles['profile-nip']}>
                    <span>NIP: {userData.nip || 'N/A'}</span>
                    <span className={styles['separator']}>|</span>
                    <span>NIK: {userData.nik || 'N/A'}</span>
                  </p>
                  <div className={styles['profile-badges']}>
                    <Card glass padding="small">
                      <p>{userData.jabatan || 'Jabatan Tidak Tersedia'}</p>
                    </Card>
                    <Card glass padding="small">
                      <p>{userData.status_kepegawaian || 'Belum Diisi'}</p>
                    </Card>
                  </div>
                </div>
              </div>
              <Button variant="inverse" size="medium" icon={<FaChevronRight />} iconPosition="right" onClick={() => navigate('/profil')}>
                Lihat Profil
              </Button>
            </div>
            
            <div className={styles['profile-stats']}>
              <Card glass padding="compact">
                <p>Domisili</p>
                <h1>{districtName || 'Belum Diisi'}</h1>
              </Card>
              <Card glass padding="compact">
                <p>Umur</p>
                <h1>{age !== null ? `${age} Tahun` : 'Belum Diisi'}</h1>
              </Card>
              <Card glass padding="compact">
                <p>Lama Bekerja</p>
                <h1>{workDuration || 'Belum Diisi'}</h1>
              </Card>
              <Card glass padding="compact">
                <p>Unit Kerja</p>
                <h1>{userData.unit_kerja || 'Belum Diisi'}</h1>
              </Card>
            </div>
          </div>
        </section>

        {/* Progress Pengisian */}
        <section className={styles.section}>
          <div className={styles['section-wrapper']}>
            <div className={styles['section-header']}>
              <div className={styles['section-title']}>
                <h3>Progress Pengisian Data</h3>
              </div>
            </div>
            
            <div className={styles['progress-grid']}>
              <Card variant='secondary' padding="normal">
                <div className={styles['progress-item']}>
                  <div className={styles['progress-header']}>
                    <span className={styles['progress-label']}>Data Pribadi</span>
                    <span className={styles['progress-percentage']}>{progressData.dataPribadi}%</span>
                  </div>
                  <div className={styles['progress-bar']}>
                    <div className={`${styles['progress-fill']} ${styles[getProgressColor(progressData.dataPribadi)]}`} style={{width: `${progressData.dataPribadi}%`}}></div>
                  </div>
                </div>
              </Card>
              
              <Card variant='secondary' padding="normal">
                <div className={styles['progress-item']}>
                  <div className={styles['progress-header']}>
                    <span className={styles['progress-label']}>Dokumen Legalitas</span>
                    <span className={styles['progress-percentage']}>{progressData.dokumenLegalitas}%</span>
                  </div>
                  <div className={styles['progress-bar']}>
                    <div className={`${styles['progress-fill']} ${styles[getProgressColor(progressData.dokumenLegalitas)]}`} style={{width: `${progressData.dokumenLegalitas}%`}}></div>
                  </div>
                </div>
              </Card>
              
              <Card variant='secondary' padding="normal">
                <div className={styles['progress-item']}>
                  <div className={styles['progress-header']}>
                    <span className={styles['progress-label']}>Pendidikan dan Prestasi</span>
                    <span className={styles['progress-percentage']}>{progressData.pendidikanPrestasi}%</span>
                  </div>
                  <div className={styles['progress-bar']}>
                    <div className={`${styles['progress-fill']} ${styles[getProgressColor(progressData.pendidikanPrestasi)]}`} style={{width: `${progressData.pendidikanPrestasi}%`}}></div>
                  </div>
                </div>
              </Card>
              
              <Card variant='secondary' padding="normal">
                <div className={styles['progress-item']}>
                  <div className={styles['progress-header']}>
                    <span className={styles['progress-label']}>Penugasan</span>
                    <span className={styles['progress-percentage']}>{progressData.penugasan}%</span>
                  </div>
                  <div className={styles['progress-bar']}>
                    <div className={`${styles['progress-fill']} ${styles[getProgressColor(progressData.penugasan)]}`} style={{width: `${progressData.penugasan}%`}}></div>
                  </div>
                </div>
              </Card>
              
              <Card variant='secondary' padding="normal">
                <div className={styles['progress-item']}>
                  <div className={styles['progress-header']}>
                    <span className={styles['progress-label']}>Kredensial & Kewenangan Klinis</span>
                    <span className={styles['progress-percentage']}>{progressData.kredensialKewenangan}%</span>
                  </div>
                  <div className={styles['progress-bar']}>
                    <div className={`${styles['progress-fill']} ${styles[getProgressColor(progressData.kredensialKewenangan)]}`} style={{width: `${progressData.kredensialKewenangan}%`}}></div>
                  </div>
                </div>
              </Card>
              
              <Card variant='secondary' padding="normal">
                <div className={styles['progress-item']}>
                  <div className={styles['progress-header']}>
                    <span className={styles['progress-label']}>Riwayat Etik & Disiplin</span>
                    <span className={styles['progress-percentage']}>{progressData.etikDisiplin}%</span>
                  </div>
                  <div className={styles['progress-bar']}>
                    <div className={`${styles['progress-fill']} ${styles[getProgressColor(progressData.etikDisiplin)]}`} style={{width: `${progressData.etikDisiplin}%`}}></div>
                  </div>
                </div>
              </Card>
            </div>
        </div>
        </section>

        {/* Ringkasan Dokumen Legalitas */}
        <section className={styles.section}>
          <div className={styles['section-wrapper']}>
            <div className={styles['section-header']}>
              <div className={styles['section-title']}>
                <h3>Dokumen Legalitas</h3>
              </div>
              <Button variant="outline" size="small" icon={<FaChevronRight />} iconPosition="right" onClick={() => navigate('/dokumen')}>
                Lihat Detail
              </Button>
            </div>
            {dokumenData.length === 0 ? (
              <p>Belum ada data dokumen legalitas.</p>
            ) : (
              <div className={styles['legal-grid']}>
              {dokumenData.slice(0, 3).map((doc) => {
                const getDocStatus = (masaBerlaku) => {
                  if (!masaBerlaku) return 'Tidak Diketahui';
                  const expiryDate = new Date(masaBerlaku);
                  const today = new Date();
                  const diffTime = expiryDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays < 0) return 'Sudah Habis';
                  if (diffDays <= 30) return 'Segera Habis';
                  return 'Aktif';
                };
                
                const status = getDocStatus(doc.tanggal_berlaku);
                
                return (
                  <Card
                    key={doc.id}
                    variant="secondary"
                    padding="normal"
                    title={doc.jenis_dokumen}
                    subtitle={doc.nomor_sk}
                    headerAction={
                      <Button variant={getStatusVariant(status)} size="small" disabled>
                        {status}
                      </Button>
                    }
                    className={styles['legal-card']}
                  >
                    <div className={styles['legal-content']}>
                      <div className={styles['legal-info']}>
                        <div className={styles['legal-dates']}>
                          <div className={styles['info-block']}>
                            <span className={styles['info-label']}>Tanggal Mulai</span>
                            <span className={styles['info-value']}>{formatDateToIndonesian(doc.tanggal_mulai)}</span>
                          </div>
                          <div className={styles['info-block']}>
                            <span className={styles['info-label']}>Berlaku Sampai</span>
                            <span className={styles['info-value']}>{formatDateToIndonesian(doc.tanggal_berlaku)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          </div>
        </section>

        {/* Ringkasan Data Terbaru */}
        
        {/* Card 1: Riwayat Pendidikan Terbaru */}
        <section className={styles.section}>
          <div className={styles['section-wrapper']}>
            <div className={styles['section-header']}>
              <div className={styles['section-title']}>
                <h3>Pendidikan dan Prestasi Terkini</h3>
              </div>
              <Button variant="outline" icon={<FaChevronRight />} iconPosition="right" size="small" onClick={() => navigate('/riwayat-pendidikan')}>
                Lihat Detail
              </Button>
            </div>
          
          <div className={styles['education-section']}>
            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Pendidikan</h4>
              {pendidikanData.Ijazah && pendidikanData.Ijazah.length > 0 ? (
                pendidikanData.Ijazah.slice(0, 1).map((item) => (
                  <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                    <div className={styles['education-grid']}>
                      <div className={styles['education-main']}>{item.judul || 'Belum Mengisi/Tidak Ada'} - {item.institusi || 'Belum Mengisi/Tidak Ada'}</div>
                      <div className={styles['education-meta']}>{item.tahun_lulus || 'Belum Mengisi/Tidak Ada'}</div>
                    </div>
                  </Card>
                ))
              ) : (
                <p>Belum Mengisi/Tidak Ada</p>
              )}
            </Card>

            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Pelatihan Terbaru</h4>
              {pendidikanData['Sertifikat Pelatihan'] && pendidikanData['Sertifikat Pelatihan'].length > 0 ? (
                pendidikanData['Sertifikat Pelatihan'].slice(0, 1).map((item) => (
                  <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                    <div className={styles['certification-name']}>{item.judul || 'Belum Mengisi/Tidak Ada'}</div>
                    <div className={styles['education-grid']}>
                      <div className={styles['certification-main']}>{item.institusi || 'Belum Mengisi/Tidak Ada'}</div>
                      <div className={styles['certification-meta']}>{item.tahun_lulus || 'Belum Mengisi/Tidak Ada'}</div>
                    </div>
                  </Card>
                ))
              ) : (
                <p>Belum Mengisi/Tidak Ada</p>
              )}
            </Card>

            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Workshop Terbaru</h4>
              {pendidikanData['Sertifikat Workshop'] && pendidikanData['Sertifikat Workshop'].length > 0 ? (
                pendidikanData['Sertifikat Workshop'].slice(0, 1).map((item) => (
                  <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                    <div className={styles['education-grid']}>
                      <div className={styles['workshop-main']}>{item.judul || 'Belum Mengisi/Tidak Ada'}</div>
                      <div className={styles['workshop-meta']}>{item.tahun_lulus || 'Belum Mengisi/Tidak Ada'}</div>
                    </div>
                  </Card>
                ))
              ) : (
                <p>Belum Mengisi/Tidak Ada</p>
              )}
            </Card>

            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Prestasi Terbaru</h4>
              {prestasiData.Prestasi && prestasiData.Prestasi.length > 0 ? (
                prestasiData.Prestasi.slice(0, 1).map((item) => (
                  <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                    <div className={styles['education-grid']}>
                      <div className={styles['workshop-main']}>{item.judul || 'Belum Mengisi/Tidak Ada'}</div>
                      <div className={styles['workshop-meta']}>{item.tahun || 'Belum Mengisi/Tidak Ada'}</div>
                    </div>
                  </Card>
                ))
              ) : (
                <p>Belum Mengisi/Tidak Ada</p>
              )}
            </Card>

            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Penghargaan Terbaru</h4>
              {prestasiData.Penghargaan && prestasiData.Penghargaan.length > 0 ? (
                prestasiData.Penghargaan.slice(0, 1).map((item) => (
                  <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                    <div className={styles['education-grid']}>
                      <div className={styles['workshop-main']}>{item.judul || 'Belum Mengisi/Tidak Ada'}</div>
                      <div className={styles['workshop-meta']}>{item.tahun || 'Belum Mengisi/Tidak Ada'}</div>
                    </div>
                  </Card>
                ))
              ) : (
                <p>Belum Mengisi/Tidak Ada</p>
              )}
            </Card>

            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Kompetensi Utama Terbaru</h4>
              {prestasiData['Kompetensi Utama'] && prestasiData['Kompetensi Utama'].length > 0 ? (
                prestasiData['Kompetensi Utama'].slice(0, 1).map((item) => (
                  <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                    <div className={styles['education-grid']}>
                      <div className={styles['workshop-main']}>{item.judul || 'Belum Mengisi/Tidak Ada'}</div>
                      <div className={styles['workshop-meta']}>{item.tahun || 'Belum Mengisi/Tidak Ada'}</div>
                    </div>
                  </Card>
                ))
              ) : (
                <p>Belum Mengisi/Tidak Ada</p>
              )}
            </Card>
          </div>
          </div>
        </section>

        {/* Card 2: Penugasan Klinik */}
        <section className={styles.section}>
          <div className={styles['section-wrapper']}>
            <div className={styles['section-header']}>
              <div className={styles['section-title']}>
                <h3>Penugasan</h3>
              </div>
              <Button variant="outline" size="small" icon={<FaChevronRight />} iconPosition="right" onClick={() => navigate('/penugasan')}>
                Lihat Detail
              </Button>
            </div>
          
          <div className={styles['education-section']}>
            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Penugasan</h4>
              {penugasanData.Penugasan && penugasanData.Penugasan.length > 0 ? (
                penugasanData.Penugasan.slice(0, 1).map((item) => {
                  const getStatus = (tanggalSelesai) => {
                    const endDate = new Date(tanggalSelesai);
                    const today = new Date();
                    return endDate >= today ? 'Aktif' : 'Sebelumnya';
                  };
                  
                  const status = getStatus(item.tanggal_selesai);
                  const formatPeriod = (start, end) => {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                    return `${months[startDate.getMonth()]} ${startDate.getFullYear()} - ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
                  };
                  
                  return (
                    <Card key={item.id} variant='inverse' padding="compact" className={styles['detail-card']}>
                      <div className={styles['assignment-header']}>
                        <span className={styles['assignment-subtitle']}>{item.unit || 'Belum Mengisi/Tidak Ada'}</span>
                        <div className={styles['status-button-wrapper']}>
                          <Button variant={status === 'Aktif' ? 'success' : 'secondary'} size="small">{status}</Button>
                        </div>
                      </div>
                      <div className={styles['assignment-grid']}>
                        <div className={styles['assignment-period']}>Periode</div>
                        <div className={styles['assignment-supervisor']}>Penanggung Jawab</div>
                      </div>
                      <div className={styles['assignment-grid']}>
                        <div className={`${styles['assignment-period']} ${styles.value}`}>
                          {formatPeriod(item.tanggal_mulai, item.tanggal_selesai)}
                        </div>
                        <div className={`${styles['assignment-supervisor']} ${styles.value}`}>{item.penanggung_jawab || 'Belum Mengisi/Tidak Ada'}</div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <p>Belum Mengisi/Tidak Ada</p>
              )}
            </Card>

            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Pengabdian</h4>
              {penugasanData.Pengabdian && penugasanData.Pengabdian.length > 0 ? (
                penugasanData.Pengabdian.slice(0, 1).map((item) => {
                  const getStatus = (tanggalSelesai) => {
                    const endDate = new Date(tanggalSelesai);
                    const today = new Date();
                    return endDate >= today ? 'Aktif' : 'Sebelumnya';
                  };
                  
                  const status = getStatus(item.tanggal_selesai);
                  const formatPeriod = (start, end) => {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                    return `${months[startDate.getMonth()]} ${startDate.getFullYear()} - ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
                  };
                  
                  return (
                    <Card key={item.id} variant='inverse' padding="compact" className={styles['detail-card']}>
                      <div className={styles['assignment-header']}>
                        <span className={styles['assignment-subtitle']}>{item.unit || 'Belum Mengisi/Tidak Ada'}</span>
                        <div className={styles['status-button-wrapper']}>
                          <Button variant={status === 'Aktif' ? 'success' : 'secondary'} size="small">{status}</Button>
                        </div>
                      </div>
                      <div className={styles['assignment-grid']}>
                        <div className={styles['assignment-period']}>Periode</div>
                        <div className={styles['assignment-supervisor']}>Peran / Posisi</div>
                      </div>
                      <div className={styles['assignment-grid']}>
                        <div className={`${styles['assignment-period']} ${styles.value}`}>
                          {formatPeriod(item.tanggal_mulai, item.tanggal_selesai)}
                        </div>
                        <div className={`${styles['assignment-supervisor']} ${styles.value}`}>{item.penanggung_jawab || 'Belum Mengisi/Tidak Ada'}</div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <p>Belum Mengisi/Tidak Ada</p>
              )}
            </Card>
          </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles['section-wrapper']}>
            <div className={styles['section-header']}>
              <div className={styles['section-title']}>
                <h3>Kredensial & Kewenangan Klinis</h3>
              </div>
              <Button variant="outline" size="small" icon={<FaChevronRight />} iconPosition="right" onClick={() => navigate('/kredensial')}>
              Lihat Detail
            </Button>
          </div>
          
              <div className={styles['education-section']}>
                <Card variant='secondary' padding="normal">
                  <h4 className={styles['education-subtitle']}>Kredensial</h4>
                  {kredensialData.length > 0 ? (
                    kredensialData.slice(0, 1).map((item) => (
                      <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                        <div className={styles['credential-item-content']}>
                          <div className={styles['credential-item-main']}>
                            <span className={styles['credential-subtitle']}>{item.nama_kegiatan}</span>
                            <div className={styles['credential-grid']}>
                              <span className={styles['credential-date']}>{formatDateToIndonesian(item.tanggal_berlaku)}</span>
                              <span className={styles['credential-skp']}>{item.skp_yang_didapat ? `${item.skp_yang_didapat} SKP` : ' '}</span>
                            </div>
                          </div>
                          <div className={styles['status-button-wrapper']}>
                            <Button 
                              variant={item.hasil_penilaian === 'Kompeten' ? 'success' : item.hasil_penilaian === 'Tidak Kompeten' ? 'danger' : 'secondary'} 
                              size="small"
                            >
                              {item.hasil_penilaian || 'Pending'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p>Belum ada data kredensial.</p>
                  )}
                </Card>

                <Card variant='secondary' padding="normal">
                  <h4 className={styles['education-subtitle']}>SPK (Surat Penugasan Klinis)</h4>
                  {kewenanganData.SPK && kewenanganData.SPK.length > 0 ? (
                    kewenanganData.SPK.slice(0, 1).map((item) => (
                      <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                        <div className={styles['credential-item-content']}>
                          <div className={styles['credential-item-main']}>
                            <span className={styles['credential-subtitle']}>No. Dokumen: {item.nomor_dokumen || 'Belum Mengisi/Tidak Ada'}</span>
                            <div className={styles['credential-grid']}>
                              <span className={styles['credential-date']}>{formatDateToIndonesian(item.tanggal_terbit)}</span>
                              <span className={styles['credential-skp']}>Berlaku: {formatDateToIndonesian(item.masa_berlaku)}</span>
                            </div>
                          </div>
                          <div className={styles['status-button-wrapper']}>
                            <Button variant={item.status === 'Aktif' ? 'success' : 'danger'} size="small">
                              {item.status || 'Tidak Diketahui'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p>Belum Mengisi/Tidak Ada</p>
                  )}
                </Card>

                <Card variant='secondary' padding="normal">
                  <h4 className={styles['education-subtitle']}>RKK (Rincian Kewenangan Klinis)</h4>
                  {kewenanganData.RKK && kewenanganData.RKK.length > 0 ? (
                    kewenanganData.RKK.slice(0, 1).map((item) => (
                      <Card key={item.id} variant='inverse' className={styles['detail-card']}>
                        <div className={styles['credential-item-content']}>
                          <div className={styles['credential-item-main']}>
                            <span className={styles['credential-subtitle']}>No. Dokumen: {item.nomor_dokumen || 'Belum Mengisi/Tidak Ada'}</span>
                            <div className={styles['credential-grid']}>
                              <span className={styles['credential-date']}>{formatDateToIndonesian(item.tanggal_terbit)}</span>
                              <span className={styles['credential-skp']}>Berlaku: {formatDateToIndonesian(item.masa_berlaku)}</span>
                            </div>
                          </div>
                          <div className={styles['status-button-wrapper']}>
                            <Button variant={item.status === 'Aktif' ? 'success' : 'danger'} size="small">
                              {item.status || 'Tidak Diketahui'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p>Belum Mengisi/Tidak Ada</p>
                  )}
                </Card>
              </div>
          </div>
        </section>

        {/* Card 4: Etik & Disiplin */}
        <section className={styles.section}>
          <div className={styles['section-wrapper']}>
            <div className={styles['section-header']}>
              <div className={styles['section-title']}>
                <h3>Riwayat Etik & Disiplin</h3>
              </div>
              <Button variant="outline" size="small" icon={<FaChevronRight />} iconPosition="right" onClick={() => navigate('/riwayat-etik')}>
                Lihat Detail
              </Button>
            </div>
            
            <div className={styles['education-section']}>
                <Card variant='secondary' padding="normal">
                  <h4 className={styles['education-subtitle']}>Riwayat Etik</h4>
                  {etikData.etik && etikData.etik.length > 0 ? (
                    etikData.etik.slice(0, 1).map((item) => (
                      <Card key={item.id} variant='inverse' padding='compact' className={styles['detail-card']}>
                        <div className={styles['ethics-item-content']}>
                          <div className={styles['ethics-item-main']}>
                            <span className={styles['ethics-subtitle']}>{item.jenis_pelanggaran || 'Belum Mengisi/Tidak Ada'}</span>
                            <span className={styles['ethics-date']}>{formatDateToIndonesian(item.tanggal_kejadian)}</span>
                          </div>
                          {item.status_penyelesaian && (
                            <div className={styles['status-button-wrapper']}>
                              <Button variant="success" size="small">{item.status_penyelesaian}</Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p>Belum Mengisi/Tidak Ada</p>
                  )}
                </Card>

                <Card variant='secondary' padding="normal">
                  <h4 className={styles['education-subtitle']}>Riwayat Disiplin</h4>
                  {etikData.disiplin && etikData.disiplin.length > 0 ? (
                    etikData.disiplin.slice(0, 1).map((item) => (
                      <Card key={item.id} variant='inverse' padding='compact' className={styles['detail-card']}>
                        <div className={styles['ethics-item-content']}>
                          <div className={styles['ethics-item-main']}>
                            <span className={styles['ethics-subtitle']}>{item.jenis_pelanggaran || 'Belum Mengisi/Tidak Ada'}</span>
                            <span className={styles['ethics-date']}>{formatDateToIndonesian(item.tanggal_kejadian)}</span>
                          </div>
                          {item.status_penyelesaian && (
                            <div className={styles['status-button-wrapper']}>
                              <Button variant="success" size="small">{item.status_penyelesaian}</Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p>Belum Mengisi/Tidak Ada</p>
                  )}
                </Card>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Beranda;
