import React from 'react';
import { Card, Skeleton, Row, Col } from 'antd';

export const DashboardSkeleton: React.FC = () => (
    <div style={{ padding: '24px' }}>
        <Row gutter={[16, 16]}>
            {[1, 2, 3, 4, 5, 6].map(i => (
                <Col xs={12} sm={12} md={8} lg={12} xl={8} key={i}>
                    <Card>
                        <Skeleton active paragraph={{ rows: 1 }} />
                    </Card>
                </Col>
            ))}
        </Row>
        <Card style={{ marginTop: 24 }}>
            <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
    </div>
);

export const TableSkeleton: React.FC = () => (
    <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
    </Card>
);