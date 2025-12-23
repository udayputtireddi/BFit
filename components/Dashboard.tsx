import React, { useMemo, useState, useRef } from 'react';
import { WorkoutSession } from '../types';
import { Calendar as CalendarIcon, ArrowRight, Play, ChevronLeft, ChevronRight, XCircle, Trophy, BarChart3, TrendingUp, History, AlertTriangle, Flame } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  history: WorkoutSession[];
  startWorkout: () => void;
  onViewSession: (session: WorkoutSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onShowAnalytics?: () => void;
  onEditSession?: (session: WorkoutSession) => void;
}

// Epley Formula for 1RM: Weight * (1 + Reps/30)
const calculateOneRepMax = (weight: number, reps: number) => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

const Dashboard: React.FC<DashboardProps> = ({
  history,
  startWorkout,
  onViewSession,
  onDeleteSession,
  onShowAnalytics,
  onEditSession,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const analyticsRef = useRef<HTMLDivElement | null>(null);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [history]
  );

  const sessionVolume = (session: WorkoutSession) =>
    session.exercises.reduce(
      (exAcc, ex) =>
        exAcc +
        ex.sets.reduce(
          (sAcc, s) =>
            sAcc + (typeof s.weight === 'number' ? s.weight : 0) * (typeof s.reps === 'number' ? s.reps : 0),
          0
        ),
      0
    );

  const currentMonthVolume = useMemo(() => {
    return sortedHistory.reduce((acc, session) => acc + sessionVolume(session), 0);
  }, [sortedHistory]);

  const streak = useMemo(() => {
    if (!sortedHistory.length) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    let prev: Date | null = null;
    let graceUsed = false; // allow one rest day without breaking streak

    for (const session of sortedHistory) {
      const d = new Date(session.date);
      d.setHours(0, 0, 0, 0);

      if (count === 0) {
        const diffToday = (today.getTime() - d.getTime()) / 86400000;
        if (diffToday > 2) return 0; // allow a 1-day gap from today
        count = 1;
        prev = d;
        continue;
      }

      if (prev) {
        const diff = (prev.getTime() - d.getTime()) / 86400000;
        if (diff === 1) {
          count += 1;
          prev = d;
        } else if (diff === 2 && !graceUsed) {
          graceUsed = true;
          count += 1;
          prev = d;
        } else {
          break;
        }
      }
    }
    return count;
  }, [sortedHistory]);

  const weeklyVolumes = useMemo(() => {
    const now = new Date();
    const startThisWeek = new Date(now);
    startThisWeek.setDate(now.getDate() - 6);
    const startLastWeek = new Date(now);
    startLastWeek.setDate(now.getDate() - 13);

    let thisWeek = 0;
    let lastWeek = 0;
    const groupVolume: Record<string, number> = {};

    sortedHistory.forEach((session) => {
      const d = new Date(session.date);
      const vol = sessionVolume(session);
      if (d >= startThisWeek) {
        thisWeek += vol;
      } else if (d >= startLastWeek && d < startThisWeek) {
        lastWeek += vol;
      }

      session.exercises.forEach((ex) => {
        const v = ex.sets.reduce(
          (sAcc, s) =>
            sAcc + (typeof s.weight === 'number' ? s.weight : 0) * (typeof s.reps === 'number' ? s.reps : 0),
          0
        );
        if (v <= 0) return; // skip cardio/empty entries
        const key = ex.muscleGroup || 'Other';
        if (d >= startThisWeek) groupVolume[key] = (groupVolume[key] || 0) + v;
      });
    });

    const distro = Object.entries(groupVolume)
      .map(([group, volume]) => ({ group, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume);

    return { thisWeek, lastWeek, distro };
  }, [sortedHistory]);

  const alerts = useMemo(() => {
    const stalled: string[] = [];
    const occurrences: Record<string, number[]> = {};
    sortedHistory.forEach((session) => {
      session.exercises.forEach((ex) => {
        // Only consider strength lifts with numeric weights; skip cardio/duration-based work
        const best = ex.sets.reduce((max, s) => {
          const w = typeof s.weight === 'number' ? s.weight : 0;
          const r = typeof s.reps === 'number' ? s.reps : 0;
          if (w > 0 && r > 0) {
            return Math.max(max, w);
          }
          return max;
        }, 0);
        if (best <= 0) return;
        if (!occurrences[ex.name]) occurrences[ex.name] = [];
        occurrences[ex.name].push(best);
      });
    });

    Object.entries(occurrences).forEach(([name, weights]) => {
      if (weights.length < 3) return;
      const [a, b, c] = weights.slice(0, 3); // last three sessions
      if (a <= b && b <= c) {
        stalled.push(`${name} has stalled for 3 sessions. Add 5 lbs or a rep next time.`);
      }
    });

    const volumeDrop =
      weeklyVolumes.lastWeek > 0 && weeklyVolumes.thisWeek < weeklyVolumes.lastWeek * 0.9
        ? `Volume is down ${Math.round(
            (100 * (weeklyVolumes.lastWeek - weeklyVolumes.thisWeek)) / weeklyVolumes.lastWeek
          )}% vs last week.`
        : null;

    const list = volumeDrop ? [volumeDrop, ...stalled] : stalled;
    return list.slice(0, 4);
  }, [sortedHistory, weeklyVolumes]);

  const personalRecords = useMemo(() => {
    const keyLifts = ['Barbell Bench Press', 'Barbell Squat', 'Deadlift', 'Overhead Press'];
    const records: Record<string, number> = {};

    history.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (keyLifts.includes(ex.name)) {
          let maxForEx = 0;
          ex.sets.forEach((s) => {
            if (typeof s.weight === 'number' && typeof s.reps === 'number') {
              const oneRM = calculateOneRepMax(s.weight, s.reps);
              if (oneRM > maxForEx) maxForEx = oneRM;
            }
          });
          if (!records[ex.name] || maxForEx > records[ex.name]) {
            records[ex.name] = maxForEx;
          }
        }
      });
    });
    return records;
  }, [history]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const hasWorkout = history.some((h) => new Date(h.date).toDateString() === date.toDateString());
      days.push({ date, hasWorkout });
    }
    return days;
  }, [currentMonth, history]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const scrollToAnalytics = () => {
    analyticsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredHistory = useMemo(() => {
    if (!selectedDate) return history;
    return history.filter((h) => new Date(h.date).toDateString() === selectedDate.toDateString());
  }, [history, selectedDate]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedDate) return [];
    return filteredHistory;
  }, [filteredHistory, selectedDate]);

  const weekDays = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      const isToday = d.toDateString() === today.toDateString();
      return {
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        day: d.getDate(),
        date: d,
        isToday,
      };
    });
  }, []);

  const hasWorkoutToday = useMemo(() => {
    const today = new Date().toDateString();
    return history.some((session) => new Date(session.date).toDateString() === today);
  }, [history]);

  const topRoutines = useMemo(() => {
    const names = sortedHistory.map((session) => session.name);
    return Array.from(new Set(names)).slice(0, 3);
  }, [sortedHistory]);

  const programWeek = Math.min(9, Math.max(1, Math.ceil(history.length / 4)));

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
            <TrendingUp size={32} />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">No Data Logged</h2>
          <p className="text-secondary mb-8 leading-relaxed">
            Your journey begins with a single set. Start tracking your workouts to see analytics here.
          </p>

          <button
            onClick={startWorkout}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200/60"
          >
            <Play size={18} fill="currentColor" /> Start First Workout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-4" data-animate>
      <div className="md:hidden space-y-4">
        <div className="ios-card p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              B
            </div>
            <div className="text-center">
              <p className="text-[11px] text-slate-500 uppercase tracking-widest">BFit</p>
              <p className="text-base font-extrabold text-slate-900">Home</p>
            </div>
            <button
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              onClick={onShowAnalytics}
            >
              <CalendarIcon size={18} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between bg-slate-50 rounded-2xl px-3 py-2">
            {weekDays.map((day) => {
              const isSelected = selectedDate?.toDateString() === day.date.toDateString();
              return (
                <button
                  type="button"
                  key={`${day.label}-${day.day}`}
                  onClick={() => setSelectedDate(isSelected ? null : day.date)}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{day.label}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isSelected || day.isToday
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    {day.day}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Workouts</p>
                <p className="text-sm font-bold text-slate-900">
                  {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-slate-500"
                onClick={() => setSelectedDate(null)}
              >
                Clear
              </button>
            </div>
            {selectedDaySessions.length === 0 ? (
              <p className="text-sm text-slate-500">No workouts logged.</p>
            ) : (
              <div className="ios-list">
                {selectedDaySessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onViewSession(session)}
                    className="row flex items-center justify-between w-full text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{session.name}</p>
                      <p className="text-xs text-slate-500">{session.durationMinutes} min</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ios-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-lg font-bold text-slate-900 mt-2">
                {sortedHistory[0]?.name || 'Upper'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {hasWorkoutToday ? 'Completed' : 'Not yet completed'}
              </p>
            </div>
            <button
              onClick={startWorkout}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500"
              title="Start workout"
            >
              <Play size={16} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={startWorkout}
          className="ios-card p-4 text-left w-full"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">My Program</p>
            <span className="ios-chip">Active</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-slate-900 rounded-full" />
            <p className="text-sm font-bold text-slate-900">Fall '25 Hypertrophy</p>
            <p className="text-xs text-slate-500 mt-1">Oct 20 - Dec 13</p>
            <div className="mt-3 h-2 bg-white rounded-full overflow-hidden border border-slate-100">
              <div
                className="h-full bg-slate-900 rounded-full"
                style={{ width: `${(programWeek / 9) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Week {programWeek} of 9</span>
              <span>{history.length}/{Math.max(history.length, 38)} Workouts</span>
            </div>
          </div>
        </button>

        <div className="ios-card p-4">
          <p className="text-sm font-bold text-slate-900 mb-3">My Routines</p>
          <div className="ios-list">
            {topRoutines.length === 0 ? (
              <div className="row text-sm text-slate-500">No routines yet.</div>
            ) : (
              topRoutines.map((routine, idx) => (
                <button
                  type="button"
                  onClick={startWorkout}
                  key={`${routine}-${idx}`}
                  className="row flex items-center justify-between w-full text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{routine}</p>
                    <p className="text-xs text-slate-500">
                      {idx === 0 ? 'Next scheduled in 2 days' : 'Next scheduled in 6 days'}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </button>
              ))
            )}
          </div>
          <button
            onClick={startWorkout}
            className="w-full mt-4 ios-pill text-sm text-slate-700 hover:bg-slate-50"
          >
            Start Workout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="hidden md:block mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900">Welcome back</h1>
            <p className="text-slate-500">Your data at a glance—stay consistent.</p>
          </div>

          {!selectedDate && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-transform transform hover:-translate-y-1 duration-200 interactive-card" data-animate>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">Streak</p>
                  <div className="bg-red-50 p-2 rounded-lg text-red-500">
                    <Flame size={18} />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-slate-900">{streak}d</p>
                <p className="text-xs text-slate-500 mt-2 font-semibold">Keep the chain alive</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow interactive-card" data-animate>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">This Week Volume</p>
                  <div className="bg-orange-50 p-2 rounded-lg text-accent">
                    <Dumbbell size={18} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-extrabold text-slate-900">{(weeklyVolumes.thisWeek / 1000).toFixed(1)}k</p>
                  {weeklyVolumes.lastWeek > 0 && (
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        weeklyVolumes.thisWeek >= weeklyVolumes.lastWeek ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {weeklyVolumes.thisWeek >= weeklyVolumes.lastWeek ? '+' : '-'}
                      {Math.abs(
                        Math.round(
                          (100 * (weeklyVolumes.thisWeek - weeklyVolumes.lastWeek)) / weeklyVolumes.lastWeek
                        )
                      )}
                      %
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-semibold">vs last week: {(weeklyVolumes.lastWeek / 1000).toFixed(1)}k</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow interactive-card" data-animate>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Sessions</p>
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-500">
                    <BarChart3 size={18} />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-slate-900">{history.length}</p>
                <p className="text-xs text-slate-500 mt-2 font-semibold">All-time logged</p>
              </div>
            </div>
          )}

          {/* Start Workout CTA removed (use global + button) */}

          {!selectedDate && alerts.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <AlertTriangle size={16} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-700">Alerts</p>
                <ul className="space-y-1">
                  {alerts.map((a, i) => (
                    <li key={i} className="text-sm text-slate-700">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recent Activity moved to standalone page */}
        </div>

        <div className="md:col-span-1 space-y-6" data-animate>
          <section
            ref={analyticsRef}
            className="glass-panel rounded-2xl p-6 interactive-card"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" /> Weekly Volume by Group
              </h3>
            </div>
            {weeklyVolumes.distro.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Log workouts to see group volume.</p>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyVolumes.distro} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="group" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#5b5ce2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="glass-panel rounded-2xl p-6 interactive-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon size={16} className="text-accent" /> Calendar
              </h3>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold w-16 text-center text-slate-700">
                  {currentMonth.toLocaleDateString(undefined, { month: 'short' })}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] text-slate-400 font-bold">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((d, i) => (
                <div key={i} className="aspect-square flex justify-center items-center">
                  {d ? (
                    <button
                      onClick={() =>
                        setSelectedDate((curr) => (curr?.toDateString() === d.date.toDateString() ? null : d.date))
                      }
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all relative ${
                        selectedDate?.toDateString() === d.date.toDateString()
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {d.date.getDate()}
                      {d.hasWorkout && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>
          </section>

          {!selectedDate && Object.keys(personalRecords).length > 0 && (
            <section className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10">
              <div className="flex items-center gap-2 mb-6 text-accent">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Trophy size={18} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Records</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(personalRecords).map(([name, weight]) => (
                  <div
                    key={name}
                    className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-slate-300">{name}</span>
                    <span className="text-lg font-bold font-mono tracking-tight">
                      {weight}{' '}
                      <span className="text-xs text-slate-500 font-sans font-normal ml-1">
                        lbs
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const Dumbbell = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6.5 6.5 11 11" />
    <path d="m21 21-1-1" />
    <path d="m3 3 1 1" />
    <path d="m18 22 4-4" />
    <path d="m2 6 4-4" />
    <path d="m3 10 7-7" />
    <path d="m14 21 7-7" />
  </svg>
);

export default Dashboard;
