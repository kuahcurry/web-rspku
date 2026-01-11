import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Tabs from '../../../components/tabs/Tabs';
import Table from '../../../components/table/Table';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import { 
  MdAdd, 
  MdSave, 
  MdSearch, 
  MdVisibility, 
  MdDelete, 
  MdEdit, 
  MdDownload, 
  MdCloudUpload,
  MdFilterList,
  MdClose
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('etik');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [etikRecords, setEtikRecords] = useState([]);
  const [disiplinRecords, setDisiplinRecords] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [filtersEtik, setFiltersEtik] = useState({ search: '', year: 'Semua', status: 'Semua', user: 'Semua' });
  const [filtersDisiplin, setFiltersDisiplin] = useState({ search: '', year: 'Semua', tingkat: 'Semua', status: 'Semua', user: 'Semua' });
  
  const [showEtikModal, setShowEtikModal] = useState(false);
  const [showDisiplinModal, setShowDisiplinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const [editingEtikId, setEditingEtikId] = useState(null);
  const [editingDisiplinId, setEditingDisiplinId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  
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
      
      // Fetch etik records
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
      
      // Fetch disiplin records
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

  const yearsEtik = useMemo(() => {
    const years = Array.from(
      new Set(etikRecords.map((item) => new Date(item.tanggal).getFullYear().toString()))
    ).sort((a, b) => Number(b) - Number(a));
    return ['Semua', ...years];
  }, [etikRecords]);

  const yearsDisiplin = useMemo(() => {
    const years = Array.from(
      new Set(disiplinRecords.map((item) => new Date(item.tanggal).getFullYear().toString()))
    ).sort((a, b) => Number(b) - Number(a));
    return ['Semua', ...years];
  }, [disiplinRecords]);

  const filteredEtik = useMemo(() => {
    return etikRecords.filter((item) => {
      const matchesSearch =
        !filtersEtik.search ||
        item.jenis.toLowerCase().includes(filtersEtik.search.toLowerCase()) ||
        item.uraian.toLowerCase().includes(filtersEtik.search.toLowerCase()) ||
        item.userName.toLowerCase().includes(filtersEtik.search.toLowerCase());
      const matchesYear =
        filtersEtik.year === 'Semua' ||
        new Date(item.tanggal).getFullYear().toString() === filtersEtik.year;
      const matchesStatus = filtersEtik.status === 'Semua' || item.status === filtersEtik.status;
      const matchesUser = filtersEtik.user === 'Semua' || item.userId.toString() === filtersEtik.user;
      return matchesSearch && matchesYear && matchesStatus && matchesUser;
    });
  }, [etikRecords, filtersEtik]);

  const filteredDisiplin = useMemo(() => {
    return disiplinRecords.filter((item) => {
      const matchesSearch =
        !filtersDisiplin.search ||
        item.jenis.toLowerCase().includes(filtersDisiplin.search.toLowerCase()) ||
        item.uraian.toLowerCase().includes(filtersDisiplin.search.toLowerCase()) ||
        item.userName.toLowerCase().includes(filtersDisiplin.search.toLowerCase());
      const matchesYear =
        filtersDisiplin.year === 'Semua' ||
        new Date(item.tanggal).getFullYear().toString() === filtersDisiplin.year;
      const matchesTingkat =
        filtersDisiplin.tingkat === 'Semua' || item.tindakan === filtersDisiplin.tingkat;
      const matchesStatus = filtersDisiplin.status === 'Semua' || item.status === filtersDisiplin.status;
      const matchesUser = filtersDisiplin.user === 'Semua' || item.userId.toString() === filtersDisiplin.user;
      return matchesSearch && matchesYear && matchesTingkat && matchesStatus && matchesUser;
    });
  }, [disiplinRecords, filtersDisiplin]);

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
      alert('Hanya file PDF yang diperbolehkan');
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 2MB');
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
      alert('Hanya file PDF yang diperbolehkan');
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 2MB');
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
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (!etikForm.file) {
      alert('Mohon upload dokumen pendukung');
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
      formData.append('file', etikForm.file);

      const response = await authenticatedFetch('/api/admin/etik-disiplin', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Data berhasil disimpan');
        setShowEtikModal(false);
        setEditingEtikId(null);
        fetchData();
      } else {
        alert(data.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error saving etik:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDisiplin = async (e) => {
    e.preventDefault();
    if (!disiplinForm.userId || !disiplinForm.tanggal || !disiplinForm.jenis || !disiplinForm.uraian || !disiplinForm.tindakan) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (!disiplinForm.file) {
      alert('Mohon upload dokumen pendukung');
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
      formData.append('file', disiplinForm.file);

      const response = await authenticatedFetch('/api/admin/etik-disiplin', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Data berhasil disimpan');
        setShowDisiplinModal(false);
        setEditingDisiplinId(null);
        fetchData();
      } else {
        alert(data.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error saving disiplin:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDelete = () => {
    setDeleteMode(true);
    setDeleteTargets([]);
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setDeleteMode(false);
    setDeleteTargets([]);
    setShowDeleteModal(false);
  };

  const handleDeleteButtonClick = () => {
    const currentCount = deleteTargets.filter((t) => t.scope === activeTab).length;
    if (!deleteMode) {
      handleStartDelete();
      return;
    }
    if (currentCount) {
      setShowDeleteModal(true);
      return;
    }
    handleCancelDelete();
  };

  const handleSelectForDelete = (item, scope) => {
    if (!deleteMode) return;
    setDeleteTargets((prev) => {
      const exists = prev.find((entry) => entry.id === item.id && entry.scope === scope);
      if (exists) {
        return prev.filter((entry) => !(entry.id === item.id && entry.scope === scope));
      }
      return [...prev, { id: item.id, scope, label: item.jenis, tanggal: item.tanggal, userName: item.userName }];
    });
  };

  const handleConfirmDelete = async () => {
    const idsToDelete = deleteTargets.map((d) => d.id);
    if (!idsToDelete.length) return;

    setIsSubmitting(true);
    try {
      if (idsToDelete.length === 1) {
        // Single delete
        const response = await authenticatedFetch(`/api/admin/etik-disiplin/${idsToDelete[0]}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (!data.success) {
          alert(data.message || 'Gagal menghapus data');
          return;
        }
      } else {
        // Bulk delete
        const response = await authenticatedFetch('/api/admin/etik-disiplin/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: idsToDelete })
        });
        const data = await response.json();
        if (!data.success) {
          alert(data.message || 'Gagal menghapus data');
          return;
        }
      }
      
      alert('Data berhasil dihapus');
      fetchData();
      handleCancelDelete();
    } catch (error) {
      console.error('Error deleting records:', error);
      alert('Terjadi kesalahan saat menghapus data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openView = async (item) => {
    setViewItem(item);
    setViewOpen(true);
    if (item.fileUrl) {
      setPdfUrl(item.fileUrl);
      setLoadingPdf(false);
      return;
    }
    if (item.dokumenUrl) {
      setPdfUrl(item.dokumenUrl);
      setLoadingPdf(false);
      return;
    }
    setPdfUrl(null);
    setLoadingPdf(false);
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewItem(null);
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setLoadingPdf(false);
  };

  const handleDownloadView = () => {
    const url = pdfUrl || viewItem?.fileUrl || viewItem?.dokumenUrl;
    if (!url) {
      alert('Dokumen belum tersedia.');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = viewItem?.fileName || 'dokumen.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusPill = (label, tone = 'neutral') => {
    return <span className={`${styles.badge} ${styles[`badge-${tone}`]}`}>{label}</span>;
  };

  const deleteCount = deleteTargets.filter((t) => t.scope === activeTab).length;

  return (
    <AdminLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Manajemen Etik & Disiplin</h1>
        <p className={styles.pageSubtitle}>
          Kelola riwayat etik dan disiplin pegawai secara terpusat
        </p>
      </header>

      <div className={styles.container}>
        <Card padding="normal" className={styles.cardShell}>
          <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} className={styles.tabGroup} />

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <MdSearch className={styles.searchIcon} size={20} />
              <input
                type="text"
                placeholder={`Cari ${activeTab === 'etik' ? 'etik' : 'disiplin'}...`}
                value={activeTab === 'etik' ? filtersEtik.search : filtersDisiplin.search}
                onChange={(e) =>
                  activeTab === 'etik'
                    ? setFiltersEtik({ ...filtersEtik, search: e.target.value })
                    : setFiltersDisiplin({ ...filtersDisiplin, search: e.target.value })
                }
                className={styles.searchInput}
              />
            </div>

            <div className={styles.toolbarActions}>
              <Button
                variant="outline"
                onClick={() => setShowFilterModal(true)}
                className={styles.filterBtn}
              >
                <MdFilterList size={18} />
                Filter
              </Button>

              <Button
                variant="danger"
                onClick={handleDeleteButtonClick}
                className={styles.deleteBtn}
              >
                {deleteMode ? (
                  deleteCount > 0 ? (
                    <>
                      <MdDelete size={18} />
                      Hapus ({deleteCount})
                    </>
                  ) : (
                    <>
                      <MdClose size={18} />
                      Batal
                    </>
                  )
                ) : (
                  <>
                    <MdDelete size={18} />
                    Hapus
                  </>
                )}
              </Button>

              <Button
                variant="success"
                onClick={() => (activeTab === 'etik' ? openEtikModal() : openDisiplinModal())}
                className={styles.addBtn}
              >
                <MdAdd size={20} />
                Tambah {activeTab === 'etik' ? 'Etik' : 'Disiplin'}
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className={styles.loadingState}>Memuat data...</div>
          ) : activeTab === 'etik' ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {deleteMode && <th className={styles.checkCol}></th>}
                    <th>Pegawai</th>
                    <th>Tanggal</th>
                    <th>Jenis Pelanggaran</th>
                    <th>Tingkat</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEtik.length === 0 ? (
                    <tr>
                      <td colSpan={deleteMode ? 7 : 6} className={styles.emptyRow}>
                        Tidak ada data etik
                      </td>
                    </tr>
                  ) : (
                    filteredEtik.map((item) => {
                      const isSelected = deleteTargets.some((t) => t.id === item.id && t.scope === 'etik');
                      return (
                        <tr
                          key={item.id}
                          className={`${deleteMode ? styles.selectableRow : ''} ${isSelected ? styles.selectedRow : ''}`}
                          onClick={() => deleteMode && handleSelectForDelete(item, 'etik')}
                        >
                          {deleteMode && (
                            <td className={styles.checkCol}>
                              <input type="checkbox" checked={isSelected} readOnly />
                            </td>
                          )}
                          <td>
                            <div className={styles.userCell}>
                              <span>{item.userName}</span>
                            </div>
                          </td>
                          <td>{formatDateToIndonesian(item.tanggal)}</td>
                          <td>{item.jenis}</td>
                          <td>{renderStatusPill(item.tingkat, item.tingkat === 'Berat' ? 'danger' : item.tingkat === 'Sedang' ? 'warning' : 'info')}</td>
                          <td>{renderStatusPill(item.status, item.status === 'Selesai' ? 'success' : item.status === 'Proses' ? 'warning' : 'neutral')}</td>
                          <td>
                            <div className={styles.actionBtns}>
                              <Button 
                                variant="primary" 
                                size="small"
                                icon={<MdVisibility size={16} />}
                                onClick={(e) => { e.stopPropagation(); openView(item); }}
                              >
                                Lihat
                              </Button>
                              <Button 
                                variant="warning" 
                                size="small"
                                icon={<MdEdit size={16} />}
                                onClick={(e) => { e.stopPropagation(); openEtikModal(item); }}
                              >
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {deleteMode && <th className={styles.checkCol}></th>}
                    <th>Pegawai</th>
                    <th>Tanggal</th>
                    <th>Jenis Pelanggaran</th>
                    <th>Tindakan Disiplin</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisiplin.length === 0 ? (
                    <tr>
                      <td colSpan={deleteMode ? 7 : 6} className={styles.emptyRow}>
                        Tidak ada data disiplin
                      </td>
                    </tr>
                  ) : (
                    filteredDisiplin.map((item) => {
                      const isSelected = deleteTargets.some((t) => t.id === item.id && t.scope === 'disiplin');
                      return (
                        <tr
                          key={item.id}
                          className={`${deleteMode ? styles.selectableRow : ''} ${isSelected ? styles.selectedRow : ''}`}
                          onClick={() => deleteMode && handleSelectForDelete(item, 'disiplin')}
                        >
                          {deleteMode && (
                            <td className={styles.checkCol}>
                              <input type="checkbox" checked={isSelected} readOnly />
                            </td>
                          )}
                          <td>
                            <div className={styles.userCell}>
                              <span>{item.userName}</span>
                            </div>
                          </td>
                          <td>{formatDateToIndonesian(item.tanggal)}</td>
                          <td>{item.jenis}</td>
                          <td>{renderStatusPill(item.tindakan, 'warning')}</td>
                          <td>{renderStatusPill(item.status, item.status === 'Selesai' ? 'success' : item.status === 'Proses' ? 'warning' : 'neutral')}</td>
                          <td>
                            <div className={styles.actionBtns}>
                              <Button 
                                variant="primary" 
                                size="small"
                                icon={<MdVisibility size={16} />}
                                onClick={(e) => { e.stopPropagation(); openView(item); }}
                              >
                                Lihat
                              </Button>
                              <Button 
                                variant="warning" 
                                size="small"
                                icon={<MdEdit size={16} />}
                                onClick={(e) => { e.stopPropagation(); openDisiplinModal(item); }}
                              >
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Filter Modal */}
      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter Data">
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label>Pegawai</label>
            <select
              value={activeTab === 'etik' ? filtersEtik.user : filtersDisiplin.user}
              onChange={(e) =>
                activeTab === 'etik'
                  ? setFiltersEtik({ ...filtersEtik, user: e.target.value })
                  : setFiltersDisiplin({ ...filtersDisiplin, user: e.target.value })
              }
              className={styles.filterSelect}
            >
              <option value="Semua">Semua Pegawai</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Tahun</label>
            <select
              value={activeTab === 'etik' ? filtersEtik.year : filtersDisiplin.year}
              onChange={(e) =>
                activeTab === 'etik'
                  ? setFiltersEtik({ ...filtersEtik, year: e.target.value })
                  : setFiltersDisiplin({ ...filtersDisiplin, year: e.target.value })
              }
              className={styles.filterSelect}
            >
              {(activeTab === 'etik' ? yearsEtik : yearsDisiplin).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              value={activeTab === 'etik' ? filtersEtik.status : filtersDisiplin.status}
              onChange={(e) =>
                activeTab === 'etik'
                  ? setFiltersEtik({ ...filtersEtik, status: e.target.value })
                  : setFiltersDisiplin({ ...filtersDisiplin, status: e.target.value })
              }
              className={styles.filterSelect}
            >
              <option value="Semua">Semua Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {activeTab === 'disiplin' && (
            <div className={styles.filterGroup}>
              <label>Tindakan Disiplin</label>
              <select
                value={filtersDisiplin.tingkat}
                onChange={(e) => setFiltersDisiplin({ ...filtersDisiplin, tingkat: e.target.value })}
                className={styles.filterSelect}
              >
                <option value="Semua">Semua Tindakan</option>
                {TINDAKAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.filterActions}>
            <Button variant="danger" onClick={() => setShowFilterModal(false)}>Tutup</Button>
            <Button
              variant="outline"
              onClick={() => {
                if (activeTab === 'etik') {
                  setFiltersEtik({ search: '', year: 'Semua', status: 'Semua', user: 'Semua' });
                } else {
                  setFiltersDisiplin({ search: '', year: 'Semua', tingkat: 'Semua', status: 'Semua', user: 'Semua' });
                }
              }}
            >
              Reset Filter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Etik Form Modal */}
      <Modal isOpen={showEtikModal} onClose={() => setShowEtikModal(false)} title={editingEtikId ? 'Edit Data Etik' : 'Tambah Data Etik'}>
        <Form onSubmit={handleSaveEtik}>
          <div className={styles.formGrid}>
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
              <label>Dokumen Pendukung</label>
              <div
                className={styles.dropzone}
                onClick={() => fileEtikRef.current?.click()}
                onDrop={handleEtikDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <MdCloudUpload size={32} className={styles.dropzoneIcon} />
                <p className={styles.dropzoneTitle}>Pilih atau seret file ke sini</p>
                <span className={styles.dropzoneHint}>PDF, maks 2MB</span>
                <Button
                  variant="outline"
                  size="small"
                  icon={<MdCloudUpload />}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileEtikRef.current?.click();
                  }}
                >
                  Pilih File
                </Button>
                {etikForm.file?.name && (
                  <span className={styles.dropzoneFileName}>{etikForm.file.name}</span>
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

          <div className={styles.modalActions}>
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
          <div className={styles.formGrid}>
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
              <label>Dokumen Pendukung</label>
              <div
                className={styles.dropzone}
                onClick={() => fileDisiplinRef.current?.click()}
                onDrop={handleDisiplinDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <MdCloudUpload size={32} className={styles.dropzoneIcon} />
                <p className={styles.dropzoneTitle}>Pilih atau seret file ke sini</p>
                <span className={styles.dropzoneHint}>PDF, maks 2MB</span>
                <Button
                  variant="outline"
                  size="small"
                  icon={<MdCloudUpload />}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileDisiplinRef.current?.click();
                  }}
                >
                  Pilih File
                </Button>
                {disiplinForm.file?.name && (
                  <span className={styles.dropzoneFileName}>{disiplinForm.file.name}</span>
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

          <div className={styles.modalActions}>
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
          <p>Apakah Anda yakin ingin menghapus {deleteCount} data berikut?</p>
          <ul className={styles.deleteList}>
            {deleteTargets.filter((t) => t.scope === activeTab).map((t) => (
              <li key={t.id}>
                <strong>{t.userName}</strong> - {t.label} ({formatDateToIndonesian(t.tanggal)})
              </li>
            ))}
          </ul>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={handleCancelDelete}>Batal</Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal isOpen={viewOpen} onClose={handleCloseView} title="Detail Data" className={styles.fullscreenModal}>
        {viewItem && (
          <div className={styles.viewDetail}>
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
                  <span className={styles.detailValue}>{viewItem.tingkat}</span>
                </div>
              )}
              {viewItem.tindakan && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tindakan</span>
                  <span className={styles.detailValue}>{viewItem.tindakan}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>
                  {renderStatusPill(viewItem.status, viewItem.status === 'Selesai' ? 'success' : viewItem.status === 'Proses' ? 'warning' : 'neutral')}
                </span>
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
            <div className={styles.pdfPreview}>
              {loadingPdf ? (
                <div className={styles.pdfEmpty}>Memuat dokumen...</div>
              ) : pdfUrl ? (
                <iframe src={pdfUrl} className={styles.pdfFrame} title="Dokumen PDF" />
              ) : (
                <div className={styles.pdfEmpty}>Dokumen belum tersedia.</div>
              )}
            </div>
            <div className={styles.modalActions}>
              <Button variant="danger" onClick={handleCloseView}>
                Tutup
              </Button>
              <Button variant="primary" icon={<MdDownload />} iconPosition="left" onClick={handleDownloadView}>
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminEtikDisiplin;
