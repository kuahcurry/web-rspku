import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MdDashboard, 
  MdPeople, 
  MdGavel, 
  MdBuild, 
  MdSettings,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdMenu,
  MdClose,
  MdLogout,
  MdImage,
  MdTransform,
  MdAdminPanelSettings,
  MdManageAccounts,
  MdPictureAsPdf,
  MdHelp
} from 'react-icons/md';
import headerImg from '../../assets/headerImg.png';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const menuItems = [
    { path: '/admin/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/admin/pengguna', icon: MdPeople, label: 'Manajemen Pengguna' },
    { path: '/admin/etik-disiplin', icon: MdGavel, label: 'Etik & Disiplin' },
    { 
      key: 'alat',
      icon: MdPictureAsPdf, 
      label: 'Alat PDF',
      subMenus: [
        { path: '/admin/alat/gambar-ke-pdf', label: 'Gambar ke PDF' },
        { path: '/admin/alat/kompresi-pdf', label: 'Kompresi PDF' }
      ]
    },
    { 
      key: 'pengaturan',
      icon: MdSettings, 
      label: 'Pengaturan',
      subMenus: [
        { path: '/admin/pengaturan/role', label: 'Manajemen Role' },
        { path: '/admin/pengaturan/akun', label: 'Akun Admin' }
      ]
    },
    { path: '/admin/faq', icon: MdHelp, label: 'Bantuan & FAQ' }
  ];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      console.log('AdminLayout: No token or user found, redirecting to login');
      navigate('/login?mode=admin');
      return;
    }
    
    // Get admin user from localStorage
    try {
      const userData = JSON.parse(userStr);
      console.log('AdminLayout: User data from localStorage:', userData);
      
      // Check if user has admin role
      if (userData.role !== 'admin') {
        console.log('AdminLayout: User role is not admin:', userData.role);
        alert('Akses ditolak: Anda tidak memiliki hak akses admin.');
        navigate('/login?mode=admin');
        return;
      }
      
      console.log('AdminLayout: Admin authenticated successfully');
      setAdminUser(userData);
    } catch (e) {
      console.error('AdminLayout: Error parsing user data:', e);
      navigate('/login?mode=admin');
    }
  }, [navigate]);

  // Auto-expand menu when page is active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subMenus) {
        const isAnySubActive = item.subMenus.some(sub => location.pathname === sub.path);
        if (isAnySubActive && !expandedMenus[item.key]) {
          setExpandedMenus(prev => ({
            ...prev,
            [item.key]: true
          }));
        }
      }
    });
  }, [location.pathname]);

  const adminName = adminUser?.name || adminUser?.username || 'Administrator';
  const adminInitials = adminName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleMenu = (key) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
    navigate('/login?mode=admin');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <img
            src={headerImg}
            alt="Logo PKU Muhammadiyah Gombong"
            className="admin-sidebar-logo"
          />
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            if (item.subMenus) {
              const isExpanded = expandedMenus[item.key];
              const isAnySubActive = item.subMenus.some(sub => location.pathname === sub.path);
              
              return (
                <div key={item.key} className="admin-nav-wrapper">
                  <button
                    className={`admin-nav-item admin-nav-parent ${isAnySubActive ? 'active' : ''}`}
                    onClick={() => toggleMenu(item.key)}
                  >
                    <Icon className="admin-nav-icon" size={22} />
                    <span className="admin-nav-text">{item.label}</span>
                    {isExpanded ? (
                      <MdKeyboardArrowDown className="admin-nav-arrow" size={20} />
                    ) : (
                      <MdKeyboardArrowRight className="admin-nav-arrow" size={20} />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="admin-sub-menu">
                      {item.subMenus.map((subItem) => {
                        const isActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`admin-nav-item admin-nav-sub-item ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                          >
                            <span className="admin-nav-text">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            const isActive = location.pathname === item.path;
            
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon className="admin-nav-icon" size={22} />
                <span className="admin-nav-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        {/* Top Navbar */}
        <header className="admin-navbar">
          <div className="admin-navbar-left">
            <button className="admin-menu-toggle" onClick={toggleSidebar}>
              {sidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
            </button>
            <h1 className="admin-navbar-title">Admin Panel</h1>
          </div>
          <div className="admin-navbar-right">
            <div className="admin-user-profile-wrapper">
              <button className="admin-user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className="admin-user-avatar">{adminInitials}</span>
                <span className="admin-user-name">{adminName}</span>
                <MdKeyboardArrowDown className={`admin-dropdown-icon ${dropdownOpen ? 'open' : ''}`} size={18} />
              </button>
              {dropdownOpen && (
                <div className="admin-user-dropdown">
                  <Link to="/admin/pengaturan" className="admin-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <MdSettings size={18} />
                    <span>Pengaturan Akun</span>
                  </Link>
                  <div className="admin-dropdown-divider"></div>
                  <button className="admin-dropdown-item logout" onClick={handleLogout}>
                    <MdLogout size={18} />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content-container">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="admin-overlay" onClick={closeSidebar}></div>
      )}
    </div>
  );
};

export default AdminLayout;
