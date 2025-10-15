// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Descriptions, Spin, Result, Button, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getUserFromToken, getUserFromStorage } from '../utils/auth';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUserData = () => {
            const token = getAuthToken();

            if (!token) {
                setLoading(false);
                return;
            }

            // ✅ Lấy data từ token (luôn có)
            const decodedUser = getUserFromToken(token);

            // ✅ Lấy data từ localStorage (có thể không có)
            const storedUser = getUserFromStorage();

            if (decodedUser) {
                setUser({
                    // ✅ Ưu tiên data từ localStorage
                    ...storedUser,
                    // ✅ Override bằng data từ token (chắc chắn đúng)
                    userId: decodedUser.userId,
                    username: decodedUser.username,
                    roles: decodedUser.roles,
                });
            }

            setLoading(false);
        };

        loadUserData();
    }, []);

    // ✅ Loading state
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

    // ✅ No user state
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

    // ✅ Render user info
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
                    labelStyle={{
                        width: '200px',
                        fontWeight: 500
                    }}
                >
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

                    <Descriptions.Item label="User ID">
                        <Text code>{user.userId}</Text>
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