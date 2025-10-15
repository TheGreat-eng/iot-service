// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authService';
import { setAuthData } from '../utils/auth'; // ✅ THÊM

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: { username: string; password: string }) => {
        setLoading(true);
        try {
            const response = await login(values.username, values.password);
            const { token, user } = response.data;

            // ✅ SỬA: Dùng helper function
            setAuthData(token, user);

            message.success('Đăng nhập thành công!');
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Login failed:', error);
            // ✅ Lỗi đã được xử lý trong axios interceptor
            // Chỉ cần hiển thị message cụ thể nếu cần
            if (error.response?.status === 401) {
                message.error('Tên đăng nhập hoặc mật khẩu không đúng');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <Card
                style={{
                    width: 400,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    borderRadius: '8px'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={2} style={{ color: '#667eea', marginBottom: '8px' }}>
                        Smart Farm IoT
                    </Title>
                    <Text type="secondary">Đăng nhập để tiếp tục</Text>
                </div>

                <Form
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Tên đăng nhập"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Mật khẩu"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                height: '40px'
                            }}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">
                            Chưa có tài khoản?{' '}
                            <a onClick={() => navigate('/register')}>Đăng ký ngay</a>
                        </Text>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;