import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Beranda from "./pages/beranda/Beranda";
import Profil from "./pages/profil/ProfilSaya";
import Pengaturan from "./pages/pengaturan/Pengaturan";
import Dokumen from "./pages/dokumen/DokumenLegalitas";
import Kredensial from "./pages/kredensial/Kredensial";
import Pendidikan from "./pages/pendidikan/RiwayatPendidikan"; 
import Penugasan from "./pages/penugasan/Penugasan";
import EtikDisiplin from "./pages/etik/EtikDisiplin";
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
      </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
