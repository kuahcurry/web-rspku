import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Input from '../../../components/input/Input';
import Modal from '../../../components/modal/Modal';
import { 
  MdPerson,
  MdEmail,
  MdLock,
  MdSave,
  MdInfo,
  MdCheck,
  MdVisibility,
  MdVisibilityOff
} from 'react-icons/md';
import { authenticatedFetch } from '../../../utils/auth';
import styles from './PengaturanSistem.module.css';

const PengaturanAkun = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ message: '', type: '' });
  
  // Admin Account State
  const [adminEmail, setAdminEmail] = useState('admin@pku.com');
  const [adminName, setAdminName] = useState('Administrator');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    // Get admin info from localStorage
    const storedAdminUser = localStorage.getItem('admin_user');
    if (storedAdminUser) {
      try {
        const user = JSON.parse(storedAdminUser);
        setAdminName(user.name || user.username || 'Administrator');
        setAdminEmail(user.email || 'admin@pku.com');
      } catch (e) {
        console.error('Error parsing admin user:', e);
      }
    }
  }, []);

  // Auto-dismiss banner after 5 seconds
  useEffect(() => {
    if (banner.message) {
      const timer = setTimeout(() => {
        setBanner({ message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  const handleSaveEmail = async () => {
    try {
      setLoading(true);
      // In production, call API to update email
      // await authenticatedFetch('/api/admin/settings/email', { method: 'PUT', body: JSON.stringify({ email: adminEmail }) });
      
      setTimeout(() => {
        setBanner({ message: 'Email berhasil diperbarui!', type: 'success' });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error updating email:', error);
      setBanner({ message: 'Gagal memperbarui email', type: 'error' });
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    try {
      setLoading(true);
      // In production, call API to update name
      // await authenticatedFetch('/api/admin/settings/name', { method: 'PUT', body: JSON.stringify({ name: adminName }) });
      
      // Update localStorage
      const storedAdminUser = localStorage.getItem('admin_user');
      if (storedAdminUser) {
        const user = JSON.parse(storedAdminUser);
        user.name = adminName;
        localStorage.setItem('admin_user', JSON.stringify(user));
      }
      
      setTimeout(() => {
        setBanner({ message: 'Nama berhasil diperbarui!', type: 'success' });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error updating name:', error);
      setBanner({ message: 'Gagal memperbarui nama', type: 'error' });
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setBanner({ message: 'Mohon lengkapi semua field', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setBanner({ message: 'Password baru tidak cocok dengan konfirmasi', type: 'error' });
      return;
    }

    if (newPassword.length < 8) {
      setBanner({ message: 'Password baru minimal 8 karakter', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      // In production, call API to change password
      // await authenticatedFetch('/api/admin/settings/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
      
      setTimeout(() => {
        setBanner({ message: 'Password berhasil diperbarui!', type: 'success' });
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error changing password:', error);
      setBanner({ message: 'Gagal mengubah password', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Banner Notification */}
        {banner.message && (
          <div className={`${styles.banner} ${styles[banner.type]}`}>
            <span>{banner.message}</span>
            <button 
              className={styles.bannerClose} 
              onClick={() => setBanner({ message: '', type: '' })}
            >
              ×
            </button>
          </div>
        )}

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Pengaturan Akun</h1>
          <p className={styles.pageSubtitle}>Kelola informasi akun administrator</p>
        </header>

        <div className={styles.settingsGrid}>
          {/* Admin Account Settings */}
          <Card className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <MdPerson size={24} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Informasi Akun</h2>
            </div>
            
            <div className={styles.cardContent}>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <MdPerson size={18} />
                  Nama
                </label>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className={styles.inputField}
                    placeholder="Nama administrator"
                  />
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSaveName}
                    disabled={loading}
                  >
                    <MdSave size={16} />
                    Simpan
                  </Button>
                </div>
              </div>

              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <MdEmail size={18} />
                  Email
                </label>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className={styles.inputField}
                    placeholder="Email"
                  />
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSaveEmail}
                    disabled={loading}
                  >
                    <MdSave size={16} />
                    Simpan
                  </Button>
                </div>
              </div>

              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  <MdLock size={18} />
                  Password
                </label>
                <div className={styles.passwordSection}>
                  <span className={styles.passwordMask}>••••••••••</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Ubah Password
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* System Info */}
          <Card className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <MdInfo size={24} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Informasi Sistem</h2>
            </div>
            
            <div className={styles.cardContent}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Versi Aplikasi</span>
                <span className={styles.infoValue}>1.0.0</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Environment</span>
                <span className={styles.infoValue}>Production</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Framework</span>
                <span className={styles.infoValue}>Laravel 10 + React 18</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Database</span>
                <span className={styles.infoValue}>MySQL 8.0</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <Modal
            isOpen={showPasswordModal}
            onClose={() => {
              setShowPasswordModal(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            title="Ubah Password"
          >
            <div className={styles.passwordModalContent}>
              <div className={styles.passwordField}>
                <label>Password Saat Ini</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className={styles.inputField}
                  />
                  <button 
                    type="button"
                    className={styles.togglePasswordBtn}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

              <div className={styles.passwordField}>
                <label>Password Baru</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className={styles.inputField}
                  />
                  <button 
                    type="button"
                    className={styles.togglePasswordBtn}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

              <div className={styles.passwordField}>
                <label>Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
                  className={styles.inputField}
                />
              </div>

              <div className={styles.passwordHint}>
                <MdInfo size={16} />
                <span>Password minimal 8 karakter</span>
              </div>

              <div className={styles.modalActions}>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Batal
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  <MdCheck size={18} />
                  Simpan Password
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default PengaturanAkun;
