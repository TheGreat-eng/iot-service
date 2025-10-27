// src/types/ai.ts

export interface AIPredictionPoint {
    timestamp: string | null; // Backend có thể trả về null
    predicted_temperature?: number | null;
    predicted_humidity?: number | null;
    predicted_soil_moisture?: number | null;
}

export interface AISuggestion {
    action: string;
    message: string;
    confidence: number | null; // Backend có thể trả về null
    details: any | null;
}

export interface AIPredictionResponse {
    predictions: AIPredictionPoint[];
    suggestion: AISuggestion;
    model_info: { // Backend có thể trả về null khi AI service chưa sẵn sàng
        model_name: string;
        training_date: string;
    } | null;
}