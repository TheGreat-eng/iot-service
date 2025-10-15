// src/components/WeatherWidget.tsx
import React, { useEffect, useState } from 'react';
import { Card, Spin, Typography, List } from 'antd';
import api from '../api/axiosConfig';

const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/weather/forecast?farmId=1')
            .then(res => setWeather(res.data.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Card><Spin /></Card>;
    if (!weather) return <Card>Không có dữ liệu thời tiết.</Card>;

    return (
        <Card title={`Thời tiết tại ${weather.location}`}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <img src={weather.iconUrl} alt={weather.description} style={{ width: 64, height: 64 }} />
                <div style={{ marginLeft: 16 }}>
                    <Typography.Title level={3}>{weather.temperature}°C</Typography.Title>
                    <Typography.Text>{weather.description}</Typography.Text>
                </div>
            </div>
            <List
                header={<div>Dự báo 24 giờ tới</div>}
                dataSource={weather.forecast.slice(0, 5)} // Lấy 5 mốc dự báo gần nhất
                renderItem={(item: any) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<img src={item.iconUrl} alt={item.description} style={{ width: 32 }} />}
                            title={`${new Date(item.dateTime).getHours()}:00 - ${item.temperature}°C`}
                            description={item.description}
                        />
                    </List.Item>
                )}
            />
        </Card>
    );
};
export default WeatherWidget;