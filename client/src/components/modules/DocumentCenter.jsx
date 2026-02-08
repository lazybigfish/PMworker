import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Upload, message, Breadcrumb, Dropdown, Menu, Select, Input } from 'antd';
import { FileOutlined, FolderOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, FolderAddOutlined, MoreOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

export default function DocumentCenter() {
  const [docs, setDocs] = useState([
    { id: 1, name: '项目需求规格说明书.docx', type: 'FILE', size: '2.4 MB', date: '2023-10-10', owner: 'Alice', project_name: '智慧城市交通管理系统' },
    { id: 2, name: 'UI设计稿 v1.0', type: 'FOLDER', size: '-', date: '2023-10-12', owner: 'Bob', project_name: '企业级CRM客户关系管理平台' },
    { id: 3, name: '会议纪要-20231015.pdf', type: 'FILE', size: '1.1 MB', date: '2023-10-15', owner: 'Alice', project_name: '智慧城市交通管理系统' },
  ]);
  const [currentPath, setCurrentPath] = useState([{ id: 0, name: '根目录' }]);
  const [projects, setProjects] = useState([]);
  const [searchParams, setSearchParams] = useState({});

  useEffect(() => {
      fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = () => {
    message.success("模拟上传：文件已添加");
    setDocs([...docs, { id: Date.now(), name: '新上传文件.pdf', type: 'FILE', size: '0.5 MB', date: new Date().toISOString().split('T')[0], owner: 'Me', project_name: '-' }]);
  };

  const handleCreateFolder = () => {
    const name = prompt("请输入文件夹名称");
    if (name) {
      setDocs([...docs, { id: Date.now(), name: name, type: 'FOLDER', size: '-', date: new Date().toISOString().split('T')[0], owner: 'Me', project_name: '-' }]);
    }
  };

  const filteredDocs = docs.filter(doc => {
      if (searchParams.project_id) {
          const project = projects.find(p => p.id === searchParams.project_id);
          if (project && doc.project_name !== project.name) return false;
      }
      if (searchParams.type && doc.type !== searchParams.type) return false;
      if (searchParams.name_like && !doc.name.includes(searchParams.name_like)) return false;
      return true;
  });

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {record.type === 'FOLDER' ? <FolderOutlined style={{ color: '#faad14', fontSize: 18 }} /> : <FileOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
          <a onClick={() => record.type === 'FOLDER' && message.info('进入文件夹 (模拟)')} style={{ color: '#333' }}>{text}</a>
        </Space>
      )
    },
    {
        title: '所属项目',
        dataIndex: 'project_name',
        key: 'project_name',
        render: t => t || '-'
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
    },
    {
      title: '上传者',
      dataIndex: 'owner',
      key: 'owner',
      width: 100,
    },
    {
      title: '修改时间',
      dataIndex: 'date',
      key: 'date',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<DownloadOutlined />}>下载</Button>
          <Dropdown overlay={
            <Menu>
              <Menu.Item key="1" icon={<DeleteOutlined />} danger>删除</Menu.Item>
              <Menu.Item key="2">重命名</Menu.Item>
              <Menu.Item key="3">移动</Menu.Item>
            </Menu>
          }>
            <Button type="link" size="small" icon={<MoreOutlined />} />
          </Dropdown>
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
                placeholder="文件类型" 
                style={{ width: 120 }} 
                allowClear
                onChange={val => setSearchParams({...searchParams, type: val})}
            >
                <Option value="FILE">文件</Option>
                <Option value="FOLDER">文件夹</Option>
            </Select>
            <Input 
                placeholder="文件名称搜索..." 
                style={{ width: 200 }} 
                prefix={<SearchOutlined />}
                onChange={e => setSearchParams({...searchParams, name_like: e.target.value})}
            />
        </div>
        <Space>
            <Button icon={<FolderAddOutlined />} onClick={handleCreateFolder}>新建文件夹</Button>
            <Button type="primary" icon={<UploadOutlined />} onClick={handleUpload}>上传文件</Button>
        </Space>
      </div>

      <div style={{ padding: '0 0 16px 0' }}>
        <Breadcrumb items={currentPath.map(p => ({ title: p.name }))} />
      </div>

      <Table 
        className="sys-table"
        columns={columns} 
        dataSource={filteredDocs} 
        rowKey="id"
        pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
      />
    </div>
  );
}
