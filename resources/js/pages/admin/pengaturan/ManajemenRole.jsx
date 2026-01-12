import { useState, useEffect } from 'react';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Input from '../../../components/input/Input';
import Modal from '../../../components/modal/Modal';
import Form from '../../../components/form/Form';
import Table from '../../../components/table/Table';
import Popup from '../../../components/popup/Popup';
import { authenticatedFetch } from '../../../utils/auth';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch,
  MdAdminPanelSettings,
  MdEmail
} from 'react-icons/md';
import styles from './ManajemenRole.module.css';

const ManajemenRole = () => {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState({ isVisible: false, message: '', type: 'info' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const roleOptions = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/admins');
      const data = await response.json();
      
      if (data.success) {
        setAdmins(data.data);
      } else {
        showPopup(data.message || 'Gagal memuat data admin', 'error');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      showPopup('Gagal memuat data admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message, type = 'info') => {
    setPopup({ isVisible: true, message, type });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin'
    });
    setShowAddModal(true);
  };

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await authenticatedFetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchAdmins();
        setShowAddModal(false);
        showPopup('Admin berhasil ditambahkan', 'success');
      } else {
        showPopup(data.message || 'Gagal menambahkan admin', 'error');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      showPopup('Gagal menambahkan admin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await authenticatedFetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchAdmins();
        setShowEditModal(false);
        showPopup('Admin berhasil diperbarui', 'success');
      } else {
        showPopup(data.message || 'Gagal memperbarui admin', 'error');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      showPopup('Gagal memperbarui admin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await authenticatedFetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchAdmins();
        setShowDeleteModal(false);
        showPopup('Admin berhasil dihapus', 'success');
      } else {
        showPopup(data.message || 'Gagal menghapus admin', 'error');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      showPopup('Gagal menghapus admin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'super_admin') {
      return <span className={`${styles.badge} ${styles.badgeSuperAdmin}`}>Super Admin</span>;
    }
    return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Manajemen Role</h1>
              <p className={styles.pageSubtitle}>Kelola akun administrator sistem</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <Card className={styles.mainCard}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <Input
                type="text"
                placeholder="Cari admin..."
                value={searchTerm}
                onChange={handleSearchChange}
                icon={<MdSearch size={20} />}
                size="medium"
              />
            </div>
            <Button 
              variant="success" 
              icon={<MdAdd size={20} />}
              onClick={handleAddClick}
            >
              Tambah Admin
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className={styles.loading}>Memuat data...</div>
          ) : (
            <div className={styles.tableScroll}>
              <Table
                columns={[
                  { key: 'name', label: 'Nama' },
                  { key: 'email', label: 'Email' },

                  { key: 'role', label: 'Role' },
                  { key: 'created_at', label: 'Tanggal Dibuat' },
                  { key: 'action', label: 'Aksi' }
                ]}
                className={styles.roleTable}
              >
                {filteredAdmins.length === 0 ? (
                  <div className="table-row">
                    <div className="table-cell" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                      Tidak ada data admin
                    </div>
                  </div>
                ) : (
                  filteredAdmins.map(admin => (
                    <div className="table-row" key={admin.id}>
                    <div className="table-cell" data-label="Nama">
                      <div className={styles.adminInfo}>
                        <span>{admin.name}</span>
                      </div>
                    </div>
                    <div className="table-cell" data-label="Email">{admin.email}</div>
                    <div className="table-cell" data-label="Role">{getRoleBadge(admin.role)}</div>
                    <div className="table-cell" data-label="Tanggal Dibuat">{admin.created_at}</div>
                    <div className={`table-cell ${styles.actionCell}`} data-label="Aksi">
                      <div className={styles.actionButtons}>
                        <Button 
                          variant="warning" 
                            size="small"
                            icon={<MdEdit size={16} />}
                            onClick={() => handleEditClick(admin)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="danger" 
                            size="small"
                            icon={<MdDelete size={16} />}
                            onClick={() => handleDeleteClick(admin)}
                            disabled={admin.role === 'super_admin'}
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Table>
            </div>
          )}
        </Card>

        {/* Add Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Tambah Admin Baru"
          size="medium"
        >
          <Form onSubmit={handleAddSubmit}>
            <Form.Group>
              <Input
                label="Nama Lengkap"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
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
                required
              />
            </Form.Group>
            
            <Form.Row columns={2}>
              <Input
                label="Password"
                type="password"
                placeholder="Masukkan password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                allowPasswordToggle
                required
              />
              <Input
                label="Role"
                type="select"
                options={roleOptions}
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                required
              />
            </Form.Row>
            
            <Form.Actions>
              <Button variant="danger" onClick={() => setShowAddModal(false)}>
                Batal
              </Button>
              <Button variant="success" type="submit" loading={isSubmitting}>
                Simpan
              </Button>
            </Form.Actions>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Admin"
          size="medium"
        >
          <Form onSubmit={handleEditSubmit}>
            <Form.Group>
              <Input
                label="Nama Lengkap"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
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
                required
              />
            </Form.Group>
            
            <Form.Row columns={2}>
              <Input
                label="Password Baru (kosongkan jika tidak ingin mengubah)"
                type="password"
                placeholder="Masukkan password baru"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                allowPasswordToggle
              />
              <Input
                label="Role"
                type="select"
                options={roleOptions}
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                required
              />
            </Form.Row>
            
            <Form.Actions>
              <Button variant="danger" onClick={() => setShowEditModal(false)}>
                Batal
              </Button>
              <Button variant="success" type="submit" loading={isSubmitting}>
                Simpan
              </Button>
            </Form.Actions>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Konfirmasi Hapus"
          variant="danger"
          size="small"
        >
          <p>Apakah Anda yakin ingin menghapus admin <strong>{selectedAdmin?.name}</strong>?</p>
          <p className={styles.deleteWarning}>
            Tindakan ini tidak dapat dibatalkan.
          </p>
          
          <Form.Actions>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={isSubmitting}>
              Hapus
            </Button>
          </Form.Actions>
        </Modal>

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

export default ManajemenRole;
