import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CandidaturePage from "./pages/CandidaturePage";
import Login from "./pages/Login";
import ActivationPage from "./pages/ActivationPage";
import FranchiseDashboard from "./pages/FranchiseDashboard";
import MesCommandes from "./pages/MesCommandes";
import MesVentes from "./pages/MesVentes";
import FranchisePayment from './pages/FranchisePaiement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/candidature" element={<CandidaturePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/activation/:token" element={<ActivationPage />} />
        <Route path="/franchise-dashboard" element={<FranchiseDashboard />} />
        <Route path="/mes-commandes" element={<MesCommandes />} />
        <Route path="/mes-ventes" element={<MesVentes />} />
        <Route path="/franchise/paiement/:token" element={<FranchisePayment />} />

      </Routes>
    </Router>
  );
}

export default App;
