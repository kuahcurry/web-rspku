import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import Tabs from '../../../components/tabs/Tabs';
import { MdVisibility, MdAdd, MdCloudUpload, MdSave, MdDownload, MdDelete } from 'react-icons/md';
import { authenticatedFetch, isAuthenticated } from '../../../utils/auth';
import styles from './PrestasiPenghargaan.module.css';

const tabs = [
  { key: 'prestasi', label: 'Prestasi' },
  { key: 'penghargaan', label: 'Penghargaan' },
  { key: 'kompetensi', label: 'Kompetensi Utama' }
];

const JENIS_MAPPING = {
  'prestasi': 'Prestasi',
  'penghargaan': 'Penghargaan',
  'kompetensi': 'Kompetensi Utama'
};

const EMPTY_FORM = {
  judul: '',
  penyelenggara: '',
  tahun: '',
  file: null
};

const PrestasiPenghargaan = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('prestasi');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [dataByTab, setDataByTab] = useState({
    prestasi: [],
    penghargaan: [],
    kompetensi: []
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formDataByTab, setFormDataByTab] = useState({
    prestasi: { ...EMPTY_FORM },
    penghargaan: { ...EMPTY_FORM },
    kompetensi: { ...EMPTY_FORM }
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
      const response = await authenticatedFetch('/api/prestasi-penghargaan');
      const data = await response.json();

      if (response.ok && data.success) {
        setDataByTab({
          prestasi: data.data['Prestasi'] || [],
          penghargaan: data.data['Penghargaan'] || [],
          kompetensi: data.data['Kompetensi Utama'] || []
        });
      }
    } catch (error) {
      console.error('Error fetching achievement records:', error);
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
      const response = await authenticatedFetch(`/api/prestasi-penghargaan/${item.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error fetching PDF:', error);
      alert('Gagal memuat dokumen');
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
    const fieldName = name === 'nama' ? 'judul' : name;
    const nextValue = fieldName === 'tahun'
      ? (value || '').replace(/\D/g, '').slice(0, 4)
      : value;

    setFormDataByTab(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [fieldName]: nextValue
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
      alert('Hanya file PDF yang diperbolehkan');
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Ukuran file maksimal 5MB');
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
    
    if (!formData.judul || !formData.penyelenggara || !formData.tahun || !formData.file) {
      alert('Semua field harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData = new FormData();
      submitData.append('judul', formData.judul);
      submitData.append('penyelenggara', formData.penyelenggara);
      submitData.append('tahun', formData.tahun);
      submitData.append('jenis', JENIS_MAPPING[activeTab]);
      submitData.append('file', formData.file);

      // Debug log
      console.log('Submitting data:', {
        judul: formData.judul,
        penyelenggara: formData.penyelenggara,
        tahun: formData.tahun,
        jenis: JENIS_MAPPING[activeTab],
        file: formData.file?.name
      });

      const response = await authenticatedFetch('/api/prestasi-penghargaan', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Data berhasil ditambahkan');
        handleCloseAddModal();
        fetchData();
      } else {
        // Log validation errors for debugging
        console.error('Server response:', data);
        if (data.errors) {
          console.error('Validation errors:', data.errors);
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          throw new Error(`Validation errors:\n${errorMessages}`);
        }
        throw new Error(data.message || data.error || 'Gagal menambahkan data');
      }
    } catch (error) {
      console.error('Error adding achievement:', error);
      alert(error.message || 'Gagal menambahkan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      const response = await authenticatedFetch(`/api/prestasi-penghargaan/${item.id}/file`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.judul}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Gagal mengunduh file');
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
      const response = await authenticatedFetch('/api/prestasi-penghargaan/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: deleteTargets })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Data berhasil dihapus');
        setShowDeleteModal(false);
        setDeleteMode(false);
        setDeleteTargets([]);
        fetchData();
      } else {
        throw new Error(data.message || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting achievements:', error);
      alert(error.message || 'Gagal menghapus data');
    }
  };

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Prestasi, Penghargaan & Kompetensi</h1>
        <p className={styles.pageSubtitle}>Kelola prestasi, penghargaan, dan kompetensi yang pernah diraih</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />

          <div className={styles.headerRow}>
            <h3 className={styles.sectionTitle}>
              {activeTab === 'prestasi' ? 'Daftar Prestasi' : activeTab === 'penghargaan' ? 'Daftar Penghargaan' : 'Daftar Kompetensi Utama'}
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
            <p className={styles.deleteNotice}>Pilih satu atau lebih data untuk dihapus, lalu klik Hapus.</p>
          )}

          {loading ? (
            <div className={styles.loadingState}>Memuat data...</div>
          ) : (
            <div className={styles.list}>
              {items.length === 0 && (
                <p className={styles.emptyText}>Belum ada data {JENIS_MAPPING[activeTab]}.</p>
              )}

              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`${styles.itemCard} ${deleteMode ? styles.deleteSelectable : ''} ${
                    deleteTargets.includes(item.id) ? styles.deleteSelected : ''
                  }`}
                  shadow={false}
                  onClick={() => handleSelectForDelete(item)}
                >
                  <div className={styles.itemContent}>
                    <div>
                      <h4 className={styles.itemTitle}>{item.judul}</h4>
                      <p className={styles.itemMeta}>{item.penyelenggara}</p>
                      <p className={styles.itemMeta}>Tahun: {item.tahun || '-'}</p>
                    </div>
                    <div className={styles.fileBlock}>
                      <span className={styles.fileLabel}>File</span>
                      <span className={styles.fileLink}>{item.file_name || item.nama_file || 'Dokumen terlampir'}</span>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="outline"
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
                      <Button
                        variant="secondary"
                        size="small"
                        icon={<MdDownload />}
                        iconPosition="left"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                      >
                        Unduh
                      </Button>
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
        title={selectedItem?.judul || 'Detail Dokumen'}
        size="large"
      >
        <div className={styles['modal-content']}>
          {loadingPdf ? (
            <div className={styles['loading-pdf']}>Memuat dokumen...</div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className={styles['pdf-viewer']}
              title="PDF Viewer"
            />
          ) : (
            <div className={styles['error-pdf']}>Gagal memuat dokumen</div>
          )}
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title={`Tambah ${JENIS_MAPPING[activeTab]}`}
        padding="normal"
        size="medium"
      >
        <Form onSubmit={handleSubmit} className={styles.modalContent}>
          <Input
            label={activeTab === 'prestasi' ? 'Nama Prestasi' : activeTab === 'penghargaan' ? 'Nama Penghargaan' : 'Nama Kompetensi'}
            name="judul"
            value={formData.judul}
            onChange={handleInputChange}
            placeholder={
              activeTab === 'prestasi'
                ? 'Contoh: Juara 1 Lomba Inovasi Pelayanan Publik'
                : activeTab === 'penghargaan'
                ? 'Contoh: Penghargaan Tenaga Kesehatan Teladan'
                : 'Contoh: Sertifikasi ACLS (Advanced Cardiovascular Life Support)'
            }
            required
          />
          
          <Input
            label="Penyelenggara"
            name="penyelenggara"
            value={formData.penyelenggara}
            onChange={handleInputChange}
            placeholder="Contoh: Kementerian Kesehatan"
            required
          />
          
          <Input
            label="Tahun"
            name="tahun"
            type="text"
            value={formData.tahun}
            onChange={handleInputChange}
            placeholder="Contoh: 2024"
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
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
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
            <Button type="submit" variant="success" icon={<MdSave />} disabled={isSubmitting || !formData.judul || !formData.penyelenggara || !formData.tahun || !formData.file}>
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
          <p>Apakah Anda yakin ingin menghapus {deleteTargets.length} data yang dipilih?</p>
          <p className={styles['warning-text']}>Tindakan ini tidak dapat dibatalkan.</p>
          
          <div className={styles['modal-actions']}>
            <Button variant="secondary" onClick={handleCancelDelete}>
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

export default PrestasiPenghargaan;
