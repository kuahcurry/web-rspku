import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Tabs from '../../components/tabs/Tabs';
import Table from '../../components/table/Table';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import { MdAdd, MdSave, MdSearch, MdVisibility, MdDelete, MdEdit } from 'react-icons/md';
import { isAuthenticated } from '../../utils/auth';
import { formatDateToIndonesian } from '../../utils/dateFormatter';
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

const DUMMY_ETIK = [
  {
    id: 1,
    tanggal: '2024-02-15',
    jenis: 'Pelanggaran Kode Etik',
    tingkat: 'Sedang',
    status: 'Selesai',
    uraian: 'Pelanggaran terkait kerahasiaan pasien.',
    tanggal_selesai: '2024-03-01',
    catatan: 'Pembinaan selesai, monitoring 3 bulan.',
    dokumenName: 'berita_acara_etik.pdf',
    dokumenUrl: '/storage/etik/berita_acara_etik.pdf'
  },
  {
    id: 2,
    tanggal: '2024-05-10',
    jenis: 'Komunikasi Tidak Profesional',
    tingkat: 'Ringan',
    status: 'Proses',
    uraian: 'Keluhan dari keluarga pasien terkait komunikasi.',
    tanggal_selesai: '',
    catatan: 'Sedang dalam pembinaan oleh atasan langsung.',
    dokumenName: '',
    dokumenUrl: ''
  }
];

const DUMMY_DISIPLIN = [
  {
    id: 11,
    tanggal: '2024-01-20',
    jenis: 'Ketidakhadiran tanpa izin',
    tindakan: 'SP1',
    status: 'Selesai',
    uraian: 'Tidak hadir 2 shift berturut-turut tanpa konfirmasi.',
    tanggal_selesai: '2024-02-05',
    catatan: 'Surat pernyataan sudah ditandatangani.',
    dokumenName: 'sp1_jan2024.pdf',
    dokumenUrl: '/storage/disiplin/sp1_jan2024.pdf'
  },
  {
    id: 12,
    tanggal: '2024-08-12',
    jenis: 'Keterlambatan berulang',
    tindakan: 'Teguran Tertulis',
    status: 'Proses',
    uraian: 'Keterlambatan >5 kali dalam 1 bulan.',
    tanggal_selesai: '',
    catatan: 'Monitoring absensi minggu ini.',
    dokumenName: '',
    dokumenUrl: ''
  }
];

const EtikDisiplin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('etik');
  const [etikRecords, setEtikRecords] = useState(DUMMY_ETIK);
  const [disiplinRecords, setDisiplinRecords] = useState(DUMMY_DISIPLIN);
  const [filtersEtik, setFiltersEtik] = useState({ search: '', year: 'Semua', status: 'Semua' });
  const [filtersDisiplin, setFiltersDisiplin] = useState({
    search: '',
    year: 'Semua',
    tingkat: 'Semua',
    status: 'Semua'
  });
  const [showEtikModal, setShowEtikModal] = useState(false);
  const [showDisiplinModal, setShowDisiplinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEtikId, setEditingEtikId] = useState(null);
  const [editingDisiplinId, setEditingDisiplinId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const fileEtikRef = useRef(null);
  const fileDisiplinRef = useRef(null);
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

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

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
        item.uraian.toLowerCase().includes(filtersEtik.search.toLowerCase());
      const matchesYear =
        filtersEtik.year === 'Semua' ||
        new Date(item.tanggal).getFullYear().toString() === filtersEtik.year;
      const matchesStatus = filtersEtik.status === 'Semua' || item.status === filtersEtik.status;
      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [etikRecords, filtersEtik]);

  const filteredDisiplin = useMemo(() => {
    return disiplinRecords.filter((item) => {
      const matchesSearch =
        !filtersDisiplin.search ||
        item.jenis.toLowerCase().includes(filtersDisiplin.search.toLowerCase()) ||
        item.uraian.toLowerCase().includes(filtersDisiplin.search.toLowerCase());
      const matchesYear =
        filtersDisiplin.year === 'Semua' ||
        new Date(item.tanggal).getFullYear().toString() === filtersDisiplin.year;
      const matchesTingkat =
        filtersDisiplin.tingkat === 'Semua' || item.tindakan === filtersDisiplin.tingkat;
      const matchesStatus = filtersDisiplin.status === 'Semua' || item.status === filtersDisiplin.status;
      return matchesSearch && matchesYear && matchesTingkat && matchesStatus;
    });
  }, [disiplinRecords, filtersDisiplin]);

  const handleEtikFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setEtikForm((prev) => {
      if (prev.fileUrl) URL.revokeObjectURL(prev.fileUrl);
      return { ...prev, file, fileUrl: blobUrl };
    });
  };

  const handleDisiplinFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setDisiplinForm((prev) => {
      if (prev.fileUrl) URL.revokeObjectURL(prev.fileUrl);
      return { ...prev, file, fileUrl: blobUrl };
    });
  };

  const openEtikModal = (item = null) => {
    if (item) {
      setEditingEtikId(item.id);
      setEtikForm({
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

  const handleSaveEtik = (e) => {
    e.preventDefault();
    if (!etikForm.tanggal || !etikForm.jenis || !etikForm.uraian || !etikForm.tingkat || !etikForm.status) return;
    const payload = {
      id: editingEtikId || Date.now(),
      tanggal: etikForm.tanggal,
      jenis: etikForm.jenis,
      uraian: etikForm.uraian,
      tingkat: etikForm.tingkat,
      status: etikForm.status,
      tanggal_selesai: etikForm.tanggal_selesai,
      catatan: etikForm.catatan,
      dokumenName: etikForm.file?.name || etikRecords.find((r) => r.id === editingEtikId)?.dokumenName || '',
      dokumenUrl: etikForm.fileUrl || etikRecords.find((r) => r.id === editingEtikId)?.dokumenUrl || ''
    };
    setEtikRecords((prev) => {
      if (editingEtikId) return prev.map((item) => (item.id === editingEtikId ? payload : item));
      return [payload, ...prev];
    });
    setShowEtikModal(false);
    setEditingEtikId(null);
  };

  const handleSaveDisiplin = (e) => {
    e.preventDefault();
    if (!disiplinForm.tanggal || !disiplinForm.jenis || !disiplinForm.uraian || !disiplinForm.tindakan) return;
    const payload = {
      id: editingDisiplinId || Date.now(),
      tanggal: disiplinForm.tanggal,
      jenis: disiplinForm.jenis,
      uraian: disiplinForm.uraian,
      tindakan: disiplinForm.tindakan,
      status: disiplinForm.status,
      tanggal_selesai: disiplinForm.tanggal_selesai,
      catatan: disiplinForm.catatan,
      dokumenName:
        disiplinForm.file?.name || disiplinRecords.find((r) => r.id === editingDisiplinId)?.dokumenName || '',
      dokumenUrl:
        disiplinForm.fileUrl || disiplinRecords.find((r) => r.id === editingDisiplinId)?.dokumenUrl || ''
    };
    setDisiplinRecords((prev) => {
      if (editingDisiplinId) return prev.map((item) => (item.id === editingDisiplinId ? payload : item));
      return [payload, ...prev];
    });
    setShowDisiplinModal(false);
    setEditingDisiplinId(null);
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
      return [...prev, { id: item.id, scope, label: item.jenis, tanggal: item.tanggal }];
    });
  };

  const handleConfirmDelete = () => {
    const etikIds = deleteTargets.filter((d) => d.scope === 'etik').map((d) => d.id);
    const disiplinIds = deleteTargets.filter((d) => d.scope === 'disiplin').map((d) => d.id);
    if (etikIds.length) {
      setEtikRecords((prev) => prev.filter((item) => !etikIds.includes(item.id)));
    }
    if (disiplinIds.length) {
      setDisiplinRecords((prev) => prev.filter((item) => !disiplinIds.includes(item.id)));
    }
    if (viewItem && deleteTargets.some((d) => d.id === viewItem.id)) {
      setViewOpen(false);
    }
    handleCancelDelete();
  };

  const openView = (item) => {
    setViewItem(item);
    setViewOpen(true);
  };

  const renderStatusPill = (label, tone = 'neutral') => {
    return <span className={`${styles.badge} ${styles[`badge-${tone}`]}`}>{label}</span>;
  };

  const deleteCount = deleteTargets.filter((t) => t.scope === activeTab).length;

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Etik & Disiplin</h1>
        <p className={styles.pageSubtitle}>
          Riwayat pembinaan etik dan disiplin yang pernah diterima perawat.
        </p>
      </header>

      <div className={styles.container}>
        <Card padding="normal" className={styles.cardShell}>
          <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} className={styles.tabGroup} />

          {activeTab === 'etik' && (
            <div className={styles.section}>
              <div className={styles.headerRow}>
                <h3 className={styles.sectionTitle}>Riwayat Pembinaan Etik</h3>
                <div className={styles.actionButtons}>
                  <Button variant="success" size="small" icon={<MdAdd />} iconPosition="left" onClick={() => openEtikModal()}>
                    Tambah
                  </Button>
                  <Button variant="danger" size="small" icon={<MdDelete />} iconPosition="left" onClick={handleDeleteButtonClick}>
                    {deleteMode ? (deleteCount ? `Hapus (${deleteCount})` : 'Batal') : 'Hapus'}
                  </Button>
                </div>
              </div>
              <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                  <MdSearch size={18} />
                  <input
                    type="text"
                    placeholder="Cari pelanggaran atau uraian"
                    value={filtersEtik.search}
                    onChange={(e) => setFiltersEtik({ ...filtersEtik, search: e.target.value })}
                  />
                </div>
                <div className={styles.filterRow}>
                  <Input
                    type="select"
                    label="Tahun"
                    value={filtersEtik.year}
                    onChange={(e) => setFiltersEtik({ ...filtersEtik, year: e.target.value })}
                    options={yearsEtik.map((year) => ({ value: year, label: year }))}
                  />
                  <Input
                    type="select"
                    label="Status Penyelesaian"
                    value={filtersEtik.status}
                    onChange={(e) => setFiltersEtik({ ...filtersEtik, status: e.target.value })}
                    options={[{ value: 'Semua', label: 'Semua' }, ...STATUS_OPTIONS]}
                  />
                </div>
              </div>

              {deleteMode && (
                <p className={styles.deleteNotice}>Pilih satu atau lebih data lalu klik Hapus untuk konfirmasi.</p>
              )}

              <Table
                columns={[
                  { key: 'tanggal', label: 'Tanggal' },
                  { key: 'jenis', label: 'Jenis Pelanggaran' },
                  { key: 'tingkat', label: 'Tingkat' },
                  { key: 'status', label: 'Status' },
                  { key: 'aksi', label: 'Aksi' }
                ]}
                className={`${styles.table} ${styles.tableEtik}`}
              >
                {filteredEtik.length === 0 && <div className={styles.emptyState}>Belum ada catatan etik.</div>}
                {filteredEtik.map((item) => {
                  const isSelected = deleteTargets.some((d) => d.id === item.id && d.scope === 'etik');
                  return (
                    <div
                      className={`table-row ${deleteMode ? styles.deleteSelectable : ''} ${
                        isSelected ? styles.deleteSelected : ''
                      }`}
                      key={item.id}
                      onClick={() => handleSelectForDelete(item, 'etik')}
                    >
                      <div className="table-cell" data-label="Tanggal">{formatDateToIndonesian(item.tanggal)}</div>
                      <div className="table-cell" data-label="Jenis Pelanggaran">
                        <p className={styles.mainTitle}>{item.jenis}</p>
                        <p className={styles.mutedText}>{item.uraian}</p>
                      </div>
                      <div className="table-cell" data-label="Tingkat">{renderStatusPill(item.tingkat, 'info')}</div>
                      <div className="table-cell" data-label="Status">
                        {renderStatusPill(item.status, item.status === 'Selesai' ? 'success' : 'warning')}
                      </div>
                      <div className={`table-cell ${styles.actionCol}`} data-label="Aksi">
                        <Button
                          variant="warning"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEtikModal(item);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          icon={<MdVisibility />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openView(item);
                          }}
                        >
                          Lihat
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </Table>
            </div>
          )}

          {activeTab === 'disiplin' && (
            <div className={styles.section}>
              <div className={styles.headerRow}>
                <h3 className={styles.sectionTitle}>Riwayat Disiplin</h3>
                <div className={styles.actionButtons}>
                  <Button
                    variant="success"
                    size="small"
                    icon={<MdAdd />}
                    iconPosition="left"
                    onClick={() => openDisiplinModal()}
                  >
                    Tambah
                  </Button>
                  <Button variant="danger" size="small" icon={<MdDelete />} iconPosition="left" onClick={handleDeleteButtonClick}>
                    {deleteMode ? (deleteCount ? `Hapus (${deleteCount})` : 'Batal') : 'Hapus'}
                  </Button>
                </div>
              </div>
              <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                  <MdSearch size={18} />
                  <input
                    type="text"
                    placeholder="Cari pelanggaran atau uraian"
                    value={filtersDisiplin.search}
                    onChange={(e) => setFiltersDisiplin({ ...filtersDisiplin, search: e.target.value })}
                  />
                </div>
                <div className={styles.filterRow}>
                  <Input
                    type="select"
                    label="Tahun"
                    value={filtersDisiplin.year}
                    onChange={(e) => setFiltersDisiplin({ ...filtersDisiplin, year: e.target.value })}
                    options={yearsDisiplin.map((year) => ({ value: year, label: year }))}
                  />
                  <Input
                    type="select"
                    label="Tingkat / Tindakan"
                    value={filtersDisiplin.tingkat}
                    onChange={(e) => setFiltersDisiplin({ ...filtersDisiplin, tingkat: e.target.value })}
                    options={[{ value: 'Semua', label: 'Semua' }, ...TINDAKAN_OPTIONS]}
                  />
                  <Input
                    type="select"
                    label="Status Pembinaan"
                    value={filtersDisiplin.status}
                    onChange={(e) => setFiltersDisiplin({ ...filtersDisiplin, status: e.target.value })}
                    options={[{ value: 'Semua', label: 'Semua' }, ...STATUS_OPTIONS]}
                  />
                </div>
              </div>

              {deleteMode && (
                <p className={styles.deleteNotice}>Pilih satu atau lebih data lalu klik Hapus untuk konfirmasi.</p>
              )}

              <Table
                columns={[
                  { key: 'tanggal', label: 'Tanggal' },
                  { key: 'jenis', label: 'Jenis Pelanggaran' },
                  { key: 'tindakan', label: 'Tindakan Disiplin' },
                  { key: 'status', label: 'Status' },
                  { key: 'aksi', label: 'Aksi' }
                ]}
                className={`${styles.table} ${styles.tableDisiplin}`}
              >
                {filteredDisiplin.length === 0 && <div className={styles.emptyState}>Belum ada catatan disiplin.</div>}
                {filteredDisiplin.map((item) => {
                  const isSelected = deleteTargets.some((d) => d.id === item.id && d.scope === 'disiplin');
                  return (
                    <div
                      className={`table-row ${deleteMode ? styles.deleteSelectable : ''} ${
                        isSelected ? styles.deleteSelected : ''
                      }`}
                      key={item.id}
                      onClick={() => handleSelectForDelete(item, 'disiplin')}
                    >
                      <div className="table-cell" data-label="Tanggal">{formatDateToIndonesian(item.tanggal)}</div>
                      <div className="table-cell" data-label="Jenis Pelanggaran">
                        <p className={styles.mainTitle}>{item.jenis}</p>
                        <p className={styles.mutedText}>{item.uraian}</p>
                      </div>
                      <div className="table-cell" data-label="Tindakan Disiplin">{renderStatusPill(item.tindakan, 'info')}</div>
                      <div className="table-cell" data-label="Status">
                        {renderStatusPill(item.status, item.status === 'Selesai' ? 'success' : 'warning')}
                      </div>
                      <div className={`table-cell ${styles.actionCol}`} data-label="Aksi">
                        <Button
                          variant="warning"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDisiplinModal(item);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          icon={<MdVisibility />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openView(item);
                          }}
                        >
                          Lihat
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </Table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showEtikModal}
        onClose={() => setShowEtikModal(false)}
        title={editingEtikId ? 'Edit Catatan Etik' : 'Tambah Catatan Etik'}
        size="large"
        padding="normal"
      >
        <Form onSubmit={handleSaveEtik} className={styles.modalContent}>
          <Form.Row columns={2} className={styles.formRow}>
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
          <Form.Row columns={3} className={styles.formRow}>
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
          <div className={styles.fileDrop} onClick={() => fileEtikRef.current?.click()}>
            <p className={styles.fileDropTitle}>Upload dokumen pendukung (opsional)</p>
            <p className={styles.fileDropHint}>PDF, DOC, atau gambar</p>
            <Button
              variant="outline"
              size="small"
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
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
          <Form.Actions align="right" className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={() => setShowEtikModal(false)}>
              Batal
            </Button>
            <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit">
              Simpan
            </Button>
          </Form.Actions>
        </Form>
      </Modal>

      <Modal
        isOpen={showDisiplinModal}
        onClose={() => setShowDisiplinModal(false)}
        title={editingDisiplinId ? 'Edit Catatan Disiplin' : 'Tambah Catatan Disiplin'}
        size="large"
        padding="normal"
      >
        <Form onSubmit={handleSaveDisiplin} className={styles.modalContent}>
          <Form.Row columns={2} className={styles.formRow}>
            <Input
              label="Tanggal Kejadian"
              type="date"
              value={disiplinForm.tanggal}
              onChange={(e) => setDisiplinForm({ ...disiplinForm, tanggal: e.target.value })}
              required
            />
            <Input
              label="Tanggal Selesai (opsional)"
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
            placeholder="Contoh: Ketidakhadiran tanpa izin"
            required
          />
          <Input
            label="Uraian kejadian"
            type="textarea"
            rows={3}
            value={disiplinForm.uraian}
            onChange={(e) => setDisiplinForm({ ...disiplinForm, uraian: e.target.value })}
            placeholder="Ringkasan kejadian"
            required
          />
          <Form.Row columns={3} className={styles.formRow}>
            <Input
              label="Tindakan Disiplin"
              type="select"
              value={disiplinForm.tindakan}
              onChange={(e) => setDisiplinForm({ ...disiplinForm, tindakan: e.target.value })}
              options={TINDAKAN_OPTIONS}
              required
            />
            <Input
              label="Status Pembinaan"
              type="select"
              value={disiplinForm.status}
              onChange={(e) => setDisiplinForm({ ...disiplinForm, status: e.target.value })}
              options={STATUS_OPTIONS}
              required
            />
            <Input
              label="Catatan tambahan"
              type="text"
              value={disiplinForm.catatan}
              onChange={(e) => setDisiplinForm({ ...disiplinForm, catatan: e.target.value })}
              placeholder="Tambahan"
            />
          </Form.Row>
          <div className={styles.fileDrop} onClick={() => fileDisiplinRef.current?.click()}>
            <p className={styles.fileDropTitle}>Upload dokumen (opsional)</p>
            <p className={styles.fileDropHint}>PDF, DOC, atau gambar</p>
            <Button
              variant="outline"
              size="small"
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
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
          <Form.Actions align="right" className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={() => setShowDisiplinModal(false)}>
              Batal
            </Button>
            <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit">
              Simpan
            </Button>
          </Form.Actions>
        </Form>
      </Modal>

      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title={viewItem?.jenis || 'Detail Catatan'}
        size="large"
        padding="normal"
      >
        <div className={styles.viewContent}>
          <div className={styles.metaGrid}>
            <div>
              <p className={styles.metaLabel}>Tanggal Kejadian</p>
              <p className={styles.metaValue}>
                {viewItem?.tanggal ? formatDateToIndonesian(viewItem.tanggal) : '-'}
              </p>
            </div>
            {'tindakan' in (viewItem || {}) ? (
              <div>
                <p className={styles.metaLabel}>Tindakan / Tingkat</p>
                <p className={styles.metaValue}>{viewItem?.tindakan || '-'}</p>
              </div>
            ) : (
              <div>
                <p className={styles.metaLabel}>Tingkat</p>
                <p className={styles.metaValue}>{viewItem?.tingkat || '-'}</p>
              </div>
            )}
            <div>
              <p className={styles.metaLabel}>Status</p>
              <p className={styles.metaValue}>{viewItem?.status || '-'}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Tanggal Selesai</p>
              <p className={styles.metaValue}>
                {viewItem?.tanggal_selesai ? formatDateToIndonesian(viewItem.tanggal_selesai) : '-'}
              </p>
            </div>
          </div>
          <div className={styles.sectionBox}>
            <p className={styles.metaLabel}>Uraian</p>
            <p className={styles.metaValue}>{viewItem?.uraian || '-'}</p>
          </div>
          <div className={styles.sectionBox}>
            <p className={styles.metaLabel}>Catatan</p>
            <p className={styles.metaValue}>{viewItem?.catatan || '-'}</p>
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setViewOpen(false)}>
              Tutup
            </Button>
            <Button
              variant="primary"
              icon={<MdVisibility />}
              iconPosition="left"
              disabled={!viewItem?.dokumenUrl}
              onClick={() => viewItem?.dokumenUrl && window.open(viewItem.dokumenUrl, '_blank')}
            >
              Lihat Dokumen
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Konfirmasi Hapus"
        size="small"
        padding="normal"
      >
        <div className={styles.modalContent}>
          <p className={styles.metaValue}>Hapus {deleteCount} data terpilih?</p>
          <p className={styles.metaLabel}>Data yang dihapus tidak dapat dikembalikan.</p>
          {!!deleteTargets.filter((d) => d.scope === activeTab).length && (
            <ul className={styles.deleteList}>
              {deleteTargets
                .filter((d) => d.scope === activeTab)
                .map((item) => (
                  <li key={`${item.scope}-${item.id}`} className={styles.deleteListItem}>
                    {item.label} - {formatDateToIndonesian(item.tanggal)}
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
    </MainLayout>
  );
};

export default EtikDisiplin;
