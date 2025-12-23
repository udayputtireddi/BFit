import React, { useMemo } from 'react';
import { WorkoutSession } from '../types';
import { BarChart3, Flame, Clock3, Dumbbell } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface WeeklyReportProps {
  history: WorkoutSession[];
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ history }) => {
  const now = useMemo(() => new Date(), []);
  const startOfWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const sessionVolume = (session: WorkoutSession) =>
    session.exercises.reduce((exAcc, ex) => {
      // only strength volumes count
      const vol = ex.sets.reduce(
        (sAcc, s) =>
          sAcc + (typeof s.weight === 'number' ? s.weight : 0) * (typeof s.reps === 'number' ? s.reps : 0),
        0
      );
      return exAcc + vol;
    }, 0);

  const weekSessions = history.filter((s) => new Date(s.date) >= startOfWeek);

  const summary = useMemo(() => {
    if (weekSessions.length === 0) {
      return {
        totalSessions: 0,
        totalVolume: 0,
        avgDuration: 0,
        topExercises: [] as { name: string; volume: number }[],
        groupVolume: [] as { group: string; volume: number }[],
      };
    }

    const totalVolume = weekSessions.reduce((acc, s) => acc + sessionVolume(s), 0);
    const avgDuration =
      weekSessions.reduce((acc, s) => {
        const d = typeof s.durationMinutes === 'number' ? s.durationMinutes : 0;
        return acc + d;
      }, 0) / weekSessions.length;

    const perExercise: Record<string, number> = {};
    const perGroup: Record<string, number> = {};

    weekSessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        const vol = ex.sets.reduce(
          (sAcc, s) =>
            sAcc + (typeof s.weight === 'number' ? s.weight : 0) * (typeof s.reps === 'number' ? s.reps : 0),
          0
        );
        if (vol <= 0) return; // skip cardio/empty
        perExercise[ex.name] = (perExercise[ex.name] || 0) + vol;
        perGroup[ex.muscleGroup || 'Other'] = (perGroup[ex.muscleGroup || 'Other'] || 0) + vol;
      });
    });

    const topExercises = Object.entries(perExercise)
      .map(([name, volume]) => ({ name, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3);

    const groupVolume = Object.entries(perGroup)
      .map(([group, volume]) => ({ group, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume);

    return {
      totalSessions: weekSessions.length,
      totalVolume,
      avgDuration,
      topExercises,
      groupVolume,
    };
  }, [weekSessions, sessionVolume]);

  const highlights = useMemo(() => {
    const list: string[] = [];
    if (summary.totalSessions >= 3) list.push('Great frequency this week');
    if (summary.topExercises[0]) list.push(`Highest volume: ${summary.topExercises[0].name}`);
    if (summary.groupVolume.length >= 2) {
      const top = summary.groupVolume[0];
      const low = summary.groupVolume[summary.groupVolume.length - 1];
      if (top.volume > low.volume * 2 && low.volume > 0) {
        list.push(`Volume imbalance: ${top.group} is >2x ${low.group}.`);
      }
    }
    return list;
  }, [summary]);

  const cardioSummary = useMemo(() => {
    let totalMinutes = 0;
    let totalDistance = 0;
    const byExercise: Record<string, { minutes: number; distance: number }> = {};

    weekSessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (ex.muscleGroup !== 'Cardio') return;
        ex.sets.forEach((s) => {
          const mins = typeof s.durationMinutes === 'number' ? s.durationMinutes : 0;
          const dist = typeof s.distance === 'number' ? s.distance : 0;
          totalMinutes += mins;
          totalDistance += dist;
          byExercise[ex.name] = {
            minutes: (byExercise[ex.name]?.minutes || 0) + mins,
            distance: (byExercise[ex.name]?.distance || 0) + dist,
          };
        });
      });
    });

    const topCardio = Object.entries(byExercise)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.minutes - a.minutes || b.distance - a.distance)
      .slice(0, 3);

    return { totalMinutes, totalDistance, topCardio };
  }, [weekSessions]);

  if (weekSessions.length === 0) {
    return (
      <div className="ios-card p-4" data-animate>
        <p className="text-sm font-bold text-slate-800 mb-1">Weekly Report</p>
        <p className="text-slate-500 text-sm">No workouts in the last 7 days. Log a session to see your report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-animate>
      <div className="ios-card p-4 interactive-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-slate-800">Weekly Report</p>
            <p className="text-xs text-slate-500">
              {startOfWeek.toLocaleDateString()} - {now.toLocaleDateString()}
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase">Last 7 days</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Flame size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Sessions</p>
              <p className="text-xl font-extrabold text-slate-900">{summary.totalSessions}</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Dumbbell size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Total Volume</p>
              <p className="text-xl font-extrabold text-slate-900">{(summary.totalVolume / 1000).toFixed(1)}k</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock3 size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Avg Duration</p>
              <p className="text-xl font-extrabold text-slate-900">{summary.avgDuration.toFixed(0)} min</p>
            </div>
          </div>
        </div>

        {highlights.length > 0 && (
          <div className="mt-4 bg-white border border-slate-100 rounded-xl p-3 text-sm text-slate-700 space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase">Highlights</p>
            <ul className="list-disc list-inside space-y-1">
              {highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="ios-card p-4 interactive-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={16} className="text-accent" /> Top Volume Exercises
            </p>
          </div>
          {summary.topExercises.length === 0 ? (
            <p className="text-slate-500 text-sm">Not enough data yet.</p>
          ) : (
            <ul className="space-y-2">
              {summary.topExercises.map((ex) => (
                <li key={ex.name} className="flex justify-between text-sm font-semibold text-slate-800">
                  <span>{ex.name}</span>
                  <span className="text-slate-500">{Math.round(ex.volume)} lbs</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ios-card p-4 interactive-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800">Muscle Group Volume</p>
          </div>
          {summary.groupVolume.length === 0 ? (
            <p className="text-slate-500 text-sm">No data for this week.</p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.groupVolume} margin={{ left: -20 }}>
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
      </div>

      <div className="ios-card p-4 interactive-card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Flame size={16} className="text-amber-500" /> Cardio Insights (last 7d)
          </p>
        </div>
        {cardioSummary.totalMinutes === 0 ? (
          <p className="text-slate-500 text-sm">No cardio logged this week.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3 text-sm font-semibold text-slate-700">
              <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-[11px] font-bold uppercase text-slate-500">Total Time</p>
                <p className="text-lg font-extrabold text-slate-900">{cardioSummary.totalMinutes.toFixed(0)} min</p>
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-[11px] font-bold uppercase text-slate-500">Total Distance</p>
                <p className="text-lg font-extrabold text-slate-900">
                  {cardioSummary.totalDistance.toFixed(1)} <span className="text-xs text-slate-500">units</span>
                </p>
              </div>
            </div>
            {cardioSummary.topCardio.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Top Cardio</p>
                <ul className="space-y-1 text-sm font-semibold text-slate-800">
                  {cardioSummary.topCardio.map((c) => (
                    <li key={c.name} className="flex justify-between">
                      <span>{c.name}</span>
                      <span className="text-slate-500">
                        {c.minutes.toFixed(0)} min · {c.distance.toFixed(1)} dist
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReport;
