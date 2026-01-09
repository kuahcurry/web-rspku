import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MdHome, 
  MdPerson, 
  MdDescription, 
  MdSchool, 
  MdAssignment, 
  MdGavel,
  MdPictureAsPdf,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdHelp
} from 'react-icons/md';
import { IoShieldCheckmarkSharp } from "react-icons/io5";
import Navbar from '../../components/navbar/Navbar';
import headerImg from '../../assets/headerImg.png';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const menuItems = [
    { path: '/beranda', icon: MdHome, label: 'Beranda' },
    { path: '/profil', icon: MdPerson, label: 'Profil Saya' },
    { path: '/dokumen', icon: MdDescription, label: 'Dokumen Legalitas' },
    { 
      key: 'riwayat-pendidikan',
      icon: MdSchool, 
      label: 'Pendidikan dan Prestasi',
      subMenus: [
        { path: '/riwayat-pendidikan', label: 'Pendidikan, Pelatihan & Workshop' },
        { path: '/prestasi-penghargaan', label: 'Prestasi, Penghargaan & Kompetensi' }
      ]
    },
    { path: '/penugasan', icon: MdAssignment, label: 'Penugasan & Pengabdian' },
    { 
      key: 'kredensial',
      icon: IoShieldCheckmarkSharp, 
      label: 'Kredensial & Kewenangan Klinis',
      subMenus: [
        { path: '/status-kewenangan', label: 'Status Kewenangan (SPK/RKK)' },
        { path: '/kredensial', label: 'Kredensial/Rekredensial' }
      ]
    },
    { path: '/etik-disiplin', icon: MdGavel, label: 'Etik & Disiplin' },
    { 
      key: 'alat',
      icon: MdPictureAsPdf, 
      label: 'Alat PDF',
      subMenus: [
        { path: '/alat/gambar-ke-pdf', label: 'Gambar ke PDF' },
        { path: '/alat/kompresi-pdf', label: 'Kompresi File PDF' }
      ]
    },
    { path: '/faq', icon: MdHelp, label: 'Bantuan & FAQ' }
  ];

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

  const toggleMenu = (key) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img
            src={headerImg}
            alt="Logo PKU Muhammadiyah Gombong"
            className="sidebar-logo-image"
          />
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            // Check if item has submenus
            if (item.subMenus) {
              const isExpanded = expandedMenus[item.key];
              const isAnySubActive = item.subMenus.some(sub => location.pathname === sub.path);
              
              return (
                <div key={item.key} className="nav-item-wrapper">
                  <button
                    className={`nav-item nav-item-parent ${isAnySubActive ? 'active' : ''}`}
                    onClick={() => toggleMenu(item.key)}
                  >
                    <Icon className="nav-icon" size={22} />
                    <span className="nav-text">{item.label}</span>
                    {isExpanded ? (
                      <MdKeyboardArrowDown className="nav-arrow" size={20} />
                    ) : (
                      <MdKeyboardArrowRight className="nav-arrow" size={20} />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="sub-menu">
                      {item.subMenus.map((subItem) => {
                        const isActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`nav-item nav-sub-item ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                          >
                            <span className="nav-text">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Regular menu item
            const isActive = location.pathname === item.path;
            
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon className="nav-icon" size={22} />
                <span className="nav-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main className="main-content">
        <Navbar 
          onMenuToggle={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        
        <div className="content-container">
          {children}
        </div>
      </main>

      {sidebarOpen && (
        <div className="overlay" onClick={closeSidebar}></div>
      )}
    </div>
  );
};

export default MainLayout;
