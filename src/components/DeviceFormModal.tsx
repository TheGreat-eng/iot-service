// src/components/DeviceFormModal.tsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import type { DeviceFormData } from '../api/deviceService';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (values: DeviceFormData) => void;
    initialData?: DeviceFormData | null;
    loading: boolean;
}

const { Option } = Select;

const DeviceFormModal: React.FC<Props> = ({ visible, onClose, onSubmit, initialData, loading }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
        } else {
            form.resetFields();
        }
    }, [initialData, visible]);

    const handleOk = () => {
        form.validateFields()
            .then(values => {
                onSubmit(values);
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    };

    return (
        <Modal
            title={initialData ? "Sửa thông tin thiết bị" : "Thêm thiết bị mới"}
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="back" onClick={onClose}>Hủy</Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleOk}>Lưu</Button>,
            ]}
        >
            <Form form={form} layout="vertical" name="device_form">
                <Form.Item name="name" label="Tên thiết bị" rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="deviceId" label="Device ID (Mã định danh)" rules={[{ required: true, message: 'Vui lòng nhập Device ID!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="type" label="Loại thiết bị" rules={[{ required: true, message: 'Vui lòng chọn loại thiết bị!' }]}>
                    <Select placeholder="Chọn loại">
                        <Option value="SENSOR_DHT22">Cảm biến Nhiệt độ & Độ ẩm (DHT22)</Option>
                        <Option value="SENSOR_SOIL_MOISTURE">Cảm biến Độ ẩm đất</Option>
                        <Option value="SENSOR_LIGHT">Cảm biến Ánh sáng</Option>
                        <Option value="SENSOR_PH">Cảm biến pH</Option>
                        <Option value="ACTUATOR_PUMP">Máy bơm</Option>
                        <Option value="ACTUATOR_FAN">Quạt</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={2} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default DeviceFormModal;