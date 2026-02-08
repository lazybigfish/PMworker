import React, { useState, useEffect, useMemo } from 'react';
import request from '@/api/request';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, TreeSelect, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

export default function SupplierManager() {
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [functions, setFunctions] = useState([]); // Function list for dropdown
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({});
  const [statusOptions, setStatusOptions] = useState([]); // { label, value, color }
  
  const [showModal, setShowModal] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
    fetchSuppliers();
    fetchStatusConfig();
  }, []);

  const fetchStatusConfig = async () => {
      try {
          const res = await request.get('/system_configs');
          const config = res.data.find(c => c.key === 'SUPPLIER_STATUS_LIST');
          if (config && config.value) {
              // Parse: comma separated. If item contains ':', split to value:label. Else value=label.
              const options = config.value.split(/[,，]/).map(item => {
                  let value, label;
                  if (item.includes(':') || item.includes('：')) {
                      [value, label] = item.split(/[:：]/);
                  } else {
                      value = item;
                      label = item;
                  }
                  
                  // Smart Color Assignment
                  let color = 'default';
                  const lowerVal = value.toLowerCase();
                  const lowerLbl = label.toLowerCase();
                  
                  if (['active', '合作中', '启用', '正常'].some(k => lowerVal.includes(k) || lowerLbl.includes(k))) {
                      color = 'success';
                  } else if (['construction', '建设', '进行', '开发'].some(k => lowerVal.includes(k) || lowerLbl.includes(k))) {
                      color = 'processing';
                  } else if (['finished', '结束', '完成', '关闭'].some(k => lowerVal.includes(k) || lowerLbl.includes(k))) {
                      color = 'default';
                  } else if (['stop', '暂停', '中止'].some(k => lowerVal.includes(k) || lowerLbl.includes(k))) {
                      color = 'warning';
                  } else if (['error', '异常', '违约'].some(k => lowerVal.includes(k) || lowerLbl.includes(k))) {
                      color = 'error';
                  }
                  
                  return { label, value, color };
              });
              setStatusOptions(options);
          } else {
              // Fallback
              setStatusOptions([
                  { label: '建设中', value: 'PROJECT_CONSTRUCTION', color: 'processing' },
                  { label: '合作中', value: 'ACTIVE', color: 'success' },
                  { label: '已结束', value: 'FINISHED', color: 'default' }
              ]);
          }
      } catch (e) {
          console.error("Failed to fetch config", e);
      }
  };

  const fetchProjects = async () => {
    try {
      const res = await request.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.project_id) query.append('project_id', params.project_id);
      
      const res = await request.get(`/suppliers?${query.toString()}`);
      let data = res.data;

      // Client-side filtering for name
      if (params.name_like) {
          data = data.filter(s => s.name && s.name.includes(params.name_like));
      }

      setSuppliers(data);
    } catch (err) {
      console.error(err);
      message.error('加载供应商失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectFunctions = async (projectId) => {
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
    
    // Deep copy and sort
    const sorted = [...functions].sort((a, b) => a.order_index - b.order_index);
    const map = {};
    const roots = [];
    
    // Create nodes
    sorted.forEach(node => {
        map[node.id] = {
            title: (
                <span>
                    {node.name}
                    {node.importance === 'CORE' ? <span style={{color: '#ff4d4f', fontSize: 12, marginLeft: 4}}>(核心)</span> : 
                     node.importance === 'IMPORTANT' ? <span style={{color: '#faad14', fontSize: 12, marginLeft: 4}}>(重要)</span> : ''}
                </span>
            ),
            value: node.name,
            key: node.id,
            children: []
        };
    });
    
    // Build tree
    sorted.forEach(node => {
        if (node.parent_id && map[node.parent_id]) {
            map[node.parent_id].children.push(map[node.id]);
        } else {
            roots.push(map[node.id]);
        }
    });
    
    return roots;
  }, [functions]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Ensure project_id is handled (it's in values now)
      if (currentSupplier) {
        await request.put(`/suppliers/${currentSupplier.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/suppliers', values);
        message.success('创建成功');
      }
      setShowModal(false);
      fetchSuppliers(searchParams);
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await request.delete(`/suppliers/${id}`);
      message.success('删除成功');
      fetchSuppliers(searchParams);
    } catch (err) {
      message.error('删除失败');
    }
  };

  const openEdit = (record) => {
    setCurrentSupplier(record);
    form.setFieldsValue(record);
    if (record.project_id) {
        fetchProjectFunctions(record.project_id);
    } else {
        setFunctions([]);
    }
    setShowModal(true);
  };

  const openCreate = () => {
    setCurrentSupplier(null);
    form.resetFields();
    
    const initialValues = { status: 'ACTIVE' };
    if (searchParams.project_id) {
        initialValues.project_id = searchParams.project_id;
        fetchProjectFunctions(searchParams.project_id);
    } else {
        setFunctions([]);
    }
    form.setFieldsValue(initialValues);
    
    setShowModal(true);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '所属项目', dataIndex: 'project_name', key: 'project_name', render: t => t || '-' },
    { 
        title: '供应商名称', 
        dataIndex: 'name', 
        key: 'name',
        render: (text) => <div style={{ fontWeight: 'bold' }}>{text}</div>
    },
    { title: '关联模块', dataIndex: 'module', key: 'module', render: t => t || '-' },
    { 
        title: '合同金额', 
        dataIndex: 'amount', 
        key: 'amount',
        render: val => val ? `¥${Number(val).toLocaleString()}` : '-'
    },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
    { 
        title: '状态', 
        dataIndex: 'status', 
        key: 'status',
        width: 120,
        render: status => {
            const option = statusOptions.find(o => o.value === status);
            return (
                <Tag color={option ? option.color : 'default'}>
                    {option ? option.label : status}
                </Tag>
            );
        }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
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
                onChange={val => setSearchParams(prev => ({...prev, project_id: val}))}
            >
                {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
            <Input 
                placeholder="供应商名称搜索..." 
                style={{ width: 200 }}
                onChange={e => setSearchParams(prev => ({...prev, name_like: e.target.value}))}
                prefix={<SearchOutlined />}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchSuppliers(searchParams)}>查询</Button>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增供应商</Button>
      </div>

      <Table 
        className="sys-table"
        columns={columns} 
        dataSource={suppliers} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
      />

      <Modal
        title={currentSupplier ? '供应商详情 / 编辑' : '新增供应商'}
        open={showModal}
        onOk={handleSubmit}
        onCancel={() => setShowModal(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
            <Form.Item name="project_id" label="所属项目" rules={[{ required: true }]}>
                <Select 
                    placeholder="请选择项目"
                    onChange={(val) => {
                        form.setFieldsValue({ module: undefined }); // Reset module when project changes
                        fetchProjectFunctions(val);
                    }}
                >
                    {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
            </Form.Item>
            <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="module" label="关联业务模块">
                    <TreeSelect
                        key={functions.length} // Force re-render to apply defaultExpandAll when data loads
                        showSearch
                        style={{ width: '100%' }}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        placeholder="请选择功能模块"
                        allowClear
                        treeDefaultExpandAll
                        treeData={functionTreeData}
                        filterTreeNode={(inputValue, treeNode) => {
                            // Search by value (name)
                            return treeNode.value.toLowerCase().includes(inputValue.toLowerCase());
                        }}
                    />
                </Form.Item>
                <Form.Item name="amount" label="合同金额 (元)">
                    <InputNumber style={{ width: '100%' }} step={0.01} />
                </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="contact_person" label="联系人">
                    <Input />
                </Form.Item>
                <Form.Item name="phone" label="联系电话">
                    <Input />
                </Form.Item>
            </div>
            <Form.Item name="email" label="电子邮箱">
                <Input type="email" />
            </Form.Item>
            <Form.Item name="status" label="状态">
                <Select>
                    {statusOptions.map(o => (
                        <Option key={o.value} value={o.value}>{o.label}</Option>
                    ))}
                </Select>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}