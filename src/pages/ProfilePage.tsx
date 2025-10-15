// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Descriptions, Spin, Result, Button, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getUserFromStorage } from '../utils/auth';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUserData = () => {
            const token = getAuthToken();
            console.log('🔍 Token:', token);

            if (!token) {
                console.warn('⚠️ No token found');
                setLoading(false);
                return;
            }

            // ✅ Lấy user từ localStorage (đã được lưu khi login)
            const storedUser = getUserFromStorage();
            console.log('🔍 Stored user:', storedUser);

            if (storedUser) {
                setUser(storedUser);
            } else {
                console.error('❌ No user data found');
            }

            setLoading(false);
        };

        loadUserData();
    }, []);

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
                        <Button type="primary" onClick={() => navigate('/login')}>
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
                        <Text code>{user.userId}</Text>
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
                        {user.username || 'Chưa có thông tin'}
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