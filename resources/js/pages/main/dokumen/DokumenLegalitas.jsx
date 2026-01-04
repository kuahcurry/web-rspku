import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layout/main/MainLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import { MdCloudUpload, MdDownload, MdUpload, MdVisibility, MdSave } from 'react-icons/md';
import { authenticatedFetch, isAuthenticated } from '../../../utils/auth';
import { formatDateToIndonesian } from '../../../utils/dateFormatter';
import styles from './DokumenLegalitas.module.css';

const DOCUMENT_TYPES = [
  { value: 'Surat Keterangan', label: 'Surat Keterangan' },
  { value: 'STR', label: 'STR (Surat Tanda Registrasi)' },
  { value: 'SIP', label: 'SIP (Surat Izin Praktek)' }
];

const getStatusVariant = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aktif') return 'success';
  if (normalized === 'segera habis') return 'warning';
  if (normalized === 'sudah habis' || normalized === 'habis') return 'danger';
  return 'secondary';
};

const getDocumentStatus = (tanggalBerlaku) => {
  if (!tanggalBerlaku) return 'Tidak Ada Data';
  
  const today = new Date();
  const expiryDate = new Date(tanggalBerlaku);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Sudah Habis';
  if (diffDays <= 30) return 'Segera Habis';
  return 'Aktif';
};

const DokumenLegalitas = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    jenis_dokumen: '',
    nomor_sk: '',
    tanggal_mulai: '',
    tanggal_berlaku: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchDocuments();
  }, [navigate]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/dokumen-legalitas');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = (docType = '') => {
    setUploadFile(null);
    setUploadData({
      jenis_dokumen: docType,
      nomor_sk: '',
      tanggal_mulai: '',
      tanggal_berlaku: ''
    });
    setShowUploadModal(true);
  };

  const openViewModal = async (doc) => {
    setSelectedDoc(doc);
    setShowViewModal(true);
    setLoadingPdf(true);
    setPdfUrl(null);

    try {
      // Fetch PDF with authentication
      const response = await authenticatedFetch(`/api/dokumen-legalitas/view/${doc.id}`);
      
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

  // Cleanup PDF URL when modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

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
    if (file.type === 'application/pdf') {
      if (file.size <= 5 * 1024 * 1024) { // 5MB limit
        setUploadFile(file);
      } else {
        alert('File terlalu besar. Maksimal 5MB');
        if (eventRef?.target) eventRef.target.value = '';
      }
    } else {
      alert('Hanya file PDF yang diperbolehkan');
      if (eventRef?.target) eventRef.target.value = '';
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadFile || !uploadData.jenis_dokumen) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('jenis_dokumen', uploadData.jenis_dokumen);
      formData.append('nomor_sk', uploadData.nomor_sk);
      formData.append('tanggal_mulai', uploadData.tanggal_mulai);
      formData.append('tanggal_berlaku', uploadData.tanggal_berlaku);

      const response = await authenticatedFetch('/api/dokumen-legalitas', {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type with boundary
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Dokumen berhasil diupload!');
        setShowUploadModal(false);
        fetchDocuments(); // Refresh the list
      } else {
        alert(data.message || 'Gagal mengupload dokumen');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Terjadi kesalahan saat mengupload dokumen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Group documents by type for display
  const getDocumentByType = (type) => {
    return documents.find(doc => doc.jenis_dokumen === type);
  };

  // Handle download
  const handleDownload = async (doc) => {
    try {
      const response = await authenticatedFetch(`/api/dokumen-legalitas/view/${doc.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.jenis_dokumen}_${doc.nomor_sk || 'dokumen'}.pdf`;
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

  if (loading) {
    return (
      <MainLayout>
        <div className={styles['dokumen-header']}>
          <h1 className={styles['dokumen-title']}>Dokumen Legalitas</h1>
          <p className={styles['dokumen-subtitle']}>Memuat dokumen...</p>
        </div>
      </MainLayout>
    );
  }


  return (
    <MainLayout>
        <div className={styles['dokumen-header']}>
          <h1 className={styles['dokumen-title']}>Dokumen Legalitas</h1>
          <p className={styles['dokumen-subtitle']}>
            Kelola dokumen legalitas Anda: Surat Keterangan, STR, dan SIP.
          </p>
        </div>

        <div className={styles['dokumen-list']}>
          {DOCUMENT_TYPES.map((docType) => {
            const doc = getDocumentByType(docType.value);
            const status = doc ? getDocumentStatus(doc.tanggal_berlaku) : 'Belum Upload';
            
            return (
              <Card
                key={docType.value}
                variant="secondary"
                padding="normal"
                shadow={false}
                title={docType.label}
                subtitle={doc?.nomor_sk || 'Nomor belum tersedia'}
                headerAction={
                  <Button
                    variant={getStatusVariant(status)}
                    size="small"
                    disabled
                  >
                    {status}
                  </Button>
                }
                className={styles['dokumen-card']}
              >
                <div className={styles['dokumen-grid']}>
                  <div className={styles['dokumen-info']}>
                    <div className={styles['info-row']}>
                      <div className={styles['info-block']}>
                        <span className={styles['info-label']}>Tanggal Mulai</span>
                        <span className={styles['info-value']}>
                          {doc?.tanggal_mulai ? formatDateToIndonesian(doc.tanggal_mulai) : '-'}
                        </span>
                      </div>
                      <div className={styles['info-block']}>
                        <span className={styles['info-label']}>Berlaku Sampai</span>
                        <span className={styles['info-value']}>
                          {doc?.tanggal_berlaku ? formatDateToIndonesian(doc.tanggal_berlaku) : '-'}
                        </span>
                      </div>
                      <div className={styles['info-block']}>
                        <span className={styles['info-label']}>File</span>
                        <span className={styles['info-value']}>
                          {doc ? doc.file_path.split('/').pop() : 'Belum ada file'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles['dokumen-file']}>
                    <Button 
                      variant="primary" 
                      size="large" 
                      fullWidth 
                      icon={<MdUpload />} 
                      onClick={() => openUploadModal(docType.value)}
                    >
                      {doc ? 'Upload Baru' : 'Upload Dokumen'}
                    </Button>
                    {doc && (
                      <Button
                        variant="outline"
                        size="large"
                        fullWidth
                        icon={<MdVisibility />}
                        onClick={() => openViewModal(doc)}
                      >
                        Lihat Dokumen
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Dokumen Legalitas"
          size="medium"
          padding="normal"
        >
          <Form onSubmit={handleUploadSubmit} className={styles['modal-content']}>
            <Input
              label="Jenis Dokumen"
              type="select"
              name="jenis_dokumen"
              value={uploadData.jenis_dokumen}
              onChange={handleInputChange}
              options={DOCUMENT_TYPES}
              required
              disabled={!!uploadData.jenis_dokumen}
            />
            <Input
              label="Nomor SK/Surat"
              type="text"
              name="nomor_sk"
              value={uploadData.nomor_sk}
              onChange={handleInputChange}
              placeholder="Masukkan nomor surat"
            />
            <Form.Row columns={2}>
              <Input
                label="Tanggal Mulai"
                type="date"
                name="tanggal_mulai"
                value={uploadData.tanggal_mulai}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Tanggal Berlaku"
                type="date"
                name="tanggal_berlaku"
                value={uploadData.tanggal_berlaku}
                onChange={handleInputChange}
                required
              />
            </Form.Row>
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
              <Button variant="outline" icon={<MdCloudUpload />} onClick={handleChooseFile} type="button">
                Pilih File
              </Button>
              {uploadFile && <div className={styles['upload-file-name']}>{uploadFile.name}</div>}
            </div>
            <Form.Actions align="right" className={styles['modal-actions']}>
              <Button variant="danger" type="button" onClick={() => setShowUploadModal(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button
                variant="success"
                icon={<MdSave />}
                iconPosition="left"
                type="submit"
                disabled={!uploadFile || !uploadData.tanggal_mulai || !uploadData.tanggal_berlaku || isSubmitting}
              >
                {isSubmitting ? 'Mengupload...' : 'Simpan Perubahan'}
              </Button>
            </Form.Actions>
          </Form>
        </Modal>
        {/* View Certificate Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={selectedDoc?.jenis_dokumen || 'Detail Dokumen'}
          className={styles.viewModal}
        >
          <div className={styles.viewDetail}>
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nomor Dokumen</span>
                <span className={styles.detailValue}>{selectedDoc?.nomor_sk || '-'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tanggal Mulai</span>
                <span className={styles.detailValue}>
                  {selectedDoc?.tanggal_mulai ? formatDateToIndonesian(selectedDoc.tanggal_mulai) : '-'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Berlaku Sampai</span>
                <span className={styles.detailValue}>
                  {selectedDoc?.tanggal_berlaku ? formatDateToIndonesian(selectedDoc.tanggal_berlaku) : '-'}
                </span>
              </div>
            </div>

            <div className={styles.pdfPreview}>
              {loadingPdf ? (
                <div className={styles.pdfEmpty}>Memuat dokumen...</div>
              ) : pdfUrl ? (
                <iframe src={pdfUrl} className={styles.pdfFrame} title="PDF Viewer" />
              ) : (
                <div className={styles.pdfEmpty}>Dokumen belum tersedia.</div>
              )}
            </div>

            <div className={styles.modalActions}>
              <Button variant="danger" onClick={() => setShowViewModal(false)}>
                Tutup
              </Button>
              <Button
                variant="primary"
                icon={<MdDownload />}
                iconPosition="left"
                onClick={() => selectedDoc && handleDownload(selectedDoc)}
                disabled={!selectedDoc?.id || loadingPdf}
              >
                Download
              </Button>
            </div>
          </div>
        </Modal>
    </MainLayout>
  );
};

export default DokumenLegalitas;
