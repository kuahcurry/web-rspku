import { useRef, useState } from 'react';
import MainLayout from '../../../layout/main/MainLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import { MdCloudUpload, MdCompress, MdDelete, MdCheckCircle, MdDownload, MdRefresh, MdDescription, MdSpeed, MdDataUsage, MdTimer } from 'react-icons/md';
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
  const [pdfResult, setPdfResult] = useState(null);
  const [isConverted, setIsConverted] = useState(false);

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

      setPdfResult({
        blob: compressedBlob,
        url: url,
        filename: result.original_filename,
        originalSize: result.original_size,
        compressedSize: result.compressed_size,
        reductionPercentage: result.reduction_percentage,
        level: level
      });

      setIsConverted(true);
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

  const handleDownload = () => {
    if (pdfResult) {
      const link = document.createElement('a');
      link.href = pdfResult.url;
      link.download = pdfResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    if (pdfResult?.url) {
      URL.revokeObjectURL(pdfResult.url);
    }
    setPdfResult(null);
    setIsConverted(false);
    setFile(null);
    setLevel('medium');
    setStatus('');
    setOriginalSize(0);
    setCompressedSize(0);
    setElapsedTime(0);
  };

  const getLevelLabel = (levelValue) => {
    const labels = {
      light: 'Rendah',
      medium: 'Sedang',
      strong: 'Tinggi'
    };
    return labels[levelValue] || levelValue;
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
            {!isConverted ? (
              <>
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

                {status && !isProcessing && (
                  <div className={`${styles.statusBox} ${status.startsWith('✓') ? styles.success : status.startsWith('✗') ? styles.error : ''}`}>
                    {status}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.resultSuccessHeader}>
                  <div className={styles.resultSuccessIcon}>
                    <MdCheckCircle size={32} />
                  </div>
                  <h3 className={styles.resultSuccessTitle}>Kompresi Berhasil!</h3>
                  <p className={styles.resultSuccessSubtitle}>PDF siap untuk diunduh</p>
                </div>

                <div className={styles.resultStatsGrid}>
                  <div className={styles.resultStatCard}>
                    <MdDescription size={24} />
                    <span className={styles.resultStatValue}>{formatFileSize(pdfResult?.originalSize || 0)}</span>
                    <span className={styles.resultStatLabel}>Ukuran Asli</span>
                  </div>
                  <div className={styles.resultStatCard}>
                    <MdCompress size={24} />
                    <span className={styles.resultStatValue}>{formatFileSize(pdfResult?.compressedSize || 0)}</span>
                    <span className={styles.resultStatLabel}>Ukuran Hasil</span>
                  </div>
                  <div className={styles.resultStatCard}>
                    <MdDataUsage size={24} />
                    <span className={styles.resultStatValue}>{pdfResult?.reductionPercentage}%</span>
                    <span className={styles.resultStatLabel}>Pengurangan</span>
                  </div>
                  <div className={styles.resultStatCard}>
                    <MdTimer size={24} />
                    <span className={styles.resultStatValue}>{elapsedTime}s</span>
                    <span className={styles.resultStatLabel}>Waktu Proses</span>
                  </div>
                </div>

                <div className={styles.resultFileInfo}>
                  <MdDescription size={20} />
                  <span className={styles.resultFileName}>{pdfResult?.filename}</span>
                </div>

                <div className={styles.resultActions}>
                  <Button
                    variant="primary"
                    icon={<MdDownload />}
                    onClick={handleDownload}
                    className={styles.actionBtn}
                  >
                    Download PDF
                  </Button>
                  
                  <Button
                    variant="outline"
                    icon={<MdRefresh />}
                    onClick={handleReset}
                    className={styles.actionBtn}
                  >
                    Kompres Lagi
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default KompresiPdf;
