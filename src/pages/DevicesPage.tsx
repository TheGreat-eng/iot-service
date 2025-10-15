// src/pages/DevicesPage.tsx

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, message, Typography, Popconfirm, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getDevicesByFarm, createDevice, updateDevice, deleteDevice, controlDevice } from '../api/deviceService';
import type { Device } from '../types/device';
import { useFarm } from '../context/FarmContext';
import DeviceFormModal from '../components/DeviceFormModal';
import type { DeviceFormData } from '../api/deviceService';
import { useApiCall } from '../hooks/useApiCall'; // ✅ THÊM

const { Title } = Typography;

const DevicesPage: React.FC = () => {
    const { farmId } = useFarm();
    const [devices, setDevices] = useState<Device[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [controllingDevices, setControllingDevices] = useState<Set<string>>(new Set());

    // ✅ THÊM: Sử dụng custom hook
    const { loading, execute: fetchDevicesApi } = useApiCall<Device[]>({
        onSuccess: (data) => setDevices(data)
    });

    const { loading: formLoading, execute: saveDeviceApi } = useApiCall({
        showSuccessMessage: true,
        onSuccess: () => {
            fetchDevices();
            handleCancel();
        }
    });

    const { execute: deleteDeviceApi } = useApiCall({
        successMessage: 'Xóa thiết bị thành công!',
        showSuccessMessage: true,
        onSuccess: fetchDevices
    });

    const fetchDevices = () => {
        fetchDevicesApi(async () => {
            const response = await getDevicesByFarm(farmId);
            return response.data.data;
        });
    };

    useEffect(() => {
        fetchDevices();
    }, [farmId]);

    const showModal = (device?: Device) => {
        setEditingDevice(device || null);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingDevice(null);
    };

    const handleSubmit = async (values: DeviceFormData) => {
        saveDeviceApi(async () => {
            if (editingDevice) {
                await updateDevice(editingDevice.id, values);
                return { successMessage: 'Cập nhật thiết bị thành công!' };
            } else {
                await createDevice(farmId, values);
                return { successMessage: 'Thêm thiết bị thành công!' };
            }
        });
    };

    const handleDelete = async (id: number) => {
        deleteDeviceApi(() => deleteDevice(id));
    };

    const handleControl = async (deviceId: string, action: 'turn_on' | 'turn_off') => {
        const device = devices.find(d => d.deviceId === deviceId);

        if (device?.status === 'OFFLINE') {
            Modal.confirm({
                title: '⚠️ Thiết bị đang Offline',
                content: 'Thiết bị hiện không kết nối. Lệnh sẽ được gửi khi thiết bị online. Tiếp tục?',
                okText: 'Tiếp tục',
                cancelText: 'Hủy',
                onOk: () => executeControl(deviceId, action),
            });
            return;
        }

        executeControl(deviceId, action);
    };

    const executeControl = async (deviceId: string, action: 'turn_on' | 'turn_off') => {
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
            await controlDevice(deviceId, action);
            message.success(`Đã ${action === 'turn_on' ? 'bật' : 'tắt'} thiết bị ${deviceId}`);
            setTimeout(fetchDevices, 1000);
        } catch (error) {
            // Rollback
            setDevices(prevDevices =>
                prevDevices.map(d =>
                    d.deviceId === deviceId
                        ? { ...d, currentState: action === 'turn_on' ? 'OFF' : 'ON' }
                        : d
                )
            );
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
                    <Tag color={record.status === 'ONLINE' ? 'green' : 'red'}>
                        {record.status === 'ONLINE' ? '🟢 Online' : '🔴 Offline'}
                    </Tag>
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
                                <Button
                                    danger
                                    size="small"
                                    onClick={() => handleControl(record.deviceId, 'turn_off')}
                                    loading={isLoading}
                                >
                                    🔴 Tắt
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<ThunderboltOutlined />}
                                    onClick={() => handleControl(record.deviceId, 'turn_on')}
                                    loading={isLoading}
                                >
                                    🟢 Bật
                                </Button>
                            )}
                        </Space>
                        {isOffline && (
                            <Tag color="warning" style={{ margin: 0, fontSize: '11px' }}>
                                ⚠️ Offline - lệnh sẽ chờ
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
                        okButtonProps={{ danger: true }}
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
                    <Title level={2} style={{ margin: 0 }}>Quản lý Thiết bị</Title>
                    <Space>
                        <Button icon={<SyncOutlined />} onClick={fetchDevices} loading={loading}>
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
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} thiết bị` }}
                    scroll={{ x: 1200 }}
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