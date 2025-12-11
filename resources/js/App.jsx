import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import VerifyEmail from "./pages/verify-email/VerifyEmail";
import ForgotPassword from "./pages/forgot-password/ForgotPassword";
import Beranda from "./pages/beranda/Beranda";
import Profil from "./pages/profil/ProfilSaya";
import Pengaturan from "./pages/pengaturan/Pengaturan";
import Dokumen from "./pages/dokumen/DokumenLegalitas";
import Kredensial from "./pages/kredensial/Kredensial";
import StatusKewenangan from "./pages/kewenangan/StatusKewenangan";
import Pendidikan from "./pages/pendidikan/RiwayatPendidikan"; 
import PrestasiPenghargaan from "./pages/prestasi/PrestasiPenghargaan";
import Penugasan from "./pages/penugasan/Penugasan";
import EtikDisiplin from "./pages/etik/EtikDisiplin";
import GambarKePdf from "./pages/alat/GambarKePdf";
import KompresiPdf from "./pages/alat/KompresiPdf";
import CetakPdf from "./pages/alat/CetakPdf";
import ProtectedRoute from "./components/ProtectedRoute";
import { UserProvider } from "./contexts/UserContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
          path="/riwayat-etik"
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
      </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
