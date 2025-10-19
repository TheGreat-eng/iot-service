// src/pages/LoginPage.tsx

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authService';
import { setAuthData, isAuthenticated, clearAuthData } from '../utils/auth';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        clearAuthData();
        if (isAuthenticated()) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const onFinish = async (values: { username: string; password: string }) => {
        setLoading(true);
        try {
            const response = await login(values.username, values.password);

            console.log('🔍 Full response:', response.data);

            // ✅ SỬA: Xử lý cả accessToken và token
            const {
                token,
                accessToken,  // ✅ THÊM
                refreshToken, // ✅ THÊM
                userId,
                email,
                fullName,
                role
            } = response.data;

            // ✅ Ưu tiên accessToken nếu có, không thì dùng token
            const authToken = accessToken || token;

            if (!authToken) {
                throw new Error('Không nhận được token từ server');
            }

            // Chuẩn hóa user object
            const userInfo = {
                userId: userId,
                username: email.split('@')[0],
                email: email,
                fullName: fullName,
                roles: [role],
            };

            console.log('✅ Saving token:', authToken);
            console.log('✅ Saving user:', userInfo);

            // ✅ Lưu cả refresh token nếu có
            setAuthData(authToken, userInfo);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            message.success('Đăng nhập thành công!');

            // ✅ SỬA: Tăng thời gian delay và log để debug
            console.log('🚀 Navigating to dashboard...');
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 500); // ✅ Tăng từ 100ms lên 500ms

        } catch (error: any) {
            console.error('❌ Login failed:', error);
            console.error('❌ Response:', error.response?.data);

            const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại';
            message.error(errorMsg);
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
            <Card style={{ width: 400, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={2} style={{ color: '#667eea', marginBottom: '8px' }}>
                        Smart Farm IoT
                    </Title>
                    <Text type="secondary">Đăng nhập để tiếp tục</Text>
                </div>

                <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Email" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
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
                            Chưa có tài khoản? <a onClick={() => navigate('/register')}>Đăng ký ngay</a>
                        </Text>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;