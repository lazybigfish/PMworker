import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import { Button, Card, Space, Tag, message, Avatar, List, Popconfirm } from 'antd';
import { LikeOutlined, EyeOutlined, MessageOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import PageLayout from '../../common/PageLayout';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`/api/forum/posts/${id}`);
      setPost(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await axios.post(`/api/forum/posts/${id}/reply`, { content: replyContent });
      setReplyContent('');
      fetchPost();
      message.success('回复成功');
    } catch (err) {
      message.error('回复失败');
    }
  };

  const handleAdminAction = async (action) => {
    try {
      await axios.post('/api/forum/admin/action', { target_id: id, action });
      message.success('操作成功');
      if (action === 'DELETE') {
        navigate('/forum');
      } else {
        fetchPost();
      }
    } catch (err) {
      message.error('操作失败');
    }
  };

  if (!post) return <div>Loading...</div>;

  const actions = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/forum')}>返回列表</Button>
  );

  return (
    <PageLayout title="帖子详情" actions={actions} noCard>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Main Post */}
        <Card className="sys-module-card" style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: '#999', marginBottom: 12 }}>
              {post.board_name} &gt; 帖子详情
            </div>
            <h1 style={{ margin: '0 0 16px 0', fontSize: 24, fontWeight: 600 }}>
              {post.is_sticky === 1 && <Tag color="red">置顶</Tag>}
              {post.is_essence === 1 && <Tag color="gold">精华</Tag>}
              {post.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space size="large">
                <Space>
                   <Avatar icon={<UserOutlined />} src={post.author_avatar} />
                   <div>
                      <div style={{ fontWeight: 600 }}>{post.author_name}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>Lv.{post.author_level}</div>
                   </div>
                </Space>
                <span style={{ color: '#999' }}>发布于: {format(new Date(post.created_at), 'yyyy-MM-dd HH:mm')}</span>
                <Space style={{ color: '#999' }}><EyeOutlined /> {post.view_count}</Space>
              </Space>
              
              <Space>
                <Button size="small" onClick={() => handleAdminAction('STICK')}>{post.is_sticky ? '取消置顶' : '置顶'}</Button>
                <Button size="small" onClick={() => handleAdminAction('ESSENCE')}>{post.is_essence ? '取消精华' : '加精'}</Button>
                <Popconfirm title="确认删除?" onConfirm={() => handleAdminAction('DELETE')}>
                   <Button size="small" danger>删除</Button>
                </Popconfirm>
              </Space>
            </div>
          </div>
          
          <div className="ql-editor" style={{ padding: 0, minHeight: 200, fontSize: 16, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: post.content }}></div>
        </Card>

        {/* Replies */}
        <Card className="sys-module-card" title={`全部回复 (${post.replies ? post.replies.length : 0})`} style={{ marginBottom: 24 }}>
          <List
            itemLayout="vertical"
            dataSource={post.replies || []}
            renderItem={(item, index) => (
              <List.Item key={item.id}>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} src={item.author_avatar} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <Space>
                          <span>{item.author_name}</span>
                          <Tag>Lv.{item.author_level}</Tag>
                       </Space>
                       <Space style={{ color: '#999', fontSize: 12 }}>
                          <span>#{index + 1}楼</span>
                          <span>{format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}</span>
                       </Space>
                    </div>
                  }
                />
                <div className="ql-editor" style={{ padding: '0 0 0 48px' }} dangerouslySetInnerHTML={{ __html: item.content }}></div>
              </List.Item>
            )}
          />
        </Card>

        {/* Reply Box */}
        <Card className="sys-module-card" title="发表回复">
          <ReactQuill 
            theme="snow"
            value={replyContent}
            onChange={setReplyContent}
            style={{ height: 200, marginBottom: 60 }}
          />
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={handleReply} size="large">回复</Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
