// src/pages/FarmsPage.tsx

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Typography, Spin, message, Popconfirm, Empty, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WifiOutlined } from '@ant-design/icons';
import { getFarms, createFarm, updateFarm, deleteFarm } from '../api/farmService';
import type { Farm, FarmFormData } from '../types/farm';
import FarmFormModal from '../components/FarmFormModal';
import { useFarm } from '../context/FarmContext';

const { Title, Text } = Typography;

const FarmsPage: React.FC = () => {
    const { farmId, setFarmId } = useFarm(); // ✅ Thêm setFarmId
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const fetchFarms = () => {
        setLoading(true);
        getFarms()
            .then(res => {
                // ===> SỬA LỖI Ở ĐÂY: Kiểm tra dữ liệu trả về cẩn thận <===
                // API getFarms có thể trả về { success: true, data: [...] }
                // Hoặc có thể nó chỉ trả về [...] (tùy vào backend controller)
                // Đoạn code này xử lý cả hai trường hợp
                const farmData = res.data.data || res.data;

                // Đảm bảo farmData luôn là một mảng
                if (Array.isArray(farmData)) {
                    setFarms(farmData);
                } else {
                    console.error("Dữ liệu trả về không phải là một mảng:", farmData);
                    setFarms([]); // Set thành mảng rỗng nếu dữ liệu sai
                }
            })
            .catch(err => {
                console.error(err);
                message.error("Không thể tải danh sách nông trại.");
                setFarms([]); // Set thành mảng rỗng khi có lỗi
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchFarms();
    }, []);

    const handleFormSubmit = async (values: FarmFormData) => {
        setFormLoading(true);
        try {
            if (editingFarm) {
                await updateFarm(editingFarm.id, values);
                message.success("Cập nhật nông trại thành công!");
            } else {
                await createFarm(values);
                message.success("Thêm nông trại thành công!");
            }
            setIsModalVisible(false);
            fetchFarms();
        } catch (err) {
            message.error("Thao tác thất bại!");
        } finally {
            setFormLoading(false);
        }
    };
    const handleDelete = async (id: number) => {
        try {
            await deleteFarm(id);
            message.success("Xóa nông trại thành công!");
            fetchFarms();
        } catch (err) {
            message.error("Xóa thất bại!");
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

    const columns = [
        {
            title: 'Farm ID',
            dataIndex: 'id',  // ✅ ĐÚNG
            key: 'id',
        },
        {
            title: 'Tên nông trại',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Địa điểm',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Thiết bị online',
            dataIndex: 'onlineDevices',
            key: 'onlineDevices',
        },
        {
            title: 'Tổng số thiết bị',
            dataIndex: 'totalDevices',
            key: 'totalDevices',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: Farm) => (
                <Space size="middle">
                    <Button
                        type={farmId === record.id ? 'primary' : 'default'}  // ✅ ĐÚNG
                        onClick={() => {
                            setFarmId(record.id);  // ✅ ĐÚNG
                            message.success(`Đã chuyển sang farm: ${record.name}`);  // ✅ ĐÚNG
                        }}
                    >
                        {farmId === record.id ? 'Farm hiện tại' : 'Chuyển đến'}
                    </Button>
                    <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xóa nông trại?"
                        description="Hành động này sẽ xóa cả nông trại và các thiết bị bên trong."
                        onConfirm={() => handleDelete(record.id)} // ✅ Đúng: farm.id
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>,
                </Space>
            ),
        },
    ];

    if (loading) {
        return <Spin tip="Đang tải..." size="large" style={{ display: 'block', marginTop: 50 }} />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Quản lý Nông trại</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Thêm nông trại
                </Button>
            </div>

            {/* Code này bây giờ sẽ an toàn vì `farms` không bao giờ là undefined */}
            {farms.length > 0 ? (
                <Row gutter={[16, 16]}>
                    {farms.map(farm => (
                        <Col xs={24} sm={12} lg={8} key={farm.id}>
                            <Card
                                title={farm.name}
                                actions={[
                                    <EditOutlined key="edit" onClick={() => openEditModal(farm)} />,
                                    <Popconfirm
                                        title="Xóa nông trại?"
                                        description="Hành động này sẽ xóa cả nông trại và các thiết bị bên trong."
                                        onConfirm={() => handleDelete(farm.id)} // ✅ Đúng: farm.id
                                        okText="Xóa"
                                        cancelText="Hủy"
                                    >
                                        <DeleteOutlined key="delete" />
                                    </Popconfirm>,
                                ]}
                            >
                                <p>{farm.description || 'Không có mô tả.'}</p>
                                <Text type="secondary">{farm.location}</Text>
                                {/* Có thể cần kiểm tra null cho các thuộc tính này */}
                                <div style={{ marginTop: '16px' }}>
                                    <WifiOutlined /> <Text>{farm.onlineDevices ?? 0} / {farm.totalDevices ?? 0} thiết bị online</Text>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty description="Bạn chưa có nông trại nào. Hãy tạo một cái!" />
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