import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Banner from '../../../components/banner/Banner';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import Tabs from '../../../components/tabs/Tabs';
import { MdVisibility, MdAdd, MdCloudUpload, MdSave, MdDelete, MdDownload } from 'react-icons/md';
import { authenticatedFetch, isAuthenticated } from '../../../utils/auth';
import { formatDateToIndonesian } from '../../../utils/dateFormatter';
import styles from './DokumenLegalitas.module.css';

const tabs = [
  { key: 'Surat Keterangan', label: 'Surat Keterangan' },
  { key: 'STR', label: 'STR' },
  { key: 'SIP', label: 'SIP' }
];

const EMPTY_FORM = {
  nomor_sk: '',
  tanggal_lulus: '',
  berlaku_sampai: '',
  file: null
};

const getStatusVariant = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aktif') return 'success';
  if (normalized === 'segera habis') return 'warning';
  if (normalized === 'sudah habis' || normalized === 'habis') return 'danger';
  return 'secondary';
};

const getDocumentStatus = (berlakuSampai) => {
  if (!berlakuSampai) return 'Tidak Ada Data';
  
  const today = new Date();
  const expiryDate = new Date(berlakuSampai);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Sudah Habis';
  if (diffDays <= 30) return 'Segera Habis';
  return 'Aktif';
};

const DokumenLegalitas = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Surat Keterangan');
  const [banner, setBanner] = useState({ message: '', variant: '' });
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [dataByTab, setDataByTab] = useState({
    'Surat Keterangan': [],
    'STR': [],
    'SIP': []
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formDataByTab, setFormDataByTab] = useState({
    'Surat Keterangan': { ...EMPTY_FORM },
    'STR': { ...EMPTY_FORM },
    'SIP': { ...EMPTY_FORM }
  });
  const fileInputRef = useRef(null);

  const formData = formDataByTab[activeTab];
  const items = dataByTab[activeTab] || [];

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
      const response = await authenticatedFetch('/api/dokumen-legalitas');
      const data = await response.json();

      if (response.ok && data.success) {
        setDataByTab(data.data);
      }
    } catch (error) {
      setBanner({ message: 'Gagal memuat dokumen', variant: 'error' });
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

  const handleTabChange = (key) => {
    setActiveTab(key);
    setDeleteMode(false);
    setDeleteTargets([]);
    setShowDeleteModal(false);
  };

  const handleViewClick = async (item) => {
    setSelectedItem(item);
    setLoadingPdf(true);
    setShowViewModal(true);

    try {
      const response = await authenticatedFetch(`/api/dokumen-legalitas/${item.id}`);
      
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

  const handleDownload = async (item) => {
    try {
      const response = await authenticatedFetch(`/api/dokumen-legalitas/${item.id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.jenis_dokumen}_${item.nomor_sk || 'dokumen'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setBanner({ message: 'Gagal mendownload dokumen', variant: 'error' });
      }
    } catch (error) {
      setBanner({ message: 'Terjadi kesalahan saat mendownload dokumen', variant: 'error' });
    }
  };

  const handleAddClick = () => {
    setFormDataByTab(prev => ({
      ...prev,
      [activeTab]: { ...EMPTY_FORM }
    }));
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormDataByTab(prev => ({
      ...prev,
      [activeTab]: { ...EMPTY_FORM }
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormDataByTab(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [name]: value
      }
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
      setBanner({ message: 'Hanya file PDF yang diperbolehkan', variant: 'error' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setBanner({ message: 'Ukuran file maksimal 10MB', variant: 'error' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }

    setFormDataByTab(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        file
      }
    }));
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate based on document type
    if (!formData.nomor_sk || !formData.file) {
      setBanner({ message: 'Nomor dokumen dan file harus diisi', variant: 'warning' });
      return;
    }

    // For STR & Surat Keterangan: tanggal_lulus required
    if ((activeTab === 'STR' || activeTab === 'Surat Keterangan') && !formData.tanggal_lulus) {
      setBanner({ message: 'Tanggal lulus harus diisi', variant: 'warning' });
      return;
    }

    // For SIP: berlaku_sampai required
    if (activeTab === 'SIP' && !formData.berlaku_sampai) {
      setBanner({ message: 'Berlaku sampai harus diisi', variant: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData = new FormData();
      submitData.append('jenis_dokumen', activeTab);
      submitData.append('nomor_sk', formData.nomor_sk);
      submitData.append('file', formData.file);

      if (activeTab === 'STR' || activeTab === 'Surat Keterangan') {
        submitData.append('tanggal_lulus', formData.tanggal_lulus);
      } else if (activeTab === 'SIP') {
        submitData.append('berlaku_sampai', formData.berlaku_sampai);
      }

      const response = await authenticatedFetch('/api/dokumen-legalitas', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBanner({ message: 'Dokumen berhasil ditambahkan', variant: 'success' });
        handleCloseAddModal();
        await fetchData();
      } else {
        if (data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          throw new Error(`Validation errors:\n${errorMessages}`);
        }
        throw new Error(data.message || data.error || 'Gagal menambahkan dokumen');
      }
    } catch (error) {
      setBanner({ message: error.message || 'Gagal menambahkan dokumen', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteButtonClick = () => {
    if (!deleteMode) {
      setDeleteMode(true);
      setDeleteTargets([]);
      return;
    }

    if (deleteTargets.length) {
      setShowDeleteModal(true);
      return;
    }

    setDeleteMode(false);
    setDeleteTargets([]);
  };

  const handleCancelDelete = () => {
    setDeleteMode(false);
    setDeleteTargets([]);
    setShowDeleteModal(false);
  };

  const handleSelectForDelete = (item) => {
    if (!deleteMode) return;

    setDeleteTargets((prev) => {
      const exists = prev.find((entry) => entry === item.id);
      if (exists) {
        return prev.filter((entry) => entry !== item.id);
      }
      return [...prev, item.id];
    });
  };

  const handleDeleteConfirmed = async () => {
    try {
      // Delete each document
      for (const id of deleteTargets) {
        const response = await authenticatedFetch(`/api/dokumen-legalitas/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Gagal menghapus dokumen');
        }
      }

      setBanner({ message: 'Dokumen berhasil dihapus', variant: 'success' });
      setShowDeleteModal(false);
      setDeleteMode(false);
      setDeleteTargets([]);
      await fetchData();
    } catch (error) {
      setBanner({ message: error.message || 'Gagal menghapus dokumen', variant: 'error' });
    }
  };

  return (
    <MainLayout>
      <Banner message={banner.message} variant={banner.variant} autoRefresh={banner.variant === 'success'} />
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dokumen Legalitas</h1>
        <p className={styles.pageSubtitle}>Kelola dokumen legalitas: Surat Keterangan, STR, dan SIP</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />

          <div className={styles.headerRow}>
            <h3 className={styles.sectionTitle}>
              Daftar Dokumen {activeTab}
            </h3>
            <div className={styles.actionButtons}>
              <Button variant="success" size="small" icon={<MdAdd />} iconPosition="left" onClick={handleAddClick}>
                Tambah
              </Button>
              <Button variant="danger" size="small" icon={<MdDelete />} onClick={handleDeleteButtonClick}>
                {deleteMode
                  ? deleteTargets.length
                    ? `Hapus (${deleteTargets.length})`
                    : 'Batal'
                  : 'Hapus'}
              </Button>
            </div>
          </div>

          {deleteMode && (
            <p className={styles.deleteNotice}>Pilih satu atau lebih dokumen untuk dihapus, lalu klik Hapus.</p>
          )}

          {loading ? (
            <div className={styles.loadingState}>Memuat data...</div>
          ) : (
            <div className={styles.list}>
              {items.length === 0 && (
                <p className={styles.emptyText}>Belum ada dokumen {activeTab}.</p>
              )}

              {items.map((item) => {
                const status = activeTab === 'SIP' ? getDocumentStatus(item.berlaku_sampai) : null;
                
                return (
                  <Card
                    key={item.id}
                    className={`${styles.itemCard} ${deleteMode ? styles.deleteSelectable : ''} ${
                      deleteTargets.includes(item.id) ? styles.deleteSelected : ''
                    }`}
                    shadow={false}
                    onClick={() => handleSelectForDelete(item)}
                  >
                    <div className={styles.itemContent}>
                      <div className={styles.itemDetails}>
                        <div className={styles.itemHeader}>
                          <h4 className={styles.itemTitle}>{item.nomor_sk || 'Nomor tidak tersedia'}</h4>
                        </div>
                        <div className={styles.itemMeta}>
                          {activeTab === 'STR' ? (
                            <>
                              <span>Tanggal Lulus: {item.tanggal_lulus ? formatDateToIndonesian(item.tanggal_lulus) : '-'}</span>
                            </>
                          ) : activeTab === 'Surat Keterangan' ? (
                            <>
                              <span>Mulai Dari: {item.tanggal_lulus ? formatDateToIndonesian(item.tanggal_lulus) : '-'}</span>
                            </>
                          ) : (
                            <>
                              <span>Tanggal Upload: {item.tanggal_lulus ? formatDateToIndonesian(item.tanggal_lulus) : '-'}</span>
                              <span>Berlaku Sampai: {item.berlaku_sampai ? formatDateToIndonesian(item.berlaku_sampai) : '-'}</span>
                            </>
                          )}
                        </div>
                        <div className={styles.fileBlock}>
                          <span className={styles.fileLabel}>File:</span>
                          <span className={styles.fileLink}>{item.file_path ? item.file_path.split('/').pop() : '-'}</span>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        {status && (
                          <Button
                            variant={getStatusVariant(status)}
                            size="small"
                            disabled
                          >
                            {status}
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="small"
                          icon={<MdVisibility />}
                          iconPosition="left"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewClick(item);
                          }}
                        >
                          Lihat
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        title={`Detail Dokumen ${selectedItem?.jenis_dokumen || ''}`}
        className={styles.viewModal}
      >
        <div className={styles.viewDetail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Nomor Dokumen</span>
              <span className={styles.detailValue}>{selectedItem?.nomor_sk || '-'}</span>
            </div>
            {selectedItem?.jenis_dokumen === 'STR' ? (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tanggal Lulus</span>
                <span className={styles.detailValue}>
                  {selectedItem?.tanggal_lulus ? formatDateToIndonesian(selectedItem.tanggal_lulus) : '-'}
                </span>
              </div>
            ) : selectedItem?.jenis_dokumen === 'Surat Keterangan' ? (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mulai Dari</span>
                <span className={styles.detailValue}>
                  {selectedItem?.tanggal_lulus ? formatDateToIndonesian(selectedItem.tanggal_lulus) : '-'}
                </span>
              </div>
            ) : (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tanggal Upload</span>
                  <span className={styles.detailValue}>
                    {selectedItem?.tanggal_lulus ? formatDateToIndonesian(selectedItem.tanggal_lulus) : '-'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Berlaku Sampai</span>
                  <span className={styles.detailValue}>
                    {selectedItem?.berlaku_sampai ? formatDateToIndonesian(selectedItem.berlaku_sampai) : '-'}
                  </span>
                </div>
              </>
            )}
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
              onClick={() => selectedItem && handleDownload(selectedItem)}
              disabled={!selectedItem?.id || loadingPdf}
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
        title={`Tambah Dokumen ${activeTab}`}
        padding="normal"
        size="medium"
      >
        <Form onSubmit={handleSubmit} className={styles.modalContent}>
          <Input
            label="Nomor Surat/Dokumen"
            name="nomor_sk"
            value={formData.nomor_sk}
            onChange={handleInputChange}
            placeholder="Masukkan nomor surat/dokumen"
            required
          />
          
          {activeTab === 'STR' && (
            <Input
              label="Tanggal Lulus"
              name="tanggal_lulus"
              type="date"
              value={formData.tanggal_lulus}
              onChange={handleInputChange}
              required
            />
          )}

          {activeTab === 'Surat Keterangan' && (
            <Input
              label="Mulai Dari"
              name="tanggal_lulus"
              type="date"
              value={formData.tanggal_lulus}
              onChange={handleInputChange}
              required
            />
          )}

          {activeTab === 'SIP' && (
            <Input
              label="Berlaku Sampai"
              name="berlaku_sampai"
              type="date"
              value={formData.berlaku_sampai}
              onChange={handleInputChange}
              required
            />
          )}

          <div
            className={styles['upload-drop']}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <MdCloudUpload size={48} />
            <p>Pilih atau seret file ke sini</p>
            <span className={styles['upload-hint']}>PDF, maks 10MB</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
              required
            />
            <Button variant="outline" icon={<MdCloudUpload />} onClick={handleChooseFile} type="button">
              Pilih File
            </Button>
            {formData.file && <div className={styles['upload-file-name']}>{formData.file.name}</div>}
          </div>

          <Form.Actions align="right" className={styles.modalActions}>
            <Button type="button" variant="outline" onClick={handleCloseAddModal}>
              Batal
            </Button>
            <Button type="submit" variant="success" icon={<MdSave />} disabled={isSubmitting || !formData.nomor_sk || !formData.file}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </Form.Actions>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Konfirmasi Hapus"
      >
        <div className={styles['delete-confirmation']}>
          <p>Apakah Anda yakin ingin menghapus {deleteTargets.length} dokumen yang dipilih?</p>
          <p className={styles['warning-text']}>Tindakan ini tidak dapat dibatalkan.</p>
          
          <div className={styles['modal-actions']}>
            <Button variant="outline" onClick={handleCancelDelete}>
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

export default DokumenLegalitas;
