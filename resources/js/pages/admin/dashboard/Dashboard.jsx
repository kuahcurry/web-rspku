import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import Button from '../../../components/button/Button';
import Modal from '../../../components/modal/Modal';
import Input from '../../../components/input/Input';
import Table from '../../../components/table/Table';
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
    expiringDocuments: 0
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
      
      // Fetch dashboard statistics - in real implementation, this would call actual API
      // For now, we'll use mock data
      setStats({
        totalUsers: 156,
        activeUsers: 142,
        etikDisiplinCases: 8,
        expiringDocuments: 23
      });

      setExpiringDocuments([
        { id: 1, userName: 'Dr. Ahmad Sudirman', documentType: 'STR', expiryDate: '2026-01-15', daysLeft: 12 },
        { id: 2, userName: 'Ns. Siti Rahayu', documentType: 'SIP', expiryDate: '2026-01-20', daysLeft: 17 },
        { id: 3, userName: 'Dr. Bambang Hartono', documentType: 'STR', expiryDate: '2026-02-01', daysLeft: 29 },
        { id: 4, userName: 'Ns. Dewi Lestari', documentType: 'SIP', expiryDate: '2026-02-10', daysLeft: 38 },
      ]);

      // Data lengkap semua dokumen yang akan kedaluwarsa
      setAllExpiringDocuments([
        { id: 1, userName: 'Dr. Ahmad Sudirman', nip: '198501152010011001', documentType: 'STR', documentNumber: 'STR-123456', expiryDate: '2026-01-15', daysLeft: 12, unit: 'Poli Umum' },
        { id: 2, userName: 'Ns. Siti Rahayu', nip: '199003202015012002', documentType: 'SIP', documentNumber: 'SIP-789012', expiryDate: '2026-01-20', daysLeft: 17, unit: 'IGD' },
        { id: 3, userName: 'Dr. Bambang Hartono', nip: '198205102008011003', documentType: 'STR', documentNumber: 'STR-345678', expiryDate: '2026-02-01', daysLeft: 29, unit: 'Poli Gigi' },
        { id: 4, userName: 'Ns. Dewi Lestari', nip: '199108152016012004', documentType: 'SIP', documentNumber: 'SIP-901234', expiryDate: '2026-02-10', daysLeft: 38, unit: 'Rawat Inap' },
        { id: 5, userName: 'Dr. Eko Prasetyo', nip: '198704252011011005', documentType: 'STR', documentNumber: 'STR-567890', expiryDate: '2026-02-15', daysLeft: 43, unit: 'Poli Anak' },
        { id: 6, userName: 'Ns. Fitri Handayani', nip: '199206102017012006', documentType: 'SIP', documentNumber: 'SIP-123789', expiryDate: '2026-02-20', daysLeft: 48, unit: 'ICU' },
        { id: 7, userName: 'Dr. Gunawan Wijaya', nip: '198009152007011007', documentType: 'STR', documentNumber: 'STR-456123', expiryDate: '2026-02-25', daysLeft: 53, unit: 'Bedah' },
        { id: 8, userName: 'Ns. Hesti Kurniawati', nip: '199305202018012008', documentType: 'SIP', documentNumber: 'SIP-789456', expiryDate: '2026-03-01', daysLeft: 57, unit: 'Hemodialisa' },
        { id: 9, userName: 'Dr. Irfan Maulana', nip: '198602102009011009', documentType: 'STR', documentNumber: 'STR-012345', expiryDate: '2026-03-05', daysLeft: 61, unit: 'Radiologi' },
        { id: 10, userName: 'Ns. Julia Permata', nip: '199407152019012010', documentType: 'SIP', documentNumber: 'SIP-678901', expiryDate: '2026-03-10', daysLeft: 66, unit: 'Laboratorium' },
      ]);

      setRecentActivities([
        { id: 1, type: 'register', userName: 'Ns. Putri Amelia', action: 'Mendaftar sebagai pengguna baru', timestamp: '2026-01-03 10:30' },
        { id: 2, type: 'update', userName: 'Dr. Rudi Hermawan', action: 'Memperbarui dokumen STR', timestamp: '2026-01-03 09:15' },
        { id: 3, type: 'verify', userName: 'Ns. Andi Pratama', action: 'Verifikasi email berhasil', timestamp: '2026-01-03 08:45' },
        { id: 4, type: 'upload', userName: 'Dr. Yanti Kusuma', action: 'Mengunggah dokumen SIP', timestamp: '2026-01-02 16:20' },
        { id: 5, type: 'register', userName: 'Ns. Budi Santoso', action: 'Mendaftar sebagai pengguna baru', timestamp: '2026-01-02 14:00' },
      ]);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (daysLeft <= 7) return 'danger';
    if (daysLeft <= 30) return 'warning';
    return 'info';
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
                    +12 bulan ini
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
                  <span className={styles.statAction} onClick={() => navigate('/admin/etik-disiplin')}>
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
                          {doc.daysLeft} hari lagi
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
                      {doc.daysLeft} hari lagi
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
