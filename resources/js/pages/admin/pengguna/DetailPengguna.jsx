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
import { MdVisibility } from 'react-icons/md';
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

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const response = await authenticatedFetch(`/api/admin/pengguna/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        setDocuments(data.data.dokumen_legalitas || []);
        setEducation(data.data.riwayat_pendidikan || []);
        setEthics(data.data.etik_disiplin || []);
        setCredentials(data.data.kredensial || []);
        setAssignments(data.data.penugasan || []);
        setAchievements(data.data.prestasi_penghargaan || []);
        setAuthorities(data.data.status_kewenangan || []);
      } else {
        setPopup({
          isVisible: true,
          message: data.message || 'Gagal memuat data pengguna',
          type: 'error'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setPopup({
        isVisible: true,
        message: 'Terjadi kesalahan saat memuat data pengguna',
        type: 'error'
      });
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
    const url = item?.file_url || '';
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
    link.download = docItem?.file_name || 'dokumen.pdf';
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
            <span className={styles.infoValue}>{user?.tempat}, {user?.tanggal_lahir}</span>
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
            <span className={styles.infoLabel}>Jabatan</span>
            <span className={styles.infoValue}>{user?.jabatan}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Unit Kerja</span>
            <span className={styles.infoValue}>{user?.unit_kerja}</span>
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
                <span className={styles.documentType}>{doc.jenis_dokumen}</span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nomor SK</span>
                  <span className={styles.infoValue}>{doc.nomor_sk || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Mulai</span>
                  <span className={styles.infoValue}>{doc.tanggal_mulai || '-'}</span>
                </div>
                {doc.tanggal_berlaku && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Tanggal Berlaku</span>
                    <span className={styles.infoValue}>{doc.tanggal_berlaku}</span>
                  </div>
                )}
              </div>
              <div className={styles.documentActions}>
                <Button
                  variant="primary"
                  size="small"
                  icon={<MdVisibility size={16} />}
                  onClick={() => openDocumentModal(doc, `${doc.jenis_dokumen} - ${doc.nomor_sk || 'No SK'}`)}
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
                <span className={styles.itemYear}>{edu.tahun_lulus}</span>
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
                  variant="primary"
                  size="small"
                  icon={<MdVisibility size={16} />}
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
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(ethic.status_penyelesaian)}`}>
                  {ethic.status_penyelesaian}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Jenis Pelanggaran</span>
                  <span className={styles.infoValue}>{ethic.jenis_pelanggaran}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Uraian</span>
                  <span className={styles.infoValue}>{ethic.uraian_singkat}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{ethic.jenis === 'etik' ? 'Tingkat' : 'Tindakan Disiplin'}</span>
                  <span className={styles.infoValue}>{ethic.jenis === 'etik' ? ethic.tingkat : ethic.tindakan}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Kejadian</span>
                  <span className={styles.infoValue}>{ethic.tanggal_kejadian}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Penyelesaian</span>
                  <span className={styles.infoValue}>{ethic.tanggal_penyelesaian || '-'}</span>
                </div>
                {ethic.catatan && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Catatan</span>
                    <span className={styles.infoValue}>{ethic.catatan}</span>
                  </div>
                )}
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  variant="primary"
                  size="small"
                  icon={<MdVisibility size={16} />}
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
                <span className={`${styles.itemType} ${styles.credType}`}>{cred.jenis_kegiatan}</span>
                <span className={`${styles.statusBadge} ${cred.hasil_penilaian === 'Kompeten' ? styles.statusSuccess : styles.statusDanger}`}>
                  {cred.hasil_penilaian}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nama Kegiatan</span>
                  <span className={styles.infoValue}>{cred.nama_kegiatan}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tahap</span>
                  <span className={styles.infoValue}>{cred.kredensial_type}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Berlaku</span>
                  <span className={styles.infoValue}>{cred.tanggal_berlaku || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Selesai</span>
                  <span className={styles.infoValue}>{cred.tanggal_selesai || '-'}</span>
                </div>
                {cred.catatan && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Catatan</span>
                    <span className={styles.infoValue}>{cred.catatan}</span>
                  </div>
                )}
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  variant="primary"
                  size="small"
                  icon={<MdVisibility size={16} />}
                  onClick={() => openDocumentModal(cred, cred.jenis_kegiatan)}
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
                  <span className={styles.infoLabel}>Unit</span>
                  <span className={styles.infoValue}>{assign.unit}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Penanggung Jawab</span>
                  <span className={styles.infoValue}>{assign.penanggung_jawab}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Periode</span>
                  <span className={styles.infoValue}>{assign.tanggal_mulai} - {assign.tanggal_selesai || 'Sekarang'}</span>
                </div>
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  variant="primary"
                  size="small"
                  icon={<MdVisibility size={16} />}
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
                <span className={`${styles.itemType} ${styles.achievementType}`}>{achievement.achievement_type}</span>
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
                  variant="primary"
                  size="small"
                  icon={<MdVisibility size={16} />}
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
                  <span className={styles.infoLabel}>Nomor Dokumen</span>
                  <span className={styles.infoValue}>{authority.nomor_dokumen || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Terbit</span>
                  <span className={styles.infoValue}>{authority.tanggal_terbit || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Masa Berlaku</span>
                  <span className={styles.infoValue}>{authority.masa_berlaku || '-'}</span>
                </div>
              </div>
              <div className={styles.listItemFooter}>
                <Button
                  variant="primary"
                  size="small"
                  icon={<MdVisibility size={16} />}
                  onClick={() => openDocumentModal(authority, `${authority.jenis} - ${authority.nomor_dokumen}`)}
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
          <Link to="/pengguna">Manajemen Pengguna</Link>
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
