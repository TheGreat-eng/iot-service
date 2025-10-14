// src/types/farm.ts

export interface Farm {
    id: number;
    name: string;
    description?: string;
    location?: string;
    totalDevices?: number;
    onlineDevices?: number;
}

// ===> THÊM ĐỊNH NGHĨA NÀY VÀO ĐÂY <===
export interface FarmFormData {
    name: string;
    location?: string;
    description?: string;
}