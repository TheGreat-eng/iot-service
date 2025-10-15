import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth'; // ✅ THÊM

interface PrivateRouteProps {
    children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    // ✅ SỬA: Dùng helper function
    if (!isAuthenticated()) {
        console.warn('User not authenticated, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRoute;