import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, Typography, Tabs } from 'antd';
import { Thermometer, Droplet, Sun, Wifi, BarChart3, Beaker } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axiosConfig';
import { Client } from '@stomp/stompjs';
// ✅ SỬA: Import từ thư mục dashboard thay vì thư mục gốc
import WeatherWidget from '../components/dashboard/WeatherWidget';

const { Title } = Typography;

interface ChartDataPoint {
    time: string;
    temperature?: number;
    humidity?: number;
    soilMoisture?: number;
    soilPH?: number;
}

const DashboardPage: React.FC = () => {
    const [summary, setSummary] = useState<any>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [activeChart, setActiveChart] = useState<'env' | 'soil'>('env');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const farmId = 1;

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

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/websocket`),
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            console.log('✅ WebSocket/STOMP Connected!');

            client.subscribe(`/topic/farm/${farmId}/sensor-data`, (message) => {
                try {
                    const newData = JSON.parse(message.body);
                    console.log('📬 Received real-time data:', newData);

                    setSummary((prevSummary: any) => {
                        if (!prevSummary) return null;
                        const newAvg = { ...prevSummary.averageEnvironment };
                        if (newData.temperature !== undefined) newAvg.avgTemperature = newData.temperature;
                        if (newData.humidity !== undefined) newAvg.avgHumidity = newData.humidity;
                        if (newData.soilMoisture !== undefined) newAvg.avgSoilMoisture = newData.soilMoisture;
                        if (newData.soilPH !== undefined) newAvg.avgSoilPH = newData.soilPH;
                        if (newData.lightIntensity !== undefined) newAvg.avgLightIntensity = newData.lightIntensity;
                        return { ...prevSummary, averageEnvironment: newAvg };
                    });

                    setChartData(prevData => {
                        const newPoint: ChartDataPoint = {
                            time: new Date(newData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        };
                        if (newData.temperature !== undefined) newPoint.temperature = newData.temperature;
                        if (newData.humidity !== undefined) newPoint.humidity = newData.humidity;
                        if (newData.soilMoisture !== undefined) newPoint.soilMoisture = newData.soilMoisture;
                        if (newData.soilPH !== undefined) newPoint.soilPH = newData.soilPH;

                        const updatedData = [...prevData, newPoint];
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

        client.activate();

        return () => {
            if (client.active) {
                client.deactivate();
                console.log('🔌 WebSocket Disconnected.');
            }
        };
    }, [farmId]);

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

    const renderChart = () => {
        if (activeChart === 'env') {
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis yAxisId="left" stroke="#ff4d4f" domain={[10, 40]} />
                        <YAxis yAxisId="right" orientation="right" stroke="#1677ff" domain={[20, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff4d4f" name="Nhiệt độ (°C)" />
                        <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#1677ff" name="Độ ẩm không khí (%)" />
                    </LineChart>
                </ResponsiveContainer>
            );
        }
        if (activeChart === 'soil') {
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis yAxisId="left" stroke="#82ca9d" domain={[0, 100]} />
                        <YAxis yAxisId="right" orientation="right" stroke="#ffc658" domain={[4, 9]} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="soilMoisture" stroke="#82ca9d" name="Độ ẩm đất (%)" />
                        <Line yAxisId="right" type="monotone" dataKey="soilPH" stroke="#ffc658" name="Độ pH đất" />
                    </LineChart>
                </ResponsiveContainer>
            );
        }
        return null;
    };

    if (loading && !summary) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    if (error) {
        return <Alert message="Lỗi" description={error} type="error" showIcon style={{ margin: '20px' }} />;
    }

    return (
        <div style={{ padding: '0' }}>
            <Title level={2} style={{ marginBottom: '24px' }}>Dashboard Tổng Quan</Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={12} md={8} lg={12} xl={8}>
                            <Card hoverable style={{ height: '100%' }}>
                                <Statistic
                                    title="Thiết bị Online"
                                    value={summary?.onlineDevices ?? 0}
                                    prefix={<Wifi color="green" size={20} />}
                                    suffix={`/ ${summary?.totalDevices ?? 0}`}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={12} xl={8}>
                            <Card hoverable style={{ height: '100%' }}>
                                <Statistic
                                    title="Nhiệt độ TB"
                                    value={summary?.averageEnvironment?.avgTemperature ?? 0}
                                    precision={1}
                                    prefix={<Thermometer color="#ff4d4f" size={20} />}
                                    suffix="°C"
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={12} xl={8}>
                            <Card hoverable style={{ height: '100%' }}>
                                <Statistic
                                    title="Độ ẩm KK"
                                    value={summary?.averageEnvironment?.avgHumidity ?? 0}
                                    precision={1}
                                    prefix={<Droplet color="#1677ff" size={20} />}
                                    suffix="%"
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={12} xl={8}>
                            <Card hoverable style={{ height: '100%' }}>
                                <Statistic
                                    title="Độ ẩm Đất"
                                    value={summary?.averageEnvironment?.avgSoilMoisture ?? 0}
                                    precision={1}
                                    prefix={<BarChart3 color="#82ca9d" size={20} />}
                                    suffix="%"
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={12} xl={8}>
                            <Card hoverable style={{ height: '100%' }}>
                                <Statistic
                                    title="Độ pH Đất"
                                    value={summary?.averageEnvironment?.avgSoilPH ?? 0}
                                    precision={2}
                                    prefix={<Beaker color="#ffc658" size={20} />}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={12} xl={8}>
                            <Card hoverable style={{ height: '100%' }}>
                                <Statistic
                                    title="Ánh sáng TB"
                                    value={summary?.averageEnvironment?.avgLightIntensity ?? 0}
                                    precision={0}
                                    prefix={<Sun color="#faad14" size={20} />}
                                    suffix=" lux"
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card style={{ marginTop: '24px' }} title="Biểu đồ theo dõi">
                        <Tabs
                            defaultActiveKey="env"
                            onChange={handleTabChange}
                            items={[
                                { key: 'env', label: 'Môi trường (Không khí)' },
                                { key: 'soil', label: 'Dữ liệu Đất' },
                            ]}
                        />
                        {renderChart()}
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <WeatherWidget />

                    <Card style={{ marginTop: '16px' }} title="⚠️ Cảnh báo" size="small">
                        <p style={{ margin: '8px 0' }}>• Nhiệt độ cao (35°C)</p>
                        <p style={{ margin: '8px 0' }}>• Độ ẩm đất thấp (25%)</p>
                        <p style={{ margin: '8px 0', color: '#52c41a' }}>✓ Hệ thống hoạt động bình thường</p>
                    </Card>

                    <Card style={{ marginTop: '16px' }} title="💡 Gợi ý AI" size="small">
                        <p style={{ margin: '8px 0' }}>• Nên tưới nước trong 30 phút tới</p>
                        <p style={{ margin: '8px 0' }}>• Bật quạt để giảm nhiệt độ</p>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;