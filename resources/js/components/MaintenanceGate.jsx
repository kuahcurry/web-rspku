import { useEffect, useMemo, useState } from 'react';
import { getAuthHeader } from '../utils/auth';

const overlayStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  padding: '1rem',
};

const cardStyle = {
  maxWidth: '680px',
  width: '100%',
  background: '#ffffff',
  borderRadius: '14px',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.15)',
  padding: '1.5rem',
  border: '1px solid #e2e8f0',
};

const titleStyle = {
  margin: 0,
  fontSize: '1.55rem',
  color: '#0f172a',
};

const textStyle = {
  marginTop: '0.75rem',
  marginBottom: 0,
  color: '#334155',
  lineHeight: 1.6,
};

const rowStyle = {
  marginTop: '1rem',
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const buttonBase = {
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem 0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const MaintenanceGate = ({ children }) => {
  const [checked, setChecked] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [error, setError] = useState('');
  const [turningOff, setTurningOff] = useState(false);

  const isSuperAdmin = useMemo(() => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
      return admin?.role === 'super_admin';
    } catch {
      return false;
    }
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/maintenance/status', {
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMaintenance(Boolean(data.maintenance));
        setError('');
      } else {
        setMaintenance(false);
      }
    } catch {
      setMaintenance(false);
    } finally {
      setChecked(true);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const disableMaintenance = async () => {
    try {
      setTurningOff(true);
      const authHeader = getAuthHeader();
      const response = await fetch('/api/admin/maintenance/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ enabled: false }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data?.message || 'Gagal menonaktifkan mode maintenance');
        return;
      }

      setMaintenance(false);
      setError('');
    } catch (err) {
      setError(err?.message || 'Gagal menonaktifkan mode maintenance');
    } finally {
      setTurningOff(false);
    }
  };

  if (!checked) {
    return children;
  }

  if (!maintenance) {
    return children;
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Website Sedang Maintenance</h1>
        <p style={textStyle}>
          Layanan sementara ditutup untuk perbaikan sistem. Silakan coba lagi beberapa saat.
        </p>

        {isSuperAdmin && (
          <>
            <p style={textStyle}>
              Anda terdeteksi sebagai Super Admin. Gunakan tombol di bawah untuk menonaktifkan maintenance.
            </p>
            <div style={rowStyle}>
              <button
                style={{ ...buttonBase, background: '#16a34a', color: '#fff' }}
                onClick={disableMaintenance}
                disabled={turningOff}
              >
                {turningOff ? 'Menonaktifkan...' : 'Nonaktifkan Maintenance'}
              </button>
              <button
                style={{ ...buttonBase, background: '#475569', color: '#fff' }}
                onClick={checkStatus}
                disabled={turningOff}
              >
                Refresh Status
              </button>
            </div>
          </>
        )}

        {!!error && (
          <p style={{ ...textStyle, color: '#b91c1c' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default MaintenanceGate;
