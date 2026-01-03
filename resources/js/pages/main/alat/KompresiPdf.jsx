import { useRef, useState } from 'react';
import MainLayout from '../../../layout/main/MainLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import { MdCloudUpload, MdCompress, MdDelete, MdCheckCircle } from 'react-icons/md';
import styles from '../../admin/alat/Alat.module.css';

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
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('level', level);

      const response = await fetch('/api/compress-pdf', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

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

      const binaryString = atob(result.compressed_pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const compressedBlob = new Blob([bytes], { type: 'application/pdf' });

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Kompress PDF</h1>
          <p className={styles.pageSubtitle}>Perkecil ukuran file PDF dokumen pengguna tanpa mengubah struktur.</p>
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
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
            </div>

            {file && (
              <div className={styles.filePreviewList}>
                <div className={styles.fileItem}>
                  <MdCheckCircle className={styles.fileIcon} size={20} />
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileMeta}>{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => setFile(null)}
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card className={styles.cardShell}>
            <h3 className={styles.sectionTitle}>Tingkat Kompresi</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="level"
                  value="light"
                  checked={level === 'light'}
                  onChange={(e) => setLevel(e.target.value)}
                />
                <span className={styles.radioText}>
                  <strong>Rendah</strong>
                  <small>Kualitas tinggi, kompresi minimal</small>
                </span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="level"
                  value="medium"
                  checked={level === 'medium'}
                  onChange={(e) => setLevel(e.target.value)}
                />
                <span className={styles.radioText}>
                  <strong>Sedang</strong>
                  <small>Keseimbangan kualitas dan ukuran (Disarankan)</small>
                </span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="level"
                  value="strong"
                  checked={level === 'strong'}
                  onChange={(e) => setLevel(e.target.value)}
                />
                <span className={styles.radioText}>
                  <strong>Tinggi</strong>
                  <small>Ukuran minimum, penurunan kualitas</small>
                </span>
              </label>
            </div>

            <Button
              variant="primary"
              icon={<MdCompress />}
              onClick={handleCompress}
              disabled={!file || isProcessing}
              className={styles.actionBtn}
            >
              {isProcessing ? 'Memproses...' : 'Kompres PDF'}
            </Button>

            {status && (
              <div className={`${styles.statusBox} ${status.startsWith('✓') ? styles.success : status.startsWith('✗') ? styles.error : ''}`}>
                {status}
              </div>
            )}

            {compressedSize > 0 && (
              <div className={styles.resultBox}>
                <div className={styles.resultItem}>
                  <span>Ukuran Asli</span>
                  <strong>{formatFileSize(originalSize)}</strong>
                </div>
                <div className={styles.resultItem}>
                  <span>Ukuran Hasil</span>
                  <strong>{formatFileSize(compressedSize)}</strong>
                </div>
                <div className={styles.resultItem}>
                  <span>Waktu Proses</span>
                  <strong>{elapsedTime} detik</strong>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default KompresiPdf;
