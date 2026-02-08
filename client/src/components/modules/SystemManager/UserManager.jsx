import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Input, Space, Tag, Modal, Form, Select, 
  message, Dropdown, Menu, Drawer, Timeline, Badge
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, DeleteOutlined, 
  ReloadOutlined, DownOutlined, UserOutlined, 
  ImportOutlined, ExportOutlined, EditOutlined, 
  StopOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import PageLayout from '../../common/PageLayout';

const { Option } = Select;

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]); // Available roles
  const [departments, setDepartments] = useState([]); // Available departments
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  
  // Search State
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/roles');
      setRoles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/system_configs');
      const deptConfig = res.data.find(c => c.key === 'DEPARTMENT_LIST');
      if (deptConfig && deptConfig.value) {
        setDepartments(deptConfig.value.split(/[,，]/)); // Split by comma (en or cn)
      } else {
        setDepartments(['IT部', '研发部', '人事部', '市场部', '运营部']); // Fallback
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchAction = async (action) => {
    if (selectedRowKeys.length === 0) return message.warning('请至少选择一项');
    
    let confirmTitle = '确认操作';
    let confirmContent = `确定要对选中的 ${selectedRowKeys.length} 个用户执行此操作吗？`;

    if (action === 'RESET_PWD') {
      confirmTitle = '确认重置密码';
      confirmContent = `确定要将选中的 ${selectedRowKeys.length} 个用户的密码重置为系统默认密码（123456）吗？`;
    }

    Modal.confirm({
      title: confirmTitle,
      content: confirmContent,
      onOk: async () => {
        try {
          await axios.post('/api/users/batch', {
            userIds: selectedRowKeys,
            action: action
          });
          message.success('操作成功');
          fetchUsers();
          setSelectedRowKeys([]);
        } catch (err) {
          message.error('操作失败');
        }
      }
    });
  };

  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();
      
      // Separate roleId from user data
      const { roleId, password, ...userData } = values;
      const roleIds = roleId ? [roleId] : [];

      // Add password if it exists (only for create)
      if (password) {
        userData.password = password;
      }
      
      // Add default password_hash if no password provided (handled by backend usually, but let's be safe)
      // Actually backend handles it.

      let userId = currentUser?.id;
      if (currentUser) {
        await axios.put(`/api/users/${currentUser.id}`, userData);
      } else {
        // Create user
        const res = await axios.post('/api/users', userData);
        userId = res.data.id;
      }

      // Handle Roles Assignment
      if (roleIds && roleIds.length > 0) {
        await axios.post(`/api/users/${userId}/roles`, { roleIds });
      }

      message.success('保存成功');
      setShowDrawer(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      message.error('保存失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditClick = async (record) => {
    setCurrentUser(record);
    // Fetch user current roles
    try {
      const res = await axios.get(`/api/users/${record.id}/roles`);
      const userRoleIds = res.data.map(r => r.id);
      // Take the first role as we are now single-select
      form.setFieldsValue({
        ...record,
        roleId: userRoleIds.length > 0 ? userRoleIds[0] : undefined
      });
      setShowDrawer(true);
    } catch (err) {
      message.error('加载用户详情失败');
    }
  };

  const handleDisableUser = async (record) => {
      try {
          await axios.post('/api/users/batch', {
              userIds: [record.id],
              action: 'DISABLE'
          });
          message.success('用户已禁用');
          fetchUsers();
      } catch (err) {
          message.error('操作失败');
      }
  };

  const handleDeleteUser = async (record) => {
      Modal.confirm({
          title: '确认删除',
          content: `确定要删除用户 ${record.real_name} 吗？此操作不可恢复。`,
          okType: 'danger',
          onOk: async () => {
              try {
                  await axios.delete(`/api/users/${record.id}`);
                  message.success('用户已删除');
                  fetchUsers();
              } catch (err) {
                  message.error('删除失败');
              }
          }
      });
  };

  const handleAddClick = () => {
    setCurrentUser(null);
    form.resetFields();
    // Default status ACTIVE, source LOCAL
    // Default role: find '普通用户' or code 'USER'
    const defaultRole = roles.find(r => r.name === '普通用户' || r.code === 'USER');
    form.setFieldsValue({ 
      status: 'ACTIVE', 
      roleId: defaultRole?.id 
    });
    setShowDrawer(true);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(users);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "用户列表.xlsx");
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 200,
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <a onClick={() => handleEditClick(record)}>{text}</a>
        </Space>
      )
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 150,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 'var(--sys-col-status)',
      render: (status) => (
        <Badge status={status === 'ACTIVE' ? 'success' : 'error'} text={status === 'ACTIVE' ? '启用' : '禁用'} />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditClick(record)}>编辑</Button>
        </Space>
      ),
    },
  ];

  const actions = (
    <Space>
      <Input 
        placeholder="输入用户名/姓名/手机号搜索" 
        prefix={<SearchOutlined />} 
        style={{ width: 250 }} 
        onChange={e => setSearchText(e.target.value)}
      />
      <Button type="primary" icon={<SearchOutlined />}>查询</Button>
      <Button icon={<ReloadOutlined />} onClick={fetchUsers}>重置</Button>
      <Button icon={<ImportOutlined />}>导入</Button>
      <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
      <Dropdown overlay={
        <Menu>
          <Menu.Item key="1" icon={<CheckCircleOutlined />} onClick={() => handleBatchAction('ENABLE')}>批量启用</Menu.Item>
          <Menu.Item key="2" icon={<StopOutlined />} onClick={() => handleBatchAction('DISABLE')}>批量禁用</Menu.Item>
          <Menu.Item key="3" icon={<ReloadOutlined />} onClick={() => handleBatchAction('RESET_PWD')}>重置密码</Menu.Item>
          <Menu.Divider />
          <Menu.Item key="4" icon={<DeleteOutlined />} danger onClick={() => handleBatchAction('DELETE')}>批量删除</Menu.Item>
        </Menu>
      }>
        <Button>
          批量操作 <DownOutlined />
        </Button>
      </Dropdown>
    </Space>
  );

  return (
    <PageLayout title="用户管理" actions={actions} noCard>
      <div className="sys-module-card" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none' }}>
        <div className="sys-module-content">
          <div style={{ marginBottom: 16 }}>
             <Space>
               <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>新增用户</Button>
               <Button danger disabled={selectedRowKeys.length === 0} onClick={() => handleBatchAction('DISABLE')}>禁用</Button>
               <Button danger disabled={selectedRowKeys.length === 0} onClick={() => handleBatchAction('DELETE')}>删除</Button>
               <Button disabled={selectedRowKeys.length === 0} onClick={() => handleBatchAction('RESET_PWD')}>密码初始化</Button>
             </Space>
          </div>
          <Table 
        className="sys-table"
        rowSelection={{
          type: 'checkbox',
          onChange: (keys) => setSelectedRowKeys(keys)
        }}
        columns={columns} 
        dataSource={users} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        scroll={{ y: 'calc(100vh - 280px)' }}
      />

        </div>
      </div>

      {/* User Detail Drawer */}
      <Drawer
        title={currentUser ? "用户详情" : "新增用户"}
        size="large"
        onClose={() => setShowDrawer(false)}
        open={showDrawer}
        styles={{ body: { paddingBottom: 80 } }}
      >
        <Form layout="vertical" form={form} initialValues={{ status: 'ACTIVE' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
              <Input placeholder="请输入账号" disabled={!!currentUser} />
            </Form.Item>
            <Form.Item name="real_name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
            {!currentUser && (
                <Form.Item name="password" label="密码" tooltip="不填则使用系统默认密码">
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
            )}
            <Form.Item name="department" label="部门">
              <Select placeholder="请选择部门">
                {departments.map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select>
                <Option value="ACTIVE">启用</Option>
                <Option value="DISABLED">禁用</Option>
              </Select>
            </Form.Item>
            <Form.Item name="roleId" label="关联角色" rules={[{ required: true, message: '请选择角色' }]}>
              <Select placeholder="请选择角色" style={{ width: '100%' }}>
                {roles.map(r => (
                  <Option key={r.id} value={r.id}>{r.name} ({r.code})</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          
          {/* Operation Log - Only visible when editing */}
          {currentUser && (
            <div style={{ marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <h4 style={{ marginBottom: '16px' }}>操作日志</h4>
              <Timeline
                items={[
                    { color: 'green', children: `创建账号 ${currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : '刚刚'}` },
                    { color: 'blue', children: `最近登录 ${currentUser?.last_login_at || '暂无记录'}` }
                ]}
              />
            </div>
          )}
        </Form>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Button onClick={() => setShowDrawer(false)} style={{ marginRight: 8 }}>取消</Button>
          <Button type="primary" onClick={handleSaveUser}>保存</Button>
        </div>
      </Drawer>
    </PageLayout>
  );
}
