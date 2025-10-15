// src/App.tsx
import React, { type JSX } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppLayout from './layout/AppLayout';
import 'antd/dist/reset.css';
import DevicesPage from './pages/DevicesPage';
import RulesPage from './pages/RulesPage';
import CreateRulePage from './pages/CreateRulePage';
import EditRulePage from './pages/EditRulePage';
import FarmsPage from './pages/FarmsPage'; // ✅ THÊM IMPORT NÀY
import { RobotOutlined } from '@ant-design/icons'; // Thêm icon
import AIPredictionPage from './pages/AIPredictionPage'; // Import trang mới
import RegisterPage from './pages/RegisterPage'; // Import trang thật


import NotFoundPage from './pages/NotFoundPage'; // Import trang 404

import ChangePasswordPage from './pages/ChangePasswordPage'; // Import trang mới
// src/App.tsx
import ProfilePage from './pages/ProfilePage'; // Import trang thật



// Component PrivateRoute để kiểm tra người dùng đã đăng nhập chưa
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};


function App() {
  return (
    <Router>
      <Routes>
        {/* Các trang không cần đăng nhập */}
        <Route path="/login" element={<LoginPage />} />

        {/* Các trang cần đăng nhập sẽ nằm trong AppLayout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* Route mặc định khi vào trang được bảo vệ */}
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="farms" element={<FarmsPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="rules/create" element={<CreateRulePage />} />
          <Route path="rules/edit/:ruleId" element={<EditRulePage />} />
          <Route path="ai" element={<AIPredictionPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>

        {/* Chuyển hướng nếu vào trang không tồn tại */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;