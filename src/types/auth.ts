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