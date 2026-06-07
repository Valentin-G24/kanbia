import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectService.getAll();
      setProjects(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (data) => {
    const res = await projectService.create(data);
    setProjects((prev) => [res.data.data, ...prev]);
    return res.data.data;
  };

  const updateProject = async (id, data) => {
    const res = await projectService.update(id, data);
    setProjects((prev) => prev.map((p) => (p._id === id ? res.data.data : p)));
    return res.data.data;
  };

  const deleteProject = async (id) => {
    await projectService.remove(id);
    setProjects((prev) => prev.filter((p) => p._id !== id));
  };

  return { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject };
};
