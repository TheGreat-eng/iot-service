// src/pages/DevicesPage.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Space, Tag, Card, message, Typography, Popconfirm, Modal, Input, Spin, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getDevicesByFarm, createDevice, updateDevice, deleteDevice, controlDevice } from '../api/deviceService';
import type { Device } from '../types/device';
import { useFarm } from '../context/FarmContext';
import DeviceFormModal from '../components/DeviceFormModal';
import type { DeviceFormData } from '../api/deviceService';
import { useApiCall } from '../hooks/useApiCall';
import { DEVICE_STATUS, DEVICE_STATE, getDeviceTypeLabel } from '../constants/device';
import { SUCCESS_MESSAGES } from '../constants/messages';
import { useDebounce } from '../hooks/useDebounce';
import { exportDeviceDataAsCsv } from '../api/reportService';

const { Title } = Typography;

const DevicesPage: React.FC = () => {
    const { farmId, isLoadingFarm } = useFarm(); // ✅ THÊM isLoadingFarm
    const [devices, setDevices] = useState<Device[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [controllingDevices, setControllingDevices] = useState<Set<string>>(new Set());
    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = useDebounce(searchText, 300);

    const { loading, execute: fetchDevicesApi } = useApiCall<Device[]>({
        onSuccess: (data) => setDevices(data)
    });

    const { loading: formLoading, execute: saveDeviceApi } = useApiCall({
        showSuccessMessage: true,
    });

    const { execute: deleteDeviceApi } = useApiCall({
        successMessage: SUCCESS_MESSAGES.DEVICE_DELETED,
        showSuccessMessage: true,
    });

    const fetchDevices = async () => {
        if (!farmId) {
            console.warn('⚠️ No farmId available');
            return;
        }

        try {
            console.log('🔍 Fetching devices for farmId:', farmId);
            await fetchDevicesApi(async () => {
                const response = await getDevicesByFarm(farmId);
                console.log('✅ Devices loaded:', response.data.data.length);
                return response.data.data;
            });
        } catch (error) {
            console.error('❌ Failed to fetch devices:', error);
        }
    };

    useEffect(() => {
        if (farmId) {
            fetchDevices();
        }
    }, [farmId]);

    // ✅ THÊM: Early return khi đang load farm
    if (isLoadingFarm) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Spin size="large" tip="Đang tải nông trại..." />
            </div>
        );
    }

    // ✅ THÊM: Early return khi chưa có farmId
    if (!farmId) {
        return (
            <div style={{ padding: '24px' }}>
                <Alert
                    message="Chưa chọn nông trại"
                    description="Vui lòng chọn hoặc tạo nông trại từ menu trên để xem thiết bị."
                    type="warning"
                    showIcon
                    action={
                        <Button type="primary" onClick={() => window.location.href = '/farms'}>
                            Đến trang Nông trại
                        </Button>
                    }
                />
            </div>
        );
    }

    const showModal = (device?: Device) => {
        setEditingDevice(device || null);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingDevice(null);
    };

    const handleSubmit = async (values: DeviceFormData) => {
        try {
            await saveDeviceApi(async () => {
                if (editingDevice) {
                    await updateDevice(editingDevice.id, values);
                    message.success(SUCCESS_MESSAGES.DEVICE_UPDATED);
                } else {
                    await createDevice(farmId, values);
                    message.success(SUCCESS_MESSAGES.DEVICE_CREATED);
                }
            });
            handleCancel();
            fetchDevices();
        } catch (error) {
            console.error('Failed to save device:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteDeviceApi(() => deleteDevice(id));
            fetchDevices();
        } catch (error) {
            console.error('Failed to delete device:', error);
        }
    };

    const handleControl = async (deviceId: string, action: 'turn_on' | 'turn_off') => {
        const device = devices.find(d => d.deviceId === deviceId);

        if (device?.status === DEVICE_STATUS.OFFLINE) {
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

        const newState = action === 'turn_on' ? DEVICE_STATE.ON : DEVICE_STATE.OFF;

        // Optimistic update
        setDevices(prevDevices =>
            prevDevices.map(d =>
                d.deviceId === deviceId
                    ? { ...d, currentState: newState }
                    : d
            )
        );

        try {
            await controlDevice(deviceId, action);
            message.success(`Đã ${action === 'turn_on' ? 'bật' : 'tắt'} thiết bị ${deviceId}`);
            setTimeout(fetchDevices, 1000);
        } catch (error) {
            // Rollback
            const rollbackState = action === 'turn_on' ? DEVICE_STATE.OFF : DEVICE_STATE.ON;
            setDevices(prevDevices =>
                prevDevices.map(d =>
                    d.deviceId === deviceId
                        ? { ...d, currentState: rollbackState }
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

    // Filter devices based on debounced search
    const filteredDevices = useMemo(() => {
        if (!debouncedSearchText) return devices;

        const lowerSearch = debouncedSearchText.toLowerCase();
        return devices.filter(d =>
            d.name.toLowerCase().includes(lowerSearch) ||
            d.deviceId.toLowerCase().includes(lowerSearch)
        );
    }, [devices, debouncedSearchText]);

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
            render: (type: string) => getDeviceTypeLabel(type),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 160,
            render: (_: any, record: Device) => (
                <Space direction="vertical" size="small">
                    <Tag color={record.status === DEVICE_STATUS.ONLINE ? 'green' : 'red'}>
                        {record.status === DEVICE_STATUS.ONLINE ? '🟢 Online' : '🔴 Offline'}
                    </Tag>
                    {record.type.startsWith('ACTUATOR') && record.currentState && (
                        <Tag color={record.currentState === DEVICE_STATE.ON ? 'processing' : 'default'}>
                            {record.currentState === DEVICE_STATE.ON ? '⚡ Đang bật' : '⚪ Đang tắt'}
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
                const isOffline = record.status === DEVICE_STATUS.OFFLINE;
                const isOn = record.currentState === DEVICE_STATE.ON;

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
                    <Button onClick={() => {
                        const end = new Date().toISOString();
                        const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                        exportDeviceDataAsCsv(record.deviceId, start, end);
                    }}>
                        Export CSV
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ marginBottom: 16 }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Title level={2} style={{ margin: 0 }}>
                            Quản lý Thiết bị
                            {/* ✅ THÊM: Hiển thị số lượng */}
                            <span style={{ fontSize: '14px', color: '#999', marginLeft: 8 }}>
                                ({devices.length} thiết bị)
                            </span>
                        </Title>
                        <Space>
                            <Input
                                placeholder="Tìm kiếm thiết bị..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ width: 250 }}
                                allowClear
                            />
                            <Button icon={<SyncOutlined />} onClick={fetchDevices} loading={loading}>
                                Làm mới
                            </Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                                Thêm thiết bị
                            </Button>
                        </Space>
                    </Space>
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredDevices}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} thiết bị`
                    }}
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