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
import { MdVisibility, MdPrint, MdDownload } from 'react-icons/md';
import { authenticatedFetch } from '../../../utils/auth';
import { formatDateShort } from '../../../utils/dateFormatter';
import styles from './DetailPengguna.module.css';
import {
  getProvinceNameById,
  getRegencyNameById,
  getDistrictNameById,
  getVillageNameById
} from '../../../services/indonesiaRegion';
import logoImage from '../../../assets/GOMBONG.webp';

const tabs = [
  { key: 'profil', label: 'Profil' },
  { key: 'dokumen', label: 'Dokumen Legalitas' },
  { key: 'pendidikan', label: 'Riwayat Pendidikan' },
  { key: 'penugasan', label: 'Pekerjaan dan Pengabdian' },
  { key: 'prestasi', label: 'Prestasi & Penghargaan' },
  { key: 'kredensial', label: 'Kredensial' },
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
  const [popup, setPopup] = useState({ isVisible: false, message: '', type: 'info' });
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docItem, setDocItem] = useState(null);
  const [docUrl, setDocUrl] = useState('');

  // Region names for readable address
  const [regionNames, setRegionNames] = useState({
    province: '',
    regency: '',
    district: '',
    village: ''
  });

  useEffect(() => {
    if (user) {
      fetchRegionNames(user);
    }
  }, [user]);

  const capitalizeEachWord = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isRegionCode = (value) => !!value && /^\d+(\.\d+)*$/.test(String(value));

  const fetchRegionNames = async (userData) => {
    try {
      // If value is not a region code, assume it's already a readable name.
      const province = !isRegionCode(userData.province)
        ? userData.province
        : await getProvinceNameById(userData.province);
      
      const regency = !isRegionCode(userData.regency)
        ? userData.regency
        : await getRegencyNameById(userData.province, userData.regency);
      
      const district = !isRegionCode(userData.district)
        ? userData.district
        : await getDistrictNameById(userData.regency, userData.district);
      
      const village = !isRegionCode(userData.village)
        ? userData.village
        : await getVillageNameById(userData.district, userData.village);
      
      setRegionNames({ province, regency, district, village });
    } catch (err) {
      // If error, try to use the raw data as names
      setRegionNames({ 
        province: userData.province || '', 
        regency: userData.regency || '', 
        district: userData.district || '', 
        village: userData.village || '' 
      });
    }
  };

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

  // Determine if employee is active for profile badge (frontend-only heuristic)
  const isEmployeeActive = () => {
    if (!user) return false;
    const statusText = (user.status_kepegawaian || user.status || '').toString().toLowerCase().trim();
    // Treat explicitly 'aktif' as active; 'tidak aktif' must be considered inactive
    if (statusText === 'aktif' || statusText === 'active' || user.is_active === true) return true;
    return false;
  };

  const handleDownloadAllDocuments = () => {
    // Request server to create a zip of all user documents and stream it
    (async () => {
      try {
        const res = await authenticatedFetch(`/api/admin/pengguna/${userId}/download-dokumen`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setPopup({ isVisible: true, message: json.message || 'Gagal menyiapkan file ZIP.', type: 'error' });
          return;
        }

        const blob = await res.blob();
        // Try to determine filename from content-disposition header
        const disposition = res.headers.get('content-disposition') || '';
        let filename = `${user?.name ? user.name.replace(/\s+/g, '_') : 'user'}-dokumen.zip`;
        const match = /filename\*=UTF-8''([^;\n\r]+)/i.exec(disposition) || /filename="?([^";]+)"?/i.exec(disposition);
        if (match) filename = decodeURIComponent(match[1]);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Download all documents error', err);
        setPopup({ isVisible: true, message: 'Terjadi kesalahan saat mengunduh dokumen.', type: 'error' });
      }
    })();
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

  const handlePrintProfile = async () => {
    if (!user) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Page dimensions
    const pageWidth = 210;
    const pageHeight = 297;
    const marginLeft = 20;
    const marginRight = 190;
    const centerX = pageWidth / 2;
    let y = 15;

    // Colors
    const hijauPKU = { r: 0, g: 102, b: 51 };
    const hitam = { r: 0, g: 0, b: 0 };

    // ==================== KOP SURAT ====================
    // Logo image
    const img = new Image();
    img.src = logoImage;
    doc.addImage(img, 'PNG', marginLeft, y+3, 25, 25);

    // Nama RS
    doc.setTextColor(hitam.r, hitam.g, hitam.b);
    doc.setFontSize(13);
    doc.setFont('times', 'bold');
    doc.text('KOMITE KEPERAWATAN', centerX + 5, y + 7, { align: 'center' });
    doc.setFontSize(13);
    doc.text('RUMAH SAKIT PKU MUHAMMADIYAH GOMBONG', centerX + 5, y + 13, { align: 'center' });

    // Alamat RS
    doc.setTextColor(hitam.r, hitam.g, hitam.b);
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('Jl. Yos Sudarso No. 461 GOMBONG  54412', centerX + 5, y + 17, { align: 'center' });
    doc.text('Telp. (0287) 47170, 471422, 471639  Fax. 473614', centerX + 5, y + 22, { align: 'center' });
    doc.text('email: pkumuh-gombong@yahoo.co.id', centerX + 5, y + 26, { align: 'center' });

    y += 31;

    // Garis pembatas kop surat
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(marginLeft, y, marginRight, y);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y + 2, marginRight, y + 2);

    y += 12;

    // ==================== JUDUL DOKUMEN ====================
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hitam.r, hitam.g, hitam.b);
    doc.text('DATA PEGAWAI', centerX, y, { align: 'center' });

    y += 4;

    // Garis bawah judul
    doc.setDrawColor(hitam.r, hitam.g, hitam.b);
    doc.setLineWidth(0.5);
    const titleWidth = doc.getTextWidth('DATA PEGAWAI');
    doc.line(centerX - titleWidth/2 - 5, y, centerX + titleWidth/2 + 5, y);

    y += 12;

    // ==================== TABEL DATA PEGAWAI ====================
    const labelWidth = 45;
    const colonX = marginLeft + labelWidth;
    const valueX = colonX + 5;
    const lineHeight = 7;

    // Helper function untuk menambah baris data
    const addDataRow = (label, value) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.setTextColor(hitam.r, hitam.g, hitam.b);
      
      doc.text(label, marginLeft, y);
      doc.text(':', colonX, y);
      
      const maxValueWidth = marginRight - valueX;
      const splitValue = doc.splitTextToSize(value || '-', maxValueWidth);
      
      doc.text(splitValue[0], valueX, y);
      y += lineHeight;
      
      for (let i = 1; i < splitValue.length; i++) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.text(splitValue[i], valueX, y);
        y += lineHeight;
      }
    };

    // Data Identitas
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('A. DATA IDENTITAS', marginLeft, y);
    y += 8;

    addDataRow('Nama Lengkap', user.name);
    addDataRow('NIP', user.nip);
    addDataRow('NIK', user.nik);
    addDataRow('Tempat, Tanggal Lahir', `${user.tempat || '-'}, ${user.tanggal_lahir || '-'}`);
    addDataRow('Jenis Kelamin', user.jenis_kelamin);
    addDataRow('Agama', user.agama);
    
    const alamatLengkap = user.alamat_lengkap && user.alamat_lengkap.trim() !== ''
      ? user.alamat_lengkap
      : [user.address, regionNames.village, regionNames.district, regionNames.regency, regionNames.province]
          .filter(Boolean)
          .join(', ');
    addDataRow('Alamat', capitalizeEachWord(alamatLengkap));
    
    addDataRow('No. Telepon', user.phone);
    addDataRow('Email', user.email);

    y += 5;

    // Data Kepegawaian
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('B. DATA KEPEGAWAIAN', marginLeft, y);
    y += 8;

    addDataRow('Status Kepegawaian', user.status_kepegawaian);
    addDataRow('Jabatan', user.jabatan);
    addDataRow('Unit Kerja', user.unit_kerja);
    addDataRow('Tanggal Mulai Kerja', user.tanggal_mulai_kerja);

    // ==================== FOOTER ====================
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, pageHeight - 20, marginRight, pageHeight - 20);

      doc.setFontSize(8);
      doc.setFont('times', 'italic');
      doc.setTextColor(0, 0, 0);
      
      const waktuCetak = new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.text(`Dokumen ini dicetak secara otomatis pada ${waktuCetak}`, marginLeft, pageHeight - 15);
      doc.text('RS PKU Muhammadiyah Gombong - Sistem Informasi Kepegawaian', marginLeft, pageHeight - 11);
      doc.text(`Halaman ${i} dari ${pageCount}`, marginRight, pageHeight - 13, { align: 'right' });
    }
    
    // Save PDF
    doc.save(`Data_Pegawai_${user.name?.replace(/\s+/g, '_') || 'Pegawai'}.pdf`);
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
          <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.infoLabel}>Alamat Lengkap</span>
            <span className={`${styles.infoValue} ${styles.addressValue}`}>
              {capitalizeEachWord(
                user?.alamat_lengkap
                  ? user.alamat_lengkap
                  : [user?.address, regionNames.village, regionNames.district, regionNames.regency, regionNames.province]
                      .filter(Boolean)
                      .join(', ')
              )}
            </span>
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
                <div className={`${styles.infoItem} ${styles.infoItemFull}`}>
                  <span className={styles.infoLabel}>Nomor SK</span>
                  <span className={styles.infoValue}>{doc.nomor_sk || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    {doc.jenis_dokumen === 'STR' ? 'Tanggal Lulus' : 
                     doc.jenis_dokumen === 'Surat Keterangan' ? 'Mulai Dari' : 
                     'Tanggal Upload'}
                  </span>
                  <span className={styles.infoValue}>{formatDateShort(doc.tanggal_lulus) || '-'}</span>
                </div>
                {doc.jenis_dokumen === 'SIP' && doc.berlaku_sampai && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Berlaku Sampai</span>
                    <span className={styles.infoValue}>{formatDateShort(doc.berlaku_sampai)}</span>
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
                <span className={`${styles.itemType} ${styles.credType}`}>{cred.kredensial_type}</span>
                <span className={`${styles.statusBadge} ${
                  cred.hasil_penilaian === 'Kompeten' ? styles.statusSuccess
                  : cred.hasil_penilaian === 'Tidak Kompeten' ? styles.statusDanger
                  : styles.statusDefault
                }`}>
                  {cred.hasil_penilaian || 'Belum Diisi'}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nama Kegiatan</span>
                  <span className={styles.infoValue}>{cred.nama_kegiatan}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Jenis Kegiatan</span>
                  <span className={styles.infoValue}>{cred.jenis_kegiatan || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Mulai</span>
                  <span className={styles.infoValue}>{cred.tanggal_berlaku || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Berlaku Sampai</span>
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
                  onClick={() => openDocumentModal(cred, cred.nama_kegiatan)}
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
          <p>Belum ada data pekerjaan</p>
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
                {assign.ruang && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Ruang</span>
                    <span className={styles.infoValue}>{assign.ruang}</span>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{assign.jenis === 'Pengabdian' ? 'Peran / Posisi' : 'Penanggung Jawab'}</span>
                  <span className={styles.infoValue}>{assign.penanggung_jawab}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Mulai</span>
                  <span className={styles.infoValue}>{assign.tanggal_mulai || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tanggal Selesai</span>
                  <span className={styles.infoValue}>{assign.tanggal_selesai || 'Sekarang'}</span>
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
              <div className={styles.nameRow}>
                <h1 className={styles.userName}>{user?.name}</h1>
                <span className={`${styles.employeeStatusBadge} ${isEmployeeActive() ? styles.statusActive : styles.statusInactive}`}>
                  {isEmployeeActive() ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
              <div className={styles.userMeta}>
                <span>NIP: {user?.nip}</span>
                <span>NIK: {user?.nik}</span>
              </div>
            </div>
            <div className={styles.profileHeaderActions}>
              <Button
                variant="inverse"
                size="small"
                icon={<MdDownload size={16} />}
                onClick={handleDownloadAllDocuments}
              >
                Download Semua
              </Button>

              <Button
                variant="inverse"
                size="small"
                icon={<MdPrint size={16} />}
                onClick={handlePrintProfile}
              >
                Cetak Data
              </Button>
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
                <span className={styles.documentMetaValue}>{docItem?.file_name || docItem?.file || '-'}</span>
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
