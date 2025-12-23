
export enum ExerciseType {
  STRENGTH = 'Strength',
  HYPERTROPHY = 'Hypertrophy',
  CARDIO = 'Cardio'
}

export interface Set {
  id: string;
  reps: number | '';
  weight: number | '';
  rpe?: number | ''; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  distance?: number | ''; // For cardio
  durationMinutes?: number | ''; // For cardio
  incline?: number | ''; // For incline walking/treadmill
}

export interface ExerciseLog {
  id: string;
  exerciseId: string;
  name: string;
  sets: Set[];
  notes?: string;
  muscleGroup?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO String
  name: string;
  exercises: ExerciseLog[];
  durationMinutes: number;
}

export interface ExerciseDef {
  id: string;
  name: string;
  muscleGroup: string;
  imageUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt?: string;
  createdAt?: string;
  preview?: string;
}
