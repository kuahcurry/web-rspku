import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Tabs from '../../../components/tabs/Tabs';
import Table from '../../../components/table/Table';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import Popup from '../../../components/popup/Popup';
import { authenticatedFetch } from '../../../utils/auth';
import styles from './DetailPengguna.module.css';

const tabs = [
  { key: 'profil', label: 'Profil' },
  { key: 'dokumen', label: 'Dokumen Legalitas' },
  { key: 'pendidikan', label: 'Riwayat Pendidikan' },
  { key: 'penugasan', label: 'Penugasan' },
  { key: 'prestasi', label: 'Prestasi & Penghargaan' },
  { key: 'kredensial', label: 'Kredensial' },
  { key: 'kewenangan', label: 'Status Kewenangan' },
  { key: 'etik', label: 'Etik & Disiplin' }
];

const DetailPengguna = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [education, setEducation] = useState([]);
  const [ethics, setEthics] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [popup, setPopup] = useState({ isVisible: false, message: '', type: 'info' });
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docItem, setDocItem] = useState(null);
  const [docUrl, setDocUrl] = useState('');

  // Mock user data - In production, this would come from API
  const mockUser = {
    id: 1,
    nip: '198501152010011001',
    nik: '3302151505850001',
    name: 'Dr. Ahmad Sudirman, Sp.PD',
    email: 'ahmad.sudirman@pku.com',
    phone: '081234567890',
    verified: true,
    province: 'Jawa Tengah',
    regency: 'Kebumen',
    district: 'Gombong',
    village: 'Semanding',
    address: 'Jl. Yos Sudarso No. 15',
    tempat_lahir: 'Kebumen',
    tanggal_lahir: '1985-01-15',
    jenis_kelamin: 'Laki-laki',
    agama: 'Islam',
    status_kepegawaian: 'Pegawai Tetap',
    tanggal_mulai_kerja: '2010-01-01',
    foto_profil: null
  };

  const mockDocuments = [
    { id: 1, jenis: 'STR', nomor: 'STR-001-2023-0001', tanggal_terbit: '2023-01-15', tanggal_kadaluwarsa: '2028-01-15', status: 'Aktif', file: 'str_ahmad.pdf' },
    { id: 2, jenis: 'SIP', nomor: 'SIP-001-2023-0002', tanggal_terbit: '2023-02-01', tanggal_kadaluwarsa: '2026-02-01', status: 'Aktif', file: 'sip_ahmad.pdf' },
    { id: 3, jenis: 'Surat Keterangan', nomor: 'SK-2023-001', tanggal_terbit: '2023-01-01', tanggal_kadaluwarsa: null, status: 'Aktif', file: 'sk_ahmad.pdf' }
  ];

  const mockEducation = [
    { id: 1, jenis: 'Ijazah', judul: 'S1 Kedokteran', institusi: 'Universitas Gadjah Mada', tahun: '2008', file: 'ijazah_s1.pdf' },
    { id: 2, jenis: 'Ijazah', judul: 'Spesialis Penyakit Dalam', institusi: 'Universitas Indonesia', tahun: '2015', file: 'ijazah_spesialis.pdf' },
    { id: 3, jenis: 'Sertifikat Pelatihan', judul: 'ACLS Provider', institusi: 'PERKI', tahun: '2022', file: 'sertifikat_acls.pdf' },
    { id: 4, jenis: 'Sertifikat Workshop', judul: 'Penanganan COVID-19', institusi: 'RS PKU Muhammadiyah Gombong', tahun: '2020', file: 'workshop_covid.pdf' }
  ];

  const mockEthics = [
    { id: 1, jenis: 'Etik', keterangan: 'Tidak ada catatan pelanggaran etik', tanggal: '2023-12-01', status: 'Bersih', file: 'etik_2023.pdf' }
  ];

  const mockCredentials = [
    { id: 1, jenis: 'Observasi Klinis', nomor: 'OBS-2023-001', tanggal_terbit: '2023-01-10', tanggal_kadaluwarsa: '2025-01-10', status: 'Aktif', file: 'observasi_klinis.pdf' },
    { id: 2, jenis: 'Uji Kompetensi Klinis', nomor: 'UKK-2023-002', tanggal_terbit: '2023-02-05', tanggal_kadaluwarsa: '2025-02-05', status: 'Aktif', file: 'uji_kompetensi_klinis.pdf' },
    { id: 3, jenis: 'Praktik Mandiri Terbimbing', nomor: 'PMT-2023-003', tanggal_terbit: '2023-03-12', tanggal_kadaluwarsa: '2025-03-12', status: 'Aktif', file: 'praktik_mandiri.pdf' },
    { id: 4, jenis: 'Seminar Khusus Kredensial', nomor: 'SKK-2023-004', tanggal_terbit: '2023-04-18', tanggal_kadaluwarsa: '2025-04-18', status: 'Aktif', file: 'seminar_kredensial.pdf' },
    { id: 5, jenis: 'Kegiatan SKP Kredensial', nomor: 'SKP-2023-005', tanggal_terbit: '2023-05-20', tanggal_kadaluwarsa: '2025-05-20', status: 'Aktif', file: 'skp_kredensial.pdf' },
    { id: 6, jenis: 'Lainnya', nomor: 'LNY-2023-006', tanggal_terbit: '2023-06-25', tanggal_kadaluwarsa: '2025-06-25', status: 'Aktif', file: 'kredensial_lainnya.pdf' }
  ];

  const mockAssignments = [
    { id: 1, jenis: 'Penugasan', keterangan: 'Dokter Spesialis Penyakit Dalam - Poli Interna', tanggal_mulai: '2015-03-01', tanggal_selesai: null, status: 'Aktif', file: 'penugasan_interna.pdf' },
    { id: 2, jenis: 'Pengabdian', keterangan: 'Bakti Sosial Desa Semanding', tanggal_mulai: '2023-06-01', tanggal_selesai: '2023-06-01', status: 'Selesai', file: 'pengabdian_sosial.pdf' }
  ];

  const mockAchievements = [
    { id: 1, judul: 'Dokter Teladan RS PKU Muhammadiyah', penyelenggara: 'RS PKU Muhammadiyah Gombong', tahun: '2023', tingkat: 'Institusi', file: 'penghargaan_teladan.pdf' },
    { id: 2, judul: 'Penghargaan Pengabdian 10 Tahun', penyelenggara: 'Kemenkes RI', tahun: '2020', tingkat: 'Nasional', file: 'pengabdian_10_tahun.pdf' }
  ];

  const mockAuthorities = [
    { id: 1, jenis: 'SPK', nomor: 'SPK-2023-010', tanggal_terbit: '2023-01-15', tanggal_kadaluwarsa: '2025-01-15', status: 'Aktif', file: 'spk_2023.pdf' },
    { id: 2, jenis: 'RKK', nomor: 'RKK-2023-010', tanggal_terbit: '2023-01-15', tanggal_kadaluwarsa: '2025-01-15', status: 'Aktif', file: 'rkk_2023.pdf' }
  ];

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // In production, this would be an API call
      // const response = await authenticatedFetch(`/api/admin/users/${userId}`);
      
      setTimeout(() => {
        setUser(mockUser);
        setDocuments(mockDocuments);
        setEducation(mockEducation);
        setEthics(mockEthics);
        setCredentials(mockCredentials);
        setAssignments(mockAssignments);
        setAchievements(mockAchievements);
        setAuthorities(mockAuthorities);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const getStatusBadgeClass = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'aktif' || normalizedStatus === 'bersih' || normalizedStatus === 'selesai') return styles.statusSuccess;
    if (normalizedStatus === 'segera habis') return styles.statusWarning;
    if (normalizedStatus === 'habis' || normalizedStatus === 'tidak aktif') return styles.statusDanger;
    return styles.statusDefault;
  };

  const openDocumentModal = (item, label) => {
    const url = item?.fileUrl || (item?.file ? `/documents/${item.file}` : '');
    setDocItem({ ...item, label });
    setDocUrl(url);
    setDocModalOpen(true);
  };

  const handleCloseDocumentModal = () => {
    setDocModalOpen(false);
    setDocItem(null);
    setDocUrl('');
  };

  const handleDownloadDocument = () => {
    if (!docUrl) {
      setPopup({ isVisible: true, message: 'Dokumen belum tersedia.', type: 'warning' });
      return;
    }
    const link = document.createElement('a');
    link.href = docUrl;
    link.download = docItem?.file || 'dokumen.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderProfileTab = () => (
    <div className={styles.profileGrid}>
      <div className={styles.profileSection}>
        <h3 className={styles.sectionTitle}>Data Pribadi</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nama Lengkap</span>
            <span className={styles.infoValue}>{user?.name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tempat, Tanggal Lahir</span>
            <span className={styles.infoValue}>{user?.tempat_lahir}, {user?.tanggal_lahir}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Jenis Kelamin</span>
            <span className={styles.infoValue}>{user?.jenis_kelamin}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Agama</span>
            <span className={styles.infoValue}>{user?.agama}</span>
          </div>
        </div>
      </div>

      <div className={styles.profileSection}>
        <h3 className={styles.sectionTitle}>Kontak</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>
              {user?.email}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>No. Telepon</span>
            <span className={styles.infoValue}>{user?.phone}</span>
          </div>
        </div>
      </div>

      <div className={styles.profileSection}>
        <h3 className={styles.sectionTitle}>Alamat</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Alamat</span>
            <span className={styles.infoValue}>{user?.address}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Desa/Kelurahan</span>
            <span className={styles.infoValue}>{user?.village}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Kecamatan</span>
            <span className={styles.infoValue}>{user?.district}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Kabupaten/Kota</span>
            <span className={styles.infoValue}>{user?.regency}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Provinsi</span>
            <span className={styles.infoValue}>{user?.province}</span>
          </div>
        </div>
      </div>

      <div className={styles.profileSection}>
        <h3 className={styles.sectionTitle}>Data Kepegawaian</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status Kepegawaian</span>
            <span className={styles.infoValue}>{user?.status_kepegawaian}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tanggal Mulai Kerja</span>
            <span className={styles.infoValue}>{user?.tanggal_mulai_kerja}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className={styles.tabSection}>
      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Belum ada dokumen yang diunggah</p>
        </div>
      ) : (
        <div className={styles.documentsGrid}>
          {documents.map((doc) => (
            <div key={doc.id} className={styles.documentCard}>
              <div className={styles.documentHeader}>
                <span className={styles.documentType}>{doc.jenis}</span>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(doc.status)}`}>
                  {doc.status}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nomor</span>
                  <span className={styles.infoValue}>{doc.nomor}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Terbit</span>
                  <span className={styles.infoValue}>{doc.tanggal_terbit}</span>
                </div>
                {doc.tanggal_kadaluwarsa && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Tanggal Kadaluwarsa</span>
                    <span className={styles.infoValue}>{doc.tanggal_kadaluwarsa}</span>
                  </div>
                )}
              </div>
              <div className={styles.documentActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDocumentModal(doc, `${doc.jenis} - ${doc.nomor}`)}
                >
                  Lihat Dokumen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEducationTab = () => (
    <div className={styles.tabSection}>
      {education.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Belum ada data pendidikan</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {education.map((edu) => (
            <div key={edu.id} className={styles.listItem}>
              <div className={styles.listItemHeader}>
                <span className={`${styles.itemType} ${styles.eduType}`}>{edu.jenis}</span>
                <span className={styles.itemYear}>{edu.tahun}</span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Judul</span>
                  <span className={styles.infoValue}>{edu.judul}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Institusi</span>
                  <span className={styles.infoValue}>{edu.institusi}</span>
                </div>
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  className={styles.listActionButton}
                  variant="outline"
                  size="sm"
                  onClick={() => openDocumentModal(edu, edu.judul)}
                >
                  Lihat Dokumen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEthicsTab = () => (
    <div className={styles.tabSection}>
      {ethics.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Belum ada data etik & disiplin</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {ethics.map((ethic) => (
            <div key={ethic.id} className={styles.listItem}>
              <div className={styles.listItemHeader}>
                <span className={`${styles.itemType} ${styles.ethicType}`}>{ethic.jenis}</span>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(ethic.status)}`}>
                  {ethic.status}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Keterangan</span>
                  <span className={styles.infoValue}>{ethic.keterangan}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal</span>
                  <span className={styles.infoValue}>{ethic.tanggal}</span>
                </div>
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  className={styles.listActionButton}
                  variant="outline"
                  size="sm"
                  onClick={() => openDocumentModal(ethic, ethic.jenis)}
                >
                  Lihat Dokumen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCredentialsTab = () => (
    <div className={styles.tabSection}>
      {credentials.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Belum ada data kredensial</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {credentials.map((cred) => (
            <div key={cred.id} className={styles.listItem}>
              <div className={styles.listItemHeader}>
                <span className={`${styles.itemType} ${styles.credType}`}>{cred.jenis}</span>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(cred.status)}`}>
                  {cred.status}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nomor</span>
                  <span className={styles.infoValue}>{cred.nomor}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Terbit</span>
                  <span className={styles.infoValue}>{cred.tanggal_terbit || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Kadaluarsa</span>
                  <span className={styles.infoValue}>{cred.tanggal_kadaluwarsa || '-'}</span>
                </div>
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  className={styles.listActionButton}
                  variant="outline"
                  size="sm"
                  onClick={() => openDocumentModal(cred, cred.jenis)}
                >
                  Lihat Dokumen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPenugasanTab = () => (
    <div className={styles.tabSection}>
      {assignments.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Belum ada data penugasan</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {assignments.map((assign) => (
            <div key={assign.id} className={styles.listItem}>
              <div className={styles.listItemHeader}>
                <span className={`${styles.itemType} ${styles.assignType}`}>{assign.jenis}</span>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(assign.status)}`}>
                  {assign.status}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Keterangan</span>
                  <span className={styles.infoValue}>{assign.keterangan}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Periode</span>
                  <span className={styles.infoValue}>{assign.tanggal_mulai} - {assign.tanggal_selesai || 'Sekarang'}</span>
                </div>
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  className={styles.listActionButton}
                  variant="outline"
                  size="sm"
                  onClick={() => openDocumentModal(assign, assign.jenis)}
                >
                  Lihat Dokumen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPrestasiTab = () => (
    <div className={styles.tabSection}>
      {achievements.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Belum ada data prestasi & penghargaan</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {achievements.map((achievement) => (
            <div key={achievement.id} className={styles.listItem}>
              <div className={styles.listItemHeader}>
                <span className={`${styles.itemType} ${styles.achievementType}`}>{achievement.tingkat}</span>
                <span className={styles.itemYear}>{achievement.tahun}</span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Judul</span>
                  <span className={styles.infoValue}>{achievement.judul}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Penyelenggara</span>
                  <span className={styles.infoValue}>{achievement.penyelenggara}</span>
                </div>
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  className={styles.listActionButton}
                  variant="outline"
                  size="sm"
                  onClick={() => openDocumentModal(achievement, achievement.judul)}
                >
                  Lihat Dokumen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderKewenanganTab = () => (
    <div className={styles.tabSection}>
      {authorities.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Belum ada data status kewenangan</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {authorities.map((authority) => (
            <div key={authority.id} className={styles.listItem}>
              <div className={styles.listItemHeader}>
                <span className={`${styles.itemType} ${styles.authorityType}`}>{authority.jenis}</span>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(authority.status)}`}>
                  {authority.status}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nomor</span>
                  <span className={styles.infoValue}>{authority.nomor || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Terbit</span>
                  <span className={styles.infoValue}>{authority.tanggal_terbit || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Kadaluarsa</span>
                  <span className={styles.infoValue}>{authority.tanggal_kadaluwarsa || '-'}</span>
                </div>
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  className={styles.listActionButton}
                  variant="outline"
                  size="sm"
                  onClick={() => openDocumentModal(authority, `${authority.jenis} - ${authority.nomor}`)}
                >
                  Lihat Dokumen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profil':
        return renderProfileTab();
      case 'dokumen':
        return renderDocumentsTab();
      case 'pendidikan':
        return renderEducationTab();
      case 'penugasan':
        return renderPenugasanTab();
      case 'prestasi':
        return renderPrestasiTab();
      case 'kredensial':
        return renderCredentialsTab();
      case 'kewenangan':
        return renderKewenanganTab();
      case 'etik':
        return renderEthicsTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <span>Memuat data pengguna...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/admin/pengguna">Manajemen Pengguna</Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>{user?.name}</span>
        </div>

        {/* User Profile Header */}
        <Card className={styles.profileHeader}>
          <div className={styles.profileHeaderContent}>
            <div className={styles.avatarWrapper}>
              {user?.foto_profil ? (
                <img src={user.foto_profil} alt={user.name} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
          <div className={styles.profileHeaderInfo}>
            <h1 className={styles.userName}>{user?.name}</h1>
            <div className={styles.userMeta}>
              <span>NIP: {user?.nip}</span>
              <span>NIK: {user?.nik}</span>
            </div>
            <div className={styles.profileBadges} />
            </div>
          </div>
        </Card>

        {/* Tabs and Content */}
        <Card className={styles.contentCard}>
          <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />
          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>
        </Card>

        {/* Popup Notification */}
        <Popup
          message={popup.message}
          type={popup.type}
          isVisible={popup.isVisible}
          onClose={() => setPopup(prev => ({ ...prev, isVisible: false }))}
        />

        <Modal
          isOpen={docModalOpen}
          onClose={handleCloseDocumentModal}
          title={docItem?.label || 'Dokumen'}
          size="large"
          padding="normal"
          className={styles.fullscreenModal}
        >
          <div className={styles.documentModalBody}>
            <div className={styles.documentMeta}>
              <div className={styles.documentMetaItem}>
                <span className={styles.documentMetaLabel}>Nama Dokumen</span>
                <span className={styles.documentMetaValue}>{docItem?.file || '-'}</span>
              </div>
              {docItem?.status && (
                <div className={styles.documentMetaItem}>
                  <span className={styles.documentMetaLabel}>Status</span>
                  <span className={styles.documentMetaValue}>{docItem.status}</span>
                </div>
              )}
            </div>
            <div className={styles.documentPreview}>
              {docUrl ? (
                <iframe src={docUrl} className={styles.documentFrame} title="Dokumen PDF" />
              ) : (
                <div className={styles.documentEmpty}>Dokumen belum tersedia.</div>
              )}
            </div>
            <div className={styles.documentModalActions}>
              <Button variant="outline" onClick={handleCloseDocumentModal}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleDownloadDocument}>
                Download
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default DetailPengguna;
