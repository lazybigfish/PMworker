import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Tree, Card, Button, Form, Input, InputNumber, Select, 
  message, Modal, Space, Empty, Spin, Breadcrumb 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, SaveOutlined, 
  ArrowLeftOutlined, HolderOutlined 
} from '@ant-design/icons';
import request from '@/api/request';

const { Option } = Select;
const { TextArea } = Input;

interface FunctionNode {
  id: number;
  key: number;
  project_id: number;
  parent_id: number | null;
  name: string;
  budget?: number;
  content?: string;
  importance: 'NORMAL' | 'IMPORTANT' | 'CORE';
  order_index: number;
  level: number;
  children?: FunctionNode[];
}

const ProjectFunctionsPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [functions, setFunctions] = useState<FunctionNode[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedNode, setSelectedNode] = useState<FunctionNode | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  // Fetch data
  const fetchFunctions = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await request.get(`/projects/${projectId}/functions`);
      setFunctions(res.data);
      // If currently selected node still exists, update it
      if (selectedNode) {
        const fresh = res.data.find((f: any) => f.id === selectedNode.id);
        if (fresh) {
          setSelectedNode(fresh);
          form.setFieldsValue(fresh);
        } else {
          setSelectedNode(null);
          form.resetFields();
        }
      }
    } catch (err) {
      message.error('加载功能清单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunctions();
  }, [projectId]);

  // Transform to Tree Data
  const treeData = useMemo(() => {
    const buildTree = (parentId: number | null): any[] => {
      return functions
        .filter(f => f.parent_id === parentId)
        .sort((a, b) => a.order_index - b.order_index)
        .map(f => ({
          ...f,
          key: f.id,
          title: (
             <span>
               <span style={{ 
                 color: f.importance === 'CORE' ? '#ff4d4f' : f.importance === 'IMPORTANT' ? '#faad14' : 'inherit',
                 fontWeight: f.importance !== 'NORMAL' ? 'bold' : 'normal'
               }}>
                 {f.name}
               </span>
             </span>
          ),
          children: buildTree(f.id)
        }));
    };
    return buildTree(null);
  }, [functions]);

  const onSelect = (keys: React.Key[], info: any) => {
    if (keys.length > 0) {
      setSelectedKeys(keys);
      const node = info.node;
      // Need to find original data because tree node has extra props
      const original = functions.find(f => f.id === node.id);
      if (original) {
        setSelectedNode(original);
        form.setFieldsValue(original);
      }
    } else {
      setSelectedKeys([]);
      setSelectedNode(null);
      form.resetFields();
    }
  };

  const handleAdd = async (isChild: boolean) => {
    if (isChild && !selectedNode) {
      message.warning('请先选择一个父节点');
      return;
    }
    
    // Check level limit (Max 5)
    if (isChild && selectedNode && selectedNode.level >= 5) {
      message.error('最多支持5级嵌套');
      return;
    }

    const parentId = isChild && selectedNode ? selectedNode.id : null;
    const level = isChild && selectedNode ? selectedNode.level + 1 : 1;
    
    // Find max order index in siblings
    const siblings = functions.filter(f => f.parent_id === parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.order_index)) : 0;

    const newNode = {
      project_id: Number(projectId),
      parent_id: parentId,
      name: '新功能点',
      importance: 'NORMAL',
      level: level,
      order_index: maxOrder + 1
    };

    try {
      const res = await request.post('/functions', newNode);
      message.success('创建成功');
      await fetchFunctions();
      // Auto select new node
      setSelectedKeys([res.data.id]);
      setSelectedNode(res.data);
      form.setFieldsValue(res.data);
      // Expand parent if child added
      if (parentId) {
        setExpandedKeys(prev => [...prev, parentId]);
      }
    } catch (err) {
      message.error('创建失败');
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    
    Modal.confirm({
      title: '确认删除?',
      content: '删除该节点将同时删除其所有子节点，且不可恢复。',
      okType: 'danger',
      onOk: async () => {
        try {
          await request.delete(`/functions/${selectedNode.id}`);
          message.success('删除成功');
          setSelectedKeys([]);
          setSelectedNode(null);
          form.resetFields();
          fetchFunctions();
        } catch (err) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSave = async () => {
    if (!selectedNode) return;
    try {
      const values = await form.validateFields();
      await request.put(`/functions/${selectedNode.id}`, values);
      message.success('保存成功');
      fetchFunctions();
    } catch (err) {
      // validation failed
    }
  };

  const onDrop = async (info: any) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (data: any[], key: React.Key, callback: any) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) {
          loop(data[i].children, key, callback);
        }
      }
    };

    const data = [...treeData]; // This is derived state, we can't mutate it directly for logic?
    // Actually we need to calculate updates based on tree structure.
    
    // Simplified Logic:
    // 1. Find drag node and drop node in 'functions' flat list is hard.
    // 2. Use the info provided by Antd Tree.
    
    // We need to determine: new Parent ID, new Order Index.
    
    // If dropped inside (dropPosition === 0)
    // If dropped before (-1) or after (1)
    
    let newParentId: number | null = null;
    let newOrderIndex = 0;
    let newLevel = 1;

    // Find the node being dragged
    const dragNode = functions.find(f => f.id === dragKey);
    if (!dragNode) return;

    // Find the target node
    const targetNode = functions.find(f => f.id === dropKey);
    
    if (!info.dropToGap) {
      // Dropped INSIDE the target node
      // target becomes parent
      if (!targetNode) return;
      newParentId = targetNode.id;
      newLevel = targetNode.level + 1;
      
      // Order is last child + 1? Or first?
      // Usually append to end
      const children = functions.filter(f => f.parent_id === targetNode.id);
      const maxOrder = children.length > 0 ? Math.max(...children.map(c => c.order_index)) : 0;
      newOrderIndex = maxOrder + 1;
      
    } else {
      // Dropped BEFORE or AFTER target node
      // Shares same parent as target
      if (!targetNode) return; // Should not happen for root siblings?
      // If target is root (parent_id null), newParentId is null.
      newParentId = targetNode.parent_id;
      newLevel = targetNode.level; // Same level
      
      // We need to re-calculate order for all siblings of targetNode.
      // Antd Tree doesn't give us the final list easily without mutation.
      // But we can infer.
      
      // Let's use a simpler approach:
      // We just need to know the new parent and the approximate order.
      // If we want to support precise reordering, we need to batch update all siblings.
      
      // Let's fetch the siblings of the NEW parent (or current siblings if parent didn't change).
      // But we don't know the exact index yet.
      
      // Let's use the Tree data structure approach which Antd docs suggest for drag/drop.
      // But since we are backend-driven, we just need to send the "move" command.
      
      // "Move dragKey to be child of newParentId at index X"
      
      // If dropPosition is -1, it's before dropNode.
      // If dropPosition is 1, it's after dropNode.
      
      // Let's get all siblings of the target parent.
      let siblings = functions.filter(f => f.parent_id === newParentId && f.id !== dragKey);
      siblings.sort((a, b) => a.order_index - b.order_index);
      
      const dropIndex = siblings.findIndex(f => f.id === dropKey);
      
      if (dropPosition === -1) {
        // Insert before
        siblings.splice(dropIndex, 0, dragNode);
      } else {
        // Insert after
        siblings.splice(dropIndex + 1, 0, dragNode);
      }
      
      // Now siblings array has the correct order.
      // We need to update order_index for all of them.
      // And update parent_id/level for dragNode.
      
      const updates = siblings.map((node, index) => ({
        id: node.id,
        parent_id: newParentId,
        level: newLevel,
        order_index: index + 1
      }));
      
      // Check level constraint
      if (newLevel > 5) {
         message.error('超出层级限制');
         return;
      }
      // Also need to check if dragging a subtree would exceed limit.
      // dragNode max depth + (newLevel - oldLevel) <= 5?
      // We can do a quick check or let backend validate.
      
      try {
        await request.post('/functions/batch', { updates });
        message.success('移动成功');
        fetchFunctions();
      } catch (e) {
        message.error('移动失败');
      }
      return;
    }
    
    // If dropped inside (handled separately above to be cleaner)
    if (!info.dropToGap) {
       if (newLevel > 5) {
         message.error('超出层级限制');
         return;
       }
       
       const updates = [{
         id: dragNode.id,
         parent_id: newParentId,
         level: newLevel,
         order_index: newOrderIndex
       }];
       
       try {
        await request.post('/functions/batch', { updates });
        message.success('移动成功');
        fetchFunctions();
       } catch (e) {
        message.error('移动失败');
       }
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
          <Breadcrumb items={[
              { title: <a href="/projects">项目列表</a> },
              { title: '功能清单' }
          ]} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
           <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>返回</Button>
           <span style={{ fontSize: 20, fontWeight: 'bold' }}>项目功能清单管理</span>
        </Space>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd(false)}>新增一级功能</Button>
          <Button icon={<PlusOutlined />} disabled={!selectedNode} onClick={() => handleAdd(true)}>新增子功能</Button>
          <Button danger icon={<DeleteOutlined />} disabled={!selectedNode} onClick={handleDelete}>删除</Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 200px)' }}>
        {/* Left: Tree */}
        <Card style={{ width: 400, overflow: 'auto' }} bodyStyle={{ padding: 10 }}>
          {loading && functions.length === 0 ? <Spin /> : (
            treeData.length > 0 ? (
              <Tree
                treeData={treeData}
                selectedKeys={selectedKeys}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                onSelect={onSelect}
                draggable
                blockNode
                onDrop={onDrop}
              />
            ) : (
              <Empty description="暂无功能点，请点击新增" />
            )
          )}
        </Card>

        {/* Right: Edit Form */}
        <Card style={{ flex: 1, overflow: 'auto' }} title={selectedNode ? `编辑: ${selectedNode.name}` : '功能详情'}>
          {selectedNode ? (
            <Form form={form} layout="vertical">
              <Form.Item name="name" label="功能名称" rules={[{ required: true, max: 100 }]}>
                <Input placeholder="请输入功能名称" />
              </Form.Item>
              
              <Form.Item name="importance" label="重要度" rules={[{ required: true }]}>
                <Select>
                  <Option value="NORMAL">普通</Option>
                  <Option value="IMPORTANT">重要</Option>
                  <Option value="CORE">核心</Option>
                </Select>
              </Form.Item>

              <Form.Item name="budget" label="预算 (元)">
                <InputNumber 
                  style={{ width: '100%' }} 
                  step={0.01} 
                  precision={2}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                  parser={value => value?.replace(/\¥\s?|(,*)/g, '') as unknown as number}
                />
              </Form.Item>

              <Form.Item name="content" label="内容介绍">
                <TextArea rows={6} maxLength={1000} showCount placeholder="请输入详细功能描述" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存修改</Button>
              </Form.Item>
            </Form>
          ) : (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
               请在左侧选择一个功能节点进行编辑
             </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProjectFunctionsPage;
