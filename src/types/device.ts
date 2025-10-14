// src/types/device.ts

export interface Device {
    id: number;
    deviceId: string;
    name: string;
    type: string;
    status: 'ONLINE' | 'OFFLINE' | 'ERROR';
    lastSeen: string;
    farmId: number;
}