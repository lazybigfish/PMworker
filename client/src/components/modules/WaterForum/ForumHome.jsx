import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { List, Avatar, Button, Space, Card, Tag, Input, Row, Col, Tabs } from 'antd';
import { MessageOutlined, LikeOutlined, EyeOutlined, PlusOutlined, SearchOutlined, FireOutlined, StarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import PageLayout from '../../common/PageLayout';

const { TabPane } = Tabs;

export default function ForumHome() {
  const [boards, setBoards] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('LATEST');

  useEffect(() => {
    fetchBoards();
    fetchPosts(activeTab);
  }, [activeTab]);

  const fetchBoards = async () => {
    try {
      const res = await axios.get('/api/forum/boards');
      setBoards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async (type) => {
    setLoading(true);
    try {
      const params = { limit: 10 };
      if (type === 'HOT') params.sort = 'views'; // Mock logic
      if (type === 'ESSENCE') params.is_essence = 1;
      
      const res = await axios.get('/api/forum/posts', { params });
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const actions = (
    <Space>
       <Input prefix={<SearchOutlined />} placeholder="搜索帖子..." style={{ width: 200 }} />
       <Link to="/forum/new">
         <Button type="primary" icon={<PlusOutlined />}>发布新帖</Button>
       </Link>
    </Space>
  );

  const IconText = ({ icon, text }) => (
    <Space>
      {React.createElement(icon)}
      {text}
    </Space>
  );

  return (
    <PageLayout title="水漫金山 (论坛)" actions={actions} noCard>
      <Row gutter={[24, 24]}>
        {/* Left Column: Boards & Hot Tags */}
        <Col xs={24} md={6}>
          <Card title="板块列表" className="sys-module-card" styles={{ body: { padding: '0' } }} style={{ marginBottom: 24 }}>
            <List
              dataSource={boards}
              renderItem={item => (
                <List.Item style={{ padding: '12px 16px', cursor: 'pointer', transition: 'background 0.3s' }} className="board-item">
                  <List.Item.Meta
                    avatar={<Avatar shape="square" size="small" style={{ backgroundColor: '#1890ff' }}>{item.name[0]}</Avatar>}
                    title={<Link to={`/forum/board/${item.id}`} style={{ color: 'inherit' }}>{item.name}</Link>}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="热门标签" className="sys-module-card" size="small">
             <Space wrap>
                <Tag color="magenta">#项目管理</Tag>
                <Tag color="red">#吐槽大会</Tag>
                <Tag color="volcano">#技术分享</Tag>
                <Tag color="orange">#需求变更</Tag>
                <Tag color="gold">#加班</Tag>
                <Tag color="lime">#下午茶</Tag>
             </Space>
          </Card>
        </Col>

        {/* Right Column: Post List */}
        <Col xs={24} md={18}>
          <div className="sys-module-card" style={{ padding: '0 24px', minHeight: 500 }}>
             <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                    { key: 'LATEST', label: <span><ClockCircleOutlined /> 最新动态</span> },
                    { key: 'HOT', label: <span><FireOutlined /> 热门讨论</span> },
                    { key: 'ESSENCE', label: <span><StarOutlined /> 精华帖</span> }
                ]}
             />

             <List
                itemLayout="vertical"
                size="large"
                loading={loading}
                dataSource={posts}
                renderItem={item => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <IconText icon={EyeOutlined} text={item.view_count || 0} key="list-vertical-star-o" />,
                      <IconText icon={LikeOutlined} text={item.like_count || 0} key="list-vertical-like-o" />,
                      <IconText icon={MessageOutlined} text={item.reply_count || 0} key="list-vertical-message" />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={item.author_avatar} icon={<MessageOutlined />} />}
                      title={
                          <Space>
                             {item.is_sticky === 1 && <Tag color="red">置顶</Tag>}
                             {item.is_essence === 1 && <Tag color="gold">精</Tag>}
                             <Link to={`/forum/post/${item.id}`} style={{ fontWeight: 'bold', fontSize: 16 }}>{item.title}</Link>
                          </Space>
                      }
                      description={
                          <Space split="|">
                              <Tag color="blue">{item.board_name}</Tag>
                              <span>{item.author_name}</span>
                              <span>{new Date(item.created_at).toLocaleString()}</span>
                          </Space>
                      }
                    />
                    <div style={{ color: '#666', fontSize: 14 }}>
                        {item.content && item.content.substring(0, 120) + (item.content.length > 120 ? '...' : '')}
                    </div>
                  </List.Item>
                )}
             />
          </div>
        </Col>
      </Row>
    </PageLayout>
  );
}

// Add simple CSS for hover effect if not present
const style = document.createElement('style');
style.innerHTML = `
  .board-item:hover { background-color: #f5f5f5; }
`;
document.head.appendChild(style);
