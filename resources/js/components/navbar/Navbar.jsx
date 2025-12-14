import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MdMenu,
  MdClose,
  MdLogout,
  MdPerson,
  MdKeyboardArrowDown,
  MdSettings
} from 'react-icons/md';
import { useUser } from '../../contexts/UserContext';
import { authenticatedFetch, logout } from '../../utils/auth';
import './Navbar.css';

const Navbar = ({ onMenuToggle, sidebarOpen }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const { user, clearUser } = useUser();

  const userName = user?.name || 'Nama Lengkap';
  const userRole = user?.jabatan || 'Belum ada jabatan!';

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    clearUser();
    navigate('/login');
  };

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await authenticatedFetch('/api/profile/foto-profil');
        const data = await response.json();
        if (data.success && data.data.foto_profil_url) {
          setProfilePicture(data.data.foto_profil_url);
        }
      } catch (error) {
        console.error('[Navbar] Error fetching profile picture:', error);
      }
    };

    if (user) {
      fetchProfilePicture();
    }
  }, [user]);

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
              {profilePicture && !avatarError ? (
                <img
                  src={profilePicture}
                  alt="User avatar"
                  onError={(e) => {
                    console.error('[Navbar] Image failed to load:', profilePicture, 'Error:', e);
                    setAvatarError(true);
                  }}
                />
              ) : (
                <span className="user-initials">
                  {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userRole}</span>
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
              <button className="dropdown-item logout" onClick={handleLogout}>
                <MdLogout size={18} />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
