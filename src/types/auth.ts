// src/types/auth.ts
export interface LoginRequest {
    email?: string;
    password?: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
}

export interface AuthResponse {
    token: string;
    userId: string;
    email?: string;
    fullName?: string;
    expiresIn?: number;
}

// src/utils/auth.ts
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    exp: number;
    sub: string; // ✅ Email nằm trong field "sub"
    userId?: string;
    username?: string;
    roles?: string[];
}

/**
 * Kiểm tra token có hết hạn chưa
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        return decoded.exp * 1000 < Date.now() + 30000;
    } catch (error) {
        console.error('Failed to decode token:', error);
        return true;
    }
};

/**
 * Lấy token từ localStorage và validate
 */
export const getAuthToken = (): string | null => {
    const token = localStorage.getItem('token');

    if (!token) {
        return null;
    }

    if (isTokenExpired(token)) {
        console.warn('Token expired, clearing auth data');
        clearAuthData();
        return null;
    }

    return token;
};

/**
 * Lấy thông tin user từ token
 */
export const getUserFromToken = (token: string): any | null => {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // ✅ SỬA: Map field "sub" sang "email"
        return {
            userId: decoded.sub, // ✅ "sub" chính là email
            username: decoded.sub.split('@')[0], // ✅ Lấy phần trước @ làm username
            email: decoded.sub,
            roles: decoded.roles || ['FARMER']
        };
    } catch (error) {
        console.error('Failed to decode user info:', error);
        return null;
    }
};

/**
 * Kiểm tra user có role cụ thể không
 */
export const hasRole = (role: string): boolean => {
    const token = getAuthToken();
    if (!token) return false;

    const user = getUserFromToken(token);
    return user?.roles?.includes(role) || false;
};

/**
 * Xóa tất cả dữ liệu auth
 */
export const clearAuthData = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedFarmId');
};

/**
 * Lưu token và user info
 */
export const setAuthData = (token: string, user?: any): void => {
    localStorage.setItem('token', token);
    
    if (user && typeof user === 'object') {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        // ✅ Nếu không có user, tạo từ token
        const decodedUser = getUserFromToken(token);
        if (decodedUser) {
            localStorage.setItem('user', JSON.stringify(decodedUser));
        }
    }
};

/**
 * Lấy user info từ localStorage (safe parse)
 */
export const getUserFromStorage = (): any | null => {
    try {
        const userStr = localStorage.getItem('user');
        
        if (!userStr || userStr === 'undefined' || userStr === 'null') {
            // ✅ Fallback: Lấy từ token
            const token = getAuthToken();
            if (token) {
                return getUserFromToken(token);
            }
            return null;
        }
        
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
        
        // ✅ Fallback: Lấy từ token
        const token = getAuthToken();
        if (token) {
            return getUserFromToken(token);
        }
        return null;
    }
};

/**
 * Kiểm tra user đã đăng nhập chưa
 */
export const isAuthenticated = (): boolean => {
    return getAuthToken() !== null;
};