import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, DatePicker, Select, InputNumber, Card, Row, Col } from 'antd';
import { PlusOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, FlagOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useProjects } from '@/hooks/useProjects';
import ProjectDetail from './ProjectDetail';

const { Option } = Select;
const { TextArea } = Input;

const PHASES = [
  '进场前阶段',
  '启动阶段',
  '实施阶段',
  '初验阶段',
  '试运行阶段',
  '终验阶段',
  '运维阶段'
];

const ProjectList: React.FC = () => {
  const { projects, loading, fetchProjects, createProject, fetchProjectDetails, currentProject, updateProject, transferManager, addMember, removeMember } = useProjects();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchParams, setSearchParams] = useState<any>({});
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
      try {
          const values = await form.validateFields();
          const payload = {
            ...values,
            start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
            end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
          };
          const success = await createProject(payload);
          if (success) {
              setCreateModalVisible(false);
              form.resetFields();
          }
      } catch (e) {
          // validation failed
      }
  };

  const handleViewDetail = (id: number) => {
      fetchProjectDetails(id);
      setDetailVisible(true);
  };

  const filteredProjects = projects.filter(p => {
      if (searchParams.status && p.status !== searchParams.status) return false;
      if (searchParams.name_like && !p.name.includes(searchParams.name_like)) return false;
      return true;
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '项目名称', dataIndex: 'name', render: (text: string, r: any) => (
        <div>
            <div style={{fontWeight: 'bold'}}>{text}</div>
            <div style={{fontSize: 12, color: '#888'}}>{r.description}</div>
        </div>
    )},
    { title: '部门/客户', render: (_: any, r: any) => (
        <div>
            <div>{r.department}</div>
            <div style={{fontSize: 12, color: '#888'}}>{r.customer}</div>
        </div>
    )},
    { title: '优先级', dataIndex: 'priority', render: (t: string) => {
        const map: any = { 'HIGH': '高', 'MEDIUM': '中', 'LOW': '低' };
        return <Tag color={t === 'HIGH' ? 'red' : t === 'MEDIUM' ? 'orange' : 'green'}>{map[t] || t}</Tag>;
    }},
    { title: '状态', dataIndex: 'status', render: (t: string) => {
        const map: any = { 'PLANNING': '规划中', 'IN_PROGRESS': '进行中', 'COMPLETED': '已完成', 'ON_HOLD': '已暂停' };
        return <Tag color={t === 'COMPLETED' ? 'green' : t === 'IN_PROGRESS' ? 'blue' : 'default'}>{map[t] || t}</Tag>;
    }},
    { title: '当前阶段', dataIndex: 'current_phase', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '健康度', dataIndex: 'health_score', render: (v: number) => <span style={{color: v<60?'red':'green'}}>{v}%</span> },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
        <Space>
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
            <Button type="link" icon={<FlagOutlined />} href={`/projects/${record.id}/milestones`}>里程碑</Button>
            <Button type="link" icon={<UnorderedListOutlined />} href={`/projects/${record.id}/functions`}>功能清单</Button>
        </Space>
    )}
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
              <Select 
                placeholder="所有状态" 
                style={{ width: 150 }} 
                allowClear
                onChange={val => setSearchParams({...searchParams, status: val})}
              >
                  <Option value="PLANNING">规划中</Option>
                  <Option value="IN_PROGRESS">进行中</Option>
                  <Option value="COMPLETED">已完成</Option>
                  <Option value="ON_HOLD">已暂停</Option>
              </Select>
              <Input 
                placeholder="项目名称搜索..." 
                style={{ width: 200 }} 
                prefix={<SearchOutlined />}
                onChange={e => setSearchParams({...searchParams, name_like: e.target.value})}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchProjects}>刷新</Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新建项目</Button>
      </div>
      
      <Table 
        className="sys-table"
        columns={columns} 
        dataSource={filteredProjects} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
      />

      <Modal
        title="新建项目"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        width={700}
      >
          <Form form={form} layout="vertical" initialValues={{ priority: 'MEDIUM', budget: 0, current_phase: PHASES[0] }}>
               <Row gutter={16}>
                   <Col span={24}>
                       <Form.Item name="name" label="项目名称" rules={[{required: true}]}><Input placeholder="请输入项目名称" /></Form.Item>
                   </Col>
                   <Col span={12}>
                       <Form.Item name="department" label="所属部门"><Input placeholder="请输入部门" /></Form.Item>
                   </Col>
                   <Col span={12}>
                       <Form.Item name="customer" label="客户"><Input placeholder="请输入客户名称" /></Form.Item>
                   </Col>
                   <Col span={12}>
                       <Form.Item name="current_phase" label="当前阶段">
                           <Select>
                               {PHASES.map(p => <Option key={p} value={p}>{p}</Option>)}
                           </Select>
                       </Form.Item>
                   </Col>
                   <Col span={12}>
                       <Form.Item name="priority" label="优先级">
                           <Select>
                               <Option value="HIGH">高</Option>
                               <Option value="MEDIUM">中</Option>
                               <Option value="LOW">低</Option>
                           </Select>
                       </Form.Item>
                   </Col>
                   <Col span={12}>
                       <Form.Item name="start_date" label="开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
                   </Col>
                   <Col span={12}>
                       <Form.Item name="end_date" label="结束日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
                   </Col>
                   <Col span={12}>
                       <Form.Item name="budget" label="预算">
                           <InputNumber 
                               style={{ width: '100%' }} 
                               formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                               parser={value => value?.replace(/\¥\s?|(,*)/g, '')} 
                           />
                       </Form.Item>
                   </Col>
                   <Col span={24}>
                       <Form.Item name="description" label="描述"><TextArea rows={3} placeholder="请输入项目描述" /></Form.Item>
                   </Col>
               </Row>
          </Form>
      </Modal>

      <ProjectDetail 
         project={currentProject}
         visible={detailVisible}
         onClose={() => setDetailVisible(false)}
         onUpdate={updateProject}
         onTransfer={transferManager}
         onAddMember={addMember}
         onRemoveMember={removeMember}
         loading={loading}
      />
    </div>
  );
};

export default ProjectList;
