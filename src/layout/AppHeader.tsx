import React from 'react';
import { Layout, Avatar, Dropdown, Space, type MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const { Header } = Layout;

interface AppHeaderProps {
    colorBgContainer?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ colorBgContainer = '#ffffff' }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.success('Đăng xuất thành công!');
        navigate('/login');
    };

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
            onClick: () => navigate('/profile')
        },
        {
            key: 'change-password',
            icon: <UserOutlined />,
            label: 'Đổi mật khẩu',
            onClick: () => navigate('/change-password')
        },
        {
            type: 'divider'
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout
        }
    ];

    return (
        <Header
            style={{
                padding: '0 24px',
                background: colorBgContainer,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
        >
            {/* Logo/Brand Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                    src="/logo.svg"
                    alt="Smart Farm"
                    style={{ height: '32px' }}
                    onError={(e) => {
                        // Fallback nếu không có logo
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <span style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#667eea',
                    letterSpacing: '0.5px'
                }}>
                    Smart Farm IoT
                </span>
            </div>

            {/* User Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <a onClick={(e) => e.preventDefault()} style={{ cursor: 'pointer' }}>
                    <Space>
                        <Avatar
                            style={{
                                backgroundColor: '#667eea',
                                cursor: 'pointer'
                            }}
                            icon={<UserOutlined />}
                        />
                        <span style={{
                            fontWeight: 500,
                            color: '#333'
                        }}>
                            {user.fullName || 'User'}
                        </span>
                    </Space>
                </a>
            </Dropdown>
        </Header>
    );
};

export default AppHeader;