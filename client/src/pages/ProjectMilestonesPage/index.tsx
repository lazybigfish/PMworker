import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Steps, Button, Tag, Row, Col, Typography, Divider, Breadcrumb, Empty, Tooltip, Modal, Form, Select, DatePicker, Input, Upload, message, List } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, UploadOutlined, CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, StarFilled, ExclamationCircleOutlined, LeftOutlined, RightOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useProjects, Milestone } from '@/hooks/useProjects';
import { useLayoutStore } from '@/store/useLayoutStore';
import dayjs from 'dayjs';

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
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

const ProjectMilestonesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || '0');
  const { milestones, fetchMilestones, updateMilestone, fetchProjectDetails, currentProject, loading } = useProjects();
  const { setBreadcrumb } = useLayoutStore();
  
  const [currentPhase, setCurrentPhase] = useState<string>(PHASES[0]);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (projectId) {
      fetchMilestones(projectId);
      if (!currentProject || currentProject.id !== projectId) {
        fetchProjectDetails(projectId);
      }
    }
  }, [projectId]);

  // Set global breadcrumb
  useEffect(() => {
    setBreadcrumb([
      { title: '项目列表', path: '/projects' },
      { title: currentProject?.name || '加载中...', path: `/projects` }, // Linking back to list for now as detail might be different
      { title: '里程碑管理' }
    ]);
    return () => setBreadcrumb(null);
  }, [currentProject, setBreadcrumb]);

  // Sync currentPhase with project's current_phase
  useEffect(() => {
    if (currentProject?.current_phase) {
      if (PHASES.includes(currentProject.current_phase)) {
        setCurrentPhase(currentProject.current_phase);
      }
    }
  }, [currentProject]);

  // Group milestones by phase to calculate status
  const phaseStatusMap = useMemo(() => {
    const map: Record<string, 'wait' | 'process' | 'finish'> = {};
    PHASES.forEach(phase => {
      const ms = milestones.filter(m => m.phase === phase);
      if (ms.length === 0) {
        map[phase] = 'wait';
        return;
      }
      const allDone = ms.every(m => m.status === 'COMPLETED' || m.status === 'SKIPPED' || (!m.is_required && m.status === 'PENDING'));
      const anyProgress = ms.some(m => m.status === 'IN_PROGRESS');
      const anyDone = ms.some(m => m.status === 'COMPLETED');
      
      if (allDone) map[phase] = 'finish';
      else if (anyProgress || anyDone) map[phase] = 'process';
      else map[phase] = 'wait';
    });
    return map;
  }, [milestones]);

  const currentMilestones = useMemo(() => {
    return milestones.filter(m => m.phase === currentPhase).sort((a, b) => a.order_index - b.order_index);
  }, [milestones, currentPhase]);

  const handleStatusChange = async (m: Milestone, newStatus: string) => {
    const success = await updateMilestone(m.id, { status: newStatus as any });
    if (success) {
      // Optional: Auto advance logic could go here
    }
  };

  const handleEdit = (m: Milestone) => {
    setEditingMilestone(m);
    form.setFieldsValue({
      status: m.status,
      remarks: m.remarks,
      actual_start_date: m.actual_start_date ? dayjs(m.actual_start_date) : null,
      actual_end_date: m.actual_end_date ? dayjs(m.actual_end_date) : null,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, {
          ...values,
          actual_start_date: values.actual_start_date ? values.actual_start_date.format('YYYY-MM-DD') : null,
          actual_end_date: values.actual_end_date ? values.actual_end_date.format('YYYY-MM-DD') : null,
        });
        setIsModalVisible(false);
        setEditingMilestone(null);
      }
    } catch (e) {
      // ignore
    }
  };

  const handlePrevPhase = () => {
    const currentIndex = PHASES.indexOf(currentPhase);
    if (currentIndex > 0) {
      setCurrentPhase(PHASES[currentIndex - 1]);
    }
  };

  const handleNextPhase = () => {
    const currentIndex = PHASES.indexOf(currentPhase);
    if (currentIndex < PHASES.length - 1) {
      setCurrentPhase(PHASES[currentIndex + 1]);
    }
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING': return <Tag icon={<ClockCircleOutlined />} color="default">未开始</Tag>;
      case 'IN_PROGRESS': return <Tag icon={<SyncOutlined spin />} color="processing">进行中</Tag>;
      case 'PAUSED': return <Tag icon={<PauseCircleOutlined />} color="warning">已暂停</Tag>;
      case 'COMPLETED': return <Tag icon={<CheckCircleOutlined />} color="success">已完成</Tag>;
      case 'SKIPPED': return <Tag color="warning">已跳过</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} style={{ marginRight: 16 }} />
        <Title level={2} style={{ margin: 0 }}>项目里程碑全生命周期管理</Title>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
           <Button 
             type="text" 
             icon={<LeftOutlined />} 
             onClick={handlePrevPhase} 
             disabled={PHASES.indexOf(currentPhase) === 0}
           />
           <Title level={3} style={{ margin: 0 }}>当前阶段：{currentPhase}</Title>
           <Button 
             type="text" 
             icon={<RightOutlined />} 
             onClick={handleNextPhase} 
             disabled={PHASES.indexOf(currentPhase) === PHASES.length - 1}
           />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {currentMilestones.map(m => (
          <Col xs={24} sm={24} md={12} lg={8} xl={6} key={m.id}>
            <Card 
              hoverable
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>{m.name}</Text>
                  {m.importance >= 5 && <Tooltip title="核心关键任务"><StarFilled style={{ color: '#faad14' }} /></Tooltip>}
                </div>
              }
              extra={renderStatusTag(m.status)}
              actions={[
                <Tooltip title={m.status === 'IN_PROGRESS' ? "暂停" : "标记为进行中"} key="process">
                  <Button 
                    type="text" 
                    icon={m.status === 'IN_PROGRESS' ? <PauseCircleOutlined /> : <SyncOutlined />} 
                    disabled={m.status === 'COMPLETED'} 
                    onClick={() => handleStatusChange(m, m.status === 'IN_PROGRESS' ? 'PAUSED' : 'IN_PROGRESS')} 
                  />
                </Tooltip>,
                <Tooltip title="标记为完成" key="done">
                  <Button type="text" icon={<CheckCircleOutlined />} disabled={m.status === 'COMPLETED'} onClick={() => handleStatusChange(m, 'COMPLETED')} />
                </Tooltip>,
                <Tooltip title="编辑详情" key="edit">
                  <Button type="text" onClick={() => handleEdit(m)}>详情</Button>
                </Tooltip>
              ]}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1 }}
            >
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">{m.description}</Text>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: 12 }}><UploadOutlined /> 输出成果:</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 8 }}>
                  {m.output_docs ? m.output_docs.split(',').map(d => (
                    <Tag color="blue" key={d}>{d}</Tag>
                  )) : <Text type="secondary" style={{ fontSize: 12 }}>无</Text>}
                </div>
              </div>

              {m.remarks && (
                <div style={{ marginTop: 12, background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>备注: {m.remarks}</Text>
                </div>
              )}
            </Card>
          </Col>
        ))}
        {currentMilestones.length === 0 && (
          <Col span={24}>
            <Empty description="该阶段暂无任务" />
          </Col>
        )}
      </Row>

      <Modal
        title={`更新里程碑任务: ${editingMilestone?.name}`}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="当前状态">
            <Select>
              <Option value="PENDING">未开始</Option>
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="PAUSED">已暂停</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="SKIPPED">已跳过</Option>
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
             <Col span={12}>
                <Form.Item name="actual_start_date" label="实际开始">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
             </Col>
             <Col span={12}>
                <Form.Item name="actual_end_date" label="实际完成">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
             </Col>
          </Row>

          <Form.Item name="remarks" label="执行备注">
            <TextArea rows={4} placeholder="记录执行过程中的关键信息..." />
          </Form.Item>

          <Divider orientation="left">成果文件管理</Divider>
          <div style={{ marginBottom: 16 }}>
             <Text type="secondary">需交付: {editingMilestone?.output_docs || '无'}</Text>
          </div>
          <Upload>
             <Button icon={<UploadOutlined />}>上传成果文件 (模拟)</Button>
          </Upload>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectMilestonesPage;
