// src/pages/AIPredictionPage.tsx

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, Typography, Result, Button, Empty, Alert, Upload, message as antdMessage, Modal, Image } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BulbOutlined, WarningOutlined, CameraOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { getAIPredictions, diagnosePlantDisease } from '../api/aiService';
import type { AIPredictionResponse } from '../types/ai';
import { useFarm } from '../context/FarmContext';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

const AIPredictionPage: React.FC = () => {
    const { farmId } = useFarm();
    const [predictionData, setPredictionData] = useState<AIPredictionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ THÊM: State cho chức năng chẩn đoán bệnh
    const [diagnosing, setDiagnosing] = useState(false);
    const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        if (!farmId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        getAIPredictions(farmId)
            .then(response => {
                if (response.data.success && response.data.data) {
                    setPredictionData(response.data.data);
                    setError(null);
                } else {
                    setError(response.data.message || "AI Service không khả dụng");
                    setPredictionData(null);
                }
            })
            .catch(err => {
                console.error("Failed to fetch AI predictions:", err);
                const errorMsg = err.response?.data?.message || "Không thể kết nối đến AI Service";
                setError(errorMsg);
                setPredictionData(null);
            })
            .finally(() => setLoading(false));
    }, [farmId]);

    // ✅ THÊM: Helper function để parse confidence
    const parseConfidence = (confidence: any): number | null => {
        if (typeof confidence === 'number') {
            return confidence;
        }
        if (typeof confidence === 'string') {
            // Loại bỏ ký tự % và parse thành number
            const numValue = parseFloat(confidence.replace('%', ''));
            return isNaN(numValue) ? null : numValue;
        }
        return null;
    };

    // ✅ THÊM: Xử lý upload ảnh chẩn đoán bệnh
    const handleDiagnose = async (file: RcFile) => {
        setDiagnosing(true);
        setDiagnosisResult(null);

        // Hiển thị preview ảnh
        const reader = new FileReader();
        reader.onload = (e) => setUploadedImage(e.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const response = await diagnosePlantDisease(file);

            if (response.data.success) {
                // ✅ THÊM: Normalize confidence trước khi lưu
                const result = response.data.data;
                const normalizedResult = {
                    ...result,
                    confidence: parseConfidence(result.confidence),
                };

                setDiagnosisResult(normalizedResult);
                setIsModalVisible(true);
                antdMessage.success('Chẩn đoán thành công!');
            } else {
                antdMessage.error(response.data.message || 'Chẩn đoán thất bại');
            }
        } catch (err: any) {
            console.error('Diagnosis error:', err);
            antdMessage.error(err.response?.data?.message || 'Không thể kết nối đến AI Service');
        } finally {
            setDiagnosing(false);
        }

        return false; // Prevent default upload behavior
    };

    // Loading state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div style={{ padding: '24px' }}>
                <Alert
                    message="AI Service chưa sẵn sàng"
                    description={
                        <>
                            <p>{error}</p>
                            <p style={{ marginTop: 8 }}>
                                <WarningOutlined /> Có thể AI/ML model đang được huấn luyện hoặc dịch vụ đang bảo trì.
                            </p>
                        </>
                    }
                    type="warning"
                    showIcon
                    action={
                        <Button type="primary" onClick={() => window.location.reload()}>
                            Thử lại
                        </Button>
                    }
                />
            </div>
        );
    }

    // Null data state
    if (!predictionData || !predictionData.predictions || !predictionData.suggestion) {
        return (
            <Result
                status="404"
                title="Không có dữ liệu dự đoán"
                subTitle="AI chưa có đủ dữ liệu lịch sử để đưa ra dự đoán."
                extra={
                    <Button type="primary" onClick={() => window.location.reload()}>
                        Tải lại
                    </Button>
                }
            />
        );
    }

    const validPredictions = predictionData.predictions.filter(p => p.timestamp !== null);
    const chartData = validPredictions.map(p => ({
        time: new Date(p.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Nhiệt độ Dự đoán (°C)': p.predicted_temperature ?? undefined,
        'Độ ẩm Đất Dự đoán (%)': p.predicted_soil_moisture ?? undefined,
    }));

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Dự đoán & Gợi ý từ AI</Title>
            <Paragraph type="secondary">Phân tích và dự đoán các chỉ số môi trường dựa trên Machine Learning.</Paragraph>

            <Row gutter={[16, 16]}>
                {/* ✅ THÊM: Card chẩn đoán bệnh cây */}
                <Col span={24}>
                    <Card
                        title={
                            <span>
                                <CameraOutlined style={{ marginRight: 8 }} />
                                Chẩn đoán Bệnh Cây từ Hình ảnh
                            </span>
                        }
                        style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
                    >
                        <Dragger
                            name="image"
                            accept="image/*"
                            beforeUpload={handleDiagnose}
                            showUploadList={false}
                            disabled={diagnosing}
                        >
                            <p className="ant-upload-drag-icon">
                                <CloudUploadOutlined style={{ color: '#52c41a', fontSize: 48 }} />
                            </p>
                            <p className="ant-upload-text">
                                {diagnosing ? 'AI đang phân tích...' : 'Kéo thả hoặc click để tải ảnh lên'}
                            </p>
                            <p className="ant-upload-hint">
                                Hỗ trợ các định dạng: JPG, PNG, JPEG. Ảnh rõ nét của lá cây hoặc cả cây.
                            </p>
                        </Dragger>

                        {diagnosing && (
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <Spin tip="AI đang phân tích hình ảnh..." />
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Card hiển thị Gợi ý */}
                <Col span={24}>
                    <Card style={{ backgroundColor: '#e6f4ff', border: '1px solid #91caff' }}>
                        <Typography>
                            <Title level={4}>
                                <BulbOutlined style={{ color: '#1677ff' }} /> Gợi ý thông minh
                            </Title>
                            <Paragraph style={{ fontSize: '16px' }}>
                                {predictionData.suggestion.message}
                            </Paragraph>
                            <Text strong>Hành động đề xuất: </Text>
                            <Text code>{predictionData.suggestion.action}</Text>
                            {predictionData.suggestion.confidence && (
                                <>
                                    <br />
                                    <Text strong>Độ tin cậy: </Text>
                                    <Text>{(predictionData.suggestion.confidence * 100).toFixed(0)}%</Text>
                                </>
                            )}
                        </Typography>
                    </Card>
                </Col>

                {/* Card hiển thị Biểu đồ dự đoán */}
                <Col span={24}>
                    <Card title="Biểu đồ Dự đoán Môi trường">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis yAxisId="left" stroke="#ff4d4f" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                    <Tooltip />
                                    <Legend />
                                    {chartData.length > 0 && (
                                        <ReferenceLine x={chartData[0]?.time} stroke="green" label="Hiện tại" />
                                    )}
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="Nhiệt độ Dự đoán (°C)"
                                        stroke="#ff4d4f"
                                        strokeDasharray="5 5"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="Độ ẩm Đất Dự đoán (%)"
                                        stroke="#82ca9d"
                                        strokeDasharray="5 5"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <Empty description="Chưa có dữ liệu dự đoán hợp lệ" />
                        )}
                    </Card>
                </Col>

                {/* Card thông tin Model AI */}
                {predictionData.model_info && (
                    <Col span={24}>
                        <Card title="Thông tin Model AI">
                            <p>
                                <Text strong>Tên model:</Text> {predictionData.model_info.model_name}
                            </p>
                            <p>
                                <Text strong>Ngày huấn luyện:</Text> {predictionData.model_info.training_date}
                            </p>
                        </Card>
                    </Col>
                )}
            </Row>

            {/* ✅ THÊM: Modal hiển thị kết quả chẩn đoán */}
            <Modal
                title="Kết quả Chẩn đoán Bệnh Cây"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={700}
            >
                {diagnosisResult && (
                    <div>
                        <Row gutter={16}>
                            <Col span={12}>
                                {uploadedImage && (
                                    <Image
                                        src={uploadedImage}
                                        alt="Uploaded"
                                        style={{ width: '100%', borderRadius: 8 }}
                                    />
                                )}
                            </Col>
                            <Col span={12}>
                                <Title level={4}>Kết quả:</Title>
                                <Paragraph>
                                    <Text strong>Bệnh phát hiện: </Text>
                                    <Text type={diagnosisResult.disease ? 'danger' : 'success'}>
                                        {diagnosisResult.disease || 'Cây khỏe mạnh'}
                                    </Text>
                                </Paragraph>

                                {/* ✅ SỬA: Xử lý hiển thị confidence */}
                                {diagnosisResult.confidence !== null && diagnosisResult.confidence !== undefined && (
                                    <Paragraph>
                                        <Text strong>Độ tin cậy: </Text>
                                        <Text>
                                            {typeof diagnosisResult.confidence === 'number'
                                                ? `${diagnosisResult.confidence.toFixed(1)}%`
                                                : diagnosisResult.confidence}
                                        </Text>
                                    </Paragraph>
                                )}

                                {diagnosisResult.treatment && (
                                    <Paragraph>
                                        <Text strong>Hướng xử lý: </Text>
                                        {diagnosisResult.treatment}
                                    </Paragraph>
                                )}
                                {diagnosisResult.description && (
                                    <Paragraph type="secondary">
                                        {diagnosisResult.description}
                                    </Paragraph>
                                )}
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AIPredictionPage;