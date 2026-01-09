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
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Mock user data - In production, this would come from API
  const mockUsers = [
    { id: 1, nip: '198501152010011001', nik: '3302151505850001', name: 'Dr. Ahmad Sudirman, Sp.PD', email: 'ahmad.sudirman@pku.com', phone: '081234567890', verified: true, province: 'Jawa Tengah', regency: 'Kebumen', status: 'Pegawai Tetap' },
    { id: 2, nip: '199002202015012001', nik: '3302152002900002', name: 'Ns. Siti Rahayu, S.Kep', email: 'siti.rahayu@pku.com', phone: '081234567891', verified: true, province: 'Jawa Tengah', regency: 'Kebumen', status: 'Pegawai Kontrak' },
    { id: 3, nip: '198807102012011002', nik: '3302151007880003', name: 'Dr. Bambang Hartono', email: 'bambang.hartono@pku.com', phone: '081234567892', verified: false, province: 'Jawa Tengah', regency: 'Gombong', status: 'Tenaga Honorer/Sukarelawan' },
    { id: 4, nip: '199105152017012003', nik: '3302151505910004', name: 'Ns. Dewi Lestari, S.Kep', email: 'dewi.lestari@pku.com', phone: '081234567893', verified: true, province: 'Jawa Tengah', regency: 'Kebumen', status: 'Perawat Praktik Mandiri' },
    { id: 5, nip: '198912252013012004', nik: '3302152512890005', name: 'Dr. Putri Amelia, Sp.A', email: 'putri.amelia@pku.com', phone: '081234567894', verified: true, province: 'Jawa Tengah', regency: 'Kebumen', status: 'Pegawai Tetap' },
    { id: 6, nip: '199203102018011005', nik: '3302151003920006', name: 'Ns. Rudi Hermawan, S.Kep', email: 'rudi.hermawan@pku.com', phone: '081234567895', verified: false, province: 'Jawa Tengah', regency: 'Gombong', status: 'Pegawai Kontrak' },
    { id: 7, nip: '198604152011012006', nik: '3302151504860007', name: 'Dr. Yanti Kusuma, Sp.OG', email: 'yanti.kusuma@pku.com', phone: '081234567896', verified: true, province: 'Jawa Tengah', regency: 'Kebumen', status: 'Pegawai Tetap' },
    { id: 8, nip: '199406202020011007', nik: '3302152006940008', name: 'Ns. Andi Pratama, S.Kep', email: 'andi.pratama@pku.com', phone: '081234567897', verified: true, province: 'Jawa Tengah', regency: 'Kebumen', status: 'Tenaga Honorer/Sukarelawan' },
    { id: 9, nip: '198711052014011008', nik: '3302150511870009', name: 'Dr. Budi Santoso, Sp.B', email: 'budi.santoso@pku.com', phone: '081234567898', verified: true, province: 'Jawa Tengah', regency: 'Gombong', status: 'Perawat Praktik Mandiri' },
    { id: 10, nip: '199108152019012009', nik: '3302151508910010', name: 'Ns. Linda Wijaya, S.Kep', email: 'linda.wijaya@pku.com', phone: '081234567899', verified: false, province: 'Jawa Tengah', regency: 'Kebumen', status: 'Pegawai Kontrak' },
    { id: 11, nip: '198502102010011010', nik: '3302151002850011', name: 'Dr. Agus Setiawan, Sp.PD', email: 'agus.setiawan@pku.com', phone: '081234567800', verified: true, province: 'Jawa Tengah', regency: 'Kebumen', status: 'Pegawai Tetap' },
    { id: 12, nip: '199307202021012011', nik: '3302152007930012', name: 'Ns. Maya Sari, S.Kep', email: 'maya.sari@pku.com', phone: '081234567801', verified: true, province: 'Jawa Tengah', regency: 'Gombong', status: 'Tenaga Honorer/Sukarelawan' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply search and filters
    let result = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.nip.includes(term) ||
        user.nik.includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(user => user.status === filters.status);
    }

    setFilteredUsers(result);
    setPagination(prev => ({
      ...prev,
      totalItems: result.length,
      totalPages: Math.ceil(result.length / prev.itemsPerPage),
      currentPage: 1
    }));
  }, [searchTerm, filters, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // In production, this would be an API call
      // const response = await authenticatedFetch('/api/admin/users');
      // const data = await response.json();
      
      // Using mock data for now
      setTimeout(() => {
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
        setPagination(prev => ({
          ...prev,
          totalItems: mockUsers.length,
          totalPages: Math.ceil(mockUsers.length / prev.itemsPerPage)
        }));
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pegawai Tetap':
        return styles.statusPermanent;
      case 'Pegawai Kontrak':
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

  const getPaginatedUsers = () => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return filteredUsers.slice(start, end);
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
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
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="Pegawai Tetap">Pegawai Tetap</option>
              <option value="Pegawai Kontrak">Pegawai Kontrak</option>
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
            ) : filteredUsers.length === 0 ? (
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
                  {getPaginatedUsers().map((user) => (
                    <tr key={user.id}>
                      <td className={styles.nipCell}>{user.nip}</td>
                      <td className={styles.nikCell}>{user.nik}</td>
                      <td className={styles.nameCell}>
                        <span className={styles.userName}>{user.name}</span>
                      </td>
                      <td className={styles.emailCell}>{user.email}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(user.status)}`}>
                          {user.status}
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
          {!loading && filteredUsers.length > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Menampilkan {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} pengguna
              </span>
              <div className={styles.paginationControls}>
                <button 
                  className={styles.pageBtn}
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  <MdChevronLeft size={20} />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
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
                  disabled={pagination.currentPage === pagination.totalPages}
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
