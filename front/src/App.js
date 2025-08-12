import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CandidaturePage from "./pages/CandidaturePage";
import Login from "./pages/Login";
import ActivationPage from "./pages/ActivationPage";
import FranchiseDashboard from "./pages/FranchiseDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/candidature" element={<CandidaturePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/activation/:token" element={<ActivationPage />} />
        <Route path="/franchise-dashboard" element={<FranchiseDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
