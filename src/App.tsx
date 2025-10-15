// src/App.tsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import LoginPage from './pages/LoginPage';
import AppLayout from './layout/AppLayout';
import NotFoundPage from './pages/NotFoundPage';
import PrivateRoute from './components/PrivateRoute'; // ✅ Chỉ import, không khai báo lại

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
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <Spin size="large" tip="Đang tải..." />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ✅ Các trang public (không cần đăng nhập) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ✅ Các trang protected (cần đăng nhập) */}
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