import { useEffect, useState } from 'react';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Banner from '../../../components/banner/Banner';
import { authenticatedFetch, getAuthHeader } from '../../../utils/auth';
import { MdBackup, MdDownload, MdRefresh, MdStorage, MdCloudUpload } from 'react-icons/md';
import styles from './BackupManajemen.module.css';

const BackupManajemen = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [backups, setBackups] = useState([]);
  const [latest, setLatest] = useState(null);
  const [banner, setBanner] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
      setIsSuperAdmin(admin?.role === 'super_admin');
    } catch {
      setIsSuperAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBackups();
    }
  }, [isSuperAdmin]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/backups');
      const data = await response.json();

      if (!response.ok || !data.success) {
        setBanner({ variant: 'error', message: data.message || 'Gagal memuat data backup' });
        return;
      }

      setBackups(data.data || []);
      setLatest(data.latest || null);
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || 'Gagal memuat data backup' });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (mode = 'full') => {
    try {
      setSubmitting(true);
      const response = await authenticatedFetch('/api/admin/backups/create', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setBanner({ variant: 'error', message: data.message || 'Gagal membuat backup' });
        return;
      }

      setBanner({ variant: 'success', message: 'Backup berhasil dibuat' });
      await fetchBackups();
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || 'Gagal membuat backup' });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadLatest = async (type = 'full') => {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`/api/admin/backups/latest/download?type=${encodeURIComponent(type)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/octet-stream',
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        let message = 'Gagal mengunduh backup terbaru';
        try {
          const data = await response.json();
          message = data?.message || message;
        } catch {}
        setBanner({ variant: 'error', message });
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const filename = match?.[1] || `backup_latest_${type}.bin`;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      setBanner({ variant: 'success', message: 'Backup berhasil diunduh' });
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || 'Gagal mengunduh backup terbaru' });
    }
  };

  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <Card title="Backup Sistem">
            <p className={styles.muted}>Fitur ini hanya untuk Super Admin.</p>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}

        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Backup Sistem</h1>
            <p className={styles.pageSubtitle}>Kelola backup database dan file storage secara cepat.</p>
          </div>
          <Button
            variant="secondary"
            icon={<MdRefresh size={16} />}
            onClick={fetchBackups}
            disabled={loading || submitting}
          >
            Refresh
          </Button>
        </header>

        <Card title="Aksi Cepat" subtitle="Buat backup baru atau unduh backup terbaru.">
          <div className={styles.actions}>
            <Button
              variant="primary"
              icon={<MdBackup size={16} />}
              onClick={() => createBackup('full')}
              disabled={submitting}
              loading={submitting}
            >
              Buat Backup Penuh
            </Button>
            <Button
              variant="warning"
              icon={<MdStorage size={16} />}
              onClick={() => createBackup('db-only')}
              disabled={submitting}
            >
              Backup DB Saja
            </Button>
            <Button
              variant="warning"
              icon={<MdCloudUpload size={16} />}
              onClick={() => createBackup('files-only')}
              disabled={submitting}
            >
              Backup File Saja
            </Button>
          </div>

          <div className={styles.actions}>
            <Button variant="success" icon={<MdDownload size={16} />} onClick={() => downloadLatest('full')}>
              Unduh Backup Terbaru (Full)
            </Button>
            <Button variant="success" icon={<MdDownload size={16} />} onClick={() => downloadLatest('db')}>
              Unduh DB Terbaru
            </Button>
            <Button variant="success" icon={<MdDownload size={16} />} onClick={() => downloadLatest('files')}>
              Unduh File Terbaru
            </Button>
          </div>
        </Card>

        <Card title="Backup Terbaru">
          {latest ? (
            <div className={styles.latestBox}>
              <p><strong>Folder:</strong> {latest.name}</p>
              <p><strong>Dibuat:</strong> {new Date(latest.created_at).toLocaleString('id-ID')}</p>
              <p><strong>Database:</strong> {latest.has_database ? 'Ya' : 'Tidak'}</p>
              <p><strong>Storage:</strong> {latest.has_files ? 'Ya' : 'Tidak'}</p>
            </div>
          ) : (
            <p className={styles.muted}>Belum ada backup.</p>
          )}
        </Card>

        <Card title="Riwayat Backup">
          {loading ? (
            <p className={styles.muted}>Memuat riwayat backup...</p>
          ) : backups.length === 0 ? (
            <p className={styles.muted}>Belum ada backup tersedia.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Folder</th>
                    <th>Waktu</th>
                    <th>DB</th>
                    <th>Files</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{new Date(item.created_at).toLocaleString('id-ID')}</td>
                      <td>{item.has_database ? 'Ya' : 'Tidak'}</td>
                      <td>{item.has_files ? 'Ya' : 'Tidak'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BackupManajemen;
