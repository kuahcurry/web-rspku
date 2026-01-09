import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import Tabs from '../../../components/tabs/Tabs';
import { MdAdd, MdVisibility, MdCloudUpload, MdSave, MdDownload, MdDelete } from 'react-icons/md';
import { authenticatedFetch, isAuthenticated } from '../../../utils/auth';
import styles from './Penugasan.module.css';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const deriveStatus = (endDate) => {
  if (!endDate) return 'Aktif';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 'Aktif';
  end.setHours(0, 0, 0, 0);
  return end >= today ? 'Aktif' : 'Selesai';
};

const getStatusVariant = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aktif') return 'success';
  return 'secondary';
};

const tabs = [
  { key: 'penugasan', label: 'Penugasan' },
  { key: 'pengabdian', label: 'Pengabdian' }
];

const Penugasan = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [assignments, setAssignments] = useState({ Penugasan: [], Pengabdian: [] });
  const [activeTab, setActiveTab] = useState('penugasan');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [formData, setFormData] = useState({
    unit: '',
    penanggung_jawab: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    jenis: 'Penugasan',
    file: null
  });

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
      const response = await authenticatedFetch('/api/penugasan');
      const data = await response.json();

      if (response.ok && data.success) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
    setLoadingPdf(true);
    setPdfUrl(null);

    try {
      const response = await authenticatedFetch(`/api/penugasan/view/${item.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        alert('Gagal memuat dokumen');
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Terjadi kesalahan saat memuat dokumen');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleAddClick = () => {
    setFormData({
      unit: '',
      penanggung_jawab: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      jenis: activeTab === 'pengabdian' ? 'Pengabdian' : 'Penugasan',
      file: null
    });
    setShowAddModal(true);
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

  const handleTabChange = (key) => {
    setActiveTab(key);
    setDeleteMode(false);
    setDeleteTargets([]);
    setShowDeleteModal(false);
    setFormData((prev) => ({
      ...prev,
      jenis: key === 'pengabdian' ? 'Pengabdian' : 'Penugasan'
    }));
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
      const idsToDelete = deleteTargets.map((item) => item.id);
      
      const response = await authenticatedFetch('/api/penugasan/delete-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: idsToDelete }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`${data.deleted_count} penugasan berhasil dihapus`);
        
        setAssignments((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
        
        if (selectedItem && idsToDelete.includes(selectedItem.id)) {
          setSelectedItem(null);
          setShowViewModal(false);
        }
        
        fetchData();
      } else {
        alert(data.message || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting records:', error);
      alert('Terjadi kesalahan saat menghapus data');
    } finally {
      setDeleteTargets([]);
      setDeleteMode(false);
      setShowDeleteModal(false);
    }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file, e);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  };

  const processFile = (file, eventRef) => {
    if (!file) return;
    if (file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      setFormData({ ...formData, file });
    } else {
      alert('File harus berformat PDF dan maksimal 5MB');
      if (eventRef?.target) eventRef.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.unit || !formData.penanggung_jawab || !formData.tanggal_mulai || !formData.file) {
      alert('Mohon lengkapi field yang wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiFormData = new FormData();
      // Ensure jenis matches current active tab
      const currentJenis = activeTab === 'pengabdian' ? 'Pengabdian' : 'Penugasan';
      
      apiFormData.append('file', formData.file);
      apiFormData.append('unit', formData.unit);
      apiFormData.append('penanggung_jawab', formData.penanggung_jawab);
      apiFormData.append('tanggal_mulai', formData.tanggal_mulai);
      apiFormData.append('jenis', currentJenis);
      if (formData.tanggal_selesai) {
        apiFormData.append('tanggal_selesai', formData.tanggal_selesai);
      }

      const response = await authenticatedFetch('/api/penugasan', {
        method: 'POST',
        body: apiFormData,
        headers: {}
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`${formData.jenis || 'Penugasan'} berhasil ditambahkan!`);
        setShowAddModal(false);
        setFormData({
          unit: '',
          penanggung_jawab: '',
          tanggal_mulai: '',
          tanggal_selesai: '',
          jenis: activeTab === 'pengabdian' ? 'Pengabdian' : 'Penugasan',
          file: null
        });
        fetchData();
      } else {
        alert(data.message || 'Gagal menambahkan data');
      }
    } catch (error) {
      console.error('Error adding assignment:', error);
      alert('Terjadi kesalahan saat menambahkan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      const response = await authenticatedFetch(`/api/penugasan/view/${item.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.unit}_${item.tanggal_mulai}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Gagal mendownload dokumen');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Terjadi kesalahan saat mendownload dokumen');
    }
  };

  // Get assignments for current tab
  const currentTabKey = activeTab === 'penugasan' ? 'Penugasan' : 'Pengabdian';
  const filteredAssignments = assignments[currentTabKey] || [];

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Penugasan & Pengabdian</h1>
        <p className={styles.pageSubtitle}>Riwayat penugasan, penempatan unit kerja, dan pengabdian</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />

          <div className={styles.headerRow}>
            <div>
              <h3 className={styles.sectionTitle}>
                {activeTab === 'pengabdian' ? 'Riwayat Pengabdian' : 'Riwayat Penugasan'}
              </h3>
            </div>
            <div className={styles.actionButtons}>
              <Button
                variant="success"
                icon={<MdAdd />}
                iconPosition="left"
                onClick={handleAddClick}
                className={`${styles.compactButton} ${styles.headerAction}`}
              >
                Tambah
              </Button>
              <Button
                variant="danger"
                icon={<MdDelete />}
                iconPosition="left"
                onClick={handleDeleteButtonClick}
                className={`${styles.compactButton} ${styles.headerAction}`}
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
              Pilih satu atau lebih kartu penugasan yang ingin dihapus, lalu klik Hapus.
            </p>
          )}

          {loading ? (
            <div className={styles.list}>
              <p style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className={styles.list}>
              <p style={{ textAlign: 'center', padding: '2rem' }}>
                Belum ada data {activeTab === 'pengabdian' ? 'pengabdian' : 'penugasan'}.
              </p>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredAssignments.map((item) => (
              <Card
                key={item.id}
                className={`${styles.itemCard} ${deleteMode ? styles.deleteSelectable : ''} ${
                  deleteTargets.some((entry) => entry.id === item.id) ? styles.deleteSelected : ''
                }`}
                shadow={false}
                onClick={() => handleSelectForDelete(item)}
              >
                <div className={styles.itemBody}>
                  <div className={styles.itemHead}>
                    <h4 className={styles.itemTitle}>{item.unit}</h4>
                    <Button
                      variant={getStatusVariant(item.status)}
                      size="small"
                      disabled
                      className={styles.compactButton}
                    >
                      {item.status}
                    </Button>
                  </div>

                  <div className={styles.itemGrid}>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>Periode</p>
                      <p className={styles.metaValue}>
                        {formatDate(item.tanggal_mulai)} - {item.tanggal_selesai ? formatDate(item.tanggal_selesai) : 'Sekarang'}
                      </p>
                    </div>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>{activeTab === 'pengabdian' ? 'Peran / Posisi' : 'Penanggung Jawab'}</p>
                      <p className={styles.metaValue}>{item.penanggung_jawab}</p>
                    </div>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>Jenis</p>
                      <p className={styles.metaValue}>{item.jenis || 'Penugasan'}</p>
                    </div>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>File</p>
                      <div className={styles.fileAction}>
                        <a
                          href="#"
                          className={styles.fileLink}
                          onClick={(e) => {
                            e.preventDefault();
                            if (deleteMode) {
                              e.stopPropagation();
                              handleSelectForDelete(item);
                            }
                          }}
                        >
                          {item.file_name}
                        </a>
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
                  </div>
                </div>
              </Card>
            ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }}
        title={selectedItem?.unit || 'Detail Penugasan'}
        className={styles.viewModal}
      >
        <div className={styles.viewDetail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Periode</span>
              <span className={styles.detailValue}>
                {formatDate(selectedItem?.tanggal_mulai)} -{' '}
                {selectedItem?.tanggal_selesai ? formatDate(selectedItem?.tanggal_selesai) : 'Sekarang'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{activeTab === 'pengabdian' ? 'Peran / Posisi' : 'Penanggung Jawab'}</span>
              <span className={styles.detailValue}>{selectedItem?.penanggung_jawab || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status</span>
              <span className={styles.detailValue}>{selectedItem?.status || '-'}</span>
            </div>
          </div>

          <div className={styles.pdfPreview}>
            {loadingPdf ? (
              <div className={styles.pdfEmpty}>Memuat dokumen...</div>
            ) : pdfUrl ? (
              <iframe title="Preview PDF" src={pdfUrl} className={styles.pdfFrame} />
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

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Konfirmasi Hapus"
        size="small"
        padding="normal"
      >
        <div className={styles.modalContent}>
          <p className={styles.metaValue}>
            Hapus {deleteTargets.length} penugasan terpilih?
          </p>
          <p className={styles.metaLabel}>
            Tindakan ini akan menghapus penugasan dari daftar riwayat.
          </p>
          {!!deleteTargets.length && (
            <ul className={styles.deleteList}>
              {deleteTargets.map((item) => (
                <li key={item.id} className={styles.deleteListItem}>
                  {item.unit}
                </li>
              ))}
            </ul>
          )}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Batal
            </Button>
            <Button
              variant="danger"
              icon={<MdDelete />}
              iconPosition="left"
              onClick={handleConfirmDelete}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Tambah ${activeTab === 'pengabdian' ? 'Pengabdian' : 'Penugasan'}`}
        size="medium"
        padding="normal"
      >
        <Form onSubmit={handleSubmit} className={styles.modalForm}>
          <Form.Row columns={2} className={styles.formRow}>
            <Input
              label={activeTab === 'pengabdian' ? 'Nama Kegiatan / Program' : 'Unit / Bagian'}
              name="unit"
              placeholder={
                activeTab === 'pengabdian'
                  ? 'Contoh: Pengabdian Masyarakat Desa Sido Makmur'
                  : 'Contoh: IGD (Instalasi Gawat Darurat)'
              }
              value={formData.unit}
              onChange={handleInputChange}
              required
            />
            <Input
              label={activeTab === 'pengabdian' ? 'Peran / Posisi' : 'Penanggung Jawab'}
              name="penanggung_jawab"
              placeholder={
                activeTab === 'pengabdian'
                  ? 'Contoh: Koordinator Lapangan'
                  : 'Contoh: Dr. Ahmad Fauzi, Sp.EM'
              }
              value={formData.penanggung_jawab}
              onChange={handleInputChange}
              required
            />
          </Form.Row>

          <Form.Row columns={2} className={styles.formRow}>
            <Input
              label={activeTab === 'pengabdian' ? 'Tanggal Mulai Pengabdian' : 'Periode Mulai'}
              name="tanggal_mulai"
              type="date"
              placeholder="Pilih tanggal mulai"
              value={formData.tanggal_mulai}
              onChange={handleInputChange}
              required
            />
            <Input
              label={activeTab === 'pengabdian' ? 'Tanggal Selesai (Opsional)' : 'Periode Selesai (Opsional)'}
              name="tanggal_selesai"
              type="date"
              placeholder={activeTab === 'pengabdian' ? 'Kosongkan jika kegiatan masih berjalan' : 'Kosongkan jika masih aktif'}
              value={formData.tanggal_selesai}
              onChange={handleInputChange}
            />
          </Form.Row>

          <div
            className={styles.fileDrop}
            onClick={() => document.getElementById('penugasanFile').click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <MdCloudUpload size={40} />
            <div className={styles.fileDropText}>
              <p className={styles.fileDropTitle}>Pilih atau seret file ke sini</p>
              <p className={styles.fileDropHint}>PDF, maks 5MB</p>
              <Button
                type="button"
                variant="outline"
                size="medium"
                icon={<MdCloudUpload />}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('penugasanFile').click();
                }}
                className={styles.fileDropButton}
              >
                Pilih File
              </Button>
              {formData.file && <p className={styles.fileDropSelected}>{formData.file.name}</p>}
            </div>
            <input
              id="penugasanFile"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              required
            />
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
              disabled={isSubmitting || !formData.unit || !formData.penanggung_jawab || !formData.tanggal_mulai || !formData.file}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Penugasan'}
            </Button>
          </Form.Actions>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default Penugasan;
