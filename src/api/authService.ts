// src/api/authService.ts
import axios from 'axios';
import type { RegisterRequest } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL + '/auth';

// ✅ SỬA: Nhận username và password trực tiếp
export const login = (username: string, password: string) => {
    return axios.post(`${API_URL}/login`, { username, password });
};

export const register = (userInfo: RegisterRequest) => {
    return axios.post(`${API_URL}/register`, userInfo);
};