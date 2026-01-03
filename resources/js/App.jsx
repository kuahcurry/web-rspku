// Auth Pages (Shared)
import Login from "./pages/auth/login/Login";
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

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
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

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/pengguna" element={<ManajemenPengguna />} />
        <Route path="/admin/pengguna/:userId" element={<DetailPengguna />} />
        <Route path="/admin/etik-disiplin" element={<AdminEtikDisiplin />} />
        <Route path="/admin/alat/kompresi-pdf" element={<AdminKompresiPdf />} />
        <Route path="/admin/alat/gambar-ke-pdf" element={<AdminGambarKePdf />} />
        <Route path="/admin/pengaturan/role" element={<ManajemenRole />} />
        <Route path="/admin/pengaturan/akun" element={<AkunAdmin />} />
        <Route path="/admin/pengaturan" element={<AkunAdmin />} />
      </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
