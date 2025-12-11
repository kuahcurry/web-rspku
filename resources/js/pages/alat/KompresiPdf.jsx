import { useRef, useState } from 'react';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import { MdCloudUpload, MdCompress, MdDelete, MdCheckCircle } from 'react-icons/md';
import styles from './alat.module.css';

function KompresiPdf() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('medium');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = (fileObj, eventRef) => {
    if (!fileObj) return;
    if (fileObj.type !== 'application/pdf') {
      alert('Hanya file PDF yang diperbolehkan');
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    setFile(fileObj);
    setStatus('');
  };

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0], e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer?.files?.[0]);
  };

  const handleCompress = () => {
    if (!file) {
      setStatus('Pilih satu PDF untuk dikompresi.');
      return;
    }
    setIsProcessing(true);
    setStatus('Mengompresi PDF...');
    setTimeout(() => {
      setIsProcessing(false);
      setStatus('Berhasil dikompresi (simulasi). Siap diunduh.');
    }, 1100);
  };

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Kompresi File PDF</h1>
        <p className={styles.pageSubtitle}>Perkecil ukuran file PDF tanpa mengubah struktur.</p>
      </header>

      <div className={styles.grid}>
        <Card className={styles.cardShell}>
          <div
            className={styles.dropzone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <MdCloudUpload size={46} />
            <p className={styles.dropTitle}>Pilih atau seret PDF ke sini</p>
            <p className={styles.dropHint}>Maks 1 file · PDF</p>
            <Button
              variant="outline"
              icon={<MdCloudUpload />}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Pilih File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className={styles.fileList}>
              <div className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileMeta}>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  className={styles.iconButton}
                  onClick={() => setFile(null)}
                  aria-label="Hapus"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            </div>
          )}

          <div className={styles.optionBlock}>
            <p className={styles.optionLabel}>Tingkat kompresi</p>
            <div className={styles.chipGroup}>
              <button
                className={`${styles.chip} ${level === 'light' ? styles.chipActive : ''}`}
                onClick={() => setLevel('light')}
              >
                Ringan
              </button>
              <button
                className={`${styles.chip} ${level === 'medium' ? styles.chipActive : ''}`}
                onClick={() => setLevel('medium')}
              >
                Sedang
              </button>
              <button
                className={`${styles.chip} ${level === 'strong' ? styles.chipActive : ''}`}
                onClick={() => setLevel('strong')}
              >
                Maksimal
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="success"
              size="large"
              icon={<MdCompress />}
              onClick={handleCompress}
              disabled={isProcessing}
            >
              {isProcessing ? 'Memproses...' : 'Kompresi PDF'}
            </Button>
            <Button
              variant="danger"
              type="button"
              size='large'
              icon={<MdDelete />}
              onClick={() => {
                setFile(null);
                setStatus('');
              }}
              disabled={!file || isProcessing}
            >
              Bersihkan
            </Button>
          </div>

          {status && <div className={styles.status}>{status}</div>}
        </Card>

        <Card className={styles.cardShell}>
          <p className={styles.optionLabel}>Ringkasan</p>
          <ul className={styles.summaryList}>
            <li>
              <span>Status file</span>
              <span>{file ? 'Siap kompresi' : 'Belum ada file'}</span>
            </li>
            <li>
              <span>Tingkat</span>
              <span>
                {level === 'light' ? 'Ringan' : level === 'medium' ? 'Sedang' : 'Maksimal'}
              </span>
            </li>
            <li>
              <span>Estimasi pengurangan</span>
              <span>
                {level === 'light' ? '≈15%' : level === 'medium' ? '≈30%' : '≈45%'} (simulasi)
              </span>
            </li>
            <li>
              <span>Output</span>
              <span>1 file PDF</span>
            </li>
          </ul>
          <div className={styles.helperBox}>
            <MdCheckCircle size={18} />
            <p>
              Kompresi dilakukan secara lokal (simulasi UI). Unggah file setelah fitur backend siap.
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

export default KompresiPdf;
