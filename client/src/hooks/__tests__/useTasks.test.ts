import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from '../useTasks';
import request from '@/api/request';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock request
vi.mock('@/api/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}));

describe('useTasks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchTasks should update tasks state', async () => {
    const mockTasks = [{ id: 1, name: 'Test Task' }];
    (request.get as any).mockResolvedValue({ data: mockTasks });

    const { result } = renderHook(() => useTasks());

    // Initial state
    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);

    // Call fetchTasks
    await waitFor(async () => {
        await result.current.fetchTasks();
    });

    // Check if request was called
    expect(request.get).toHaveBeenCalledWith('/tasks', { params: {} });
    
    // Check if state was updated
    await waitFor(() => {
        expect(result.current.tasks).toEqual(mockTasks);
    });
  });
});
