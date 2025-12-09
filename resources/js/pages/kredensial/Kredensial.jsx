import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import Tabs from '../../components/tabs/Tabs';
import Table from '../../components/table/Table';
import {
  MdAdd,
  MdCloudUpload,
  MdDelete,
  MdDownload,
  MdSave,
  MdSearch,
  MdVisibility,
  MdEdit
} from 'react-icons/md';
import { isAuthenticated, authenticatedFetch } from '../../utils/auth';
import { formatDateToIndonesian } from '../../utils/dateFormatter';
import styles from './Kredensial.module.css';

const JENIS_TAHAP = [
  { value: 'Kredensial Awal', label: 'Kredensial Awal' },
  { value: 'Rekredensial', label: 'Rekredensial' }
];

const JENIS_KEGIATAN = [
  { value: 'Observasi', label: 'Observasi Klinis' },
  { value: 'Uji Kompetensi', label: 'Uji Kompetensi Klinis' },
  { value: 'Praktik Mandiri', label: 'Praktik Mandiri Terbimbing' },
  { value: 'Seminar', label: 'Seminar Khusus Kredensial' },
  { value: 'SKP Kredensial', label: 'Kegiatan SKP Kredensial' },
  { value: 'Lainnya', label: 'Lainnya' }
];

const HASIL_OPTIONS = [
  { value: 'Kompeten', label: 'Kompeten' },
  { value: 'Tidak Kompeten', label: 'Tidak Kompeten' },
  { value: 'Belum Diisi', label: 'Belum Diisi' }
];

const TAB_ITEMS = [
  { key: 'riwayat', label: 'Riwayat Kegiatan' },
  { key: 'rekred', label: 'Rekredensial' }
];

const getStatusBadge = (hasil) => {
  const normalized = (hasil || '').toLowerCase();
  if (normalized === 'kompeten') return { label: 'Kompeten', variant: 'success' };
  if (normalized === 'tidak kompeten') return { label: 'Tidak Kompeten', variant: 'danger' };
  return { label: 'Belum Diisi', variant: 'secondary' };
};

const Kredensial = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('riwayat');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    year: 'Semua',
    hasil: 'Semua'
  });
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
    hasil_penilaian: 'Kompeten',
    catatan: '',
    file: null,
    fileUrl: null
  });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

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
        // Map API fields to component field names
        const mapRecord = (record) => ({
          id: record.id,
          nama_kegiatan: record.nama_kegiatan,
          tanggal_kegiatan: record.tanggal_berlaku,
          jenis_kegiatan: record.jenis_kegiatan,
          tahap: record.kredensial_type,
          hasil: record.hasil_penilaian,
          masa_berlaku: record.tanggal_selesai,
          catatan: record.catatan,
          fileName: record.file_name,
          fileUrl: record.url,
          file_name: record.file_name
        });

        setActivities((data.data.riwayat || []).map(mapRecord));
      }
    } catch (error) {
      console.error('Error fetching kredensial records:', error);
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = useMemo(() => {
    if (!activities || activities.length === 0) return ['Semua'];
    const years = Array.from(
      new Set(
        activities
          .map((item) => (item.tanggal_kegiatan ? new Date(item.tanggal_kegiatan).getFullYear().toString() : null))
          .filter(Boolean)
      )
    ).sort((a, b) => Number(b) - Number(a));
    return ['Semua', ...years];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchesSearch =
        filters.search.trim().length === 0 ||
        item.nama_kegiatan.toLowerCase().includes(filters.search.trim().toLowerCase());
      const matchesYear =
        filters.year === 'Semua' ||
        (item.tanggal_kegiatan && new Date(item.tanggal_kegiatan).getFullYear().toString() === filters.year);
      const matchesHasil = filters.hasil === 'Semua' || item.hasil === filters.hasil;
      return matchesSearch && matchesYear && matchesHasil;
    });
  }, [activities, filters]);

  const rekredActivities = useMemo(
    () => filteredActivities.filter((item) => item.tahap === 'Rekredensial'),
    [filteredActivities]
  );

  const kompetenCount = activities.filter((item) => item.hasil === 'Kompeten').length;
  const tidakKompetenCount = activities.filter((item) => item.hasil === 'Tidak Kompeten').length;
  const statusGlobal = getStatusBadge(
    kompetenCount ? 'Kompeten' : tidakKompetenCount ? 'Tidak Kompeten' : 'Belum Diisi'
  );
  const masaBerlaku = useMemo(() => {
    const kompetenWithDate = activities
      .filter((item) => item.hasil === 'Kompeten' && item.masa_berlaku)
      .sort((a, b) => new Date(b.masa_berlaku) - new Date(a.masa_berlaku));
    if (!kompetenWithDate.length) return 'Belum diatur';
    return `Berlaku s.d. ${formatDateToIndonesian(kompetenWithDate[0].masa_berlaku)}`;
  }, [activities]);

  const openAddModal = () => {
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
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      nama_kegiatan: item.nama_kegiatan || '',
      tanggal_berlaku: item.tanggal_kegiatan || '',
      tanggal_selesai: item.masa_berlaku || '',
      jenis_kegiatan: item.jenis_kegiatan || '',
      kredensial_type: item.tahap || 'Kredensial Awal',
      hasil_penilaian: item.hasil || 'Belum Diisi',
      catatan: item.catatan || '',
      file: null,
      fileUrl: item.fileUrl || null
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Hanya file PDF yang diperbolehkan');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5MB');
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
    if (!formData.nama_kegiatan || !formData.tanggal_berlaku || !formData.jenis_kegiatan || !formData.hasil_penilaian) {
      alert('Mohon lengkapi minimal nama, tanggal, jenis, dan hasil.');
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
        ? `/api/kredensial/update/${editingId}`
        : '/api/kredensial/store';
      
      // Use POST for both create and update (with _method for update)
      if (editingId) {
        apiFormData.append('_method', 'PUT');
      }

      const response = await authenticatedFetch(url, {
        method: 'POST',
        body: apiFormData
      });

      if (response.ok) {
        await fetchData(); // Refresh data
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
      } else {
        const error = await response.json();
        alert(error.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error saving kredensial:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewFile = async (item) => {
    if (!item.fileName && !item.fileUrl) {
      alert('Sertifikat belum diupload.');
      return;
    }

    setSelectedItem(item);
    setShowViewModal(true);
    setLoadingPdf(true);

    try {
      const response = await authenticatedFetch(`/api/kredensial/view/${item.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        alert('Gagal memuat dokumen');
        setShowViewModal(false);
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Terjadi kesalahan saat memuat dokumen');
      setShowViewModal(false);
    } finally {
      setLoadingPdf(false);
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
        await fetchData(); // Refresh data
        if (selectedItem && idsToDelete.includes(selectedItem.id)) {
          setSelectedItem(null);
          setShowViewModal(false);
        }
        setDeleteTargets([]);
        setDeleteMode(false);
        setShowDeleteModal(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting records:', error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const isFormValid = formData.nama_kegiatan && formData.tanggal_berlaku && formData.jenis_kegiatan && formData.hasil_penilaian;

  const columnsRiwayat = useMemo(
    () => [
      { key: 'tanggal', label: 'Tanggal Kegiatan' },
      { key: 'nama', label: 'Nama Kegiatan' },
      { key: 'jenis', label: 'Jenis' },
      { key: 'tahap', label: 'Kredensial Awal / Rekredensial' },
      { key: 'hasil', label: 'Hasil Penilaian' },
      { key: 'catatan', label: 'Catatan' },
      { key: 'aksi', label: 'Aksi' }
    ],
    []
  );

  const columnsRekred = useMemo(
    () => [
      { key: 'tanggal', label: 'Tanggal Rekredensial' },
      { key: 'periode', label: 'Periode Berlaku' },
      { key: 'hasil', label: 'Hasil' },
      { key: 'catatan', label: 'Catatan' },
      { key: 'aksi', label: 'Aksi' }
    ],
    []
  );

  if (loading) {
    return (
      <MainLayout>
        <header className={styles.pageHeader}>
          <div className={styles.breadcrumb}>Beranda / Kredensial</div>
          <h1 className={styles.pageTitle}>Kredensial & Rekredensial</h1>
          <p className={styles.pageSubtitle}>Memuat data...</p>
        </header>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Kredensial & Rekredensial</h1>
        <p className={styles.pageSubtitle}>
          Riwayat kegiatan kredensial perawat.
        </p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <Tabs tabs={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} className={styles.tabGroup} />

        {activeTab === 'riwayat' && (
          <div>
            <div className={styles.headerRow}>
              <h3 className={styles.sectionTitle}>Riwayat Kegiatan Kredensial</h3>
              <div className={styles.actionButtons}>
                <Button variant="success" size="small" icon={<MdAdd />} iconPosition="left" onClick={openAddModal}>
                  Tambah
                </Button>
                <Button variant="danger" size="small" icon={<MdDelete/>} iconPosition='left' onClick={handleDeleteButtonClick}>
                  {deleteMode
                    ? deleteTargets.length
                      ? `Hapus (${deleteTargets.length})`
                      : 'Batal'
                    : 'Hapus'}
                </Button>
              </div>
            </div>

            {deleteMode && (
              <p className={styles.deleteNotice}>Pilih satu atau lebih data untuk dihapus, lalu klik Hapus.</p>
            )}

            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <MdSearch size={18} />
                <input
                  type="text"
                  placeholder="Cari nama kegiatan…"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div className={styles.filterRow}>
                <Input
                  type="select"
                  label="Tahun"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  options={yearOptions.map((year) => ({ value: year, label: year }))}
                />
                <Input
                  type="select"
                  label="Hasil"
                  value={filters.hasil}
                  onChange={(e) => setFilters({ ...filters, hasil: e.target.value })}
                  options={[{ value: 'Semua', label: 'Semua' }, ...HASIL_OPTIONS]}
                />
              </div>
            </div>

            <Table columns={columnsRiwayat} className={`${styles.table} ${styles.riwayatTable}`}>
              {filteredActivities.length === 0 && (
                <div className={styles.emptyState}>Belum ada kegiatan sesuai filter.</div>
              )}
              {filteredActivities.map((item) => {
                const badge = getStatusBadge(item.hasil);
                const hasFile = Boolean(item.fileName);
                const isSelected = deleteTargets.some((entry) => entry.id === item.id);
                return (
                  <div 
                    key={item.id} 
                    className={`table-row ${deleteMode ? styles.deleteSelectable : ''} ${isSelected ? styles.deleteSelected : ''}`}
                    onClick={() => handleSelectForDelete(item)}
                  >
                    <div className="table-cell" data-label="Tanggal Kegiatan">{formatDateToIndonesian(item.tanggal_kegiatan)}</div>
                    <div className={`table-cell ${styles.mainCell}`} data-label="Nama Kegiatan">
                      <p className={styles.mainTitle}>{item.nama_kegiatan}</p>
                      <p className={styles.mutedText}>{item.jenis_kegiatan}</p>
                    </div>
                    <div className="table-cell" data-label="Jenis">{item.jenis_kegiatan}</div>
                    <div className="table-cell" data-label="Tahap">{item.tahap}</div>
                    <div className="table-cell" data-label="Hasil Penilaian">
                      <span className={`${styles.statusBadge} ${styles[`badge-${badge.variant}`]}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="table-cell" data-label="Catatan">
                      <p className={styles.mutedText}>{item.catatan || '-'}</p>
                    </div>
                    <div className={`table-cell ${styles.actionCol}`} data-label="Aksi">
                      <Button variant="warning" size="small" icon={<MdEdit />} iconPosition='left' onClick={() => openEditModal(item)}>
                        Edit
                      </Button>
                      {hasFile && (
                        <Button
                          variant="outline"
                          size="small"
                          icon={<MdVisibility />}
                          onClick={() => handleViewFile(item)}
                        >
                          Lihat
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Table>
          </div>
        )}

        {activeTab === 'rekred' && (
          <div>
            <div className={styles.headerRow}>
              <h3 className={styles.sectionTitle}>Rekredensial</h3>
            </div>

            {deleteMode && (
              <p className={styles.deleteNotice}>Pilih satu atau lebih data untuk dihapus, lalu klik Hapus.</p>
            )}
            <Table columns={columnsRekred} className={`${styles.table} ${styles.rekredTable}`}>
              {rekredActivities.length === 0 && <div className={styles.emptyState}>Belum ada rekredensial.</div>}
              {rekredActivities.map((item) => {
                const badge = getStatusBadge(item.hasil);
                const hasFile = Boolean(item.fileName);
                const isSelected = deleteTargets.some((entry) => entry.id === item.id);
                return (
                  <div 
                    key={item.id} 
                    className={`table-row ${deleteMode ? styles.deleteSelectable : ''} ${isSelected ? styles.deleteSelected : ''}`}
                    onClick={() => handleSelectForDelete(item)}
                  >
                    <div className="table-cell" data-label="Tanggal Rekredensial">{formatDateToIndonesian(item.tanggal_kegiatan)}</div>
                    <div className="table-cell" data-label="Periode Berlaku">
                      {item.masa_berlaku
                        ? `${new Date(item.tanggal_kegiatan).getFullYear()} - ${new Date(
                            item.masa_berlaku
                          ).getFullYear()}`
                        : '-'}
                    </div>
                    <div className="table-cell" data-label="Hasil">
                      <span className={`${styles.statusBadge} ${styles[`badge-${badge.variant}`]}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="table-cell" data-label="Catatan">
                      <p className={styles.mutedText}>{item.catatan || '-'}</p>
                    </div>
                    <div className={`table-cell ${styles.actionCol}`} data-label="Aksi">
                      <Button 
                        variant="warning" 
                        size="small" 
                        icon={<MdEdit/>}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(item);
                        }}
                      >
                        Edit
                      </Button>
                      {hasFile && (
                        <Button
                          variant="outline"
                          size="small"
                          icon={<MdVisibility />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFile(item);
                          }}
                        >
                          Lihat
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Table>
          </div>
        )}
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Konfirmasi Hapus"
        size="small"
        padding="normal"
      >
        <div className={styles.modalContent}>
          <p className={styles.metaValue}>Hapus {deleteTargets.length} data terpilih?</p>
          <p className={styles.metaLabel}>Data yang dihapus tidak dapat dikembalikan.</p>
          {!!deleteTargets.length && (
            <ul className={styles.deleteList}>
              {deleteTargets.map((item) => (
                <li key={item.id} className={styles.deleteListItem}>
                  {item.nama_kegiatan} - {formatDateToIndonesian(item.tanggal_kegiatan)}
                </li>
              ))}
            </ul>
          )}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Batal
            </Button>
            <Button variant="danger" icon={<MdDelete />} iconPosition="left" onClick={handleConfirmDelete}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Kegiatan Kredensial' : 'Tambah Kegiatan Kredensial'}
        size="large"
        padding="normal"
      >
        <Form onSubmit={handleSubmit} className={styles.modalContent}>
          <Form.Row columns={2} className={styles.formRow}>
            <Input
              label="Tanggal Mulai"
              type="date"
              name="tanggal_berlaku"
              value={formData.tanggal_berlaku}
              onChange={(e) => setFormData({ ...formData, tanggal_berlaku: e.target.value })}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              name="masa_berlaku"
              value={formData.masa_berlaku}
              onChange={(e) => setFormData({ ...formData, masa_berlaku: e.target.value })}
              required
            />
          </Form.Row>
          <Input
            label="Nama Kegiatan"
            type="text"
            name="nama_kegiatan"
            value={formData.nama_kegiatan}
            onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
            placeholder="Contoh: Observasi Klinis IGD"
            required
          />
          <Form.Row columns={2} className={styles.formRow}>
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
          </Form.Row>
          <Input
            label="Hasil Penilaian"
            type="select"
            name="hasil_penilaian"
            value={formData.hasil_penilaian}
            onChange={(e) => setFormData({ ...formData, hasil_penilaian: e.target.value })}
            options={HASIL_OPTIONS}
            required
          />
          <Input
            label="Catatan (opsional)"
            type="textarea"
            name="catatan"
            value={formData.catatan}
            onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
            placeholder="Contoh: Sesuai BA rapat tanggal 10-11-2024"
          />
          <div className={styles.fileDrop} onClick={() => fileInputRef.current?.click()}>
            <MdCloudUpload size={40} />
            <div className={styles.fileDropText}>
              <p className={styles.fileDropTitle}>Upload Sertifikat (opsional)</p>
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
                className={styles.fileDropButton}
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
            />
          </div>
          <Form.Actions align="right" className={styles.modalActions}>
            <Button variant="danger" type="button" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </Form.Actions>
        </Form>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setPdfUrl(null);
        }}
        title={selectedItem?.nama_kegiatan || 'Detail Kegiatan'}
        size="large"
        padding="normal"
      >
        <div className={styles.modalContent}>
          <div className={styles.metaRow}>
            <div>
              <p className={styles.metaLabel}>Tanggal Kegiatan</p>
              <p className={styles.metaValue}>
                {selectedItem?.tanggal_kegiatan ? formatDateToIndonesian(selectedItem.tanggal_kegiatan) : '-'}
              </p>
            </div>
            <div>
              <p className={styles.metaLabel}>Jenis</p>
              <p className={styles.metaValue}>{selectedItem?.jenis_kegiatan || '-'}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Tahap</p>
              <p className={styles.metaValue}>{selectedItem?.tahap || '-'}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Hasil</p>
              <p className={styles.metaValue}>{selectedItem?.hasil || '-'}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Masa Berlaku</p>
              <p className={styles.metaValue}>
                {selectedItem?.masa_berlaku ? formatDateToIndonesian(selectedItem.masa_berlaku) : 'Belum diatur'}
              </p>
            </div>
            <div>
              <p className={styles.metaLabel}>Catatan</p>
              <p className={styles.metaValue}>{selectedItem?.catatan || '-'}</p>
            </div>
          </div>

          {loadingPdf && (
            <div className={styles.pdfFrameWrapper}>
              <p style={{ textAlign: 'center', padding: '2rem' }}>Memuat dokumen...</p>
            </div>
          )}
          {!loadingPdf && pdfUrl && (
            <div className={styles.pdfFrameWrapper}>
              <iframe src={pdfUrl} className={styles.pdfFrame} title="PDF Viewer" />
            </div>
          )}
          {!loadingPdf && !pdfUrl && (
            <div className={styles.pdfFrameWrapper}>
              <p style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada dokumen</p>
            </div>
          )}

          <div className={styles.modalActions}>
            <Button variant="danger" onClick={() => setShowViewModal(false)}>
              Tutup
            </Button>
            <Button
              variant="primary"
              icon={<MdDownload />}
              iconPosition="left"
              onClick={() => selectedItem && handleViewFile(selectedItem)}
              disabled={!selectedItem || (!selectedItem.fileName && !selectedItem.fileUrl)}
            >
              Lihat / Download
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Kredensial;
