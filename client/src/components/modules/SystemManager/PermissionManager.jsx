import React, { useState, useEffect } from 'react';
import { 
  Tree, Table, Button, Space, Row, Col, 
  Tag, message, Input, Checkbox, Card 
} from 'antd';
import { 
  PlusOutlined, SaveOutlined, ReloadOutlined, 
  SafetyCertificateOutlined, CopyOutlined, DeleteOutlined, SearchOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import PageLayout from '../../common/PageLayout';

export default function PermissionManager() {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]); // Tree data
  const [allPermissionKeys, setAllPermissionKeys] = useState([]); // Flat keys for select all
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleSearchText, setRoleSearchText] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchPermissionTree();
  }, []);

  useEffect(() => {
    if (!roleSearchText) {
      setFilteredRoles(roles);
    } else {
      setFilteredRoles(roles.filter(r => 
        r.name.includes(roleSearchText) || 
        r.code.includes(roleSearchText)
      ));
    }
  }, [roleSearchText, roles]);

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/roles');
      setRoles(res.data);
    } catch (err) {
      message.error('加载角色失败');
    }
  };

  const fetchPermissionTree = async () => {
    try {
      const res = await axios.get('/api/permissions/tree');
      setPermissions(res.data);
      // Extract all keys
      const keys = [];
      const traverse = (nodes) => {
        nodes.forEach(node => {
          keys.push(node.key);
          if (node.children) traverse(node.children);
        });
      };
      traverse(res.data);
      setAllPermissionKeys(keys);
    } catch (err) {
      message.error('加载权限树失败');
    }
  };

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    try {
      const res = await axios.get(`/api/roles/${role.id}/permissions`);
      setCheckedKeys(res.data); // Should be array of codes
    } catch (err) {
      message.error('加载角色权限失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      // checkedKeys contains the permission codes
      await axios.post(`/api/roles/${selectedRole.id}/permissions`, {
        permissionCodes: checkedKeys
      });
      message.success('权限配置已保存');
    } catch (err) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setCheckedKeys(allPermissionKeys);
    } else {
      setCheckedKeys([]);
    }
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '标识', dataIndex: 'code', key: 'code', render: t => <Tag color="blue">{t}</Tag> },
    { 
      title: '操作', 
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<CopyOutlined />}>复制</Button>
          {!record.is_system && <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>}
        </Space>
      )
    }
  ];

  const actions = (
    <Space>
      <Button icon={<ReloadOutlined />} onClick={() => handleRoleSelect(selectedRole)} disabled={!selectedRole}>刷新</Button>
      <Button type="primary" icon={<SaveOutlined />} onClick={handleSavePermissions} loading={loading} disabled={!selectedRole}>保存配置</Button>
    </Space>
  );

  return (
    <PageLayout title="角色管理" actions={actions} noCard>
      <div className="sys-module-card" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none' }}>
        <div className="sys-module-content">
          <Row gutter={[24, 24]} style={{ height: '100%' }}>
        {/* Left: Role List */}
        <Col xs={24} md={10} lg={8} style={{ borderRight: '1px solid #f0f0f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <span style={{ fontSize: 16, fontWeight: 'bold' }}>角色列表</span>
               <Button type="primary" icon={<PlusOutlined />} size="small">新增角色</Button>
             </div>
             <Input 
               placeholder="搜索角色名称/标识" 
               prefix={<SearchOutlined />} 
               value={roleSearchText}
               onChange={e => setRoleSearchText(e.target.value)}
             />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Table 
              className="sys-table"
              columns={columns} 
              dataSource={filteredRoles} 
              rowKey="id" 
              pagination={{ pageSize: 10, size: 'small' }} 
              size="small"
              onRow={(record) => ({
                onClick: () => handleRoleSelect(record),
                style: { cursor: 'pointer', background: selectedRole?.id === record.id ? '#e6f7ff' : 'transparent' }
              })}
            />
          </div>
        </Col>

        {/* Right: Permission Matrix */}
        <Col xs={24} md={14} lg={16} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <Space>
                <SafetyCertificateOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <span style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {selectedRole ? `${selectedRole.name} - 权限配置` : '请选择角色'}
                </span>
                {selectedRole?.is_system && <Tag color="red">系统内置</Tag>}
              </Space>
            </div>
            {selectedRole && (
               <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Checkbox 
                    onChange={handleSelectAll} 
                    checked={allPermissionKeys.length > 0 && checkedKeys.length === allPermissionKeys.length}
                    indeterminate={checkedKeys.length > 0 && checkedKeys.length < allPermissionKeys.length}
                  >
                    全选 / 取消全选
                  </Checkbox>
                  <span style={{ color: '#999', fontSize: 12 }}>已选 {checkedKeys.length} 项权限</span>
               </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {permissions.length > 0 ? (
                <Tree
                  checkable
                  defaultExpandAll
                  checkedKeys={checkedKeys}
                  onCheck={(keys) => setCheckedKeys(keys)}
                  treeData={permissions}
                  disabled={!selectedRole}
                  height={500} // Virtual scroll for large trees
                />
            ) : (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>加载权限数据中...</div>
            )}
          </div>
        </Col>
      </Row>
        </div>
      </div>
    </PageLayout>
  );
}
