import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import { MdVisibility, MdAdd, MdCloudUpload, MdSave, MdDownload, MdDelete, MdPrint } from 'react-icons/md';
import { authenticatedFetch, isAuthenticated } from '../../utils/auth';
import styles from './StatusKewenangan.module.css';

const JENIS_MAPPING = {
  'spk': 'SPK',
  'rkk': 'RKK'
};

const StatusKewenangan = () => {
  const navigate = useNavigate();
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
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
      console.error('Error fetching authority records:', error);
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
    setSelectedJenis('spk');
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
    
    if (!formData.nomor_dokumen || !formData.tanggal_terbit || !formData.masa_berlaku || !formData.file) {
      alert('Semua field harus diisi');
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
        alert('Data berhasil ditambahkan');
        handleCloseAddModal();
        fetchData();
      } else {
        throw new Error(data.message || 'Gagal menambahkan data');
      }
    } catch (error) {
      console.error('Error adding authority:', error);
      alert(error.message || 'Gagal menambahkan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      const response = await authenticatedFetch(`/api/status-kewenangan/${item.id}/file`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.nomor_dokumen}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Gagal mengunduh file');
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
      alert('Pilih minimal satu item untuk dihapus');
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
        alert('Data berhasil dihapus');
        setShowDeleteModal(false);
        setDeleteMode(false);
        setDeleteTargets([]);
        fetchData();
      } else {
        throw new Error(data.message || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting authorities:', error);
      alert(error.message || 'Gagal menghapus data');
    }
  };

  const getStatusVariant = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'aktif') return 'success';
    if (normalized === 'segera habis') return 'warning';
    if (normalized === 'tidak aktif' || normalized === 'habis') return 'danger';
    return 'secondary';
  };

  const handlePrint = async (item) => {
    try {
      const response = await authenticatedFetch(`/api/status-kewenangan/${item.id}/file`);
      if (!response.ok) throw new Error('Failed to fetch file for print');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (!printWindow) {
        alert('Pop-up diblokir, izinkan pop-up untuk mencetak');
        URL.revokeObjectURL(url);
        return;
      }
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (error) {
      console.error('Error printing file:', error);
      alert('Gagal menyiapkan cetak dokumen');
    }
  };

  const allItems = [
    ...(dataByTab.spk || []).map((item) => ({ ...item, jenis: 'SPK' })),
    ...(dataByTab.rkk || []).map((item) => ({ ...item, jenis: 'RKK' }))
  ];

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Status Kewenangan Klinis</h1>
        <p className={styles.pageSubtitle}>Preview dokumen SPK dan RKK kewenangan klinis</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <div className={styles.headerRow}>
            <h3 className={styles.sectionTitle}>Dokumen SPK & RKK</h3>
            <div className={styles.actionButtons}>
              <Button
                variant="success"
                size="small"
                icon={<MdAdd />}
                iconPosition="left"
                onClick={handleAddClick}
              >
                Tambah
              </Button>
              <Button
                variant="danger"
                size="small"
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
              {allItems.length === 0 && (
                <p className={styles.emptyText}>Belum ada data SPK maupun RKK.</p>
              )}
              {allItems.map((item) => (
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
                    <div>
                      <h4 className={styles.itemTitle}>{item.nomor_dokumen || 'Tanpa nomor dokumen'}</h4>
                      <p className={styles.itemMeta}>Jenis: {item.jenis || '-'}</p>
                      <p className={styles.itemMeta}>Tanggal Terbit: {item.tanggal_terbit || '-'}</p>
                      <p className={styles.itemMeta}>Masa Berlaku: {item.masa_berlaku || '-'}</p>
                    </div>
                    <div className={styles.fileBlock}>
                      <span className={styles.fileLabel}>Status</span>
                      <Button variant={getStatusVariant(item.status)} size="small" disabled>
                        {item.status || '-'}
                      </Button>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="outline"
                        icon={<MdVisibility />}
                        iconPosition="left"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClick(item);
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="secondary"
                        icon={<MdDownload />}
                        iconPosition="left"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                      >
                        Unduh
                      </Button>
                      <Button
                        variant="secondary"
                        icon={<MdPrint />}
                        iconPosition="left"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(item);
                        }}
                      >
                        Cetak
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
        title={selectedItem?.nomor_dokumen || 'Detail Dokumen'}
        size="large"
        padding="normal"
      >
        <div className={styles.modalContent}>
          {loadingPdf ? (
            <div className={styles.loadingPdf}>Memuat dokumen...</div>
          ) : pdfUrl ? (
            <div className={styles.pdfFrameWrapper}>
              <iframe src={pdfUrl} className={styles.pdfFrame} title="PDF Viewer" />
            </div>
          ) : (
            <div className={styles.errorPdf}>Gagal memuat dokumen</div>
          )}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={handleCloseViewModal}>
              Tutup
            </Button>
            <Button
              variant="primary"
              icon={<MdDownload />}
              iconPosition="left"
              onClick={() => selectedItem && handleDownload(selectedItem)}
              disabled={!selectedItem}
            >
              Download
            </Button>
            <Button
              variant="secondary"
              icon={<MdPrint />}
              iconPosition="left"
              onClick={() => selectedItem && handlePrint(selectedItem)}
              disabled={!selectedItem}
            >
              Cetak
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
    >
      <Form onSubmit={handleSubmit} className={styles.modalContent}>
        <div className={styles['form-group']}>
          <label className={styles['form-label']}>
            Jenis Dokumen <span className={styles.required}>*</span>
          </label>
          <select
            name="jenis"
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className={styles['form-select']}
            required
          >
            <option value="spk">SPK (Surat Penugasan Klinis)</option>
            <option value="rkk">RKK (Rincian Kewenangan Klinis)</option>
          </select>
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
            label="Tanggal Terbit"
            name="tanggal_terbit"
            type="date"
            value={formData.tanggal_terbit}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Masa Berlaku"
            name="masa_berlaku"
            type="date"
            value={formData.masa_berlaku}
            onChange={handleInputChange}
            required
          />

          <div className={styles['form-group']}>
            <label className={styles['form-label']}>
              Status <span className={styles.required}>*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={styles['form-select']}
              required
            >
              <option value="Aktif">Aktif</option>
              <option value="Segera Habis">Segera Habis</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>

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

          <div className={styles.modalActions}>
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
