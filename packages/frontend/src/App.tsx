import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Control from './pages/Control';
import Robots from './pages/Robots';
import Rules from './pages/Rules';
import RuleBuilder from './pages/RuleBuilder';
import Alarms from './pages/Alarms';
import Monitoring from './pages/Monitoring';
import BIMViewer from './pages/BIMViewer';
import CCTV from './pages/CCTV';
import Reports from './pages/Reports';
import Login from './pages/Login';
import ApiKeys from './pages/ApiKeys';
import Datasets from './pages/Datasets';
import AIJobs from './pages/AIJobs';
import ImageLabeler from './pages/ImageLabeler';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/sensors" element={<Sensors />} />
                  <Route path="/control" element={<Control />} />
                  <Route path="/robots" element={<Robots />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/rule-builder" element={<RuleBuilder />} />
                  <Route path="/alarms" element={<Alarms />} />
                  <Route path="/monitoring" element={<Monitoring />} />
                  <Route path="/bim" element={<BIMViewer />} />
                  <Route path="/cctv" element={<CCTV />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/api-keys" element={<ApiKeys />} />
                  <Route path="/datasets" element={<Datasets />} />
                  <Route path="/ai-jobs" element={<AIJobs />} />
                  <Route path="/image-labeler" element={<ImageLabeler />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

