import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Banner from '../../../components/banner/Banner';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import {
  MdAdd,
  MdEdit,
  MdVisibility,
  MdSearch,
  MdSave,
  MdCloudUpload,
  MdDownload,
  MdClose,
  MdAssignment,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';
import { isAuthenticated, authenticatedFetch } from '../../../utils/auth';
import { formatDateToIndonesian } from '../../../utils/dateFormatter';
import styles from './PengajuanKredensial.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'Diajukan', label: 'Diajukan' },
  { value: 'Diproses', label: 'Diproses' },
  { value: 'Disetujui', label: 'Disetujui' },
  { value: 'Ditolak', label: 'Ditolak' }
];

const JENIS_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'Kredensial Baru', label: 'Kredensial Baru' },
  { value: 'Rekredensial', label: 'Rekredensial' }
];

const TEMPLATE_URLS = [
  '/templates/Permohonan-Rekredensial.docx',
  '/templates/Form-K1.docx',
  '/templates/Form-K3.docx'
];

// Dummy data
const DUMMY_SUBMISSIONS = [
  {
    id: 1,
    nomor_pengajuan: 'PJ-20260127001',
    jenis_kredensial: 'Kredensial Baru',
    tanggal_pengajuan: new Date().toISOString(),
    status: 'Diajukan',
    catatan: null,
    documents: [
      { name: 'Surat-Permohonan.docx', url: TEMPLATE_URLS[0] },
      { name: 'Form-K1.docx', url: TEMPLATE_URLS[1] }
    ]
  },
  {
    id: 2,
    nomor_pengajuan: 'PJ-20260127002',
    jenis_kredensial: 'Rekredensial',
    tanggal_pengajuan: new Date(Date.now() - 86400000).toISOString(),
    status: 'Diproses',
    catatan: 'Menunggu verifikasi dokumen',
    documents: [
      { name: 'Form-K3.docx', url: TEMPLATE_URLS[2] }
    ]
  }
];

const getStatusBadge = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'disetujui') return { label: 'Disetujui', className: styles.statusSuccess };
  if (normalized === 'ditolak') return { label: 'Ditolak', className: styles.statusDanger };
  if (normalized === 'diproses') return { label: 'Diproses', className: styles.statusWarning };
  if (normalized === 'diajukan') return { label: 'Diajukan', className: styles.statusInfo };
  return { label: status, className: styles.statusNeutral };
};

const PengajuanKredensial = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jenisFilter, setJenisFilter] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({ jenis_kredensial: 'Kredensial Baru' });
  const [templates, setTemplates] = useState({ t1: null, t2: null, t3: null });
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
    perPage: 15
  });

  const t1Ref = useRef(null);
  const t2Ref = useRef(null);
  const t3Ref = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/pengajuan-kredensial');
      const result = await response.json();
      if (response.ok && result.success) {
        const items = (result.data || []).map(item => ({
          id: item.id,
          nomor_pengajuan: item.id ? `PJ-${item.id}` : `PJ-${Date.now()}`,
          jenis_kredensial: item.jenis_kredensial,
          tanggal_pengajuan: item.created_at || item.tanggal_pengajuan,
          status: item.status || 'Diajukan',
          catatan: item.catatan,
          documents: [
            item.surat_permohonan_url ? { name: item.surat_permohonan_name || 'surat_permohonan', url: item.surat_permohonan_url, path: item.surat_permohonan_path } : null,
            item.form_k1_url ? { name: item.form_k1_name || 'form_k1', url: item.form_k1_url, path: item.form_k1_path } : null,
            item.form_k3_url ? { name: item.form_k3_name || 'form_k3', url: item.form_k3_url, path: item.form_k3_path } : null,
          ].filter(Boolean)
        }));

        setSubmissions(items);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          lastPage: 1,
          total: items.length,
          from: items.length ? 1 : 0,
          to: items.length
        }));
      } else {
        setBanner({ message: result.message || 'Gagal memuat data pengajuan', variant: 'error' });
      }
    } catch (err) {
      setBanner({ message: 'Gagal memuat data pengajuan', variant: 'error' });
      console.error('Error fetching pengajuan:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return (submissions || []).filter((item) => {
      const matchesSearch = !searchTerm ||
        item.jenis_kredensial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomor_pengajuan?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter ||
        item.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesJenis = !jenisFilter ||
        item.jenis_kredensial?.toLowerCase() === jenisFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesJenis;
    });
  }, [submissions, searchTerm, statusFilter, jenisFilter]);

  const resetForm = () => {
    setFormData({ jenis_kredensial: 'Kredensial Baru' });
    setTemplates({ t1: null, t2: null, t3: null });
    setEditingItem(null);
  };

  const handleTemplateDrop = (e, key) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const allowed = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf'];
    if (!allowed.includes(file.type) && !file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.pdf')) {
      setBanner({ message: 'Hanya file DOC, DOCX, atau PDF yang diperbolehkan', variant: 'error' });
      return;
    }
    setTemplates(prev => ({ ...prev, [key]: file }));
  };

  const handleTemplateChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf'];
    if (!allowed.includes(file.type) && !file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.pdf')) {
      setBanner({ message: 'Hanya file DOC, DOCX, atau PDF yang diperbolehkan', variant: 'error' });
      e.target.value = '';
      return;
    }
    setTemplates(prev => ({ ...prev, [key]: file }));
  };

  const downloadTemplate = (url) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', '');
      a.setAttribute('target', '_blank');
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      window.open(url, '_blank', 'noreferrer');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jenis_kredensial) {
      setBanner({ message: 'Pilih jenis kredensial', variant: 'warning' });
      return;
    }
    if (!templates.t1 || !templates.t2 || !templates.t3) {
      setBanner({ message: 'Unggah ketiga template yang telah diisi', variant: 'warning' });
      return;
    }
    try {
      setFormSubmitting(true);
      // Prepare form data for upload
      const fd = new FormData();
      fd.append('jenis_kredensial', formData.jenis_kredensial);
      if (templates.t1) fd.append('surat_permohonan', templates.t1);
      if (templates.t2) fd.append('form_k1', templates.t2);
      if (templates.t3) fd.append('form_k3', templates.t3);

      // Send to API
      const response = await authenticatedFetch('/api/pengajuan-kredensial', {
        method: 'POST',
        body: fd
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setBanner({ message: 'Pengajuan berhasil ditambahkan', variant: 'success' });
        setShowAddModal(false);
        resetForm();
        // Refresh list from server so data is persisted and visible to admin
        fetchData();
      } else {
        setBanner({ message: result.message || 'Terjadi kesalahan saat menambahkan pengajuan', variant: 'error' });
      }
    } catch (err) {
      console.error('Error submitting pengajuan:', err);
      setBanner({ message: 'Terjadi kesalahan saat menambahkan pengajuan', variant: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setFormSubmitting(true);
      setSubmissions(prev => (prev || []).map(item => {
        if (item.id !== editingItem.id) return item;
        const updated = { ...item, jenis_kredensial: formData.jenis_kredensial };
        const docs = [];
        if (templates.t1) docs.push({ name: templates.t1.name, url: URL.createObjectURL(templates.t1), type: templates.t1.type });
        if (templates.t2) docs.push({ name: templates.t2.name, url: URL.createObjectURL(templates.t2), type: templates.t2.type });
        if (templates.t3) docs.push({ name: templates.t3.name, url: URL.createObjectURL(templates.t3), type: templates.t3.type });
        if (docs.length) updated.documents = docs;
        return updated;
      }));
      setBanner({ message: 'Pengajuan berhasil diperbarui', variant: 'success' });
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setBanner({ message: 'Terjadi kesalahan saat memperbarui pengajuan', variant: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleViewClick = (item) => {
    if (!item) return;
    setSelectedItem(item);
    setSelectedDocIndex(0);
    setShowViewModal(true);
  };

  const handleEditClick = (id) => {
    const item = (submissions || []).find(s => s.id === id);
    if (!item) return;
    setEditingItem(item);
    setFormData({ jenis_kredensial: item.jenis_kredensial || 'Kredensial Baru' });
    setTemplates({ t1: null, t2: null, t3: null });
    setShowEditModal(true);
  };

  const viewDocument = (doc) => {
    if (!doc) return;
    window.open(doc.url || doc.path || doc, '_blank', 'noopener');
  };

  const downloadDocument = (doc) => {
    try {
      const a = document.createElement('a');
      a.href = doc.url || doc.path || doc;
      a.setAttribute('download', doc.name || 'dokumen');
      a.setAttribute('target', '_blank');
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      window.open(doc.url || doc.path || doc, '_blank', 'noreferrer');
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const renderTemplateUpload = (key, label, templateUrl, inputRef) => (
    <div className={styles.templateCard}>
      <div className={styles.templateHeader}>
        <span className={styles.templateName}>{label}</span>
      </div>
      <Button
        variant="primary"
        size="small"
        className={styles.downloadBtn}
        type="button"
        icon={<MdDownload size={16} />}
        onClick={() => downloadTemplate(templateUrl)}
      >
        Download Template
      </Button>
      <div
        className={styles.fileDrop}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleTemplateDrop(e, key)}
      >
        <MdCloudUpload size={28} />
        <div className={styles.fileDropText}>
          <p className={styles.fileDropTitle}>
            {templates[key] ? templates[key].name : 'Pilih atau seret file'}
          </p>
          <p className={styles.fileDropHint}>DOC / DOCX / PDF, maksimal 5MB</p>
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={(ev) => { ev.stopPropagation(); inputRef.current?.click(); }}
          >
            Pilih File
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".doc,.docx,.pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleTemplateChange(e, key)}
        />
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className={styles.container}>
        {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Pengajuan Kredensial</h1>
              <p className={styles.pageSubtitle}>Kelola pengajuan kredensial Anda untuk mendapatkan surat keterangan kompetensi klinis</p>
            </div>
          </div>
        </header>

        {/* Table Card */}
        <Card className={styles.tableCard}>
          {/* Table Header */}
          <div className={styles.tableCardHeader}>
            <h3 className={styles.tableTitle}>Pengajuan Kredensial</h3>
            <div className={styles.tableActions}>
              <Button
                variant="success"
                size="medium"
                icon={<MdAdd />}
                iconPosition="left"
                onClick={() => setShowAddModal(true)}
              >
                Tambah Pengajuan
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
                  placeholder="Cari nomor pengajuan atau jenis kredensial..."
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
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.inlineFilter}>
              <label className={styles.filterLabel} htmlFor="jenisFilter">Jenis Kredensial</label>
              <select
                id="jenisFilter"
                className={styles.filterSelect}
                value={jenisFilter}
                onChange={(e) => setJenisFilter(e.target.value)}
              >
                {JENIS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <span>Memuat data pengajuan...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className={styles.emptyState}>
                <MdAssignment size={64} />
                <h3>Tidak ada pengajuan ditemukan</h3>
                <p>Coba ubah kata kunci pencarian atau filter Anda</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nomor Pengajuan</th>
                    <th>Jenis Kredensial</th>
                    <th>Tanggal Pengajuan</th>
                    <th>Status</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <tr key={item.id}>
                        <td className={styles.nomorCell}>{item.nomor_pengajuan}</td>
                        <td>{item.jenis_kredensial}</td>
                        <td>{formatDateToIndonesian(item.tanggal_pengajuan)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className={styles.catatanCell}>
                          {item.catatan ? (
                            <span className={styles.catatanText}>{item.catatan}</span>
                          ) : (
                            <span className={styles.catatanEmpty}>-</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={`${styles.iconButton} ${styles.iconButtonView}`}
                              onClick={() => handleViewClick(item)}
                              title="Lihat Detail"
                            >
                              <MdVisibility size={18} />
                              <span className={styles.tooltip}>Lihat Detail</span>
                            </button>
                            <button
                              className={`${styles.iconButton} ${styles.iconButtonWarning}`}
                              onClick={() => handleEditClick(item.id)}
                              title="Edit"
                            >
                              <MdEdit size={18} />
                              <span className={styles.tooltip}>Edit</span>
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
                Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} pengajuan
              </span>
              <div className={styles.paginationControls}>
                <button
                  className={styles.pageBtn}
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  <MdChevronLeft size={20} />
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`${styles.pageBtn} ${pagination.currentPage === page ? styles.active : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className={styles.pageBtn}
                  disabled={pagination.currentPage === pagination.lastPage}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  <MdChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Add Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          title="Tambah Pengajuan Kredensial"
          size="large"
        >
          <Form onSubmit={handleAddSubmit}>
            <div className={styles.formContent}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Jenis Kredensial <span className={styles.required}>*</span>
                </label>
                <select
                  name="jenis_kredensial"
                  value={formData.jenis_kredensial}
                  onChange={(e) => setFormData(prev => ({ ...prev, jenis_kredensial: e.target.value }))}
                  className={styles.formSelect}
                >
                  <option value="Kredensial Baru">Kredensial Baru</option>
                  <option value="Rekredensial">Rekredensial</option>
                </select>
              </div>

              <div className={styles.documentsSection}>
                <h4 className={styles.sectionTitle}>Dokumen Pendukung</h4>
                <p className={styles.sectionDesc}>Download template, isi sesuai instruksi, lalu unggah kembali</p>

                <div className={styles.templateGrid}>
                  {renderTemplateUpload('t1', 'Surat Permohonan', TEMPLATE_URLS[0], t1Ref)}
                  {renderTemplateUpload('t2', 'Form K1', TEMPLATE_URLS[1], t2Ref)}
                  {renderTemplateUpload('t3', 'Form K3', TEMPLATE_URLS[2], t3Ref)}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="outline" type="button" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Batal
              </Button>
              <Button variant="success" type="submit" icon={<MdSave />} iconPosition="left" disabled={formSubmitting}>
                {formSubmitting ? 'Menyimpan...' : 'Simpan Pengajuan'}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); resetForm(); }}
          title="Edit Pengajuan Kredensial"
          size="large"
        >
          <Form onSubmit={handleEditSubmit}>
            <div className={styles.formContent}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Jenis Kredensial <span className={styles.required}>*</span>
                </label>
                <select
                  name="jenis_kredensial"
                  value={formData.jenis_kredensial}
                  onChange={(e) => setFormData(prev => ({ ...prev, jenis_kredensial: e.target.value }))}
                  className={styles.formSelect}
                >
                  <option value="Kredensial Baru">Kredensial Baru</option>
                  <option value="Rekredensial">Rekredensial</option>
                </select>
              </div>

              <div className={styles.documentsSection}>
                <h4 className={styles.sectionTitle}>Dokumen Pendukung</h4>
                <p className={styles.sectionDesc}>Upload ulang dokumen jika ingin mengubah</p>

                <div className={styles.templateGrid}>
                  {renderTemplateUpload('t1', 'Surat Permohonan', TEMPLATE_URLS[0], t1Ref)}
                  {renderTemplateUpload('t2', 'Form K1', TEMPLATE_URLS[1], t2Ref)}
                  {renderTemplateUpload('t3', 'Form K3', TEMPLATE_URLS[2], t3Ref)}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="outline" type="button" onClick={() => { setShowEditModal(false); resetForm(); }}>
                Batal
              </Button>
              <Button variant="success" type="submit" icon={<MdSave />} iconPosition="left" disabled={formSubmitting}>
                {formSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Detail Pengajuan"
          size="large"
        >
          {selectedItem && (
            <div className={styles.detailView}>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Nomor Pengajuan</span>
                  <span className={styles.detailValue}>{selectedItem.nomor_pengajuan}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Jenis Kredensial</span>
                  <span className={styles.detailValue}>{selectedItem.jenis_kredensial}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tanggal Pengajuan</span>
                  <span className={styles.detailValue}>{formatDateToIndonesian(selectedItem.tanggal_pengajuan)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={`${styles.statusBadge} ${getStatusBadge(selectedItem.status).className}`}>
                    {getStatusBadge(selectedItem.status).label}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Catatan</span>
                  {selectedItem.catatan ? (
                    <span className={styles.detailValue}>{selectedItem.catatan}</span>
                  ) : (
                    <span className={styles.detailValueMuted}>Belum ada catatan</span>
                  )}
                </div>
              </div>

              <div className={styles.documentsSection}>
                <h4 className={styles.sectionTitle}>Dokumen</h4>
                {selectedItem.documents && selectedItem.documents.length > 0 ? (
                  <>
                    <div className={styles.docViewer}>
                      {(() => {
                        const doc = selectedItem.documents[selectedDocIndex];
                        if (!doc) return <div className={styles.documentEmpty}>Tidak ada dokumen untuk dilihat.</div>;
                        const lower = ((doc.url || '') + (doc.name || '')).toLowerCase();
                        if (doc.type === 'application/pdf' || lower.endsWith('.pdf')) {
                          return <iframe title={doc.name} src={doc.url} className={styles.docFrame} />;
                        }
                        if ((lower.endsWith('.docx') || lower.endsWith('.doc')) && !doc.url.startsWith('blob:')) {
                          const src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + doc.url)}`;
                          return <iframe title={doc.name} src={src} className={styles.docFrame} />;
                        }
                        return (
                          <div className={styles.documentPreviewFallback}>
                            <p>{doc.name}</p>
                            <div className={styles.docFallbackActions}>
                              <Button variant="outline" size="small" onClick={() => viewDocument(doc)}>Lihat di tab baru</Button>
                              <Button variant="outline" size="small" onClick={() => downloadDocument(doc)}>Unduh</Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className={styles.documentList}>
                      {selectedItem.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className={`${styles.documentItem} ${selectedDocIndex === idx ? styles.documentItemActive : ''}`}
                          onClick={() => setSelectedDocIndex(idx)}
                        >
                          <span className={styles.docName}>{doc.name}</span>
                          <div className={styles.docActions}>
                            <button
                              className={`${styles.iconButton} ${styles.iconButtonView}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedDocIndex(idx); }}
                            >
                              <MdVisibility size={16} />
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={(e) => { e.stopPropagation(); downloadDocument(doc); }}
                            >
                              <MdDownload size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={styles.emptyText}>Tidak ada dokumen terunggah untuk pengajuan ini.</p>
                )}
              </div>

              <div className={styles.modalFooter}>
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
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

export default PengajuanKredensial;
