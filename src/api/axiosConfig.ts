// src/api/axiosConfig.ts
import axios from 'axios';
import { message } from 'antd';
import { getAuthToken, clearAuthData } from '../utils/auth';

// Tạo một instance axios với cấu hình cơ bản
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000, // ✅ THÊM: Timeout 10s
    headers: {
        'Content-Type': 'application/json',
    },
});

// ✅ Request Interceptor - Tự động thêm token
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken(); // ✅ Dùng helper thay vì lấy trực tiếp

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            // ✅ Chỉ redirect nếu không phải API public
            const publicUrls = ['/auth/login', '/auth/register', '/auth/forgot-password'];
            const isPublicUrl = publicUrls.some(url => config.url?.includes(url));

            if (!isPublicUrl) {
                console.warn('No valid token found, redirecting to login');
                clearAuthData();
                window.location.href = '/login';
                return Promise.reject(new Error('No authentication token'));
            }
        }

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// ✅ Response Interceptor - Xử lý lỗi 401/403
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Network error
        if (!error.response) {
            message.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
            return Promise.reject(error);
        }

        const { status, data } = error.response;

        switch (status) {
            case 401:
                // Token expired hoặc invalid
                console.error('Unauthorized - Token invalid or expired');
                clearAuthData();
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

                // Delay để user đọc message trước khi redirect
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
                break;

            case 403:
                // Forbidden - Không có quyền
                message.error('Bạn không có quyền thực hiện thao tác này.');
                break;

            case 404:
                message.error(data?.message || 'Không tìm thấy tài nguyên.');
                break;

            case 500:
                message.error('Lỗi máy chủ. Vui lòng thử lại sau.');
                console.error('Server error:', data);
                break;

            default:
                message.error(data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }

        return Promise.reject(error);
    }
);

export default api;