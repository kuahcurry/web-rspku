import { useRef, useState } from 'react';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import { MdCloudUpload, MdDelete, MdCheckCircle } from 'react-icons/md';
import { jsPDF } from 'jspdf';
import styles from './alat.module.css';

function GambarKePdf() {
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('normal');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (fileList) => {
    const accepted = Array.from(fileList || []).filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    );

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
    
    setIsProcessing(true);
    setStatus('Mengonversi gambar menjadi PDF...');
    
    try {
      // Page dimensions based on orientation
      const isPortrait = orientation === 'portrait';
      const pageWidth = isPortrait ? 210 : 297;  // A4 in mm
      const pageHeight = isPortrait ? 297 : 210;
      
      // Margin values in mm
      const marginValues = {
        none: 0,
        narrow: 10,
        normal: 20
      };
      const marginSize = marginValues[margin];
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: 'a4'
      });
      
      // Remove first page (jsPDF creates one by default)
      pdf.deletePage(1);
      
      // Process each image
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // Read image as data URL
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(img);
        });
        
        // Get image dimensions
        const imgDimensions = await new Promise((resolve) => {
          const image = new Image();
          image.onload = () => {
            resolve({ width: image.width, height: image.height });
          };
          image.src = dataUrl;
        });
        
        // Add new page
        pdf.addPage('a4', orientation === 'portrait' ? 'p' : 'l');
        
        // Calculate available space
        const availableWidth = pageWidth - (2 * marginSize);
        const availableHeight = pageHeight - (2 * marginSize);
        
        // Calculate scaling to fit image in available space
        const imgRatio = imgDimensions.width / imgDimensions.height;
        const availableRatio = availableWidth / availableHeight;
        
        let finalWidth, finalHeight;
        if (imgRatio > availableRatio) {
          // Image is wider - fit to width
          finalWidth = availableWidth;
          finalHeight = availableWidth / imgRatio;
        } else {
          // Image is taller - fit to height
          finalHeight = availableHeight;
          finalWidth = availableHeight * imgRatio;
        }
        
        // Center image on page
        const x = marginSize + (availableWidth - finalWidth) / 2;
        const y = marginSize + (availableHeight - finalHeight) / 2;
        
        // Add image to PDF
        pdf.addImage(dataUrl, 'JPEG', x, y, finalWidth, finalHeight);
        
        setStatus(`Memproses gambar ${i + 1} dari ${images.length}...`);
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
      const filename = `images_to_pdf_${timestamp}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
      setStatus(`✓ Berhasil! PDF dengan ${images.length} gambar telah diunduh.`);
    } catch (error) {
      console.error('Error converting images to PDF:', error);
      setStatus('✗ Terjadi kesalahan saat konversi. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MainLayout>
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
            <p className={styles.dropHint}>JPG, PNG, atau WEBP · multiple files</p>
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
              }}
              disabled={!images.length || isProcessing}
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
              <span>Total gambar</span>
              <span>{images.length} file</span>
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
          </ul>
          <div className={styles.helperBox}>
            <MdCheckCircle size={18} />
            <p>Konversi dilakukan secara lokal (simulasi). Unggah gambar setelah fitur backend siap.</p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

export default GambarKePdf;
