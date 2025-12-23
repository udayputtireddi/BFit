import React from 'react';
import { WorkoutSession } from '../types';
import { X, Share2 } from 'lucide-react';

interface ShareStoryProps {
  session: WorkoutSession;
  onClose: () => void;
}

const ShareStory: React.FC<ShareStoryProps> = ({ session, onClose }) => {
  const topExercises = session.exercises.slice(0, 5);
  const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-700">Share Workout</p>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-500"
            aria-label="Close share"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ios-gradient rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
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
            <p className="text-lg font-bold mb-3">{session.name}</p>
            <div className="space-y-1 text-sm text-white/80">
              {topExercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between">
                  <span className="truncate">{exercise.name}</span>
                  <span className="text-white/60 text-xs">{exercise.sets.length} sets</span>
                </div>
              ))}
              {session.exercises.length > topExercises.length && (
                <div className="text-xs text-white/60">
                  +{session.exercises.length - topExercises.length} more exercises
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
    </div>
  );
};

export default ShareStory;
