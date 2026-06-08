import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Banner from '../../../components/banner/Banner';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import {
  MdAdd,
  MdCloudUpload,
  MdDelete,
  MdDownload,
  MdSave,
  MdSearch,
  MdVisibility,
  MdEdit,
  MdClose,
  MdAssignment,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';
import { isAuthenticated, authenticatedFetch } from '../../../utils/auth';
import { formatDateToIndonesian, toDateInput } from '../../../utils/dateFormatter';
import styles from './Kredensial.module.css';

const JENIS_TAHAP = [
  { value: 'Kredensial Awal', label: 'Kredensial Awal' },
  { value: 'Rekredensial', label: 'Rekredensial' }
];

const JENIS_KEGIATAN = [
  { value: 'Observasi Klinis', label: 'Observasi Klinis' },
  { value: 'Uji Kompetensi Klinis', label: 'Uji Kompetensi Klinis' },
  { value: 'Praktik Mandiri Terbimbing', label: 'Praktik Mandiri Terbimbing' },
  { value: 'Seminar Khusus Kredensial', label: 'Seminar Khusus Kredensial' },
  { value: 'Kegiatan SKP Kredensial', label: 'Kegiatan SKP Kredensial' },
  { value: 'Lainnya', label: 'Lainnya' }
];



const Kredensial = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jenisFilter, setJenisFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    tanggal_berlaku: '',
    tanggal_selesai: '',
    jenis_kegiatan: '',
    kredensial_type: 'Kredensial Awal',
    hasil_penilaian: 'Belum Diisi',
    catatan: '',
    file: null,
    fileUrl: null
  });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
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

  // Cleanup blob URL when view modal closes
  useEffect(() => {
    if (!showViewModal && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [showViewModal, pdfUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/kredensial');
      const data = await response.json();

      if (response.ok && data.success) {
        const mapRecord = (record) => ({
          id: record.id,
          nama_kegiatan: record.nama_kegiatan,
          tanggal_kegiatan: record.tanggal_berlaku,
          tanggal_berlaku: record.tanggal_berlaku,
          tanggal_selesai: record.tanggal_selesai,
          jenis_kegiatan: record.jenis_kegiatan,
          tahap: record.kredensial_type,
          kredensial_type: record.kredensial_type,
          hasil: record.hasil_penilaian,
          hasil_penilaian: record.hasil_penilaian,
          masa_berlaku: record.tanggal_selesai,
          catatan: record.catatan,
          fileName: record.file_name,
          fileUrl: record.url,
          file_name: record.file_name
        });

        const records = (data.data.riwayat || []).map(mapRecord);
        setActivities(records);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          total: records.length,
          from: records.length > 0 ? 1 : 0,
          to: records.length,
          perPage: 15
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.nama_kegiatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis_kegiatan?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesJenis = !jenisFilter || item.tahap === jenisFilter;
      
      return matchesSearch && matchesJenis;
    });
  }, [activities, searchTerm, jenisFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      nama_kegiatan: '',
      tanggal_berlaku: '',
      tanggal_selesai: '',
      jenis_kegiatan: '',
      kredensial_type: 'Kredensial Awal',
      hasil_penilaian: 'Belum Diisi',
      catatan: '',
      file: null,
      fileUrl: null
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      nama_kegiatan: item.nama_kegiatan || '',
      tanggal_berlaku: toDateInput(item.tanggal_berlaku),
      tanggal_selesai: toDateInput(item.tanggal_selesai),
      jenis_kegiatan: item.jenis_kegiatan || '',
      kredensial_type: item.kredensial_type || 'Kredensial Awal',
      hasil_penilaian: item.hasil_penilaian || 'Belum Diisi',
      catatan: item.catatan || '',
      file: null,
      fileUrl: item.fileUrl || null
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file, e);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  };

  const processFile = (file, eventRef) => {
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
    setFormData((prev) => {
      if (prev.fileUrl) URL.revokeObjectURL(prev.fileUrl);
      return { ...prev, file, fileUrl: blobUrl };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_kegiatan || !formData.tanggal_berlaku || !formData.jenis_kegiatan || (!formData.file && !formData.fileUrl)) {
      setBanner({ message: 'Mohon lengkapi semua field dan upload file.', variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const apiFormData = new FormData();
      apiFormData.append('nama_kegiatan', formData.nama_kegiatan);
      apiFormData.append('tanggal_berlaku', formData.tanggal_berlaku);
      if (formData.tanggal_selesai) apiFormData.append('tanggal_selesai', formData.tanggal_selesai);
      apiFormData.append('jenis_kegiatan', formData.jenis_kegiatan);
      apiFormData.append('kredensial_type', formData.kredensial_type);
      apiFormData.append('hasil_penilaian', formData.hasil_penilaian);
      if (formData.catatan) apiFormData.append('catatan', formData.catatan);
      if (formData.file) apiFormData.append('file', formData.file);

      const url = editingId 
        ? `/api/kredensial/${editingId}`
        : '/api/kredensial';
      
      if (editingId) {
        apiFormData.append('_method', 'PUT');
      }

      const response = await authenticatedFetch(url, {
        method: 'POST',
        body: apiFormData
      });

      if (response.ok) {
        setBanner({ message: 'Data berhasil disimpan', variant: 'success' });
        setShowModal(false);
        setEditingId(null);
        setFormData({
          nama_kegiatan: '',
          tanggal_berlaku: '',
          tanggal_selesai: '',
          jenis_kegiatan: '',
          kredensial_type: 'Kredensial Awal',
          hasil_penilaian: 'Kompeten',
          catatan: '',
          file: null,
          fileUrl: null
        });
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

  const handleViewFile = async (item) => {
    if (!item.fileName && !item.fileUrl) {
      setBanner({ message: 'Sertifikat belum diupload.', variant: 'warning' });
      return;
    }

    setSelectedItem(item);
    setShowViewModal(true);
    setLoadingPdf(true);

    try {
      const response = await authenticatedFetch(`/api/kredensial/${item.id}`);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          setBanner({ message: errorData.message || 'Gagal memuat dokumen', variant: 'error' });
        } catch {
          setBanner({ message: 'Gagal memuat dokumen', variant: 'error' });
        }
        setShowViewModal(false);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading document:', error);
      setBanner({ message: 'Terjadi kesalahan saat memuat dokumen', variant: 'error' });
      setShowViewModal(false);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadFile = async (item) => {
    if (!item.fileName && !item.fileUrl) {
      setBanner({ message: 'Sertifikat belum diupload.', variant: 'warning' });
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/kredensial/${item.id}/download`);
      
      if (!response.ok) {
        setBanner({ message: 'Gagal mengunduh dokumen', variant: 'error' });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.nama_kegiatan || 'kredensial'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      setBanner({ message: 'Terjadi kesalahan saat mengunduh dokumen', variant: 'error' });
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
    if (!deleteMode) {
      handleStartDelete();
      return;
    }
    if (deleteTargets.length) {
      setShowDeleteModal(true);
      return;
    }
    handleCancelDelete();
  };

  const handleSelectForDelete = (item) => {
    if (!deleteMode) return;
    setDeleteTargets((prev) => {
      const exists = prev.find((entry) => entry.id === item.id);
      if (exists) {
        return prev.filter((entry) => entry.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargets.length) return;

    try {
      const idsToDelete = deleteTargets.map((entry) => entry.id);
      const response = await authenticatedFetch('/api/kredensial/delete-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: idsToDelete })
      });

      if (response.ok) {
        setBanner({ message: `${idsToDelete.length} data berhasil dihapus`, variant: 'success' });
        if (selectedItem && idsToDelete.includes(selectedItem.id)) {
          setSelectedItem(null);
          setShowViewModal(false);
        }
        setDeleteTargets([]);
        setDeleteMode(false);
        setShowDeleteModal(false);
        fetchData();
      } else {
        const error = await response.json();
        setBanner({ message: error.message || 'Gagal menghapus data', variant: 'error' });
      }
    } catch (error) {
      setBanner({ message: 'Terjadi kesalahan saat menghapus data', variant: 'error' });
    }
  };

  const isFormValid = formData.nama_kegiatan && formData.tanggal_berlaku && formData.jenis_kegiatan && (formData.file || formData.fileUrl);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Kredensial & Rekredensial</h1>
            <p className={styles.pageSubtitle}>Memuat data...</p>
          </header>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.container}>

        {/* Page Header */}
        <header className={styles.pageHeader}>
        {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Kredensial & Rekredensial</h1>
              <p className={styles.pageSubtitle}>Kelola kredensial dan rekredensial Anda serta riwayat kegiatan terkait</p>
            </div>
          </div>
        </header>

        {deleteMode && (
          <div className={styles.deleteNotice}>
            Pilih satu atau lebih data untuk dihapus, lalu klik Hapus.
          </div>
        )}

        {/* Table Card */}
        <Card className={styles.tableCard}>
          {/* Table Header */}
          <div className={styles.tableCardHeader}>
            <h3 className={styles.tableTitle}>Riwayat Kredensial</h3>
            <div className={styles.tableActions}>
              <Button 
                variant="success" 
                size="medium" 
                icon={<MdAdd />} 
                iconPosition="left" 
                onClick={openAddModal}
              >
                Tambah
              </Button>
              <Button 
                variant="danger" 
                size="medium" 
                icon={<MdDelete />} 
                iconPosition="left" 
                onClick={handleDeleteButtonClick}
              >
                {deleteMode ? (deleteTargets.length ? `Hapus (${deleteTargets.length})` : 'Batal') : 'Hapus'}
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
                  placeholder="Cari nama kegiatan atau jenis kegiatan..."
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
            <label className={styles.filterLabel} htmlFor="jenisFilter">Jenis Kredensial</label>
            <select
              id="jenisFilter"
              className={styles.filterSelect}
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
            >
              <option value="">Semua Jenis</option>
              {JENIS_TAHAP.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          </div>

          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <span>Memuat data kredensial...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className={styles.emptyState}>
                <MdAssignment size={64} />
                <h3>Tidak ada kegiatan kredensial ditemukan</h3>
                <p>Coba ubah kata kunci pencarian atau filter Anda</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal Mulai</th>
                    <th>Berlaku Sampai</th>
                    <th>Nama Kegiatan</th>
                    <th>Jenis Kegiatan</th>
                    <th>Kredensial/Rekredensial</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((item) => {
                    const isSelected = deleteTargets.some((entry) => entry.id === item.id);
                    return (
                      <tr 
                        key={item.id} 
                        className={`${deleteMode ? styles.deleteSelectable : ''} ${isSelected ? styles.deleteSelected : ''}`}
                        onClick={deleteMode ? () => handleSelectForDelete(item) : undefined}
                      >
                        <td>{formatDateToIndonesian(item.tanggal_kegiatan)}</td>
                        <td>{item.masa_berlaku ? formatDateToIndonesian(item.masa_berlaku) : '-'}</td>
                        <td className={styles.nameCell}>
                          <span className={styles.userName}>{item.nama_kegiatan}</span>
                        </td>
                        <td>{item.jenis_kegiatan}</td>
                        <td>{item.tahap}</td>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewFile(item);
                              }}
                              title="Lihat Detail"
                            >
                              <MdVisibility size={18} />
                              <span className={styles.tooltip}>Lihat Detail</span>
                            </button>
                            <button
                              className={`${styles.iconButton} ${styles.iconButtonWarning}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(item);
                              }}
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
          {!loading && filteredActivities.length > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} kegiatan
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

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={handleCancelDelete}
          title="Konfirmasi Hapus"
          size="small"
        >
          <div className={styles.deleteModalContent}>
            <p className={styles.deleteTitle}>Hapus {deleteTargets.length} data terpilih?</p>
            <p className={styles.deleteWarning}>Data yang dihapus tidak dapat dikembalikan.</p>
            {deleteTargets.length > 0 && (
              <ul className={styles.deleteList}>
                {deleteTargets.map((item) => (
                  <li key={item.id} className={styles.deleteListItem}>
                    {item.nama_kegiatan} - {formatDateToIndonesian(item.tanggal_kegiatan)}
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={handleCancelDelete}>
                Batal
              </Button>
              <Button variant="danger" icon={<MdDelete />} iconPosition="left" onClick={handleConfirmDelete}>
                Hapus
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingId ? 'Edit Kegiatan Kredensial' : 'Tambah Kegiatan Kredensial'}
          size="large"
        >
          <Form onSubmit={handleSubmit}>
            <div className={styles.formContent}>
              <div className={styles.formRow}>
                <Input
                  label="Tanggal Mulai"
                  type="date"
                  name="tanggal_berlaku"
                  value={formData.tanggal_berlaku}
                  onChange={(e) => setFormData({ ...formData, tanggal_berlaku: e.target.value })}
                  required
                />
                <Input
                  label="Berlaku Sampai"
                  type="date"
                  name="tanggal_selesai"
                  value={formData.tanggal_selesai}
                  onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Nama Kegiatan"
                type="text"
                name="nama_kegiatan"
                value={formData.nama_kegiatan}
                onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                placeholder="Contoh: Observasi Klinis IGD"
                required
              />
              <div className={styles.formRow}>
                <Input
                  label="Jenis Kegiatan"
                  type="select"
                  name="jenis_kegiatan"
                  value={formData.jenis_kegiatan}
                  onChange={(e) => setFormData({ ...formData, jenis_kegiatan: e.target.value })}
                  options={JENIS_KEGIATAN}
                  required
                />
                <Input
                  label="Kredensial Awal / Rekredensial"
                  type="select"
                  name="kredensial_type"
                  value={formData.kredensial_type}
                  onChange={(e) => setFormData({ ...formData, kredensial_type: e.target.value })}
                  options={JENIS_TAHAP}
                  required
                />
              </div>
              <Input
                label="Catatan (opsional)"
                type="textarea"
                name="catatan"
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Contoh: Sesuai BA rapat tanggal 10-11-2024"
              />
              <div
                className={styles.fileDrop}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <MdCloudUpload size={40} />
                <div className={styles.fileDropText}>
                  <p className={styles.fileDropTitle}>Pilih atau seret file ke sini</p>
                  <p className={styles.fileDropHint}>PDF, maks 5MB</p>
                  <Button
                    variant="outline"
                    size="medium"
                    icon={<MdCloudUpload />}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Pilih File
                  </Button>
                  {formData.file && <p className={styles.fileDropSelected}>{formData.file.name}</p>}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  required
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="outline" type="button" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setPdfUrl(null);
          }}
          title={selectedItem?.nama_kegiatan || 'Detail Kegiatan'}
          size="large"
        >
          {selectedItem && (
            <div className={styles.detailView}>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tanggal Mulai</span>
                  <span className={styles.detailValue}>
                    {selectedItem?.tanggal_kegiatan ? formatDateToIndonesian(selectedItem.tanggal_kegiatan) : '-'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Berlaku Sampai</span>
                  <span className={styles.detailValue}>
                    {selectedItem?.tanggal_selesai ? formatDateToIndonesian(selectedItem.tanggal_selesai) : '-'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Jenis Kegiatan</span>
                  <span className={styles.detailValue}>{selectedItem?.jenis_kegiatan || '-'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tahap</span>
                  <span className={styles.detailValue}>{selectedItem?.tahap || '-'}</span>
                </div>

                {selectedItem?.catatan && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Catatan</span>
                    <span className={styles.detailValue}>{selectedItem.catatan}</span>
                  </div>
                )}
              </div>

              <div className={styles.pdfPreview}>
                {loadingPdf ? (
                  <div className={styles.pdfEmpty}>Memuat dokumen...</div>
                ) : pdfUrl ? (
                  <iframe 
                    src={pdfUrl} 
                    className={styles.pdfFrame} 
                    title="PDF Viewer"
                  />
                ) : (
                  <div className={styles.pdfEmpty}>Dokumen belum tersedia.</div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  icon={<MdDownload />}
                  iconPosition="left"
                  onClick={() => selectedItem && handleDownloadFile(selectedItem)}
                  disabled={!selectedItem || (!selectedItem.fileName && !selectedItem.fileUrl)}
                >
                  Download
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Kredensial;
