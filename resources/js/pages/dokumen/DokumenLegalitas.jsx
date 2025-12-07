import { useRef, useState } from 'react';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import { MdCloudUpload, MdDownload, MdUpload, MdVisibility, MdSave } from 'react-icons/md';
import styles from './DokumenLegalitas.module.css';

const documents = [
  {
    id: 'surat-keterangan',
    title: 'Surat Keterangan',
    number: 'SK/2024/001',
    startDate: '1/1/2024',
    endDate: '31/12/2025',
    fileName: 'surat_keterangan.pdf',
    status: 'Aktif'
  },
  {
    id: 'str',
    title: 'STR (Surat Tanda Registrasi)',
    number: 'STR/2023/456',
    startDate: '1/1/2024',
    endDate: '15/02/2025',
    fileName: 'str_dokumen.pdf',
    status: 'Segera Habis'
  },
  {
    id: 'sip',
    title: 'SIP (Surat Izin Praktek)',
    number: 'SIP/2024/789',
    startDate: '1/1/2022',
    endDate: '31/12/2023',
    fileName: 'sip_dokumen.pdf',
    status: 'Sudah Habis'
  }
];

const getStatusVariant = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aktif') return 'success';
  if (normalized === 'segera habis') return 'warning';
  if (normalized === 'sudah habis' || normalized === 'habis') return 'danger';
  return 'secondary';
};

const DokumenLegalitas = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const fileInputRef = useRef(null);

  const openUploadModal = () => {
    setUploadFile(null);
    setStartDate('');
    setEndDate('');
    setShowUploadModal(true);
  };

  const openViewModal = (doc) => {
    setSelectedDoc(doc);
    setShowViewModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate upload API
    setShowUploadModal(false);
  };

  return (
    <MainLayout>
        <div className={styles['dokumen-header']}>
          <h1 className={styles['dokumen-title']}>Dokumen Legalitas</h1>
          <p className={styles['dokumen-subtitle']}>
            Kelola dokumen legalitas Anda: Surat Keterangan, STR, dan SIP.
          </p>
        </div>

        <div className={styles['dokumen-list']}>
          {documents.length === 0 && <p>Tidak ada dokumen legalitas.</p>}
          {documents.map((doc) => (
            <Card
              key={doc.id}
              variant="secondary"
              padding="normal"
              shadow={false}
              title={doc.title}
              subtitle={doc.number}
              headerAction={
                <Button
                  variant={getStatusVariant(doc.status)}
                  size="small"
                  disabled
                >
                  {doc.status}
                </Button>
              }
              className={styles['dokumen-card']}
            >
              <div className={styles['dokumen-grid']}>
                <div className={styles['dokumen-info']}>
                  <div className={styles['info-row']}>
                    <div className={styles['info-block']}>
                      <span className={styles['info-label']}>Tanggal Mulai</span>
                      <span className={styles['info-value']}>{doc.startDate}</span>
                    </div>
                    <div className={styles['info-block']}>
                      <span className={styles['info-label']}>Berlaku Sampai</span>
                      <span className={styles['info-value']}>{doc.endDate}</span>
                    </div>
                    <div className={`${styles['info-block']} ${styles['info-file']}`}>
                      <span className={styles['info-label']}>File</span>
                      <a className={styles['file-link']} href="#">
                        {doc.fileName}
                      </a>
                    </div>
                  </div>
                </div>

                <div className={styles['dokumen-file']}>
                  <Button variant="primary" size="large" fullWidth icon={<MdUpload />} onClick={openUploadModal}>
                    Upload Baru
                  </Button>
                  <Button
                    variant="outline"
                    size="large"
                    fullWidth
                    icon={<MdVisibility />}
                    onClick={() => openViewModal(doc)}
                  >
                    Lihat Dokumen
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Dokumen Legalitas"
          size="medium"
          padding="normal"
        >
          <Form onSubmit={handleUploadSubmit} className={styles.modalContent}>
            <Form.Row columns={2}>
              <Input
                label="Tanggal Mulai"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="Tanggal Berlaku"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </Form.Row>
            <div className={styles['upload-drop']}>
              <MdCloudUpload size={48} />
              <p>Pilih atau seret file ke sini</p>
              <span className={styles['upload-hint']}>PDF, maks 5MB</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <Button variant="outline" icon={<MdCloudUpload />} onClick={handleChooseFile}>
                Pilih File
              </Button>
              {uploadFile && <div className={styles['upload-file-name']}>{uploadFile.name}</div>}
            </div>
            <Form.Actions align="right" className={styles.modalActions}>
              <Button variant="danger" type="button" onClick={() => setShowUploadModal(false)}>
                Batal
              </Button>
              <Button
                variant="success"
                icon={<MdSave />}
                iconPosition="left"
                type="submit"
                disabled={!uploadFile || !startDate || !endDate}
              >
                Simpan Perubahan
              </Button>
            </Form.Actions>
          </Form>
        </Modal>
        {/* View Certificate Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={selectedDoc?.title || 'Detail Dokumen'}
          size="large"
          padding="normal"
        >
          <div className={styles.modalContent}>
            <div className={styles.metaRow}>
              <div>
                <p className={styles.metaLabel}>Tanggal Mulai</p>
                <p className={styles.metaValue}>{selectedDoc?.startDate || '-'}</p>
              </div>
              <div>
                <p className={styles.metaLabel}>Berlaku Sampai</p>
                <p className={styles.metaValue}>{selectedDoc?.endDate || '-'}</p>
              </div>
            </div>
            <div className={styles.fileInfo}>
              <div>
                <p className={styles.metaLabel}>Nomor Dokumen</p>
                <p className={styles.metaValue}>{selectedDoc?.number || '-'}</p>
              </div>
              <div>
                <p className={styles.metaLabel}>File</p>
                <p className={styles.metaValue}>{selectedDoc?.fileName || 'File belum tersedia'}</p>
              </div>
            </div>
            {selectedDoc?.fileName && (
              <div className={styles.pdfFrameWrapper}>
                <iframe
                  src={`/storage/${selectedDoc.fileName}`}
                  className={styles.pdfFrame}
                  title="PDF Viewer"
                />
              </div>
            )}
            <div className={styles.modalActions}>
              <Button variant="danger" onClick={() => setShowViewModal(false)}>
                Tutup
              </Button>
              <Button
                variant="primary"
                icon={<MdDownload />}
                iconPosition="left"
                onClick={() => window.open(`/storage/${selectedDoc?.fileName}`, '_blank')}
                disabled={!selectedDoc?.fileName}
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
