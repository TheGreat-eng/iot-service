// src/components/dashboard/WeatherWidget.tsx

import React, { useEffect, useState } from 'react';
import { Card, Spin, Typography, List, Empty, Avatar } from 'antd';
import api from '../../api/axiosConfig';

const { Text } = Typography;

const WeatherWidget: React.FC = () => {
    const [weatherData, setWeatherData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const farmId = 1; // Tạm thời hardcode farmId

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setLoading(true);
                // Backend đã có API /forecast trả về cả thông tin hiện tại và dự báo
                const response = await api.get(`/weather/forecast?farmId=${farmId}`);
                setWeatherData(response.data.data);
            } catch (error) {
                console.error("Failed to fetch weather data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();

        // Thiết lập tự động gọi lại API sau mỗi 30 phút
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);

        // Dọn dẹp interval khi component unmount
        return () => clearInterval(interval);

    }, [farmId]);

    if (loading) {
        return (
            <Card title="Thời tiết">
                <Spin />
            </Card>
        );
    }

    if (!weatherData) {
        return (
            <Card title="Thời tiết">
                <Empty description="Không tải được dữ liệu thời tiết." />
            </Card>
        );
    }

    return (
        <Card title={`Thời tiết tại ${weatherData.location}`}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <img src={weatherData.iconUrl} alt={weatherData.description} style={{ width: 64, height: 64, marginRight: 16 }} />
                <div>
                    <Text style={{ fontSize: '28px', fontWeight: 'bold' }}>{weatherData.temperature.toFixed(1)}°C</Text>
                    <br />
                    <Text type="secondary" style={{ textTransform: 'capitalize' }}>{weatherData.description}</Text>
                </div>
            </div>

            <List
                size="small"
                header={<Text strong>Dự báo ngắn hạn</Text>}
                dataSource={weatherData.forecast?.slice(0, 4) || []} // Lấy 4 mốc dự báo tiếp theo
                renderItem={(item: any) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar src={item.iconUrl} />}
                            title={`${new Date(item.dateTime).getHours()}:00 - ${item.temperature.toFixed(1)}°C`}
                            description={item.description}
                        />
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default WeatherWidget;