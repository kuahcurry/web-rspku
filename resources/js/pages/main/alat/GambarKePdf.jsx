import { useRef, useState } from 'react';
import MainLayout from '../../../layout/main/MainLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import { MdCloudUpload, MdDelete, MdCheckCircle, MdPictureAsPdf, MdDownload, MdRefresh, MdDescription, MdImage, MdAspectRatio, MdMargin } from 'react-icons/md';
import { jsPDF } from 'jspdf';
import styles from '../../admin/alat/Alat.module.css';

function GambarKePdf() {
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('normal');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);
  const [isConverted, setIsConverted] = useState(false);

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
      const isPortrait = orientation === 'portrait';
      const pageWidth = isPortrait ? 210 : 297;
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
          reader.onload = (e) => resolve(e.target.result);
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
        
        let finalWidth, finalHeight;
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
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
      const filename = `admin_images_to_pdf_${timestamp}.pdf`;
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setPdfResult({
        blob: pdfBlob,
        url: pdfUrl,
        filename: filename,
        pageCount: images.length,
        fileSize: pdfBlob.size,
        orientation: orientation,
        margin: margin,
        createdAt: new Date(),
        imageNames: images.map(img => img.name),
        totalImageSize: images.reduce((acc, img) => acc + img.size, 0)
      });
      
      setIsConverted(true);
      setStatus(`✓ Berhasil! PDF dengan ${images.length} gambar siap diunduh.`);
    } catch (error) {
      setStatus('✗ Terjadi kesalahan saat konversi. Silakan coba lagi.');
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
    setImages([]);
    setOrientation('portrait');
    setMargin('normal');
    setStatus('');
  };

  const getMarginLabel = (marginValue) => {
    const labels = {
      none: 'Tanpa Margin',
      narrow: 'Sempit',
      normal: 'Normal'
    };
    return labels[marginValue] || marginValue;
  };

  const getOrientationLabel = (orientationValue) => {
    return orientationValue === 'portrait' ? 'Portrait (Vertikal)' : 'Landscape (Horizontal)';
  };

  return (
    <MainLayout>
      {/* Loading Overlay */}
      {isProcessing && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingModal}>
            <div className={styles.loadingSpinner}></div>
            <h3 className={styles.loadingTitle}>Mengonversi Gambar...</h3>
            <p className={styles.loadingText}>{status}</p>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill}></div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Gambar Ke PDF</h1>
          <p className={styles.pageSubtitle}>Ubah gambar dokumen pengguna menjadi format PDF standar.</p>
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
              <p className={styles.dropHint}>JPG, PNG, WebP · Pilih beberapa file</p>
              <Button
                variant="outline"
                icon={<MdCloudUpload />}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Pilih File
              </Button>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
            </div>

            {images.length > 0 && (
              <div className={styles.filePreviewList}>
                <div className={styles.fileListHeader}>
                  <span>{images.length} gambar dipilih</span>
                  <button 
                    className={styles.clearAllBtn}
                    onClick={() => setImages([])}
                  >
                    Hapus Semua
                  </button>
                </div>
                {images.map((img, index) => (
                  <div key={index} className={styles.fileItem}>
                    <MdCheckCircle className={styles.fileIcon} size={20} />
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{img.name}</span>
                      <span className={styles.fileMeta}>{formatFileSize(img.size)}</span>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(index)}
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className={styles.cardShell}>
            {!isConverted ? (
              <>
                <h3 className={styles.sectionTitle}>Pengaturan PDF</h3>
            
                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>Orientasi Halaman</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="orientation"
                        value="portrait"
                        checked={orientation === 'portrait'}
                        onChange={(e) => setOrientation(e.target.value)}
                      />
                      <span className={styles.radioText}>
                        <strong>Portrait</strong>
                        <small>Vertikal (A4)</small>
                      </span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="orientation"
                        value="landscape"
                        checked={orientation === 'landscape'}
                        onChange={(e) => setOrientation(e.target.value)}
                      />
                      <span className={styles.radioText}>
                        <strong>Landscape</strong>
                        <small>Horizontal (A4)</small>
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.settingLabel}>Margin</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="margin"
                        value="none"
                        checked={margin === 'none'}
                        onChange={(e) => setMargin(e.target.value)}
                      />
                      <span className={styles.radioText}>
                        <strong>Tanpa Margin</strong>
                      </span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="margin"
                        value="narrow"
                        checked={margin === 'narrow'}
                        onChange={(e) => setMargin(e.target.value)}
                      />
                      <span className={styles.radioText}>
                        <strong>Sempit</strong>
                      </span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="margin"
                        value="normal"
                        checked={margin === 'normal'}
                        onChange={(e) => setMargin(e.target.value)}
                      />
                      <span className={styles.radioText}>
                        <strong>Normal</strong>
                      </span>
                    </label>
                  </div>
                </div>

                <Button
                  variant="primary"
                  icon={<MdPictureAsPdf />}
                  onClick={handleConvert}
                  disabled={!images.length || isProcessing}
                  className={styles.actionBtn}
                >
                  {isProcessing ? 'Memproses...' : 'Konversi ke PDF'}
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
                  <h3 className={styles.resultSuccessTitle}>Konversi Berhasil!</h3>
                  <p className={styles.resultSuccessSubtitle}>PDF siap untuk diunduh</p>
                </div>

                <div className={styles.resultStatsGrid}>
                  <div className={styles.resultStatCard}>
                    <MdPictureAsPdf size={24} />
                    <span className={styles.resultStatValue}>{formatFileSize(pdfResult?.fileSize || 0)}</span>
                    <span className={styles.resultStatLabel}>Ukuran PDF</span>
                  </div>
                  <div className={styles.resultStatCard}>
                    <MdImage size={24} />
                    <span className={styles.resultStatValue}>{pdfResult?.pageCount}</span>
                    <span className={styles.resultStatLabel}>Halaman</span>
                  </div>
                  <div className={styles.resultStatCard}>
                    <MdAspectRatio size={24} />
                    <span className={styles.resultStatValue}>{pdfResult?.orientation === 'portrait' ? 'Portrait' : 'Landscape'}</span>
                    <span className={styles.resultStatLabel}>Orientasi</span>
                  </div>
                  <div className={styles.resultStatCard}>
                    <MdDescription size={24} />
                    <span className={styles.resultStatValue}>{getMarginLabel(pdfResult?.margin)}</span>
                    <span className={styles.resultStatLabel}>Margin</span>
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
                    Konversi Lagi
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

export default GambarKePdf;
