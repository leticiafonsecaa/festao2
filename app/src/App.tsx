import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIAssistant from './components/AIAssistant';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateEventPage from './pages/CreateEventPage';
import DashboardPage from './pages/DashboardPage';
import GuestsPage from './pages/GuestsPage';
import GiftListPage from './pages/GiftListPage';
import PersonalizationPage from './pages/PersonalizationPage';
import ServicesPage from './pages/ServicesPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import InvitePage from './pages/InvitePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-cream font-body text-charcoal">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/entrar" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />

            {/* convite publico: nao exige login, o token identifica o convidado */}
            <Route path="/convite/:inviteToken" element={<InvitePage />} />

            <Route
              path="/criar-evento"
              element={
                <ProtectedRoute>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:id"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventos/:id/convidados"
              element={
                <ProtectedRoute>
                  <GuestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventos/:id/presentes"
              element={
                <ProtectedRoute>
                  <GiftListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventos/:id/personalizar"
              element={
                <ProtectedRoute>
                  <PersonalizationPage />
                </ProtectedRoute>
              }
            />

            <Route path="/servicos" element={<ServicesPage />} />
            <Route path="/profissional/:id" element={<ProfessionalProfilePage />} />
          </Routes>
          <Footer />
          <AIAssistant />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
