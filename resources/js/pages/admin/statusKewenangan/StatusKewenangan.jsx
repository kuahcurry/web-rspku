import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Input from '../../../components/input/Input';
import Banner from '../../../components/banner/Banner';
import { MdAdd, MdSave, MdVisibility, MdDelete, MdEdit, MdDownload, MdCloudUpload } from 'react-icons/md';
import { authenticatedFetch } from '../../../utils/auth';
import { formatDateToIndonesian } from '../../../utils/dateFormatter';
import styles from './StatusKewenangan.module.css';

const StatusKewenangan = () => {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fileRef = useRef(null);

  const [form, setForm] = useState({
    userId: '',
    jenis: 'SPK',
    tanggal_terbit: '',
    berlaku_sampai: '',
    file: null,
    fileUrl: null
  });

  useEffect(() => {
    fetchUsers();
    fetchData();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await authenticatedFetch('/api/admin/users/approved');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/admin/status-kewenangan');
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.map((it) => ({
          id: it.id,
          userId: it.user_id,
          userName: it.user_name,
          jenis: it.jenis,
          nomor_dokumen: it.nomor_dokumen,
          tanggal_terbit: it.tanggal_terbit,
          berlaku_sampai: it.berlaku_sampai,
          dokumenUrl: it.file_url
        }));
        setRecords(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return setBanner({ message: 'Hanya PDF', variant: 'error' });
    if (file.size > 2 * 1024 * 1024) return setBanner({ message: 'Maks 2MB', variant: 'error' });
    const url = URL.createObjectURL(file);
    setForm((p) => {
      if (p.fileUrl) URL.revokeObjectURL(p.fileUrl);
      return { ...p, file, fileUrl: url };
    });
    e.target.value = '';
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        userId: item.userId,
        jenis: item.jenis || 'SPK',
        tanggal_terbit: item.tanggal_terbit,
        berlaku_sampai: item.berlaku_sampai,
        file: null,
        fileUrl: item.dokumenUrl || null
      });
    } else {
      setEditingId(null);
      setForm({ userId: '', jenis: 'SPK', tanggal_terbit: '', berlaku_sampai: '', file: null, fileUrl: null });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.tanggal_terbit || !form.berlaku_sampai) return setBanner({ message: 'Lengkapi field', variant: 'error' });
    if (!editingId && !form.file) return setBanner({ message: 'Upload dokumen', variant: 'error' });
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('user_id', form.userId);
      fd.append('jenis', form.jenis);
      fd.append('tanggal_terbit', form.tanggal_terbit);
      fd.append('berlaku_sampai', form.berlaku_sampai);
      if (form.file) fd.append('file', form.file);

      const url = editingId ? `/api/admin/status-kewenangan/${editingId}` : '/api/admin/status-kewenangan';
      const res = await authenticatedFetch(url, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setBanner({ message: 'Tersimpan', variant: 'success' });
        setShowModal(false);
        fetchData();
      } else setBanner({ message: data.message || 'Gagal', variant: 'error' });
    } catch (e) {
      console.error(e);
      setBanner({ message: 'Terjadi kesalahan', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openView = (item) => {
    setViewItem(item);
    setShowViewModal(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('Hapus data ini?')) return;
    setIsSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/admin/status-kewenangan/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBanner({ message: 'Dihapus', variant: 'success' });
        fetchData();
      } else setBanner({ message: data.message || 'Gagal', variant: 'error' });
    } catch (e) {
      console.error(e);
      setBanner({ message: 'Terjadi kesalahan', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    const url = viewItem?.dokumenUrl;
    if (!url) return setBanner({ message: 'Dokumen belum tersedia', variant: 'error' });
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dokumen.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Manajemen Status Kewenangan</h1>
              <p className={styles.pageSubtitle}>Kelola status kewenangan pegawai berupa penambahan SPK/RKK</p>
            </div>
          </div>
        </header>

        <Card className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h2 className={styles.tableTitle}>Status Kewenangan SPK/RKK</h2>
            <div className={styles.tableActions}>
              <Button variant="success" onClick={() => openModal()}>
                <MdAdd size={20} /> Tambah
              </Button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner}></div><span>Memuat data...</span></div>
            ) : records.length === 0 ? (
              <div className={styles.emptyState}><h3>Tidak ada data</h3><p>Tambahkan status kewenangan baru</p></div>
            ) : (
              <table className={styles.table}><thead><tr><th>Pegawai</th><th>Jenis</th><th>Tanggal Terbit</th><th>Berlaku Sampai</th><th>Aksi</th></tr></thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className={styles.nameCell}><span className={styles.userName}>{r.userName}</span></td>
                      <td><span className={styles[`badge${r.jenis}`] || ''}>{r.jenis}</span></td>
                      <td>{formatDateToIndonesian(r.tanggal_terbit)}</td>
                      <td>{formatDateToIndonesian(r.berlaku_sampai)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={`${styles.iconButton} ${styles.iconButtonView}`} onClick={() => openView(r)} title="Lihat"><MdVisibility size={18} /><span className={styles.tooltip}>Lihat</span></button>
                          <button className={`${styles.iconButton} ${styles.iconButtonEdit}`} onClick={() => openModal(r)} title="Edit"><MdEdit size={18} /><span className={styles.tooltip}>Edit</span></button>
                          <button className={`${styles.iconButton} ${styles.iconButtonDelete}`} onClick={() => handleDelete(r)} title="Hapus"><MdDelete size={18} /><span className={styles.tooltip}>Hapus</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Status Kewenangan' : 'Tambah Status Kewenangan'}>
          <Form onSubmit={handleSave}>
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <label>Pegawai <span className={styles.required}>*</span></label>
                <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className={styles.formSelect} required>
                  <option value="">Pilih Pegawai</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} - {u.nip}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Jenis <span className={styles.required}>*</span></label>
                <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} className={styles.formSelect} required>
                  <option value="SPK">SPK (Surat Penugasan Klinis)</option>
                  <option value="RKK">RKK (Rincian Kewenangan Klinis)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Tanggal Terbit <span className={styles.required}>*</span></label>
                <Input type="date" value={form.tanggal_terbit} onChange={(e) => setForm({ ...form, tanggal_terbit: e.target.value })} required />
              </div>

              <div className={styles.formGroup}>
                <label>Berlaku Sampai <span className={styles.required}>*</span></label>
                <Input type="date" value={form.berlaku_sampai} onChange={(e) => setForm({ ...form, berlaku_sampai: e.target.value })} required />
              </div>

              <div className={styles.formGroupFull}>
                <label>Dokumen Pendukung {!editingId && <span className={styles.required}>*</span>}</label>
                <div className={styles.fileDrop} onClick={() => fileRef.current?.click()}>
                  <MdCloudUpload size={32} className={styles.fileDropIcon} />
                  <p className={styles.fileDropTitle}>Pilih atau seret file ke sini</p>
                  <span className={styles.fileDropHint}>PDF, maks 2MB</span>
                  {form.file?.name && <span className={styles.fileDropFileName}>{form.file.name}</span>}
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} className="u-hidden" />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}><MdSave size={18} />{isSubmitting ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
          </Form>
        </Modal>

        <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Detail Status Kewenangan">
          {viewItem && (
            <div className={styles.detailView}>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}><span className={styles.detailLabel}>Pegawai</span><span className={styles.detailValue}>{viewItem.userName}</span></div>                <div className={styles.detailRow}><span className={styles.detailLabel}>Jenis</span><span className={styles.detailValue}>{viewItem.jenis}</span></div>                <div className={styles.detailRow}><span className={styles.detailLabel}>Tanggal Terbit</span><span className={styles.detailValue}>{formatDateToIndonesian(viewItem.tanggal_terbit)}</span></div>
                <div className={styles.detailRow}><span className={styles.detailLabel}>Berlaku Sampai</span><span className={styles.detailValue}>{formatDateToIndonesian(viewItem.berlaku_sampai)}</span></div>
              </div>
              {viewItem.dokumenUrl && (<div className={styles.pdfSection}><h4>Dokumen</h4><iframe src={viewItem.dokumenUrl} className={styles.pdfFrame} title="Dokumen PDF" /></div>)}
              <div className={styles.modalFooter}>
                <Button variant="outline" onClick={() => setShowViewModal(false)}>Tutup</Button>
                {viewItem.dokumenUrl && <Button variant="success" onClick={handleDownload}><MdDownload size={18} />Download</Button>}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};
export default StatusKewenangan;