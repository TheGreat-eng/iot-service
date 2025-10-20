import React, { useState } from 'react';
import {
    DesktopOutlined,
    PieChartOutlined,
    UserOutlined,
    SettingOutlined,
    BuildOutlined,
    RobotOutlined,
    HeartOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // ✅ THÊM
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
// ... imports
import { CrownOutlined } from '@ant-design/icons'; // Thêm icon
import { hasRole, getUserFromStorage } from '../utils/auth'; // Thêm util

const { Content, Sider } = Layout;

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
    const { isDark } = useTheme(); // ✅ THÊM
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    // VVVV--- LOGIC TẠO MENU ĐỘNG ---VVVV
    const user = getUserFromStorage();
    const isAdmin = user && user.roles && user.roles.includes('ADMIN');

    const menuItems: MenuItem[] = [
        getItem('Dashboard', '/dashboard', <PieChartOutlined />),
        getItem('Dự đoán AI', '/ai', <RobotOutlined />),
        // Thêm trang Plant Health sẽ ở đây
        getItem('Quy tắc Tự động', '/rules', <BuildOutlined />),
        getItem('Quản lý Nông trại', '/farms', <DesktopOutlined />),
        getItem('Quản lý Thiết bị', '/devices', <SettingOutlined />),
        getItem('Sức khỏe Cây trồng', '/plant-health', <HeartOutlined />), // <-- THÊM DÒNG NÀY
        // Chỉ hiển thị menu Admin nếu là Admin
        isAdmin && getItem('Admin Panel', 'sub_admin', <CrownOutlined />, [
            // SỬA LẠI ĐÂY
            getItem('Dashboard', '/admin/dashboard'),
            getItem('Quản lý Người dùng', '/admin/users'),
        ]),
        getItem('Tài khoản', 'sub_user', <UserOutlined />, [
            getItem('Thông tin cá nhân', '/profile'),
            getItem('Đổi mật khẩu', '/change-password'),
        ]),
    ].filter(Boolean) as MenuItem[]; // .filter(Boolean) để loại bỏ giá trị false (khi user không phải admin)
    // ^^^^------------------------------------^^^^

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                theme={isDark ? 'dark' : 'light'} // ✅ THÊM: Theme động
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 100
                }}
            >
                <div
                    style={{
                        height: 64,
                        margin: 16,
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)', // ✅ THÊM
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#fff' : '#667eea', // ✅ THÊM
                        fontWeight: 'bold',
                        fontSize: collapsed ? '12px' : '16px',
                        transition: 'all 0.2s'
                    }}
                >
                    {collapsed ? 'SF' : 'Smart Farm'}
                </div>
                <Menu
                    theme={isDark ? 'dark' : 'light'} // ✅ THÊM
                    selectedKeys={[location.pathname]}
                    mode="inline"
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>

            <Layout style={{
                marginLeft: collapsed ? 80 : 200,
                transition: 'margin-left 0.2s'
            }}>
                <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 99,
                    width: '100%'
                }}>
                    <AppHeader colorBgContainer={colorBgContainer} />
                </div>

                <Content
                    style={{
                        margin: '16px',
                        padding: 0,
                        minHeight: 280,
                        background: colorBgContainer,
                        overflow: 'auto'
                    }}
                >
                    <Outlet />
                </Content>

                <AppFooter />
            </Layout>
        </Layout>
    );
};

export default AppLayout;