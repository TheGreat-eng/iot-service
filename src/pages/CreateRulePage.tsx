// src/pages/CreateRulePage.tsx
import React from 'react';
import { Form, Input, Button, Select, Space, Card, Typography, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createRule } from '../api/ruleService';
import type { Rule } from '../types/rule';



import { useEffect, useState } from 'react'; // Thêm useEffect, useState
import { getDevicesByFarm } from '../api/deviceService'; // Import service lấy thiết bị
import { Device } from '../types/device'; // Import type Device


const { Title } = Typography;
const { Option } = Select;

const CreateRulePage: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // THÊM CÁC STATE MỚI
    const [devices, setDevices] = useState<Device[]>([]);
    const [sensors, setSensors] = useState<Device[]>([]);
    const [actuators, setActuators] = useState<Device[]>([]);
    const farmId = 1;

    // LẤY DANH SÁCH THIẾT BỊ KHI COMPONENT ĐƯỢC TẢI
    useEffect(() => {
        getDevicesByFarm(farmId).then(res => {
            const allDevices = res.data.data;
            setDevices(allDevices);
            setSensors(allDevices.filter(d => d.type.startsWith('SENSOR')));
            setActuators(allDevices.filter(d => d.type.startsWith('ACTUATOR')));
        });
    }, [farmId]);

    const onFinish = async (values: any) => {
        const newRule: Rule = {
            ...values,
            enabled: true, // Mặc định là bật
        };
        try {
            await createRule(1, newRule);
            message.success('Tạo quy tắc thành công!');
            navigate('/rules');
        } catch (error) {
            message.error('Tạo quy tắc thất bại!');
        }
    };

    return (
        <div>
            <Title level={2}>Tạo Quy tắc Mới</Title>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Card title="Thông tin chung">
                    <Form.Item name="name" label="Tên quy tắc" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea />
                    </Form.Item>
                </Card>

                <Card title="Điều kiện (NẾU)" style={{ marginTop: 16 }}>
                    <Form.List name="conditions">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'type']} initialValue="SENSOR_VALUE" noStyle><Input hidden /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'deviceId']} rules={[{ required: true }]}><Input placeholder="ID Cảm biến" /></Form.Item>
                                        <span> có </span>
                                        <Form.Item {...restField} name={[name, 'field']} rules={[{ required: true }]}>
                                            <Select style={{ width: 130 }}><Select.Option value="soil_moisture">độ ẩm đất</Select.Option></Select>
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'operator']} rules={[{ required: true }]}>
                                            <Select style={{ width: 120 }}><Select.Option value="LESS_THAN">nhỏ hơn</Select.Option></Select>
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'value']} rules={[{ required: true }]}><Input placeholder="Giá trị" /></Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm điều kiện</Button></Form.Item>
                            </>
                        )}
                    </Form.List>
                </Card>

                <Card title="Hành động (THÌ)" style={{ marginTop: 16 }}>
                    <Form.List name="actions">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true }]}>
                                            <Select style={{ width: 120 }}><Select.Option value="TURN_ON_DEVICE">Bật thiết bị</Select.Option></Select>
                                        </Form.Item>

                                        <Form.Item {...restField} name={[name, 'deviceId']} rules={[{ required: true }]}><Input placeholder="ID Thiết bị" /></Form.Item>
                                        <span> trong </span>
                                        <Form.Item {...restField} name={[name, 'durationSeconds']}><Input placeholder="Số giây" /></Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm hành động</Button></Form.Item>
                            </>
                        )}
                    </Form.List>
                </Card>

                <Form.Item style={{ marginTop: 24 }}>
                    <Button type="primary" htmlType="submit">Lưu quy tắc</Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => navigate('/rules')}>Hủy</Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default CreateRulePage;