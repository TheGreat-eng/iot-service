// src/pages/RulesPage.tsx

import React, { useEffect, useState } from 'react';
import { List, Switch, Button, Typography, Spin, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRulesByFarm, deleteRule, toggleRuleStatus } from '../api/ruleService'; // Import thêm các service mới
import type { Rule } from '../types/rule';

const { Title, Text } = Typography;

const RulesPage: React.FC = () => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const farmId = 1;

    const fetchRules = () => {
        setLoading(true);
        getRulesByFarm(farmId)
            .then(response => setRules(response.data.data))
            .catch(err => {
                console.error(err);
                message.error("Không thể tải danh sách quy tắc.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRules();
    }, [farmId]);

    const handleToggle = async (ruleId: number, enabled: boolean) => {
        try {
            await toggleRuleStatus(ruleId, enabled);
            message.success(`Đã ${enabled ? 'bật' : 'tắt'} quy tắc.`);
            // Cập nhật lại state để giao diện thay đổi ngay lập tức
            setRules(prevRules =>
                prevRules.map(rule =>
                    rule.id === ruleId ? { ...rule, enabled } : rule
                )
            );
        } catch (error) {
            message.error("Thay đổi trạng thái thất bại.");
        }
    };

    const handleDelete = async (ruleId: number) => {
        try {
            await deleteRule(ruleId);
            message.success("Đã xóa quy tắc.");
            fetchRules(); // Tải lại danh sách sau khi xóa
        } catch (error) {
            message.error("Xóa quy tắc thất bại.");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>Quy tắc Tự động</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/rules/create')}>
                    Tạo quy tắc mới
                </Button>
            </div>

            <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={rules}
                renderItem={item => (
                    <List.Item
                        actions={[
                            <Switch
                                checkedChildren="Bật"
                                unCheckedChildren="Tắt"
                                checked={item.enabled}
                                onChange={(checked) => handleToggle(item.id!, checked)}
                            />,
                            <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/rules/edit/${item.id}`)}>Sửa</Button>,
                            <Popconfirm
                                title="Xóa quy tắc"
                                description="Bạn có chắc muốn xóa quy tắc này?"
                                onConfirm={() => handleDelete(item.id!)}
                                okText="Xóa"
                                cancelText="Hủy"
                            >
                                <Button type="text" danger icon={<DeleteOutlined />}>Xóa</Button>
                            </Popconfirm>
                        ]}
                    >
                        <List.Item.Meta
                            title={<a onClick={() => navigate(`/rules/edit/${item.id}`)}>{item.name}</a>}
                            description={item.description || 'Không có mô tả'}
                        />
                    </List.Item>
                )}
            />
        </div>
    );
};

export default RulesPage;