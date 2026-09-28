'use client';

import React, { useEffect, useState } from 'react';
import { TaskItem } from '@/lib/models';
import { sound } from '@/lib/sound';
import { Bell, CheckCircle2, Clock, X, AlertTriangle } from 'lucide-react';

interface ReminderEngineProps {
  tasks: TaskItem[];
  onToggleComplete: (task: TaskItem) => void;
  onSnoozeTask: (task: TaskItem, minutes: number) => void;
}

interface ActiveAlert {
  task: TaskItem;
  id: string;
  triggerTime: string;
}

export default function ReminderEngine({
  tasks,
  onToggleComplete,
  onSnoozeTask,
}: ReminderEngineProps) {
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [hasRequestedPermission, setHasRequestedPermission] = useState<boolean>(false);
  const [triggeredTaskIds, setTriggeredTaskIds] = useState<Set<string>>(new Set());

  // Request notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(() => {
          setHasRequestedPermission(true);
        });
      } else {
        setHasRequestedPermission(true);
      }
    }
  }, []);

  // Check reminders every 20 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentDay = String(now.getDate()).padStart(2, '0');
      const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
      const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();

      tasks.forEach((task) => {
        const taskId = task.id || task._id;
        if (!taskId || task.completed) return;
        if (task.reminderMinutesBefore === -1 || task.reminderMinutesBefore === undefined) return;
        if (triggeredTaskIds.has(taskId)) return;

        // Check if task date is today
        if (task.date === todayStr) {
          try {
            const [sh, sm] = task.startTime.split(':').map(Number);
            const taskStartMinutes = sh * 60 + sm;
            const reminderTimeMinutes = taskStartMinutes - task.reminderMinutesBefore;

            // Trigger if within 2 minutes of reminder time
            if (nowTotalMinutes >= reminderTimeMinutes && nowTotalMinutes <= taskStartMinutes + 10) {
              // Sound alert
              sound.playReminderAlert();

              // Browser native desktop notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(`⏰ Chronos Reminder: ${task.title}`, {
                    body: `Scheduled at ${task.startTime}. Priority: ${task.priority.toUpperCase()}`,
                    icon: '/favicon.ico',
                  });
                } catch {
                  // ignore
                }
              }

              // In-app alert HUD toast
              setActiveAlerts((prev) => [
                ...prev.filter((a) => a.id !== taskId),
                {
                  task,
                  id: taskId,
                  triggerTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);

              setTriggeredTaskIds((prev) => new Set(prev).add(taskId));
            }
          } catch {
            // invalid time format
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [tasks, triggeredTaskIds]);

  const dismissAlert = (alertId: string) => {
    sound.playClick();
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleCompleteFromAlert = (task: TaskItem, alertId: string) => {
    sound.playCompleteSound();
    onToggleComplete(task);
    dismissAlert(alertId);
  };

  const handleSnooze = (task: TaskItem, alertId: string) => {
    sound.playClick();
    onSnoozeTask(task, 5);
    dismissAlert(alertId);
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="active-reminders-container">
      {activeAlerts.map((alert) => (
        <div key={alert.id} className="reminder-toast">
          <div className="reminder-toast-accent" />
          <div className="reminder-toast-content">
            <div className="toast-header-row">
              <div className="toast-tag">
                <Bell size={13} className="bell-ring" />
                <span>TASK REMINDER</span>
              </div>
              <span className="toast-time">{alert.triggerTime}</span>
              <button onClick={() => dismissAlert(alert.id)} className="toast-close-btn">
                <X size={14} />
              </button>
            </div>

            <h4 className="toast-title">{alert.task.title}</h4>

            <div className="toast-meta-row">
              <div className="toast-meta-item">
                <Clock size={12} />
                <span>Starts at {alert.task.startTime}</span>
              </div>
              <span className={`toast-priority-pill ${alert.task.priority}`}>
                {alert.task.priority.toUpperCase()}
              </span>
            </div>

            <div className="toast-actions-row">
              <button
                onClick={() => handleCompleteFromAlert(alert.task, alert.id)}
                className="toast-done-btn"
              >
                <CheckCircle2 size={14} />
                <span>Mark as Done</span>
              </button>
              <button
                onClick={() => handleSnooze(alert.task, alert.id)}
                className="toast-snooze-btn"
              >
                <span>Snooze 5m</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
