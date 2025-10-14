// src/pages/ProfilePage.tsx
import React from 'react';
import { Card, Avatar, Typography, Descriptions } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
    // Lấy thông tin người dùng từ localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div>
            <Title level={2} style={{ marginBottom: 24 }}>Thông tin cá nhân</Title>
            <Card>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                    <Avatar size={64} icon={<UserOutlined />} />
                    <div style={{ marginLeft: 16 }}>
                        <Title level={4} style={{ margin: 0 }}>{user.fullName || 'Chưa có tên'}</Title>
                        <Text type="secondary">{user.role || 'FARMER'}</Text>
                    </div>
                </div>
                <Descriptions bordered column={1}>
                    <Descriptions.Item label={<><UserOutlined /> Họ và tên</>}>{user.fullName}</Descriptions.Item>
                    <Descriptions.Item label={<><MailOutlined /> Email</>}>{user.email}</Descriptions.Item>
                    <Descriptions.Item label={<><PhoneOutlined /> Số điện thoại</>}>(Chức năng cập nhật sẽ được thêm sau)</Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    );
};

export default ProfilePage;