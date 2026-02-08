import React, { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import { Spin } from 'antd';
import { useUserStore } from '@/store/useUserStore';

// Lazy Load Components
const Dashboard = lazy(() => import('@/components/Dashboard'));
const ProjectList = lazy(() => import('@/pages/ProjectList'));
const ProjectMilestonesPage = lazy(() => import('@/pages/ProjectMilestonesPage'));
const ProjectFunctionsPage = lazy(() => import('@/pages/ProjectFunctionsPage'));
const TaskManager = lazy(() => import('@/pages/TaskManager'));
const DocumentCenter = lazy(() => import('@/components/modules/DocumentCenter'));
const ForumHome = lazy(() => import('@/components/modules/WaterForum/ForumHome'));
const PostEditor = lazy(() => import('@/components/modules/WaterForum/PostEditor'));
const PostDetail = lazy(() => import('@/components/modules/WaterForum/PostDetail'));
const SupplierManager = lazy(() => import('@/components/modules/SupplierManager'));
const ReportCenter = lazy(() => import('@/components/modules/ReportCenter'));
const SystemManager = lazy(() => import('@/components/modules/SystemManager'));

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <Spin size="large" />
  </div>
);

// Auth Guard Wrapper
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Layout Wrapper with Store Connection
const LayoutWrapper = () => {
  const { user, logout, permissions, fetchPermissions } = useUserStore();

  useEffect(() => {
    if (user && permissions.length === 0) {
      fetchPermissions();
    }
  }, [user, permissions.length, fetchPermissions]);

  return (
    <AuthGuard>
      <MainLayout user={user} onLogout={logout} permissions={permissions} />
    </AuthGuard>
  );
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login onLogin={async (u: any) => {
      const store = useUserStore.getState();
      store.login(u);
      await store.fetchPermissions();
    }} />
  },
  {
    path: '/',
    element: <LayoutWrapper />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<Loading />}><Dashboard /></Suspense>
      },
      {
        path: 'projects',
        element: <Suspense fallback={<Loading />}><ProjectList /></Suspense>
      },
      {
        path: 'projects/:id/milestones',
        element: <Suspense fallback={<Loading />}><ProjectMilestonesPage /></Suspense>
      },
      {
        path: 'projects/:id/functions',
        element: <Suspense fallback={<Loading />}><ProjectFunctionsPage /></Suspense>
      },
      {
        path: 'tasks',
        element: <Suspense fallback={<Loading />}><TaskManager /></Suspense>
      },
      {
        path: 'documents',
        element: <Suspense fallback={<Loading />}><DocumentCenter /></Suspense>
      },
      {
        path: 'forum',
        children: [
          { index: true, element: <Suspense fallback={<Loading />}><ForumHome /></Suspense> },
          { path: 'new', element: <Suspense fallback={<Loading />}><PostEditor /></Suspense> },
          { path: 'board/:boardId', element: <Suspense fallback={<Loading />}><PostEditor /></Suspense> },
          { path: 'post/:id', element: <Suspense fallback={<Loading />}><PostDetail /></Suspense> },
        ]
      },
      {
        path: 'suppliers',
        element: <Suspense fallback={<Loading />}><SupplierManager /></Suspense>
      },
      {
        path: 'reports',
        element: <Suspense fallback={<Loading />}><ReportCenter /></Suspense>
      },
      {
        path: 'system/*',
        element: <Suspense fallback={<Loading />}><SystemManager /></Suspense>
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);
