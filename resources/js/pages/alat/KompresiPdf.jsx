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
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  const handleCompress = async () => {
    if (!file) {
      setStatus('Pilih satu PDF untuk dikompresi.');
      return;
    }
    setIsProcessing(true);
    setStatus('Mengompresi PDF...');
    const startTime = Date.now();

    try {
      // Create form data
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('level', level);

      // Send to backend API
      const response = await fetch('/api/compress-pdf', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error('Server error: Expected JSON response');
      }

      const result = await response.json();

      if (!response.ok || result.error) {
        const errorMsg = result.error || result.message || 'Compression failed';
        const details = result.details ? JSON.stringify(result.details) : '';
        throw new Error(`${errorMsg} ${details}`);
      }

      const endTime = Date.now();
      const elapsed = ((endTime - startTime) / 1000).toFixed(1);
      setElapsedTime(elapsed);
      
      setOriginalSize(result.original_size);
      setCompressedSize(result.compressed_size);

      // Convert base64 to blob
      const binaryString = atob(result.compressed_pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const compressedBlob = new Blob([bytes], { type: 'application/pdf' });

      // Create download link with original filename
      const url = URL.createObjectURL(compressedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus(`✓ PDF berhasil dikompres! Pengurangan ukuran: ${result.reduction_percentage}%`);
    } catch (error) {
      console.error('Error compressing PDF:', error);
      setStatus(`✗ Gagal mengompres PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MainLayout>
      {/* Loading Overlay */}
      {isProcessing && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingModal}>
            <div className={styles.loadingSpinner}></div>
            <h3 className={styles.loadingTitle}>Mengompresi PDF...</h3>
            <p className={styles.loadingText}>Mohon tunggu, proses ini mungkin memakan waktu beberapa saat.</p>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill}></div>
            </div>
          </div>
        </div>
      )}

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
              <span>Ukuran asli</span>
              <span>{originalSize > 0 ? `${(originalSize / 1024).toFixed(1)} KB` : '-'}</span>
            </li>
            <li>
              <span>Ukuran kompres</span>
              <span>{compressedSize > 0 ? `${(compressedSize / 1024).toFixed(1)} KB` : '-'}</span>
            </li>
            <li>
              <span>Waktu proses</span>
              <span>{elapsedTime > 0 ? `${elapsedTime} detik` : '-'}</span>
            </li>
            <li>
              <span>Output</span>
              <span>1 file PDF</span>
            </li>
          </ul>
          <div className={styles.helperBox}>
            <MdCheckCircle size={18} />
            <p>
              Kompresi dilakukan secara lokal di browser Anda. File tidak diunggah ke server.
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

export default KompresiPdf;
