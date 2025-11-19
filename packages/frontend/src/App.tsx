import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

