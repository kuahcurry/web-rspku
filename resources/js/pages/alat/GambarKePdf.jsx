import { useRef, useState } from 'react';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import { MdCloudUpload, MdDelete, MdCheckCircle } from 'react-icons/md';
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

  const handleConvert = () => {
    if (!images.length) {
      setStatus('Tambahkan minimal 1 gambar untuk dikonversi.');
      return;
    }
    setIsProcessing(true);
    setStatus('Mengonversi gambar menjadi PDF...');
    setTimeout(() => {
      setIsProcessing(false);
      setStatus('Selesai! PDF siap diunduh (simulasi).');
    }, 1200);
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
          <div
            className={styles.summaryDrop}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div>
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
            </div>
            <div className={styles.summaryHint}>
              <p>Seret gambar ke sini juga bisa.</p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

export default GambarKePdf;
