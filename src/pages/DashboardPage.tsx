// src/pages/DashboardPage.tsx

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, Typography, Tabs } from 'antd';
import { Thermometer, Droplet, Sun, Wifi, BarChart3, Beaker } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axiosConfig';
import { Client } from '@stomp/stompjs';

const { Title } = Typography;

interface ChartDataPoint {
    time: string;
    [key: string]: number | string | undefined;
}

const DashboardPage: React.FC = () => {
    const [summary, setSummary] = useState<any>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [activeChart, setActiveChart] = useState<'env' | 'soil'>('env');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const farmId = 1;

    // PHẦN 1: Tải dữ liệu ban đầu khi vào trang
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const summaryRes = await api.get(`/reports/summary?farmId=${farmId}`);
                setSummary(summaryRes.data.data);
                await fetchChartData('env');
                setError(null);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("Không thể tải dữ liệu. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [farmId]);

    // =====================================================================
    // ====> BỔ SUNG ĐOẠN LOGIC WEBSOCKET BỊ THIẾU VÀO ĐÂY <====
    // =====================================================================
    useEffect(() => {
        const client = new Client({
            // SỬA LẠI BROKER URL
            webSocketFactory: () => new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/websocket`),
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            console.log('✅ WebSocket/STOMP Connected!');

            // Lắng nghe topic dữ liệu cảm biến của farm
            client.subscribe(`/topic/farm/${farmId}/sensor-data`, (message) => {
                try {
                    const newData = JSON.parse(message.body);
                    console.log('📬 Received real-time data:', newData);

                    // Cập nhật các card thống kê
                    setSummary((prevSummary: any) => {
                        if (!prevSummary) return null;
                        const newAvg = { ...prevSummary.averageEnvironment };
                        if (newData.temperature) newAvg.avgTemperature = newData.temperature;
                        if (newData.humidity) newAvg.avgHumidity = newData.humidity;
                        if (newData.soilMoisture) newAvg.avgSoilMoisture = newData.soilMoisture;
                        if (newData.soilPH) newAvg.avgSoilPH = newData.soilPH;
                        if (newData.lightIntensity) newAvg.avgLightIntensity = newData.lightIntensity;
                        return { ...prevSummary, averageEnvironment: newAvg };
                    });

                    // Thêm điểm dữ liệu mới vào biểu đồ và xóa điểm cũ nhất
                    setChartData(prevData => {
                        const newPoint: ChartDataPoint = {
                            time: new Date(newData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        };
                        if (newData.temperature) newPoint.temperature = newData.temperature;
                        if (newData.humidity) newPoint.humidity = newData.humidity;
                        if (newData.soilMoisture) newPoint.soilMoisture = newData.soilMoisture;
                        if (newData.soilPH) newPoint.soilPH = newData.soilPH;

                        const updatedData = [...prevData, newPoint];
                        // Giới hạn số điểm trên biểu đồ để không bị quá tải
                        if (updatedData.length > 30) {
                            updatedData.shift();
                        }
                        return updatedData;
                    });

                } catch (e) {
                    console.error("Error processing WebSocket message:", e);
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        // Kích hoạt kết nối
        client.activate();

        // Dọn dẹp: ngắt kết nối khi component bị unmount
        return () => {
            if (client.active) {
                client.deactivate();
                console.log('🔌 WebSocket Disconnected.');
            }
        };
    }, [farmId]);

    // Phần còn lại của component (fetchChartData, renderChart, return JSX) giữ nguyên như cũ

    const fetchChartData = async (chartType: 'env' | 'soil') => {
        try {
            let responseData: ChartDataPoint[] = [];
            if (chartType === 'env') {
                const [tempRes, humidityRes] = await Promise.all([
                    api.get(`/devices/DHT22-001/data/aggregated?field=temperature&window=10m`),
                    api.get(`/devices/DHT22-001/data/aggregated?field=humidity&window=10m`),
                ]);
                responseData = tempRes.data.data.map((tempPoint: any) => {
                    const humidityPoint = humidityRes.data.data.find((h: any) => h.timestamp === tempPoint.timestamp);
                    return {
                        time: new Date(tempPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        temperature: tempPoint.avgValue ? parseFloat(tempPoint.avgValue.toFixed(1)) : undefined,
                        humidity: humidityPoint?.avgValue ? parseFloat(humidityPoint.avgValue.toFixed(1)) : undefined,
                    };
                });
            } else if (chartType === 'soil') {
                const [soilMoistureRes, soilPHRes] = await Promise.all([
                    api.get(`/devices/SOIL-001/data/aggregated?field=soil_moisture&window=10m`),
                    api.get(`/devices/PH-001/data/aggregated?field=soilPH&window=10m`),
                ]);
                responseData = soilMoistureRes.data.data.map((soilPoint: any) => {
                    const phPoint = soilPHRes.data.data.find((p: any) => p.timestamp === soilPoint.timestamp);
                    return {
                        time: new Date(soilPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        soilMoisture: soilPoint.avgValue ? parseFloat(soilPoint.avgValue.toFixed(1)) : undefined,
                        soilPH: phPoint?.avgValue ? parseFloat(phPoint.avgValue.toFixed(2)) : undefined,
                    };
                });
            }
            setChartData(responseData);
        } catch (err) {
            console.error(`Failed to fetch chart data for ${chartType}:`, err);
        }
    };

    const handleTabChange = (key: string) => {
        const chartType = key as 'env' | 'soil';
        setActiveChart(chartType);
        fetchChartData(chartType);
    };

    const renderChart = () => { /* ... giữ nguyên ... */
        if (activeChart === 'env') {
            return (<ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis yAxisId="left" stroke="#ff4d4f" domain={[10, 40]} /><YAxis yAxisId="right" orientation="right" stroke="#1677ff" domain={[20, 100]} /><Tooltip /><Legend /><Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff4d4f" name="Nhiệt độ (°C)" /><Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#1677ff" name="Độ ẩm không khí (%)" /></LineChart>
            </ResponsiveContainer>);
        }
        if (activeChart === 'soil') {
            return (<ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis yAxisId="left" stroke="#82ca9d" domain={[0, 100]} /><YAxis yAxisId="right" orientation="right" stroke="#ffc658" domain={[4, 9]} /><Tooltip /><Legend /><Line yAxisId="left" type="monotone" dataKey="soilMoisture" stroke="#82ca9d" name="Độ ẩm đất (%)" /><Line yAxisId="right" type="monotone" dataKey="soilPH" stroke="#ffc658" name="Độ pH đất" /></LineChart>
            </ResponsiveContainer>);
        }
        return null;
    }

    if (loading && !summary) { return (<Spin size="large" tip="Đang tải dữ liệu..." style={{ display: 'block', marginTop: '50px' }} />); }
    if (error) { return (<Alert message="Lỗi" description={error} type="error" showIcon />); }

    return (
        <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Dashboard Tổng Quan</Title>
            <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} md={8} lg={8} xl={4}><Card><Statistic title="Thiết bị Online" value={summary?.onlineDevices} prefix={<Wifi color="green" />} suffix={`/ ${summary?.totalDevices}`} /></Card></Col>
                <Col xs={12} sm={12} md={8} lg={8} xl={4}><Card><Statistic title="Nhiệt độ TB" value={summary?.averageEnvironment?.avgTemperature} precision={1} prefix={<Thermometer color="#ff4d4f" />} suffix="°C" /></Card></Col>
                <Col xs={12} sm={12} md={8} lg={8} xl={4}><Card><Statistic title="Độ ẩm KK" value={summary?.averageEnvironment?.avgHumidity} precision={1} prefix={<Droplet color="#1677ff" />} suffix="%" /></Card></Col>
                <Col xs={12} sm={12} md={8} lg={8} xl={4}><Card><Statistic title="Độ ẩm Đất" value={summary?.averageEnvironment?.avgSoilMoisture} precision={1} prefix={<BarChart3 color="#82ca9d" />} suffix="%" /></Card></Col>
                <Col xs={12} sm={12} md={8} lg={8} xl={4}><Card><Statistic title="Độ pH Đất" value={summary?.averageEnvironment?.avgSoilPH} precision={2} prefix={<Beaker color="#ffc658" />} /></Card></Col>
                <Col xs={12} sm={12} md={8} lg={8} xl={4}><Card><Statistic title="Ánh sáng TB" value={summary?.averageEnvironment?.avgLightIntensity} precision={0} prefix={<Sun color="#faad14" />} suffix=" lux" /></Card></Col>
            </Row>
            <Card style={{ marginTop: '24px' }}> {/* Wrap Tabs.TabPane in a single JSX element */}
                <Tabs defaultActiveKey="env" onChange={handleTabChange}>
                    <Tabs.TabPane tab="Môi trường (Không khí)" key="env" />
                    <Tabs.TabPane tab="Dữ liệu Đất" key="soil" />
                </Tabs>
                {renderChart()}
            </Card>
        </div>
    );
};

export default DashboardPage;