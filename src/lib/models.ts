export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskCategory = 'work' | 'study' | 'health' | 'personal' | 'meeting' | 'other';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  _id?: string;
  id?: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  completedAt?: string;
  reminderMinutesBefore?: number; // e.g., 0, 5, 15, 30, 60
  reminderTriggered?: boolean;
  subtasks?: SubTask[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface ScheduleStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number; // 0 - 100
  urgentPending: number;
  streakDays: number;
  estimatedRemainingMinutes: number;
  categoryCounts: Record<TaskCategory, { total: number; done: number; pending: number }>;
}
