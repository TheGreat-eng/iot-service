// src/api/farmService.ts

import api from './axiosConfig';
// Sửa lại dòng import này
import type { Farm, FarmFormData } from '../types/farm';

// XÓA BỎ ĐỊNH NGHĨA FarmFormData Ở ĐÂY (NẾU CÓ)

export const getFarms = () => {
    return api.get<{ data: Farm[] }>('/farms');
};

// Hàm này bây giờ sẽ dùng FarmFormData được import
export const createFarm = (data: FarmFormData) => {
    return api.post<Farm>('/farms', data);
};

export const updateFarm = (id: number, data: FarmFormData) => {
    return api.put<Farm>(`/farms/${id}`, data);
};

export const deleteFarm = (id: number) => {
    return api.delete(`/farms/${id}`);
};