import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

interface PrivateRouteProps {
    children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const location = useLocation();

    // ✅ Log để debug
    useEffect(() => {
        console.log('PrivateRoute check:', {
            path: location.pathname,
            authenticated: isAuthenticated()
        });
    }, [location]);

    if (!isAuthenticated()) {
        console.warn('Not authenticated, redirecting to login');
        // ✅ Lưu URL trước đó để redirect sau khi login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;