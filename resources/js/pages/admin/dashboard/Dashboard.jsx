import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Input from '../../../components/input/Input';
import Table from '../../../components/table/Table';
import { authenticatedFetch } from '../../../utils/auth';
import { 
  MdPeople, 
  MdVerifiedUser, 
  MdWarning, 
  MdAccessTime,
  MdDescription,
  MdChevronRight,
  MdTrendingUp,
  MdPersonAdd,
  MdAssignment,
  MdGavel,
  MdSchedule,
  MdSearch,
  MdVisibility,
  MdFilterList
} from 'react-icons/md';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    etikDisiplinCases: 0,
    expiringDocuments: 0,
    newUsersThisMonth: 0
  });
  const [expiringDocuments, setExpiringDocuments] = useState([]);
  const [allExpiringDocuments, setAllExpiringDocuments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [searchExpiring, setSearchExpiring] = useState('');
  const [filterDocType, setFilterDocType] = useState('all');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const statsResponse = await authenticatedFetch('/api/admin/dashboard/statistics');
      
      // Handle 403 Forbidden (not admin)
      if (statsResponse.status === 403) {
        console.error('Access denied: User does not have admin role');
        alert('Akses ditolak: Anda tidak memiliki akses admin. Silakan hubungi administrator.');
        navigate('/login');
        return;
      }
      
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch expiring documents
      const expiringResponse = await authenticatedFetch('/api/admin/dashboard/expiring-documents');
      const expiringData = await expiringResponse.json();
      
      if (expiringData.success) {
        const documents = expiringData.data;
        setExpiringDocuments(documents.slice(0, 4)); // Show first 4 in main dashboard
        setAllExpiringDocuments(documents); // Store all for modal
      }

      // Fetch recent activities
      const activitiesResponse = await authenticatedFetch('/api/admin/dashboard/activities');
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesData.success) {
        setRecentActivities(activitiesData.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Handle authentication error
      if (error.message === 'Not authenticated') {
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'register': return <MdPersonAdd className={styles.activityIconRegister} />;
      case 'update': return <MdAssignment className={styles.activityIconUpdate} />;
      case 'verify': return <MdVerifiedUser className={styles.activityIconVerify} />;
      case 'upload': return <MdDescription className={styles.activityIconUpload} />;
      default: return <MdAccessTime className={styles.activityIconDefault} />;
    }
  };

  const getDaysLeftBadge = (daysLeft) => {
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 7) return 'danger';
    if (daysLeft <= 30) return 'warning';
    return 'info';
  };

  const getDaysLeftText = (daysLeft) => {
    if (daysLeft < 0) return `Kadaluwarsa ${Math.abs(daysLeft)} hari lalu`;
    if (daysLeft === 0) return 'Kadaluwarsa hari ini';
    return `${daysLeft} hari lagi`;
  };

  // Filter dokumen kedaluwarsa
  const filteredExpiringDocuments = allExpiringDocuments.filter(doc => {
    const matchesSearch = searchExpiring === '' || 
      doc.userName.toLowerCase().includes(searchExpiring.toLowerCase()) ||
      doc.nip.includes(searchExpiring) ||
      doc.documentNumber.toLowerCase().includes(searchExpiring.toLowerCase());
    const matchesType = filterDocType === 'all' || doc.documentType === filterDocType;
    return matchesSearch && matchesType;
  });

  const handleOpenExpiringModal = () => {
    setShowExpiringModal(true);
    setSearchExpiring('');
    setFilterDocType('all');
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>Dashboard</h1>
              <p className={styles.pageSubtitle}>Ringkasan data dan aktivitas sistem</p>
            </div>
            <div className={styles.headerMeta} />
          </div>
        </header>

        {/* Statistics Cards */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statIcon} style={{ background: 'var(--primary-soft)' }}>
                  <MdPeople size={28} color="var(--primary-main)" />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Total Pengguna</span>
                  <h2 className={styles.statValue}>{loading ? '-' : stats.totalUsers}</h2>
                  <span className={styles.statTrend}>
                    <MdTrendingUp size={16} />
                    +{stats.newUsersThisMonth} bulan ini
                  </span>
                </div>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statIcon} style={{ background: 'var(--success-light)' }}>
                  <MdVerifiedUser size={28} color="var(--success-green)" />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Pengguna Aktif</span>
                  <h2 className={styles.statValue}>{loading ? '-' : stats.activeUsers}</h2>
                  <span className={styles.statPercentage}>
                    {loading ? '-' : Math.round((stats.activeUsers / stats.totalUsers) * 100)}% dari total
                  </span>
                </div>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statIcon} style={{ background: 'var(--warning-light)' }}>
                  <MdGavel size={28} color="var(--warning-yellow)" />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Kasus Etik & Disiplin</span>
                  <h2 className={styles.statValue}>{loading ? '-' : stats.etikDisiplinCases}</h2>
                  <span className={styles.statAction} onClick={() => navigate('/etik-disiplin')}>
                    Lihat daftar
                  </span>
                </div>
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statIcon} style={{ background: 'var(--error-light)' }}>
                  <MdWarning size={28} color="var(--error-red)" />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Dokumen Segera Kedaluwarsa</span>
                  <h2 className={styles.statValue}>{loading ? '-' : stats.expiringDocuments}</h2>
                  <span className={styles.statAction} onClick={handleOpenExpiringModal}>
                    Tinjau sekarang
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          {/* Expiring Documents Section */}
          <Card className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Dokumen Segera Kedaluwarsa</h3>
              <Button 
                variant="ghost" 
                size="small"
                onClick={handleOpenExpiringModal}
              >
                Lihat Semua <MdChevronRight size={18} />
              </Button>
            </div>
            <div className={styles.sectionContent}>
              {loading ? (
                <div className={styles.loadingState}>Memuat data...</div>
              ) : expiringDocuments.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdVerifiedUser size={48} />
                  <p>Tidak ada dokumen yang mendekati kedaluwarsa</p>
                </div>
              ) : (
                <div className={styles.expiringList}>
                  {expiringDocuments.map((doc) => (
                    <div key={doc.id} className={styles.expiringItem}>
                      <div className={styles.expiringInfo}>
                        <span className={styles.expiringName}>{doc.userName}</span>
                        <span className={styles.expiringType}>{doc.documentType}</span>
                      </div>
                      <div className={styles.expiringMeta}>
                        <span className={styles.expiringDate}>{doc.expiryDate}</span>
                        <span className={`${styles.daysLeftBadge} ${styles[getDaysLeftBadge(doc.daysLeft)]}`}>
                          {getDaysLeftText(doc.daysLeft)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activities Section */}
          <Card className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Aktivitas Terkini</h3>
            </div>
            <div className={styles.sectionContent}>
              {loading ? (
                <div className={styles.loadingState}>Memuat data...</div>
              ) : recentActivities.length === 0 ? (
                <div className={styles.emptyState}>
                  <MdAccessTime size={48} />
                  <p>Belum ada aktivitas tercatat</p>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className={styles.activityItem}>
                      <div className={styles.activityIconWrapper}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className={styles.activityContent}>
                        <span className={styles.activityUser}>{activity.userName}</span>
                        <span className={styles.activityAction}>{activity.action}</span>
                      </div>
                      <span className={styles.activityTime}>{activity.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Semua Dokumen Kedaluwarsa */}
      <Modal
        isOpen={showExpiringModal}
        onClose={() => setShowExpiringModal(false)}
        title="Dokumen Segera Kedaluwarsa"
        size="large"
      >
        <div className={styles.modalContent}>
          {/* Search & Filter */}
          <div className={styles.modalFilters}>
            <div className={styles.searchWrapper}>
              <Input
                placeholder="Cari nama, NIP, atau nomor dokumen..."
                value={searchExpiring}
                onChange={(e) => setSearchExpiring(e.target.value)}
                icon={<MdSearch />}
              />
            </div>
            <div className={styles.filterWrapper}>
              <Input
                type="select"
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
                options={[
                  { value: 'all', label: 'Semua Jenis' },
                  { value: 'STR', label: 'STR' },
                  { value: 'SIP', label: 'SIP' }
                ]}
                icon={<MdFilterList />}
              />
            </div>
          </div>

          {/* Info Count */}
          <div className={styles.modalInfo}>
            <span>Menampilkan {filteredExpiringDocuments.length} dari {allExpiringDocuments.length} dokumen</span>
          </div>

          {/* Table */}
          <div className={styles.modalTableWrapper}>
            <Table
              className={styles.modalTable}
              columns={[
                { key: 'nama', label: 'Nama Pengguna' },
                { key: 'nip', label: 'NIP' },
                { key: 'unit', label: 'Unit' },
                { key: 'jenis', label: 'Jenis' },
                { key: 'nomor', label: 'No. Dokumen' },
                { key: 'expired', label: 'Kedaluwarsa' },
                { key: 'status', label: 'Status' }
              ]}
            >
              {filteredExpiringDocuments.map((doc) => (
                <div className="table-row" key={doc.id}>
                  <div className="table-cell" data-label="Nama Pengguna">
                    <span className={styles.tableName}>{doc.userName}</span>
                  </div>
                  <div className="table-cell" data-label="NIP">
                    <span className={styles.tableNip}>{doc.nip}</span>
                  </div>
                  <div className="table-cell" data-label="Unit">{doc.unit}</div>
                  <div className="table-cell" data-label="Jenis">
                    <span className={styles.docTypeBadge}>{doc.documentType}</span>
                  </div>
                  <div className="table-cell" data-label="No. Dokumen">
                    <span className={styles.tableDocNumber}>{doc.documentNumber}</span>
                  </div>
                  <div className="table-cell" data-label="Kedaluwarsa">{doc.expiryDate}</div>
                  <div className="table-cell" data-label="Status">
                    <span className={`${styles.daysLeftBadge} ${styles[getDaysLeftBadge(doc.daysLeft)]}`}>
                      {getDaysLeftText(doc.daysLeft)}
                    </span>
                  </div>
                </div>
              ))}
            </Table>
          </div>

          {filteredExpiringDocuments.length === 0 && (
            <div className={styles.emptyState}>
              <MdDescription size={48} />
              <p>Tidak ada dokumen yang sesuai dengan pencarian</p>
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default Dashboard;
