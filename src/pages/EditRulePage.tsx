// src/pages/EditRulePage.tsx

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Space, Card, Typography, message, Spin, Alert } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getRuleById, updateRule } from '../api/ruleService'; // Import các service cần thiết
import type { Rule } from '../types/rule';

const { Title } = Typography;

const EditRulePage: React.FC = () => {
    const navigate = useNavigate();
    const { ruleId } = useParams<{ ruleId: string }>(); // Lấy ID từ URL
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ruleId) return;
        setLoading(true);
        getRuleById(parseInt(ruleId))
            .then(response => {
                form.setFieldsValue(response.data.data); // Điền dữ liệu vào form
                setLoading(false);
            })
            .catch(err => {
                setError("Không thể tải thông tin quy tắc.");
                setLoading(false);
            });
    }, [ruleId, form]);

    const onFinish = async (values: any) => {
        if (!ruleId) return;
        const updatedRule: Rule = {
            ...values,
            id: parseInt(ruleId),
            enabled: form.getFieldValue('enabled'), // Giữ lại trạng thái bật/tắt cũ
        };
        try {
            await updateRule(parseInt(ruleId), updatedRule);
            message.success('Cập nhật quy tắc thành công!');
            navigate('/rules');
        } catch (error) {
            message.error('Cập nhật quy tắc thất bại!');
        }
    };

    if (loading) {
        return <Spin tip="Đang tải quy tắc..." />;
    }

    if (error) {
        return <Alert message="Lỗi" description={error} type="error" showIcon />;
    }

    // Giao diện form gần như giống hệt trang CreateRulePage
    return (
        <div>
            <Title level={2}>Sửa Quy tắc</Title>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                {/* Các Form Items giống hệt CreateRulePage */}
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
                                            <Select style={{ width: 130 }}><Select.Option value="soil_moisture">độ ẩm đất</Select.Option><Select.Option value="temperature">nhiệt độ</Select.Option></Select>
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'operator']} rules={[{ required: true }]}>
                                            <Select style={{ width: 120 }}><Select.Option value="LESS_THAN">nhỏ hơn</Select.Option><Select.Option value="GREATER_THAN">lớn hơn</Select.Option></Select>
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
                                            <Select style={{ width: 120 }}><Select.Option value="TURN_ON_DEVICE">Bật thiết bị</Select.Option><Select.Option value="TURN_OFF_DEVICE">Tắt thiết bị</Select.Option></Select>
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
                    <Button type="primary" htmlType="submit">Lưu thay đổi</Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => navigate('/rules')}>Hủy</Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default EditRulePage;