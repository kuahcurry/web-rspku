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
import { isAuthenticated } from '../../utils/auth';
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

const DUMMY_ACTIVITIES = [
  {
    id: 1,
    nama_kegiatan: 'Observasi Klinis IGD',
    tanggal_kegiatan: '2024-02-20',
    jenis_kegiatan: 'Observasi',
    tahap: 'Kredensial Awal',
    hasil: 'Kompeten',
    masa_berlaku: '2026-02-20',
    fileName: 'observasi_igd.pdf',
    fileUrl: '/storage/kredensial/observasi_igd.pdf',
    catatan: 'Observasi alur triase dan resusitasi selama 3 hari.'
  },
  {
    id: 2,
    nama_kegiatan: 'Uji Kompetensi Klinis',
    tanggal_kegiatan: '2024-04-05',
    jenis_kegiatan: 'Uji Kompetensi',
    tahap: 'Kredensial Awal',
    hasil: 'Kompeten',
    masa_berlaku: '2026-04-05',
    fileName: 'uji_kompetensi.pdf',
    fileUrl: '/storage/kredensial/uji_kompetensi.pdf',
    catatan: 'Lulus dengan nilai A, mencakup prosedur emergensi.'
  },
  {
    id: 3,
    nama_kegiatan: 'Praktik Mandiri Terbimbing',
    tanggal_kegiatan: '2024-07-12',
    jenis_kegiatan: 'Praktik Mandiri',
    tahap: 'Rekredensial',
    hasil: 'Kompeten',
    masa_berlaku: '2026-07-12',
    fileName: 'praktik_mandiri.pdf',
    fileUrl: '/storage/kredensial/praktik_mandiri.pdf',
    catatan: 'Pendampingan 1 bulan di poli umum dengan supervisi.'
  },
  {
    id: 4,
    nama_kegiatan: 'Seminar Khusus Kredensial',
    tanggal_kegiatan: '2024-09-01',
    jenis_kegiatan: 'Seminar',
    tahap: 'Rekredensial',
    hasil: 'Tidak Kompeten',
    masa_berlaku: '',
    fileName: '',
    fileUrl: '',
    catatan: 'Topik patient safety dan kontrol infeksi.'
  }
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
  const [activities, setActivities] = useState(DUMMY_ACTIVITIES);
  const [activeTab, setActiveTab] = useState('riwayat');
  const [loading, setLoading] = useState(false);
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
    tanggal_kegiatan: '',
    jenis_kegiatan: '',
    tahap: 'Kredensial Awal',
    hasil: 'Kompeten',
    masa_berlaku: '',
    catatan: '',
    file: null,
    fileUrl: null
  });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const yearOptions = useMemo(() => {
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
      tanggal_kegiatan: '',
      jenis_kegiatan: '',
      tahap: 'Kredensial Awal',
      hasil: 'Kompeten',
      masa_berlaku: '',
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
      tanggal_kegiatan: item.tanggal_kegiatan || '',
      jenis_kegiatan: item.jenis_kegiatan || '',
      tahap: item.tahap || 'Kredensial Awal',
      hasil: item.hasil || 'Belum Diisi',
      masa_berlaku: item.masa_berlaku || '',
      catatan: item.catatan || '',
      file: null,
      fileUrl: null
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama_kegiatan || !formData.tanggal_kegiatan || !formData.jenis_kegiatan || !formData.hasil) {
      alert('Mohon lengkapi minimal nama, tanggal, jenis, dan hasil.');
      return;
    }
    const payload = {
      id: editingId || Date.now(),
      nama_kegiatan: formData.nama_kegiatan,
      tanggal_kegiatan: formData.tanggal_kegiatan,
      jenis_kegiatan: formData.jenis_kegiatan,
      tahap: formData.tahap,
      hasil: formData.hasil,
      masa_berlaku: formData.masa_berlaku,
      catatan: formData.catatan,
      fileName: formData.file?.name || activities.find((a) => a.id === editingId)?.fileName || '',
      fileUrl: formData.fileUrl || activities.find((a) => a.id === editingId)?.fileUrl || ''
    };
    setActivities((prev) => {
      if (editingId) {
        return prev.map((item) => (item.id === editingId ? payload : item));
      }
      return [payload, ...prev];
    });
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nama_kegiatan: '',
      tanggal_kegiatan: '',
      jenis_kegiatan: '',
      tahap: 'Kredensial Awal',
      hasil: 'Kompeten',
      masa_berlaku: '',
      catatan: '',
      file: null,
      fileUrl: null
    });
  };

  const handleViewFile = (item) => {
    const link = item.fileUrl || (item.fileName ? `/storage/kredensial/${item.fileName}` : null);
    if (link) {
      setSelectedItem(item);
      setShowViewModal(true);
      setLoadingPdf(true);
      setTimeout(() => {
        setPdfUrl(link);
        setLoadingPdf(false);
      }, 200);
    } else {
      alert('Sertifikat belum diupload.');
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

  const handleConfirmDelete = () => {
    if (!deleteTargets.length) return;
    const idsToDelete = deleteTargets.map((entry) => entry.id);
    setActivities((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
    if (selectedItem && idsToDelete.includes(selectedItem.id)) {
      setSelectedItem(null);
      setShowViewModal(false);
    }
    setDeleteTargets([]);
    setDeleteMode(false);
    setShowDeleteModal(false);
  };

  const isFormValid = formData.nama_kegiatan && formData.tanggal_kegiatan && formData.jenis_kegiatan && formData.hasil;

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
          Riwayat kegiatan kredensial, hasil penilaian, dan dokumen pendukung yang diinput sendiri oleh perawat.
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
                    <div className="table-cell">{formatDateToIndonesian(item.tanggal_kegiatan)}</div>
                    <div className={`table-cell ${styles.mainCell}`}>
                      <p className={styles.mainTitle}>{item.nama_kegiatan}</p>
                      <p className={styles.mutedText}>{item.jenis_kegiatan}</p>
                    </div>
                    <div className="table-cell">{item.jenis_kegiatan}</div>
                    <div className="table-cell">{item.tahap}</div>
                    <div className="table-cell">
                      <span className={`${styles.statusBadge} ${styles[`badge-${badge.variant}`]}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="table-cell">
                      <p className={styles.mutedText}>{item.catatan || '-'}</p>
                    </div>
                    <div className={`table-cell ${styles.actionCol}`}>
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
              <div className={styles.actionButtons}>
                <Button variant="success" size="small" icon={<MdAdd />} iconPosition="left" onClick={openAddModal}>
                  Tambah
                </Button>
                <Button variant="danger" size="small" icon={<MdDelete/>} iconPosition="left" onClick={handleDeleteButtonClick}>
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
                    <div className="table-cell">{formatDateToIndonesian(item.tanggal_kegiatan)}</div>
                    <div className="table-cell">
                      {item.masa_berlaku
                        ? `${new Date(item.tanggal_kegiatan).getFullYear()} - ${new Date(
                            item.masa_berlaku
                          ).getFullYear()}`
                        : '-'}
                    </div>
                    <div className="table-cell">
                      <span className={`${styles.statusBadge} ${styles[`badge-${badge.variant}`]}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="table-cell">
                      <p className={styles.mutedText}>{item.catatan || '-'}</p>
                    </div>
                    <div className={`table-cell ${styles.actionCol}`}>
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
              label="Tanggal Kegiatan"
              type="date"
              name="tanggal_kegiatan"
              value={formData.tanggal_kegiatan}
              onChange={(e) => setFormData({ ...formData, tanggal_kegiatan: e.target.value })}
              required
            />
            <Input
              label="Masa Berlaku (opsional)"
              type="date"
              name="masa_berlaku"
              value={formData.masa_berlaku}
              onChange={(e) => setFormData({ ...formData, masa_berlaku: e.target.value })}
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
              name="tahap"
              value={formData.tahap}
              onChange={(e) => setFormData({ ...formData, tahap: e.target.value })}
              options={JENIS_TAHAP}
              required
            />
          </Form.Row>
          <Input
            label="Hasil Penilaian"
            type="select"
            name="hasil"
            value={formData.hasil}
            onChange={(e) => setFormData({ ...formData, hasil: e.target.value })}
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
            <Button variant="danger" type="button" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit" disabled={!isFormValid}>
              Simpan
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
