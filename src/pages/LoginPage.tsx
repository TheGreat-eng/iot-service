// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Row, Col, message, Space } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { LoginRequest, AuthResponse } from '../types/auth';

const { Title, Text, Paragraph } = Typography;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values: LoginRequest) => {
        setLoading(true);

        try {
            const response = await api.post<AuthResponse>('/auth/login', values);

            const { token, userId, fullName, email } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ userId, fullName, email }));

            message.success(`Chào mừng trở lại${fullName ? `, ${fullName}` : ''}!`);
            navigate('/dashboard');

        } catch (err: any) {
            console.error('Login failed:', err);
            const errorMessage = err.response?.data?.message || 'Email hoặc mật khẩu không đúng!';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <Row justify="center" style={{ width: '100%' }}>
                <Col xs={22} sm={20} md={16} lg={10} xl={8}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: '16px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header Section */}
                        <div style={{
                            textAlign: 'center',
                            padding: '20px 0 30px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            margin: '-24px -24px 30px',
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <UserOutlined style={{ fontSize: '40px', color: '#fff' }} />
                            </div>
                            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
                                Smart Farm
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px' }}>
                                Hệ thống giám sát nông trại thông minh
                            </Text>
                        </div>

                        {/* Form Section */}
                        <Form
                            form={form}
                            name="login_form"
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                            requiredMark={false}
                        >
                            <Form.Item
                                name="email"
                                label={<Text strong>Email</Text>}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' }
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: '#667eea' }} />}
                                    placeholder="example@email.com"
                                    style={{ borderRadius: '8px' }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label={<Text strong>Mật khẩu</Text>}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: '#667eea' }} />}
                                    placeholder="••••••••"
                                    style={{ borderRadius: '8px' }}
                                />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: '16px' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                    style={{
                                        height: '48px',
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                                    }}
                                >
                                    Đăng nhập
                                </Button>
                            </Form.Item>

                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <Text type="secondary">
                                    Chưa có tài khoản?{' '}
                                    <a
                                        href="/register"
                                        style={{
                                            color: '#667eea',
                                            fontWeight: 600,
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Đăng ký ngay
                                    </a>
                                </Text>
                            </div>
                        </Form>

                        {/* Footer */}
                        <div style={{
                            textAlign: 'center',
                            marginTop: '30px',
                            paddingTop: '20px',
                            borderTop: '1px solid #f0f0f0'
                        }}>
                            <Space direction="vertical" size={4}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    © 2024 Smart Farm System
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Powered by IoT Technology
                                </Text>
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LoginPage;