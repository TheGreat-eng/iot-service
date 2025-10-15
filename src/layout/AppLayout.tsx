// src/layout/AppLayout.tsx
import React, { useState } from 'react';
import {
    DesktopOutlined,
    PieChartOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    BuildOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme, Avatar, Dropdown, Space, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { RobotOutlined } from '@ant-design/icons';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem {
    return { key, icon, children, label } as MenuItem;
}

const items: MenuItem[] = [
    getItem('Dashboard', '/dashboard', <PieChartOutlined />),
    getItem('Dự đoán AI', '/ai', <RobotOutlined />),
    getItem('Quy tắc Tự động', '/rules', <BuildOutlined />),
    getItem('Quản lý Nông trại', '/farms', <DesktopOutlined />),
    getItem('Quản lý Thiết bị', '/devices', <SettingOutlined />),
    getItem('Tài khoản', 'sub_user', <UserOutlined />, [
        getItem('Thông tin cá nhân', '/profile'),
        getItem('Đổi mật khẩu', '/change-password'),
    ]),
];

const AppLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.success('Đăng xuất thành công!');
        navigate('/login');
    };

    // ✅ SỬA LẠI: Định nghĩa userMenuItems dưới dạng MenuProps['items']
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
            onClick: () => navigate('/profile')
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout
        }
    ];

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
                <Menu
                    theme="dark"
                    selectedKeys={[location.pathname]}
                    mode="inline"
                    items={items}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>

            <Layout>
                <Header style={{
                    padding: '0 24px',
                    background: colorBgContainer,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0' // Thêm một đường kẻ mờ cho đẹp
                }}>
                    <Dropdown menu={{ items: userMenuItems }}>
                        <a onClick={(e) => e.preventDefault()}>
                            <Space>
                                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                                {user.fullName || 'User'}
                            </Space>
                        </a>
                    </Dropdown>
                </Header>

                {/* 
          Thay thế component <Content> bằng một cấu trúc div linh hoạt hơn
          để xử lý scroll và padding một cách nhất quán.
        */}
                <Content style={{
                    margin: '24px 16px', // Tăng khoảng cách trên dưới
                    padding: 24,
                    minHeight: 280,
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                    overflow: 'initial'
                }}>
                    <Outlet />
                </Content>

                <Footer style={{ textAlign: 'center' }}>
                    Smart Farm IoT ©{new Date().getFullYear()} Created by Group XYZ
                </Footer>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
