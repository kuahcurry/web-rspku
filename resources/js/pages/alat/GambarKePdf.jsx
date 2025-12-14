import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import { MdCloudUpload, MdDelete, MdCheckCircle, MdDownload } from 'react-icons/md';
import { jsPDF } from 'jspdf';
import { isAuthenticated } from '../../utils/auth';
import StatusBanner from '../../components/status/StatusBanner';
import styles from './alat.module.css';

function GambarKePdf() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('normal');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputPdf, setOutputPdf] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [banner, setBanner] = useState({ message: '', type: 'info' });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_TOTAL = 50 * 1024 * 1024; // 50MB total
    let currentTotal = images.reduce((sum, file) => sum + (file?.size || 0), 0);

    const accepted = [];

    for (const file of incoming) {
      if (!allowedTypes.includes(file.type)) {
        setStatus('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.');
        continue;
      }

      if (file.size + currentTotal > MAX_TOTAL) {
        setStatus('Total ukuran file melebihi batas 50MB. Kurangi file yang dipilih.');
        continue;
      }

      currentTotal += file.size;
      accepted.push(file);
    }

    if (!accepted.length) return;

    setImages((prev) => [...prev, ...accepted]);
    setStatus('');
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer?.files);
  };

  const handleRemove = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (!images.length) {
      setStatus('Tambahkan minimal 1 gambar untuk dikonversi.');
      return;
    }
    if (outputPdf?.url) {
      URL.revokeObjectURL(outputPdf.url);
    }

    setIsProcessing(true);
    setStatus('Mengonversi gambar menjadi PDF...');
    setElapsedTime(0);
    const startTime = Date.now();

    try {
      const isPortrait = orientation === 'portrait';
      const pageWidth = isPortrait ? 210 : 297;  // A4 in mm
      const pageHeight = isPortrait ? 297 : 210;

      const marginValues = {
        none: 0,
        narrow: 10,
        normal: 20
      };
      const marginSize = marginValues[margin];

      const pdf = new jsPDF({
        orientation: orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: 'a4'
      });

      pdf.deletePage(1);

      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(img);
        });

        const imgDimensions = await new Promise((resolve) => {
          const image = new Image();
          image.onload = () => {
            resolve({ width: image.width, height: image.height });
          };
          image.src = dataUrl;
        });

        pdf.addPage('a4', orientation === 'portrait' ? 'p' : 'l');

        const availableWidth = pageWidth - (2 * marginSize);
        const availableHeight = pageHeight - (2 * marginSize);

        const imgRatio = imgDimensions.width / imgDimensions.height;
        const availableRatio = availableWidth / availableHeight;

        let finalWidth;
        let finalHeight;
        if (imgRatio > availableRatio) {
          finalWidth = availableWidth;
          finalHeight = availableWidth / imgRatio;
        } else {
          finalHeight = availableHeight;
          finalWidth = availableHeight * imgRatio;
        }

        const x = marginSize + (availableWidth - finalWidth) / 2;
        const y = marginSize + (availableHeight - finalHeight) / 2;

        pdf.addImage(dataUrl, 'JPEG', x, y, finalWidth, finalHeight);

        setStatus(`Memproses gambar ${i + 1} dari ${images.length}...`);
      }

      const endTime = Date.now();
      setElapsedTime(((endTime - startTime) / 1000).toFixed(1));

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
      const filename = `images_to_pdf_${timestamp}.pdf`;

      const blob = pdf.output('blob');
      const downloadUrl = URL.createObjectURL(blob);
      setOutputPdf({
        name: filename,
        pages: images.length,
        sizeKb: (blob.size / 1024).toFixed(1),
        url: downloadUrl
      });

      const successMsg = `Berhasil! PDF dengan ${images.length} gambar siap diunduh dari panel ringkasan.`;
      setStatus(successMsg);
      setBanner({ message: successMsg, type: 'success' });
    } catch (error) {
      console.error('Error converting images to PDF:', error);
      setStatus('Terjadi kesalahan saat konversi. Silakan coba lagi.');
      setBanner({ message: 'Terjadi kesalahan saat konversi.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputPdf?.url) return;
    const link = document.createElement('a');
    link.href = outputPdf.url;
    link.download = outputPdf.name;
    link.click();
    setStatus('Mengunduh PDF (simulasi)...');
  };

  const totalSizeKb = images.reduce((sum, file) => sum + (file?.size || 0), 0) / 1024;

  return (
    <MainLayout>
      <div className={styles.bannerArea}>
        <StatusBanner
          message={banner.message || status}
          type={banner.type}
          onClose={() => {
            setBanner({ message: '', type: 'info' });
            setStatus('');
          }}
        />
      </div>
      {isProcessing && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingModal}>
            <div className={styles.loadingSpinner}></div>
            <h3 className={styles.loadingTitle}>Mengonversi gambar...</h3>
            <p className={styles.loadingText}>Mohon tunggu, kami sedang menyiapkan PDF.</p>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill}></div>
            </div>
          </div>
        </div>
      )}

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gambar ke PDF</h1>
        <p className={styles.pageSubtitle}>Ubah kumpulan gambar menjadi satu file PDF.</p>
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
            <p className={styles.dropTitle}>Pilih atau seret gambar ke sini</p>
            <p className={styles.dropHint}>JPG, PNG, atau WEBP • multiple files • maks 50MB total</p>
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
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {images.length > 0 && (
            <div className={styles.fileList}>
              {images.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileMeta}>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleRemove(idx)}
                    aria-label="Hapus"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.optionsRow}>
            <div className={styles.optionBlock}>
              <p className={styles.optionLabel}>Orientasi</p>
              <div className={styles.chipGroup}>
                <button
                  className={`${styles.chip} ${orientation === 'portrait' ? styles.chipActive : ''}`}
                  onClick={() => setOrientation('portrait')}
                >
                  Potret
                </button>
                <button
                  className={`${styles.chip} ${orientation === 'landscape' ? styles.chipActive : ''}`}
                  onClick={() => setOrientation('landscape')}
                >
                  Landscape
                </button>
              </div>
            </div>
            <div className={styles.optionBlock}>
              <p className={styles.optionLabel}>Margin</p>
              <select
                className={styles.select}
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
              >
                <option value="none">Tanpa margin</option>
                <option value="narrow">Sedikit</option>
                <option value="normal">Standar</option>
              </select>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="success"
              size="large"
              icon={<MdCheckCircle />}
              onClick={handleConvert}
              disabled={isProcessing}
            >
              {isProcessing ? 'Memproses...' : 'Mulai Konversi'}
            </Button>
            <Button
              variant="danger"
              type="button"
              size='large'
              icon={<MdDelete />}
              onClick={() => {
                setImages([]);
                setStatus('');
                setElapsedTime(0);
                if (outputPdf?.url) {
                  URL.revokeObjectURL(outputPdf.url);
                }
                setOutputPdf(null);
              }}
              disabled={!images.length || isProcessing}
            >
              Bersihkan
            </Button>
          </div>

          {status && (
            <div className={`${styles.status} ${status.toLowerCase().includes('kesalahan') || status.toLowerCase().includes('melebihi') ? styles.statusError : ''}`}>
              {status}
            </div>
          )}
        </Card>

        <Card className={styles.cardShell}>
          <p className={styles.optionLabel}>Ringkasan</p>
          <ul className={styles.summaryList}>
            <li>
              <span>Status file</span>
              <span>{images.length ? 'Siap dikonversi' : 'Belum ada file'}</span>
            </li>
            <li>
              <span>Total gambar</span>
              <span>{images.length} file</span>
            </li>
            <li>
              <span>Total ukuran</span>
              <span>{totalSizeKb ? `${totalSizeKb.toFixed(1)} KB` : '-'}</span>
            </li>
            <li>
              <span>Orientasi</span>
              <span>{orientation === 'portrait' ? 'Potret' : 'Landscape'}</span>
            </li>
            <li>
              <span>Margin</span>
              <span>
                {margin === 'none' ? 'Tanpa margin' : margin === 'narrow' ? 'Sedikit' : 'Standar'}
              </span>
            </li>
            <li>
              <span>Perkiraan halaman</span>
              <span>{Math.max(images.length, 1)} halaman</span>
            </li>
            <li>
              <span>Waktu proses</span>
              <span>{elapsedTime > 0 ? `${elapsedTime} detik` : '-'}</span>
            </li>
            <li>
              <span>Output</span>
              <span>{outputPdf ? outputPdf.name : 'Belum ada file hasil konversi.'}</span>
            </li>
          </ul>
          {outputPdf && (
            <div className={styles.actions}>
              <Button
                variant="outline"
                icon={<MdDownload />}
                onClick={handleDownload}
                disabled={isProcessing}
              >
                Download PDF
              </Button>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

export default GambarKePdf;
