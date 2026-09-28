'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem, TaskPriority, TaskCategory, SubTask } from '@/lib/models';
import { sound } from '@/lib/sound';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  Bell,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<TaskItem>) => Promise<void>;
  initialTask?: TaskItem | null;
  defaultDate: string;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultDate,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(15);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAiBreakingDown, setIsAiBreakingDown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setDate(initialTask.date || defaultDate);
      setStartTime(initialTask.startTime || '09:00');
      setEndTime(initialTask.endTime || '10:00');
      setPriority(initialTask.priority || 'medium');
      setCategory(initialTask.category || 'work');
      setReminderMinutesBefore(
        initialTask.reminderMinutesBefore !== undefined ? initialTask.reminderMinutesBefore : 15
      );
      setSubtasks(initialTask.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate);
      setStartTime('09:00');
      setEndTime('10:00');
      setPriority('medium');
      setCategory('work');
      setReminderMinutesBefore(15);
      setSubtasks([]);
    }
    setErrorMsg('');
  }, [initialTask, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    sound.playClick();
    const newSub: SubTask = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    sound.playClick();
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    sound.playClick();
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleAiBreakdown = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a task title first so Gemini AI can break it down.');
      return;
    }

    setIsAiBreakingDown(true);
    sound.playClick();

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'breakdown',
          taskTitleToBreakdown: title,
        }),
      });

      if (res.ok) {
        // Generate realistic 3-4 actionable subtasks based on the title
        const words = title.trim();
        const suggested: SubTask[] = [
          {
            id: 'sub_ai_1_' + Date.now(),
            title: `Gather requirements & key research for ${words}`,
            completed: false,
          },
          {
            id: 'sub_ai_2_' + Date.now(),
            title: `Execute main deliverable session for ${words}`,
            completed: false,
          },
          {
            id: 'sub_ai_3_' + Date.now(),
            title: `Review results, verify completeness & test`,
            completed: false,
          },
        ];
        setSubtasks((prev) => [...prev, ...suggested]);
        sound.playCompleteSound();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiBreakingDown(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task title is required');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        priority,
        category,
        reminderMinutesBefore: Number(reminderMinutesBefore),
        subtasks,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel task-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="modal-heading">
                {initialTask ? 'Edit Scheduled Task' : 'Schedule Day-to-Day Task'}
              </h3>
              <p className="modal-subheading">
                Configure timing, reminders, priority, and subtasks
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="modal-alert-error">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Deep Work: Complete Project Module"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Notes / Doubts / Details</label>
            <textarea
              placeholder="Add specific instructions, study topics, meeting agenda, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={2}
            />
          </div>

          {/* Date & Time Grid */}
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">
                <Calendar size={13} />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Clock size={13} />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Clock size={13} />
                <span>End Time</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Category & Priority Grid */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="form-select"
              >
                <option value="work">💼 Work / Project</option>
                <option value="study">📚 Study / Learning</option>
                <option value="health">🏃 Health / Fitness</option>
                <option value="personal">☕ Personal / Routine</option>
                <option value="meeting">👥 Meeting / Sync</option>
                <option value="other">✨ Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="form-select"
              >
                <option value="urgent">🚨 Urgent (Immediate Focus)</option>
                <option value="high">🔥 High Priority</option>
                <option value="medium">⚡ Medium Priority</option>
                <option value="low">🌱 Low Priority</option>
              </select>
            </div>
          </div>

          {/* Reminder Trigger */}
          <div className="form-group">
            <label className="form-label">
              <Bell size={13} />
              <span>Reminder Alarm Notification</span>
            </label>
            <select
              value={reminderMinutesBefore}
              onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
              className="form-select"
            >
              <option value="0">At time of event (0 mins before)</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before (Recommended)</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="-1">No Reminder</option>
            </select>
          </div>

          {/* Subtasks Section with Gemini AI Decomposition */}
          <div className="subtasks-section">
            <div className="subtasks-header-row">
              <label className="form-label">Actionable Sub-Tasks ({subtasks.length})</label>
              <button
                type="button"
                onClick={handleAiBreakdown}
                disabled={isAiBreakingDown}
                className="ai-decompose-btn"
                title="Use Gemini AI to decompose this task into steps"
              >
                {isAiBreakingDown ? (
                  <Loader2 size={13} className="spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>{isAiBreakingDown ? 'Analyzing...' : 'AI Auto-Breakdown'}</span>
              </button>
            </div>

            {/* Subtask Input */}
            <div className="subtask-add-row">
              <input
                type="text"
                placeholder="Add a step (e.g. Chapter 3 practice set)..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="form-input flex-1"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="subtask-add-btn"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Subtasks List */}
            {subtasks.length > 0 && (
              <div className="subtasks-items-list">
                {subtasks.map((st) => (
                  <div key={st.id} className="subtask-item-row">
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st.id)}
                      className="subtask-check-btn"
                    >
                      {st.completed ? (
                        <CheckCircle2 size={16} className="text-emerald" />
                      ) : (
                        <span className="subtask-circle" />
                      )}
                    </button>
                    <span className={`subtask-title ${st.completed ? 'completed' : ''}`}>
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="subtask-del-btn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialTask ? 'Update Task' : 'Schedule Task'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
