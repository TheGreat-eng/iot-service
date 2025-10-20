// src/types/common.ts
export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // Current page number
    size: number;
}