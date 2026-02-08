import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Row, Col, Card } from 'antd';
import PageLayout from '../common/PageLayout';

export default function ReportCenter() {
  const progressData = [
    { name: '项目A', completed: 80, remaining: 20 },
    { name: '项目B', completed: 45, remaining: 55 },
    { name: '项目C', completed: 10, remaining: 90 },
  ];

  const hoursData = [
    { name: '1月', hours: 120 },
    { name: '2月', hours: 150 },
    { name: '3月', hours: 180 },
    { name: '4月', hours: 200 },
  ];

  return (
    <PageLayout title="报表与分析" noCard>
      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card className="sys-module-card" title="项目完成率概览" bordered={false} bodyStyle={{ padding: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#52c41a" name="已完成%" />
                <Bar dataKey="remaining" stackId="a" fill="#f5f5f5" name="剩余%" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card className="sys-module-card" title="团队工时投入趋势" bordered={false} bodyStyle={{ padding: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#1890ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </PageLayout>
  );
}
