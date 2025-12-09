import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MdMenu,
  MdClose,
  MdLogout,
  MdPerson,
  MdKeyboardArrowDown,
  MdSettings
} from 'react-icons/md';
import { useUser } from '../../contexts/UserContext';
import { authenticatedFetch } from '../../utils/auth';
import './Navbar.css';

const Navbar = ({ onMenuToggle, sidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const { user } = useUser();

  const userName = user?.name || 'Nama Lengkap';
  const userRole = user?.jabatan || 'Belum ada jabatan!';

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        console.log('[Navbar] Fetching profile picture for user:', user?.name);
        const response = await authenticatedFetch('/api/profile/foto-profil');
        console.log('[Navbar] Response status:', response.status);
        const data = await response.json();
        console.log('[Navbar] API Response:', data);
        if (data.success && data.data.foto_profil_url) {
          console.log('[Navbar] Setting profile picture:', data.data.foto_profil_url);
          setProfilePicture(data.data.foto_profil_url);
        } else {
          console.log('[Navbar] No profile picture URL in response');
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
                  onLoad={() => console.log('[Navbar] Image loaded successfully:', profilePicture)}
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
