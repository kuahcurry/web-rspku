import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Beranda from "./pages/beranda/Beranda";
import Profil from "./pages/profil/ProfilSaya";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
}

export default App;
