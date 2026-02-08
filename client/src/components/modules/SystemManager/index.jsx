import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import UserManager from './UserManager';
import PermissionManager from './PermissionManager';
import ConfigManager from './ConfigManager';
import MilestoneManager from './MilestoneManager';

export default function SystemManager() {
  const location = useLocation();
  // Get active tab based on last path segment
  const activeTab = location.pathname.split('/').pop() || 'users';

  // If we are at root /system, redirect or default? App.jsx handles /system/*
  // But inside SystemManager, we need to know which tab is active.
  
  const tabStyle = (tabName) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: activeTab === tabName ? '2px solid #1890ff' : 'transparent',
    color: activeTab === tabName ? '#1890ff' : '#666',
    textDecoration: 'none',
    fontWeight: activeTab === tabName ? '600' : 'normal',
    transition: 'all 0.3s'
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Module Navigation Header - Aligned with PageLayout content */}
      <div className="sys-module-container" style={{ paddingBottom: 0, height: 'auto', flex: 'none', minWidth: 'var(--sys-layout-min-width)' }}>
        <div style={{ 
          padding: '16px 24px 0', 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          borderRadius: '8px 8px 0 0', 
        }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <Link to="/system/users" style={tabStyle('users')}>用户管理</Link>
            <Link to="/system/permissions" style={tabStyle('permissions')}>角色管理</Link>
            <Link to="/system/milestones" style={tabStyle('milestones')}>里程碑管理</Link>
            <Link to="/system/configs" style={tabStyle('configs')}>配置管理</Link>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Navigate to="users" replace />} />
          <Route path="users" element={<UserManager />} />
          <Route path="permissions" element={<PermissionManager />} />
          <Route path="milestones" element={<MilestoneManager />} />
          <Route path="configs" element={<ConfigManager />} />
        </Routes>
      </div>
    </div>
  );
}
