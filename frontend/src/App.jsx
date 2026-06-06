import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Orders from './pages/Orders';
import Waste from './pages/Waste';
import WeeklyReport from './pages/WeeklyReport';
import Stores from './pages/Stores';
import Products from './pages/Products';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="forecast" element={<Forecast />} />
          <Route path="orders" element={<Orders />} />
          <Route path="waste" element={<Waste />} />
          <Route path="weekly-report" element={<WeeklyReport />} />
          <Route path="stores" element={<Stores />} />
          <Route path="products" element={<Products />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
