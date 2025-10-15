import React from 'react';
import { Layout, Space, Typography } from 'antd';
import { GithubOutlined, HeartFilled } from '@ant-design/icons';

const { Footer } = Layout;
const { Text, Link } = Typography;

const AppFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <Footer
            style={{
                textAlign: 'center',
                background: '#f5f5f5',
                borderTop: '1px solid #e8e8e8',
                padding: '24px 50px'
            }}
        >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {/* Copyright */}
                <Text style={{ fontSize: '14px', color: '#666' }}>
                    Smart Farm IoT ©{currentYear} Created by Group XYZ
                </Text>

                {/* Additional Info */}
                <Space split="|" size="middle">
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Powered by IoT Technology
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Version 1.0.0
                    </Text>
                    <Link href="https://github.com" target="_blank" style={{ fontSize: '12px' }}>
                        <GithubOutlined /> GitHub
                    </Link>
                </Space>

                {/* Love Message */}
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Made with <HeartFilled style={{ color: '#ff4d4f' }} /> for Smart Agriculture
                </Text>
            </Space>
        </Footer>
    );
};

export default AppFooter;