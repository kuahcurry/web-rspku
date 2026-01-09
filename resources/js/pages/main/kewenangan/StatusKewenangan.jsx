import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import Tabs from '../../../components/tabs/Tabs';
import Banner from '../../../components/banner/Banner';
import { MdVisibility, MdAdd, MdCloudUpload, MdSave, MdDownload, MdDelete } from 'react-icons/md';
import { authenticatedFetch, isAuthenticated } from '../../../utils/auth';
import { formatDateToIndonesian } from '../../../utils/dateFormatter';
import styles from './StatusKewenangan.module.css';

const JENIS_MAPPING = {
  'spk': 'SPK',
  'rkk': 'RKK'
};

const StatusKewenangan = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('spk');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [banner, setBanner] = useState({ message: '', variant: '' });
  const [dataByTab, setDataByTab] = useState({
    spk: [],
    rkk: []
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState('spk');
  const [formData, setFormData] = useState({
    nomor_dokumen: '',
    tanggal_terbit: '',
    masa_berlaku: '',
    status: 'Aktif',
    file: null
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/status-kewenangan');
      const data = await response.json();

      if (response.ok && data.success) {
        setDataByTab({
          spk: data.data['SPK'] || [],
          rkk: data.data['RKK'] || []
        });
      }
    } catch (error) {
      setBanner({ message: 'Gagal memuat data', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup PDF URL
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleViewClick = async (item) => {
    setSelectedItem(item);
    setLoadingPdf(true);
    setShowViewModal(true);

    try {
      const response = await authenticatedFetch(`/api/status-kewenangan/${item.id}/file`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      setBanner({ message: 'Gagal memuat dokumen', variant: 'error' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedItem(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handleAddClick = () => {
    setSelectedJenis(activeTab);
    setFormData({
      nomor_dokumen: '',
      tanggal_terbit: '',
      masa_berlaku: '',
      status: 'Aktif',
      file: null
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedJenis('spk');
    setFormData({
      nomor_dokumen: '',
      tanggal_terbit: '',
      masa_berlaku: '',
      status: 'Aktif',
      file: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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
      setBanner({ message: 'Hanya file PDF yang diperbolehkan', variant: 'warning' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setBanner({ message: 'Ukuran file maksimal 5MB', variant: 'warning' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }

    setFormData(prev => ({
      ...prev,
      file: file
    }));
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nomor_dokumen || !formData.tanggal_terbit || !formData.masa_berlaku || !formData.file) {
      setBanner({ message: 'Semua field harus diisi', variant: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData = new FormData();
      submitData.append('nomor_dokumen', formData.nomor_dokumen);
      submitData.append('tanggal_terbit', formData.tanggal_terbit);
      submitData.append('masa_berlaku', formData.masa_berlaku);
      submitData.append('status', formData.status);
      submitData.append('jenis', JENIS_MAPPING[selectedJenis]);
      submitData.append('file', formData.file);

      const response = await authenticatedFetch('/api/status-kewenangan', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBanner({ message: 'Data berhasil ditambahkan', variant: 'success' });
        handleCloseAddModal();
      } else {
        throw new Error(data.message || 'Gagal menambahkan data');
      }
    } catch (error) {
      setBanner({ message: error.message || 'Gagal menambahkan data', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCheckbox = (id) => {
    setDeleteTargets(prev => {
      if (prev.includes(id)) {
        return prev.filter(targetId => targetId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTargets.length === 0) {
      setBanner({ message: 'Pilih minimal satu item untuk dihapus', variant: 'warning' });
      return;
    }
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const response = await authenticatedFetch('/api/status-kewenangan/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: deleteTargets })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBanner({ message: 'Data berhasil dihapus', variant: 'success' });
        setShowDeleteModal(false);
        setDeleteMode(false);
        setDeleteTargets([]);
      } else {
        throw new Error(data.message || 'Failed to delete authorities');
      }
    } catch (error) {
      setBanner({ message: error.message || 'Gagal menghapus data', variant: 'error' });
    }
  };

  const getStatusVariant = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'aktif') return 'success';
    if (normalized === 'segera habis') return 'warning';
    if (normalized === 'tidak aktif' || normalized === 'habis') return 'danger';
    return 'secondary';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setDeleteMode(false);
    setDeleteTargets([]);
  };

  const currentTabItems = activeTab === 'spk' ? dataByTab.spk : dataByTab.rkk;

  return (
    <MainLayout>
      <Banner message={banner.message} variant={banner.variant} autoRefresh={banner.variant === 'success'} />
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Status Kewenangan Klinis</h1>
        <p className={styles.pageSubtitle}>Preview dokumen SPK dan RKK kewenangan klinis</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          {/* Tab Navigation */}
          <Tabs
            tabs={[
              { key: 'spk', label: `SPK` },
              { key: 'rkk', label: `RKK` }
            ]}
            activeKey={activeTab}
            onChange={handleTabChange}
          />

          <div className={styles.headerRow}>
            <h3 className={styles.sectionTitle}>
              {activeTab === 'spk' ? 'SPK (Surat Penugasan Klinis)' : 'RKK (Rincian Kewenangan Klinis)'}
            </h3>
            <div className={styles.actionButtons}>
              <Button
                variant="success"
                size="small"
                icon={<MdAdd />}
                iconPosition="left"
                onClick={handleAddClick}
              >
                Tambah {JENIS_MAPPING[activeTab]}
              </Button>
              <Button
                variant="danger"
                size="small"
                icon={<MdDelete />}
                onClick={() => {
                  if (!deleteMode) {
                    setDeleteMode(true);
                    setDeleteTargets([]);
                    return;
                  }
                  if (deleteTargets.length > 0) {
                    handleConfirmDelete();
                    return;
                  }
                  setDeleteMode(false);
                }}
              >
                {deleteMode
                  ? deleteTargets.length
                    ? `Hapus (${deleteTargets.length})`
                    : 'Batal'
                  : 'Hapus'}
              </Button>
            </div>
          </div>

          {deleteMode && (
            <p className={styles.deleteNotice}>
              Pilih satu atau lebih dokumen untuk dihapus, lalu klik Hapus.
            </p>
          )}

          {loading ? (
            <div className={styles.loadingState}>Memuat data...</div>
          ) : (
            <div className={styles.list}>
              {currentTabItems.length === 0 && (
                <p className={styles.emptyText}>Belum ada data {JENIS_MAPPING[activeTab]}.</p>
              )}
              {currentTabItems.map((item) => (
                <Card
                  key={item.id}
                  className={`${styles.itemCard} ${deleteMode ? styles.deleteSelectable : ''} ${
                    deleteTargets.includes(item.id) ? styles.deleteSelected : ''
                  }`}
                  shadow={false}
                  onClick={() => {
                    if (deleteMode) {
                      handleDeleteCheckbox(item.id);
                    }
                  }}
                >
                  <div className={styles.itemContent}>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemTitle}>{item.nomor_dokumen || 'Tanpa nomor dokumen'}</h4>
                      <div className={styles.itemMetaGrid}>
                        <div className={styles.itemMetaGroup}>
                          <span className={styles.itemMetaLabel}>Tanggal Mulai</span>
                          <span className={styles.itemMetaValue}>
                            {item.tanggal_terbit ? formatDateToIndonesian(item.tanggal_terbit) : '-'}
                          </span>
                        </div>
                        <div className={`${styles.itemMetaGroup} ${styles.itemMetaCenter}`}>
                          <span className={styles.itemMetaLabel}>Berlaku Sampai</span>
                          <span className={styles.itemMetaValue}>
                            {item.masa_berlaku ? formatDateToIndonesian(item.masa_berlaku) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemAside}>
                      <div className={styles.fileBlock}>
                        <Button variant={getStatusVariant(item.status)} size="small" disabled>
                          {item.status || '-'}
                        </Button>
                      </div>
                      <div className={styles.actions}>
                        <Button
                          variant="primary"
                          icon={<MdVisibility />}
                          iconPosition="left"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewClick(item);
                          }}
                        >
                          Lihat
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        title={selectedItem?.nomor_dokumen || 'Detail Dokumen'}
        className={styles.viewModal}
      >
        <div className={styles.viewDetail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Nomor Dokumen</span>
              <span className={styles.detailValue}>{selectedItem?.nomor_dokumen || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tanggal Mulai</span>
              <span className={styles.detailValue}>{selectedItem?.tanggal_terbit ? formatDateToIndonesian(selectedItem.tanggal_terbit) : '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Berlaku Sampai</span>
              <span className={styles.detailValue}>{selectedItem?.masa_berlaku ? formatDateToIndonesian(selectedItem.masa_berlaku) : '-'}</span>
            </div>
          </div>

          <div className={styles.pdfPreview}>
            {loadingPdf ? (
              <div className={styles.pdfEmpty}>Memuat dokumen...</div>
            ) : pdfUrl ? (
              <iframe src={pdfUrl} className={styles.pdfFrame} title="PDF Viewer" />
            ) : (
              <div className={styles.pdfEmpty}>Dokumen tidak tersedia.</div>
            )}
          </div>

          <div className={styles.modalActions}>
            <Button variant="danger" onClick={handleCloseViewModal}>
              Tutup
            </Button>
            <Button
              variant="primary"
              icon={<MdDownload />}
              iconPosition="left"
              onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
              disabled={!pdfUrl}
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title={`Tambah ${JENIS_MAPPING[selectedJenis]}`}
        padding="normal"
        size="medium"
      >
        <Form onSubmit={handleSubmit} className={styles.modalContent}>
        <div className={styles['form-group']}>
          <label className={styles['form-label']}>
            Jenis Dokumen <span className={styles.required}>*</span>
          </label>
          <div className={styles.readonlyField}>
            {selectedJenis === 'spk'
              ? 'SPK (Surat Penugasan Klinis)'
              : 'RKK (Rincian Kewenangan Klinis)'}
          </div>
        </div>

        <Input
          label="Nomor Dokumen"
          name="nomor_dokumen"
          value={formData.nomor_dokumen}
          onChange={handleInputChange}
            placeholder="Masukkan nomor dokumen"
            required
          />
          
          <Input
            label="Tanggal Mulai"
            name="tanggal_terbit"
            type="date"
            value={formData.tanggal_terbit}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Berlaku Sampai"
            name="masa_berlaku"
            type="date"
            value={formData.masa_berlaku}
            onChange={handleInputChange}
            required
          />

          <div
            className={styles['upload-drop']}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <MdCloudUpload size={48} />
            <p>Pilih atau seret file ke sini</p>
            <span className={styles['upload-hint']}>PDF, maks 5MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              required
            />
            <Button variant="outline" icon={<MdCloudUpload />} onClick={handleChooseFile}>
              Pilih File
            </Button>
            {formData.file && <div className={styles['upload-file-name']}>{formData.file.name}</div>}
          </div>
          
          <Form.Actions align="right" className={styles.modalActions}>
            <Button type="button" variant="danger" onClick={handleCloseAddModal}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="success"
              icon={<MdSave />}
              disabled={isSubmitting || !formData.nomor_dokumen || !formData.tanggal_terbit || !formData.masa_berlaku || !formData.file}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </Form.Actions>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
        padding="normal"
      >
        <div className={styles['delete-confirmation']}>
          <p>Apakah Anda yakin ingin menghapus {deleteTargets.length} data yang dipilih?</p>
          <p className={styles['warning-text']}>Tindakan ini tidak dapat dibatalkan.</p>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default StatusKewenangan;
