// Auth Pages (Shared)
import LoginUser from "./pages/auth/login/LoginUser";
import LoginAdmin from "./pages/auth/login/LoginAdmin";
import Register from "./pages/auth/register/Register";
import VerifyEmail from "./pages/auth/verifikasiEmail/VerifikasiEmail";
import ForgotPassword from "./pages/auth/lupaPassword/LupaPassword";

// Main User Pages
import Beranda from "./pages/main/beranda/Beranda";
import Profil from "./pages/main/profil/ProfilSaya";
import Pengaturan from "./pages/main/pengaturan/Pengaturan";
import Dokumen from "./pages/main/dokumen/DokumenLegalitas";
import Kredensial from "./pages/main/kredensial/Kredensial";
import StatusKewenangan from "./pages/main/kewenangan/StatusKewenangan";
import Pendidikan from "./pages/main/pendidikan/RiwayatPendidikan"; 
import PrestasiPenghargaan from "./pages/main/prestasi/PrestasiPenghargaan";
import Penugasan from "./pages/main/penugasan/Penugasan";
import EtikDisiplin from "./pages/main/etikDisiplin/EtikDisiplin";
import GambarKePdf from "./pages/main/alat/GambarKePdf";
import KompresiPdf from "./pages/main/alat/KompresiPdf";
import CetakPdf from "./pages/main/alat/CetakPdf";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { UserProvider } from "./contexts/UserContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Admin Pages
import Dashboard from "./pages/admin/dashboard/Dashboard";
import ManajemenPengguna from "./pages/admin/pengguna/ManajemenPengguna";
import DetailPengguna from "./pages/admin/pengguna/DetailPengguna";
import AdminEtikDisiplin from "./pages/admin/etikDisiplin/EtikDisiplin";
import AdminKompresiPdf from "./pages/admin/alat/KompresiPdf";
import AdminGambarKePdf from "./pages/admin/alat/GambarKePdf";
import ManajemenRole from "./pages/admin/pengaturan/ManajemenRole";
import AkunAdmin from "./pages/admin/pengaturan/AkunAdmin";
import AdminFaq from "./pages/admin/faq/Faq";
import UserFaq from "./pages/main/faq/Faq";

function App() {
  // Detect if we're on the admin subdomain
  const isAdminSubdomain = window.location.hostname.startsWith('komite.');
  
  return (
    <Router>
      <UserProvider>
        <Routes>
        {/* Root and login routes - different for admin subdomain */}
        <Route path="/" element={isAdminSubdomain ? <LoginAdmin /> : <LoginUser />} />
        <Route path="/login" element={isAdminSubdomain ? <LoginAdmin /> : <LoginUser />} />
        
        {/* User-only routes (main domain) */}
        {!isAdminSubdomain && (
          <>
        <Route path="/register" element={<Register />} />
        <Route path="/verifikasi-email" element={<VerifyEmail />} />
        <Route path="/lupa-password" element={<ForgotPassword />} />
        <Route 
          path="/beranda" 
          element={
            <ProtectedRoute>
              <Beranda />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profil" 
          element={
            <ProtectedRoute>
              <Profil />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pengaturan" 
          element={
            <ProtectedRoute>
              <Pengaturan />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dokumen" 
          element={
            <ProtectedRoute>
              <Dokumen />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/riwayat-pendidikan"
          element={
            <ProtectedRoute>
              <Pendidikan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prestasi-penghargaan"
          element={
            <ProtectedRoute>
              <PrestasiPenghargaan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penugasan"
          element={
            <ProtectedRoute>
              <Penugasan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etik-disiplin"
          element={
            <ProtectedRoute>
              <EtikDisiplin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kredensial"
          element={
            <ProtectedRoute>
              <Kredensial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/status-kewenangan"
          element={
            <ProtectedRoute>
              <StatusKewenangan />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/alat/gambar-ke-pdf"
          element={
            <ProtectedRoute>
              <GambarKePdf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alat/kompresi-pdf"
          element={
            <ProtectedRoute>
              <KompresiPdf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alat/cetak-pdf"
          element={
            <ProtectedRoute>
              <CetakPdf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <ProtectedRoute>
              <UserFaq />
            </ProtectedRoute>
          }
        />
          </>
        )}

        {/* Admin Routes (komite subdomain) */}
        {isAdminSubdomain && (
          <>
        <Route 
          path="/dashboard" 
          element={
            <ProtectedAdminRoute>
              <Dashboard />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/pengguna" 
          element={
            <ProtectedAdminRoute>
              <ManajemenPengguna />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/pengguna/:userId" 
          element={
            <ProtectedAdminRoute>
              <DetailPengguna />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/etik-disiplin" 
          element={
            <ProtectedAdminRoute>
              <AdminEtikDisiplin />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/alat/kompresi-pdf" 
          element={
            <ProtectedAdminRoute>
              <AdminKompresiPdf />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/alat/gambar-ke-pdf" 
          element={
            <ProtectedAdminRoute>
              <AdminGambarKePdf />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/pengaturan/role" 
          element={
            <ProtectedAdminRoute>
              <ManajemenRole />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/pengaturan/akun" 
          element={
            <ProtectedAdminRoute>
              <AkunAdmin />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/pengaturan" 
          element={
            <ProtectedAdminRoute>
              <AkunAdmin />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/faq" 
          element={
            <ProtectedAdminRoute>
              <AdminFaq />
            </ProtectedAdminRoute>
          } 
        />
          </>
        )}
      </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
