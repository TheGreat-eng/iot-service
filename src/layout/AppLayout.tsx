// src/layout/AppLayout.tsx
import React, { useState } from 'react';
import {
    DesktopOutlined,
    PieChartOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme, Avatar, Dropdown, Space, message } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';


import { RobotOutlined } from '@ant-design/icons'; // Thêm icon


const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]): MenuItem {
    return { key, icon, children, label } as MenuItem;
}

const items: MenuItem[] = [
    getItem('Dashboard', '/dashboard', <PieChartOutlined />),
    getItem('Nông trại', '/farms', <DesktopOutlined />),
    getItem('Thiết bị', '/devices', <SettingOutlined />),
    getItem('Người dùng', 'sub1', <UserOutlined />, [
        getItem('Thông tin', '/profile'),
        getItem('Đổi mật khẩu', '/change-password'),
        getItem('Dự đoán AI', '/ai', <RobotOutlined />), // <== THÊM DÒNG NÀY
    ]),
];

const AppLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleMenuClick = (e: { key: string }) => {
        navigate(e.key);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.success('Đăng xuất thành công!');
        navigate('/login');
    };

    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
                Thông tin cá nhân
            </Menu.Item>
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
            </Menu.Item>
        </Menu>
    );

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
                <Menu theme="dark" defaultSelectedKeys={['/dashboard']} mode="inline" items={items} onClick={handleMenuClick} />
            </Sider>
            <Layout>
                <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Dropdown overlay={userMenu}>
                        <a onClick={(e) => e.preventDefault()}>
                            <Space>
                                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                                {user.fullName || 'User'}
                            </Space>
                        </a>
                    </Dropdown>
                </Header>
                <Content style={{ margin: '16px' }}>
                    <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
                        {/* Đây là nơi nội dung của các trang con sẽ được hiển thị */}
                        <Outlet />
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    Smart Farm IoT ©{new Date().getFullYear()} Created by Group XYZ
                </Footer>
            </Layout>
        </Layout>
    );
};

export default AppLayout;