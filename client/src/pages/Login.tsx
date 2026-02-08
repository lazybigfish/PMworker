import React, { useState } from 'react';
import { Form, Input, Button, Card, App, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import request from '@/api/request';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/user';

const { Title } = Typography;

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await request.post<User>('/login', values);
      message.success('登录成功');
      onLogin(res.data);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      // Error is handled by interceptor mostly, but specific logic here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#f0f2f5',
      backgroundImage: 'url("https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center 110px',
      backgroundSize: '100%'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 5 }}>PM System</Title>
          <div style={{ color: '#888' }}>在线项目管理系统</div>
        </div>
        
        <Form
          name="login"
          onFinish={handleFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
