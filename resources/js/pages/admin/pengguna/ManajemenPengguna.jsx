import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Input from '../../../components/input/Input';
import { 
  MdSearch, 
  MdVisibility, 
  MdPeople,
  MdChevronLeft,
  MdChevronRight,
  MdClose
} from 'react-icons/md';
import { authenticatedFetch } from '../../../utils/auth';
import styles from './ManajemenPengguna.module.css';

const ManajemenPengguna = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
  }, [statusFilter]);

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

  const getStatusClass = (status) => {
    switch (status) {
      case 'Karyawan Tetap':
        return styles.statusPermanent;
      case 'Karyawan Kontrak':
        return styles.statusContract;
      case 'Tenaga Honorer/Sukarelawan':
        return styles.statusVolunteer;
      case 'Perawat Praktik Mandiri':
        return styles.statusIndependent;
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

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Manajemen Pengguna</h1>
              <p className={styles.pageSubtitle}>Kelola data tenaga medis yang terdaftar</p>
            </div>
          </div>
        </header>

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
            <label className={styles.filterLabel} htmlFor="statusFilter">Status Kepegawaian</label>
            <select
              id="statusFilter"
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="Karyawan Tetap">Karyawan Tetap</option>
              <option value="Karyawan Kontrak">Karyawan Kontrak</option>
              <option value="Tenaga Honorer/Sukarelawan">Tenaga Honorer/Sukarelawan</option>
              <option value="Perawat Praktik Mandiri">Perawat Praktik Mandiri</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <Card className={styles.tableCard}>
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
                        <Button 
                          variant="primary" 
                          size="small"
                          icon={<MdVisibility size={16} />}
                          onClick={() => handleViewUser(user.id)}
                        >
                          Lihat Detail
                        </Button>
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
