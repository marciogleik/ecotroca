import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import PublicPortal from './pages/PublicPortal';
import Cadastro from './pages/Cadastro';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ImpactPage from './pages/ImpactPage';
import NewsPage from './pages/NewsPage';
import NewsArticlePage from './pages/NewsArticlePage';

// Escola Pages
import EscolaDashboard from './pages/escola/Dashboard';
import Students from './pages/escola/Students';
import NewStudent from './pages/escola/NewStudent';
import RegisterDelivery from './pages/escola/RegisterDelivery';
import EscolaReports from './pages/escola/Reports';

// Sicredi Pages
import SicrediDashboard from './pages/sicredi/Dashboard';
import Vendors from './pages/sicredi/Vendors';
import RedeemTokens from './pages/sicredi/RedeemTokens';
import SicrediHistory from './pages/sicredi/History';

// Prefeitura Pages
import PrefeituraDashboard from './pages/prefeitura/Dashboard';
import EnvironmentalImpact from './pages/prefeitura/EnvironmentalImpact';
import Reports from './pages/prefeitura/Reports';
import SchoolManagement from './pages/prefeitura/SchoolManagement';
import StudentsList from './pages/prefeitura/StudentsList';
import VendorsList from './pages/prefeitura/VendorsList';
import InviteManagement from './pages/prefeitura/InviteManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        
        {/* Escola Routes */}
        <Route path="/escola" element={
          <ProtectedRoute allowedRoles={['escola']}>
            <Layout><EscolaDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/escola/alunos" element={
          <ProtectedRoute allowedRoles={['escola']}>
            <Layout><Students /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/escola/novo-aluno" element={
          <ProtectedRoute allowedRoles={['escola']}>
            <Layout><NewStudent /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/escola/entrega" element={
          <ProtectedRoute allowedRoles={['escola']}>
            <Layout><RegisterDelivery /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/escola/relatorios" element={
          <ProtectedRoute allowedRoles={['escola']}>
            <Layout><EscolaReports /></Layout>
          </ProtectedRoute>
        } />

        {/* Sicredi Routes */}
        <Route path="/sicredi" element={
          <ProtectedRoute allowedRoles={['sicredi']}>
            <Layout><SicrediDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/sicredi/comerciantes" element={
          <ProtectedRoute allowedRoles={['sicredi']}>
            <Layout><Vendors /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/sicredi/resgate" element={
          <ProtectedRoute allowedRoles={['sicredi']}>
            <Layout><RedeemTokens /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/sicredi/historico" element={
          <ProtectedRoute allowedRoles={['sicredi']}>
            <Layout><SicrediHistory /></Layout> 
          </ProtectedRoute>
        } />

        {/* Prefeitura Routes */}
        <Route path="/prefeitura" element={
          <ProtectedRoute allowedRoles={['prefeitura']}>
            <Layout><PrefeituraDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/prefeitura/alunos" element={
          <ProtectedRoute allowedRoles={['prefeitura']}>
            <Layout><StudentsList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/prefeitura/comerciantes" element={
          <ProtectedRoute allowedRoles={['prefeitura']}>
            <Layout><VendorsList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/prefeitura/impacto" element={
          <ProtectedRoute allowedRoles={['prefeitura']}>
            <Layout><EnvironmentalImpact /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/prefeitura/relatorios" element={
          <ProtectedRoute allowedRoles={['prefeitura']}>
            <Layout><Reports /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/prefeitura/escolas" element={
          <ProtectedRoute allowedRoles={['prefeitura']}>
            <Layout><SchoolManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/prefeitura/convites" element={
          <ProtectedRoute allowedRoles={['prefeitura']}>
            <Layout><InviteManagement /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/impacto" element={<ImpactPage />} />
        <Route path="/noticias" element={<NewsPage />} />
        <Route path="/noticias/:slug" element={<NewsArticlePage />} />
        <Route path="/" element={<PublicPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
