import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Form, Input, Select, Button, Card, message } from 'antd';
import PageLayout from '../../common/PageLayout';

const { Option } = Select;

export default function PostEditor() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    axios.get('/api/forum/boards').then(res => {
      setBoards(res.data);
      // Default select board
      if (boardId) {
        form.setFieldsValue({ board_id: parseInt(boardId) });
      } else if (res.data.length > 0) {
        form.setFieldsValue({ board_id: res.data[0].id });
      }
    });
  }, [boardId]);

  const handleSubmit = async (values) => {
    try {
      await axios.post('/api/forum/posts', values);
      message.success('发布成功');
      navigate('/forum');
    } catch (err) {
      message.error('发布失败');
    }
  };

  return (
    <PageLayout title="发布新帖" noCard>
      <Card className="sys-module-card" style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="board_id" label="选择板块" rules={[{ required: true, message: '请选择板块' }]}>
            <Select placeholder="请选择板块">
              {boards.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
            </Select>
          </Form.Item>
          
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题..." size="large" />
          </Form.Item>
          
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <ReactQuill theme="snow" style={{ height: 300, marginBottom: 50 }} />
          </Form.Item>
          
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => navigate('/forum')} style={{ marginRight: 8 }}>取消</Button>
            <Button type="primary" htmlType="submit">立即发布</Button>
          </div>
        </Form>
      </Card>
    </PageLayout>
  );
}
