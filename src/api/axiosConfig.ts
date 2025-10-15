// src/api/axiosConfig.ts
import axios from 'axios';
import { message } from 'antd';

// Tạo một instance axios với cấu hình cơ bản
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thêm một interceptor để tự động gắn token vào header của mỗi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ✅ THÊM: Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            message.error('Bạn không có quyền thực hiện thao tác này.');
        } else if (error.response?.status >= 500) {
            message.error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else if (error.code === 'ERR_NETWORK') {
            message.error('Không thể kết nối đến máy chủ.');
        }
        return Promise.reject(error);
    }
);

export default api;