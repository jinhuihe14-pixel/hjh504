import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Orders from './pages/Orders';
import Waste from './pages/Waste';
import WeeklyReport from './pages/WeeklyReport';
import Stores from './pages/Stores';
import Products from './pages/Products';
import './App.css';

function RequireAuth({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f3f4f6'
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
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
