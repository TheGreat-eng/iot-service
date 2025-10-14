// src/types/ai.ts

export interface AIPredictionPoint {
    timestamp: string;
    predicted_temperature?: number;
    predicted_humidity?: number;
    predicted_soil_moisture?: number;
}

export interface AISuggestion {
    action: string;
    message: string;
    confidence: number;
    details: any;
}

export interface AIPredictionResponse {
    predictions: AIPredictionPoint[];
    suggestion: AISuggestion;
    model_info: {
        model_name: string;
        training_date: string;
    };
}