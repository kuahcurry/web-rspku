import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Input from '../../../components/input/Input';
import Banner from '../../../components/banner/Banner';
import { 
  MdSearch, 
  MdVisibility, 
  MdPeople,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDelete,
  MdBlock,
  MdCheck
} from 'react-icons/md';
import { authenticatedFetch } from '../../../utils/auth';
import styles from './ManajemenPengguna.module.css';

const ManajemenPengguna = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [banner, setBanner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
    perPage: 15
  });

  // Debounce timer for search
  const [searchDebounce, setSearchDebounce] = useState(null);

  useEffect(() => {
    fetchUsers(1);
  }, [statusFilter, genderFilter]);

  // Debounce search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchUsers(1);
      } else if (searchTerm === '' && users.length > 0) {
        fetchUsers(1);
      }
    }, 500);
    
    setSearchDebounce(timer);
    
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchTerm]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString()
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (statusFilter) {
        params.append('status_kepegawaian', statusFilter);
      }
      if (genderFilter) {
        params.append('jenis_kelamin', genderFilter);
      }
      
      const response = await authenticatedFetch(`/api/admin/pengguna?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setPagination({
          currentPage: data.meta.current_page,
          lastPage: data.meta.last_page,
          total: data.meta.total,
          from: data.meta.from || 0,
          to: data.meta.to || 0,
          perPage: data.meta.per_page
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value) => {
    setStatusFilter(value);
  };
  const handleGenderFilterChange = (value) => {
    setGenderFilter(value);
  };

  const getStatusClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'aktif':
        return styles.statusSuccess;
      case 'tidak aktif':
        return styles.statusDanger;
      default:
        return styles.statusNeutral;
    }
  };

  const handleViewUser = (userId) => {
    navigate(`/admin/pengguna/${userId}`);
  };

  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('admin_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });

  const isSuperAdmin = adminUser?.role === 'super_admin';

  const extractApiErrorMessage = async (response, fallbackMessage) => {
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await response.json();
        return payload?.error || payload?.message || fallbackMessage;
      }

      const text = await response.text();
      return text ? `${fallbackMessage}: ${text}` : fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Yakin ingin menonaktifkan pengguna ini?')) return;
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetch(`/api/admin/pengguna/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update user in the list to 'Tidak Aktif'
        setUsers(users.map(u => u.id === userId ? { ...u, status_kepegawaian: 'Tidak Aktif' } : u));
        setBanner({ message: 'Pengguna berhasil dinonaktifkan', variant: 'success' });
      } else {
        const message = await extractApiErrorMessage(response, 'Gagal menonaktifkan pengguna');
        setBanner({ message, variant: 'error' });
      }
    } catch (err) {
      setBanner({ message: err?.message || 'Terjadi kesalahan saat menonaktifkan pengguna', variant: 'error' });
    }
  };

  const handleDeactivateUser = async (userId) => {
    // Reuse delete endpoint which now marks user as inactive
    await handleDeleteUser(userId);
  };

  const handleReactivateUser = async (userId) => {
    if (!window.confirm('Yakin ingin mengaktifkan kembali pengguna ini?')) return;
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetch(`/api/admin/pengguna/${userId}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map(u => u.id === userId ? { ...u, status_kepegawaian: 'Aktif' } : u));
        setBanner({ message: 'Pengguna berhasil diaktifkan kembali', variant: 'success' });
      } else {
        const message = await extractApiErrorMessage(response, 'Gagal mengaktifkan pengguna');
        setBanner({ message, variant: 'error' });
      }
    } catch (err) {
      setBanner({ message: err?.message || 'Terjadi kesalahan saat mengaktifkan pengguna', variant: 'error' });
    }
  };

  const handlePermanentDelete = async (userId) => {
    if (!window.confirm('Yakin ingin menghapus akun ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetch(`/api/admin/pengguna/${userId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // remove from UI list
        setUsers(users.filter(u => u.id !== userId));
        setBanner({ message: 'Pengguna berhasil dihapus secara permanen', variant: 'success' });
      } else {
        const message = await extractApiErrorMessage(response, 'Gagal menghapus pengguna');
        setBanner({ message, variant: 'error' });
      }
    } catch (err) {
      setBanner({ message: err?.message || 'Terjadi kesalahan saat menghapus pengguna', variant: 'error' });
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {banner && <Banner message={banner.message} variant={banner.variant} onClose={() => setBanner(null)} />}
        
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Manajemen Pengguna</h1>
              <p className={styles.pageSubtitle}>Kelola data tenaga medis yang terdaftar</p>
            </div>
          </div>
        </header>

        {/* Users Table */}
        <Card className={styles.tableCard}>
          {/* Search and Filter Bar */}
          <div className={styles.searchFilterBar}>
            <div className={styles.searchField}>
              <label className={styles.searchLabel} htmlFor="userSearch">
                Cari
              </label>
              <div className={styles.searchWrapper}>
              <MdSearch className={styles.searchIcon} size={22} />
              <input
                id="userSearch"
                type="text"
                placeholder="Cari berdasarkan NIP, NIK, Nama, atau Email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button 
                  className={styles.clearSearch}
                  onClick={() => setSearchTerm('')}
                >
                  <MdClose size={18} />
                </button>
              )}
              </div>
            </div>
            <div className={styles.inlineFilter}>
              <label className={styles.filterLabel} htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
            <div className={styles.inlineFilter}>
              <label className={styles.filterLabel} htmlFor="genderFilter">Jenis Kelamin</label>
              <select
                id="genderFilter"
                className={styles.filterSelect}
                value={genderFilter}
                onChange={(e) => handleGenderFilterChange(e.target.value)}
              >
                <option value="">Semua Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <span>Memuat data pengguna...</span>
              </div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>
                <MdPeople size={64} />
                <h3>Tidak ada pengguna ditemukan</h3>
                <p>Coba ubah kata kunci pencarian atau filter Anda</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>NIP</th>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Status Kepegawaian</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className={styles.nipCell}>{user.nip}</td>
                      <td className={styles.nikCell}>{user.nik}</td>
                      <td className={styles.nameCell}>
                        <span className={styles.userName}>{user.name}</span>
                      </td>
                      <td className={styles.emailCell}>{user.email}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(user.status_kepegawaian)}`}>
                          {user.status_kepegawaian}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={`${styles.iconButton} ${styles.iconButtonView}`}
                            onClick={() => handleViewUser(user.id)}
                            title="Lihat Detail"
                          >
                            <MdVisibility size={18} />
                            <span className={styles.tooltip}>Lihat Detail</span>
                          </button>
                          {/* Admins: view + deactivate; Superadmins: view + permanent delete + deactivate/activate */}
                          {!isSuperAdmin && (
                            <button 
                              className={`${styles.iconButton} ${styles.iconButtonDeactivate}`}
                              onClick={() => handleDeactivateUser(user.id)}
                              title="Nonaktifkan Akun"
                            >
                              <MdBlock size={18} />
                              <span className={styles.tooltip}>Nonaktifkan</span>
                            </button>
                          )}

                          {isSuperAdmin && (
                            <>
                              <button 
                                className={`${styles.iconButton} ${styles.iconButtonDelete}`}
                                onClick={() => handlePermanentDelete(user.id)}
                                title="Hapus Akun Permanen"
                              >
                                <MdDelete size={18} />
                                <span className={styles.tooltip}>Hapus Akun</span>
                              </button>

                              {user.status_kepegawaian && user.status_kepegawaian.toLowerCase() === 'tidak aktif' ? (
                                <button
                                  className={`${styles.iconButton} ${styles.iconButtonActivate}`}
                                  onClick={() => handleReactivateUser(user.id)}
                                  title="Aktifkan Pengguna"
                                >
                                  <MdCheck size={18} />
                                  <span className={styles.tooltip}>Aktifkan</span>
                                </button>
                              ) : (
                                <button 
                                  className={`${styles.iconButton} ${styles.iconButtonDeactivate}`}
                                  onClick={() => handleDeactivateUser(user.id)}
                                  title="Nonaktifkan Akun"
                                >
                                  <MdBlock size={18} />
                                  <span className={styles.tooltip}>Nonaktifkan</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} pengguna
              </span>
              <div className={styles.paginationControls}>
                <button 
                  className={styles.pageBtn}
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  <MdChevronLeft size={20} />
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`${styles.pageBtn} ${pagination.currentPage === page ? styles.active : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className={styles.pageBtn}
                  disabled={pagination.currentPage === pagination.lastPage}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  <MdChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ManajemenPengguna;
