// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Descriptions, Spin, Result, Button, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getUserFromStorage, getUserFromToken, clearAuthData } from '../utils/auth'; // ✅ THÊM clearAuthData và getUserFromToken

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUserData = () => {
            const token = getAuthToken();
            console.log('🔍 Checking auth token:', token ? 'exists' : 'missing');

            if (!token) {
                console.warn('⚠️ No token found, redirecting to login');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
                return;
            }

            // ✅ Lấy user từ localStorage
            const storedUser = getUserFromStorage();
            console.log('🔍 Stored user:', storedUser);

            if (storedUser) {
                setUser(storedUser);
            } else {
                // ✅ Fallback: Parse từ token nếu không có trong storage
                console.warn('⚠️ No user in localStorage, parsing from token');
                const userFromToken = getUserFromToken(token);

                if (userFromToken) {
                    setUser(userFromToken);
                    // ✅ Lưu lại vào localStorage để lần sau không phải parse
                    localStorage.setItem('user', JSON.stringify(userFromToken));
                } else {
                    console.error('❌ Cannot parse user from token');
                }
            }

            setLoading(false);
        };

        loadUserData();
    }, [navigate]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return (
            <Result
                status="warning"
                title="Không thể tải thông tin người dùng"
                subTitle="Vui lòng đăng nhập lại để tiếp tục"
                extra={
                    <Space>
                        <Button onClick={() => navigate('/dashboard')}>
                            Quay lại Dashboard
                        </Button>
                        <Button type="primary" onClick={() => {
                            clearAuthData();
                            window.location.href = '/login';
                        }}>
                            Đăng nhập lại
                        </Button>
                    </Space>
                }
            />
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: 24 }}>
                Thông tin cá nhân
            </Title>

            <Card>
                {/* Avatar & Name Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 32,
                    paddingBottom: 24,
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <Avatar
                        size={80}
                        icon={<UserOutlined />}
                        style={{
                            backgroundColor: '#667eea',
                            fontSize: '32px'
                        }}
                    />
                    <div style={{ marginLeft: 20 }}>
                        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                            {user.fullName || user.username || 'Người dùng'}
                        </Title>
                        <Space>
                            <Text type="secondary">
                                Vai trò: <strong>{user.roles?.[0] || 'FARMER'}</strong>
                            </Text>
                        </Space>
                    </div>
                </div>

                {/* User Details */}
                <Descriptions
                    bordered
                    column={1}
                    styles={{
                        label: {
                            width: '200px',
                            fontWeight: 500
                        }
                    }}
                >
                    <Descriptions.Item
                        label={
                            <Space>
                                <IdcardOutlined />
                                User ID
                            </Space>
                        }
                    >
                        <Text code>{user.userId || 'N/A'}</Text>
                    </Descriptions.Item>

                    <Descriptions.Item
                        label={
                            <Space>
                                <UserOutlined />
                                Họ và tên
                            </Space>
                        }
                    >
                        {user.fullName || 'Chưa cập nhật'}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label={
                            <Space>
                                <UserOutlined />
                                Tên đăng nhập
                            </Space>
                        }
                    >
                        {user.username || user.email?.split('@')[0] || 'Chưa có'}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label={
                            <Space>
                                <MailOutlined />
                                Email
                            </Space>
                        }
                    >
                        {user.email || 'Chưa cập nhật'}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label={
                            <Space>
                                <PhoneOutlined />
                                Số điện thoại
                            </Space>
                        }
                    >
                        {user.phone || 'Chưa cập nhật'}
                    </Descriptions.Item>
                </Descriptions>

                {/* Action Buttons */}
                <div style={{
                    marginTop: 24,
                    paddingTop: 24,
                    borderTop: '1px solid #f0f0f0'
                }}>
                    <Space>
                        <Button onClick={() => navigate('/change-password')}>
                            Đổi mật khẩu
                        </Button>
                        <Button type="primary" onClick={() => navigate('/dashboard')}>
                            Quay lại Dashboard
                        </Button>
                    </Space>
                </div>
            </Card>
        </div>
    );
};

export default ProfilePage;