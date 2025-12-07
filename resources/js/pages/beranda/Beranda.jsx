import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import {
  FaChevronRight
} from 'react-icons/fa';
import { getUser, isAuthenticated } from '../../utils/auth';
import styles from './Beranda.module.css';

const legalDocs = [
  {
    id: 'surat-keterangan',
    title: 'Surat Keterangan',
    expires: '31/12/2025',
    status: 'Aktif'
  },
  {
    id: 'str',
    title: 'STR (Surat Tanda Registrasi)',
    expires: '15/02/2025',
    status: 'Segera Habis'
  },
  {
    id: 'sip',
    title: 'SIP (Surat Izin Praktek)',
    expires: '31/12/2023',
    status: 'Sudah Habis'
  }
];

const getStatusVariant = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aktif') return 'success';
  if (normalized === 'segera habis') return 'warning';
  if (normalized === 'sudah habis' || normalized === 'habis') return 'danger';
  return 'secondary';
};

const Beranda = () => {
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const avatarUrl = 'https://i.pravatar.cc/160?img=64';

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Get user data from localStorage
    const user = getUser();
    if (user) {
      setUserData(user);
    }
    setLoading(false);
  }, [navigate]);

  // Calculate age from date of birth (if available)
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate work duration (if available)
  const calculateWorkDuration = (startDate) => {
    if (!startDate) return 'N/A';
    const today = new Date();
    const start = new Date(startDate);
    const years = today.getFullYear() - start.getFullYear();
    const months = today.getMonth() - start.getMonth();
    const totalMonths = years * 12 + months;
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    return `${displayYears} Tahun ${displayMonths} Bulan`;
  };

  if (loading) {
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
      {/* Header Profil */}
      <div className={styles.section}>
        <div className={styles['profile-card']}>
          <div className={styles['profile-content']}>
            <div className={styles['profile-left']}>
              <div className={styles['profile-avatar']}>
                {!avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={userData?.name || 'User'}
                    onError={() => setAvatarError(true)}
                  />
                ) : null}
              </div>
              <div className={styles['profile-info']}>
                <h2 className={styles['profile-name']}>{userData?.name || 'Nama Tidak Tersedia'}</h2>
                <p className={styles['profile-nip']}>
                  <span>NIP: {userData?.nip || 'N/A'}</span>
                  <span className={styles['separator']}>|</span>
                  <span>NIK: {userData?.nik || 'N/A'}</span>
                </p>
                <div className={styles['profile-badges']}>
                  <Card glass padding="small">
                    <p>{userData?.position || 'Jabatan Tidak Tersedia'}</p>
                  </Card>
                  <Card glass padding="small">
                    <p>Status: {userData?.employment_status || 'Belum Diisi'}</p>
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
              <h1>{userData?.regency && userData?.province ? `${userData.regency}, ${userData.province}` : 'Belum Diisi'}</h1>
            </Card>
            <Card glass padding="compact">
              <p>Umur</p>
              <h1>{userData?.date_of_birth ? `${calculateAge(userData.date_of_birth)} Tahun` : 'Belum Diisi'}</h1>
            </Card>
            <Card glass padding="compact">
              <p>Lama Bekerja</p>
              <h1>{userData?.start_work_date ? calculateWorkDuration(userData.start_work_date) : 'Belum Diisi'}</h1>
            </Card>
            <Card glass padding="compact">
              <p>Unit Kerja</p>
              <h1>{userData?.work_unit || 'Belum Diisi'}</h1>
            </Card>
          </div>
        </div>

        {/* Progress Pengisian */}
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
                  <span className={styles['progress-percentage']}>100%</span>
                </div>
                <div className={styles['progress-bar']}>
                  <div className={`${styles['progress-fill']} ${styles.success}`} style={{width: '100%'}}></div>
                </div>
              </div>
            </Card>
            
            <Card variant='secondary' padding="normal">
              <div className={styles['progress-item']}>
                <div className={styles['progress-header']}>
                  <span className={styles['progress-label']}>Dokumen Legalitas</span>
                  <span className={styles['progress-percentage']}>100%</span>
                </div>
                <div className={styles['progress-bar']}>
                  <div className={`${styles['progress-fill']} ${styles.success}`} style={{width: '100%'}}></div>
                </div>
              </div>
            </Card>
            
            <Card variant='secondary' padding="normal">
              <div className={styles['progress-item']}>
                <div className={styles['progress-header']}>
                  <span className={styles['progress-label']}>Riwayat Pendidikan</span>
                  <span className={styles['progress-percentage']}>15%</span>
                </div>
                <div className={styles['progress-bar']}>
                  <div className={`${styles['progress-fill']} ${styles.danger}`} style={{width: '15%'}}></div>
                </div>
              </div>
            </Card>
            
            <Card variant='secondary' padding="normal">
              <div className={styles['progress-item']}>
                <div className={styles['progress-header']}>
                  <span className={styles['progress-label']}>Penugasan Klinik</span>
                  <span className={styles['progress-percentage']}>90%</span>
                </div>
                <div className={styles['progress-bar']}>
                  <div className={`${styles['progress-fill']} ${styles.warning}`} style={{width: '90%'}}></div>
                </div>
              </div>
            </Card>
            
            <Card variant='secondary' padding="normal">
              <div className={styles['progress-item']}>
                <div className={styles['progress-header']}>
                  <span className={styles['progress-label']}>Kredensial</span>
                  <span className={styles['progress-percentage']}>75%</span>
                </div>
                <div className={styles['progress-bar']}>
                  <div className={`${styles['progress-fill']} ${styles.warning}`} style={{width: '75%'}}></div>
                </div>
              </div>
            </Card>
            
            <Card variant='secondary' padding="normal">
              <div className={styles['progress-item']}>
                <div className={styles['progress-header']}>
                  <span className={styles['progress-label']}>Etik & Disiplin</span>
                  <span className={styles['progress-percentage']}>100%</span>
                </div>
                <div className={styles['progress-bar']}>
                  <div className={`${styles['progress-fill']} ${styles.success}`} style={{width: '100%'}}></div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Ringkasan Dokumen Legalitas */}
        <div className={styles['section-wrapper']}>
          <div className={styles['section-header']}>
            <div className={styles['section-title']}>
              <h3>Dokumen Legalitas</h3>
            </div>
            <Button variant="outline" size="small" icon={<FaChevronRight />} iconPosition="right" onClick={() => navigate('/dokumen')}>
              Lihat Detail
            </Button>
          </div>
          {legalDocs.length === 0 ? (
            <p>Belum ada data dokumen legalitas.</p>
          ) : (
            <div className={styles['documents-grid']}>
              {legalDocs.map((doc) => (
                <Card key={doc.id} variant="secondary" padding="normal">
                  <div className={styles['documents-item-content']}>
                    <div>
                      <p className={styles['documents-subtitle']}>{doc.title}</p>
                      <span className={styles['documents-main']}>Berlaku sampai {doc.expires}</span>
                    </div>
                    <div className={styles['status-button-wrapper']}>
                      <Button variant={getStatusVariant(doc.status)} size="small" disabled>
                        {doc.status}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Ringkasan Data Terbaru */}
        
        {/* Card 1: Riwayat Pendidikan Terbaru */}
        <div className={styles['section-wrapper']}>
          <div className={styles['section-header']}>
            <div className={styles['section-title']}>
              <h3>Riwayat Pendidikan Terbaru</h3>
            </div>
            <Button variant="outline" icon={<FaChevronRight />} iconPosition="right" size="small" onClick={() => navigate('/riwayat-pendidikan')}>
              Lihat Detail
            </Button>
          </div>
          
          <div className={styles['education-section']}>
            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Pendidikan</h4>
              <div className={styles['education-grid']}>
                <div className={styles['education-main']}>S1 Keperawatan</div>
                <div className={styles['education-meta']}>2022</div>
              </div>
              <div className={styles['education-grid']}>
                <div className={styles['education-main']}>D3 Keperawatan</div>
                <div className={styles['education-meta']}>2018</div>
              </div>
            </Card>

            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Pelatihan Terbaru</h4>
              <div className={styles['certification-grid']}>
                <Card variant='inverse' className={styles['detail-card']}>
                  <div className={styles['certification-name']}>BTCLS (Basic Trauma Cardiac Life Support)</div>
                  <div className={styles['certification-grid']}>
                    <div className={styles['certification-main']}>RS PKU Muhammadiyah</div>
                    <div className={styles['certification-meta']}>2024</div>
                  </div>
                </Card>
                <Card variant='inverse' className={styles['detail-card']}>
                  <div className={styles['certification-name']}>PPGD (Pelatihan Pertolongan Gawat Darurat)</div>
                  <div className={styles['certification-grid']}>
                    <div className={styles['certification-main']}>RS PKU Muhammadiyah</div>
                    <div className={styles['certification-meta']}>2023</div>
                  </div>
                </Card>
              </div>
            </Card>

            <Card variant='secondary' padding="normal">
              <h4 className={styles['education-subtitle']}>Workshop Terbaru</h4>
              <div className={styles['workshop-grid']}>
                <Card variant='inverse' className={styles['detail-card']}>
                  <div className={styles['workshop-main']}>Patient Safety</div>
                  <div className={styles['workshop-meta']}>2024</div>
                </Card>
                <Card variant='inverse' className={styles['detail-card']}>
                  <div className={styles['workshop-main']}>Infection Control</div>
                  <div className={styles['workshop-meta']}>2023</div>
                </Card>
                <Card variant='inverse' className={styles['detail-card']}>
                  <div className={styles['workshop-main']}>Komunikasi Terapeutik</div>
                  <div className={styles['workshop-meta']}>2023</div>
                </Card>
              </div>
            </Card>
          </div>
        </div>

        {/* Card 2: Penugasan Klinik */}
        <div className={styles['section-wrapper']}>
          <div className={styles['section-header']}>
            <div className={styles['section-title']}>
              <h3>Penugasan Klinik</h3>
            </div>
            <Button variant="outline" size="small" icon={<FaChevronRight />} iconPosition="right" onClick={() => navigate('/penugasan')}>
              Lihat Detail
            </Button>
          </div>
          
          <div className={styles['education-section']}>
            <Card variant='secondary' padding="compact">
              <div className={styles['assignment-header']}>
                <span className={styles['assignment-subtitle']}>IGD (Instalasi Gawat Darurat)</span>
                <div className={styles['status-button-wrapper']}>
                  <Button variant="success" size="small">Aktif</Button>
                </div>
              </div>
              <div className={styles['assignment-grid']}>
                <div className={styles['assignment-period']}>Periode</div>
                <div className={styles['assignment-supervisor']}>Pembimbing</div>
              </div>
              <div className={styles['assignment-grid']}>
                <div className={`${styles['assignment-period']} ${styles.value}`}>Jan - Mar 2024</div>
                <div className={`${styles['assignment-supervisor']} ${styles.value}`}>Ns. Andi Prasetyo, S.Kep</div>
              </div>
            </Card>

            <Card variant='secondary' padding="compact">
              <div className={styles['assignment-header']}>
                <span className={styles['assignment-subtitle']}>ICU (Intensive Care Unit)</span>
                <div className={styles['status-button-wrapper']}>
                  <Button variant="secondary" size="small">Sebelumnya</Button>
                </div>
              </div>
              <div className={styles['assignment-grid']}>
                <div className={styles['assignment-period']}>Periode</div>
                <div className={styles['assignment-supervisor']}>Pembimbing</div>
              </div>
              <div className={styles['assignment-grid']}>
                <div className={`${styles['assignment-period']} ${styles.value}`}>Okt - Des 2023</div>
                <div className={`${styles['assignment-supervisor']} ${styles.value}`}>Ns. Budi Santoso, S.Kep</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Card 3: Kredensial / Rekredensial */}
        <div className={styles['section-wrapper']}>
          <div className={styles['section-header']}>
            <div className={styles['section-title']}>
              <h3>Kredensial / Rekredensial</h3>
            </div>
            <Button variant="outline" size="small" icon={<FaChevronRight />} iconPosition="right">
              Lihat Detail
            </Button>
          </div>
          
              <div className={styles['credential-section']}>
                <Card variant='secondary' className={styles['detail-card']}>
                  <div className={styles['credential-item-content']}>
                    <div className={styles['credential-item-main']}>
                      <span className={styles['credential-subtitle']}>Observasi Klinis IGD</span>
                      <div className={styles['credential-grid']}>
                        <span className={styles['credential-date']}>12 Jan 2024</span>
                        <span className={styles['credential-skp']}> </span>
                      </div>
                    </div>
                    <div className={styles['status-button-wrapper']}>
                      <Button variant="success" size="small">Diverifikasi</Button>
                    </div>
                  </div>
                </Card>
                <Card variant='secondary' className={styles['detail-card']}>
                  <div className={styles['credential-item-content']}>
                    <div className={styles['credential-item-main']}>
                      <span className={styles['credential-subtitle']}>Seminar Patient Safety</span>
                      <div className={styles['credential-grid']}>
                        <span className={styles['credential-date']}>03 Feb 2024</span>
                        <span className={styles['credential-skp']}>3 SKP</span>
                      </div>
                    </div>
                    <div className={styles['status-button-wrapper']}>
                      <Button variant="success" size="small">Tervalidasi</Button>
                    </div>
                  </div>
                </Card>
              </div>
          
        </div>

        {/* Card 4: Etik & Disiplin */}
        <div className={styles['section-wrapper']}>
          <div className={styles['section-header']}>
            <div className={styles['section-title']}>
              <h3>Riwayat Etik & Disiplin</h3>
            </div>
            <Button variant="outline" size="small" icon={<FaChevronRight />} iconPosition="right">
              Lihat Detail
            </Button>
          </div>
          
          <div className={styles['credential-section']}>
              <Card variant='secondary' padding='normal'>
                <div className={styles['ethics-item-content']}>
                  <div className={styles['ethics-item-main']}>
                    <span className={styles['ethics-subtitle']}>Mengabaikan Prosedur Keselamatan Pasien</span>
                    <span className={styles['ethics-date']}>12 Apr 2023</span>
                  </div>
                </div>
              </Card>
              <Card variant='secondary' padding='normal'>
                <div className={styles['ethics-item-content']}>
                  <div className={styles['ethics-item-main']}>
                    <span className={styles['ethics-subtitle']}>Terlambat shift pagi</span>
                    <span className={styles['ethics-date']}>05 Feb 2023</span>
                  </div>
                  <div className={styles['status-button-wrapper']}>
                    <Button variant="success" size="small">Sudah Dibina</Button>
                  </div>
                </div>
              </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Beranda;



