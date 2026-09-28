'use client';

import React from 'react';
import { TaskItem, ScheduleStats, TaskCategory } from '@/lib/models';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  TrendingUp,
  Briefcase,
  BookOpen,
  HeartPulse,
  Coffee,
  Users,
} from 'lucide-react';

interface StatsDashboardProps {
  tasks: TaskItem[];
  filterStatus: 'all' | 'pending' | 'completed';
  setFilterStatus: (status: 'all' | 'pending' | 'completed') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export default function StatsDashboard({
  tasks,
  filterStatus,
  setFilterStatus,
  selectedCategory,
  setSelectedCategory,
}: StatsDashboardProps) {
  // Compute analytics
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const urgentPending = tasks.filter((t) => !t.completed && t.priority === 'urgent').length;

  // Approximate remaining minutes
  const estimatedRemainingMinutes = tasks
    .filter((t) => !t.completed)
    .reduce((acc, t) => {
      // Calculate duration between startTime and endTime if valid
      try {
        const [sh, sm] = t.startTime.split(':').map(Number);
        const [eh, em] = t.endTime.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        return acc + (diff > 0 ? diff : 45);
      } catch {
        return acc + 45;
      }
    }, 0);

  const hoursRemaining = Math.floor(estimatedRemainingMinutes / 60);
  const minutesRemaining = estimatedRemainingMinutes % 60;

  // Category counts
  const categories: { key: TaskCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'work', label: 'Work', icon: <Briefcase size={14} />, color: '#6366f1' },
    { key: 'study', label: 'Study', icon: <BookOpen size={14} />, color: '#8b5cf6' },
    { key: 'health', label: 'Health', icon: <HeartPulse size={14} />, color: '#10b981' },
    { key: 'personal', label: 'Personal', icon: <Coffee size={14} />, color: '#06b6d4' },
    { key: 'meeting', label: 'Meetings', icon: <Users size={14} />, color: '#f59e0b' },
  ];

  // SVG circular progress calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="stats-dashboard-container">
      {/* Top Analytics Cards Grid */}
      <div className="analytics-grid">
        {/* Card 1: Circular Progress Gauge */}
        <div className="analytics-card progress-gauge-card">
          <div className="gauge-visual">
            <svg className="progress-ring-svg" width="96" height="96">
              <circle
                className="progress-ring-bg"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="8"
                fill="transparent"
                r={radius}
                cx="48"
                cy="48"
              />
              <circle
                className="progress-ring-meter"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="48"
                cy="48"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="gauge-percentage">
              <span className="gauge-number">{completionRate}%</span>
              <span className="gauge-label">Done</span>
            </div>
          </div>
          <div className="gauge-details">
            <h3 className="card-headline">Schedule Velocity</h3>
            <p className="card-description">
              {completionRate >= 80
                ? '🔥 Outstanding momentum! Nearly all work cleared.'
                : completionRate >= 50
                ? '⚡ Halfway through your day, keep advancing!'
                : '🚀 Ready for deep focus. Let’s tackle pending tasks.'}
            </p>
          </div>
        </div>

        {/* Card 2: Work Done */}
        <div
          className={`analytics-card metric-card done-card ${filterStatus === 'completed' ? 'active-filter' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'completed' ? 'all' : 'completed')}
          title="Filter Completed Work"
        >
          <div className="metric-header">
            <div className="metric-icon-wrap emerald-icon">
              <CheckCircle2 size={20} />
            </div>
            <span className="metric-badge-label">Completed</span>
          </div>
          <div className="metric-body">
            <div className="metric-value text-emerald">{completed}</div>
            <div className="metric-subtext">of {total} tasks completed</div>
          </div>
          <div className="metric-bar-track">
            <div
              className="metric-bar-fill fill-emerald"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: Work Pending */}
        <div
          className={`analytics-card metric-card pending-card ${filterStatus === 'pending' ? 'active-filter' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
          title="Filter Pending Work"
        >
          <div className="metric-header">
            <div className="metric-icon-wrap cyan-icon">
              <Clock size={20} />
            </div>
            <span className="metric-badge-label">Work Pending</span>
          </div>
          <div className="metric-body">
            <div className="metric-value text-cyan">{pending}</div>
            <div className="metric-subtext">
              ~{hoursRemaining > 0 ? `${hoursRemaining}h ` : ''}{minutesRemaining}m estimated work
            </div>
          </div>
          <div className="metric-bar-track">
            <div
              className="metric-bar-fill fill-cyan"
              style={{ width: `${total > 0 ? Math.round((pending / total) * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Card 4: Urgent Alert */}
        <div className="analytics-card metric-card urgent-card">
          <div className="metric-header">
            <div className="metric-icon-wrap amber-icon">
              {urgentPending > 0 ? <AlertTriangle size={20} /> : <Flame size={20} />}
            </div>
            <span className="metric-badge-label">
              {urgentPending > 0 ? 'Urgent Action' : 'Focus Streak'}
            </span>
          </div>
          <div className="metric-body">
            <div className="metric-value text-amber">
              {urgentPending > 0 ? urgentPending : '100%'}
            </div>
            <div className="metric-subtext">
              {urgentPending > 0 ? 'high priority items pending' : 'Zero urgent bottlenecks'}
            </div>
          </div>
          <div className="metric-footer-tag">
            <TrendingUp size={13} />
            <span>Optimal schedule balance</span>
          </div>
        </div>
      </div>

      {/* Filter and Category Pills */}
      <div className="filter-controls-row">
        {/* Status Segmented Control */}
        <div className="segmented-control">
          <button
            onClick={() => setFilterStatus('all')}
            className={`seg-btn ${filterStatus === 'all' ? 'active' : ''}`}
          >
            All Work ({total})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`seg-btn ${filterStatus === 'pending' ? 'active text-cyan' : ''}`}
          >
            Pending ({pending})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`seg-btn ${filterStatus === 'completed' ? 'active text-emerald' : ''}`}
          >
            Done ({completed})
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="category-chips-scroll">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`cat-chip ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const catTasks = tasks.filter((t) => t.category === cat.key);
            const catDone = catTasks.filter((t) => t.completed).length;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(selectedCategory === cat.key ? 'all' : cat.key)}
                className={`cat-chip ${selectedCategory === cat.key ? 'active' : ''}`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span className="cat-count">
                  {catDone}/{catTasks.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
