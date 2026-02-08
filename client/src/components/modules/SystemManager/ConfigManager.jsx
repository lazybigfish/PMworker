import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import PageLayout from '../../common/PageLayout';

const { Option } = Select;

export default function ConfigManager() {
  const [configs, setConfigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system_configs');
      setConfigs(res.data);
      const uniqueCats = [...new Set(res.data.map(c => c.category))];
      setCategories(uniqueCats);
    } catch (err) {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingConfig) {
        await axios.put(`/api/system_configs/${editingConfig.id}`, values);
        message.success('更新成功');
      } else {
        await axios.post('/api/system_configs', values);
        message.success('创建成功');
      }
      setShowModal(false);
      fetchConfigs();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/system_configs/${id}`);
      message.success('删除成功');
      fetchConfigs();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const openCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    form.setFieldsValue({ sort_order: 0, is_active: 1 });
    setShowModal(true);
  };

  const openEdit = (record) => {
    setEditingConfig(record);
    form.setFieldsValue(record);
    setShowModal(true);
  };

  const filteredConfigs = selectedCategory === 'ALL' 
    ? configs 
    : configs.filter(c => c.category === selectedCategory);

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 'var(--sys-col-index)',
      render: (_, __, index) => index + 1
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
    },
    {
      title: 'Key (代码)',
      dataIndex: 'key',
      key: 'key',
      render: text => <Tag>{text}</Tag>
    },
    {
      title: 'Label (显示名)',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: 'Value (值)',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 'var(--sys-col-status)',
      render: active => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 'var(--sys-col-action)',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const actions = (
    <Space>
      <Select 
        value={selectedCategory} 
        onChange={setSelectedCategory} 
        style={{ width: 150 }}
        bordered={false}
      >
        <Option value="ALL">全部分类</Option>
        {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
      </Select>
      <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>刷新</Button>
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增配置</Button>
    </Space>
  );

  return (
    <PageLayout title="配置管理" actions={actions} noCard>
      <div className="sys-module-card" style={{ borderRadius: '0 0 8px 8px', borderTop: 'none' }}>
        <div className="sys-module-content">
          <div className="sys-module-table-wrapper">
            <Table 
              className="sys-table"
              columns={columns} 
              dataSource={filteredConfigs} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
              scroll={{ y: 'calc(100vh - 280px)' }} // Approximate calculation for dynamic height
            />
          </div>
        </div>
      </div>

      <Modal
        title={editingConfig ? '编辑配置' : '新增配置'}
        open={showModal}
        onOk={handleSave}
        onCancel={() => setShowModal(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
             <Select mode="tags" placeholder="选择或输入分类">
                {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
             </Select>
          </Form.Item>
          <Form.Item name="key" label="Key" rules={[{ required: true }]}>
            <Input disabled={!!editingConfig} />
          </Form.Item>
          <Form.Item name="label" label="Label" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="value" label="Value" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="is_active" label="状态">
            <Select>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  );
}
