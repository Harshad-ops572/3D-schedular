'use client';

import React, { useState } from 'react';
import { TaskItem, TaskPriority, TaskCategory } from '@/lib/models';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Edit2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  AlertCircle,
} from 'lucide-react';

interface ScheduleTimelineProps {
  tasks: TaskItem[];
  currentDate: string;
  setCurrentDate: (date: string) => void;
  onToggleComplete: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onAiBreakdown: (task: TaskItem) => void;
  onOpenNewTask: () => void;
  filterStatus: 'all' | 'pending' | 'completed';
  selectedCategory: string;
}

export default function ScheduleTimeline({
  tasks,
  currentDate,
  setCurrentDate,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onAiBreakdown,
  onOpenNewTask,
  filterStatus,
  selectedCategory,
}: ScheduleTimelineProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Format display date
  const displayDateObj = new Date(currentDate + 'T00:00:00');
  const formattedDateStr = displayDateObj.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday =
    new Date().toISOString().split('T')[0] === currentDate;

  const handlePrevDay = () => {
    sound.playClick();
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    sound.playClick();
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    sound.playClick();
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  // Filter tasks for current date and criteria
  const dayTasks = tasks
    .filter((t) => t.date === currentDate)
    .filter((t) => {
      if (filterStatus === 'pending') return !t.completed;
      if (filterStatus === 'completed') return t.completed;
      return true;
    })
    .filter((t) => {
      if (selectedCategory === 'all') return true;
      return t.category === selectedCategory;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleToggle = (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCompleted = !task.completed;

    if (nextCompleted) {
      sound.playCompleteSound();
      // Trigger celebratory micro-confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'],
        });
      } catch {
        // ignore if canvas unavailable
      }
    } else {
      sound.playClick();
    }

    onToggleComplete(task);
  };

  const priorityColors: Record<TaskPriority, { text: string; bg: string; border: string }> = {
    urgent: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)' },
    high: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)' },
    medium: { text: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.4)' },
    low: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)' },
  };

  return (
    <div className="timeline-section">
      {/* Date Navigation Header */}
      <div className="timeline-header-bar">
        <div className="date-nav-group">
          <button onClick={handlePrevDay} className="date-nav-btn" title="Previous Day">
            <ChevronLeft size={16} />
          </button>
          <div className="date-display-badge">
            <Calendar size={15} className="calendar-icon" />
            <span className="date-title">{formattedDateStr}</span>
            {isToday && <span className="today-badge">TODAY</span>}
          </div>
          <button onClick={handleNextDay} className="date-nav-btn" title="Next Day">
            <ChevronRight size={16} />
          </button>
          {!isToday && (
            <button onClick={handleToday} className="jump-today-btn">
              Return to Today
            </button>
          )}
        </div>

        {/* Quick Date Picker */}
        <div className="date-picker-wrapper">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
            className="hidden-date-input"
            id="timeline-date-picker"
          />
          <label htmlFor="timeline-date-picker" className="pick-date-label">
            <Calendar size={14} />
            <span>Select Date</span>
          </label>
        </div>
      </div>

      {/* Task List / Timeline Content */}
      <div className="timeline-content">
        {dayTasks.length === 0 ? (
          <div className="timeline-empty-state">
            <div className="empty-icon-halo">
              <Sparkles size={28} className="empty-sparkle" />
            </div>
            <h3 className="empty-title">No tasks scheduled for this day</h3>
            <p className="empty-subtitle">
              Your 3D celestial orbit is clear! Add your tasks or let Gemini AI plan your day.
            </p>
            <div className="empty-actions-row">
              <button onClick={onOpenNewTask} className="empty-primary-btn">
                <span>+ Add Day Task</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="tasks-timeline-track">
            {dayTasks.map((task) => {
              const taskId = task.id || task._id || '';
              const prioStyle = priorityColors[task.priority] || priorityColors.medium;
              const completedSubtasks =
                task.subtasks?.filter((s) => s.completed).length || 0;
              const totalSubtasks = task.subtasks?.length || 0;

              return (
                <div
                  key={taskId}
                  className={`task-timeline-card ${task.completed ? 'is-completed' : ''} ${
                    task.priority === 'urgent' && !task.completed ? 'is-urgent' : ''
                  }`}
                  onClick={() => onEditTask(task)}
                >
                  {/* Time Column */}
                  <div className="task-time-col">
                    <span className="task-start-time">{task.startTime}</span>
                    <span className="task-end-time">{task.endTime}</span>
                  </div>

                  {/* Completion Checkbox */}
                  <div
                    className="task-check-wrap"
                    onClick={(e) => handleToggle(task, e)}
                    title={task.completed ? 'Mark as Pending' : 'Mark as Done'}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={24} className="check-icon-done" />
                    ) : (
                      <Circle size={24} className="check-icon-pending" />
                    )}
                  </div>

                  {/* Main Task Info */}
                  <div className="task-main-details">
                    <div className="task-badges-row">
                      <span
                        className="priority-pill"
                        style={{
                          color: prioStyle.text,
                          backgroundColor: prioStyle.bg,
                          borderColor: prioStyle.border,
                        }}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                      <span className="category-pill">{task.category}</span>
                      {task.reminderMinutesBefore !== undefined && (
                        <span className="reminder-pill" title={`Alarm set ${task.reminderMinutesBefore}m before`}>
                          <Bell size={11} />
                          <span>{task.reminderMinutesBefore}m</span>
                        </span>
                      )}
                    </div>

                    <h4 className="task-card-title">{task.title}</h4>

                    {task.description && (
                      <p className="task-card-desc">{task.description}</p>
                    )}

                    {/* Subtasks summary if present */}
                    {totalSubtasks > 0 && (
                      <div className="task-subtasks-summary">
                        <ListTodo size={13} />
                        <span>
                          {completedSubtasks} of {totalSubtasks} sub-tasks completed
                        </span>
                        <div className="subtask-mini-track">
                          <div
                            className="subtask-mini-fill"
                            style={{
                              width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="task-actions-col" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onAiBreakdown(task);
                      }}
                      className="action-icon-btn ai-breakdown-btn"
                      title="Ask Gemini to break this task into steps"
                    >
                      <Sparkles size={15} />
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        onEditTask(task);
                      }}
                      className="action-icon-btn"
                      title="Edit Task"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        onDeleteTask(taskId);
                      }}
                      className="action-icon-btn delete-btn"
                      title="Delete Task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
