import React, { useEffect, useState } from 'react';
import { Layout, Avatar, Dropdown, Space, Select, message, type MenuProps, Spin } from 'antd';
import { UserOutlined, LogoutOutlined, HomeOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { getFarms } from '../api/farmService';
import type { Farm } from '../types/farm';

const { Header } = Layout;
const { Option } = Select;

interface AppHeaderProps {
    colorBgContainer?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ colorBgContainer = '#ffffff' }) => {
    const navigate = useNavigate();
    const { farmId, setFarmId } = useFarm();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loadingFarms, setLoadingFarms] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // ✅ Lấy danh sách farms
    useEffect(() => {
        const fetchFarms = async () => {
            setLoadingFarms(true);
            try {
                const response = await getFarms();
                const farmList = response.data.data || response.data;
                setFarms(Array.isArray(farmList) ? farmList : []);
            } catch (error) {
                console.error('❌ Failed to fetch farms:', error);
                message.error('Không thể tải danh sách nông trại');
            } finally {
                setLoadingFarms(false);
            }
        };
        fetchFarms();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedFarmId');
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

            {/* ✅ THÊM: Farm Selector + User Menu */}
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
                            message.success(`Đã chuyển sang ${selectedFarm?.name}`, 2);
                        }}
                        loading={loadingFarms}
                        optionFilterProp="children"
                        showSearch
                        suffixIcon={loadingFarms ? <Spin size="small" /> : <SwapOutlined />}
                        // ✅ SỬA: Dùng popupRender thay vì dropdownRender
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
                                color: '#333',
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {user.fullName || user.username || 'User'}
                            </span>
                        </Space>
                    </a>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default AppHeader;