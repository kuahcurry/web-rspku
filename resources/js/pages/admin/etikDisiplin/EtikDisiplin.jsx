import { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Tabs from '../../../components/tabs/Tabs';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import Banner from '../../../components/banner/Banner';
import { 
  MdAdd, 
  MdSave, 
  MdSearch, 
  MdVisibility, 
  MdDelete, 
  MdEdit, 
  MdDownload, 
  MdCloudUpload,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdAssignment
} from 'react-icons/md';
import { authenticatedFetch } from '../../../utils/auth';
import { formatDateToIndonesian } from '../../../utils/dateFormatter';
import styles from './EtikDisiplin.module.css';

const TABS = [
  { key: 'etik', label: 'Riwayat Etik' },
  { key: 'disiplin', label: 'Riwayat Disiplin' }
];

const TINGKAT_OPTIONS = [
  { value: 'Ringan', label: 'Ringan' },
  { value: 'Sedang', label: 'Sedang' },
  { value: 'Berat', label: 'Berat' }
];

const STATUS_OPTIONS = [
  { value: 'Proses', label: 'Proses' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Pending', label: 'Pending' }
];

const TINDAKAN_OPTIONS = [
  { value: 'Teguran Lisan', label: 'Teguran Lisan' },
  { value: 'Teguran Tertulis', label: 'Teguran Tertulis' },
  { value: 'SP1', label: 'SP1' },
  { value: 'SP2', label: 'SP2' },
  { value: 'SP3', label: 'SP3' }
];

const AdminEtikDisiplin = () => {
  const [activeTab, setActiveTab] = useState('etik');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [etikRecords, setEtikRecords] = useState([]);
  const [disiplinRecords, setDisiplinRecords] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tingkatFilter, setTingkatFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  
  // Modals
  const [showEtikModal, setShowEtikModal] = useState(false);
  const [showDisiplinModal, setShowDisiplinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  const [editingEtikId, setEditingEtikId] = useState(null);
  const [editingDisiplinId, setEditingDisiplinId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  const fileEtikRef = useRef(null);
  const fileDisiplinRef = useRef(null);
  
  const [etikForm, setEtikForm] = useState({
    userId: '',
    tanggal: '',
    jenis: '',
    uraian: '',
    tingkat: 'Ringan',
    status: 'Proses',
    tanggal_selesai: '',
    catatan: '',
    file: null,
    fileUrl: null
  });
  
  const [disiplinForm, setDisiplinForm] = useState({
    userId: '',
    tanggal: '',
    jenis: '',
    uraian: '',
    tindakan: '',
    status: 'Proses',
    tanggal_selesai: '',
    catatan: '',
    file: null,
    fileUrl: null
  });

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  // Reset filters when tab changes
  useEffect(() => {
    setSearchTerm('');
    setStatusFilter('');
    setTingkatFilter('');
    setUserFilter('');
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/users/approved');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const etikResponse = await authenticatedFetch('/api/admin/etik-disiplin?jenis=etik');
      const etikData = await etikResponse.json();
      if (etikData.success) {
        const formattedEtik = etikData.data.map(item => ({
          id: item.id,
          userId: item.user_id,
          userName: item.user_name,
          tanggal: item.tanggal_kejadian,
          jenis: item.jenis_pelanggaran,
          uraian: item.uraian_singkat,
          tingkat: item.tingkat,
          status: item.status_penyelesaian,
          tanggal_selesai: item.tanggal_penyelesaian,
          catatan: item.catatan,
          dokumenUrl: item.file_url
        }));
        setEtikRecords(formattedEtik);
      }
      
      const disiplinResponse = await authenticatedFetch('/api/admin/etik-disiplin?jenis=disiplin');
      const disiplinData = await disiplinResponse.json();
      if (disiplinData.success) {
        const formattedDisiplin = disiplinData.data.map(item => ({
          id: item.id,
          userId: item.user_id,
          userName: item.user_name,
          tanggal: item.tanggal_kejadian,
          jenis: item.jenis_pelanggaran,
          uraian: item.uraian_singkat,
          tindakan: item.tindakan,
          status: item.status_penyelesaian,
          tanggal_selesai: item.tanggal_penyelesaian,
          catatan: item.catatan,
          dokumenUrl: item.file_url
        }));
        setDisiplinRecords(formattedDisiplin);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const records = activeTab === 'etik' ? etikRecords : disiplinRecords;
    
    return records.filter((item) => {
      const matchesSearch = !searchTerm || 
        item.jenis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.uraian?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || item.status === statusFilter;
      
      const matchesTingkat = !tingkatFilter || 
        (activeTab === 'etik' ? item.tingkat === tingkatFilter : item.tindakan === tingkatFilter);
      
      const matchesUser = !userFilter || item.userId?.toString() === userFilter;
      
      return matchesSearch && matchesStatus && matchesTingkat && matchesUser;
    });
  }, [activeTab, etikRecords, disiplinRecords, searchTerm, statusFilter, tingkatFilter, userFilter]);

  // File handlers
  const handleEtikFile = (e) => {
    const file = e.target.files?.[0];
    processEtikFile(file, e);
  };

  const handleEtikDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    processEtikFile(file);
  };

  const processEtikFile = (file, eventRef) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setBanner({ message: 'Hanya file PDF yang diperbolehkan', variant: 'error' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBanner({ message: 'File terlalu besar. Maksimal 2MB', variant: 'error' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setEtikForm((prev) => {
      if (prev.fileUrl) URL.revokeObjectURL(prev.fileUrl);
      return { ...prev, file, fileUrl: blobUrl };
    });
    if (eventRef?.target) eventRef.target.value = '';
  };

  const handleDisiplinFile = (e) => {
    const file = e.target.files?.[0];
    processDisiplinFile(file, e);
  };

  const handleDisiplinDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    processDisiplinFile(file);
  };

  const processDisiplinFile = (file, eventRef) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setBanner({ message: 'Hanya file PDF yang diperbolehkan', variant: 'error' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBanner({ message: 'File terlalu besar. Maksimal 2MB', variant: 'error' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setDisiplinForm((prev) => {
      if (prev.fileUrl) URL.revokeObjectURL(prev.fileUrl);
      return { ...prev, file, fileUrl: blobUrl };
    });
    if (eventRef?.target) eventRef.target.value = '';
  };

  // Modal handlers
  const openEtikModal = (item = null) => {
    if (item) {
      setEditingEtikId(item.id);
      setEtikForm({
        userId: item.userId,
        tanggal: item.tanggal,
        jenis: item.jenis,
        uraian: item.uraian,
        tingkat: item.tingkat,
        status: item.status,
        tanggal_selesai: item.tanggal_selesai || '',
        catatan: item.catatan || '',
        file: null,
        fileUrl: item.dokumenUrl || null
      });
    } else {
      setEditingEtikId(null);
      setEtikForm({
        userId: '',
        tanggal: '',
        jenis: '',
        uraian: '',
        tingkat: 'Ringan',
        status: 'Proses',
        tanggal_selesai: '',
        catatan: '',
        file: null,
        fileUrl: null
      });
    }
    setShowEtikModal(true);
  };

  const openDisiplinModal = (item = null) => {
    if (item) {
      setEditingDisiplinId(item.id);
      setDisiplinForm({
        userId: item.userId,
        tanggal: item.tanggal,
        jenis: item.jenis,
        uraian: item.uraian,
        tindakan: item.tindakan,
        status: item.status,
        tanggal_selesai: item.tanggal_selesai || '',
        catatan: item.catatan || '',
        file: null,
        fileUrl: item.dokumenUrl || null
      });
    } else {
      setEditingDisiplinId(null);
      setDisiplinForm({
        userId: '',
        tanggal: '',
        jenis: '',
        uraian: '',
        tindakan: '',
        status: 'Proses',
        tanggal_selesai: '',
        catatan: '',
        file: null,
        fileUrl: null
      });
    }
    setShowDisiplinModal(true);
  };

  const handleSaveEtik = async (e) => {
    e.preventDefault();
    if (!etikForm.userId || !etikForm.tanggal || !etikForm.jenis || !etikForm.uraian || !etikForm.tingkat || !etikForm.status) {
      setBanner({ message: 'Mohon lengkapi semua field yang wajib diisi', variant: 'error' });
      return;
    }

    if (!editingEtikId && !etikForm.file) {
      setBanner({ message: 'Mohon upload dokumen pendukung', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('user_id', etikForm.userId);
      formData.append('jenis', 'etik');
      formData.append('tanggal_kejadian', etikForm.tanggal);
      formData.append('jenis_pelanggaran', etikForm.jenis);
      formData.append('uraian_singkat', etikForm.uraian);
      formData.append('tingkat', etikForm.tingkat);
      formData.append('status_penyelesaian', etikForm.status);
      if (etikForm.tanggal_selesai) {
        formData.append('tanggal_penyelesaian', etikForm.tanggal_selesai);
      }
      if (etikForm.catatan) {
        formData.append('catatan', etikForm.catatan);
      }
      if (etikForm.file) {
        formData.append('file', etikForm.file);
      }

      const url = editingEtikId 
        ? `/api/admin/etik-disiplin/${editingEtikId}`
        : '/api/admin/etik-disiplin';
      
      const response = await authenticatedFetch(url, {
        method: editingEtikId ? 'POST' : 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setBanner({ message: 'Data etik berhasil disimpan', variant: 'success' });
        setShowEtikModal(false);
        setEditingEtikId(null);
        fetchData();
      } else {
        setBanner({ message: data.message || 'Gagal menyimpan data', variant: 'error' });
      }
    } catch (error) {
      console.error('Error saving etik:', error);
      setBanner({ message: 'Terjadi kesalahan saat menyimpan data', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDisiplin = async (e) => {
    e.preventDefault();
    if (!disiplinForm.userId || !disiplinForm.tanggal || !disiplinForm.jenis || !disiplinForm.uraian || !disiplinForm.tindakan) {
      setBanner({ message: 'Mohon lengkapi semua field yang wajib diisi', variant: 'error' });
      return;
    }

    if (!editingDisiplinId && !disiplinForm.file) {
      setBanner({ message: 'Mohon upload dokumen pendukung', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('user_id', disiplinForm.userId);
      formData.append('jenis', 'disiplin');
      formData.append('tanggal_kejadian', disiplinForm.tanggal);
      formData.append('jenis_pelanggaran', disiplinForm.jenis);
      formData.append('uraian_singkat', disiplinForm.uraian);
      formData.append('tindakan', disiplinForm.tindakan);
      formData.append('status_penyelesaian', disiplinForm.status);
      if (disiplinForm.tanggal_selesai) {
        formData.append('tanggal_penyelesaian', disiplinForm.tanggal_selesai);
      }
      if (disiplinForm.catatan) {
        formData.append('catatan', disiplinForm.catatan);
      }
      if (disiplinForm.file) {
        formData.append('file', disiplinForm.file);
      }

      const url = editingDisiplinId 
        ? `/api/admin/etik-disiplin/${editingDisiplinId}`
        : '/api/admin/etik-disiplin';

      const response = await authenticatedFetch(url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setBanner({ message: 'Data disiplin berhasil disimpan', variant: 'success' });
        setShowDisiplinModal(false);
        setEditingDisiplinId(null);
        fetchData();
      } else {
        setBanner({ message: data.message || 'Gagal menyimpan data', variant: 'error' });
      }
    } catch (error) {
      console.error('Error saving disiplin:', error);
      setBanner({ message: 'Terjadi kesalahan saat menyimpan data', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (item) => {
    setDeleteItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(`/api/admin/etik-disiplin/${deleteItem.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setBanner({ message: 'Data berhasil dihapus', variant: 'success' });
        fetchData();
      } else {
        setBanner({ message: data.message || 'Gagal menghapus data', variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setBanner({ message: 'Terjadi kesalahan saat menghapus data', variant: 'error' });
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
      setDeleteItem(null);
    }
  };

  const openViewModal = (item) => {
    setViewItem(item);
    setPdfUrl(item.dokumenUrl || null);
    setShowViewModal(true);
  };

  const handleCloseView = () => {
    setShowViewModal(false);
    setViewItem(null);
    setPdfUrl(null);
  };

  const handleDownload = () => {
    const url = pdfUrl || viewItem?.dokumenUrl;
    if (!url) {
      setBanner({ message: 'Dokumen belum tersedia', variant: 'error' });
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dokumen.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Badge helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>{status}</span>;
      case 'Proses':
        return <span className={`${styles.statusBadge} ${styles.statusWarning}`}>{status}</span>;
      case 'Pending':
        return <span className={`${styles.statusBadge} ${styles.statusNeutral}`}>{status}</span>;
      default:
        return <span className={`${styles.statusBadge} ${styles.statusNeutral}`}>{status}</span>;
    }
  };

  const getTingkatBadge = (tingkat) => {
    switch (tingkat) {
      case 'Berat':
        return <span className={`${styles.statusBadge} ${styles.statusDanger}`}>{tingkat}</span>;
      case 'Sedang':
        return <span className={`${styles.statusBadge} ${styles.statusWarning}`}>{tingkat}</span>;
      case 'Ringan':
        return <span className={`${styles.statusBadge} ${styles.statusInfo}`}>{tingkat}</span>;
      default:
        return <span className={`${styles.statusBadge} ${styles.statusNeutral}`}>{tingkat}</span>;
    }
  };

  const getTindakanBadge = (tindakan) => {
    if (tindakan?.includes('SP3')) {
      return <span className={`${styles.statusBadge} ${styles.statusDanger}`}>{tindakan}</span>;
    } else if (tindakan?.includes('SP2') || tindakan?.includes('SP1')) {
      return <span className={`${styles.statusBadge} ${styles.statusWarning}`}>{tindakan}</span>;
    }
    return <span className={`${styles.statusBadge} ${styles.statusInfo}`}>{tindakan}</span>;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}
        
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Manajemen Etik & Disiplin</h1>
              <p className={styles.pageSubtitle}>Kelola riwayat etik dan disiplin pegawai secara terpusat</p>
            </div>
          </div>
        </header>

        {/* Main Table Card */}
        <Card className={styles.tableCard}>
          {/* Tabs */}
          <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} className={styles.tabGroup} />
          
          {/* Table Card Header */}
          <div className={styles.tableCardHeader}>
            <h2 className={styles.tableTitle}>
              {activeTab === 'etik' ? 'Riwayat Etik' : 'Riwayat Disiplin'}
            </h2>
            <div className={styles.tableActions}>
              <Button
                variant="success"
                onClick={() => activeTab === 'etik' ? openEtikModal() : openDisiplinModal()}
              >
                <MdAdd size={20} />
                Tambah
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className={styles.searchFilterBar}>
            <div className={styles.searchField}>
              <label className={styles.searchLabel} htmlFor="search">Cari</label>
              <div className={styles.searchWrapper}>
                <MdSearch className={styles.searchIcon} size={22} />
                <input
                  id="search"
                  type="text"
                  placeholder={`Cari berdasarkan nama pegawai, jenis pelanggaran...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                    <MdClose size={18} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={styles.inlineFilter}>
              <label className={styles.filterLabel} htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.inlineFilter}>
              <label className={styles.filterLabel} htmlFor="tingkatFilter">
                {activeTab === 'etik' ? 'Tingkat' : 'Tindakan'}
              </label>
              <select
                id="tingkatFilter"
                className={styles.filterSelect}
                value={tingkatFilter}
                onChange={(e) => setTingkatFilter(e.target.value)}
              >
                <option value="">{activeTab === 'etik' ? 'Semua Tingkat' : 'Semua Tindakan'}</option>
                {(activeTab === 'etik' ? TINGKAT_OPTIONS : TINDAKAN_OPTIONS).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.inlineFilter}>
              <label className={styles.filterLabel} htmlFor="userFilter">Pegawai</label>
              <select
                id="userFilter"
                className={styles.filterSelect}
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="">Semua Pegawai</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <span>Memuat data...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className={styles.emptyState}>
                <MdAssignment size={64} />
                <h3>Tidak ada data ditemukan</h3>
                <p>Coba ubah kata kunci pencarian atau filter Anda</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pegawai</th>
                    <th>Tanggal</th>
                    <th>Jenis Pelanggaran</th>
                    <th>{activeTab === 'etik' ? 'Tingkat' : 'Tindakan'}</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.nameCell}>
                        <span className={styles.userName}>{item.userName}</span>
                      </td>
                      <td>{formatDateToIndonesian(item.tanggal)}</td>
                      <td>{item.jenis}</td>
                      <td>
                        {activeTab === 'etik' 
                          ? getTingkatBadge(item.tingkat)
                          : getTindakanBadge(item.tindakan)
                        }
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={`${styles.iconButton} ${styles.iconButtonView}`}
                            onClick={() => openViewModal(item)}
                            title="Lihat Detail"
                          >
                            <MdVisibility size={18} />
                            <span className={styles.tooltip}>Lihat</span>
                          </button>
                          <button 
                            className={`${styles.iconButton} ${styles.iconButtonEdit}`}
                            onClick={() => activeTab === 'etik' ? openEtikModal(item) : openDisiplinModal(item)}
                            title="Edit"
                          >
                            <MdEdit size={18} />
                            <span className={styles.tooltip}>Edit</span>
                          </button>
                          <button 
                            className={`${styles.iconButton} ${styles.iconButtonDelete}`}
                            onClick={() => openDeleteModal(item)}
                            title="Hapus"
                          >
                            <MdDelete size={18} />
                            <span className={styles.tooltip}>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredData.length > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Menampilkan {filteredData.length} data {activeTab === 'etik' ? 'etik' : 'disiplin'}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Etik Form Modal */}
      <Modal isOpen={showEtikModal} onClose={() => setShowEtikModal(false)} title={editingEtikId ? 'Edit Data Etik' : 'Tambah Data Etik'}>
        <Form onSubmit={handleSaveEtik}>
          <div className={styles.formContent}>
            <div className={styles.formGroup}>
              <label>Pegawai <span className={styles.required}>*</span></label>
              <select
                value={etikForm.userId}
                onChange={(e) => setEtikForm({ ...etikForm, userId: e.target.value })}
                className={styles.formSelect}
                required
              >
                <option value="">Pilih Pegawai</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} - {user.nip}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Tanggal Kejadian <span className={styles.required}>*</span></label>
              <Input
                type="date"
                value={etikForm.tanggal}
                onChange={(e) => setEtikForm({ ...etikForm, tanggal: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Jenis Pelanggaran <span className={styles.required}>*</span></label>
              <Input
                type="text"
                value={etikForm.jenis}
                onChange={(e) => setEtikForm({ ...etikForm, jenis: e.target.value })}
                placeholder="Masukkan jenis pelanggaran"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tingkat <span className={styles.required}>*</span></label>
              <select
                value={etikForm.tingkat}
                onChange={(e) => setEtikForm({ ...etikForm, tingkat: e.target.value })}
                className={styles.formSelect}
                required
              >
                {TINGKAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroupFull}>
              <label>Uraian Singkat <span className={styles.required}>*</span></label>
              <textarea
                value={etikForm.uraian}
                onChange={(e) => setEtikForm({ ...etikForm, uraian: e.target.value })}
                placeholder="Jelaskan uraian singkat pelanggaran"
                rows={3}
                className={styles.formTextarea}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Status <span className={styles.required}>*</span></label>
              <select
                value={etikForm.status}
                onChange={(e) => setEtikForm({ ...etikForm, status: e.target.value })}
                className={styles.formSelect}
                required
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Tanggal Penyelesaian</label>
              <Input
                type="date"
                value={etikForm.tanggal_selesai}
                onChange={(e) => setEtikForm({ ...etikForm, tanggal_selesai: e.target.value })}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>Catatan</label>
              <textarea
                value={etikForm.catatan}
                onChange={(e) => setEtikForm({ ...etikForm, catatan: e.target.value })}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>Dokumen Pendukung {!editingEtikId && <span className={styles.required}>*</span>}</label>
              <div
                className={styles.fileDrop}
                onClick={() => fileEtikRef.current?.click()}
                onDrop={handleEtikDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <MdCloudUpload size={32} className={styles.fileDropIcon} />
                <p className={styles.fileDropTitle}>Pilih atau seret file ke sini</p>
                <span className={styles.fileDropHint}>PDF, maks 2MB</span>
                {etikForm.file?.name && (
                  <span className={styles.fileDropFileName}>{etikForm.file.name}</span>
                )}
                <input
                  ref={fileEtikRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleEtikFile}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button type="button" variant="outline" onClick={() => setShowEtikModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              <MdSave size={18} />
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Disiplin Form Modal */}
      <Modal isOpen={showDisiplinModal} onClose={() => setShowDisiplinModal(false)} title={editingDisiplinId ? 'Edit Data Disiplin' : 'Tambah Data Disiplin'}>
        <Form onSubmit={handleSaveDisiplin}>
          <div className={styles.formContent}>
            <div className={styles.formGroup}>
              <label>Pegawai <span className={styles.required}>*</span></label>
              <select
                value={disiplinForm.userId}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, userId: e.target.value })}
                className={styles.formSelect}
                required
              >
                <option value="">Pilih Pegawai</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} - {user.nip}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Tanggal Kejadian <span className={styles.required}>*</span></label>
              <Input
                type="date"
                value={disiplinForm.tanggal}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, tanggal: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Jenis Pelanggaran <span className={styles.required}>*</span></label>
              <Input
                type="text"
                value={disiplinForm.jenis}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, jenis: e.target.value })}
                placeholder="Masukkan jenis pelanggaran"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tindakan Disiplin <span className={styles.required}>*</span></label>
              <select
                value={disiplinForm.tindakan}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, tindakan: e.target.value })}
                className={styles.formSelect}
                required
              >
                <option value="">Pilih Tindakan</option>
                {TINDAKAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroupFull}>
              <label>Uraian Singkat <span className={styles.required}>*</span></label>
              <textarea
                value={disiplinForm.uraian}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, uraian: e.target.value })}
                placeholder="Jelaskan uraian singkat pelanggaran"
                rows={3}
                className={styles.formTextarea}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Status <span className={styles.required}>*</span></label>
              <select
                value={disiplinForm.status}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, status: e.target.value })}
                className={styles.formSelect}
                required
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Tanggal Penyelesaian</label>
              <Input
                type="date"
                value={disiplinForm.tanggal_selesai}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, tanggal_selesai: e.target.value })}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>Catatan</label>
              <textarea
                value={disiplinForm.catatan}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, catatan: e.target.value })}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>Dokumen Pendukung {!editingDisiplinId && <span className={styles.required}>*</span>}</label>
              <div
                className={styles.fileDrop}
                onClick={() => fileDisiplinRef.current?.click()}
                onDrop={handleDisiplinDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <MdCloudUpload size={32} className={styles.fileDropIcon} />
                <p className={styles.fileDropTitle}>Pilih atau seret file ke sini</p>
                <span className={styles.fileDropHint}>PDF, maks 2MB</span>
                {disiplinForm.file?.name && (
                  <span className={styles.fileDropFileName}>{disiplinForm.file.name}</span>
                )}
                <input
                  ref={fileDisiplinRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleDisiplinFile}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button type="button" variant="outline" onClick={() => setShowDisiplinModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              <MdSave size={18} />
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Konfirmasi Hapus">
        <div className={styles.deleteConfirm}>
          <p>Apakah Anda yakin ingin menghapus data berikut?</p>
          {deleteItem && (
            <div className={styles.deleteInfo}>
              <p><strong>Pegawai:</strong> {deleteItem.userName}</p>
              <p><strong>Jenis Pelanggaran:</strong> {deleteItem.jenis}</p>
              <p><strong>Tanggal:</strong> {formatDateToIndonesian(deleteItem.tanggal)}</p>
            </div>
          )}
          <div className={styles.modalFooter}>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal isOpen={showViewModal} onClose={handleCloseView} title="Detail Data">
        {viewItem && (
          <div className={styles.detailView}>
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Pegawai</span>
                <span className={styles.detailValue}>{viewItem.userName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tanggal Kejadian</span>
                <span className={styles.detailValue}>{formatDateToIndonesian(viewItem.tanggal)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Jenis Pelanggaran</span>
                <span className={styles.detailValue}>{viewItem.jenis}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Uraian</span>
                <span className={styles.detailValue}>{viewItem.uraian}</span>
              </div>
              {viewItem.tingkat && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tingkat</span>
                  <span className={styles.detailValue}>{getTingkatBadge(viewItem.tingkat)}</span>
                </div>
              )}
              {viewItem.tindakan && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tindakan</span>
                  <span className={styles.detailValue}>{getTindakanBadge(viewItem.tindakan)}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>{getStatusBadge(viewItem.status)}</span>
              </div>
              {viewItem.tanggal_selesai && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tanggal Penyelesaian</span>
                  <span className={styles.detailValue}>{formatDateToIndonesian(viewItem.tanggal_selesai)}</span>
                </div>
              )}
              {viewItem.catatan && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Catatan</span>
                  <span className={styles.detailValue}>{viewItem.catatan}</span>
                </div>
              )}
            </div>
            
            {pdfUrl && (
              <div className={styles.pdfSection}>
                <h4>Dokumen Pendukung</h4>
                <iframe src={pdfUrl} className={styles.pdfFrame} title="Dokumen PDF" />
              </div>
            )}
            
            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={handleCloseView}>
                Tutup
              </Button>
              {pdfUrl && (
                <Button variant="primary" onClick={handleDownload}>
                  <MdDownload size={18} />
                  Download
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminEtikDisiplin;
