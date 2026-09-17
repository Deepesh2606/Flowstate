import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeTasks, addTask, updateTask, deleteTask } from '../firebase/firestore';

export const useTasks = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeTasks(currentUser.uid, (data, err) => {
      setTasks(data || []);
      setLoading(false);
      if (err) console.error('Tasks loading error:', err);
    });
    return unsub;
  }, [currentUser]);

  const handleAddTask = async (text) => {
    if (!currentUser || !text.trim()) return;
    await addTask(currentUser.uid, text.trim());
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    if (!currentUser) return;
    await updateTask(currentUser.uid, taskId, { completed: !currentStatus });
  };

  const handleDeleteTask = async (taskId) => {
    if (!currentUser) return;
    await deleteTask(currentUser.uid, taskId);
  };

  return {
    tasks,
    loading,
    addTask: handleAddTask,
    toggleTask: handleToggleTask,
    deleteTask: handleDeleteTask,
  };
};
