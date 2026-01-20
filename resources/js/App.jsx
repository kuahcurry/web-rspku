import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { RecaptchaProvider } from "./contexts/RecaptchaContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import LoadingFallback from "./components/LoadingFallback";

// Auth Pages (Lazy Loaded)
const LoginUser = lazy(() => import("./pages/auth/login/LoginUser"));
const LoginAdmin = lazy(() => import("./pages/auth/login/LoginAdmin"));
const Register = lazy(() => import("./pages/auth/register/Register"));
const VerifyEmail = lazy(() => import("./pages/auth/verifikasiEmail/VerifikasiEmail"));
const ForgotPassword = lazy(() => import("./pages/auth/lupaPassword/LupaPassword"));

// Main User Pages (Lazy Loaded)
const Beranda = lazy(() => import("./pages/main/beranda/Beranda"));
const Profil = lazy(() => import("./pages/main/profil/ProfilSaya"));
const Pengaturan = lazy(() => import("./pages/main/pengaturan/Pengaturan"));
const Dokumen = lazy(() => import("./pages/main/dokumen/DokumenLegalitas"));
const Kredensial = lazy(() => import("./pages/main/kredensial/Kredensial"));
const StatusKewenangan = lazy(() => import("./pages/main/kewenangan/StatusKewenangan"));
const Pendidikan = lazy(() => import("./pages/main/pendidikan/RiwayatPendidikan")); 
const PrestasiPenghargaan = lazy(() => import("./pages/main/prestasi/PrestasiPenghargaan"));
const Penugasan = lazy(() => import("./pages/main/penugasan/Penugasan"));
const EtikDisiplin = lazy(() => import("./pages/main/etikDisiplin/EtikDisiplin"));
const GambarKePdf = lazy(() => import("./pages/main/alat/GambarKePdf"));
const KompresiPdf = lazy(() => import("./pages/main/alat/KompresiPdf"));
const CetakPdf = lazy(() => import("./pages/main/alat/CetakPdf"));
const UserFaq = lazy(() => import("./pages/main/faq/Faq"));

// Admin Pages (Lazy Loaded)
const Dashboard = lazy(() => import("./pages/admin/dashboard/Dashboard"));
const ManajemenPengguna = lazy(() => import("./pages/admin/pengguna/ManajemenPengguna"));
const DetailPengguna = lazy(() => import("./pages/admin/pengguna/DetailPengguna"));
const AdminEtikDisiplin = lazy(() => import("./pages/admin/etikDisiplin/EtikDisiplin"));
const AdminKompresiPdf = lazy(() => import("./pages/admin/alat/KompresiPdf"));
const AdminGambarKePdf = lazy(() => import("./pages/admin/alat/GambarKePdf"));
const ManajemenRole = lazy(() => import("./pages/admin/pengaturan/ManajemenRole"));
const AkunAdmin = lazy(() => import("./pages/admin/pengaturan/AkunAdmin"));
const AdminFaq = lazy(() => import("./pages/admin/faq/Faq"));

function App() {
  // Detect if we're on admin subdomain
  const hostname = window.location.hostname;
  const isAdminSubdomain = hostname.startsWith('komite.');
  
  return (
    <Router>
      <RecaptchaProvider>
        <UserProvider>
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth Routes */}
            <Route path="/" element={isAdminSubdomain ? <LoginAdmin /> : <LoginUser />} />
            <Route path="/login" element={isAdminSubdomain ? <LoginAdmin /> : <LoginUser />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verifikasi-email" element={<VerifyEmail />} />
            <Route path="/lupa-password" element={<ForgotPassword />} />

        {/* Admin Routes - Must come BEFORE user routes to avoid conflicts */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedAdminRoute>
              <Dashboard />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/admin/pengguna" 
          element={
            <ProtectedAdminRoute>
              <ManajemenPengguna />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/admin/pengguna/:userId" 
          element={
            <ProtectedAdminRoute>
              <DetailPengguna />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/admin/etik-disiplin" 
          element={
            <ProtectedAdminRoute>
              <AdminEtikDisiplin />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/admin/alat/kompresi-pdf" 
          element={
            <ProtectedAdminRoute>
              <AdminKompresiPdf />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/admin/alat/gambar-ke-pdf" 
          element={
            <ProtectedAdminRoute>
              <AdminGambarKePdf />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/admin/faq" 
          element={
            <ProtectedAdminRoute>
              <AdminFaq />
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
          path="/admin/pengaturan" 
          element={
            <ProtectedAdminRoute>
              <AkunAdmin />
            </ProtectedAdminRoute>
          } 
        />

        {/* User Routes */}
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
          </Routes>
        </Suspense>
        </UserProvider>
      </RecaptchaProvider>
    </Router>
  );
}

export default App;
