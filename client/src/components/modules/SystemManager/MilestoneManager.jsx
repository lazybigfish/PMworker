import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Table, Button, Tag, Tree, Form, Input, 
  Modal, message, Space, Divider, Select, Switch, Tooltip 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  CheckCircleOutlined, CopyOutlined, FolderOutlined, 
  FileTextOutlined, SaveOutlined, ReloadOutlined 
} from '@ant-design/icons';
import request from '@/api/request';
import PageLayout from '../../common/PageLayout';

const { DirectoryTree } = Tree;
const { TextArea } = Input;

export default function MilestoneManager() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  
  // Editor State
  const [selectedNode, setSelectedNode] = useState(null);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, []);

  useEffect(() => {
    if (selectedVersion) {
        try {
            const data = typeof selectedVersion.content === 'string' 
                ? JSON.parse(selectedVersion.content) 
                : selectedVersion.content;
            
            // Transform to AntD Tree format
                const tree = data.map(phase => ({
                    ...phase,
                    title: phase.name,
                    key: phase.id || `phase-${Date.now()}-${Math.random()}`, // Ensure key exists
                    isLeaf: false,
                    icon: <FolderOutlined />,
                    children: (phase.children || []).map(proc => ({
                        ...proc, // Keep data
                        title: proc.name,
                        key: proc.id || `proc-${Date.now()}-${Math.random()}`, // Ensure key exists
                        isLeaf: true,
                        icon: <FileTextOutlined />,
                    }))
                }));
            
            setTreeData(tree);
            setExpandedKeys(tree.map(n => n.key));
            setSelectedNode(null);
            setIsEditing(false);
        } catch (e) {
            console.error("Parse error", e);
            setTreeData([]);
        }
    }
  }, [selectedVersion]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await request.get('/milestone-versions');
      setVersions(res.data);
      if (res.data.length > 0 && !selectedVersion) {
        // Auto select active or first
        const active = res.data.find(v => v.is_active) || res.data[0];
        fetchVersionDetails(active.id);
      }
    } catch (err) {
      message.error('加载版本列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionDetails = async (id) => {
      try {
          const res = await request.get(`/milestone-versions/${id}`);
          setSelectedVersion(res.data);
      } catch (err) {
          message.error('加载详情失败');
      }
  };

  const handleCreateVersion = () => {
      Modal.confirm({
          title: '创建新版本',
          content: '是否基于当前选中的版本创建新版本？',
          onOk: async () => {
              try {
                  const payload = {
                      version_name: `v${(selectedVersion?.version_number || 0) + 1}.0`,
                      content: selectedVersion ? (typeof selectedVersion.content === 'string' ? JSON.parse(selectedVersion.content) : selectedVersion.content) : []
                  };
                  const res = await request.post('/milestone-versions', payload);
                  message.success('创建成功');
                  fetchVersions();
                  fetchVersionDetails(res.data.id);
              } catch (err) {
                  message.error('创建失败');
              }
          }
      });
  };

  const handlePublish = async (id) => {
      try {
          await request.post(`/milestone-versions/${id}/publish`);
          message.success('发布成功');
          fetchVersions();
          if (selectedVersion?.id === id) {
              setSelectedVersion(prev => ({ ...prev, is_active: 1 }));
          }
      } catch (err) {
          message.error('发布失败');
      }
  };

  // --- Tree Operations ---

  const onSelect = (keys, info) => {
      if (keys.length > 0) {
          const node = info.node;
          setSelectedNode(node);
          form.setFieldsValue({
              name: node.title,
              description: node.description,
              input_docs: node.input_docs,
              output_docs: node.output_docs,
              is_required: node.is_required
          });
          // Allow editing only if not active (or allow editing active? user said "edit... sync")
          // Let's allow editing always but warn on save if active.
          setIsEditing(true);
      } else {
          setSelectedNode(null);
          setIsEditing(false);
      }
  };

  const handleSaveNode = async () => {
      const values = await form.validateFields();
      
      // Update Tree Data
      const newTree = [...treeData];
      
      const updateNode = (nodes) => {
          for (let i = 0; i < nodes.length; i++) {
              if (nodes[i].key === selectedNode.key) {
                  // Merge values into the node data
                  nodes[i] = { 
                      ...nodes[i], 
                      ...values, 
                      title: values.name // Update title for tree display
                  };
                  return true;
              }
              if (nodes[i].children) {
                  if (updateNode(nodes[i].children)) return true;
              }
          }
          return false;
      };
      
      if (updateNode(newTree)) {
          setTreeData(newTree);
          message.success('节点已更新 (需保存版本生效)');
      } else {
          message.error('更新失败：未找到节点');
      }
  };

  const handleSaveVersion = async () => {
      // Convert tree back to clean JSON
      const cleanData = treeData.map(phase => ({
          id: phase.key,
          name: phase.title,
          children: phase.children.map(proc => ({
              id: proc.key,
              name: proc.title,
              description: proc.description,
              input_docs: proc.input_docs,
              output_docs: proc.output_docs,
              is_required: proc.is_required,
              importance: proc.importance
          }))
      }));

      // In real app, we might update existing version or create new. 
      // User requirement 2: "Add/Delete/Edit...".
      // Let's assume we create a NEW version if the current one is active, OR update if it's draft.
      // But my backend API only has Create. I need Update?
      // Wait, I implemented Create. I didn't implement Update for Version Content.
      // Let's just Create New Version on Save for safety, or I need to add PUT endpoint.
      // *Correction*: I should add PUT endpoint or just Create New. 
      // Requirement 4: "Record modification time... View history". Creating new version is best.
      
      handleCreateVersionWithContent(cleanData);
  };

  const handleCreateVersionWithContent = async (content) => {
      try {
          const payload = {
              version_name: `v${(versions[0]?.version_number || 0) + 1}.0`, // Simple increment
              content: content
          };
          const res = await request.post('/milestone-versions', payload);
          message.success('保存为新版本成功');
          fetchVersions();
          fetchVersionDetails(res.data.id);
      } catch (err) {
          message.error('保存失败');
      }
  };

  const handleAddPhase = () => {
      const newPhase = {
          title: '新阶段',
          key: 'phase-' + Date.now(),
          isLeaf: false,
          icon: <FolderOutlined />,
          children: []
      };
      setTreeData([...treeData, newPhase]);
  };

  const handleAddProcess = () => {
      if (!selectedNode || selectedNode.isLeaf) {
          return message.warning('请先选择一个阶段');
      }
      
      const newProcess = {
          title: '新过程',
          key: 'proc-' + Date.now(),
          isLeaf: true,
          icon: <FileTextOutlined />,
          description: '',
          is_required: 1
      };
      
      const newTree = [...treeData];
      const phase = newTree.find(n => n.key === selectedNode.key);
      if (phase) {
          phase.children.push(newProcess);
          setTreeData(newTree);
          setExpandedKeys([...expandedKeys, phase.key]);
      }
  };
  
  const handleDeleteNode = () => {
      if (!selectedNode) return;
      
      Modal.confirm({
          title: '确认删除',
          content: '确定要删除此节点吗？',
          onOk: () => {
              const newTree = [...treeData];
              // Filter out phase
              const filtered = newTree.filter(n => n.key !== selectedNode.key);
              
              if (filtered.length !== newTree.length) {
                  // It was a phase
                  setTreeData(filtered);
              } else {
                  // It might be a child
                  newTree.forEach(phase => {
                      phase.children = phase.children.filter(c => c.key !== selectedNode.key);
                  });
                  setTreeData(newTree);
              }
              setSelectedNode(null);
          }
      });
  };

  const columns = [
    { title: '版本号', dataIndex: 'version_number', key: 'version_number', render: t => `v${t}.0` },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', render: active => active ? <Tag color="green">当前生效</Tag> : <Tag>历史版本</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: t => new Date(t).toLocaleDateString() },
    {
        title: '操作',
        key: 'action',
        render: (_, record) => (
            <Space>
                <Button type="link" size="small" onClick={() => fetchVersionDetails(record.id)}>查看</Button>
                {!record.is_active && (
                    <Button type="link" size="small" onClick={() => handlePublish(record.id)}>发布</Button>
                )}
            </Space>
        )
    }
  ];

  return (
    <PageLayout title="里程碑模板管理" noCard>
      <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
        <Col span={6}>
            <Card title="版本历史" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreateVersion}>新建</Button>} style={{ height: '100%', overflow: 'auto' }}>
                <Table 
                    columns={columns} 
                    dataSource={versions} 
                    rowKey="id" 
                    size="small" 
                    pagination={false}
                    rowClassName={record => record.id === selectedVersion?.id ? 'ant-table-row-selected' : ''}
                    onRow={(record) => ({
                        onClick: () => fetchVersionDetails(record.id)
                    })}
                />
            </Card>
        </Col>
        <Col span={18}>
            <Card 
                title={selectedVersion ? `编辑版本: v${selectedVersion.version_number}.0 ${selectedVersion.is_active ? '(当前生效)' : ''}` : '请选择版本'} 
                extra={
                    <Space>
                        {selectedVersion && !selectedVersion.is_active && (
                            <Button type="primary" onClick={() => handlePublish(selectedVersion.id)}>发布版本</Button>
                        )}
                        <Button icon={<PlusOutlined />} onClick={handleAddPhase}>添加阶段</Button>
                        <Button icon={<FileTextOutlined />} onClick={handleAddProcess}>添加过程</Button>
                        <Button danger icon={<DeleteOutlined />} onClick={handleDeleteNode} disabled={!selectedNode}>删除</Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveVersion}>保存为新版本</Button>
                    </Space>
                }
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                styles={{ body: { flex: 1, overflow: 'hidden', display: 'flex' } }}
            >
                {selectedVersion && (
                    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                        <div style={{ width: '40%', borderRight: '1px solid #f0f0f0', overflow: 'auto', paddingRight: 16 }}>
                            <DirectoryTree
                                treeData={treeData}
                                onSelect={onSelect}
                                expandedKeys={expandedKeys}
                                onExpand={setExpandedKeys}
                                defaultExpandAll
                            />
                        </div>
                        <div style={{ flex: 1, paddingLeft: 24, overflow: 'auto' }}>
                            {selectedNode ? (
                                <Form form={form} layout="vertical">
                                    <Tag color="blue" style={{ marginBottom: 16 }}>
                                        {selectedNode.isLeaf ? '过程 (Process)' : '阶段 (Phase)'}
                                    </Tag>
                                    <Form.Item name="name" label="名称" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    {selectedNode.isLeaf && (
                                        <>
                                            <Form.Item name="description" label="描述">
                                                <TextArea rows={3} />
                                            </Form.Item>
                                            <Form.Item name="input_docs" label="输入物要求 (逗号分隔)">
                                                <Input placeholder="例如: 可研文件,项目合同" />
                                            </Form.Item>
                                            <Form.Item name="output_docs" label="输出物要求 (逗号分隔)">
                                                <Input placeholder="例如: 验收报告,测试报告" />
                                            </Form.Item>
                                            <Form.Item name="is_required" label="是否必填" valuePropName="checked">
                                                <Switch />
                                            </Form.Item>
                                        </>
                                    )}
                                    <Button type="primary" onClick={handleSaveNode}>更新节点</Button>
                                </Form>
                            ) : (
                                <div style={{ color: '#999', marginTop: 100, textAlign: 'center' }}>
                                    请在左侧选择节点进行编辑
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </Col>
      </Row>
    </PageLayout>
  );
}
