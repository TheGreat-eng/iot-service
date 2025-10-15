// src/pages/FarmsPage.tsx

import React, { useEffect, useState } from 'react'; // ✅ BỎ useCallback
import { Row, Col, Card, Button, Typography, Spin, message, Popconfirm, Empty, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WifiOutlined } from '@ant-design/icons';
import { getFarms, createFarm, updateFarm, deleteFarm } from '../api/farmService';
import type { Farm, FarmFormData } from '../types/farm';
import FarmFormModal from '../components/FarmFormModal';
import { useFarm } from '../context/FarmContext';
import { useApiCall } from '../hooks/useApiCall';
import { SUCCESS_MESSAGES } from '../constants/messages';

const { Title, Text } = Typography;

const FarmsPage: React.FC = () => {
    const { farmId, setFarmId } = useFarm();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

    const { loading, execute: fetchFarmsApi } = useApiCall<Farm[]>({
        onSuccess: (data) => setFarms(data),
    });

    const { loading: formLoading, execute: saveFarmApi } = useApiCall({
        showSuccessMessage: true,
    });

    const { execute: deleteFarmApi } = useApiCall({
        successMessage: SUCCESS_MESSAGES.FARM_DELETED,
        showSuccessMessage: true,
    });

    // ✅ SỬA: Định nghĩa fetchFarms bình thường, KHÔNG dùng useCallback
    const fetchFarms = async () => {
        try {
            await fetchFarmsApi(async () => {
                const response = await getFarms();
                const farmData = response.data.data || response.data;
                return Array.isArray(farmData) ? farmData : [];
            });
        } catch (error) {
            console.error('Failed to fetch farms:', error);
        }
    };

    // ✅ SỬA: useEffect chỉ chạy 1 lần khi mount
    useEffect(() => {
        fetchFarms();
    }, []); // ✅ Empty dependency array

    const handleFormSubmit = async (values: FarmFormData) => {
        try {
            await saveFarmApi(async () => {
                if (editingFarm) {
                    await updateFarm(editingFarm.id, values);
                    message.success(SUCCESS_MESSAGES.FARM_UPDATED);
                } else {
                    await createFarm(values);
                    message.success(SUCCESS_MESSAGES.FARM_CREATED);
                }
            });
            setIsModalVisible(false);
            fetchFarms(); // ✅ Gọi lại để refresh
        } catch (error) {
            console.error('Failed to save farm:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteFarmApi(() => deleteFarm(id));
            fetchFarms(); // ✅ Gọi lại để refresh
        } catch (error) {
            console.error('Failed to delete farm:', error);
        }
    };

    const openCreateModal = () => {
        setEditingFarm(null);
        setIsModalVisible(true);
    };

    const openEditModal = (farm: Farm) => {
        setEditingFarm(farm);
        setIsModalVisible(true);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Quản lý Nông trại</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Thêm nông trại
                </Button>
            </div>

            {farms.length > 0 ? (
                <Row gutter={[16, 16]}>
                    {farms.map(farm => (
                        <Col xs={24} sm={12} lg={8} key={farm.id}>
                            <Card
                                hoverable
                                style={{
                                    border: farmId === farm.id ? '2px solid #667eea' : '1px solid #f0f0f0',
                                    transition: 'all 0.3s'
                                }}
                                title={
                                    <Space>
                                        {farm.name}
                                        {farmId === farm.id && (
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#667eea',
                                                fontWeight: 'normal'
                                            }}>
                                                (Đang chọn)
                                            </span>
                                        )}
                                    </Space>
                                }
                                actions={[
                                    <Button
                                        key="select"
                                        type={farmId === farm.id ? 'primary' : 'default'}
                                        size="small"
                                        onClick={() => {
                                            setFarmId(farm.id);
                                            message.success(`Đã chuyển sang ${farm.name}`);
                                        }}
                                        disabled={farmId === farm.id}
                                    >
                                        {farmId === farm.id ? 'Đang chọn' : 'Chọn'}
                                    </Button>,
                                    <EditOutlined key="edit" onClick={() => openEditModal(farm)} />,
                                    <Popconfirm
                                        key="delete"
                                        title="Xóa nông trại?"
                                        description="Hành động này sẽ xóa cả thiết bị bên trong."
                                        onConfirm={() => handleDelete(farm.id)}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <DeleteOutlined style={{ color: '#ff4d4f' }} />
                                    </Popconfirm>
                                ]}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Text type="secondary">
                                        📍 {farm.location || 'Chưa có vị trí'}
                                    </Text>
                                    <Text>{farm.description || 'Không có mô tả'}</Text>
                                    <div style={{
                                        marginTop: 8,
                                        padding: '8px',
                                        background: '#f5f5f5',
                                        borderRadius: '4px'
                                    }}>
                                        <WifiOutlined style={{ color: '#52c41a' }} />
                                        <Text style={{ marginLeft: 8 }}>
                                            {farm.onlineDevices ?? 0} / {farm.totalDevices ?? 0} thiết bị online
                                        </Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty
                    description="Bạn chưa có nông trại nào"
                    style={{ marginTop: 64 }}
                >
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                        Tạo nông trại đầu tiên
                    </Button>
                </Empty>
            )}

            <FarmFormModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleFormSubmit}
                initialData={editingFarm}
                loading={formLoading}
            />
        </div>
    );
};

export default FarmsPage;