import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import Tabs from '../../components/tabs/Tabs';
import { MdVisibility, MdAdd, MdCloudUpload, MdSave, MdDownload } from 'react-icons/md';
import { authenticatedFetch, isAuthenticated } from '../../utils/auth';
import styles from './PrestasiPenghargaan.module.css';

const tabs = [
  { key: 'prestasi', label: 'Prestasi' },
  { key: 'penghargaan', label: 'Penghargaan' }
];

const JENIS_MAPPING = {
  'prestasi': 'Prestasi',
  'penghargaan': 'Penghargaan'
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
    penghargaan: []
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    judul: '',
    penyelenggara: '',
    tahun: '',
    file: null
  });
  const fileInputRef = useRef(null);

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
          penghargaan: data.data['Penghargaan'] || []
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
      const response = await authenticatedFetch(`/api/prestasi-penghargaan/${item.id}/file`);
      
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
    setFormData({
      judul: '',
      penyelenggara: '',
      tahun: '',
      file: null
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({
      judul: '',
      penyelenggara: '',
      tahun: '',
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
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Hanya file PDF yang diperbolehkan');
        e.target.value = '';
        return;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Ukuran file maksimal 5MB');
        e.target.value = '';
        return;
      }

      setFormData(prev => ({
        ...prev,
        file: file
      }));
    }
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
        throw new Error(data.message || 'Gagal menambahkan data');
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
        <h1 className={styles.pageTitle}>Prestasi & Penghargaan</h1>
        <p className={styles.pageSubtitle}>Kelola prestasi dan penghargaan yang pernah diraih</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />

          <div className={styles.headerRow}>
            <h3 className={styles.sectionTitle}>
              {activeTab === 'prestasi' ? 'Daftar Prestasi' : 'Daftar Penghargaan'}
            </h3>
            <div className={styles.actionButtons}>
              <Button variant="success" size="small" icon={<MdAdd />} iconPosition="left" onClick={handleAddClick}>
                Tambah
              </Button>
              <Button variant="danger" size="small" onClick={handleDeleteButtonClick}>
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
      >
        <Form onSubmit={handleSubmit}>
          <Input
            label="Judul"
            name="judul"
            value={formData.judul}
            onChange={handleInputChange}
            placeholder={`Masukkan judul ${activeTab}`}
            required
          />
          
          <Input
            label="Penyelenggara"
            name="penyelenggara"
            value={formData.penyelenggara}
            onChange={handleInputChange}
            placeholder="Masukkan nama penyelenggara"
            required
          />
          
          <Input
            label="Tahun"
            name="tahun"
            type="number"
            value={formData.tahun}
            onChange={handleInputChange}
            placeholder="Contoh: 2024"
            min="1900"
            max={new Date().getFullYear()}
            required
          />

          <div className={styles['file-input-wrapper']}>
            <label className={styles['file-label']}>
              Upload Dokumen (PDF) <span className={styles.required}>*</span>
            </label>
            <div className={styles['file-input-container']}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className={styles['file-input']}
                required
              />
              <div className={styles['file-input-display']}>
                <MdCloudUpload size={24} />
                <span>{formData.file ? formData.file.name : 'Pilih file PDF (Maks 5MB)'}</span>
              </div>
            </div>
          </div>

          <div className={styles['modal-actions']}>
            <Button type="button" variant="secondary" onClick={handleCloseAddModal}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={<MdSave />} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
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
