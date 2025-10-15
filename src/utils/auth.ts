import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    exp: number;
    userId: string;
    username?: string;
    roles?: string[];
}

/**
 * Kiểm tra token có hết hạn chưa
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        // Thêm buffer 30 giây để tránh edge case
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
export const getUserFromToken = (token: string): DecodedToken | null => {
    try {
        return jwtDecode<DecodedToken>(token);
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
export const setAuthData = (token: string, user: any): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Kiểm tra user đã đăng nhập chưa
 */
export const isAuthenticated = (): boolean => {
    return getAuthToken() !== null;
};