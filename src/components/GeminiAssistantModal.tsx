'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TaskItem } from '@/lib/models';
import { sound } from '@/lib/sound';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Key,
  CalendarPlus,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Flame,
} from 'lucide-react';

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onAddGeneratedTasks: (tasks: Array<{ title: string; startTime: string; endTime: string; category: string; priority: string }>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

export default function GeminiAssistantModal({
  isOpen,
  onClose,
  tasks,
  onAddGeneratedTasks,
}: GeminiAssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: `Greetings! I am **Chronos AI**, your built-in intelligence core. 
I can help you **clear academic & technical doubts**, **schedule your day-to-day life**, **prioritize pending work**, and **stay focused**.

Ask me any doubt or try one of the instant prompts below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load custom key from local storage if previously saved
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chronos_gemini_key') || '';
      setCustomKey(saved);
    }
  }, []);

  const handleSaveKey = () => {
    sound.playClick();
    if (typeof window !== 'undefined') {
      localStorage.setItem('chronos_gemini_key', customKey.trim());
    }
    setShowKeySettings(false);
  };

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Gather current context
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputVal).trim();
    if (!promptText || isLoading) return;

    sound.playClick();
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          userApiKey: customKey || undefined,
          taskContext: {
            total: tasks.length,
            pendingCount: pendingTasks.length,
            completedCount: completedTasks.length,
            pendingTasks: pendingTasks.slice(0, 5).map((t) => ({
              title: t.title,
              priority: t.priority,
              category: t.category,
              startTime: t.startTime,
              date: t.date,
            })),
            completedTasks: completedTasks.slice(0, 5).map((t) => ({
              title: t.title,
              category: t.category,
            })),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        sound.playCompleteSound();
        const geminiMsg: ChatMessage = {
          id: 'gemini_' + Date.now(),
          sender: 'gemini',
          text: data.reply || 'Your request has been processed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, geminiMsg]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'gemini',
        text: 'Chronos AI encountered a momentary connection disturbance. Please retry or verify your network.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: '🤔 Ask a Doubt / Concept', prompt: 'Can you clearly explain the difference between processes and threads with a real-life analogy?' },
    { label: '🗓️ Plan My Productive Day', prompt: 'Please design an optimized daily schedule from 9 AM to 6 PM with deep work sessions, breaks, and study.' },
    { label: '⚡ Prioritize My Pending Work', prompt: 'Look at my current pending tasks and tell me the most strategic order to conquer them today.' },
    { label: '🔥 Quick Motivation & Focus', prompt: 'Give me a fast 2-minute motivational boost and mental reset to start my pending work.' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel gemini-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gemini-modal-header">
          <div className="gemini-header-info">
            <div className="gemini-avatar-glow">
              <Sparkles size={20} className="gemini-star-icon" />
            </div>
            <div>
              <div className="gemini-title-row">
                <h3 className="gemini-title">CHRONOS <span className="text-cyan">AI</span></h3>
                <span className="gemini-model-badge">Gemini 2.5 Flash</span>
              </div>
              <p className="gemini-subtitle">
                Context-aware schedule strategist & doubt solver
              </p>
            </div>
          </div>

          <div className="gemini-header-actions">
            <button
              onClick={() => {
                sound.playClick();
                setShowKeySettings(!showKeySettings);
              }}
              className={`gemini-key-toggle ${customKey ? 'has-key' : ''}`}
              title="Configure Custom Gemini API Key"
            >
              <Key size={15} />
              <span>{customKey ? 'Key Active' : 'API Key'}</span>
            </button>

            <button onClick={onClose} className="modal-close-btn">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* API Key Drawer */}
        {showKeySettings && (
          <div className="gemini-key-drawer">
            <div className="drawer-header">
              <Key size={14} className="text-cyan" />
              <span>Google Gemini API Key (Optional)</span>
            </div>
            <p className="drawer-info">
              Chronos comes with built-in productivity intelligence out of the box. You can also connect your own free Google AI Studio key:
            </p>
            <div className="drawer-input-row">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="drawer-input"
              />
              <button onClick={handleSaveKey} className="drawer-save-btn">
                Save
              </button>
            </div>
          </div>
        )}

        {/* Live Context Banner */}
        <div className="gemini-context-banner">
          <div className="ctx-item">
            <span className="ctx-dot pending" />
            <span>Pending Work: <strong>{pendingTasks.length}</strong></span>
          </div>
          <div className="ctx-item">
            <span className="ctx-dot done" />
            <span>Completed Work: <strong>{completedTasks.length}</strong></span>
          </div>
          <div className="ctx-item">
            <Flame size={12} className="text-amber" />
            <span>AI Live Memory Active</span>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="gemini-chat-log">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble-row ${m.sender === 'user' ? 'user-row' : 'gemini-row'}`}
            >
              <div className="chat-avatar">
                {m.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div className="chat-bubble-content">
                <div className="chat-bubble-meta">
                  <span className="chat-sender-name">
                    {m.sender === 'user' ? 'You' : 'Chronos AI'}
                  </span>
                  <span className="chat-time">{m.timestamp}</span>
                </div>
                <div className="chat-bubble-text markdown-render">
                  {/* Render simple markdown with bold and linebreaks */}
                  {m.text.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={idx} className="md-h4">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('• ') || line.startsWith('- ')) {
                      return (
                        <div key={idx} className="md-bullet">
                          <span>•</span>
                          <span>{line.replace(/^[•-]\s*/, '')}</span>
                        </div>
                      );
                    }
                    if (!line.trim()) {
                      return <div key={idx} className="md-spacer" />;
                    }
                    return <p key={idx} className="md-p">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble-row gemini-row">
              <div className="chat-avatar">
                <Bot size={15} />
              </div>
              <div className="chat-bubble-content">
                <div className="chat-loading-dots">
                  <Loader2 size={16} className="spin text-cyan" />
                  <span>Synthesizing intelligence & schedule guidance...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="quick-prompts-bar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
              className="quick-prompt-chip"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="gemini-input-bar">
          <input
            type="text"
            placeholder="Ask any doubt, request a schedule, or seek advice..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            className="gemini-text-input"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputVal.trim()}
            className="gemini-send-btn"
          >
            {isLoading ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}
