import { NextRequest, NextResponse } from 'next/server';

interface GeminiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  prompt?: string;
  messages?: GeminiMessage[];
  action?: 'chat' | 'breakdown' | 'schedule_day' | 'analyze_pending';
  taskContext?: {
    total: number;
    pendingCount: number;
    completedCount: number;
    pendingTasks: Array<{ title: string; priority: string; category: string; startTime: string; date: string }>;
    completedTasks: Array<{ title: string; category: string }>;
  };
  taskTitleToBreakdown?: string;
  userApiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const {
      prompt = '',
      messages = [],
      action = 'chat',
      taskContext,
      taskTitleToBreakdown,
      userApiKey,
    } = body;

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Context summary for the AI
    const contextSummary = taskContext
      ? `\nCURRENT USER PRODUCTIVITY CONTEXT:
- Total Tasks: ${taskContext.total}
- Work Pending: ${taskContext.pendingCount}
- Work Done: ${taskContext.completedCount}
- Pending Tasks List: ${taskContext.pendingTasks.map((t) => `• [${t.priority.toUpperCase()}] ${t.title} (${t.category} at ${t.startTime})`).join('; ') || 'None'}
- Completed Tasks List: ${taskContext.completedTasks.map((t) => `• ${t.title}`).join('; ') || 'None'}
`
      : '';

    const systemInstruction = `You are "Chronos AI", an elite 3D productivity companion, schedule architect, and intellectual mentor built into Chronos 3D. 
Your goal is to answer any doubts the user has (technical, academic, life habits, or productivity), help them schedule their day-to-day life, keep track of pending work vs completed work, and provide concise, motivating, and actionable advice.
Maintain a futuristic, encouraging, sharp, and structured tone. Use markdown formatting with bullet points and bold highlights where appropriate.
${contextSummary}`;

    // If an API key is available, call the real Google Gemini API
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

        // Format contents for Gemini API
        let userContent = prompt;
        if (action === 'breakdown' && taskTitleToBreakdown) {
          userContent = `Please break down the following high-level task into 4 to 6 specific, actionable sub-tasks with estimated time in minutes. Output valid JSON in the format: [{"title": "Step 1...", "estimatedMinutes": 30}]: "${taskTitleToBreakdown}"`;
        } else if (action === 'schedule_day') {
          userContent = `Create an optimized day-to-day schedule based on this request: "${prompt}". Provide a clear timeline from morning to evening, balanced work and breaks, and list what work is pending. Also return an array of suggested tasks.`;
        } else if (action === 'analyze_pending') {
          userContent = `Analyze my current pending work vs completed work. Give me a clear prioritization strategy (e.g. Eisenhower matrix or 2-minute rule), estimate how much time is needed, and give 3 targeted steps to tackle the pending tasks today.`;
        }

        const formattedContents = [
          ...messages.slice(-6).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser request: ${userContent}` }],
          },
        ];

        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: formattedContents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const replyText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'I have processed your request. How else can I assist your schedule today?';

          return NextResponse.json({
            reply: replyText,
            source: 'gemini_api',
            model: 'gemini-2.5-flash',
          });
        } else {
          const errData = await response.text();
          console.warn('Gemini API returned error, falling back to smart local assistant:', errData);
        }
      } catch (geminiError) {
        console.warn('Gemini API fetch failed, using smart engine:', geminiError);
      }
    }

    // Smart Fallback Productivity AI Engine (Runs when no API key or during offline testing)
    let reply = '';
    const query = (prompt || taskTitleToBreakdown || '').toLowerCase();

    if (action === 'breakdown') {
      const task = taskTitleToBreakdown || 'Your Task';
      reply = `### 🎯 Actionable Breakdown for: "${task}"\n\n` +
        `Here is a step-by-step roadmap to conquer this pending item:\n\n` +
        `1. **Phase 1: Clarify & Outline (15 mins)**\n   • Define the exact deliverable and gathering necessary resources.\n` +
        `2. **Phase 2: Core Deep Work Session (45 mins)**\n   • Eliminate all distractions and execute the primary heavy lifting.\n` +
        `3. **Phase 3: Review & Refine (20 mins)**\n   • Double check for errors, completeness, and edge cases.\n` +
        `4. **Phase 4: Wrap-up & Archive (10 mins)**\n   • Document next steps and mark as Completed in your 3D Orbit.\n\n` +
        `💡 *Tip: Add these 4 steps directly as sub-tasks in your task card!*`;
    } else if (action === 'analyze_pending') {
      const pendingCount = taskContext?.pendingCount ?? 0;
      const completedCount = taskContext?.completedCount ?? 0;
      reply = `### 📊 Chronos Productivity Analysis\n\n` +
        `• **Current Status**: You have **${pendingCount} pending task(s)** and **${completedCount} completed task(s)**.\n` +
        `• **Completion Velocity**: ${taskContext?.total ? Math.round((completedCount / taskContext.total) * 100) : 0}% of your schedule is complete.\n\n` +
        `### 🚀 Recommended Battle Plan:\n` +
        `1. **Tackle the Highest Impact First**: Start with your Urgent/High priority items before 1:00 PM when cognitive stamina peaks.\n` +
        `2. **25/5 Pomodoro Cycle**: Dedicate 25 minutes of unbroken focus to the most critical pending task.\n` +
        `3. **Clear the Backlog**: Mark tasks done as you finish to see your 3D celestial core glow with progress!`;
    } else if (query.includes('schedule') || query.includes('plan my day') || action === 'schedule_day') {
      reply = `### 🗓️ Recommended High-Productivity Daily Schedule\n\n` +
        `Here is an optimal structure tailored for peak focus:\n\n` +
        `• **08:30 AM - 09:00 AM**: 🌅 Morning Kickoff & Review Daily Priorities\n` +
        `• **09:00 AM - 11:30 AM**: ⚡ Deep Work Block #1 (Urgent pending tasks)\n` +
        `• **11:30 AM - 11:45 AM**: ☕ Active Rest & Hydration\n` +
        `• **11:45 AM - 01:00 PM**: 📚 Study / Execution Block #2\n` +
        `• **01:00 PM - 02:00 PM**: 🥗 Nourishing Lunch & Mind Recharge\n` +
        `• **02:00 PM - 04:00 PM**: 💼 Collaborative Tasks & Communication\n` +
        `• **04:30 PM - 05:30 PM**: 🏃 Health / Workout / Movement\n` +
        `• **06:00 PM - 06:30 PM**: 🎯 Evening Review & Setting Tomorrow's Reminders\n\n` +
        `*(To connect live Gemini 2.5 Flash API, configure \`GEMINI_API_KEY\` in your .env or click the AI Settings icon)*`;
    } else if (query.includes('remind') || query.includes('notification')) {
      reply = `### ⏰ Setting Smart Reminders in Chronos 3D\n\n` +
        `You can set reminders for any task:\n` +
        `1. Click **+ Add Task** or edit any existing task in your timeline.\n` +
        `2. Set the **Reminder Alert** (At time of event, 5 min, 15 min, or 30 min before).\n` +
        `3. Ensure browser notifications are enabled when prompted.\n` +
        `4. Chronos will chime with a celestial tone and display a desktop notification alert when the time arrives!`;
    } else {
      reply = `### 🤖 Chronos AI Copilot\n\n` +
        `I am your intelligent productivity and doubt-solving companion. You can ask me:\n\n` +
        `• **Study & Technical Doubts**: e.g., "Explain how WebSockets work", "Help me understand dynamic programming"\n` +
        `• **Daily Life & Routine**: e.g., "Help me schedule my day for exams", "How to manage 6 pending tasks without feeling overwhelmed"\n` +
        `• **Task Decomposition**: Ask me to break any difficult project down into sub-tasks.\n\n` +
        `> **Pro-Tip**: Provide your \`GEMINI_API_KEY\` in \`.env.local\` or the top bar settings to unlock unlimited direct multimodal Gemini 2.5 Flash intelligence!`;
    }

    return NextResponse.json({
      reply,
      source: 'chronos_core_assistant',
      hasApiKey: Boolean(apiKey),
    });
  } catch (error) {
    console.error('Gemini assistant error:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating AI response.' },
      { status: 500 }
    );
  }
}
