import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MdMenu,
  MdClose,
  MdLogout,
  MdPerson,
  MdKeyboardArrowDown,
  MdSettings
} from 'react-icons/md';
import './Navbar.css';

const Navbar = ({ onMenuToggle, sidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const avatarUrl = 'https://i.pravatar.cc/100?img=3';

  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          {sidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
      </div>
      <div className="navbar-right">
        <div className="user-profile-wrapper">
          <div className="user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="user-avatar">
              {!avatarError ? (
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="user-initials">NL</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">Nama Lengkap</span>
              <span className="user-role">Role</span>
            </div>
            <MdKeyboardArrowDown className={`dropdown-icon ${dropdownOpen ? 'open' : ''}`} size={20} />
          </div>
          {dropdownOpen && (
            <div className="user-dropdown">
              <Link to="/profil" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <MdPerson size={18} />
                <span>Profil Saya</span>
              </Link>
              <Link to="/pengaturan" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <MdSettings size={18} />
                <span>Pengaturan</span>
              </Link>
              <div className="dropdown-divider"></div>
              <Link to="/login" className="dropdown-item logout" onClick={() => setDropdownOpen(false)}>
                <MdLogout size={18} />
                <span>Keluar</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
