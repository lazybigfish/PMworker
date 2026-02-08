import { useState, useCallback } from 'react';
import request from '@/api/request';
import { message } from 'antd';

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  health_score: number;
  department?: string;
  customer?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  priority: string;
  manager_id?: number;
  manager_name?: string;
  is_archived: number;
  current_phase?: string;
}

export interface ProjectDetail extends Project {
  suppliers: any[];
  members: any[];
  logs: any[];
}

export interface Milestone {
  id: number;
  project_id: number;
  template_id: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'PAUSED';
  actual_start_date?: string;
  actual_end_date?: string;
  remarks?: string;
  output_files?: string;
  phase: string;
  name: string;
  description: string;
  is_required: number;
  order_index: number;
  category: string;
  direction: string;
  importance: number;
  input_docs: string;
  output_docs: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectDetail | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get<Project[]>('/projects');
      setProjects(res.data);
    } catch (err) {
      message.error('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjectDetails = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await request.get<ProjectDetail>(`/projects/${id}/details`);
      setCurrentProject(res.data);
    } catch (err) {
      message.error('加载项目详情失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (data: any) => {
    try {
      await request.post('/projects', data);
      message.success('项目创建成功');
      fetchProjects();
      return true;
    } catch (err: any) {
      message.error(err.response?.data?.error || '创建失败');
      return false;
    }
  };

  const updateProject = async (id: number, data: any) => {
    try {
      await request.put(`/projects/${id}`, data);
      message.success('更新成功');
      if (currentProject && currentProject.id === id) {
        fetchProjectDetails(id);
      }
      fetchProjects();
      return true;
    } catch (err: any) {
      message.error('更新失败');
      return false;
    }
  };

  const transferManager = async (id: number, newManagerId: number) => {
    try {
      await request.post(`/projects/${id}/transfer`, { newManagerId });
      message.success('项目负责人已移交');
      fetchProjectDetails(id);
      return true;
    } catch (err: any) {
      message.error(err.response?.data?.error || '移交失败');
      return false;
    }
  };

  const addMember = async (id: number, userId: number) => {
    try {
      await request.post(`/projects/${id}/members`, { userId });
      message.success('添加成员成功');
      fetchProjectDetails(id);
      return true;
    } catch (err: any) {
      message.error(err.response?.data?.error || '添加失败');
      return false;
    }
  };

  const removeMember = async (id: number, userIds: number[]) => {
    try {
      await request.post(`/projects/${id}/members/remove`, { userIds });
      message.success('移除成员成功');
      fetchProjectDetails(id);
      return true;
    } catch (err: any) {
      message.error(err.response?.data?.error || '移除失败');
      return false;
    }
  };

  const fetchMilestones = useCallback(async (projectId: number) => {
    try {
      const res = await request.get<Milestone[]>(`/projects/${projectId}/milestones`);
      setMilestones(res.data);
    } catch (err) {
      message.error('加载里程碑失败');
    }
  }, []);

  const updateMilestone = async (id: number, data: Partial<Milestone>) => {
    try {
      await request.put(`/milestones/${id}`, data);
      message.success('更新成功');
      setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      return true;
    } catch (err) {
      message.error('更新失败');
      return false;
    }
  };

  return {
    projects,
    loading,
    currentProject,
    milestones,
    fetchProjects,
    fetchProjectDetails,
    fetchMilestones,
    createProject,
    updateProject,
    updateMilestone,
    transferManager,
    addMember,
    removeMember,
    setCurrentProject
  };
};
