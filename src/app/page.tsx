'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import ThreeScene from '@/components/ThreeScene';
import StatsDashboard from '@/components/StatsDashboard';
import ScheduleTimeline from '@/components/ScheduleTimeline';
import TaskModal from '@/components/TaskModal';
import GeminiAssistantModal from '@/components/GeminiAssistantModal';
import ReminderEngine from '@/components/ReminderEngine';
import AuthModal from '@/components/AuthModal';
import { TaskItem, UserProfile } from '@/lib/models';
import { sound } from '@/lib/sound';

export default function Home() {
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayStr();

  // Initial starter tasks to demonstrate 3D orbit and schedule immediately
  const initialDefaultTasks: TaskItem[] = [
    {
      id: 'task_starter_1',
      userId: 'default',
      title: 'Review System Architecture & Next.js Modules',
      description: 'Go over core data structures, state management, and edge performance.',
      date: todayStr,
      startTime: '09:00',
      endTime: '10:30',
      priority: 'urgent',
      category: 'work',
      completed: false,
      reminderMinutesBefore: 15,
      subtasks: [
        { id: 'st1', title: 'Check Next.js API route definitions', completed: true },
        { id: 'st2', title: 'Verify MongoDB schema indexes', completed: false },
        { id: 'st3', title: 'Benchmark Three.js 60fps render loop', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_starter_2',
      userId: 'default',
      title: 'Deep Focus: Graph Algorithms & Dynamic Programming',
      description: 'Solve shortest path variations and review memorization tables.',
      date: todayStr,
      startTime: '11:00',
      endTime: '12:30',
      priority: 'high',
      category: 'study',
      completed: false,
      reminderMinutesBefore: 15,
      subtasks: [
        { id: 'st4', title: 'Ask Gemini AI about Dijkstra vs Bellman-Ford', completed: false },
        { id: 'st5', title: 'Write unit tests for edge cases', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_starter_3',
      userId: 'default',
      title: 'Cardio, Sunlight & Hydration Break',
      description: '30-minute outdoor jog and screen break to reset cognitive stamina.',
      date: todayStr,
      startTime: '13:00',
      endTime: '13:45',
      priority: 'medium',
      category: 'health',
      completed: true,
      completedAt: new Date().toISOString(),
      reminderMinutesBefore: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_starter_4',
      userId: 'default',
      title: 'Productivity Review with Chronos AI Copilot',
      description: 'Consult built-in Gemini AI to evaluate remaining day goals.',
      date: todayStr,
      startTime: '15:00',
      endTime: '16:00',
      priority: 'medium',
      category: 'personal',
      completed: false,
      reminderMinutesBefore: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_starter_5',
      userId: 'default',
      title: 'Team Strategy & Deployment Review',
      description: 'Prepare Vercel production deployment and MongoDB Atlas verification.',
      date: todayStr,
      startTime: '16:30',
      endTime: '17:30',
      priority: 'high',
      category: 'meeting',
      completed: true,
      completedAt: new Date().toISOString(),
      reminderMinutesBefore: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const [tasks, setTasks] = useState<TaskItem[]>(initialDefaultTasks);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mongoConfigured, setMongoConfigured] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string>(todayStr);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load user session and tasks from local storage / API
  useEffect(() => {
    const initApp = async () => {
      // 1. Check current auth status from backend
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setMongoConfigured(Boolean(data.mongoConfigured));
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.warn('Session check fallback:', err);
      }

      // 2. Load stored tasks from localStorage if available
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('chronos_tasks_data');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTasks(parsed);
            }
          } catch {
            // keep initial tasks
          }
        }
      }
    };

    initApp();
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && tasks.length > 0) {
      localStorage.setItem('chronos_tasks_data', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Toggle completed status
  const handleToggleComplete = useCallback(async (task: TaskItem) => {
    const taskId = task.id || task._id;
    const nextCompleted = !task.completed;
    const nowIso = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => {
        if ((t.id || t._id) === taskId) {
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? nowIso : undefined,
          };
        }
        return t;
      })
    );

    // Call API in background
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          completed: nextCompleted,
          completedAt: nextCompleted ? nowIso : null,
        }),
      });
    } catch {
      // Offline fallback already updated in local state
    }
  }, []);

  // Save (Create or Update) task
  const handleSaveTask = async (taskData: Partial<TaskItem>) => {
    if (editingTask) {
      // Update existing
      const taskId = editingTask.id || editingTask._id;
      const updated: TaskItem = {
        ...editingTask,
        ...taskData,
        updatedAt: new Date().toISOString(),
      } as TaskItem;

      setTasks((prev) => prev.map((t) => ((t.id || t._id) === taskId ? updated : t)));

      try {
        await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: taskId,
            ...taskData,
          }),
        });
      } catch (e) {
        console.warn('Task update fallback:', e);
      }
    } else {
      // Create new
      const newId = 'task_' + Date.now();
      const newTask: TaskItem = {
        id: newId,
        _id: newId,
        userId: user?.id || 'guest',
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        date: taskData.date || currentDate,
        startTime: taskData.startTime || '09:00',
        endTime: taskData.endTime || '10:00',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'work',
        completed: false,
        reminderMinutesBefore: taskData.reminderMinutesBefore ?? 15,
        subtasks: taskData.subtasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);

      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.task && data.task.id) {
            setTasks((prev) =>
              prev.map((t) => (t.id === newId ? { ...newTask, id: data.task.id, _id: data.task.id } : t))
            );
          }
        }
      } catch (e) {
        console.warn('Task creation fallback:', e);
      }
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => (t.id || t._id) !== taskId));

    try {
      await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Task delete fallback:', e);
    }
  };

  // Snooze task
  const handleSnoozeTask = (task: TaskItem, minutes: number) => {
    const taskId = task.id || task._id;
    // Push start time forward by 'minutes'
    try {
      const [h, m] = task.startTime.split(':').map(Number);
      const totalM = h * 60 + m + minutes;
      const newH = String(Math.floor(totalM / 60) % 24).padStart(2, '0');
      const newM = String(totalM % 60).padStart(2, '0');
      const newTime = `${newH}:${newM}`;

      setTasks((prev) =>
        prev.map((t) => ((t.id || t._id) === taskId ? { ...t, startTime: newTime } : t))
      );
    } catch {
      // ignore
    }
  };

  // Handle logout
  const handleLogout = () => {
    sound.playClick();
    setUser(null);
    if (typeof window !== 'undefined') {
      document.cookie = 'chronos_token=; Max-Age=0; path=/;';
    }
  };

  // Ask AI to breakdown a specific task
  const handleAiBreakdownFromTimeline = (task: TaskItem) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="app-root-shell">
      {/* Navigation Bar */}
      <Navbar
        user={user}
        mongoConfigured={mongoConfigured}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenNewTask={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onOpenGemini={() => setIsGeminiModalOpen(true)}
      />

      {/* Main Interactive Stage */}
      <main className="main-stage-container">
        {/* 3D Celestial Core Interactive Viewport */}
        <section className="scene-hero-section">
          <ThreeScene
            tasks={tasks.filter((t) => t.date === currentDate)}
            onSelectTask={(task) => {
              sound.playClick();
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onToggleComplete={handleToggleComplete}
          />
        </section>

        {/* Analytics & Progress Dashboard */}
        <section className="stats-section-wrap">
          <StatsDashboard
            tasks={tasks.filter((t) => t.date === currentDate)}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </section>

        {/* Day-to-Day Life Schedule Timeline */}
        <section className="timeline-section-wrap">
          <ScheduleTimeline
            tasks={tasks}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            onToggleComplete={handleToggleComplete}
            onEditTask={(task) => {
              sound.playClick();
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onAiBreakdown={handleAiBreakdownFromTimeline}
            onOpenNewTask={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            filterStatus={filterStatus}
            selectedCategory={selectedCategory}
          />
        </section>
      </main>

      {/* Active Reminder Notification Engine (Runs in background) */}
      <ReminderEngine
        tasks={tasks}
        onToggleComplete={handleToggleComplete}
        onSnoozeTask={handleSnoozeTask}
      />

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultDate={currentDate}
      />

      <GeminiAssistantModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        tasks={tasks}
        onAddGeneratedTasks={(newTasks) => {
          newTasks.forEach((nt) => {
            handleSaveTask({
              title: nt.title,
              startTime: nt.startTime,
              endTime: nt.endTime,
              category: nt.category as any,
              priority: nt.priority as any,
              date: currentDate,
            });
          });
          setIsGeminiModalOpen(false);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authedUser) => {
          setUser(authedUser);
        }}
        mongoConfigured={mongoConfigured}
      />

      {/* Footer */}
      <footer className="chronos-footer">
        <div className="footer-content">
          <span>CHRONOS 3D Celestial Schedule • Multi-User Ready • Powered by Google Gemini AI & MongoDB</span>
          <span className="footer-links">Vercel Deployment Optimized</span>
        </div>
      </footer>
    </div>
  );
}
