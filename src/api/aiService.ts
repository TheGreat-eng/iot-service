// src/api/aiService.ts

import api from './axiosConfig';
import type { AIPredictionResponse } from '../types/ai';

export const getAIPredictions = (farmId: number) => {
    return api.get<{ data: AIPredictionResponse }>(`/ai/predictions?farmId=${farmId}`);
};