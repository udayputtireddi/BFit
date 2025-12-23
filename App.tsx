
import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, BrainCircuit, PlusCircle, ArrowLeft, Dumbbell, LogOut, Settings, User as UserIcon, BarChart3, History as HistoryIcon, X, Share2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ActiveWorkout from './components/ActiveWorkout';
import Coach from './components/Coach';
import SessionDetails from './components/SessionDetails';
import ProgressAnalytics from './components/ProgressAnalytics';
import RecentActivity from './components/RecentActivity';
import WeeklyReport from './components/WeeklyReport';
import ShareHub from './components/ShareHub';
import { WorkoutSession, ExerciseLog } from './types';
import { MOCK_HISTORY } from './constants';
import { fetchWorkoutHistory, addWorkoutSession, deleteWorkoutSession, updateWorkoutSession } from './services/storage';
import { watchAuth, logout } from './services/auth';
import Login from './components/Login';
import { requestNotificationPermission, sendNotification } from './services/notifications';

enum View {
  DASHBOARD = 'dashboard',
  WORKOUT = 'workout',
  COACH = 'coach',
  ANALYTICS = 'analytics',
  RECENT = 'recent',
  SHARE = 'share',
  SESSION_DETAILS = 'session_details'
}

type ProgramDay = {
  id: string;
  label: string;
  break?: boolean;
  exercises: { name: string; weight: number; muscleGroup?: string }[];
};

type Program = {
  id: string;
  name: string;
  days: ProgramDay[];
};

const PROGRAMS: Program[] = [
  {
    id: 'custom-split',
    name: 'Your Split (Upper/Lower/Push/Pull/Leg)',
    days: [
      {
        id: 'day1',
        label: 'Upper (Monday)',
        exercises: [
          { name: 'Incline Dumbbell Chest Press', weight: 40, muscleGroup: 'Chest' },
          { name: 'Shoulder Press', weight: 30, muscleGroup: 'Shoulders' },
          { name: 'Lying Bicep Curl', weight: 20, muscleGroup: 'Biceps' },
          { name: 'Bent Tricep Extension', weight: 15, muscleGroup: 'Triceps' },
          { name: 'Back Extension', weight: 20, muscleGroup: 'Back' },
        ],
      },
      {
        id: 'day2',
        label: 'Lower (Tuesday)',
        exercises: [
          { name: 'Goblin Squats', weight: 30, muscleGroup: 'Legs' },
          { name: 'Lunges', weight: 20, muscleGroup: 'Legs' },
          { name: 'Split Squats', weight: 15, muscleGroup: 'Legs' },
          { name: 'Leg Deadlift', weight: 25, muscleGroup: 'Legs' },
          { name: 'Calf Raises', weight: 25, muscleGroup: 'Legs' },
        ],
      },
      { id: 'day3', label: 'Break (Wednesday)', break: true, exercises: [] },
      {
        id: 'day4',
        label: 'Push (Thursday)',
        exercises: [
          { name: 'Incline Dumbbell Press', weight: 30, muscleGroup: 'Chest' },
          { name: 'Lateral Raises', weight: 15, muscleGroup: 'Shoulders' },
          { name: 'Lying Tricep Extension', weight: 10, muscleGroup: 'Triceps' },
          { name: 'Shoulder Press', weight: 25, muscleGroup: 'Shoulders' },
          { name: 'Close Grip Dumbbell Press', weight: 20, muscleGroup: 'Chest' },
          { name: 'Pec Fly', weight: 15, muscleGroup: 'Chest' },
        ],
      },
      {
        id: 'day5',
        label: 'Pull (Friday)',
        exercises: [
          { name: 'Rear Delt Rows', weight: 20, muscleGroup: 'Back' },
          { name: 'Zottman Curls', weight: 20, muscleGroup: 'Biceps' },
          { name: 'Rear Delt Fly', weight: 15, muscleGroup: 'Shoulders' },
          { name: 'Bicep Curls', weight: 25, muscleGroup: 'Biceps' },
          { name: 'Reverse Curls', weight: 10, muscleGroup: 'Forearms' },
        ],
      },
      {
        id: 'day6',
        label: 'Legs (Saturday)',
        exercises: [
          { name: 'Goblin Squats', weight: 30, muscleGroup: 'Legs' },
          { name: 'Lunges', weight: 20, muscleGroup: 'Legs' },
          { name: 'Split Squats', weight: 20, muscleGroup: 'Legs' },
          { name: 'Leg Deadlift', weight: 25, muscleGroup: 'Legs' },
          { name: 'Calf Raises', weight: 25, muscleGroup: 'Legs' },
        ],
      },
      { id: 'day7', label: 'Break (Sunday)', break: true, exercises: [] },
    ],
  },
  {
    id: 'ppl-classic',
    name: 'PPL Classic',
    days: [
      {
        id: 'ppl-push',
        label: 'Push',
        exercises: [
          { name: 'Barbell Bench Press', weight: 95, muscleGroup: 'Chest' },
          { name: 'Overhead Press', weight: 65, muscleGroup: 'Shoulders' },
          { name: 'Dumbbell Incline Press', weight: 40, muscleGroup: 'Chest' },
          { name: 'Lateral Raises', weight: 15, muscleGroup: 'Shoulders' },
          { name: 'Tricep Rope Pushdown', weight: 30, muscleGroup: 'Triceps' },
        ],
      },
      {
        id: 'ppl-pull',
        label: 'Pull',
        exercises: [
          { name: 'Deadlift', weight: 135, muscleGroup: 'Back' },
          { name: 'Lat Pulldown', weight: 70, muscleGroup: 'Back' },
          { name: 'Seated Cable Row', weight: 70, muscleGroup: 'Back' },
          { name: 'Hammer Curl', weight: 25, muscleGroup: 'Biceps' },
          { name: 'Face Pull', weight: 25, muscleGroup: 'Shoulders' },
        ],
      },
      {
        id: 'ppl-legs',
        label: 'Legs',
        exercises: [
          { name: 'Barbell Squat', weight: 115, muscleGroup: 'Legs' },
          { name: 'Romanian Deadlift', weight: 95, muscleGroup: 'Legs' },
          { name: 'Leg Press', weight: 180, muscleGroup: 'Legs' },
          { name: 'Leg Extension', weight: 60, muscleGroup: 'Legs' },
          { name: 'Calf Raises', weight: 60, muscleGroup: 'Legs' },
        ],
      },
    ],
  },
  {
    id: 'arnold-split',
    name: 'Arnold Classic Split',
    days: [
      {
        id: 'arnold-chest-back',
        label: 'Chest & Back',
        exercises: [
          { name: 'Barbell Bench Press', weight: 135, muscleGroup: 'Chest' },
          { name: 'Incline Dumbbell Press', weight: 45, muscleGroup: 'Chest' },
          { name: 'Weighted Pull Up', weight: 0, muscleGroup: 'Back' },
          { name: 'Barbell Row', weight: 115, muscleGroup: 'Back' },
          { name: 'Dumbbell Fly', weight: 30, muscleGroup: 'Chest' },
          { name: 'Straight Arm Pulldown', weight: 40, muscleGroup: 'Back' },
        ],
      },
      {
        id: 'arnold-shoulders-arms',
        label: 'Shoulders & Arms',
        exercises: [
          { name: 'Overhead Press', weight: 75, muscleGroup: 'Shoulders' },
          { name: 'Arnold Press', weight: 35, muscleGroup: 'Shoulders' },
          { name: 'Lateral Raises', weight: 15, muscleGroup: 'Shoulders' },
          { name: 'Barbell Curl', weight: 65, muscleGroup: 'Biceps' },
          { name: 'Skullcrushers', weight: 55, muscleGroup: 'Triceps' },
          { name: 'Hammer Curl', weight: 25, muscleGroup: 'Biceps' },
          { name: 'Tricep Rope Pushdown', weight: 30, muscleGroup: 'Triceps' },
        ],
      },
      {
        id: 'arnold-legs',
        label: 'Legs',
        exercises: [
          { name: 'Barbell Squat', weight: 135, muscleGroup: 'Legs' },
          { name: 'Romanian Deadlift', weight: 115, muscleGroup: 'Legs' },
          { name: 'Leg Press', weight: 180, muscleGroup: 'Legs' },
          { name: 'Walking Lunges', weight: 40, muscleGroup: 'Legs' },
          { name: 'Leg Extension', weight: 60, muscleGroup: 'Legs' },
          { name: 'Leg Curl', weight: 60, muscleGroup: 'Legs' },
          { name: 'Calf Raises', weight: 80, muscleGroup: 'Legs' },
        ],
      },
    ],
  },
  {
    id: 'jeff-upper-lower',
    name: 'Jeff Nippard Upper/Lower',
    days: [
      {
        id: 'jeff-upper',
        label: 'Upper',
        exercises: [
          { name: 'Incline Barbell Bench Press', weight: 115, muscleGroup: 'Chest' },
          { name: 'Weighted Pull Up', weight: 0, muscleGroup: 'Back' },
          { name: 'Seated Cable Row', weight: 80, muscleGroup: 'Back' },
          { name: 'Dumbbell Shoulder Press', weight: 40, muscleGroup: 'Shoulders' },
          { name: 'Lateral Raises', weight: 15, muscleGroup: 'Shoulders' },
          { name: 'Barbell Curl', weight: 65, muscleGroup: 'Biceps' },
          { name: 'Overhead Tricep Extension', weight: 45, muscleGroup: 'Triceps' },
        ],
      },
      {
        id: 'jeff-lower',
        label: 'Lower',
        exercises: [
          { name: 'Back Squat', weight: 145, muscleGroup: 'Legs' },
          { name: 'Romanian Deadlift', weight: 115, muscleGroup: 'Legs' },
          { name: 'Leg Press', weight: 200, muscleGroup: 'Legs' },
          { name: 'Leg Curl', weight: 70, muscleGroup: 'Legs' },
          { name: 'Calf Raises', weight: 90, muscleGroup: 'Legs' },
          { name: 'Walking Lunges', weight: 40, muscleGroup: 'Legs' },
        ],
      },
    ],
  },
  {
    id: 'cbum-ppl',
    name: 'CBUM Push/Pull/Legs',
    days: [
      {
        id: 'cbum-push',
        label: 'Push',
        exercises: [
          { name: 'Dumbbell Bench Press', weight: 120, muscleGroup: 'Chest' },
          { name: 'Incline Dumbbell Press', weight: 50, muscleGroup: 'Chest' },
          { name: 'Overhead Press', weight: 75, muscleGroup: 'Shoulders' },
          { name: 'Lateral Raises', weight: 20, muscleGroup: 'Shoulders' },
          { name: 'Tricep Rope Pushdown', weight: 40, muscleGroup: 'Triceps' },
          { name: 'Dips', weight: 0, muscleGroup: 'Triceps' },
        ],
      },
      {
        id: 'cbum-pull',
        label: 'Pull',
        exercises: [
          { name: 'Barbell Row', weight: 115, muscleGroup: 'Back' },
          { name: 'Lat Pulldown', weight: 90, muscleGroup: 'Back' },
          { name: 'Seated Cable Row', weight: 90, muscleGroup: 'Back' },
          { name: 'Face Pull', weight: 30, muscleGroup: 'Shoulders' },
          { name: 'Hammer Curl', weight: 30, muscleGroup: 'Biceps' },
          { name: 'Preacher Curl', weight: 50, muscleGroup: 'Biceps' },
        ],
      },
      {
        id: 'cbum-legs',
        label: 'Legs',
        exercises: [
          { name: 'Hack Squat', weight: 180, muscleGroup: 'Legs' },
          { name: 'Romanian Deadlift', weight: 135, muscleGroup: 'Legs' },
          { name: 'Leg Press', weight: 220, muscleGroup: 'Legs' },
          { name: 'Leg Curl', weight: 80, muscleGroup: 'Legs' },
          { name: 'Calf Raises', weight: 100, muscleGroup: 'Legs' },
        ],
      },
    ],
  },
];

const App: React.FC = () => {
  const formatDayName = (label: string) => {
    const cleaned = label.split('(')[0].trim();
    if (!cleaned) return label;
    return cleaned.toLowerCase().includes('day') ? cleaned : `${cleaned} Day`;
  };

  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [history, setHistory] = useState<WorkoutSession[]>(MOCK_HISTORY);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [presetExercises, setPresetExercises] = useState<ExerciseLog[] | null>(null);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(PROGRAMS[0].id);
  const [celebrations, setCelebrations] = useState<string[]>([]);
  const [showDailyPopup, setShowDailyPopup] = useState(false);
  const [dailyProgramDay, setDailyProgramDay] = useState<{ program: Program; day: ProgramDay } | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('ironlog_reminder_time') || '18:00');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Scroll-triggered animation observer (adds is-visible but content remains visible by default)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const targets = document.querySelectorAll('[data-animate]');
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const buildPreset = (day: ProgramDay): ExerciseLog[] => {
    return day.exercises.map((ex, idx) => ({
      id: `${day.id}-${idx}`,
      exerciseId: ex.name.toLowerCase().replace(/\s+/g, '-'),
      name: ex.name,
      sets: [{ id: `${day.id}-${idx}-set1`, reps: 10, weight: ex.weight, rpe: '', completed: false }],
      notes: '',
      muscleGroup: ex.muscleGroup,
    }));
  };

  // We keep track if a workout is actually in progress
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  useEffect(() => {
    const unsub = watchAuth((u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setHistory([]);
        setSelectedSession(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Soft-request notification permission on load (non-blocking)
    requestNotificationPermission().then((p) => setNotificationPermission(p)).catch(() => {});
  }, []);

  const hasTodaySession = useMemo(() => {
    return history.some((s) => {
      const d = new Date(s.date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });
  }, [history]);

  useEffect(() => {
    if (!user || isWorkoutActive) return;
    // Skip if already logged today
    if (hasTodaySession) return;
    const todayKey = new Date().toDateString();
    const seenKey = `ironlog_daily_popup_${todayKey}`;
    if (localStorage.getItem(seenKey)) return;

    const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' }).toLowerCase();
    const match = PROGRAMS.flatMap((program) =>
      program.days
        .filter((d) => !d.break)
        .map((day) => ({
          program,
          day,
          score:
            (day.label.toLowerCase().includes(weekday) ? 2 : 0) +
            (day.label.toLowerCase().includes('upper') && weekday.includes('mon') ? 1 : 0),
        }))
    ).sort((a, b) => b.score - a.score);

    const best = match[0] && match[0].score > 0 ? match[0] : null;
    if (best) {
      setDailyProgramDay({ program: best.program, day: best.day });
      setShowDailyPopup(true);
      localStorage.setItem(seenKey, '1');
    }
  }, [user, isWorkoutActive, hasTodaySession]);

  // Persist reminder preference
  useEffect(() => {
    if (reminderTime) localStorage.setItem('ironlog_reminder_time', reminderTime);
  }, [reminderTime]);

  // Local daily reminder if no session logged
  useEffect(() => {
    if (!reminderTime || !user) return;
    const checkReminder = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (hasTodaySession || isWorkoutActive) return;
      const today = new Date();
      const todayKey = today.toDateString();
      if (localStorage.getItem(`ironlog_reminded_${todayKey}`)) return;
      const [h, m] = reminderTime.split(':').map((v) => parseInt(v, 10));
      if (Number.isNaN(h) || Number.isNaN(m)) return;
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      const targetMinutes = h * 60 + m;
      if (nowMinutes >= targetMinutes) {
        sendNotification('Time to train', { body: 'Log your workout for today.' });
        localStorage.setItem(`ironlog_reminded_${todayKey}`, '1');
      }
    };
    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [reminderTime, hasTodaySession, isWorkoutActive, user]);

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      if (!user) {
        setLoadingHistory(false);
        return;
      }
      try {
        const results = await fetchWorkoutHistory(user.uid);
        if (isMounted) {
          setHistory(results);
          setDataError(null);
        }
      } catch (error) {
        console.error('Error loading history:', error);
        if (isMounted) setDataError('Could not load saved workouts. Please try again (check Firestore rules/auth).');
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleStartWorkout = () => {
    setEditingSession(null);
    setShowProgramPicker(true);
  };

  const startFreestyle = () => {
    setPresetExercises(null);
    setPresetName(null);
    setEditingSession(null);
    setIsWorkoutActive(true);
    setCurrentView(View.WORKOUT);
    setShowProgramPicker(false);
  };

  const startFromTemplate = (program: Program, day: ProgramDay) => {
    setPresetExercises(buildPreset(day));
    setPresetName(formatDayName(day.label));
    setEditingSession(null);
    setIsWorkoutActive(true);
    setCurrentView(View.WORKOUT);
    setShowProgramPicker(false);
    setShowDailyPopup(false);
  };

  const handleShowAnalytics = () => setCurrentView(View.ANALYTICS);

  const handleFinishWorkout = async (
    name: string,
    exercises: ExerciseLog[],
    duration: number,
    existingId?: string,
    dateOverride?: string
  ) => {
    const isEdit = Boolean(existingId && editingSession);
    const resolveDate = () => {
      if (dateOverride) {
        // Save with midday to avoid timezone date shift
        return new Date(`${dateOverride}T12:00:00`).toISOString();
      }
      if (isEdit && editingSession) return editingSession.date;
      return new Date().toISOString();
    };
    const sanitizeSet = (set: ExerciseLog['sets'][number]) => {
      const base: any = {
        id: set.id,
        reps: set.reps === '' ? '' : set.reps,
        weight: set.weight === '' ? '' : set.weight,
        completed: !!set.completed,
      };
      if (set.distance !== undefined) base.distance = set.distance === '' ? '' : set.distance;
      if (set.durationMinutes !== undefined) base.durationMinutes = set.durationMinutes === '' ? '' : set.durationMinutes;
      if (set.incline !== undefined) base.incline = set.incline === '' ? '' : set.incline;
      return base;
    };

    const sanitizeExercises = (items: ExerciseLog[]) =>
      items.map((ex) => ({
        ...ex,
        sets: ex.sets.map(sanitizeSet),
      }));

    const newSession: Omit<WorkoutSession, 'id'> = {
      date: resolveDate(),
      name: name || 'Untitled Workout',
      exercises: sanitizeExercises(exercises),
      durationMinutes: duration
    };
    try {
      if (!user) {
        setDataError('Please sign in to save your workout.');
        return;
      }
      setSavingSession(true);
      let saved: WorkoutSession;
      if (isEdit && existingId) {
        await updateWorkoutSession(user.uid, existingId, newSession);
        saved = { ...newSession, id: existingId };
      } else {
        saved = await addWorkoutSession(user.uid, newSession);
      }
      const updatedHistory = isEdit
        ? history.map((h) => (h.id === saved.id ? saved : h))
        : [saved, ...history];
      setHistory(updatedHistory);
      setIsWorkoutActive(false);
      setCurrentView(View.DASHBOARD);
      setPresetExercises(null);
      setPresetName(null);
      setEditingSession(null);

      // Celebration logic: PRs and milestones
      const prMessages: string[] = [];
      saved.exercises.forEach((ex) => {
        let sessionBest = 0;
        ex.sets.forEach((s) => {
          const w = typeof s.weight === 'number' ? s.weight : 0;
          const r = typeof s.reps === 'number' ? s.reps : 0;
          sessionBest = Math.max(sessionBest, Math.round(w * (1 + r / 30)));
        });
        const prevBest = history.reduce((max, sess) => {
          const found = sess.exercises.find((e) => e.name === ex.name);
          if (!found) return max;
          let best = max;
          found.sets.forEach((s) => {
            const w = typeof s.weight === 'number' ? s.weight : 0;
            const r = typeof s.reps === 'number' ? s.reps : 0;
            best = Math.max(best, Math.round(w * (1 + r / 30)));
          });
          return best;
        }, 0);
        if (sessionBest > prevBest && sessionBest > 0) {
          prMessages.push(`New PR on ${ex.name}: est ${sessionBest} lbs 1RM!`);
        }
      });
      const milestoneMessages: string[] = [];
      const totalSessions = updatedHistory.length;
      if ([10, 25, 50, 75, 100].includes(totalSessions)) {
        milestoneMessages.push(`Milestone: ${totalSessions} workouts logged!`);
      }
      const newCelebrations = [...prMessages, ...milestoneMessages];
      if (newCelebrations.length) {
        setCelebrations(newCelebrations);
        newCelebrations.forEach((msg) => {
          sendNotification('BFit', { body: msg });
        });
        setTimeout(() => setCelebrations([]), 5000);
      }
    } catch (error) {
      console.error('Error saving session:', error);
      const fallbackId = existingId || `local-${Date.now()}`;
      const fallbackSession: WorkoutSession = { ...newSession, id: fallbackId };
      const updatedHistory = isEdit
        ? history.map((h) => (h.id === fallbackId ? fallbackSession : h))
        : [fallbackSession, ...history];
      setHistory(updatedHistory);
      setDataError('Could not sync to cloud. Saved locally; please try again when online.');
      setIsWorkoutActive(false);
      setCurrentView(View.DASHBOARD);
      setPresetExercises(null);
      setPresetName(null);
      setEditingSession(null);
    } finally {
      setSavingSession(false);
    }
  };

  const handleCancelWorkout = () => {
    setIsWorkoutActive(false);
    setCurrentView(View.DASHBOARD);
    setPresetExercises(null);
    setPresetName(null);
    setEditingSession(null);
  };

  const handleTabChange = (view: View) => {
    setCurrentView(view);
  };

  const handleReturnToWorkout = () => {
    setCurrentView(View.WORKOUT);
  };

  const handleViewSession = (session: WorkoutSession) => {
      setSelectedSession(session);
      setCurrentView(View.SESSION_DETAILS);
  };

  const handleEditSession = (session: WorkoutSession) => {
    setEditingSession(session);
    setPresetExercises(session.exercises);
    setPresetName(session.name);
    setIsWorkoutActive(true);
    setCurrentView(View.WORKOUT);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) {
      setDataError('Please sign in to delete a workout.');
      return;
    }
    try {
      await deleteWorkoutSession(user.uid, sessionId);
      setHistory(history.filter((s) => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setCurrentView(View.DASHBOARD);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setDataError('Could not delete workout. Please try again.');
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => {
      const isActive = currentView === view || (view === View.DASHBOARD && currentView === View.SESSION_DETAILS);
      return (
                <button 
                  onClick={() => handleTabChange(view)}
                  className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 ${
                      isActive 
                      ? 'is-active' 
                      : ''
                  }`}
        >
          <Icon size={20} className={`nav-icon ${isActive ? 'text-white' : 'text-slate-500'}`} />
          <span className="font-semibold text-sm hidden md:block">{label}</span>
        </button>
      );
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600 font-semibold">Loading...</div>;
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="app-shell min-h-screen bg-transparent text-slate-900 font-sans flex flex-col md:flex-row">
      <div className="app-orb orb-one" aria-hidden="true" />
      <div className="app-orb orb-two" aria-hidden="true" />
      <div className="app-orb orb-three" aria-hidden="true" />
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-72 app-sidebar backdrop-blur-2xl text-slate-900 shrink-0 z-50 relative">
          <div className="p-6 flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <span className="text-white font-extrabold text-lg tracking-tight">B</span>
              </div>
              <div>
                  <h1 className="font-extrabold text-xl tracking-tight brand-title">BFit</h1>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Strength</p>
              </div>
          </div>

          <div className="flex-1 px-4 space-y-2">
              <NavItem view={View.DASHBOARD} icon={LayoutGrid} label="Dashboard" />
              <NavItem view={View.ANALYTICS} icon={BarChart3} label="Analytics" />
              <NavItem view={View.RECENT} icon={HistoryIcon} label="Recent" />
              <NavItem view={View.SHARE} icon={Share2} label="Share" />
              <NavItem view={View.COACH} icon={BrainCircuit} label="AI Coach" />
              
          </div>

          <div className="p-4 border-t border-slate-200">
              <button 
                onClick={() => logout()}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-200">
                  <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <UserIcon size={14} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold truncate">{user?.email || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">Switch account</p>
                  </div>
                  <Settings size={16} className="text-slate-400" />
              </button>
          </div>
      </aside>

      {/* Mobile Bottom Nav (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 app-bottom-nav z-50 grid grid-cols-6 items-center py-2 pb-safe text-slate-800">
        <button 
          onClick={() => handleTabChange(View.DASHBOARD)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === View.DASHBOARD || currentView === View.SESSION_DETAILS ? 'text-accent' : 'text-slate-400'}`}
        >
          <LayoutGrid size={24} strokeWidth={currentView === View.DASHBOARD ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => handleTabChange(View.ANALYTICS)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === View.ANALYTICS ? 'text-accent' : 'text-slate-400'}`}
        >
          <BarChart3 size={24} strokeWidth={currentView === View.ANALYTICS ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Analytics</span>
        </button>
        <div className="flex items-center justify-center">
          <button 
              onClick={() => isWorkoutActive ? handleReturnToWorkout() : handleStartWorkout()}
              className="flex flex-col items-center justify-center"
          >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
                  isWorkoutActive 
                  ? 'bg-white border-2 border-red-500 text-red-500 animate-pulse' 
                  : 'bg-gradient-to-r from-[#5b5ce2] to-[#7b7dff] text-white shadow-indigo-500/30'
              }`}>
                  <PlusCircle size={28} />
              </div>
               <span className="text-[10px] font-bold text-slate-500 mt-1">
                 Log
               </span>
          </button>
        </div>
        <button 
          onClick={() => handleTabChange(View.RECENT)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === View.RECENT ? 'text-accent' : 'text-slate-400'}`}
        >
          <HistoryIcon size={24} strokeWidth={currentView === View.RECENT ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Recent</span>
        </button>
        <button 
          onClick={() => handleTabChange(View.SHARE)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === View.SHARE ? 'text-accent' : 'text-slate-400'}`}
        >
          <Share2 size={24} strokeWidth={currentView === View.SHARE ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Share</span>
        </button>

        <button 
          onClick={() => handleTabChange(View.COACH)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === View.COACH ? 'text-accent' : 'text-slate-400'}`}
        >
          <BrainCircuit size={24} strokeWidth={currentView === View.COACH ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Coach</span>
        </button>
      </nav>

      {/* Settings Button: desktop in header, mobile fixed */}
      <button
        onClick={() => setShowSettingsPanel(true)}
        className="md:hidden fixed top-3 right-3 z-50 p-2 rounded-full bg-white/90 border border-slate-200 shadow-sm text-slate-600"
        aria-label="Settings"
      >
        <Settings size={18} />
      </button>

      {/* Settings Panel */}
      {showSettingsPanel && (
        <div className="fixed inset-0 z-[130]">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettingsPanel(false)} />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[90vw] bg-white shadow-2xl border-l border-slate-200 p-5 flex flex-col gap-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Settings</p>
                <h3 className="text-lg font-extrabold text-slate-900">Daily Reminder</h3>
              </div>
              <button
                onClick={() => setShowSettingsPanel(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Reminder time</label>
              <div className="w-full">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <p className="text-xs text-slate-500">
                You’ll get a nudge if you haven’t logged a workout by this time.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Notifications</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Status: {notificationPermission === 'granted' ? 'Enabled' : 'Tap to enable'}
                </span>
                <button
                  onClick={async () => {
                    const perm = await requestNotificationPermission();
                    setNotificationPermission(perm);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  {notificationPermission === 'granted' ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden relative bg-transparent z-10">
        {/* Top Header - Desktop Only */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 app-header backdrop-blur-xl sticky top-4 z-30 text-slate-900">
            <h2 className="text-xl font-bold tracking-tight">
                {currentView === View.DASHBOARD && 'Dashboard Overview'}
                {currentView === View.COACH && 'AI Performance Coach'}
                {currentView === View.ANALYTICS && 'Progress Analytics'}
                {currentView === View.RECENT && 'Recent Activity'}
                {currentView === View.SHARE && 'Share Workout'}
                {currentView === View.WORKOUT && 'Active Session'}
                {currentView === View.SESSION_DETAILS && 'Workout Details'}
            </h2>
            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric'})}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-xs font-bold text-slate-900 bg-white px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Switch to another account"
                >
                  Switch Account
                </button>
            </div>
        </header>

        <div className="h-full md:h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden scroll-smooth">
            <div className="w-full max-w-7xl mx-auto p-4 pb-36 md:p-8">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-20 text-slate-500 font-semibold">Loading your saved workouts...</div>
                ) : (
                  <>
                    {dataError && (
                      <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 font-semibold">
                        {dataError}
                      </div>
                    )}

                    {/* Dashboard View */}
                    <div className={`${currentView === View.DASHBOARD ? 'block' : 'hidden'}`}>
                        <Dashboard 
                            history={history} 
                            startWorkout={handleStartWorkout} 
                            onViewSession={handleViewSession}
                            onDeleteSession={handleDeleteSession}
                            onShowAnalytics={handleShowAnalytics}
                            onEditSession={handleEditSession}
                        />
                    </div>

                    {/* Session Details View */}
                    <div className={`${currentView === View.SESSION_DETAILS ? 'block' : 'hidden'}`}>
                        {selectedSession && (
                            <SessionDetails 
                                session={selectedSession} 
                                onBack={() => setCurrentView(View.DASHBOARD)} 
                                onDelete={handleDeleteSession}
                                onEdit={handleEditSession}
                            />
                        )}
                    </div>

                    {/* Coach View */}
                    <div className={`${currentView === View.COACH ? 'block' : 'hidden'}`}>
                        <Coach history={history} userId={user?.uid || null} />
                    </div>

                    {/* Recent Activity View */}
                    <div className={`${currentView === View.RECENT ? 'block' : 'hidden'}`}>
                      <RecentActivity
                        history={history}
                        onViewSession={handleViewSession}
                        onDeleteSession={handleDeleteSession}
                        onEditSession={handleEditSession}
                      />
                    </div>

                    {/* Share View */}
                    <div className={`${currentView === View.SHARE ? 'block' : 'hidden'}`}>
                      <ShareHub history={history} />
                    </div>

                    {/* Analytics View */}
                    <div className={`${currentView === View.ANALYTICS ? 'block' : 'hidden'}`}>
                        <div className="space-y-6">
                          <WeeklyReport history={history} />
                          <ProgressAnalytics history={history} />
                        </div>
                    </div>

                    {/* Active Workout View - kept mounted if active */}
                    {isWorkoutActive && (
                    <div className={`fixed md:absolute inset-0 z-40 bg-[#f8fafc] md:bg-transparent overflow-hidden ${currentView === View.WORKOUT ? 'block' : 'hidden'}`}>
                        <ActiveWorkout
                          onFinish={handleFinishWorkout}
                          onCancel={handleCancelWorkout}
                          presetExercises={presetExercises || undefined}
                          presetName={presetName || undefined}
                          history={history}
                          editingSessionId={editingSession?.id}
                          editingDurationMinutes={editingSession?.durationMinutes}
                        />
                    </div>
                    )}
                  </>
                )}
            </div>
        </div>
      </main>

      {savingSession && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold z-50">
          Saving workout...
        </div>
      )}
      {celebrations.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {celebrations.map((msg, idx) => (
            <div key={idx} className="bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 text-slate-900 font-semibold flex items-center gap-2">
              <span className="text-amber-500">🎉</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {showProgramPicker && (
        <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Choose your day</h3>
                <p className="text-sm text-slate-500">Load your template so you can start logging immediately.</p>
              </div>
              <button
                onClick={() => setShowProgramPicker(false)}
                className="text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Program</label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/10"
                >
                  {PROGRAMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PROGRAMS.find((p) => p.id === selectedProgramId)?.days.map((day) => (
                  <button
                    key={day.id}
                    disabled={day.break}
                    onClick={() => {
                      const program = PROGRAMS.find((p) => p.id === selectedProgramId)!;
                      startFromTemplate(program, day);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      day.break
                        ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 hover:border-accent hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{day.label}</p>
                        <p className="text-xs text-slate-500">
                          {day.break ? 'Rest day' : `${day.exercises.length} exercises`}
                        </p>
                      </div>
                      {!day.break && <span className="text-[10px] font-bold text-accent uppercase">Load</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={startFreestyle}
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Freestyle
              </button>
              <button
                onClick={() => setShowProgramPicker(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-800 py-3 rounded-xl font-bold hover:border-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDailyPopup && dailyProgramDay && (
        <div className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Today</p>
                <h3 className="text-lg font-extrabold text-slate-900">Load {dailyProgramDay.day.label}</h3>
                <p className="text-sm text-slate-500">Tap start to auto-fill your session.</p>
              </div>
              <button
                onClick={() => setShowDailyPopup(false)}
                className="text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
              {dailyProgramDay.day.exercises.map((ex) => (
                <div key={ex.name} className="flex justify-between text-sm font-semibold text-slate-800">
                  <span>{ex.name}</span>
                  <span className="text-slate-500">{ex.weight ? `${ex.weight} lbs` : ''}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => startFromTemplate(dailyProgramDay.program, dailyProgramDay.day)}
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Start Today’s Workout
              </button>
              <button
                onClick={() => setShowDailyPopup(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-800 py-3 rounded-xl font-bold hover:border-slate-300 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
