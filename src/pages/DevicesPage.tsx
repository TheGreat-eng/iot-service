// src/pages/DevicesPage.tsx

import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Typography, Spin, Alert, message, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Power, Zap, ZapOff } from 'lucide-react';
import type { Device } from '../types/device';
import { getDevicesByFarm, controlDevice } from '../api/deviceService';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DeviceFormModal from '../components/DeviceFormModal';
import { createDevice, updateDevice, deleteDevice } from '../api/deviceService';
import type { DeviceFormData } from '../api/deviceService';

import { Client } from '@stomp/stompjs';

const { Title } = Typography;

const DevicesPage: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<any>(null); // Dùng any để linh hoạt
    const [formLoading, setFormLoading] = useState(false);

    const farmId = 1; // Tạm thời hardcode

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await getDevicesByFarm(farmId);
            setDevices(response.data.data);
        } catch (err) {
            console.error('Failed to fetch devices:', err);
            setError('Không thể tải danh sách thiết bị.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, [farmId]);

    // THÊM useEffect MỚI ĐỂ LẮNG NGHE WEBSOCKET
    useEffect(() => {
        const client = new Client({
            // SỬA LẠI BROKER URL
            webSocketFactory: () => new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/websocket`),
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            // Lắng nghe topic cập nhật trạng thái thiết bị
            client.subscribe(`/topic/farm/${farmId}/device-status`, (message) => {
                const statusUpdate = JSON.parse(message.body);
                console.log('Received device status update:', statusUpdate);

                // Cập nhật state devices
                setDevices(prevDevices =>
                    prevDevices.map(device =>
                        device.deviceId === statusUpdate.deviceId
                            ? { ...device, status: statusUpdate.status.toUpperCase() }
                            : device
                    )
                );
            });
        };

        client.activate();
        return () => { client.deactivate(); };
    }, [farmId]);



    const handleControl = async (deviceId: string, action: 'turn_on' | 'turn_off') => {
        try {
            await controlDevice(deviceId, action, 15 * 60); // Mặc định bật trong 15 phút
            message.success(`Đã gửi lệnh ${action === 'turn_on' ? 'Bật' : 'Tắt'} đến thiết bị ${deviceId}`);
            // Tải lại danh sách để cập nhật trạng thái (cách đơn giản)
            // Cách nâng cao: Cập nhật qua WebSocket
            setTimeout(fetchDevices, 2000); // Đợi 2s cho thiết bị phản hồi
        } catch (err) {
            message.error('Gửi lệnh thất bại!');
        }
    };


    // Xử lý khi submit form (Thêm mới hoặc Cập nhật)
    const handleFormSubmit = async (values: DeviceFormData) => {
        setFormLoading(true);
        try {
            if (editingDevice) {
                await updateDevice(editingDevice.id, values);
                message.success('Cập nhật thiết bị thành công!');
            } else {
                await createDevice(farmId, values);
                message.success('Thêm thiết bị thành công!');
            }
            setIsModalVisible(false);
            setEditingDevice(null);
            fetchDevices(); // Tải lại danh sách
        } catch (err) {
            message.error('Thao tác thất bại!');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteDevice(id);
            message.success('Xóa thiết bị thành công!');
            fetchDevices();
        } catch (err) {
            message.error('Xóa thất bại!');
        }
    };

    const columns: ColumnsType<Device> = [
        {
            title: 'Tên thiết bị',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => <strong>{text} ({record.deviceId})</strong>,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: Device['status']) => {
                let color = 'grey';
                let icon = <ZapOff size={16} />;
                if (status === 'ONLINE') {
                    color = 'green';
                    icon = <Zap size={16} />;
                } else if (status === 'ERROR') {
                    color = 'red';
                }
                return (
                    <Tag color={color} icon={icon}>
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {record.type.includes('ACTUATOR') && (
                        <>
                            <Button type="primary" onClick={() => handleControl(record.deviceId, 'turn_on')}>Bật</Button>
                            <Button danger onClick={() => handleControl(record.deviceId, 'turn_off')}>Tắt</Button>
                        </>
                    )}
                    <Button icon={<EditOutlined />} onClick={() => { setEditingDevice(record); setIsModalVisible(true); }}>Sửa</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>Xóa</Button>
                </Space>
            ),
        },
    ];

    if (loading) {
        return <Spin size="large" tip="Đang tải danh sách thiết bị..." />;
    }

    if (error) {
        return <Alert message="Lỗi" description={error} type="error" showIcon />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>Quản lý Thiết bị</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingDevice(null); setIsModalVisible(true); }}>
                    Thêm thiết bị
                </Button>
            </div>
            <Table columns={columns} dataSource={devices} rowKey="id" loading={loading} />
            <DeviceFormModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleFormSubmit}
                initialData={editingDevice}
                loading={formLoading}
            />
        </div>
    );
};

export default DevicesPage;