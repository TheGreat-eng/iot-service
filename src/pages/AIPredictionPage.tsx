// src/pages/AIPredictionPage.tsx

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, Alert, Typography, Result, Button } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BulbOutlined } from '@ant-design/icons';
import { getAIPredictions } from '../api/aiService';
import type { AIPredictionResponse, AIPredictionPoint } from '../types/ai';
import { useFarm } from '../context/FarmContext';

const { Title, Paragraph, Text } = Typography;

const AIPredictionPage: React.FC = () => {
    const { farmId } = useFarm(); // ✅ Thêm
    const [predictionData, setPredictionData] = useState<AIPredictionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getAIPredictions(farmId)
            .then(response => {
                setPredictionData(response.data.data);
            })
            .catch(err => {
                console.error("Failed to fetch AI predictions:", err);
                setError("Không thể lấy dữ liệu dự đoán từ AI. Dịch vụ có thể đang bảo trì.");
            })
            .finally(() => setLoading(false));
    }, [farmId]); // ✅ Thêm dependency

    if (loading) {
        return <Spin tip="AI đang phân tích dữ liệu..." size="large" />;
    }

    if (error || !predictionData) {
        return <Result status="500" title="Lỗi Dịch vụ AI" subTitle={error || "Không nhận được phản hồi từ dịch vụ AI."} />;
    }

    // Xử lý dữ liệu cho biểu đồ
    const chartData = predictionData.predictions.map(p => ({
        time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Nhiệt độ Dự đoán (°C)': p.predicted_temperature,
        'Độ ẩm Đất Dự đoán (%)': p.predicted_soil_moisture,
    }));

    return (
        <div>
            <Title level={2}>Dự đoán & Gợi ý từ AI</Title>
            <Paragraph type="secondary">Phân tích và dự đoán các chỉ số môi trường trong 3-6 giờ tới.</Paragraph>

            <Row gutter={[16, 16]}>
                {/* Card hiển thị Gợi ý */}
                <Col span={24}>
                    <Card style={{ backgroundColor: '#e6f4ff', border: '1px solid #91caff' }}>
                        <Typography>
                            <Title level={4}><BulbOutlined style={{ color: '#1677ff' }} /> Gợi ý thông minh</Title>
                            <Paragraph style={{ fontSize: '16px' }}>
                                {predictionData.suggestion.message}
                            </Paragraph>
                            <Text strong>Hành động đề xuất: </Text>
                            <Text code>{predictionData.suggestion.action}</Text>
                            <br />
                            <Text strong>Độ tin cậy: </Text>
                            <Text>{(predictionData.suggestion.confidence * 100).toFixed(0)}%</Text>
                        </Typography>
                    </Card>
                </Col>

                {/* Card hiển thị Biểu đồ dự đoán */}
                <Col span={24}>
                    <Card title="Biểu đồ Dự đoán Môi trường">
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis yAxisId="left" stroke="#ff4d4f" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine x={chartData[0]?.time} stroke="green" label="Hiện tại" />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="Nhiệt độ Dự đoán (°C)"
                                    stroke="#ff4d4f"
                                    strokeDasharray="5 5" // Nét đứt cho đường dự đoán
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="Độ ẩm Đất Dự đoán (%)"
                                    stroke="#82ca9d"
                                    strokeDasharray="5 5" // Nét đứt cho đường dự đoán
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* Card thông tin Model AI */}
                <Col span={24}>
                    <Card title="Thông tin Model AI">
                        <p><Text strong>Tên model:</Text> {predictionData.model_info.model_name}</p>
                        <p><Text strong>Ngày huấn luyện:</Text> {predictionData.model_info.training_date}</p>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AIPredictionPage;