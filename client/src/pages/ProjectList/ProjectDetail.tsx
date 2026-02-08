import React, { useEffect, useState } from 'react';
import { Drawer, Tabs, Descriptions, Table, Tag, Timeline, Button, Modal, Form, Select, message, Space, Card, Input, DatePicker, InputNumber, Row, Col } from 'antd';
import { PlusOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, ScheduleOutlined, FlagOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ProjectDetail as IProjectDetail } from '@/hooks/useProjects';
import dayjs from 'dayjs';
import { User } from '@/types/user';
import request from '@/api/request';
import { useUserStore } from '@/store/useUserStore';

const { TabPane } = Tabs;
const { Option } = Select;

const PHASES = [
  '进场前阶段',
  '启动阶段',
  '实施阶段',
  '初验阶段',
  '试运行阶段',
  '终验阶段',
  '运维阶段'
];

interface Props {
  project: IProjectDetail | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: any) => Promise<boolean>;
  onTransfer: (id: number, newManagerId: number) => Promise<boolean>;
  onAddMember: (id: number, userId: number) => Promise<boolean>;
  onRemoveMember: (id: number, userIds: number[]) => Promise<boolean>;
  loading?: boolean;
}

const ProjectDetail: React.FC<Props> = ({ project, visible, onClose, onUpdate, onTransfer, onAddMember, onRemoveMember, loading }) => {
  console.log('DEBUG ProjectDetail:', project);
  const [activeTab, setActiveTab] = useState('1');
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [selectedManager, setSelectedManager] = useState<number>();
  const [selectedMember, setSelectedMember] = useState<number>();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const currentUser = useUserStore(state => state.user);
  
  // Check if current user has edit permission
  const canEdit = React.useMemo(() => {
    if (!project || !currentUser) return false;
    // Check if system admin or super admin
    const isSystemAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SYS_ADMIN';
    // Check if project manager
    const isProjectManager = project.manager_id === currentUser.id;
    
    return isSystemAdmin || isProjectManager;
  }, [project, currentUser]);

  useEffect(() => {
    if (project && visible && isEditing) {
      form.setFieldsValue({
        ...project,
        start_date: project.start_date ? dayjs(project.start_date) : null,
        end_date: project.end_date ? dayjs(project.end_date) : null,
      });
    }
    
    // Fetch users for transfer if needed
    if (project && visible && activeTab === '3') {
      fetchUsers();
    }
  }, [project, visible, form, activeTab, isEditing]);

  const fetchUsers = async () => {
      try {
          const res = await request.get<User[]>('/users');
          setUsers(res.data);
      } catch (e) { console.error(e); }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
          ...values,
          start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
          end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };
      if (project) {
        const success = await onUpdate(project.id, payload);
        if (success) setIsEditing(false);
      }
    } catch (e) {
      // validation failed
    }
  };

  const handleTransfer = async () => {
      if (project && selectedManager) {
          const success = await onTransfer(project.id, selectedManager);
          if (success) setTransferModalVisible(false);
      }
  };

  const handleAddMember = async () => {
      if (project && selectedMember) {
          const success = await onAddMember(project.id, selectedMember);
          if (success) {
              setAddMemberModalVisible(false);
              setSelectedMember(undefined);
          }
      }
  };

  const handleRemoveMembers = () => {
    if (!project || selectedRowKeys.length === 0) return;

    Modal.confirm({
      title: '确认移除成员',
      icon: <ExclamationCircleOutlined />,
      content: `确定要移除选中的 ${selectedRowKeys.length} 位成员吗？`,
      onOk: async () => {
        const success = await onRemoveMember(project.id, selectedRowKeys as number[]);
        if (success) {
          setSelectedRowKeys([]);
        }
      }
    });
  };

  if (!project) return null;

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PLANNING': return '规划中';
      case 'IN_PROGRESS': return '进行中';
      case 'COMPLETED': return '已完成';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch(priority) {
      case 'HIGH': return '高';
      case 'MEDIUM': return '中';
      case 'LOW': return '低';
      default: return priority;
    }
  };

  const renderInfo = () => (
    <div>
       <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
           {isEditing ? (
               <Space>
                   <Button onClick={() => setIsEditing(false)}>取消</Button>
                   <Button type="primary" onClick={handleUpdate}>保存</Button>
               </Space>
           ) : (
               canEdit && <Button type="primary" onClick={() => setIsEditing(true)}>编辑信息</Button>
           )}
       </div>
       
       {isEditing ? (
           <Form form={form} layout="vertical">
               <Row gutter={16}>
                   <Col span={12}><Form.Item name="name" label="项目名称" rules={[{required:true}]}><Input /></Form.Item></Col>
                   <Col span={12}><Form.Item name="status" label="状态"><Select><Option value="PLANNING">规划中</Option><Option value="IN_PROGRESS">进行中</Option><Option value="COMPLETED">已完成</Option></Select></Form.Item></Col>
               </Row>
               <Row gutter={16}>
                   <Col span={12}><Form.Item name="department" label="所属部门"><Input /></Form.Item></Col>
                   <Col span={12}><Form.Item name="customer" label="客户名称"><Input /></Form.Item></Col>
               </Row>
               <Row gutter={16}>
                   <Col span={24}>
                       <Form.Item name="current_phase" label="当前阶段">
                           <Select>
                               {PHASES.map(p => <Option key={p} value={p}>{p}</Option>)}
                           </Select>
                       </Form.Item>
                   </Col>
               </Row>
               <Row gutter={16}>
                   <Col span={12}><Form.Item name="start_date" label="开始日期"><DatePicker style={{width:'100%'}} /></Form.Item></Col>
                   <Col span={12}><Form.Item name="end_date" label="结束日期"><DatePicker style={{width:'100%'}} /></Form.Item></Col>
               </Row>
               <Row gutter={16}>
                   <Col span={12}><Form.Item name="budget" label="预算"><InputNumber style={{width:'100%'}} /></Form.Item></Col>
                   <Col span={12}><Form.Item name="priority" label="优先级"><Select><Option value="HIGH">高</Option><Option value="MEDIUM">中</Option><Option value="LOW">低</Option></Select></Form.Item></Col>
               </Row>
               <Form.Item name="description" label="项目描述"><Input.TextArea rows={3} /></Form.Item>
           </Form>
       ) : (
           <Descriptions bordered column={2}>
              <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={project.status === 'COMPLETED' ? 'green' : 'blue'}>{getStatusLabel(project.status)}</Tag></Descriptions.Item>
              <Descriptions.Item label="当前阶段"><Tag color="blue">{project.current_phase || '进场前阶段'}</Tag></Descriptions.Item>
              <Descriptions.Item label="部门">{project.department}</Descriptions.Item>
              <Descriptions.Item label="客户">{project.customer}</Descriptions.Item>
              <Descriptions.Item label="负责人">{project.manager_name}</Descriptions.Item>
              <Descriptions.Item label="优先级"><Tag color={project.priority === 'HIGH' ? 'red' : 'orange'}>{getPriorityLabel(project.priority)}</Tag></Descriptions.Item>
              <Descriptions.Item label="周期">{project.start_date} ~ {project.end_date}</Descriptions.Item>
              <Descriptions.Item label="预算">¥{project.budget?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="描述">{project.description}</Descriptions.Item>
           </Descriptions>
       )}
    </div>
  );

  const renderSuppliers = () => (
      <Table 
         dataSource={project.suppliers}
         rowKey="id"
         columns={[
             { title: '供应商名称', dataIndex: 'name' },
             { title: '合作模块', dataIndex: 'module' },
             { title: '金额', dataIndex: 'amount', render: (val) => `¥${val}` },
             { title: '联系人', dataIndex: 'contact_person' },
             { title: '电话', dataIndex: 'phone' },
             { title: '状态', dataIndex: 'status', render: t => <Tag>{t}</Tag> }
         ]}
         pagination={false}
      />
  );

  const renderMembers = () => (
      <div>
          <div style={{ marginBottom: 16 }}>
              {canEdit && (
                <Space>
                  <Button type="primary" onClick={() => { fetchUsers(); setAddMemberModalVisible(true); }}>新增成员</Button>
                  <Button onClick={() => { fetchUsers(); setTransferModalVisible(true); }}>移交项目负责人</Button>
                  <Button danger disabled={selectedRowKeys.length === 0} onClick={handleRemoveMembers}>移除成员</Button>
                </Space>
              )}
          </div>
          <Table 
             dataSource={project.members}
             rowKey="user_id"
             rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
                getCheckboxProps: (record) => ({
                  disabled: record.role === 'PROJECT_MANAGER', // Disable selection for Project Manager
                }),
             }}
             columns={[
                 { title: '姓名', dataIndex: 'real_name' },
                 { title: '用户名', dataIndex: 'username' },
                 { title: '角色', dataIndex: 'role', render: (t) => {
                     let color = 'default';
                     if (t === 'PROJECT_MANAGER') color = 'gold';
                     return <Tag color={color}>{t === 'PROJECT_MANAGER' ? '项目负责人' : '成员'}</Tag>
                 }},
                 { title: '加入时间', dataIndex: 'joined_at', render: t => new Date(t).toLocaleDateString() }
             ]}
             pagination={false}
          />
          <Modal
             title="移交项目负责人"
             open={transferModalVisible}
             onOk={handleTransfer}
             onCancel={() => setTransferModalVisible(false)}
          >
              <p>请选择新的项目负责人，原负责人将降级为普通成员。</p>
              <Select 
                  style={{ width: '100%' }} 
                  placeholder="选择用户"
                  onChange={setSelectedManager}
              >
                  {users.map(u => (
                      <Option key={u.id} value={u.id}>{u.real_name} ({u.username})</Option>
                  ))}
              </Select>
          </Modal>
          <Modal
             title="新增项目成员"
             open={addMemberModalVisible}
             onOk={handleAddMember}
             onCancel={() => setAddMemberModalVisible(false)}
          >
              <p>请选择要加入项目的用户：</p>
              <Select 
                  style={{ width: '100%' }} 
                  placeholder="选择用户"
                  onChange={setSelectedMember}
                  value={selectedMember}
              >
                  {users
                    .filter(u => !project.members.some(m => m.user_id === u.id)) // Filter out existing members
                    .map(u => (
                      <Option key={u.id} value={u.id}>{u.real_name} ({u.username})</Option>
                  ))}
              </Select>
          </Modal>
      </div>
  );

  const renderHistory = () => (
      <Timeline 
        style={{ marginTop: 20 }}
        items={project.logs.map(log => ({
            key: log.id,
            children: (
                <>
                    <p>{log.action} - {log.details} <span style={{ color: '#999', fontSize: 12 }}>{new Date(log.created_at).toLocaleString()}</span></p>
                    <p>操作人: {log.username}</p>
                </>
            )
        }))}
      />
  );

  return (
    <Drawer
      title="项目详情"
      size="large"
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: '基础信息',
            children: renderInfo()
          },
          {
            key: '2',
            label: '供应商',
            children: renderSuppliers()
          },
          {
            key: '3',
            label: '项目成员',
            children: renderMembers()
          },
          {
            key: '4',
            label: '变更记录',
            children: renderHistory()
          }
        ]}
      />
    </Drawer>
  );
};

export default ProjectDetail;
