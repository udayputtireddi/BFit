import React from 'react';
import { WorkoutSession } from '../types';
import { History, ArrowRight } from 'lucide-react';

interface RecentActivityProps {
  history: WorkoutSession[];
  onViewSession: (session: WorkoutSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onEditSession?: (session: WorkoutSession) => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  history,
  onViewSession,
  onDeleteSession,
  onEditSession,
}) => {
  const sessions = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="ios-card p-4 md:p-6 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <History size={18} className="text-slate-400" />
          Recent Activity
        </h2>
      </div>
      <div className="divide-y divide-slate-100">
        {sessions.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">No workouts logged yet.</div>
        ) : (
          sessions.slice(0, 20).map((session) => (
            <div
              key={session.id}
              className="w-full text-left py-3 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <button onClick={() => onViewSession(session)} className="flex-1 flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                  {new Date(session.date).getDate()}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{session.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(session.date).toLocaleDateString(undefined, { month: 'short', weekday: 'short' })} •{' '}
                    {session.durationMinutes} min
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                <span className="hidden sm:inline-block text-xs font-semibold bg-slate-50 px-2 py-1 rounded-md text-slate-600 border border-slate-100">
                  {session.exercises.length} Exercises
                </span>
                {onEditSession && (
                  <button
                    onClick={() => onEditSession(session)}
                    className="text-xs font-bold px-2 py-1 rounded-md text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                    title="Edit session"
                  >
                    Edit
                  </button>
                )}
                {onDeleteSession && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this session?')) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 text-xs font-bold px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                    title="Delete session"
                  >
                    Delete
                  </button>
                )}
                <ArrowRight size={16} className="text-slate-300" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
