import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdNotificationsNone } from 'react-icons/md';
import './NotificationBell.css';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Resolve the correct auth header for the given tokenType.
// 'user'  → always use access_token (user guard)
// 'admin' → always use admin_access_token (admin guard)
// 'auto'  → pick whichever is present (admin first)
const resolveAuthHeader = (tokenType) => {
    if (tokenType === 'user') {
        const token = localStorage.getItem('access_token');
        const type  = localStorage.getItem('token_type') || 'bearer';
        return token ? `${type} ${token}` : null;
    }
    if (tokenType === 'admin') {
        const token = localStorage.getItem('admin_access_token');
        const type  = localStorage.getItem('admin_token_type') || 'bearer';
        return token ? `${type} ${token}` : null;
    }
    // 'auto' – fallback
    const adminToken = localStorage.getItem('admin_access_token');
    if (adminToken) return `${localStorage.getItem('admin_token_type') || 'bearer'} ${adminToken}`;
    const userToken = localStorage.getItem('access_token');
    return userToken ? `${localStorage.getItem('token_type') || 'bearer'} ${userToken}` : null;
};

const levelConfig = {
    expired: { label: 'Kadaluarsa', className: 'level-expired' },
    critical: { label: 'Kritis', className: 'level-critical' },
    warning: { label: 'Peringatan', className: 'level-warning' },
    caution: { label: 'Perhatian', className: 'level-caution' },
    upcoming: { label: 'Mendatang', className: 'level-upcoming' },
};

const NotificationBell = ({
    apiEndpoint,
    footerLink = '/dokumen',
    footerLabel = 'Lihat semua dokumen →',
    tokenType = 'auto', // 'user' | 'admin' | 'auto'
    markReadEndpoint = null,
}) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const authHeader = resolveAuthHeader(tokenType);
            if (!authHeader) return;

            const res = await fetch(apiEndpoint, {
                headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
            });

            const contentType = res.headers.get('content-type') ?? '';
            if (!res.ok || !contentType.includes('application/json')) return;

            const json = await res.json();
            if (json.success) {
                setNotifications(json.data.notifications ?? []);
                setCount(json.data.count ?? 0);
            }
        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, tokenType]);

    // Initial fetch + polling
    useEffect(() => {
        fetchNotifications();
        const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleItemClick = (redirectTo) => {
        setOpen(false);
        if (redirectTo) navigate(redirectTo);
    };

    const handleMarkAsRead = async (event, notification) => {
        event.stopPropagation();

        const key = notification?.notification_key;
        if (!key || !markReadEndpoint) return;

        const authHeader = resolveAuthHeader(tokenType);
        if (!authHeader) return;

        try {
            const res = await fetch(markReadEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notification_key: key }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) return;

            setNotifications((prev) => prev.filter((item) => item.notification_key !== key));
            setCount((prev) => Math.max(0, prev - 1));
        } catch {
            // silent fail
        }
    };

    const hasNotifications = count > 0;

    return (
        <div className="notif-bell-wrapper" ref={wrapperRef}>
            {/* Bell button */}
            <button
                className={`notif-bell-btn ${open ? 'open' : ''}`}
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Notifikasi dokumen"
                title="Notifikasi dokumen"
            >
                {hasNotifications
                    ? <MdNotifications size={24} />
                    : <MdNotificationsNone size={24} />
                }
                {hasNotifications && (
                    <span className="notif-badge" aria-label={`${count} notifikasi`} />
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="notif-dropdown" role="dialog" aria-modal="true">
                    <div className="notif-dropdown-header">
                        <span className="notif-dropdown-title">Notifikasi Dokumen</span>
                        {hasNotifications && (
                            <span className="notif-count-pill">{count}</span>
                        )}
                    </div>

                    <div className="notif-list">
                        {loading && notifications.length === 0 ? (
                            <div className="notif-empty">Memuat…</div>
                        ) : notifications.length === 0 ? (
                            <div className="notif-empty">
                                <MdNotificationsNone size={32} />
                                <span>Tidak ada dokumen yang akan berakhir</span>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const cfg = levelConfig[n.level] ?? levelConfig.upcoming;
                                return (
                                    <div
                                        key={n.id}
                                        className={`notif-item ${cfg.className}`}
                                    >
                                        <div className="notif-item-dot" />
                                        <div className="notif-item-body">
                                            <button
                                                className="notif-item-main"
                                                onClick={() => handleItemClick(n.redirect_to)}
                                            >
                                            <span className="notif-item-msg">{n.message}</span>
                                            <div className="notif-item-meta">
                                                <span className={`notif-level-badge ${cfg.className}`}>
                                                    {cfg.label}
                                                </span>
                                                <span className="notif-item-date">
                                                    Berakhir: {new Date(n.berlaku_sampai).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            </button>
                                            {markReadEndpoint && n.notification_key && (
                                                <button
                                                    className="notif-mark-read"
                                                    onClick={(e) => handleMarkAsRead(e, n)}
                                                    title="Sembunyikan notifikasi ini"
                                                >
                                                    Tandai sudah baca
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="notif-dropdown-footer">
                        <button
                            className="notif-footer-link"
                            onClick={() => { setOpen(false); navigate(footerLink); }}
                        >
                            {footerLabel}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
