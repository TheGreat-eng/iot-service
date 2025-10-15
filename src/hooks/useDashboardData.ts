import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import type { FarmSummary } from '../types/dashboard';

export const useDashboardSummary = (farmId: number) => {
    return useQuery({
        queryKey: ['dashboard-summary', farmId],
        queryFn: async () => {
            const res = await api.get<{ data: FarmSummary }>(`/reports/summary?farmId=${farmId}`);
            return res.data.data;
        },
        refetchInterval: 30000, // Auto-refresh mỗi 30s
        staleTime: 10000,
    });
};

export const useChartData = (deviceId: string, field: string, window: string = '10m') => {
    return useQuery({
        queryKey: ['chart-data', deviceId, field, window],
        queryFn: async () => {
            const res = await api.get(`/devices/${deviceId}/data/aggregated?field=${field}&window=${window}`);
            return res.data.data;
        },
        staleTime: 60000,
    });
};