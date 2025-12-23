import React, { useMemo, useState } from 'react';
import { WorkoutSession } from '../types';
import { Share2, Sparkles, Image as ImageIcon, Type, SlidersHorizontal } from 'lucide-react';

interface ShareHubProps {
  history: WorkoutSession[];
}

const ShareHub: React.FC<ShareHubProps> = ({ history }) => {
  const sessions = useMemo(
    () => [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [history]
  );
  const [selectedId, setSelectedId] = useState<string | null>(sessions[0]?.id || null);
  const selectedSession = sessions.find((s) => s.id === selectedId) || sessions[0];

  const topExercises = selectedSession?.exercises.slice(0, 6) || [];
  const formattedDate = selectedSession
    ? new Date(selectedSession.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  if (!selectedSession) {
    return (
      <div className="ios-card p-6 text-center">
        <p className="text-sm text-slate-500">Log a workout to create a share card.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="md:hidden ios-card p-4">
        <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              B
            </div>
            <div className="text-center">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest">BFit</p>
              <p className="text-base font-extrabold text-slate-900">Share</p>
            </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Share2 size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6">
        <div className="ios-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Story Canvas</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">Turn training stats into stories</h3>
            </div>
            <span className="ios-chip">Preview</span>
          </div>

          <div className="mt-4 ios-gradient rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold">Turn training stats into stories</h3>
              <p className="text-sm text-white/80">
                Customize your canvas and share to your socials.
              </p>
            </div>

            <div className="mt-6 bg-[#121521] rounded-[28px] border border-white/10 p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3 text-xs text-white/70">
                <span className="uppercase tracking-wider">Upper</span>
                <span>{formattedDate}</span>
              </div>
              <p className="text-lg font-bold mb-3">{selectedSession.name}</p>
              <div className="space-y-1 text-sm text-white/80">
                {topExercises.map((exercise) => (
                  <div key={exercise.id} className="flex items-center justify-between">
                    <span className="truncate">{exercise.name}</span>
                    <span className="text-white/60 text-xs">{exercise.sets.length} sets</span>
                  </div>
                ))}
                {selectedSession.exercises.length > topExercises.length && (
                  <div className="text-xs text-white/60">
                    +{selectedSession.exercises.length - topExercises.length} more exercises
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button className="flex-1 bg-white/15 border border-white/20 text-white rounded-full py-3 text-sm font-bold">
                Story
              </button>
              <button className="flex-1 bg-white text-slate-900 rounded-full py-3 text-sm font-bold flex items-center justify-center gap-2">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="ios-card p-5">
            <p className="text-sm font-bold text-slate-900 mb-3">Choose Workout</p>
            <div className="space-y-2">
              {sessions.slice(0, 6).map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedId(session.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    session.id === selectedSession.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold">{session.name}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="ios-card p-5">
            <p className="text-sm font-bold text-slate-900 mb-3">Customize</p>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
                <ImageIcon size={16} />
                Background
              </button>
              <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
                <Type size={16} />
                Text
              </button>
              <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
                <Sparkles size={16} />
                Stickers
              </button>
              <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
                <SlidersHorizontal size={16} />
                Filters
              </button>
            </div>
          </div>

          <div className="ios-card p-5">
            <p className="text-sm font-bold text-slate-900 mb-3">Share to</p>
            <div className="grid grid-cols-2 gap-3">
              {['Instagram', 'Snapchat', 'Messages', 'More'].map((label) => (
                <button
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareHub;
