// src/api/authService.ts
import axios from 'axios';
import type { LoginRequest, RegisterRequest } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL + '/auth';

export const login = (credentials: LoginRequest) => {
    return axios.post(`${API_URL}/login`, credentials);
};

export const register = (userInfo: RegisterRequest) => {
    return axios.post(`${API_URL}/register`, userInfo);
};