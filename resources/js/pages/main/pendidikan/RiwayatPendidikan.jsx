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
import { isAuthenticated, authenticatedFetch } from '../../../utils/auth';
import { cachedFetch } from '../../../services/apiService';
import { cacheConfig } from '../../../utils/cache';
import styles from './RiwayatPendidikan.module.css';

const tabs = [
  { key: 'ijazah', label: 'Ijazah' },
  { key: 'pelatihan', label: 'Sertifikat Pelatihan' },
  { key: 'workshop', label: 'Sertifikat Workshop / In-House Training' }
];

const JENIS_MAPPING = {
  'ijazah': 'Ijazah',
  'pelatihan': 'Sertifikat Pelatihan',
  'workshop': 'Sertifikat Workshop'
};

const RiwayatPendidikan = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ijazah');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [dataByTab, setDataByTab] = useState({
    ijazah: [],
    pelatihan: [],
    workshop: []
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState({ message: '', type: '' });
  const [formData, setFormData] = useState({
    judul: '',
    institusi: '',
    tahun_lulus: '',
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
      const response = await cachedFetch('/api/riwayat-pendidikan', {}, cacheConfig.TTL.LONG);
      const data = await response.json();

      if (response.ok && data.success) {
        setDataByTab({
          ijazah: data.data['Ijazah'] || [],
          pelatihan: data.data['Sertifikat Pelatihan'] || [],
          workshop: data.data['Sertifikat Workshop'] || []
        });
      }
    } catch (error) {
      console.error('Error fetching education records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss banner after 5 seconds
  useEffect(() => {
    if (banner.message) {
      const timer = setTimeout(() => {
        setBanner({ message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

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
    console.log('Viewing item:', item); // Debug log
    setSelectedItem(item);
    setShowViewModal(true);
    setLoadingPdf(true);
    setPdfUrl(null);

    try {
      console.log('Fetching PDF from:', `/api/riwayat-pendidikan/${item.id}`); // Debug log
      const response = await authenticatedFetch(`/api/riwayat-pendidikan/${item.id}`);
      
      console.log('Response status:', response.status, 'OK:', response.ok); // Debug log
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('Blob size:', blob.size, 'Type:', blob.type); // Debug log
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        setBanner({ message: 'Gagal memuat dokumen', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      setBanner({ message: 'Terjadi kesalahan saat memuat dokumen', type: 'error' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleAddClick = () => {
    setFormData({ judul: '', institusi: '', tahun_lulus: '', file: null });
    setShowAddModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;
    if (file.type === 'application/pdf') {
      if (file.size <= 5 * 1024 * 1024) { // 5MB limit
        setFormData({ ...formData, file });
      } else {
        setBanner({ message: 'File terlalu besar. Maksimal 5MB', type: 'error' });
      }
    } else {
      setBanner({ message: 'Hanya file PDF yang diperbolehkan', type: 'error' });
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      
      // Delete each item individually using REST endpoint
      let successCount = 0;
      for (const id of idsToDelete) {
        const response = await authenticatedFetch(`/api/riwayat-pendidikan/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) successCount++;
      }

      if (successCount > 0) {
        setBanner({ message: `${successCount} data berhasil dihapus`, type: 'success' });
        
        // Update local state
        setDataByTab((prev) => ({
          ...prev,
          [activeTab]: prev[activeTab].filter((item) => !idsToDelete.includes(item.id))
        }));
        
        if (selectedItem && idsToDelete.includes(selectedItem.id)) {
          setSelectedItem(null);
          setShowViewModal(false);
        }
        
        fetchData(); // Refresh data
      } else {
        setBanner({ message: 'Gagal menghapus data', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting records:', error);
      setBanner({ message: 'Terjadi kesalahan saat menghapus data', type: 'error' });
    } finally {
      setDeleteTargets([]);
      setDeleteMode(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.judul || !formData.institusi || !formData.tahun_lulus || !formData.file) {
      setBanner({ message: 'Mohon lengkapi semua field', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const apiFormData = new FormData();
      apiFormData.append('file', formData.file);
      apiFormData.append('jenis', JENIS_MAPPING[activeTab]);
      apiFormData.append('judul', formData.judul);
      apiFormData.append('institusi', formData.institusi);
      apiFormData.append('tahun_lulus', formData.tahun_lulus);

      const response = await authenticatedFetch('/api/riwayat-pendidikan', {
        method: 'POST',
        body: apiFormData,
        headers: {} // Let browser set Content-Type with boundary
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBanner({ message: 'Data berhasil ditambahkan!', type: 'success' });
        setShowAddModal(false);
        setFormData({ judul: '', institusi: '', tahun_lulus: '', file: null });
        fetchData(); // Refresh data
      } else {
        setBanner({ message: data.message || 'Gagal menambahkan data', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding record:', error);
      setBanner({ message: 'Terjadi kesalahan saat menambahkan data', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle download
  const handleDownload = async (item) => {
    try {
      const response = await authenticatedFetch(`/api/riwayat-pendidikan/view/${item.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.judul}_${item.tahun_lulus}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setBanner({ message: 'Gagal mendownload dokumen', type: 'error' });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setBanner({ message: 'Terjadi kesalahan saat mendownload dokumen', type: 'error' });
    }
  };

  return (
    <MainLayout>
      {/* Banner Notification */}
      {banner.message && (
        <div className={`${styles.banner} ${styles[banner.type]}`}>
          <span>{banner.message}</span>
          <button 
            className={styles.bannerClose} 
            onClick={() => setBanner({ message: '', type: '' })}
          >
            ×
          </button>
        </div>
      )}

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Riwayat Pendidikan</h1>
        <p className={styles.pageSubtitle}>Kelola ijazah, sertifikat pelatihan, dan riwayat workshop</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />

          <div className={styles.headerRow}>
            <h3 className={styles.sectionTitle}>
              {activeTab === 'ijazah' && 'Daftar Ijazah'}
              {activeTab === 'pelatihan' && 'Daftar Sertifikat Pelatihan'}
              {activeTab === 'workshop' && 'Daftar Workshop / In-House Training'}
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

          <div className={styles.list}>
            {items.length === 0 && <p className={styles.emptyText}>Belum ada data.</p>}
            {items.map((item) => (
              <Card
                key={item.id}
                className={`${styles.itemCard} ${deleteMode ? styles.deleteSelectable : ''} ${
                  deleteTargets.some((entry) => entry.id === item.id) ? styles.deleteSelected : ''
                }`}
                shadow={false}
                onClick={() => handleSelectForDelete(item)}
              >
                <div className={styles.itemContent}>
                  <div>
                    <h4 className={styles.itemTitle}>{item.judul}</h4>
                    <p className={styles.itemMeta}>{item.institusi}</p>
                    <p className={styles.itemMeta}>Tahun Lulus: {item.tahun_lulus}</p>
                  </div>
                  <div className={styles.fileBlock}>
                    <span className={styles.fileLabel}>File:</span>
                    <a
                      href="#"
                      className={styles.fileLink}
                      onClick={(e) => {
                        if (deleteMode) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectForDelete(item);
                        }
                      }}
                    >
                      {item.file_name}
                    </a>
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
              </Card>
            ))}
          </div>
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
                  {item.judul} - {item.institusi}
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

      {/* View PDF Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }}
        title={selectedItem?.judul || 'Lihat Dokumen'}
        className={styles.viewModal}
      >
        <div className={styles.viewDetail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Institusi</span>
              <span className={styles.detailValue}>{selectedItem?.institusi || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tahun Lulus</span>
              <span className={styles.detailValue}>{selectedItem?.tahun_lulus || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>File</span>
              <span className={styles.detailValue}>{selectedItem?.file_name || 'File belum tersedia'}</span>
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
            <Button variant="danger" onClick={() => {
              setShowViewModal(false);
              if (pdfUrl) URL.revokeObjectURL(pdfUrl);
              setPdfUrl(null);
            }}>
              Tutup
            </Button>
            <Button
              variant="primary"
              icon={<MdDownload />}
              iconPosition="left"
              onClick={() => handleDownload(selectedItem)}
              disabled={!selectedItem?.file_path}
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Form Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Tambah ${activeTab === 'ijazah' ? 'Ijazah' : activeTab === 'pelatihan' ? 'Sertifikat Pelatihan' : 'Workshop'}`}
        size="medium"
        padding="normal"
      >
        <Form onSubmit={handleAddSubmit} className={styles.modalContent}>
          <Input
            label="Judul/Nama"
            type="text"
            name="judul"
            value={formData.judul}
            onChange={handleInputChange}
            placeholder={
              activeTab === 'ijazah' 
                ? "Contoh: S1 Keperawatan" 
                : activeTab === 'pelatihan'
                ? "Contoh: Pelatihan BLS (Basic Life Support)"
                : "Contoh: Workshop Penanganan Pasien Kritis"
            }
            required
          />
          <Input
            label="Institusi"
            type="text"
            name="institusi"
            value={formData.institusi}
            onChange={handleInputChange}
            placeholder={
              activeTab === 'ijazah'
                ? "Contoh: Universitas Indonesia"
                : activeTab === 'pelatihan'
                ? "Contoh: Perhimpunan Dokter Spesialis Kardiovaskular Indonesia"
                : "Contoh: RSUP Dr. Sardjito"
            }
            required
          />
          <Input
            label="Tahun Lulus"
            type="text"
            name="tahun_lulus"
            value={formData.tahun_lulus}
            onChange={handleInputChange}
            placeholder="Contoh: 2020"
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
            <Button variant="danger" type="button" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button
              variant="success"
              icon={<MdSave />}
              iconPosition="left"
              type="submit"
              disabled={isSubmitting || !formData.judul || !formData.institusi || !formData.tahun_lulus || !formData.file}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </Form.Actions>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default RiwayatPendidikan;
