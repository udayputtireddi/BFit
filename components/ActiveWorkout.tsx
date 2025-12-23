
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ExerciseLog, Set, ExerciseDef, WorkoutSession } from '../types';
import { EXERCISE_DATABASE, MUSCLE_GROUPS } from '../constants';
import { Plus, Trash2, Check, X, Search, ChevronDown, AlertCircle, Filter, Timer, FileText, Play, Pencil } from 'lucide-react';

interface ActiveWorkoutProps {
  onFinish: (name: string, exercises: ExerciseLog[], duration: number, existingId?: string, dateOverride?: string) => void;
  onCancel: () => void;
  presetExercises?: ExerciseLog[];
  presetName?: string | null;
  history?: WorkoutSession[];
  editingSessionId?: string;
  editingDurationMinutes?: number;
}

const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({
  onFinish,
  onCancel,
  presetExercises,
  presetName,
  history,
  editingSessionId,
  editingDurationMinutes
}) => {
  const timerAnchorKey = useMemo(
    () => `ironlog_active_timer_anchor_${editingSessionId || 'new'}`,
    [editingSessionId]
  );
  const initialSeedSeconds = editingDurationMinutes ? editingDurationMinutes * 60 : 0;
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [timer, setTimer] = useState(() => initialSeedSeconds);
  const timerAnchorRef = useRef<number | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customName, setCustomName] = useState('');
  const [customGroup, setCustomGroup] = useState('All');
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Rest Timer State
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [isResting, setIsResting] = useState(false);
  
  // Ref for auto-scrolling
  const listBottomRef = useRef<HTMLDivElement>(null);

  // Seed timer anchor so elapsed time survives tab/background pauses
  // Seed timer anchor on mount, falling back to now if persisted value is invalid or stale
  useEffect(() => {
    const persistedRaw = localStorage.getItem(timerAnchorKey);
    const persistedAnchor = persistedRaw ? Number(persistedRaw) : NaN;
    const now = Date.now();
    const hasValidAnchor = Number.isFinite(persistedAnchor) && persistedAnchor > 0 && persistedAnchor <= now;
    const anchor = hasValidAnchor ? persistedAnchor : now - initialSeedSeconds * 1000;

    timerAnchorRef.current = anchor;
    localStorage.setItem(timerAnchorKey, String(anchor));
    const elapsed = Math.max(0, Math.floor((now - anchor) / 1000));
    setTimer(elapsed);
  }, [initialSeedSeconds, timerAnchorKey]);

  // Tick timer based on real elapsed wall time; keep rest timer in sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (timerAnchorRef.current !== null) {
        const elapsed = Math.max(0, Math.floor((Date.now() - timerAnchorRef.current) / 1000));
        setTimer(elapsed);
      }
      setRestTimer((prev) => {
        if (!isResting || prev === null) return prev;
        if (prev <= 1) {
          setIsResting(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting]);

  // Clear anchor when the session unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem(timerAnchorKey);
    };
  }, [timerAnchorKey]);

  const formattedTime = () => {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRest = (seconds: number) => {
      setRestTimer(seconds);
      setIsResting(true);
  };

  const cancelRest = () => {
      setIsResting(false);
      setRestTimer(null);
  };

  const parseNumericInput = (value: string) => {
    if (value === '') return '';
    const parsed = Number(value);
    return Number.isNaN(parsed) ? '' : parsed;
  };

  // Prefill exercises if a template is provided
  useEffect(() => {
    if (presetExercises && presetExercises.length > 0) {
      setExercises(presetExercises);
      setWorkoutName((prev) => prev || presetName || 'Program Day');
    }
  }, [presetExercises, presetName]);

  const clearTimerAnchor = () => {
    localStorage.removeItem(timerAnchorKey);
  };

  const handleFinish = () => {
    if (exercises.length === 0) return;
    const durationToSave = editingDurationMinutes ?? Math.min(1440, Math.max(1, Math.ceil(timer / 60)));
    clearTimerAnchor();
    onFinish(workoutName || 'Workout', exercises, durationToSave, editingSessionId, workoutDate);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    clearTimerAnchor();
    onCancel();
  };

  const addExercise = (exDef: ExerciseDef) => {
    const newEx: ExerciseLog = {
      id: Date.now().toString(),
      exerciseId: exDef.id,
      name: exDef.name,
      sets: [
        {
          id: Date.now().toString() + '_1',
          reps: exDef.muscleGroup === 'Cardio' ? '' : 10,
          weight: exDef.muscleGroup === 'Cardio' ? '' : '',
          distance: exDef.muscleGroup === 'Cardio' ? '' : undefined,
          durationMinutes: exDef.muscleGroup === 'Cardio' ? '' : undefined,
          incline: exDef.muscleGroup === 'Cardio' ? '' : undefined,
          completed: false
        }
      ],
      notes: '',
      muscleGroup: exDef.muscleGroup
    };
    setExercises([...exercises, newEx]);
    setShowExerciseSelector(false);
    setSearchQuery('');
    setSelectedCategory('All');
    setCustomName('');
    setCustomGroup('All');
    
    // Scroll to new exercise
    setTimeout(() => {
        listBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const addCustomExercise = () => {
    if (!customName.trim() || customGroup === 'All') return;
    const newExDef: ExerciseDef = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      muscleGroup: customGroup,
    };
    addExercise(newExDef);
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof Set, value: any) => {
    const newEx = [...exercises];
    newEx[exIdx].sets[setIdx] = { ...newEx[exIdx].sets[setIdx], [field]: value };
    setExercises(newEx);
  };

  const updateNotes = (exIdx: number, text: string) => {
      const newEx = [...exercises];
      newEx[exIdx].notes = text;
      setExercises(newEx);
  };

  const toggleSet = (exIdx: number, setIdx: number) => {
    const newEx = [...exercises];
    const isCardio = newEx[exIdx].muscleGroup === 'Cardio';
    const set = newEx[exIdx].sets[setIdx];
    if (isCardio) {
      const hasInput = set.durationMinutes !== '' || set.distance !== '' || set.incline !== '';
      if (hasInput) {
        newEx[exIdx].sets[setIdx].completed = !newEx[exIdx].sets[setIdx].completed;
        setExercises(newEx);
      }
    } else {
      if (set.weight !== '' && set.reps !== '') {
        newEx[exIdx].sets[setIdx].completed = !newEx[exIdx].sets[setIdx].completed;
        setExercises(newEx);
      }
    }
  };

  const addSet = (exIdx: number) => {
    const newEx = [...exercises];
    const prevSet = newEx[exIdx].sets[newEx[exIdx].sets.length - 1];
    const isCardio = newEx[exIdx].muscleGroup === 'Cardio';
    newEx[exIdx].sets.push({
      id: Date.now().toString(),
      reps: isCardio ? '' : prevSet ? prevSet.reps : '',
      weight: isCardio ? '' : prevSet ? prevSet.weight : '',
      distance: isCardio ? (prevSet ? prevSet.distance : '') : undefined,
      durationMinutes: isCardio ? (prevSet ? prevSet.durationMinutes : '') : undefined,
      incline: isCardio ? (prevSet ? prevSet.incline : '') : undefined,
      completed: false
    });
    setExercises(newEx);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    const newEx = [...exercises];
    newEx[exIdx].sets.splice(setIdx, 1);
    // If no sets remain, remove the exercise entirely
    if (newEx[exIdx].sets.length === 0) {
      newEx.splice(exIdx, 1);
    }
    setExercises(newEx);
  };

  const renameExercise = (exIdx: number, newName: string) => {
    const newEx = [...exercises];
    newEx[exIdx].name = newName;
    setExercises(newEx);
  };

  const filteredExercises = EXERCISE_DATABASE.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' ? true : ex.muscleGroup === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const [hiddenCustomIds, setHiddenCustomIds] = useState<string[]>([]);

  const defaultExercises = filteredExercises.filter((ex) => !ex.id.startsWith('custom-'));
  const customExercises = filteredExercises.filter((ex) => ex.id.startsWith('custom-') && !hiddenCustomIds.includes(ex.id));

  const getSuggestion = (name: string) => {
    if (!history || history.length === 0) return null;
    // Skip cardio suggestions
    const exerciseDef = EXERCISE_DATABASE.find((e) => e.name === name);
    if (exerciseDef?.muscleGroup === 'Cardio') return null;
    // Find last two sessions containing this exercise
    const sessionsWith = history.filter((s) => s.exercises.some((e) => e.name === name)).slice(0, 2);
    if (sessionsWith.length === 0) return null;
    const bestFromSession = (sess: WorkoutSession) => {
      const ex = sess.exercises.find((e) => e.name === name);
      if (!ex) return null;
      let best = { weight: 0, reps: 0 };
      ex.sets.forEach((set) => {
        const w = typeof set.weight === 'number' ? set.weight : 0;
        const r = typeof set.reps === 'number' ? set.reps : 0;
        if (w > best.weight || (w === best.weight && r > best.reps)) {
          best = { weight: w, reps: r };
        }
      });
      return best.weight > 0 ? best : null;
    };
    const last = bestFromSession(sessionsWith[0]);
    if (!last) return null;
    const prev = sessionsWith[1] ? bestFromSession(sessionsWith[1]) : null;
    let suggestedWeight = last.weight;
    const increment = last.weight >= 50 ? 5 : 2.5;
    if (prev) {
      if (last.weight <= prev.weight && last.reps >= 6) {
        suggestedWeight = last.weight + increment;
      }
    } else {
      // only one session; suggest small bump if reps are solid
      if (last.reps >= 8) suggestedWeight = last.weight + increment;
    }
    const suggestedReps = Math.max(8, last.reps || 8);
    return { weight: Math.round(suggestedWeight * 10) / 10, reps: suggestedReps };
  };

  return (
      <div className="flex flex-col min-h-screen bg-transparent md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 md:max-w-5xl md:mx-auto md:h-[calc(100vh-100px)] relative md:mt-6 text-slate-900 interactive-card overflow-y-auto">
      
      {/* Top Bar (Desktop-only, mobile uses bottom action bar) */}
      <div className="sticky top-0 z-30 ios-header px-4 py-3 flex items-center justify-between shadow-sm md:rounded-t-3xl">
        <button 
            type="button"
            onClick={() => setShowCancelModal(true)} 
            className="flex items-center gap-1 px-3 py-2 -ml-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors group"
        >
            <X size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold hidden sm:inline">Cancel</span>
        </button>
        
        <div className="flex flex-col items-center">
             <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">Duration</div>
             <div className="font-mono font-bold text-slate-900 text-lg leading-none">{formattedTime()}</div>
        </div>
        
        <button 
            type="button"
            onClick={handleFinish}
            disabled={exercises.length === 0}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
        >
            <span>Finish</span> <Check size={16} />
        </button>
      </div>

      {/* Rest Timer Overlay (If Active) */}
      {isResting && (
          <div className="sticky top-[65px] z-20 mx-4 mb-4 bg-slate-900 text-white p-3 rounded-2xl shadow-lg flex justify-between items-center animate-in slide-in-from-top-2 md:max-w-sm md:mx-auto">
              <div className="flex items-center gap-3">
                  <Timer className="animate-pulse text-accent" />
                  <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resting</span>
                      <div className="font-mono text-xl font-bold">{restTimer}s</div>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => startRest(restTimer ? restTimer + 30 : 30)} className="px-3 py-1 bg-slate-700 rounded-full text-xs font-bold hover:bg-slate-600">+30s</button>
                  <button onClick={cancelRest} className="p-2 bg-slate-700 rounded-full hover:bg-red-500 transition-colors"><X size={16} /></button>
              </div>
          </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 md:px-8 md:py-6">
        {/* Workout Name Input */}
        <div className="space-y-3">
          <input 
              type="text" 
              placeholder="Workout Name (e.g., Push Day)"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full text-3xl font-extrabold bg-transparent placeholder-slate-300 border-none focus:ring-0 p-0 text-slate-900 tracking-tight"
          />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Log for</span>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-full px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>
        </div>

        <div className="relative">
          <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto pr-1 -mr-1 space-y-6 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {exercises.map((exercise, exIdx) => (
                    <div key={exercise.id} className="ios-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 ring-1 ring-slate-900/5">
                        {/* Exercise Header */}
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 flex-1">
                                <Pencil size={16} className="text-slate-400" />
                                <input
                                  value={exercise.name}
                                  onChange={(e) => renameExercise(exIdx, e.target.value)}
                                  className="bg-white border border-slate-200 rounded-full px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/20 flex-1"
                                />
                            </div>
                            {getSuggestion(exercise.name) && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1">
                                  Suggested {getSuggestion(exercise.name)!.weight} lbs x {getSuggestion(exercise.name)!.reps}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const suggestion = getSuggestion(exercise.name);
                                    if (!suggestion) return;
                                    const newEx = [...exercises];
                                    const targetSet = newEx[exIdx].sets[0];
                                    // Only apply if empty
                                    if (targetSet.weight === '' && targetSet.reps === '') {
                                      newEx[exIdx].sets[0] = {
                                        ...targetSet,
                                        weight: suggestion.weight,
                                        reps: suggestion.reps,
                                      };
                                      setExercises(newEx);
                                    }
                                  }}
                                  className="text-xs font-bold text-accent hover:text-accent-strong px-2 py-1 rounded-full border border-accent/30 hover:border-accent"
                                >
                                  Apply
                                </button>
                              </div>
                            )}
                            <button 
                                type="button"
                                onClick={() => {
                                    const newEx = [...exercises];
                                    newEx.splice(exIdx, 1);
                                    setExercises(newEx);
                                }}
                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Exercise Notes */}
                        <div className="px-4 pt-3">
                            <div className="relative">
                                <FileText size={14} className="absolute left-3 top-3 text-slate-400" />
                                <textarea 
                                    rows={1}
                                    placeholder="Notes..."
                                    value={exercise.notes || ''}
                                    onChange={(e) => updateNotes(exIdx, e.target.value)}
                                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-primary/10 outline-none resize-none transition-all placeholder-slate-400"
                                />
                            </div>
                        </div>

                        {/* Sets Header */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider bg-white">
                            <div className="col-span-1">#</div>
                            {exercise.muscleGroup === 'Cardio' ? (
                              <>
                                <div className="col-span-3">Duration (min)</div>
                                <div className="col-span-3">Distance</div>
                                <div className="col-span-2">Incline</div>
                                <div className="col-span-3">Log</div>
                              </>
                            ) : (
                              <>
                                <div className="col-span-3">lbs</div>
                                <div className="col-span-3">Reps</div>
                                <div className="col-span-5">Log</div>
                              </>
                            )}
                        </div>

                        {/* Sets Rows */}
                        <div className="px-4 pb-4 space-y-2 bg-white">
                            {exercise.sets.map((set, setIdx) => (
                                <div key={set.id} className={`flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-2 items-stretch sm:items-center transition-all duration-300 ${set.completed ? 'opacity-40 grayscale' : ''}`}>
                                    <div className="sm:col-span-1 flex justify-start sm:justify-center">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center border border-slate-200">
                                            {setIdx + 1}
                                        </span>
                                    </div>
                                    {exercise.muscleGroup === 'Cardio' ? (
                                      <>
                                        <div className="flex flex-col sm:col-span-3">
                                          <span className="text-[11px] font-bold text-slate-500 sm:hidden mb-1">Duration (min)</span>
                                          <input
                                            type="number"
                                            placeholder="mins"
                                            value={set.durationMinutes ?? ''}
                                            onChange={(e) => updateSet(exIdx, setIdx, 'durationMinutes', parseNumericInput(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-center font-bold text-slate-900 focus:border-slate-900 focus:outline-none focus:bg-white transition-all text-sm shadow-inner"
                                          />
                                        </div>
                                        <div className="flex flex-col sm:col-span-3">
                                          <span className="text-[11px] font-bold text-slate-500 sm:hidden mb-1">Distance</span>
                                          <input
                                            type="number"
                                            placeholder="km/mi"
                                            value={set.distance ?? ''}
                                            onChange={(e) => updateSet(exIdx, setIdx, 'distance', parseNumericInput(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-center font-bold text-slate-900 focus:border-slate-900 focus:outline-none focus:bg-white transition-all text-sm shadow-inner"
                                          />
                                        </div>
                                        <div className="flex flex-col sm:col-span-2">
                                          <span className="text-[11px] font-bold text-slate-500 sm:hidden mb-1">Incline</span>
                                          <input
                                            type="number"
                                            placeholder="%"
                                            value={set.incline ?? ''}
                                            onChange={(e) => updateSet(exIdx, setIdx, 'incline', parseNumericInput(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-center font-bold text-slate-900 focus:border-slate-900 focus:outline-none focus:bg-white transition-all text-sm shadow-inner"
                                          />
                                        </div>
                                        <div className="sm:col-span-3">
                                          <button
                                            type="button"
                                            onClick={() => toggleSet(exIdx, setIdx)}
                                            className={`w-full py-2.5 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${set.completed ? 'bg-green-500 text-white shadow-green-200' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                                          >
                                            <Check size={18} strokeWidth={3} />
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex flex-col sm:col-span-3">
                                            <span className="text-[11px] font-bold text-slate-500 sm:hidden mb-1">Weight (lbs)</span>
                                            <input 
                                                type="number"
                                                placeholder="-"
                                                value={set.weight}
                                                onChange={(e) => updateSet(exIdx, setIdx, 'weight', parseNumericInput(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-center font-bold text-slate-900 focus:border-slate-900 focus:outline-none focus:bg-white transition-all text-sm shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col sm:col-span-3">
                                            <span className="text-[11px] font-bold text-slate-500 sm:hidden mb-1">Reps</span>
                                            <input 
                                                type="number"
                                                placeholder="-"
                                                value={set.reps}
                                                onChange={(e) => updateSet(exIdx, setIdx, 'reps', parseNumericInput(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-center font-bold text-slate-900 focus:border-slate-900 focus:outline-none focus:bg-white transition-all text-sm shadow-inner"
                                            />
                                        </div>
                                        <div className="sm:col-span-5">
                                            <button 
                                                type="button"
                                                onClick={() => toggleSet(exIdx, setIdx)}
                                                className={`w-full py-2.5 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${set.completed ? 'bg-green-500 text-white shadow-green-200' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                                            >
                                                <Check size={18} strokeWidth={3} />
                                            </button>
                                        </div>
                                      </>
                                    )}
                                    <div className="col-span-12 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => removeSet(exIdx, setIdx)}
                                        className="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1 rounded-full hover:bg-red-50 transition-colors"
                                      >
                                        Remove set
                                      </button>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="flex gap-2 mt-2 pt-2 border-t border-dashed border-slate-100">
                                <button 
                                    type="button"
                                    onClick={() => addSet(exIdx)}
                                    className="flex-1 py-3 text-xs font-bold uppercase text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> {exercise.muscleGroup === 'Cardio' ? 'Add Interval' : 'Add Set'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => startRest(90)}
                                    className="px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-500 flex items-center justify-center"
                                    title="Start 90s Rest"
                                >
                                    <Timer size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {exercises.length === 0 && (
                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                    <div className="bg-slate-100 p-6 rounded-full mb-6">
                        <Play size={40} className="text-slate-400 ml-1" />
                    </div>
                    <p className="font-bold text-xl text-slate-800">Ready to Train?</p>
                    <p className="text-sm text-slate-500 mt-2">Tap "Add Exercise" to build your session</p>
                </div>
            )}
            
            <div ref={listBottomRef} className="h-8" />
          </div>
        </div>
        
        <div ref={listBottomRef} className="h-8" />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 md:absolute md:bottom-8 md:right-8 z-40">
        <button 
            type="button"
            onClick={() => setShowExerciseSelector(true)}
            className="bg-gradient-to-r from-[#5b5ce2] to-[#7b7dff] text-white rounded-full px-6 py-4 shadow-xl shadow-indigo-500/40 font-bold flex items-center gap-3 hover:scale-105 transition-transform active:scale-95 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
            <Plus size={22} className="text-white" /> <span className="hidden md:inline">Add Exercise</span>
        </button>
      </div>

      {/* Add Exercise Modal - Desktop Centered / Mobile Full Screen */}
      {showExerciseSelector && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center md:p-8">
              <div className="bg-white w-full md:max-w-3xl md:h-[600px] md:rounded-3xl rounded-t-3xl h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300 md:zoom-in-95">
                  {/* Modal Header */}
                  <div className="p-4 border-b border-slate-100 bg-white md:rounded-t-3xl space-y-3">
                      {/* Close Handle (mobile style) */}
                      <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto md:hidden" onClick={() => setShowExerciseSelector(false)}></div>
                      
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-900">Select Exercise</h3>
                        <button onClick={() => setShowExerciseSelector(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18}/></button>
                      </div>

                      <div className="flex gap-2">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                placeholder="Search..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="relative w-1/3">
                            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 text-slate-900 font-bold rounded-xl py-3 pl-10 pr-8 focus:ring-2 focus:ring-primary/10 focus:border-slate-900 outline-none transition-all cursor-pointer truncate"
                            >
                                {MUSCLE_GROUPS.map(group => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                  </div>

                  {/* Exercise List */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 max-h-[70vh]">
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 mb-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Add custom exercise</div>
                        <div className="flex flex-col md:flex-row gap-2">
                          <input
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="Exercise name"
                            className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10"
                          />
                          <select
                            value={customGroup}
                            onChange={(e) => setCustomGroup(e.target.value)}
                            className="w-full md:w-40 bg-white border border-slate-200 rounded-full px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent/10"
                          >
                            {MUSCLE_GROUPS.filter(g => g !== 'All').map(group => (
                              <option key={group} value={group}>{group}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={addCustomExercise}
                            className="bg-slate-900 text-white rounded-full px-4 py-2 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                            disabled={!customName.trim() || customGroup === 'All'}
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {defaultExercises.map(ex => (
                              <button 
                                  type="button"
                                  key={ex.id}
                                  onClick={() => addExercise(ex)}
                                  className="w-full p-3 text-left bg-white border border-slate-100 hover:border-accent hover:shadow-md rounded-xl flex items-center gap-3 group transition-all"
                              >
                                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-100">
                                      {ex.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-900 text-sm leading-tight truncate">{ex.name}</div>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">{ex.muscleGroup}</div>
                                  </div>
                                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-accent group-hover:text-white transition-colors mr-1">
                                      <Plus size={18} />
                                  </div>
                              </button>
                          ))}
                      </div>

                      {customExercises.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center justify-between">
                            <span>Your custom exercises</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {customExercises.map((ex) => (
                              <div
                                key={ex.id}
                                className="w-full p-3 text-left bg-white border border-slate-100 rounded-xl flex items-center gap-3"
                              >
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-100">
                                  {ex.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-slate-900 text-sm leading-tight truncate">{ex.name}</div>
                                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                                    {ex.muscleGroup}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => addExercise(ex)}
                                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-accent hover:text-white transition-colors"
                                    title="Add to workout"
                                  >
                                    <Plus size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHiddenCustomIds((prev) => [...prev, ex.id]);
                                      setExercises((prev) => prev.filter((p) => p.exerciseId !== ex.id));
                                    }}
                                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
                                    title="Remove from list"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {filteredExercises.length === 0 && (
                          <div className="text-center py-20 text-slate-400">
                              <div className="mb-2">No exercises found.</div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
          <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                 <div className="flex items-center gap-3 mb-4 text-red-500">
                    <div className="bg-red-50 p-3 rounded-full">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">End Workout?</h3>
                 </div>
                 <p className="text-slate-500 mb-8 leading-relaxed">
                    You have an active session in progress. Exiting now will discard all unsaved sets.
                 </p>
                 <div className="flex gap-3">
                     <button 
                        type="button"
                        onClick={() => setShowCancelModal(false)} 
                        className="flex-1 py-3.5 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                     >
                        Resume
                     </button>
                     <button 
                        type="button"
                        onClick={confirmCancel} 
                        className="flex-1 py-3.5 font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-200"
                     >
                        Discard
                     </button>
                 </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ActiveWorkout;
