import { useEffect, useState } from 'react';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Banner from '../../../components/banner/Banner';
import { authenticatedFetch } from '../../../utils/auth';
import { MdBuild, MdPowerSettingsNew } from 'react-icons/md';
import styles from './MaintenanceControl.module.css';

const MaintenanceControl = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [banner, setBanner] = useState(null);

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
      fetchStatus();
    }
  }, [isSuperAdmin]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/maintenance/status');
      const data = await response.json();

      if (!response.ok || !data.success) {
        setBanner({ variant: 'error', message: data.message || 'Gagal memuat status maintenance' });
        return;
      }

      setEnabled(Boolean(data.maintenance));
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || 'Gagal memuat status maintenance' });
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async (next) => {
    const confirmText = next
      ? 'Aktifkan maintenance mode? Seluruh layanan API akan ditutup sementara.'
      : 'Nonaktifkan maintenance mode dan buka layanan kembali?';

    if (!window.confirm(confirmText)) return;

    try {
      setSubmitting(true);
      const response = await authenticatedFetch('/api/admin/maintenance/toggle', {
        method: 'POST',
        body: JSON.stringify({ enabled: next }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setBanner({ variant: 'error', message: data.message || 'Gagal mengubah mode maintenance' });
        return;
      }

      setEnabled(Boolean(data.maintenance));
      setBanner({
        variant: 'success',
        message: data.maintenance ? 'Maintenance mode aktif' : 'Maintenance mode nonaktif',
      });
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || 'Gagal mengubah mode maintenance' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <Card title="Maintenance Control">
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
            <h1 className={styles.pageTitle}>Maintenance Control</h1>
            <p className={styles.pageSubtitle}>Aktifkan/nonaktifkan status maintenance website.</p>
          </div>
        </header>

        <Card title="Status Maintenance" subtitle="Satu klik untuk menutup/membuka layanan.">
          {loading ? (
            <p className={styles.muted}>Memuat status...</p>
          ) : (
            <>
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${enabled ? styles.on : styles.off}`}>
                  {enabled ? 'AKTIF' : 'NONAKTIF'}
                </span>
                <p className={styles.statusText}>
                  {enabled
                    ? 'Website saat ini dalam mode maintenance.'
                    : 'Website saat ini beroperasi normal.'}
                </p>
              </div>

              <div className={styles.actionRow}>
                {!enabled ? (
                  <Button
                    variant="danger"
                    icon={<MdBuild size={16} />}
                    onClick={() => toggleMaintenance(true)}
                    disabled={submitting}
                    loading={submitting}
                  >
                    Aktifkan Maintenance
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    icon={<MdPowerSettingsNew size={16} />}
                    onClick={() => toggleMaintenance(false)}
                    disabled={submitting}
                    loading={submitting}
                  >
                    Nonaktifkan Maintenance
                  </Button>
                )}

                <Button variant="secondary" onClick={fetchStatus} disabled={submitting}>
                  Refresh Status
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default MaintenanceControl;
