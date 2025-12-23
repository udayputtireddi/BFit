import React, { useMemo, useState } from 'react';
import { WorkoutSession } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, AlertTriangle, Award } from 'lucide-react';

interface Props {
  history: WorkoutSession[];
}

type TrendStatus = 'Progressing' | 'Maintaining' | 'Regressing';

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const estimateOneRM = (weight: number, reps: number) => {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
};

const computePerExercise = (history: WorkoutSession[]) => {
  const map: Record<
    string,
    {
      points: { date: string; maxWeight: number; volume: number; oneRm: number }[];
    }
  > = {};

  history.forEach((session) => {
    session.exercises.forEach((ex) => {
      const hasLiftingData = ex.sets.some(
        (s) => typeof s.weight === 'number' && s.weight > 0 && typeof s.reps === 'number' && s.reps > 0
      );
      if (!hasLiftingData) return; // skip cardio/empty entries

      let maxWeight = 0;
      let volume = 0;
      let best1rm = 0;
      ex.sets.forEach((s) => {
        const w = typeof s.weight === 'number' ? s.weight : 0;
        const r = typeof s.reps === 'number' ? s.reps : 0;
        maxWeight = Math.max(maxWeight, w);
        volume += w * r;
        best1rm = Math.max(best1rm, estimateOneRM(w, r));
      });
      if (!map[ex.name]) map[ex.name] = { points: [] };
      map[ex.name].points.push({ date: session.date, maxWeight, volume, oneRm: best1rm });
    });
  });

  Object.values(map).forEach((ex) => {
    ex.points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });
  return map;
};

const computeTrend = (points: { maxWeight: number; volume: number }[]): TrendStatus => {
  if (points.length < 2) return 'Maintaining';
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const lastScore = last.maxWeight * 10 + last.volume;
  const prevScore = prev.maxWeight * 10 + prev.volume;
  if (lastScore > prevScore * 1.02) return 'Progressing';
  if (lastScore < prevScore * 0.98) return 'Regressing';
  return 'Maintaining';
};

const buildSparkline = (values: number[]) => {
  if (values.length === 0) return '';
  const width = 72;
  const height = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values
    .map((v, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const StatusChip = ({ status }: { status: TrendStatus }) => {
  const color =
    status === 'Progressing'
      ? 'bg-green-100 text-green-700'
      : status === 'Regressing'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full ${color}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {status}
    </span>
  );
};

const ProgressAnalytics: React.FC<Props> = ({ history }) => {
  const perExercise = useMemo(() => computePerExercise(history), [history]);
  const exerciseNames = useMemo(() => Object.keys(perExercise).sort(), [perExercise]);
  const [selected, setSelected] = useState<string | null>(exerciseNames[0] || null);

  const current = selected ? perExercise[selected] : null;
  const trend = current ? computeTrend(current.points) : 'Maintaining';
  const bestPR = current
    ? Math.max(...current.points.map((p) => p.oneRm || 0), 0)
    : 0;

  const weeklyMuscleVolume = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    const volumes: Record<string, number> = {};
    history.forEach((session) => {
      const d = new Date(session.date);
      if (d < start) return;
      session.exercises.forEach((ex) => {
        if (ex.muscleGroup === 'Cardio') return;
        const v = ex.sets.reduce(
          (sAcc, s) =>
            sAcc + (typeof s.weight === 'number' ? s.weight : 0) * (typeof s.reps === 'number' ? s.reps : 0),
          0
        );
        if (v <= 0) return;
        const key = ex.muscleGroup || 'Other';
        volumes[key] = (volumes[key] || 0) + v;
      });
    });
    return Object.entries(volumes)
      .map(([group, volume]) => ({ group, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume);
  }, [history]);

  const imbalance =
    weeklyMuscleVolume.length >= 2
      ? (() => {
          const top = weeklyMuscleVolume[0];
          const low = weeklyMuscleVolume[weeklyMuscleVolume.length - 1];
          if (top.volume > low.volume * 2 && low.volume > 0) {
            return `${top.group} volume is >2x ${low.group}. Consider adding sets for ${low.group}.`;
          }
          return null;
        })()
      : null;

  const maxGroupVolume = useMemo(() => {
    if (weeklyMuscleVolume.length === 0) return 1;
    return Math.max(...weeklyMuscleVolume.map((group) => group.volume), 1);
  }, [weeklyMuscleVolume]);

  const groupIntensity = useMemo(() => {
    const map: Record<string, number> = {};
    weeklyMuscleVolume.forEach((group) => {
      map[group.group] = Math.min(1, group.volume / maxGroupVolume);
    });
    return map;
  }, [weeklyMuscleVolume, maxGroupVolume]);

  const BodyFigure = ({ size = 120 }: { size?: number }) => {
    const colors: Record<string, string> = {
      Arms: '#f97316',
      Shoulders: '#facc15',
      Chest: '#7dd3fc',
      Back: '#60a5fa',
      Abs: '#34d399',
      Legs: '#fb7185',
    };
    const intensity = (group: string) => 0.25 + (groupIntensity[group] || 0) * 0.6;

    return (
      <svg viewBox="0 0 140 260" style={{ width: size, height: size * 1.9 }}>
        <defs>
          <linearGradient id="bf-core" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b6cff" />
            <stop offset="100%" stopColor="#5b5ce2" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="26" r="16" fill="#1f2433" opacity="0.08" />
        <path
          d="M70 42c-16 0-28 12-28 28v28c0 16 10 30 28 30s28-14 28-30V70c0-16-12-28-28-28z"
          fill="url(#bf-core)"
          opacity="0.18"
        />
        <path
          d="M32 70c-8 3-10 10-10 20v36c0 10 6 18 16 18h2V74c0-3-3-6-8-4z"
          fill={colors.Arms}
          opacity={intensity('Arms')}
        />
        <path
          d="M108 70c8 3 10 10 10 20v36c0 10-6 18-16 18h-2V74c0-3 3-6 8-4z"
          fill={colors.Arms}
          opacity={intensity('Arms')}
        />
        <rect x="46" y="54" width="18" height="18" rx="9" fill={colors.Shoulders} opacity={intensity('Shoulders')} />
        <rect x="76" y="54" width="18" height="18" rx="9" fill={colors.Shoulders} opacity={intensity('Shoulders')} />
        <rect x="50" y="78" width="40" height="32" rx="12" fill={colors.Chest} opacity={intensity('Chest')} />
        <rect x="52" y="112" width="36" height="26" rx="12" fill={colors.Abs} opacity={intensity('Abs')} />
        <rect x="46" y="142" width="22" height="72" rx="11" fill={colors.Legs} opacity={intensity('Legs')} />
        <rect x="72" y="142" width="22" height="72" rx="11" fill={colors.Legs} opacity={intensity('Legs')} />
        <rect x="44" y="214" width="22" height="34" rx="11" fill={colors.Legs} opacity={intensity('Legs') * 0.75} />
        <rect x="74" y="214" width="22" height="34" rx="11" fill={colors.Legs} opacity={intensity('Legs') * 0.75} />
        <path
          d="M70 40c-16 0-28 12-28 28v30c0 18 12 32 28 32s28-14 28-32V68c0-16-12-28-28-28zM42 126h56"
          fill="none"
          stroke="#111827"
          strokeOpacity="0.18"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M22 92c0-12 6-22 16-24M118 92c0-12-6-22-16-24M46 138l-10 40M94 138l10 40"
          fill="none"
          stroke="#111827"
          strokeOpacity="0.14"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  if (history.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center ios-card">
        <div className="text-center space-y-2">
          <TrendingUp className="mx-auto text-slate-300" size={32} />
          <p className="text-lg font-bold text-slate-800">Log a workout to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300" data-animate>
      <div className="md:hidden space-y-4">
        <div className="ios-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Analytics</p>
            <span className="ios-chip">Last 7d</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Estimated 1RM</p>
          <div className="mt-3 space-y-3">
            {exerciseNames.slice(0, 4).map((name) => {
              const points = perExercise[name]?.points || [];
              const last = points[points.length - 1];
              const values = points.map((p) => p.oneRm || 0).slice(-6);
              const sparkline = buildSparkline(values);
              return (
                <div key={name} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {last?.oneRm || 0} lb {last?.maxWeight ? ` ${last.maxWeight} lb x ${Math.max(1, Math.round(last.maxWeight / 10))}` : ''}
                    </p>
                  </div>
                  <svg width="72" height="24" viewBox="0 0 72 24">
                    <polyline
                      fill="none"
                      stroke="#5b5ce2"
                      strokeWidth="2"
                      points={sparkline}
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ios-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">Training Load</p>
            <span className="text-xs text-slate-500">Recovery</span>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-24 flex-shrink-0">
              <BodyFigure size={92} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold flex-1">
              {weeklyMuscleVolume.slice(0, 6).map((group) => (
                <div key={group.group} className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">{group.group}</span>
                    <span className="text-slate-500">{Math.min(100, Math.round(group.volume / 10))}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                    <div
                      className="h-full bg-slate-900 rounded-full"
                      style={{ width: `${Math.min(100, Math.round(group.volume / 10))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block space-y-6">
      <div className="ios-card p-4 overflow-hidden interactive-card" data-animate>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Per Exercise</h3>
            <p className="text-sm text-slate-500">Weight & volume trends with plateau status</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={selected || ''}
              onChange={(e) => setSelected(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              {exerciseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {current && <StatusChip status={trend} />}
            {current && bestPR > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-slate-900 text-white">
                <Award size={14} /> PR {bestPR} lbs est 1RM
              </span>
            )}
          </div>
        </div>

        {current && current.points.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold">
                <TrendingUp size={16} /> Max Weight
              </div>
              <div className="w-full h-64">
                <ResponsiveContainer>
                  <LineChart data={current.points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <Legend />
                    <Line type="monotone" dataKey="maxWeight" name="Weight" stroke="#5b5ce2" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold">
                <AlertTriangle size={16} /> Volume
              </div>
              <div className="w-full h-64">
                <ResponsiveContainer>
                  <LineChart data={current.points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <Legend />
                    <Line type="monotone" dataKey="volume" name="Volume" stroke="#ff9f1a" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-10">No data for this exercise yet.</div>
        )}
      </div>

      <div className="ios-card p-4 overflow-hidden interactive-card" data-animate>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Muscle Group Volume (Last 7d)</h3>
            <p className="text-sm text-slate-500">See distribution and weak points</p>
          </div>
          {imbalance && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
              {imbalance}
            </span>
          )}
        </div>
        {weeklyMuscleVolume.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Log workouts to see volume.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={weeklyMuscleVolume} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="group" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="volume" fill="#5b5ce2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="ios-card p-4 overflow-hidden interactive-card" data-animate>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Training Load</h3>
            <p className="text-sm text-slate-500">Muscle recovery readiness</p>
          </div>
          <span className="text-xs text-slate-500">Recovery</span>
        </div>
        <div className="flex gap-6 items-start">
          <div className="w-32 flex-shrink-0">
            <BodyFigure size={120} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-semibold flex-1">
            {weeklyMuscleVolume.slice(0, 6).map((group) => (
              <div key={group.group} className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">{group.group}</span>
                  <span className="text-slate-500">{Math.min(100, Math.round(group.volume / 10))}%</span>
                </div>
                <div className="mt-2 h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                  <div
                    className="h-full bg-slate-900 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(group.volume / 10))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ProgressAnalytics;
