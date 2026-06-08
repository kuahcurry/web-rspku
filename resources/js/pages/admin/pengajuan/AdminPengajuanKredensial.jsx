import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Banner from '../../../components/banner/Banner';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import {
  MdVisibility,
  MdSearch,
  MdSave,
  MdDownload,
  MdCheckCircle,
  MdCancel,
  MdEdit,
  MdClose,
  MdAssignment,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';
import { isAuthenticated, authenticatedFetch } from '../../../utils/auth';
import { formatDateToIndonesian } from '../../../utils/dateFormatter';
import styles from './AdminPengajuanKredensial.module.css';

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

// Data will be loaded from the API

const getStatusBadge = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'disetujui') return { label: 'Disetujui', className: styles.statusSuccess };
  if (normalized === 'ditolak') return { label: 'Ditolak', className: styles.statusDanger };
  if (normalized === 'diproses') return { label: 'Diproses', className: styles.statusWarning };
  if (normalized === 'diajukan') return { label: 'Diajukan', className: styles.statusInfo };
  return { label: status, className: styles.statusNeutral };
};

const AdminPengajuanKredensial = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jenisFilter, setJenisFilter] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingItem, setProcessingItem] = useState(null);
  const [processData, setProcessData] = useState({ status: '', catatan: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
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
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  // Poll for new submissions every 30 seconds so admin sees recent user uploads
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/pengajuan-kredensial');
      const result = await response.json();
      if (response.ok && result.success) {
        const items = (result.data || []).map(item => ({
          id: item.id,
          nomor_pengajuan: item.id ? `PJ-${item.id}` : `PJ-${Date.now()}`,
          nama_pemohon: item.user_id ? `User-${item.user_id}` : null,
          jenis_kredensial: item.jenis_kredensial,
          tanggal_pengajuan: item.created_at || null,
          status: item.status || 'Diajukan',
          catatan: item.catatan,
          documents: [
            item.surat_permohonan_url ? { name: item.surat_permohonan_name || 'surat_permohonan', url: item.surat_permohonan_url, path: item.surat_permohonan_path } : null,
            item.form_k1_url ? { name: item.form_k1_name || 'form_k1', url: item.form_k1_url, path: item.form_k1_path } : null,
            item.form_k3_url ? { name: item.form_k3_name || 'form_k3', url: item.form_k3_url, path: item.form_k3_path } : null,
          ].filter(Boolean)
        }));

        setSubmissions(items);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          total: items.length,
          from: items.length ? 1 : 0,
          to: items.length,
          perPage: 15
        });
      } else {
        setBanner({ message: result.message || 'Gagal memuat data pengajuan', variant: 'error' });
      }
    } catch (err) {
      setBanner({ message: 'Gagal memuat data pengajuan', variant: 'error' });
      setLoading(false);
    }
    setLoading(false);
  };

  const filteredData = useMemo(() => {
    return (submissions || []).filter((item) => {
      const matchesSearch = !searchTerm ||
        item.jenis_kredensial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomor_pengajuan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_pemohon?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter ||
        item.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesJenis = !jenisFilter ||
        item.jenis_kredensial?.toLowerCase() === jenisFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesJenis;
    });
  }, [submissions, searchTerm, statusFilter, jenisFilter]);

  const handleViewClick = (item) => {
    if (!item) return;
    setSelectedItem(item);
    setSelectedDocIndex(0);
    setShowViewModal(true);
  };

  const handleProcessClick = (item) => {
    if (!item) return;
    setProcessingItem(item);
    setProcessData({
      status: item.status || 'Diproses',
      catatan: item.catatan || ''
    });
    setShowProcessModal(true);
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!processingItem) return;
    if (!processData.status) {
      setBanner({ message: 'Pilih status pengajuan', variant: 'warning' });
      return;
    }

    try {
      setFormSubmitting(true);
      // Call API to update status/catatan
      const payload = { status: processData.status, catatan: processData.catatan };
      const response = await authenticatedFetch(`/api/admin/pengajuan-kredensial/${processingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        // Update local state
        setSubmissions(prev => (prev || []).map(item => {
          if (item.id !== processingItem.id) return item;
          return {
            ...item,
            status: result.data.status,
            catatan: result.data.catatan
          };
        }));
        setBanner({ message: 'Status pengajuan berhasil diperbarui', variant: 'success' });
        setShowProcessModal(false);
        setProcessingItem(null);
        setProcessData({ status: '', catatan: '' });
      } else {
        setBanner({ message: result.message || 'Gagal memperbarui status', variant: 'error' });
      }
    } catch (err) {
      setBanner({ message: 'Terjadi kesalahan saat memperbarui status', variant: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleQuickApprove = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui pengajuan ini?')) return;
    try {
      setSubmissions(prev => (prev || []).map(item => {
        if (item.id !== id) return item;
        return { ...item, status: 'Disetujui', catatan: 'Pengajuan disetujui' };
      }));
      setBanner({ message: 'Pengajuan berhasil disetujui', variant: 'success' });
    } catch (err) {
      setBanner({ message: 'Terjadi kesalahan saat menyetujui pengajuan', variant: 'error' });
    }
  };

  const handleQuickReject = async (id) => {
    const reason = prompt('Masukkan alasan penolakan:');
    if (!reason) return;
    try {
      setSubmissions(prev => (prev || []).map(item => {
        if (item.id !== id) return item;
        return { ...item, status: 'Ditolak', catatan: reason };
      }));
      setBanner({ message: 'Pengajuan berhasil ditolak', variant: 'success' });
    } catch (err) {
      setBanner({ message: 'Terjadi kesalahan saat menolak pengajuan', variant: 'error' });
    }
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
    // For demo purposes, pagination is static
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Pengajuan Kredensial</h1>
              <p className={styles.pageSubtitle}>Review dan proses pengajuan kredensial dari tenaga medis</p>
            </div>
          </div>
        </header>

        {/* Table Card */}
        <Card className={styles.tableCard}>
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
                  placeholder="Cari nomor pengajuan, nama pemohon, atau jenis..."
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
                    <th>Nama Pemohon</th>
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
                        <td className={styles.nameCell}>
                          <span className={styles.userName}>{item.nama_pemohon}</span>
                        </td>
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
                              onClick={() => handleProcessClick(item)}
                              title="Proses"
                            >
                              <MdEdit size={18} />
                              <span className={styles.tooltip}>Proses</span>
                            </button>
                            {item.status?.toLowerCase() === 'diajukan' && (
                              <>
                                <button
                                  className={`${styles.iconButton} ${styles.iconButtonSuccess}`}
                                  onClick={() => handleQuickApprove(item.id)}
                                  title="Setujui"
                                >
                                  <MdCheckCircle size={18} />
                                  <span className={styles.tooltip}>Setujui</span>
                                </button>
                                <button
                                  className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                                  onClick={() => handleQuickReject(item.id)}
                                  title="Tolak"
                                >
                                  <MdCancel size={18} />
                                  <span className={styles.tooltip}>Tolak</span>
                                </button>
                              </>
                            )}
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
                  <span className={styles.detailLabel}>Nama Pemohon</span>
                  <span className={styles.detailValue}>{selectedItem.nama_pemohon}</span>
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
                <Button variant="primary" onClick={() => {
                  setShowViewModal(false);
                  handleProcessClick(selectedItem);
                }}>
                  Proses Pengajuan
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Process Modal */}
        <Modal
          isOpen={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          title="Proses Pengajuan"
          size="medium"
        >
          {processingItem && (
            <Form onSubmit={handleProcessSubmit}>
              <div className={styles.processForm}>
                <div className={styles.infoBox}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nomor Pengajuan</span>
                    <span className={styles.infoValue}>{processingItem.nomor_pengajuan}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nama Pemohon</span>
                    <span className={styles.infoValue}>{processingItem.nama_pemohon}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Jenis Kredensial</span>
                    <span className={styles.infoValue}>{processingItem.jenis_kredensial}</span>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Status Pengajuan <span className={styles.required}>*</span>
                  </label>
                  <select
                    name="status"
                    value={processData.status}
                    onChange={(e) => setProcessData(prev => ({ ...prev, status: e.target.value }))}
                    className={styles.formSelect}
                    required
                  >
                    <option value="">Pilih Status</option>
                    <option value="Diajukan">Diajukan</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Catatan</label>
                  <textarea
                    name="catatan"
                    value={processData.catatan}
                    onChange={(e) => setProcessData(prev => ({ ...prev, catatan: e.target.value }))}
                    className={styles.formTextarea}
                    rows="4"
                    placeholder="Masukkan catatan atau keterangan (opsional)"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button variant="outline" type="button" onClick={() => setShowProcessModal(false)}>
                  Batal
                </Button>
                <Button variant="primary" type="submit" icon={<MdSave />} iconPosition="left" disabled={formSubmitting}>
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </Form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminPengajuanKredensial;
