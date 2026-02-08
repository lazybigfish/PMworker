import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Drawer, Progress, Timeline, Card, Row, Col, TreeSelect, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, PlayCircleOutlined, CheckCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/api/request';
import { useTasks, Task } from '@/hooks/useTasks';

const { Option } = Select;
const { TextArea } = Input;

const statusMap: Record<string, { text: string, color: string }> = {
  'PENDING': { text: '待开始', color: 'default' },
  'IN_PROGRESS': { text: '进行中', color: 'processing' },
  'PAUSED': { text: '已暂停', color: 'warning' },
  'COMPLETED': { text: '已完成', color: 'success' },
  'CANCELLED': { text: '已取消', color: 'error' }
};

const priorityMap: Record<string, { text: string, color: string }> = {
  'HIGH': { text: '高', color: 'red' },
  'MEDIUM': { text: '中', color: 'orange' },
  'LOW': { text: '低', color: 'green' }
};

const TaskManager: React.FC = () => {
  const { tasks, projects, loading, selectedTask, setSelectedTask, logs, fetchTasks, fetchProjects, fetchTaskDetails, createTask, updateStatus, addLog } = useTasks();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [searchParams, setSearchParams] = useState<any>({});
  
  const [form] = Form.useForm();
  const [logForm] = Form.useForm();
  
  const [functions, setFunctions] = useState<any[]>([]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusAction, setStatusAction] = useState<{type: string, taskId: number} | null>(null);
  const [statusForm] = Form.useForm();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  const fetchProjectFunctions = async (projectId: number) => {
    if (!projectId) {
        setFunctions([]);
        return;
    }
    try {
        const res = await request.get(`/projects/${projectId}/functions`);
        setFunctions(res.data);
    } catch (err) {
        console.error("Failed to fetch functions", err);
        setFunctions([]);
    }
  };

  const functionTreeData = useMemo(() => {
    if (!functions || functions.length === 0) return [];
    const sorted = [...functions].sort((a: any, b: any) => a.order_index - b.order_index);
    const map: any = {};
    const roots: any[] = [];
    
    sorted.forEach((node: any) => {
        map[node.id] = {
            title: node.name,
            value: node.id,
            key: node.id,
            children: []
        };
    });
    
    sorted.forEach((node: any) => {
        if (node.parent_id && map[node.parent_id]) {
            map[node.parent_id].children.push(map[node.id]);
        } else {
            roots.push(map[node.id]);
        }
    });
    return roots;
  }, [functions]);

  const handleCreate = async () => {
    try {
        const values = await form.validateFields();
        // Assuming hook just posts whatever values we give or we use request directly
        const payload = {
            ...values,
            start_date: values.start_date?.format('YYYY-MM-DD'),
            end_date: values.end_date?.format('YYYY-MM-DD'),
        };
        
        await request.post('/tasks', payload);
        message.success('创建成功');
        
        setShowCreateModal(false);
        fetchTasks();
        form.resetFields();
    } catch (e) {
        console.error(e);
    }
  };
  
  // Status Actions
    const handleStatusAction = (record: any, type: string) => {
        setStatusAction({ type, taskId: record.id });
        statusForm.resetFields();
        
        if (type === 'IN_PROGRESS') {
            doUpdateStatus(record.id, 'IN_PROGRESS');
        } else {
            setStatusModalVisible(true);
        }
    };
    
    const doUpdateStatus = async (taskId: number, status: string, reason?: string) => {
        try {
            await request.post(`/tasks/${taskId}/status`, { status, reason });
            message.success('状态更新成功');
            setStatusModalVisible(false);
            fetchTasks();
            if (selectedTask && selectedTask.id === taskId) {
                fetchTaskDetails(taskId);
            }
        } catch (err: any) {
            message.error(err.response?.data?.error || '状态更新失败');
        }
    };

  const handleViewDetail = (task: Task) => {
    setSelectedTask(task);
    fetchTaskDetails(task.id);
    setShowDetailDrawer(true);
  };

  useEffect(() => {
    if (showDetailDrawer && selectedTask) {
        logForm.setFieldsValue({ content: '', progress: selectedTask.progress || 0 });
    }
  }, [showDetailDrawer, selectedTask, logForm]);

  const handleAddLogSubmit = async (values: any) => {
    if (!selectedTask) return;
    
    // Rule 3: Confirmation for 100% progress
    if (values.progress === 100 && selectedTask.status !== 'COMPLETED') {
        Modal.confirm({
            title: '确认完成',
            content: '设为 100% 将自动标记任务为已完成，是否继续？',
            onOk: async () => {
                await submitLog(values);
            }
        });
    } else {
        await submitLog(values);
    }
  };

  const submitLog = async (values: any) => {
      if (!selectedTask) return;
      const success = await addLog(selectedTask.id, values);
      if (success) {
        logForm.resetFields(['content']);
        // Refresh details to reflect status change if any
        if (values.progress === 100) {
            fetchTaskDetails(selectedTask.id);
            fetchTasks();
        }
      }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '所属项目',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string) => text || '-'
    },
    { 
        title: '功能模块', 
        dataIndex: 'function_name', 
        key: 'function_name', 
        render: (text: string) => text || '-' 
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Task) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.description}</div>
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (text: string) => <Tag color={priorityMap[text]?.color}>{priorityMap[text]?.text || text}</Tag>
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (val: number) => <Progress percent={val} size="small" />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (text: string) => <Tag color={statusMap[text]?.color}>{statusMap[text]?.text || text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Task) => (
        <Space>
            {/* Status Buttons */}
            {record.status === 'PENDING' && (
                <Tooltip title="启动任务">
                    <Button type="text" size="small" icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />} onClick={() => handleStatusAction(record, 'IN_PROGRESS')} />
                </Tooltip>
            )}
            {record.status === 'IN_PROGRESS' && (
                <>
                    <Tooltip title="暂停任务">
                        <Button type="text" size="small" icon={<PauseCircleOutlined style={{ color: '#faad14' }} />} onClick={() => handleStatusAction(record, 'PAUSED')} />
                    </Tooltip>
                    <Tooltip title="完成任务">
                        <Button type="text" size="small" icon={<CheckCircleOutlined style={{ color: '#1890ff' }} />} onClick={() => handleStatusAction(record, 'COMPLETED')} />
                    </Tooltip>
                </>
            )}
            {record.status === 'PAUSED' && (
                    <Tooltip title="恢复任务">
                    <Button type="text" size="small" icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />} onClick={() => handleStatusAction(record, 'IN_PROGRESS')} />
                </Tooltip>
            )}
                {(record.status === 'PENDING' || record.status === 'IN_PROGRESS' || record.status === 'PAUSED') && (
                <Tooltip title="取消任务">
                    <Button type="text" size="small" icon={<StopOutlined style={{ color: '#ff4d4f' }} />} onClick={() => handleStatusAction(record, 'CANCELLED')} />
                </Tooltip>
            )}
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>详情</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Select 
            placeholder="所有项目" 
            style={{ width: 200 }}
            allowClear
            onChange={val => setSearchParams({...searchParams, project_id: val})}
          >
             {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
          </Select>
          <Select 
            placeholder="所有状态" 
            style={{ width: 150 }}
            allowClear
            onChange={val => setSearchParams({...searchParams, status: val})}
          >
             {Object.keys(statusMap).map(k => <Option key={k} value={k}>{statusMap[k].text}</Option>)}
          </Select>
          <Input 
            placeholder="任务名称搜索..." 
            style={{ width: 200 }}
            onChange={e => setSearchParams({...searchParams, name_like: e.target.value})}
            prefix={<SearchOutlined />}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchTasks(searchParams)}>查询</Button>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>新建任务</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={tasks} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
      />

      <Modal
        title="新建任务"
        open={showCreateModal}
        onOk={handleCreate}
        onCancel={() => setShowCreateModal(false)}
        width={700}
      >
        <Form form={form} layout="vertical" initialValues={{ priority: 'MEDIUM', type: 'TASK', status: 'PENDING', duration: 1, start_date: dayjs() }}>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true }]}>
             <Select 
                placeholder="请选择项目" 
                showSearch 
                optionFilterProp="children"
                onChange={(val) => {
                    fetchProjectFunctions(val);
                    form.setFieldsValue({ function_id: undefined, predecessors: [] });
                }}
            >
                {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
             </Select>
          </Form.Item>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="function_id" label="关联功能模块">
                <TreeSelect
                    style={{ width: '100%' }}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    treeData={functionTreeData}
                    placeholder="请选择功能模块"
                    allowClear
                    treeDefaultExpandAll
                />
            </Form.Item>
          </div>
          
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
             <Col span={12}>
               <Form.Item name="start_date" label="计划开始时间">
                 <DatePicker style={{ width: '100%' }} />
               </Form.Item>
             </Col>
             <Col span={12}>
               <Form.Item name="duration" label="工期 (天)">
                 <InputNumber min={1} style={{ width: '100%' }} />
               </Form.Item>
             </Col>
          </Row>
          <Row gutter={16}>
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
               <Form.Item name="type" label="类型">
                 <Select>
                    <Option value="TASK">普通任务</Option>
                    <Option value="MILESTONE">里程碑</Option>
                    <Option value="ISSUE">问题</Option>
                 </Select>
               </Form.Item>
             </Col>
          </Row>

          <Form.Item name="predecessors" label="前置任务关联 (依赖)">
            <Select 
                mode="multiple" 
                placeholder="选择前置任务 (必须先完成这些任务)"
                optionFilterProp="children"
            >
                {tasks
                    .filter(t => form.getFieldValue('project_id') === t.project_id)
                    .map(t => (
                        <Option key={t.id} value={t.id}>{t.name} ({statusMap[t.status]?.text || t.status})</Option>
                    ))
                }
            </Select>
          </Form.Item>

        </Form>
      </Modal>

      <Drawer
        title={selectedTask ? `任务详情: ${selectedTask.name}` : '任务详情'}
        onClose={() => setShowDetailDrawer(false)}
        open={showDetailDrawer}
        size="large"
      >
        {selectedTask && (
          <>
            <div style={{ marginBottom: 24 }}>
               <Space style={{ marginBottom: 16 }}>
                 {/* Status buttons in drawer too */}
                 {selectedTask.status === 'PENDING' && (
                    <Button type="primary" onClick={() => handleStatusAction(selectedTask, 'IN_PROGRESS')}>启动任务</Button>
                 )}
                 {selectedTask.status === 'IN_PROGRESS' && (
                    <>
                      <Button onClick={() => handleStatusAction(selectedTask, 'PAUSED')}>暂停</Button>
                      <Button type="primary" onClick={() => handleStatusAction(selectedTask, 'COMPLETED')}>完成</Button>
                    </>
                 )}
                 {selectedTask.status === 'PAUSED' && (
                    <Button type="primary" onClick={() => handleStatusAction(selectedTask, 'IN_PROGRESS')}>恢复</Button>
                 )}
                 {(selectedTask.status === 'PENDING' || selectedTask.status === 'IN_PROGRESS' || selectedTask.status === 'PAUSED') && (
                     <Button danger onClick={() => handleStatusAction(selectedTask, 'CANCELLED')}>终止</Button>
                 )}
                 {selectedTask.status === 'COMPLETED' && (
                     <Tooltip title="已完成任务不可编辑">
                        <Tag color="success">任务已归档</Tag>
                     </Tooltip>
                 )}
               </Space>

               <Card size="small" title="基本信息">
                  <p><strong>描述:</strong> {selectedTask.description || '无'}</p>
                  <p><strong>功能模块:</strong> {selectedTask.function_name || '无'}</p>
                  <p><strong>状态:</strong> <Tag color={statusMap[selectedTask.status]?.color}>{statusMap[selectedTask.status]?.text}</Tag></p>
                  <p><strong>优先级:</strong> <Tag color={priorityMap[selectedTask.priority]?.color}>{priorityMap[selectedTask.priority]?.text}</Tag></p>
                  <p><strong>进度:</strong> <Progress percent={selectedTask.progress} size="small" style={{ width: 200 }} /></p>
                  <p><strong>计划时间:</strong> {selectedTask.start_date} ({selectedTask.duration}天)</p>
                  <p><strong>依赖前置任务:</strong> {selectedTask.predecessors?.length > 0 ? tasks.filter(t => selectedTask.predecessors.includes(t.id)).map(t => t.name).join(', ') : '无'}</p>
               </Card>
            </div>

            <Card size="small" title="执行情况" style={{ marginBottom: 24 }}>
               {selectedTask.status === 'COMPLETED' ? (
                   <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
                       <CheckCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                       <p>已完成任务禁止编辑</p>
                   </div>
               ) : (
                   <Form form={logForm} layout="vertical" onFinish={handleAddLogSubmit}>
                      <Form.Item name="content" label="执行描述" rules={[{ required: true }]}>
                         <TextArea rows={2} />
                      </Form.Item>
                      <Form.Item name="progress" label="更新进度 (%)">
                         <InputNumber min={0} max={100} style={{ width: '100%' }} />
                      </Form.Item>
                      <Button type="primary" htmlType="submit">提交记录</Button>
                   </Form>
               )}
            </Card>

            <Card size="small" title="执行历史">
               <Timeline
                  items={logs.map(log => ({
                      key: log.id,
                      children: (
                        <>
                            <p>{log.content} <span style={{ fontSize: 12, color: '#999' }}>{new Date(log.created_at).toLocaleString()}</span></p>
                            {log.progress !== null && <Tag color="blue">进度: {log.progress}%</Tag>}
                        </>
                      )
                  }))}
               />
            </Card>
          </>
        )}
      </Drawer>
      
      {/* Status Action Modal */}
        <Modal
            title={
                statusAction?.type === 'PAUSED' ? '暂停任务' : 
                statusAction?.type === 'CANCELLED' ? '取消任务' : 
                statusAction?.type === 'COMPLETED' ? '完成任务' : '更新状态'
            }
            open={statusModalVisible}
            onOk={async () => {
                const values = await statusForm.validateFields();
                if (statusAction) {
                    doUpdateStatus(statusAction.taskId, statusAction.type, values.reason);
                }
            }}
            onCancel={() => setStatusModalVisible(false)}
        >
            <Form form={statusForm} layout="vertical">
                <Form.Item 
                    name="reason" 
                    label={
                        statusAction?.type === 'PAUSED' ? '暂停原因' : 
                        statusAction?.type === 'CANCELLED' ? '取消原因' : 
                        '备注说明'
                    }
                    rules={[{ required: statusAction?.type === 'PAUSED' || statusAction?.type === 'CANCELLED', message: '请填写原因' }]}
                >
                    <TextArea rows={4} placeholder="请输入..." />
                </Form.Item>
            </Form>
        </Modal>
    </div>
  );
};

export default TaskManager;