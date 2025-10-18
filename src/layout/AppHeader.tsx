import React, { useEffect, useState } from 'react';
import { Layout, Avatar, Dropdown, Space, Select, Modal, message as antdMessage, type MenuProps, Spin, Button, Tooltip } from 'antd';
import { UserOutlined, LogoutOutlined, HomeOutlined, SwapOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons'; // ✅ THÊM icons
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { useTheme } from '../context/ThemeContext'; // ✅ THÊM
import { getFarms } from '../api/farmService';
import { clearAuthData, getUserFromToken, getAuthToken } from '../utils/auth';
import type { Farm } from '../types/farm';

const { Header } = Layout;
const { Option } = Select;

interface AppHeaderProps {
    colorBgContainer?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ colorBgContainer = '#ffffff' }) => {
    const navigate = useNavigate();
    const { farmId, setFarmId } = useFarm();
    const { isDark, toggleTheme } = useTheme(); // ✅ THÊM
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loadingFarms, setLoadingFarms] = useState(false);

    const token = getAuthToken();
    const user = token ? getUserFromToken(token) : null;

    useEffect(() => {
        const fetchFarms = async () => {
            setLoadingFarms(true);
            try {
                const response = await getFarms();
                const farmList = response.data.data || response.data;
                setFarms(Array.isArray(farmList) ? farmList : []);
            } catch (error) {
                console.error('❌ Failed to fetch farms:', error);
            } finally {
                setLoadingFarms(false);
            }
        };
        fetchFarms();
    }, []);

    const handleLogout = () => {
        Modal.confirm({
            title: 'Xác nhận đăng xuất',
            content: 'Bạn có chắc muốn đăng xuất?',
            okText: 'Đăng xuất',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => {
                clearAuthData();
                antdMessage.success('Đăng xuất thành công!');
                navigate('/login');
            }
        });
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

            {/* Right Section: Farm Selector + Dark Mode + User Menu */}
            <Space size="large">
                {/* Farm Selector */}
                <Space>
                    <HomeOutlined style={{ color: '#667eea', fontSize: '18px' }} />
                    <Select
                        style={{ minWidth: 220 }}
                        placeholder="Chọn nông trại..."
                        value={farmId}
                        onChange={(value) => {
                            const selectedFarm = farms.find(f => f.id === value);
                            setFarmId(value);
                            antdMessage.success(`Đã chuyển sang ${selectedFarm?.name}`, 2);
                        }}
                        loading={loadingFarms}
                        optionFilterProp="children"
                        showSearch
                        suffixIcon={loadingFarms ? <Spin size="small" /> : <SwapOutlined />}
                        popupRender={(menu) => (
                            <>
                                {menu}
                                <div style={{
                                    borderTop: '1px solid #f0f0f0',
                                    padding: '8px',
                                    textAlign: 'center'
                                }}>
                                    <a
                                        onClick={() => navigate('/farms')}
                                        style={{ fontSize: '12px', cursor: 'pointer' }}
                                    >
                                        + Quản lý nông trại
                                    </a>
                                </div>
                            </>
                        )}
                    >
                        {farms.map(farm => (
                            <Option key={farm.id} value={farm.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 500 }}>{farm.name}</span>
                                    {farm.location && (
                                        <span style={{ fontSize: '12px', color: '#999' }}>
                                            📍 {farm.location}
                                        </span>
                                    )}
                                </div>
                            </Option>
                        ))}
                    </Select>
                </Space>

                {/* ✅ Dark Mode Toggle */}
                <Tooltip title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}>
                    <Button
                        type="text"
                        icon={isDark ? <BulbFilled style={{ color: '#ffd700' }} /> : <BulbOutlined />}
                        onClick={toggleTheme}
                        style={{
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                        }}
                    />
                </Tooltip>

                {/* User Menu */}
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
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
                                color: isDark ? '#fff' : '#333',
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {user?.username || user?.email?.split('@')[0] || 'User'}
                            </span>
                        </Space>
                    </a>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default AppHeader;