// src/pages/DevicesPage.tsx

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, message, Typography, Popconfirm, Switch, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getDevicesByFarm, createDevice, updateDevice, deleteDevice, controlDevice } from '../api/deviceService';
import type { Device } from '../types/device';
import { useFarm } from '../context/FarmContext';
import DeviceFormModal from '../components/DeviceFormModal';
import type { DeviceFormData } from '../api/deviceService';

const { Title } = Typography;

const DevicesPage: React.FC = () => {
    const { farmId } = useFarm();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [controllingDevices, setControllingDevices] = useState<Set<string>>(new Set()); // ✅ Track loading state của từng device

    useEffect(() => {
        fetchDevices();
    }, [farmId]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await getDevicesByFarm(farmId);
            setDevices(response.data.data);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            message.error('Không thể tải danh sách thiết bị');
        } finally {
            setLoading(false);
        }
    };

    const showModal = (device?: Device) => {
        if (device) {
            setEditingDevice(device);
        } else {
            setEditingDevice(null);
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingDevice(null);
    };

    const handleSubmit = async (values: DeviceFormData) => {
        setFormLoading(true);
        try {
            if (editingDevice) {
                await updateDevice(editingDevice.id, values);
                message.success('Cập nhật thiết bị thành công!');
            } else {
                await createDevice(farmId, values);
                message.success('Thêm thiết bị thành công!');
            }
            fetchDevices();
            handleCancel();
        } catch (error) {
            console.error('Failed to save device:', error);
            message.error('Lưu thiết bị thất bại!');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteDevice(id);
            message.success('Xóa thiết bị thành công!');
            fetchDevices();
        } catch (error) {
            console.error('Failed to delete device:', error);
            message.error('Xóa thiết bị thất bại!');
        }
    };

    // ✅ HÀM ĐIỀU KHIỂN BẬT/TẮT THIẾT BỊ
    const handleControl = async (deviceId: string, action: 'turn_on' | 'turn_off') => {
        // ✅ THÊM: Kiểm tra thiết bị có offline không
        const device = devices.find(d => d.deviceId === deviceId);

        if (device?.status === 'OFFLINE') {
            Modal.confirm({
                title: '⚠️ Thiết bị đang Offline',
                content: 'Thiết bị hiện không kết nối. Lệnh sẽ được gửi và thực thi khi thiết bị online lại. Bạn có muốn tiếp tục?',
                okText: 'Tiếp tục',
                cancelText: 'Hủy',
                onOk: () => executeControl(deviceId, action),
            });
            return;
        }

        executeControl(deviceId, action);
    };

    // ✅ TÁCH HÀM THỰC THI LỆNH
    const executeControl = async (deviceId: string, action: 'turn_on' | 'turn_off') => {
        console.log('🚀 Control device:', deviceId, action);

        setControllingDevices(prev => new Set(prev).add(deviceId));

        // Optimistic update
        setDevices(prevDevices =>
            prevDevices.map(d =>
                d.deviceId === deviceId
                    ? { ...d, currentState: action === 'turn_on' ? 'ON' : 'OFF' }
                    : d
            )
        );

        try {
            const response = await controlDevice(deviceId, action);
            console.log('✅ Control response:', response.data);

            message.success(`Đã gửi lệnh ${action === 'turn_on' ? 'bật' : 'tắt'} thiết bị ${deviceId}`);

            setTimeout(() => fetchDevices(), 1000);
        } catch (error: any) {
            console.error('❌ Failed to control device:', error);

            // Rollback nếu lỗi
            setDevices(prevDevices =>
                prevDevices.map(d =>
                    d.deviceId === deviceId
                        ? { ...d, currentState: action === 'turn_on' ? 'OFF' : 'ON' }
                        : d
                )
            );

            const errorMessage = error.response?.data?.message || 'Điều khiển thiết bị thất bại!';
            message.error(errorMessage);
        } finally {
            setControllingDevices(prev => {
                const newSet = new Set(prev);
                newSet.delete(deviceId);
                return newSet;
            });
        }
    };

    const columns = [
        {
            title: 'Device ID',
            dataIndex: 'deviceId',
            key: 'deviceId',
            width: 150,
        },
        {
            title: 'Tên thiết bị',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            width: 180,
            render: (type: string) => {
                const typeMap: Record<string, string> = {
                    'SENSOR_DHT22': 'Cảm biến DHT22',
                    'SENSOR_SOIL_MOISTURE': 'Cảm biến Độ ẩm đất',
                    'SENSOR_LIGHT': 'Cảm biến Ánh sáng',
                    'SENSOR_PH': 'Cảm biến pH',
                    'ACTUATOR_PUMP': 'Máy bơm',
                    'ACTUATOR_FAN': 'Quạt',
                };
                return typeMap[type] || type;
            },
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 160,
            render: (_: any, record: Device) => (
                <Space direction="vertical" size="small">
                    {/* Trạng thái kết nối */}
                    <Tag color={record.status === 'ONLINE' ? 'green' : 'red'}>
                        {record.status === 'ONLINE' ? '🟢 Online' : '🔴 Offline'}
                    </Tag>

                    {/* Trạng thái hoạt động (chỉ cho Actuator) */}
                    {record.type.startsWith('ACTUATOR') && record.currentState && (
                        <Tag color={record.currentState === 'ON' ? 'processing' : 'default'}>
                            {record.currentState === 'ON' ? '⚡ Đang bật' : '⚪ Đang tắt'}
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Lần hoạt động cuối',
            dataIndex: 'lastSeen',
            key: 'lastSeen',
            width: 180,
            render: (lastSeen: string) => new Date(lastSeen).toLocaleString('vi-VN'),
        },
        {
            title: 'Điều khiển',
            key: 'control',
            width: 250,
            render: (_: any, record: Device) => {
                // Chỉ hiển thị điều khiển cho Actuator
                if (!record.type.startsWith('ACTUATOR')) {
                    return <Tag color="blue">Cảm biến</Tag>;
                }

                const isLoading = controllingDevices.has(record.deviceId);
                const isOffline = record.status === 'OFFLINE';
                const isOn = record.currentState === 'ON';

                return (
                    <Space direction="vertical" size="small">
                        <Space>
                            {isOn ? (
                                // Nếu đang BẬT → Chỉ hiện nút TẮT
                                <Button
                                    danger
                                    size="small"
                                    onClick={() => handleControl(record.deviceId, 'turn_off')}
                                    loading={isLoading}
                                // ✅ SỬA: Không disable khi offline
                                >
                                    🔴 Tắt
                                </Button>
                            ) : (
                                // Nếu đang TẮT → Chỉ hiện nút BẬT
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<ThunderboltOutlined />}
                                    onClick={() => handleControl(record.deviceId, 'turn_on')}
                                    loading={isLoading}
                                // ✅ SỬA: Không disable khi offline
                                >
                                    🟢 Bật
                                </Button>
                            )}
                        </Space>

                        {/* ✅ THÊM: Cảnh báo nếu offline */}
                        {isOffline && (
                            <Tag color="warning" style={{ margin: 0 }}>
                                ⚠️ Thiết bị offline - lệnh sẽ chờ kết nối
                            </Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            fixed: 'right' as const,
            render: (_: any, record: Device) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => showModal(record)}>
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xóa thiết bị?"
                        description="Hành động này không thể hoàn tác."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2}>Quản lý Thiết bị</Title>
                    <Space>
                        <Button icon={<SyncOutlined />} onClick={fetchDevices}>
                            Làm mới
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                            Thêm thiết bị
                        </Button>
                    </Space>
                </div>
                <Table
                    columns={columns}
                    dataSource={devices}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1200 }} // ✅ Thêm horizontal scroll
                />
            </Card>

            <DeviceFormModal
                visible={isModalVisible}
                onClose={handleCancel}
                onSubmit={handleSubmit}
                initialData={editingDevice ? {
                    name: editingDevice.name,
                    deviceId: editingDevice.deviceId,
                    type: editingDevice.type,
                } : null}
                loading={formLoading}
            />
        </div>
    );
};

export default DevicesPage;