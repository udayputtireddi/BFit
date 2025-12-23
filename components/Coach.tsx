
import React, { useState, useEffect, useRef } from 'react';
import { getCoachResponse } from '../services/geminiService';
import { ChatMessage, ChatThread, WorkoutSession } from '../types';
import { Send, Bot, User, Loader2, Sparkles, Lightbulb } from 'lucide-react';
import { fetchChatThreads, createChatThread, fetchThreadMessages, addChatMessages, renameThread } from '../services/coachHistory';

interface CoachProps {
    history: WorkoutSession[];
    userId: string | null;
}

const Coach: React.FC<CoachProps> = ({ history, userId }) => {
  const defaultGreeting: ChatMessage = { role: 'model', text: "I'm IronBot. Ask me about your split, form cues, or recovery. Let's get huge." };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loadingThreadMessages, setLoadingThreadMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, insights]);

  useEffect(() => {
    const loadThreadsAndMessages = async () => {
      if (!userId) {
        setMessages([defaultGreeting]);
        setThreads([]);
        setSelectedThreadId(null);
        setLoadingHistory(false);
        return;
      }
      setLoadingHistory(true);
      try {
        const fetchedThreads = await fetchChatThreads(userId);
        let activeThread = fetchedThreads[0];
        if (!activeThread) {
          activeThread = await createChatThread(userId, 'New Chat');
          fetchedThreads.unshift(activeThread);
        }
        setThreads(fetchedThreads);
        setSelectedThreadId(activeThread.id);
        setError(null);
      } catch (err) {
        console.error('Failed to load chat history', err);
        setMessages([defaultGreeting]);
        setError('Could not load chat history. Chat will still work but may not save.');
      } finally {
        setLoadingHistory(false);
      }
    };
    loadThreadsAndMessages();
  }, [userId]);

  useEffect(() => {
    const loadMessagesForThread = async () => {
      if (!userId || !selectedThreadId) return;
      setLoadingThreadMessages(true);
      try {
        const saved = await fetchThreadMessages(userId, selectedThreadId);
        setMessages(saved.length ? saved : [defaultGreeting]);
      } catch (err) {
        console.error('Failed to load thread messages', err);
        setMessages([defaultGreeting]);
        setError('Could not load chat history. Chat will still work but may not save.');
      } finally {
        setLoadingThreadMessages(false);
      }
    };
    if (selectedThreadId) {
      loadMessagesForThread();
    }
  }, [selectedThreadId, userId]);

  // Generate Proactive Insights
  useEffect(() => {
      const newInsights: string[] = [];
      if (history.length > 3) {
          // Check for Consistency
          const lastDate = new Date(history[0].date);
          const prevDate = new Date(history[1].date);
          const diffDays = Math.floor((lastDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays <= 2) {
             newInsights.push("🔥 You're on a roll! Consistency is key to hypertrophy.");
          } else if (diffDays > 7) {
             newInsights.push("⚠️ It's been over a week since your last session. Let's get back on track.");
          }

          // Check for Volume Stall (Simple logic: check if last session volume < previous)
          const lastVol = history[0].exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
          const prevVol = history[1].exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
          
          if (lastVol < prevVol) {
              newInsights.push(`📉 Your volume dropped last session (${lastVol} sets vs ${prevVol}). Ensure you're recovering well.`);
          }
      } else if (history.length === 0) {
          newInsights.push("📝 Start logging workouts to unlock personalized training insights.");
      }
      setInsights(newInsights);
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!userId) {
      setError('Sign in to save chat history.');
      return;
    }
    if (!selectedThreadId) {
      setError('No chat selected.');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Construct context from history for better advice
      const lastWorkout = history.length > 0 ? history[0] : null;
      const context = lastWorkout 
          ? `Last workout was ${lastWorkout.name} on ${new Date(lastWorkout.date).toLocaleDateString()}. Focus: ${lastWorkout.exercises.map(e => e.name).join(', ')}.` 
          : "User has no recent workout history.";

      const responseText = await getCoachResponse(userMsg.text, context);
      const modelMsg: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMsg]);
      try {
        const preview = responseText.slice(0, 120);
        await addChatMessages(userId, selectedThreadId, [userMsg, modelMsg], preview);
        // Update thread title based on first user message
        const existing = threads.find((t) => t.id === selectedThreadId);
        if (existing && existing.title === 'New Chat') {
          const newTitle = userMsg.text.slice(0, 40) || 'New Chat';
          await renameThread(userId, selectedThreadId, newTitle);
          setThreads((prev) => {
            const updated = prev.map((t) => (t.id === selectedThreadId ? { ...t, title: newTitle, preview } : t));
            const target = updated.find((t) => t.id === selectedThreadId)!;
            return [target, ...updated.filter((t) => t.id !== selectedThreadId)];
          });
        } else {
          setThreads((prev) => {
            const updated = prev.map((t) => (t.id === selectedThreadId ? { ...t, preview } : t));
            const target = updated.find((t) => t.id === selectedThreadId)!;
            return [target, ...updated.filter((t) => t.id !== selectedThreadId)];
          });
        }
      } catch (err) {
        console.error('Failed to persist chat messages', err);
        setError('Chat saved locally but not synced. Will retry on next messages.');
      }
    } catch (error) {
      console.error('Coach chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble responding right now. Try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!userId) {
      setError('Sign in to save chat history.');
      return;
    }
    try {
      const newThread = await createChatThread(userId, 'New Chat');
      setThreads((prev) => [newThread, ...prev]);
      setSelectedThreadId(newThread.id);
      setMessages([defaultGreeting]);
      setInput('');
      setError(null);
    } catch (err) {
      console.error('Failed to create chat thread', err);
      setError('Could not start new chat. Try again.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] bg-white rounded-3xl border border-slate-200 shadow-sm md:shadow-md overflow-hidden ios-card">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between gap-3 ios-header">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-2xl text-white shadow-lg shadow-slate-200">
              <Sparkles size={20} className="text-white" />
          </div>
          <div>
              <h3 className="font-extrabold text-slate-900 text-lg">BFit Coach</h3>
              <p className="text-xs text-slate-500 font-medium">AI Personal Trainer</p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          disabled={!userId}
          className="text-xs font-bold px-3 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          + New Chat
        </button>
      </div>

      {/* Thread list */}
      <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-full">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold truncate max-w-[220px] ${
                thread.id === selectedThreadId
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
              title={thread.title}
            >
              {thread.title || 'New Chat'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/60">
        {loadingHistory && (
          <div className="mx-4 mb-3 text-sm text-slate-500">Loading chat history...</div>
        )}
        {loadingThreadMessages && (
          <div className="mx-4 mb-3 text-sm text-slate-500">Loading conversation...</div>
        )}
        {error && (
          <div className="mx-4 mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        
        {/* Insights Section */}
        {insights.length > 0 && (
            <div className="mx-4 mb-6">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                        <Lightbulb size={14} /> Training Insights
                    </div>
                    <ul className="space-y-2">
                        {insights.map((insight, i) => (
                            <li key={i} className="text-sm text-slate-700 leading-relaxed">{insight}</li>
                        ))}
                    </ul>
                </div>
            </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
                <div className={`flex items-center gap-2 mb-1 text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-slate-400' : 'text-accent'}`}>
                    {msg.role === 'user' ? <User size={10}/> : <Bot size={10}/>}
                    {msg.role === 'user' ? 'You' : 'BFit Coach'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-4 flex items-center gap-3 shadow-sm">
                <Loader2 className="animate-spin text-accent" size={18} />
                <span className="text-slate-500 text-sm font-medium">Analyzing data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about exercises, sets, or diet..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !userId}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-slate-200"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Coach;
