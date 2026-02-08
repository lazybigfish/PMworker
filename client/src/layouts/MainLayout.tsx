import React, { useState } from 'react';
import { Layout, Menu, Breadcrumb, Avatar, Dropdown, Space, theme } from 'antd';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  HomeOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  MessageOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

import { useLayoutStore } from '@/store/useLayoutStore';

const { Header, Content, Sider, Footer } = Layout;

interface MainLayoutProps {
  user?: {
    username: string;
    real_name?: string;
    avatar_url?: string;
  } | null;
  onLogout?: () => void;
  permissions?: string[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, permissions = [] }) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  
  const { breadcrumbItems } = useLayoutStore();
  const navigate = useNavigate();
  const location = useLocation();

  const hasPerm = (code: string) => permissions.includes(code) || permissions.includes('sys');

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '项目概览',
    },
    hasPerm('biz:project') ? {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    } : null,
    hasPerm('biz:task') ? {
      key: '/tasks',
      icon: <UnorderedListOutlined />,
      label: '任务管理',
    } : null,
    hasPerm('biz:doc') ? {
      key: '/documents',
      icon: <FileTextOutlined />,
      label: '文档中心',
    } : null,
    hasPerm('biz:forum') ? {
      key: '/forum',
      icon: <MessageOutlined />,
      label: '水漫金山',
    } : null,
    hasPerm('biz:supplier') ? {
      key: '/suppliers',
      icon: <TeamOutlined />,
      label: '供应商',
    } : null,
    hasPerm('biz:report') ? {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表分析',
    } : null,
    (hasPerm('sys:user') || hasPerm('sys:role') || hasPerm('sys')) ? {
      key: '/system',
      icon: <SettingOutlined />,
      label: '系统管理',
    } : null,
  ].filter(Boolean) as MenuProps['items'];

  const userMenu: MenuProps = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
        onClick: onLogout,
      },
    ],
  };

  const getBreadcrumbItems = () => {
    if (breadcrumbItems) {
      return [
        {
          key: 'home',
          title: <Link to="/">首页</Link>,
        },
        ...breadcrumbItems.map((item, index) => ({
          key: item.path || `breadcrumb-${index}`,
          title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title,
        }))
      ];
    }

    const pathSnippets = location.pathname.split('/').filter((i) => i);
    const extraBreadcrumbItems = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      return {
        key: url,
        title: <Link to={url}>{_}</Link>,
      };
    });
    return [
      {
        key: 'home',
        title: <Link to="/">首页</Link>,
      },
      ...extraBreadcrumbItems,
    ];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        <div style={{ 
          height: 64, 
          margin: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          {collapsed ? 'PM' : 'PM System'}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]} 
          items={menuItems} 
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 99, boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: '18px', cursor: 'pointer', marginRight: 24 }
            })}
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            <Dropdown menu={userMenu}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={user?.avatar_url} icon={<UserOutlined />} />
                <span>{user?.real_name || user?.username || 'Guest'}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          PM System ©{new Date().getFullYear()} Created by Trae AI
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
