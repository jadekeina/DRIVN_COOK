import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CandidaturePage from './pages/CandidaturePage';
import Login from './pages/Login';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/candidature" element={<CandidaturePage />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </Router>
    );
}

export default App;



