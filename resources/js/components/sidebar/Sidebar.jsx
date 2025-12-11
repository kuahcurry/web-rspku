import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MdHome, 
  MdPerson, 
  MdDescription, 
  MdSchool, 
  MdAssignment, 
  MdEmojiEvents, 
  MdGavel,
  MdPictureAsPdf,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight
} from 'react-icons/md';
import { IoShieldCheckmarkSharp } from "react-icons/io5";
import headerImg from '../../assets/headerImg.png';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
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
        { path: '/riwayat-pendidikan', label: 'Pendidikan & Pelatihan' },
        { path: '/prestasi-penghargaan', label: 'Prestasi & Penghargaan' }
      ]
    },
    { path: '/penugasan', icon: MdAssignment, label: 'Penugasan' },
    { 
      key: 'kredensial',
      icon: IoShieldCheckmarkSharp, 
      label: 'Kredensial & Kewenangan Klinis',
      subMenus: [
        { path: '/status-kewenangan', label: 'Status Kewenangan (SPK/RKK)' },
        { path: '/kredensial', label: 'Kredensial/Rekredensial' }
      ]
    },
    
    { path: '/riwayat-etik', icon: MdGavel, label: 'Riwayat Etik & Disiplin' },
    { 
      key: 'alat',
      icon: MdPictureAsPdf, 
      label: 'Alat PDF',
      subMenus: [
        { path: '/alat/gambar-ke-pdf', label: 'Gambar ke PDF' },
        { path: '/alat/kompresi-pdf', label: 'Kompresi File PDF' },
        { path: '/alat/cetak-pdf', label: 'Cetak PDF' }
      ]
    }
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

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
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
                          onClick={onClose}
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
              onClick={onClose}
            >
              <Icon className="nav-icon" size={22} />
              <span className="nav-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
