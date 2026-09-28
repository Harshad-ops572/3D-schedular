'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/lib/models';
import { sound } from '@/lib/sound';
import {
  X,
  User,
  Mail,
  Lock,
  Loader2,
  Database,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  mongoConfigured: boolean;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  mongoConfigured,
}: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    sound.playClick();

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { name: name.trim(), email: email.trim(), password }
      : { email: email.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      sound.playCompleteSound();
      setSuccessMsg(data.message || 'Authenticated successfully');
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 500);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    sound.playClick();
    const demoEmail = `explorer_${Math.floor(Math.random() * 1000)}@chronos.ai`;
    setEmail(demoEmail);
    setPassword('demoPass123!');
    setName('Astral Explorer');
    setIsRegister(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel auth-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <User size={18} />
            </div>
            <div>
              <h3 className="modal-heading">
                {isRegister ? 'Create Multi-User Account' : 'Welcome to Chronos 3D'}
              </h3>
              <p className="modal-subheading">
                {isRegister
                  ? 'Connect your schedule to MongoDB cloud sync'
                  : 'Sign in to access your day-to-day schedule'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="auth-tab-row">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsRegister(true);
              setErrorMsg('');
            }}
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
          >
            Create Account
          </button>
        </div>

        {/* MongoDB Status Banner */}
        <div className="auth-mongo-badge">
          <Database size={14} className={mongoConfigured ? 'text-emerald' : 'text-amber'} />
          <div className="auth-mongo-text">
            <span>
              {mongoConfigured
                ? 'Connected to MongoDB Atlas: Cloud accounts enabled'
                : 'Local Sync Active: Set MONGODB_URI to connect your MongoDB Atlas cluster'}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="modal-alert-error">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="modal-alert-success">
            <CheckCircle size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form-body">
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input with-left-icon"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <div className="auth-actions-group">
            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isRegister ? 'Register & Connect' : 'Sign In'}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleQuickDemo}
              className="quick-demo-btn"
              title="Pre-fill with a random demo account"
            >
              <Sparkles size={14} />
              <span>Fill One-Click Demo User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
