import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';

export const useTasks = (params = {}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskService.getAll(params);
      setTasks(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateTaskStatus = async (id, status) => {
    const res = await taskService.updateStatus(id, status);
    setTasks((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
    return res.data.data;
  };

  const createTask = async (data) => {
    const res = await taskService.create(data);
    setTasks((prev) => [...prev, res.data.data]);
    return res.data.data;
  };

  const updateTask = async (id, data) => {
    const res = await taskService.update(id, data);
    setTasks((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
    return res.data.data;
  };

  const deleteTask = async (id) => {
    await taskService.remove(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  return { tasks, setTasks, loading, error, fetchTasks, updateTaskStatus, createTask, updateTask, deleteTask };
};
