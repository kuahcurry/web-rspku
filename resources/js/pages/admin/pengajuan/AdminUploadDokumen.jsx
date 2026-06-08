import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Banner from '../../../components/banner/Banner';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import {
  MdUpload,
  MdCloudUpload,
  MdCheckCircle,
  MdClose,
  MdDescription,
  MdPerson,
  MdAssignment,
  MdCalendarToday
} from 'react-icons/md';
import { isAuthenticated, authenticatedFetch } from '../../../utils/auth';
import { formatDateToIndonesian } from '../../../utils/dateFormatter';
import styles from './AdminUploadDokumen.module.css';

const getStatusBadge = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'disetujui') return { label: 'Disetujui', className: styles.statusSuccess };
  if (normalized === 'ditolak') return { label: 'Ditolak', className: styles.statusDanger };
  if (normalized === 'diproses') return { label: 'Diproses', className: styles.statusWarning };
  if (normalized === 'diajukan') return { label: 'Diajukan', className: styles.statusInfo };
  return { label: status || '-', className: styles.statusNeutral };
};

const AdminUploadDokumen = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // All pengajuan fetched from API
  const [allPengajuan, setAllPengajuan] = useState([]);

  // Cascading selections
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');       // 'kredensial' | 'kewenangan_klinik'
  const [selectedPengajuanId, setSelectedPengajuanId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileUrl, setUploadFileUrl] = useState(null);
  const [tanggalBerlaku, setTanggalBerlaku] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    fetchAllPengajuan();
  }, [navigate]);

  const fetchAllPengajuan = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch('/api/admin/pengajuan-kredensial');
      const result = await res.json();
      if (res.ok && result.success) {
        setAllPengajuan(result.data || []);
      } else {
        setBanner({ message: result.message || 'Gagal memuat data pengajuan', variant: 'error' });
      }
    } catch {
      setBanner({ message: 'Gagal memuat data pengajuan', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Derive unique user list
  const userOptions = useMemo(() => {
    const map = new Map();
    allPengajuan.forEach(p => {
      if (p.user_id && !map.has(p.user_id)) {
        map.set(p.user_id, p.nama_pemohon || `Pengguna #${p.user_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allPengajuan]);

  // Filtered by selected user
  const pengajuanForUser = useMemo(() => {
    if (!selectedUserId) return [];
    return allPengajuan.filter(p => String(p.user_id) === String(selectedUserId));
  }, [allPengajuan, selectedUserId]);

  // Jenis options derived from user's pengajuan
  const jenisOptions = useMemo(() => {
    const types = new Set(pengajuanForUser.map(p => p.tipe_pengajuan || 'kredensial'));
    const result = [];
    if (types.has('kredensial')) result.push({ value: 'kredensial', label: 'Pengajuan Kredensial' });
    if (types.has('kewenangan_klinik')) result.push({ value: 'kewenangan_klinik', label: 'Kewenangan Klinik' });
    return result;
  }, [pengajuanForUser]);

  // Filtered by jenis
  const pengajuanOptions = useMemo(() => {
    if (!selectedJenis) return [];
    return pengajuanForUser.filter(p => (p.tipe_pengajuan || 'kredensial') === selectedJenis);
  }, [pengajuanForUser, selectedJenis]);

  const selectedPengajuan = useMemo(
    () => allPengajuan.find(p => String(p.id) === String(selectedPengajuanId)) || null,
    [allPengajuan, selectedPengajuanId]
  );

  const handleUserChange = (e) => {
    setSelectedUserId(e.target.value);
    setSelectedJenis('');
    setSelectedPengajuanId('');
  };

  const handleJenisChange = (e) => {
    setSelectedJenis(e.target.value);
    setSelectedPengajuanId('');
  };

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
    if (file.type !== 'application/pdf') {
      setBanner({ message: 'Hanya file PDF yang diperbolehkan', variant: 'error' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setBanner({ message: 'File terlalu besar. Maksimal 20MB', variant: 'error' });
      if (eventRef?.target) eventRef.target.value = '';
      return;
    }
    if (uploadFileUrl) URL.revokeObjectURL(uploadFileUrl);
    const blobUrl = URL.createObjectURL(file);
    setUploadFile(file);
    setUploadFileUrl(blobUrl);
  };

  const isFormValid = selectedUserId && selectedJenis && selectedPengajuanId && uploadFile && tanggalBerlaku;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setBanner({ message: 'Mohon lengkapi semua field dan upload dokumen', variant: 'warning' });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmUpload = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('hasil_dokumen', uploadFile);
      formData.append('berlaku_sampai', tanggalBerlaku);

      const res = await authenticatedFetch(
        `/api/admin/pengajuan-kredensial/${selectedPengajuanId}/upload-hasil`,
        { method: 'POST', body: formData }
      );
      const result = await res.json();

      if (res.ok && result.success) {
        setBanner({
          message: `Dokumen berhasil diupload dan dikirim ke ${selectedPengajuan?.nama_pemohon}`,
          variant: 'success'
        });
        setShowConfirmModal(false);
        // Reset form
        setSelectedUserId('');
        setSelectedJenis('');
        setSelectedPengajuanId('');
        setUploadFile(null);
        if (uploadFileUrl) URL.revokeObjectURL(uploadFileUrl);
        setUploadFileUrl(null);
        setTanggalBerlaku('');
        // Refresh data to reflect updated status
        fetchAllPengajuan();
      } else {
        setBanner({ message: result.message || 'Gagal mengupload dokumen', variant: 'error' });
        setShowConfirmModal(false);
      }
    } catch {
      setBanner({ message: 'Terjadi kesalahan saat mengupload dokumen', variant: 'error' });
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>

        {/* Page Header */}
        <header className={styles.pageHeader}>
          {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Upload Dokumen Pengajuan</h1>
              <p className={styles.pageSubtitle}>
                Upload dokumen pengajuan yang telah diproses dan disetujui kepada pengguna
              </p>
            </div>
          </div>
        </header>

        <div className={styles.contentGrid}>

          {/* Upload Form Card */}
          <Card className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <MdUpload size={22} />
              <h3>Upload Dokumen</h3>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>

              {/* Step 1: Pilih Pengguna */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span className={styles.stepBadge}>1</span>
                  Pilih Pengguna
                </label>
                {loading ? (
                  <div className={styles.loadingSelect}>Memuat data pengguna...</div>
                ) : (
                  <select
                    className={styles.select}
                    value={selectedUserId}
                    onChange={handleUserChange}
                  >
                    <option value="">-- Pilih pengguna --</option>
                    {userOptions.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 2: Jenis Pengajuan */}
              <div className={styles.formGroup}>
                <label className={`${styles.formLabel} ${!selectedUserId ? styles.formLabelDisabled : ''}`}>
                  <span className={styles.stepBadge}>2</span>
                  Jenis Pengajuan
                </label>
                <select
                  className={styles.select}
                  value={selectedJenis}
                  onChange={handleJenisChange}
                  disabled={!selectedUserId}
                >
                  <option value="">-- Pilih jenis pengajuan --</option>
                  {jenisOptions.map(j => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
                {selectedUserId && jenisOptions.length === 0 && (
                  <p className={styles.emptyHint}>Pengguna ini belum memiliki pengajuan.</p>
                )}
              </div>

              {/* Step 3: Pilih Pengajuan */}
              <div className={styles.formGroup}>
                <label className={`${styles.formLabel} ${!selectedJenis ? styles.formLabelDisabled : ''}`}>
                  <span className={styles.stepBadge}>3</span>
                  Pilih Pengajuan
                </label>
                <select
                  className={styles.select}
                  value={selectedPengajuanId}
                  onChange={e => setSelectedPengajuanId(e.target.value)}
                  disabled={!selectedJenis}
                >
                  <option value="">-- Pilih pengajuan --</option>
                  {pengajuanOptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nomor_pengajuan} — {p.jenis_kredensial || '-'} ({p.status})
                    </option>
                  ))}
                </select>
                {selectedJenis && pengajuanOptions.length === 0 && (
                  <p className={styles.emptyHint}>Tidak ada pengajuan untuk jenis ini.</p>
                )}
              </div>

              {/* Selected pengajuan info */}
              {selectedPengajuan && (
                <div className={styles.selectedInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nomor Pengajuan</span>
                    <span className={styles.infoValue}>{selectedPengajuan.nomor_pengajuan}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nama Pemohon</span>
                    <span className={styles.infoValue}>{selectedPengajuan.nama_pemohon}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Jenis Kredensial</span>
                    <span className={styles.infoValue}>{selectedPengajuan.jenis_kredensial || '-'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Tanggal Pengajuan</span>
                    <span className={styles.infoValue}>{formatDateToIndonesian(selectedPengajuan.created_at)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Status Saat Ini</span>
                    <span className={`${styles.statusBadge} ${getStatusBadge(selectedPengajuan.status).className}`}>
                      {getStatusBadge(selectedPengajuan.status).label}
                    </span>
                  </div>
                  {selectedPengajuan.hasil_dokumen_name && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Dokumen Sebelumnya</span>
                      <span className={styles.infoValue + ' ' + styles.existingDoc}>
                        ⚠️ {selectedPengajuan.hasil_dokumen_name} sudah ada. Upload baru akan mengganti.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Upload Dokumen */}
              <div className={styles.formGroup}>
                <label className={`${styles.formLabel} ${!selectedPengajuanId ? styles.formLabelDisabled : ''}`}>
                  <span className={styles.stepBadge}>4</span>
                  Upload Dokumen Hasil (PDF)
                </label>
                <div
                  className={`${styles.fileDrop} ${!selectedPengajuanId ? styles.fileDropDisabled : ''} ${uploadFile ? styles.fileDropHasFile : ''}`}
                  onClick={() => selectedPengajuanId && fileInputRef.current?.click()}
                  onDrop={selectedPengajuanId ? handleFileDrop : undefined}
                  onDragOver={selectedPengajuanId ? (e) => e.preventDefault() : undefined}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="u-hidden"
                    disabled={!selectedPengajuanId}
                  />
                  {uploadFile ? (
                    <div className={styles.fileInfo}>
                      <MdDescription size={32} className={styles.fileIcon} />
                      <div className={styles.fileDetails}>
                        <span className={styles.fileName}>{uploadFile.name}</span>
                        <span className={styles.fileSize}>{(uploadFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button
                        type="button"
                        className={styles.removeFile}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          if (uploadFileUrl) URL.revokeObjectURL(uploadFileUrl);
                          setUploadFileUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <MdClose size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.filePrompt}>
                      <MdCloudUpload size={40} className={styles.uploadIcon} />
                      <span className={styles.uploadText}>
                        {selectedPengajuanId
                          ? 'Klik atau seret file PDF ke sini'
                          : 'Pilih pengajuan terlebih dahulu'}
                      </span>
                      <span className={styles.uploadHint}>PDF, maks. 20MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 5: Tanggal Berlaku */}
              <div className={styles.formGroup}>
                <label className={`${styles.formLabel} ${!uploadFile ? styles.formLabelDisabled : ''}`}>
                  <span className={styles.stepBadge}>5</span>
                  Tanggal Berlaku Dokumen
                </label>
                <input
                  type="date"
                  className={styles.select}
                  value={tanggalBerlaku}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={e => setTanggalBerlaku(e.target.value)}
                  disabled={!uploadFile}
                />
                <p className={styles.fieldHint}>Tanggal berakhirnya masa berlaku dokumen Kredensial atau Kewenangan Klinik yang diupload</p>
              </div>

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="success"
                  size="large"
                  icon={<MdUpload />}
                  iconPosition="left"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? 'Mengupload...' : 'Upload Dokumen'}
                </Button>
              </div>
            </form>
          </Card>

        </div>

        {/* Confirm Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => !isSubmitting && setShowConfirmModal(false)}
          title="Konfirmasi Upload Dokumen"
          size="medium"
        >
          <div className={styles.confirmContent}>
            <div className={styles.confirmIcon}>
              <MdCheckCircle size={48} className={styles.confirmIconSuccess} />
            </div>
            <p className={styles.confirmMessage}>
              Dokumen akan dikirimkan kepada pengguna berikut:
            </p>
            {selectedPengajuan && (
              <div className={styles.confirmInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><MdPerson size={16} /> Pengguna</span>
                  <span className={styles.infoValue}>{selectedPengajuan.nama_pemohon}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><MdAssignment size={16} /> Nomor Pengajuan</span>
                  <span className={styles.infoValue}>{selectedPengajuan.nomor_pengajuan}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><MdDescription size={16} /> Dokumen</span>
                  <span className={styles.infoValue}>{uploadFile?.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><MdCalendarToday size={16} /> Berlaku Sampai</span>
                  <span className={styles.infoValue}>
                    {tanggalBerlaku
                      ? new Date(tanggalBerlaku).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'}
                  </span>
                </div>
              </div>
            )}
            <p className={styles.confirmNote}>
              Status pengajuan akan otomatis diubah menjadi <strong>Disetujui</strong>.
            </p>
            <div className={styles.confirmActions}>
              <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="success" onClick={handleConfirmUpload} disabled={isSubmitting}>
                {isSubmitting ? 'Mengupload...' : 'Ya, Kirim Dokumen'}
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </AdminLayout>
  );
};

export default AdminUploadDokumen;
