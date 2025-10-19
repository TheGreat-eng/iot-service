// src/App.tsx
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import LoginPage from './pages/LoginPage';
import AppLayout from './layout/AppLayout';
import NotFoundPage from './pages/NotFoundPage';
import PrivateRoute from './components/PrivateRoute'; // ✅ Chỉ import, không khai báo lại
import NetworkStatus from './components/NetworkStatus'; // ✅ THÊM
import { isAuthenticated } from './utils/auth';

// ✅ Lazy load các trang
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DevicesPage = lazy(() => import('./pages/DevicesPage'));
const RulesPage = lazy(() => import('./pages/RulesPage'));
const FarmsPage = lazy(() => import('./pages/FarmsPage'));
const AIPredictionPage = lazy(() => import('./pages/AIPredictionPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage')); // ✅ THÊM
const RegisterPage = lazy(() => import('./pages/RegisterPage')); // ✅ THÊM
const CreateRulePage = lazy(() => import('./pages/CreateRulePage')); // ✅ THÊM
const EditRulePage = lazy(() => import('./pages/EditRulePage')); // ✅ THÊM

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh'
  }}>
    {/* ✅ BỎ tip prop */}
    <Spin size="large" />
  </div>
);

function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('🔍 App mounted, checking auth...');
    const timer = setTimeout(() => {
      const isAuth = isAuthenticated();
      console.log('🔍 Auth status:', isAuth);
      setIsCheckingAuth(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isCheckingAuth) {
    return <LoadingFallback />;
  }

  return (
    <Router>
      <NetworkStatus /> {/* ✅ THÊM */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ✅ Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ✅ Protected routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="farms" element={<FarmsPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="rules/create" element={<CreateRulePage />} />
            <Route path="rules/edit/:ruleId" element={<EditRulePage />} />
            <Route path="ai" element={<AIPredictionPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>

          {/* ✅ 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;