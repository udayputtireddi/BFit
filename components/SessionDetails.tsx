
import React, { useState } from 'react';
import { WorkoutSession } from '../types';
import { ArrowLeft, Calendar, Clock, Dumbbell, Hash, CheckCircle2 } from 'lucide-react';
import ShareStory from './ShareStory';

interface SessionDetailsProps {
  session: WorkoutSession;
  onBack: () => void;
  onDelete?: (sessionId: string) => void;
  onEdit?: (session: WorkoutSession) => void;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({ session, onBack, onDelete, onEdit }) => {
  const [showShare, setShowShare] = useState(false);
  // Calculate total volume for this session
  const totalVolume = session.exercises.reduce((acc, ex) => 
    acc + ex.sets.reduce((sAcc, s) => sAcc + ((typeof s.weight === 'number' ? s.weight : 0) * (typeof s.reps === 'number' ? s.reps : 0)), 0)
  , 0);

  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="h-full flex flex-col bg-transparent animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="ios-header p-4 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold text-sm">Back to Dashboard</span>
        </button>
        
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-primary mb-2">{session.name}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowShare(true)}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-full transition-colors"
            >
              Share
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(session)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-full transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this session?')) onDelete(session.id);
                }}
                className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-full transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-bold text-secondary uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            {session.durationMinutes} min
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="ios-card p-4">
           <div className="text-secondary mb-1">
             <Hash size={20} />
           </div>
           <p className="text-2xl font-extrabold text-primary">{totalSets}</p>
           <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Total Sets</p>
        </div>
        <div className="ios-card p-4">
           <div className="text-secondary mb-1">
             <Dumbbell size={20} />
           </div>
           <p className="text-2xl font-extrabold text-primary">{(totalVolume / 1000).toFixed(1)}k</p>
           <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Volume (lbs)</p>
        </div>
      </div>

      {/* Exercises List */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
        {session.exercises.map((exercise) => (
          <div key={exercise.id} className="ios-card overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-primary">{exercise.name}</h3>
            </div>
            
            <div className="p-2">
              <div className="grid grid-cols-12 gap-2 px-2 py-2 text-[10px] uppercase font-bold text-secondary text-center tracking-wider opacity-60">
                <div className="col-span-2">Set</div>
                <div className="col-span-4">lbs</div>
                <div className="col-span-4">Reps</div>
                <div className="col-span-2"></div>
              </div>
              
              <div className="space-y-1">
                {exercise.sets.map((set, idx) => (
                  <div key={set.id} className="grid grid-cols-12 gap-2 items-center text-center py-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="col-span-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center mx-auto border border-slate-200">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="col-span-4 font-bold text-primary text-lg">
                      {set.weight || '-'}
                    </div>
                    <div className="col-span-4 font-bold text-primary text-lg">
                      {set.reps || '-'}
                    </div>
                    <div className="col-span-2 flex justify-center text-green-500">
                      {set.completed && <CheckCircle2 size={18} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showShare && <ShareStory session={session} onClose={() => setShowShare(false)} />}
    </div>
  );
};

export default SessionDetails;
