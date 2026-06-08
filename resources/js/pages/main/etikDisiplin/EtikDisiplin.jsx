import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Banner from '../../../components/banner/Banner';
import Card from '../../../components/card/Card';
import Tabs from '../../../components/tabs/Tabs';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import {
  MdAdd,
  MdSave,
  MdSearch,
  MdVisibility,
  MdDownload,
  MdCloudUpload,
  MdClose,
  MdAssignment,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';
import { isAuthenticated, authenticatedFetch } from '../../../utils/auth';
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

const getStatusBadge = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'selesai') return { label: 'Selesai', className: styles.statusSuccess };
  if (normalized === 'proses') return { label: 'Proses', className: styles.statusWarning };
  if (normalized === 'pending') return { label: 'Pending', className: styles.statusInfo };
  return { label: status, className: styles.statusNeutral };
};

const getTingkatBadge = (tingkat) => {
  const normalized = (tingkat || '').toLowerCase();
  if (normalized === 'berat') return { label: 'Berat', className: styles.statusDanger };
  if (normalized === 'sedang') return { label: 'Sedang', className: styles.statusWarning };
  if (normalized === 'ringan') return { label: 'Ringan', className: styles.statusInfo };
  return { label: tingkat, className: styles.statusNeutral };
};

const EtikDisiplin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('etik');
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [etikRecords, setEtikRecords] = useState([]);
  const [disiplinRecords, setDisiplinRecords] = useState([]);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tingkatFilter, setTingkatFilter] = useState('');
  
  // Modal states
  const [showEtikModal, setShowEtikModal] = useState(false);
  const [showDisiplinModal, setShowDisiplinModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  
  // File refs
  const fileEtikRef = useRef(null);
  const fileDisiplinRef = useRef(null);
  
  // Forms
  const [etikForm, setEtikForm] = useState({
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

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
    perPage: 15
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!viewOpen && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [viewOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/etik-disiplin');
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        const etik = records.filter((d) => d.jenis === 'etik');
        const disiplin = records.filter((d) => d.jenis === 'disiplin');
        setEtikRecords(etik);
        setDisiplinRecords(disiplin);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setBanner({ message: 'Gagal memuat data', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered data based on active tab
  const filteredData = useMemo(() => {
    const records = activeTab === 'etik' ? etikRecords : disiplinRecords;
    return records.filter((item) => {
      const matchesSearch = !searchTerm ||
        item.jenis_pelanggaran?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.uraian_singkat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter ||
        item.status_penyelesaian?.toLowerCase() === statusFilter.toLowerCase();

      const matchesTingkat = !tingkatFilter ||
        (activeTab === 'etik' ? item.tingkat === tingkatFilter : item.tindakan === tingkatFilter);

      return matchesSearch && matchesStatus && matchesTingkat;
    });
  }, [activeTab, etikRecords, disiplinRecords, searchTerm, statusFilter, tingkatFilter]);

  // File handlers for Etik
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
    if (file.size > 5 * 1024 * 1024) {
      setBanner({ message: 'File terlalu besar. Maksimal 5MB', variant: 'error' });
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

  // File handlers for Disiplin
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
    if (file.size > 5 * 1024 * 1024) {
      setBanner({ message: 'File terlalu besar. Maksimal 5MB', variant: 'error' });
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

  const openEtikModal = () => {
    setEtikForm({
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
    setShowEtikModal(true);
  };

  const openDisiplinModal = () => {
    setDisiplinForm({
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
    setShowDisiplinModal(true);
  };

  const handleSaveEtik = async (e) => {
    e.preventDefault();
    if (!etikForm.tanggal || !etikForm.jenis || !etikForm.uraian || !etikForm.tingkat || !etikForm.status) return;

    if (!etikForm.file) {
      setBanner({ message: 'File dokumen wajib diupload', variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('jenis', 'etik');
      formData.append('tanggal_kejadian', etikForm.tanggal);
      formData.append('jenis_pelanggaran', etikForm.jenis);
      formData.append('uraian_singkat', etikForm.uraian);
      formData.append('tingkat', etikForm.tingkat);
      formData.append('status_penyelesaian', etikForm.status);
      if (etikForm.tanggal_selesai) formData.append('tanggal_penyelesaian', etikForm.tanggal_selesai);
      if (etikForm.catatan) formData.append('catatan', etikForm.catatan);
      formData.append('file', etikForm.file);

      const response = await authenticatedFetch('/api/etik-disiplin', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setBanner({ message: 'Data etik berhasil disimpan', variant: 'success' });
        setShowEtikModal(false);
        fetchData();
      } else {
        const error = await response.json();
        setBanner({ message: error.message || 'Gagal menyimpan data', variant: 'error' });
      }
    } catch (error) {
      setBanner({ message: 'Terjadi kesalahan saat menyimpan data', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDisiplin = async (e) => {
    e.preventDefault();
    if (!disiplinForm.tanggal || !disiplinForm.jenis || !disiplinForm.uraian || !disiplinForm.tindakan) return;

    if (!disiplinForm.file) {
      setBanner({ message: 'File dokumen wajib diupload', variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('jenis', 'disiplin');
      formData.append('tanggal_kejadian', disiplinForm.tanggal);
      formData.append('jenis_pelanggaran', disiplinForm.jenis);
      formData.append('uraian_singkat', disiplinForm.uraian);
      formData.append('tindakan', disiplinForm.tindakan);
      formData.append('status_penyelesaian', disiplinForm.status);
      if (disiplinForm.tanggal_selesai) formData.append('tanggal_penyelesaian', disiplinForm.tanggal_selesai);
      if (disiplinForm.catatan) formData.append('catatan', disiplinForm.catatan);
      formData.append('file', disiplinForm.file);

      const response = await authenticatedFetch('/api/etik-disiplin', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setBanner({ message: 'Data disiplin berhasil disimpan', variant: 'success' });
        setShowDisiplinModal(false);
        fetchData();
      } else {
        const error = await response.json();
        setBanner({ message: error.message || 'Gagal menyimpan data', variant: 'error' });
      }
    } catch (error) {
      setBanner({ message: 'Terjadi kesalahan saat menyimpan data', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openView = async (item) => {
    setViewItem(item);
    setViewOpen(true);
    setLoadingPdf(true);
    setPdfUrl(null);

    try {
      const response = await authenticatedFetch(`/api/etik-disiplin/${item.id}`);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          setBanner({ message: errorData.message || 'Gagal memuat dokumen PDF', variant: 'error' });
        } catch {
          setBanner({ message: 'Gagal memuat dokumen PDF', variant: 'error' });
        }
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading document:', error);
      setBanner({ message: 'Terjadi kesalahan saat memuat dokumen', variant: 'error' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Etik & Disiplin</h1>
              <p className={styles.pageSubtitle}>Riwayat pembinaan etik dan disiplin yang pernah diterima perawat</p>
            </div>
          </div>
        </header>

        {/* Table Card */}
        <Card className={styles.tableCard}>
          {/* Tabs */}
          <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} className={styles.tabGroup} />

          {/* Table Header */}
          <div className={styles.tableCardHeader}>
            <h3 className={styles.tableTitle}>
              {activeTab === 'etik' ? 'Riwayat Pembinaan Etik' : 'Riwayat Disiplin'}
            </h3>
            <div className={styles.tableActions}>
              <Button
                variant="success"
                size="medium"
                icon={<MdAdd />}
                iconPosition="left"
                onClick={activeTab === 'etik' ? openEtikModal : openDisiplinModal}
              >
                Tambah
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className={styles.searchFilterBar}>
            <div className={styles.searchField}>
              <label className={styles.searchLabel} htmlFor="searchInput">
                Cari
              </label>
              <div className={styles.searchWrapper}>
                <MdSearch className={styles.searchIcon} size={22} />
                <input
                  id="searchInput"
                  type="text"
                  placeholder="Cari pelanggaran atau uraian..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    className={styles.clearSearch}
                    onClick={() => setSearchTerm('')}
                  >
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
                {STATUS_OPTIONS.map(opt => (
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
                {(activeTab === 'etik' ? TINGKAT_OPTIONS : TINDAKAN_OPTIONS).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <span>Memuat data {activeTab}...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className={styles.emptyState}>
                <MdAssignment size={64} />
                <h3>Tidak ada data {activeTab} ditemukan</h3>
                <p>Coba ubah kata kunci pencarian atau filter Anda</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jenis Pelanggaran</th>
                    <th>{activeTab === 'etik' ? 'Tingkat' : 'Tindakan'}</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => {
                    const statusBadge = getStatusBadge(item.status_penyelesaian);
                    const tingkatBadge = activeTab === 'etik' 
                      ? getTingkatBadge(item.tingkat)
                      : { label: item.tindakan, className: styles.statusWarning };
                    return (
                      <tr key={item.id}>
                        <td>{formatDateToIndonesian(item.tanggal_kejadian)}</td>
                        <td className={styles.nameCell}>
                          <span className={styles.userName}>{item.jenis_pelanggaran}</span>
                          {item.uraian_singkat && (
                            <span className={styles.userSubtext}>{item.uraian_singkat}</span>
                          )}
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${tingkatBadge.className}`}>
                            {tingkatBadge.label}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={`${styles.iconButton} ${styles.iconButtonView}`}
                              onClick={() => openView(item)}
                              title="Lihat Detail"
                            >
                              <MdVisibility size={18} />
                              <span className={styles.tooltip}>Lihat Detail</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredData.length > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Menampilkan {filteredData.length} data {activeTab}
              </span>
            </div>
          )}
        </Card>

        {/* Add Etik Modal */}
        <Modal
          isOpen={showEtikModal}
          onClose={() => setShowEtikModal(false)}
          title="Tambah Catatan Etik"
          size="large"
        >
          <Form onSubmit={handleSaveEtik}>
            <div className={styles.formContent}>
              <Form.Row columns={2}>
                <Input
                  label="Tanggal Kejadian"
                  type="date"
                  value={etikForm.tanggal}
                  onChange={(e) => setEtikForm({ ...etikForm, tanggal: e.target.value })}
                  required
                />
                <Input
                  label="Tanggal Penyelesaian (opsional)"
                  type="date"
                  value={etikForm.tanggal_selesai}
                  onChange={(e) => setEtikForm({ ...etikForm, tanggal_selesai: e.target.value })}
                />
              </Form.Row>
              <Input
                label="Jenis Pelanggaran"
                type="text"
                value={etikForm.jenis}
                onChange={(e) => setEtikForm({ ...etikForm, jenis: e.target.value })}
                placeholder="Contoh: Pelanggaran kode etik"
                required
              />
              <Input
                label="Uraian singkat"
                type="textarea"
                rows={3}
                value={etikForm.uraian}
                onChange={(e) => setEtikForm({ ...etikForm, uraian: e.target.value })}
                placeholder="Ringkasan kejadian"
                required
              />
              <Form.Row columns={3}>
                <Input
                  label="Tingkat"
                  type="select"
                  value={etikForm.tingkat}
                  onChange={(e) => setEtikForm({ ...etikForm, tingkat: e.target.value })}
                  options={TINGKAT_OPTIONS}
                  required
                />
                <Input
                  label="Status Penyelesaian"
                  type="select"
                  value={etikForm.status}
                  onChange={(e) => setEtikForm({ ...etikForm, status: e.target.value })}
                  options={STATUS_OPTIONS}
                  required
                />
                <Input
                  label="Catatan (opsional)"
                  type="text"
                  value={etikForm.catatan}
                  onChange={(e) => setEtikForm({ ...etikForm, catatan: e.target.value })}
                  placeholder="Tambahan"
                />
              </Form.Row>
              <div
                className={styles.fileDrop}
                onClick={() => fileEtikRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleEtikDrop}
              >
                <MdCloudUpload size={40} />
                <p className={styles.fileDropTitle}>Pilih atau seret file ke sini</p>
                <p className={styles.fileDropHint}>PDF, maks 5MB</p>
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
                {etikForm.file?.name && <p className={styles.fileDropSelected}>{etikForm.file.name}</p>}
              </div>
              <input
                type="file"
                ref={fileEtikRef}
                style={{ display: 'none' }}
                onChange={handleEtikFile}
                accept=".pdf"
              />
            </div>
            <div className={styles.modalFooter}>
              <Button variant="outline" type="button" onClick={() => setShowEtikModal(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Add Disiplin Modal */}
        <Modal
          isOpen={showDisiplinModal}
          onClose={() => setShowDisiplinModal(false)}
          title="Tambah Catatan Disiplin"
          size="large"
        >
          <Form onSubmit={handleSaveDisiplin}>
            <div className={styles.formContent}>
              <Form.Row columns={2}>
                <Input
                  label="Tanggal Kejadian"
                  type="date"
                  value={disiplinForm.tanggal}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, tanggal: e.target.value })}
                  required
                />
                <Input
                  label="Tanggal Penyelesaian (opsional)"
                  type="date"
                  value={disiplinForm.tanggal_selesai}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, tanggal_selesai: e.target.value })}
                />
              </Form.Row>
              <Input
                label="Jenis Pelanggaran"
                type="text"
                value={disiplinForm.jenis}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, jenis: e.target.value })}
                placeholder="Contoh: Pelanggaran disiplin kerja"
                required
              />
              <Input
                label="Uraian singkat"
                type="textarea"
                rows={3}
                value={disiplinForm.uraian}
                onChange={(e) => setDisiplinForm({ ...disiplinForm, uraian: e.target.value })}
                placeholder="Ringkasan kejadian"
                required
              />
              <Form.Row columns={3}>
                <Input
                  label="Tindakan Disiplin"
                  type="select"
                  value={disiplinForm.tindakan}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, tindakan: e.target.value })}
                  options={TINDAKAN_OPTIONS}
                  required
                />
                <Input
                  label="Status Penyelesaian"
                  type="select"
                  value={disiplinForm.status}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, status: e.target.value })}
                  options={STATUS_OPTIONS}
                  required
                />
                <Input
                  label="Catatan (opsional)"
                  type="text"
                  value={disiplinForm.catatan}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, catatan: e.target.value })}
                  placeholder="Tambahan"
                />
              </Form.Row>
              <div
                className={styles.fileDrop}
                onClick={() => fileDisiplinRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDisiplinDrop}
              >
                <MdCloudUpload size={40} />
                <p className={styles.fileDropTitle}>Pilih atau seret file ke sini</p>
                <p className={styles.fileDropHint}>PDF, maks 5MB</p>
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
                {disiplinForm.file?.name && <p className={styles.fileDropSelected}>{disiplinForm.file.name}</p>}
              </div>
              <input
                type="file"
                ref={fileDisiplinRef}
                style={{ display: 'none' }}
                onChange={handleDisiplinFile}
                accept=".pdf"
              />
            </div>
            <div className={styles.modalFooter}>
              <Button variant="outline" type="button" onClick={() => setShowDisiplinModal(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={viewOpen}
          onClose={() => setViewOpen(false)}
          title="Detail Catatan"
          size="large"
        >
          {viewItem && (
            <div className={styles.detailView}>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tanggal Kejadian</span>
                  <span className={styles.detailValue}>{formatDateToIndonesian(viewItem.tanggal_kejadian)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Jenis Pelanggaran</span>
                  <span className={styles.detailValue}>{viewItem.jenis_pelanggaran}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Uraian</span>
                  <span className={styles.detailValue}>{viewItem.uraian_singkat || '-'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>{viewItem.jenis === 'etik' ? 'Tingkat' : 'Tindakan'}</span>
                  <span className={styles.detailValue}>{viewItem.jenis === 'etik' ? viewItem.tingkat : viewItem.tindakan}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={`${styles.statusBadge} ${getStatusBadge(viewItem.status_penyelesaian).className}`}>
                    {getStatusBadge(viewItem.status_penyelesaian).label}
                  </span>
                </div>
                {viewItem.catatan && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Catatan</span>
                    <span className={styles.detailValue}>{viewItem.catatan}</span>
                  </div>
                )}
              </div>

              {/* PDF Preview */}
              <div className={styles.pdfSection}>
                <h4 className={styles.sectionTitle}>Dokumen</h4>
                {loadingPdf ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <span>Memuat dokumen...</span>
                  </div>
                ) : pdfUrl ? (
                  <div className={styles.pdfPreview}>
                    <iframe src={pdfUrl} className={styles.pdfFrame} title="Document Preview" />
                    <div className={styles.pdfActions}>
                      <Button
                        variant="outline"
                        size="small"
                        icon={<MdDownload />}
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = pdfUrl;
                          a.download = `dokumen-${viewItem.id}.pdf`;
                          a.click();
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.emptyText}>Dokumen tidak tersedia</p>
                )}
              </div>

              <div className={styles.modalFooter}>
                <Button variant="outline" onClick={() => setViewOpen(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};

export default EtikDisiplin;
