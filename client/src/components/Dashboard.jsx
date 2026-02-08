import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Row, Col, Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import PageLayout from './common/PageLayout';

export default function Dashboard() {
  const data = [
    { name: '第一阶段', progress: 100, expected: 100 },
    { name: '第二阶段', progress: 80, expected: 100 },
    { name: '第三阶段', progress: 20, expected: 30 },
    { name: '第四阶段', progress: 0, expected: 0 },
  ];

  const riskData = [
    { name: '高风险', value: 2, color: '#ff4d4f' },
    { name: '中风险', value: 5, color: '#faad14' },
    { name: '低风险', value: 10, color: '#52c41a' },
  ];

  return (
    <PageLayout title="项目概览" noCard>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card variant="borderless" className="sys-module-card">
            <Statistic
              title="进度偏差"
              value={5}
              precision={0}
              styles={{ content: { color: '#cf1322' } }}
              prefix={<ArrowDownOutlined />}
              suffix="天"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless" className="sys-module-card">
            <Statistic
              title="预算偏差"
              value={2}
              precision={2}
              styles={{ content: { color: '#3f8600' } }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless" className="sys-module-card">
            <Statistic
              title="待解决问题"
              value={12}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col span={12}>
          <div className="sys-module-card" style={{ padding: 24, minHeight: 400 }}>
            <h3>阶段进度对比</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="progress" fill="#8884d8" name="实际进度 %" />
                <Bar dataKey="expected" fill="#82ca9d" name="计划进度 %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        <Col span={12}>
          <div className="sys-module-card" style={{ padding: 24, minHeight: 400 }}>
            <h3>风险分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>
    </PageLayout>
  );
}
