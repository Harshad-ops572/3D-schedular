'use client';

import React, { useEffect, useState } from 'react';
import { UserProfile } from '@/lib/models';
import { sound } from '@/lib/sound';
import {
  Sparkles,
  Plus,
  Volume2,
  VolumeX,
  User,
  LogOut,
  Database,
  Radio,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  mongoConfigured: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenNewTask: () => void;
  onOpenGemini: () => void;
}

export default function Navbar({
  user,
  mongoConfigured,
  onOpenAuth,
  onLogout,
  onOpenNewTask,
  onOpenGemini,
}: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [ambientActive, setAmbientActive] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playClick();
    }
  };

  const handleToggleAmbient = () => {
    sound.playClick();
    const nextState = !ambientActive;
    setAmbientActive(nextState);
    sound.toggleAmbient(nextState);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <div className="navbar-brand">
          <div className="brand-logo-icon">
            <div className="brand-orb-pulse" />
            <Sparkles size={18} className="brand-sparkle" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">CHRONOS <span className="text-gradient">3D</span></h1>
            <span className="brand-subtitle">Celestial Productivity Core</span>
          </div>
        </div>

        {/* Live Clock HUD */}
        <div className="navbar-clock-badge">
          <Clock size={14} className="clock-icon" />
          <span className="clock-time">{currentTime || '00:00:00'}</span>
          <span className="clock-divider">•</span>
          <span className="clock-date">{currentDate}</span>
        </div>

        {/* Status Badges & Controls */}
        <div className="navbar-actions">
          {/* MongoDB Connection Status */}
          <div
            className={`mongo-status-pill ${mongoConfigured ? 'connected' : 'local'}`}
            title={
              mongoConfigured
                ? 'MongoDB Atlas Database: Connected & Active'
                : 'Local Sync Mode: Set MONGODB_URI in .env to persist to MongoDB Atlas'
            }
          >
            <Database size={13} />
            <span>{mongoConfigured ? 'MongoDB Atlas' : 'Local / Demo Mode'}</span>
            <span className="status-dot" />
          </div>

          {/* Sound Synthesizer Controls */}
          <button
            onClick={handleToggleSound}
            className={`icon-btn ${isMuted ? 'muted' : ''}`}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={handleToggleAmbient}
            className={`icon-btn ambient-btn ${ambientActive ? 'active' : ''}`}
            title="Toggle Celestial Ambient Hum"
          >
            <Radio size={14} className={ambientActive ? 'pulse-anim' : ''} />
            <span className="btn-label-desktop">Spatial Audio</span>
          </button>

          {/* Gemini AI Trigger Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenGemini();
            }}
            className="gemini-trigger-btn"
          >
            <Sparkles size={16} className="sparkle-spin" />
            <span>Ask Gemini AI</span>
          </button>

          {/* New Task Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenNewTask();
            }}
            className="new-task-btn"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>

          {/* User Account / Auth Dropdown */}
          {user ? (
            <div className="user-profile-menu">
              <div className="user-badge" title={`Signed in as ${user.email}`}>
                <div className="user-avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</div>
                <span className="user-name-display">{user.name.split(' ')[0]}</span>
              </div>
              <button onClick={onLogout} className="logout-btn" title="Sign Out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="signin-nav-btn">
              <User size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
