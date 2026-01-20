import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Banner from '../../../components/banner/Banner';
import Card from '../../../components/card/Card';
import Tabs from '../../../components/tabs/Tabs';
import Table from '../../../components/table/Table';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import { MdAdd, MdSave, MdSearch, MdVisibility, MdDownload, MdCloudUpload } from 'react-icons/md';
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

const EtikDisiplin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('etik');
  const [banner, setBanner] = useState({ message: '', variant: '' });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [etikRecords, setEtikRecords] = useState([]);
  const [disiplinRecords, setDisiplinRecords] = useState([]);
  const [filtersEtik, setFiltersEtik] = useState({ search: '', year: 'Semua', status: 'Semua' });
  const [filtersDisiplin, setFiltersDisiplin] = useState({
    search: '',
    year: 'Semua',
    tingkat: 'Semua',
    status: 'Semua'
  });
  const [showEtikModal, setShowEtikModal] = useState(false);
  const [showDisiplinModal, setShowDisiplinModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
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
      return;
    }
    fetchData();
  }, [navigate]);

  // Cleanup blob URL when view modal closes
  useEffect(() => {
    if (!viewOpen && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [viewOpen, pdfUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/etik-disiplin');
      const data = await response.json();

      if (response.ok && data.success) {
        // Map API fields to component field names
        const mapRecord = (record) => ({
          id: record.id,
          tanggal: record.tanggal_kejadian,
          jenis: record.jenis_pelanggaran,
          uraian: record.uraian_singkat,
          tingkat: record.tingkat,
          tindakan: record.tindakan,
          status: record.status_penyelesaian,
          tanggal_selesai: record.tanggal_penyelesaian,
          catatan: record.catatan,
          dokumenName: record.file_name,
          dokumenUrl: record.url,
          file_name: record.file_name
        });

        setEtikRecords((data.data.etik || []).map(mapRecord));
        setDisiplinRecords((data.data.disiplin || []).map(mapRecord));
      }
    } catch (error) {
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
    // User hanya bisa menambah data baru, tidak bisa edit
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
    // User hanya bisa menambah data baru, tidak bisa edit
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

    // Validate file for new record
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

    // Validate file for new record
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

  const renderStatusPill = (label, tone = 'neutral') => {
    return <span className={`${styles.badge} ${styles[`badge-${tone}`]}`}>{label}</span>;
  };

  return (
    <MainLayout>
      <Banner message={banner.message} variant={banner.variant} autoRefresh={banner.variant === 'success'} />
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
                <Button
                  variant="success"
                  size="small"
                  icon={<MdAdd />}
                  iconPosition="left"
                  onClick={() => openEtikModal()}
                >
                  Tambah
                </Button>
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
                  return (
                    <div
                      className="table-row"
                      key={item.id}
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
                          variant="primary"
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
                <Button
                  variant="success"
                  size="small"
                  icon={<MdAdd />}
                  iconPosition="left"
                  onClick={() => openDisiplinModal()}
                >
                  Tambah
                </Button>
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
                  return (
                    <div
                      className="table-row"
                      key={item.id}
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
                          variant="primary"
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
        title="Tambah Catatan Etik"
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
          <Form.Actions align="right" className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={() => setShowEtikModal(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </Form.Actions>
        </Form>
      </Modal>

      <Modal
        isOpen={showDisiplinModal}
        onClose={() => setShowDisiplinModal(false)}
        title="Tambah Catatan Disiplin"
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
          <Form.Actions align="right" className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={() => setShowDisiplinModal(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="success" icon={<MdSave />} iconPosition="left" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </Form.Actions>
        </Form>
      </Modal>

      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Detail Catatan"
        size="large"
        padding="normal"
        className={styles.viewModal}
      >
        {viewItem && (
          <div className={styles.viewDetail}>
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tanggal Kejadian</span>
                <span className={styles.detailValue}>
                  {viewItem?.tanggal ? formatDateToIndonesian(viewItem.tanggal) : '-'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Jenis Pelanggaran</span>
                <span className={styles.detailValue}>{viewItem?.jenis || '-'}</span>
              </div>
              {'tindakan' in (viewItem || {}) ? (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tindakan Disiplin</span>
                  <span className={styles.detailValue}>{viewItem?.tindakan || '-'}</span>
                </div>
              ) : (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tingkat</span>
                  <span className={styles.detailValue}>{viewItem?.tingkat || '-'}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>
                  {renderStatusPill(viewItem?.status, viewItem?.status === 'Selesai' ? 'success' : viewItem?.status === 'Proses' ? 'warning' : 'neutral')}
                </span>
              </div>
              {viewItem?.tanggal_selesai && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tanggal Penyelesaian</span>
                  <span className={styles.detailValue}>{formatDateToIndonesian(viewItem.tanggal_selesai)}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Uraian</span>
                <span className={styles.detailValue}>{viewItem?.uraian || '-'}</span>
              </div>
              {viewItem?.catatan && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Catatan</span>
                  <span className={styles.detailValue}>{viewItem?.catatan}</span>
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
              <Button variant="danger" onClick={() => setViewOpen(false)}>
                Tutup
              </Button>
              <a href={pdfUrl} download={viewItem?.file_name || 'dokumen.pdf'} style={{ textDecoration: 'none' }}>
                <Button variant="primary" icon={<MdDownload />} iconPosition="left" disabled={!pdfUrl}>
                  Download
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default EtikDisiplin;
