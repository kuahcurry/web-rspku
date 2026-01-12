import { useState, useEffect } from 'react';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Input from '../../../components/input/Input';
import Form from '../../../components/form/Form';
import Popup from '../../../components/popup/Popup';
import { authenticatedFetch } from '../../../utils/auth';
import { 
  MdPerson,
  MdEmail,
  MdLock,
  MdSave,
  MdEdit
} from 'react-icons/md';
import styles from './AkunAdmin.module.css';

const AkunAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState({ isVisible: false, message: '', type: 'info' });
  
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/profile');
      const data = await response.json();
      
      if (data.success) {
        setAdminData(data.data);
        setFormData({
          name: data.data.name,
          email: data.data.email
        });
      } else {
        showPopup(data.message || 'Gagal memuat profil', 'error');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      showPopup('Gagal memuat profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message, type = 'info') => {
    setPopup({ isVisible: true, message, type });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - restore original data
      setFormData({
        name: adminData.name,
        email: adminData.email
      });
    }
    setIsEditing(!isEditing);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await authenticatedFetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdminData(data.data);
        
        // Update localStorage
        localStorage.setItem('admin_user', JSON.stringify(data.data));
        
        setIsEditing(false);
        showPopup('Profil berhasil diperbarui', 'success');
      } else {
        showPopup(data.message || 'Gagal memperbarui profil', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showPopup('Gagal memperbarui profil', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      showPopup('Konfirmasi password tidak cocok', 'error');
      return;
    }

    if (passwordData.new_password.length < 8) {
      showPopup('Password baru minimal 8 karakter', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await authenticatedFetch('/api/admin/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setIsChangingPassword(false);
        showPopup('Password berhasil diubah', 'success');
      } else {
        showPopup(data.message || 'Gagal mengubah password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showPopup('Gagal mengubah password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'super_admin') return 'Super Admin';
    return 'Admin';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Memuat data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Akun Admin</h1>
              <p className={styles.pageSubtitle}>Kelola informasi akun administrator</p>
            </div>
          </div>
        </header>

        <div className={styles.contentGrid}>
          {/* Profile Card */}
          <Card 
            title="Informasi Profil"
            headerAction={
              !isEditing && (
                <Button 
                  variant="warning" 
                  size="small"
                  icon={<MdEdit size={16} />}
                  onClick={handleEditToggle}
                >
                  Edit
                </Button>
              )
            }
          >
            {isEditing ? (
              <Form onSubmit={handleProfileSubmit}>
                <Form.Group>
                  <Input
                    label="Nama Lengkap"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    icon={<MdPerson size={18} />}
                    required
                  />
                </Form.Group>
                
                <Form.Group>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Masukkan email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    icon={<MdEmail size={18} />}
                    required
                  />
                </Form.Group>
                
                <Form.Actions>
                  <Button variant="danger" onClick={handleEditToggle}>
                    Batal
                  </Button>
                  <Button variant="success" type="submit" loading={isSubmitting}>
                    Simpan
                  </Button>
                </Form.Actions>
              </Form>
            ) : (
              <div className={styles.profileInfo}>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Nama Lengkap</span>
                  <span className={styles.profileValue}>{adminData.name}</span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Email</span>
                  <span className={styles.profileValue}>{adminData.email}</span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Role</span>
                  <span className={`${styles.profileValue} ${styles.roleBadge}`}>
                    {getRoleLabel(adminData.role)}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Change Password Card */}
          <Card title="Ubah Password">
            {isChangingPassword ? (
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group>
                  <Input
                    label="Password Saat Ini"
                    type="password"
                    placeholder="Masukkan password saat ini"
                    value={passwordData.current_password}
                    onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    icon={<MdLock size={18} />}
                    allowPasswordToggle
                    required
                  />
                </Form.Group>
                
                <Form.Group>
                  <Input
                    label="Password Baru"
                    type="password"
                    placeholder="Masukkan password baru (min. 8 karakter)"
                    value={passwordData.new_password}
                    onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                    icon={<MdLock size={18} />}
                    allowPasswordToggle
                    required
                  />
                </Form.Group>
                
                <Form.Group>
                  <Input
                    label="Konfirmasi Password Baru"
                    type="password"
                    placeholder="Masukkan ulang password baru"
                    value={passwordData.confirm_password}
                    onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                    icon={<MdLock size={18} />}
                    allowPasswordToggle
                    required
                  />
                </Form.Group>
                
                <Form.Actions>
                  <Button variant="danger" onClick={() => setIsChangingPassword(false)}>
                    Batal
                  </Button>
                  <Button variant="success" type="submit" loading={isSubmitting}>
                    Simpan
                  </Button>
                </Form.Actions>
              </Form>
            ) : (
              <div className={styles.passwordSection}>
                <p className={styles.passwordText}>
                  Untuk keamanan akun, disarankan untuk mengubah password secara berkala.
                </p>
                <Button 
                  variant="warning"
                  icon={<MdLock size={18} />}
                  onClick={() => setIsChangingPassword(true)}
                >
                  Ubah Password
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Popup Notification */}
        <Popup
          message={popup.message}
          type={popup.type}
          isVisible={popup.isVisible}
          onClose={() => setPopup(prev => ({ ...prev, isVisible: false }))}
        />
      </div>
    </AdminLayout>
  );
};

export default AkunAdmin;
