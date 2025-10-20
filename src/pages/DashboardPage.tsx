// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Spin, Alert, Typography, Tabs, message, Result, Button, Select, Space } from 'antd';
import { Thermometer, Droplet, Sun, Wifi, BarChart3, Beaker } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axiosConfig';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import { useFarm } from '../context/FarmContext';
import type { FarmSummary, ChartDataPoint } from '../types/dashboard';
import { getDevicesByFarm } from '../api/deviceService';
import type { Device } from '../types/device';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import type { SensorDataMessage } from '../types/websocket';
import { getAuthToken } from '../utils/auth';
import { Empty } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

const StatsCard = React.memo<{ title: string; value: number; icon: React.ReactNode; suffix?: string; precision?: number }>(
    ({ title, value, icon, suffix, precision }) => (
        <Card hoverable style={{ height: '100%' }}>
            <Statistic title={title} value={value} precision={precision} prefix={icon} suffix={suffix} />
        </Card>
    )
);

interface AggregatedDataPoint {
    timestamp: string;
    avgValue?: number;
}

const DashboardPage: React.FC = () => {
    const { farmId, isLoadingFarm } = useFarm();
    const navigate = useNavigate();

    const [summary, setSummary] = useState<FarmSummary | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [activeChart, setActiveChart] = useState<'env' | 'soil'>('env');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartLoading, setChartLoading] = useState(false);
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedEnvDevice, setSelectedEnvDevice] = useState<string | undefined>(undefined);
    const [selectedSoilDevice, setSelectedSoilDevice] = useState<string | undefined>(undefined);
    const [selectedPHDevice, setSelectedPHDevice] = useState<string | undefined>(undefined);

    const envDevices = useMemo(() => devices.filter(d => d.type === 'SENSOR_DHT22'), [devices]);
    const soilDevices = useMemo(() => devices.filter(d => d.type === 'SENSOR_SOIL_MOISTURE'), [devices]);
    const phDevices = useMemo(() => devices.filter(d => d.type === 'SENSOR_PH'), [devices]);

    // Effect để tải dữ liệu ban đầu
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!farmId) { setLoading(false); return; }
            try {
                setLoading(true);
                const [devicesRes, summaryRes] = await Promise.all([
                    getDevicesByFarm(farmId),
                    api.get<{ data: FarmSummary }>(`/reports/summary?farmId=${farmId}`)
                ]);

                if (isMounted) {
                    const deviceList = devicesRes.data.data;
                    setDevices(deviceList);
                    setSummary(summaryRes.data.data);

                    // Tự động chọn cảm biến nếu chưa có
                    if (!selectedEnvDevice) setSelectedEnvDevice(deviceList.find(d => d.type === 'SENSOR_DHT22')?.deviceId);
                    if (!selectedSoilDevice) setSelectedSoilDevice(deviceList.find(d => d.type === 'SENSOR_SOIL_MOISTURE')?.deviceId);
                    if (!selectedPHDevice) setSelectedPHDevice(deviceList.find(d => d.type === 'SENSOR_PH')?.deviceId);

                    setError(null);
                }
            } catch (err) {
                if (isMounted) { console.error("Failed to fetch initial data:", err); setError("Không thể tải dữ liệu. Vui lòng thử lại."); }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [farmId]);

    // ✅ ĐƠN GIẢN HÓA LOGIC FETCH BIỂU ĐỒ
    const fetchChartData = useCallback(async () => {
        setChartLoading(true);
        setChartData([]);

        try {
            if (activeChart === 'env') {
                if (!selectedEnvDevice) return;
                const [tempRes, humidityRes] = await Promise.all([
                    api.get<{ data: AggregatedDataPoint[] }>(`/devices/${selectedEnvDevice}/data/aggregated?field=temperature&window=10m`),
                    api.get<{ data: AggregatedDataPoint[] }>(`/devices/${selectedEnvDevice}/data/aggregated?field=humidity&window=10m`),
                ]);
                const merged = mergeChartData(tempRes.data.data, humidityRes.data.data, 'temperature', 'humidity');
                setChartData(merged);
            } else if (activeChart === 'soil') {
                if (!selectedSoilDevice || !selectedPHDevice) return;
                const [soilMoistureRes, soilPHRes] = await Promise.all([
                    api.get<{ data: AggregatedDataPoint[] }>(`/devices/${selectedSoilDevice}/data/aggregated?field=soil_moisture&window=10m`),
                    api.get<{ data: AggregatedDataPoint[] }>(`/devices/${selectedPHDevice}/data/aggregated?field=soilPH&window=10m`),
                ]);
                const merged = mergeChartData(soilMoistureRes.data.data, soilPHRes.data.data, 'soilMoisture', 'soilPH');
                setChartData(merged);
            }
        } catch (err) {
            console.error(`Failed to fetch chart data:`, err);
            message.error(`Không thể tải dữ liệu biểu đồ.`);
        } finally {
            setChartLoading(false);
        }
    }, [activeChart, selectedEnvDevice, selectedSoilDevice, selectedPHDevice]);

    // ✅ HELPER FUNCTION để gộp dữ liệu biểu đồ một cách an toàn
    const mergeChartData = (data1: AggregatedDataPoint[], data2: AggregatedDataPoint[], key1: string, key2: string): ChartDataPoint[] => {
        const dataMap = new Map<string, ChartDataPoint>();

        data1.forEach(p => {
            const time = new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            dataMap.set(time, { ...dataMap.get(time), time, [key1]: p.avgValue });
        });

        data2.forEach(p => {
            const time = new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            dataMap.set(time, { ...dataMap.get(time), time, [key2]: p.avgValue });
        });

        return Array.from(dataMap.values()).sort((a, b) => a.time.localeCompare(b.time));
    };

    // Effect để gọi fetchChartData khi các dependency thay đổi
    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);


    // WebSocket useEffect (giữ nguyên, đã hoạt động tốt)
    useEffect(() => {
        if (farmId === null) return;
        const token = getAuthToken();
        if (!token) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`http://localhost:8080/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('✅ WebSocket/STOMP Connected!');
            client.subscribe(`/topic/farm/${farmId}/sensor-data`, (msg) => {
                try {
                    const newData: SensorDataMessage = JSON.parse(msg.body);
                    setSummary((prev) => {
                        if (!prev) return null;
                        const newAvg = { ...prev.averageEnvironment };
                        if (newData.temperature !== undefined) newAvg.avgTemperature = newData.temperature;
                        if (newData.humidity !== undefined) newAvg.avgHumidity = newData.humidity;
                        if (newData.soilMoisture !== undefined) newAvg.avgSoilMoisture = newData.soilMoisture;
                        if (newData.soilPH !== undefined) newAvg.avgSoilPH = newData.soilPH;
                        if (newData.lightIntensity !== undefined) newAvg.avgLightIntensity = newData.lightIntensity;
                        return { ...prev, averageEnvironment: newAvg };
                    });
                } catch (e) {
                    console.error("Error processing WebSocket message:", e);
                }
            });
        };

        client.onStompError = (frame) => console.error('STOMP Error:', frame.headers['message'], frame.body);
        client.activate();
        return () => { if (client.active) client.deactivate(); };
    }, [farmId]);

    const handleTabChange = useCallback((key: string) => {
        setActiveChart(key as 'env' | 'soil');
    }, []);

    // JSX và các phần còn lại giữ nguyên...
    const statsCards = useMemo(() => (
        <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} md={8} lg={12} xl={8}><StatsCard title="Thiết bị Online" value={summary?.onlineDevices ?? 0} icon={<Wifi color="green" size={20} />} suffix={`/ ${summary?.totalDevices ?? 0}`} /></Col>
            <Col xs={12} sm={12} md={8} lg={12} xl={8}><StatsCard title="Nhiệt độ TB" value={summary?.averageEnvironment?.avgTemperature ?? 0} precision={1} icon={<Thermometer color="#ff4d4f" size={20} />} suffix="°C" /></Col>
            <Col xs={12} sm={12} md={8} lg={12} xl={8}><StatsCard title="Độ ẩm KK" value={summary?.averageEnvironment?.avgHumidity ?? 0} precision={1} icon={<Droplet color="#1677ff" size={20} />} suffix="%" /></Col>
            <Col xs={12} sm={12} md={8} lg={12} xl={8}><StatsCard title="Độ ẩm Đất" value={summary?.averageEnvironment?.avgSoilMoisture ?? 0} precision={1} icon={<BarChart3 color="#82ca9d" size={20} />} suffix="%" /></Col>
            <Col xs={12} sm={12} md={8} lg={12} xl={8}><StatsCard title="Độ pH Đất" value={summary?.averageEnvironment?.avgSoilPH ?? 0} precision={2} icon={<Beaker color="#ffc658" size={20} />} /></Col>
            <Col xs={12} sm={12} md={8} lg={12} xl={8}><StatsCard title="Ánh sáng TB" value={summary?.averageEnvironment?.avgLightIntensity ?? 0} precision={0} icon={<Sun color="#faad14" size={20} />} suffix=" lux" /></Col>
        </Row>
    ), [summary]);

    const chartComponent = useMemo(() => {
        const renderChartContent = () => {
            if (chartLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}><Spin /></div>;
            if (chartData.length === 0) return <Empty description="Không có dữ liệu biểu đồ" style={{ height: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />;
            if (activeChart === 'env') {
                return <ResponsiveContainer width="100%" height={350}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis yAxisId="left" stroke="#ff4d4f" domain={['dataMin - 2', 'dataMax + 2']} /><YAxis yAxisId="right" orientation="right" stroke="#1677ff" domain={['dataMin - 5', 'dataMax + 5']} /><Tooltip /><Legend /><Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff4d4f" name="Nhiệt độ (°C)" dot={false} /><Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#1677ff" name="Độ ẩm không khí (%)" dot={false} /></LineChart></ResponsiveContainer>;
            }
            if (activeChart === 'soil') {
                return <ResponsiveContainer width="100%" height={350}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis yAxisId="left" stroke="#82ca9d" domain={[0, 100]} /><YAxis yAxisId="right" orientation="right" stroke="#ffc658" domain={[4, 9]} /><Tooltip /><Legend /><Line yAxisId="left" type="monotone" dataKey="soilMoisture" stroke="#82ca9d" name="Độ ẩm đất (%)" dot={false} /><Line yAxisId="right" type="monotone" dataKey="soilPH" stroke="#ffc658" name="Độ pH đất" dot={false} /></LineChart></ResponsiveContainer>;
            }
            return null;
        };
        return (
            <div>
                {activeChart === 'env' && (<div style={{ marginBottom: 16 }}><Text style={{ marginRight: 8 }}>Chọn cảm biến môi trường:</Text><Select value={selectedEnvDevice} onChange={setSelectedEnvDevice} style={{ width: 200 }} placeholder="Chọn cảm biến DHT22">{envDevices.map(d => <Option key={d.deviceId} value={d.deviceId}>{d.name} ({d.deviceId})</Option>)}</Select></div>)}
                {activeChart === 'soil' && (<Space style={{ marginBottom: 16 }} wrap><Text>Cảm biến độ ẩm:</Text><Select value={selectedSoilDevice} onChange={setSelectedSoilDevice} style={{ width: 200 }} placeholder="Chọn cảm biến đất">{soilDevices.map(d => <Option key={d.deviceId} value={d.deviceId}>{d.name} ({d.deviceId})</Option>)}</Select><Text>Cảm biến pH:</Text><Select value={selectedPHDevice} onChange={setSelectedPHDevice} style={{ width: 200 }} placeholder="Chọn cảm biến pH">{phDevices.map(d => <Option key={d.deviceId} value={d.deviceId}>{d.name} ({d.deviceId})</Option>)}</Select></Space>)}
                {renderChartContent()}
            </div>
        );
    }, [chartData, activeChart, chartLoading, selectedEnvDevice, selectedSoilDevice, selectedPHDevice, envDevices, soilDevices, phDevices]);

    if (isLoadingFarm) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Spin size="large" /></div>;
    if (!farmId) return <Result status="info" title="Chưa có nông trại" subTitle="Vui lòng tạo hoặc chọn nông trại để xem dữ liệu." extra={<Button type="primary" onClick={() => navigate('/farms')}>Quản lý Nông trại</Button>} />;
    if (loading && !summary) return <DashboardSkeleton />;
    if (error) return <Alert message="Lỗi" description={error} type="error" showIcon style={{ margin: '20px' }} />;

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: '24px' }}>Dashboard Tổng Quan</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>{statsCards}<Card style={{ marginTop: '24px' }}><Tabs defaultActiveKey="env" onChange={handleTabChange} items={[{ key: 'env', label: 'Môi trường (Không khí)' }, { key: 'soil', label: 'Dữ liệu Đất' },]} />{chartComponent}</Card></Col>
                <Col xs={24} lg={8}><WeatherWidget /></Col>
            </Row>
        </div>
    );
};

export default DashboardPage;