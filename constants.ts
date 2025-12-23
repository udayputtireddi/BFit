
import { ExerciseDef, WorkoutSession } from './types';

export const MUSCLE_GROUPS = [
  'All', 
  'Chest', 
  'Back', 
  'Legs', 
  'Shoulders', 
  'Biceps', 
  'Triceps', 
  'Abs', 
  'Cardio', 
  'HIIT',
  'Forearms'
];

// Base URL for open source exercise images (yuhonas/free-exercise-db)
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// Mapping specific app exercise names to the folder names in the external DB
// Note: Folder names are Case_Sensitive and must match the repo exactly.
const NAME_TO_IMAGE_MAP: Record<string, string> = {
    // Chest
    'Barbell Bench Press': 'Barbell_Bench_Press_-_Medium_Grip',
    'Incline Dumbbell Press': 'Incline_Dumbbell_Bench_Press',
    'Cable Fly': 'Cable_Standing_Fly',
    'Dumbbell Bench Press': 'Dumbbell_Bench_Press',
    'Chest Dips': 'Dips_-_Chest_Version',
    'Pec Deck Machine': 'Lever_Pec_Deck_Fly',
    'Decline Bench Press': 'Barbell_Decline_Bench_Press',
    'Push Up': 'Push-up',
    'Machine Chest Press': 'Lever_Chest_Press',

    // Back
    'Deadlift': 'Barbell_Deadlift',
    'Lat Pulldown': 'Cable_Lat_Pulldown',
    'Barbell Row': 'Barbell_Bent_Over_Row',
    'Pull Up': 'Pull-up',
    'Dumbbell Row': 'Dumbbell_Bent_Over_Row',
    'Seated Cable Row': 'Cable_Seated_Row',
    'Face Pull': 'Cable_Standing_Face_Pull_with_Rope',
    'T-Bar Row': 'Lever_T-bar_Row',
    'Dumbbell Pullover': 'Dumbbell_Pullover',
    'Hyperextension': 'Hyperextension',

    // Legs
    'Barbell Squat': 'Barbell_Squat',
    'Leg Press': 'Sled_45_Degree_Leg_Press',
    'Leg Extension': 'Lever_Leg_Extension',
    'Seated Leg Curl': 'Lever_Seated_Leg_Curl',
    'Lying Leg Curl': 'Lever_Lying_Leg_Curl',
    'Romanian Deadlift': 'Barbell_Romanian_Deadlift',
    'Walking Lunges': 'Dumbbell_Walking_Lunge',
    'Bulgarian Split Squat': 'Dumbbell_Split_Squat',
    'Standing Calf Raise': 'Lever_Standing_Calf_Raise',
    'Seated Calf Raise': 'Lever_Seated_Calf_Raise',
    'Hack Squat': 'Sled_Hack_Squat',
    'Hip Thrust': 'Barbell_Hip_Thrust',
    'Hip Adduction': 'Lever_Seated_Hip_Adduction',
    'Hip Abduction': 'Lever_Seated_Hip_Abduction',

    // Shoulders
    'Overhead Press': 'Barbell_Standing_Military_Press',
    'Dumbbell Lateral Raise': 'Dumbbell_Lateral_Raise',
    'Cable Lateral Raise': 'Cable_One_Arm_Lateral_Raise',
    'Seated Dumbbell Press': 'Dumbbell_Seated_Shoulder_Press',
    'Rear Delt Fly': 'Dumbbell_Rear_Lateral_Raise',
    'Dumbbell Shrug': 'Dumbbell_Shrug',
    'Front Raise': 'Dumbbell_Front_Raise',
    'Upright Row': 'Barbell_Upright_Row',
    'Arnold Press': 'Dumbbell_Arnold_Press',

    // Biceps
    'Barbell Bicep Curl': 'Barbell_Curl',
    'Dumbbell Bicep Curl': 'Dumbbell_Curl',
    'Hammer Curl': 'Dumbbell_Hammer_Curl',
    'Preacher Curl': 'Barbell_Preacher_Curl',
    'Concentration Curl': 'Dumbbell_Concentration_Curl',

    // Triceps
    'Tricep Rope Pushdown': 'Cable_Rope_Pushdown',
    'Skullcrushers': 'Barbell_Lying_Triceps_Extension',
    'Overhead Tricep Extension': 'Dumbbell_Standing_Triceps_Extension',
    'Tricep Dips': 'Dips_-_Triceps_Version',
    'Tricep Kickback': 'Dumbbell_Kickback',

    // Abs
    'Crunch': 'Crunch',
    'Plank': 'Plank',
    'Hanging Leg Raise': 'Hanging_Leg_Raise',
    'Cable Crunch': 'Cable_Kneeling_Crunch',
    'Russian Twist': 'Weighted_Russian_Twist',
    'Ab Wheel Rollout': 'Wheel_Rollout',
    
    // HIIT
    'Burpees': 'Burpee',
    'Kettlebell Swing': 'Kettlebell_Swing',
    'Box Jumps': 'Box_Jump',
    'Jump Rope': 'Jump_Rope',
    'Mountain Climbers': 'Mountain_Climber'
};

// Custom images for exercises not in the repo (Cardio/Generic)
const CUSTOM_IMAGES: Record<string, string> = {
    'Treadmill Run': 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=300&q=80',
    'Cycling': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=300&q=80',
    'Rowing Machine': 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=300&q=80',
    'Stairmaster': 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=300&q=80',
};

// Helper to generate a placeholder image with the exercise name and specific color coding
const getFallbackImg = (name: string, group: string) => {
    const colors: Record<string, string> = {
        'Chest': 'ea580c', // Orange
        'Back': '0f172a',  // Slate 900
        'Legs': '16a34a',  // Green
        'Shoulders': '7c3aed', // Purple
        'Biceps': '0ea5e9', // Sky Blue
    'Triceps': 'db2777', // Pink
    'Abs': 'f59e0b',    // Amber
    'Cardio': 'ef4444', // Red
    'HIIT': '2563eb',   // Blue
    'Forearms': '6b7280', // Gray
  };

    const bg = colors[group] || '475569';
    const shortName = name.replace('Barbell', 'BB').replace('Dumbbell', 'DB').replace('Machine', 'Mach').split(' ').slice(0, 2).join('+');
    return `https://placehold.co/200x200/${bg}/ffffff?text=${shortName}&font=roboto`;
};

export const getExerciseImageUrl = () => '';

export const EXERCISE_DATABASE: ExerciseDef[] = [
  // Chest
  { id: 'bp', name: 'Barbell Bench Press', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Barbell Bench Press', 'Chest') },
  { id: 'idb', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Incline Dumbbell Press', 'Chest') },
  { id: 'cabl', name: 'Cable Fly', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Cable Fly', 'Chest') },
  { id: 'dbbp', name: 'Dumbbell Bench Press', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Dumbbell Bench Press', 'Chest') },
  { id: 'dips', name: 'Chest Dips', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Chest Dips', 'Chest') },
  { id: 'pec', name: 'Pec Deck Machine', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Pec Deck Machine', 'Chest') },
  { id: 'decline', name: 'Decline Bench Press', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Decline Bench Press', 'Chest') },
  { id: 'pushup', name: 'Push Up', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Push Up', 'Chest') },
  { id: 'dbfly', name: 'Dumbbell Fly', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Dumbbell Fly', 'Chest') },
  { id: 'cablecross', name: 'Cable Crossover', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Cable Crossover', 'Chest') },
  { id: 'landminepress', name: 'Landmine Press', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Landmine Press', 'Chest') },
  { id: 'svend', name: 'Svend Press', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Svend Press', 'Chest') },
  { id: 'machinepress', name: 'Machine Chest Press', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Machine Chest Press', 'Chest') },
  { id: 'lowcable', name: 'Low to High Cable Fly', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Low to High Cable Fly', 'Chest') },
  { id: 'guillotine', name: 'Guillotine Press', muscleGroup: 'Chest', imageUrl: getExerciseImageUrl('Guillotine Press', 'Chest') },

  // Back
  { id: 'dl', name: 'Deadlift', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Deadlift', 'Back') },
  { id: 'lat', name: 'Lat Pulldown', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Lat Pulldown', 'Back') },
  { id: 'row', name: 'Barbell Row', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Barbell Row', 'Back') },
  { id: 'pull', name: 'Pull Up', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Pull Up', 'Back') },
  { id: 'dbrow', name: 'Dumbbell Row', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Dumbbell Row', 'Back') },
  { id: 'seatrow', name: 'Seated Cable Row', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Seated Cable Row', 'Back') },
  { id: 'face', name: 'Face Pull', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Face Pull', 'Back') },
  { id: 'tbar', name: 'T-Bar Row', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('T-Bar Row', 'Back') },
  { id: 'pullver', name: 'Dumbbell Pullover', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Dumbbell Pullover', 'Back') },
  { id: 'hyperext', name: 'Hyperextension', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Hyperextension', 'Back') },
  { id: 'rackpull', name: 'Rack Pull', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Rack Pull', 'Back') },
  { id: 'csrow', name: 'Chest Supported Row', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Chest Supported Row', 'Back') },
  { id: 'meadows', name: 'Meadows Row', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Meadows Row', 'Back') },
  { id: 'goodmorning', name: 'Good Morning', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Good Morning', 'Back') },
  { id: 'singlepulldown', name: 'Single Arm Lat Pulldown', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Single Arm Lat Pulldown', 'Back') },
  { id: 'pendlay', name: 'Pendlay Row', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Pendlay Row', 'Back') },
  { id: 'sealrow', name: 'Seal Row', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Seal Row', 'Back') },
  { id: 'cablepullover', name: 'Cable Pullover', muscleGroup: 'Back', imageUrl: getExerciseImageUrl('Cable Pullover', 'Back') },

  // Legs
  { id: 'sq', name: 'Barbell Squat', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Barbell Squat', 'Legs') },
  { id: 'lpress', name: 'Leg Press', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Leg Press', 'Legs') },
  { id: 'ext', name: 'Leg Extension', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Leg Extension', 'Legs') },
  { id: 'lcurl', name: 'Seated Leg Curl', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Seated Leg Curl', 'Legs') },
  { id: 'lyingcurl', name: 'Lying Leg Curl', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Lying Leg Curl', 'Legs') },
  { id: 'rdl', name: 'Romanian Deadlift', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Romanian Deadlift', 'Legs') },
  { id: 'lung', name: 'Walking Lunges', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Walking Lunges', 'Legs') },
  { id: 'bulg', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Bulgarian Split Squat', 'Legs') },
  { id: 'calf', name: 'Standing Calf Raise', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Standing Calf Raise', 'Legs') },
  { id: 'seatcalf', name: 'Seated Calf Raise', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Seated Calf Raise', 'Legs') },
  { id: 'hack', name: 'Hack Squat', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Hack Squat', 'Legs') },
  { id: 'hip', name: 'Hip Thrust', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Hip Thrust', 'Legs') },
  { id: 'add', name: 'Hip Adduction', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Hip Adduction', 'Legs') },
  { id: 'abd', name: 'Hip Abduction', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Hip Abduction', 'Legs') },
  { id: 'fsq', name: 'Front Squat', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Front Squat', 'Legs') },
  { id: 'zercher', name: 'Zercher Squat', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Zercher Squat', 'Legs') },
  { id: 'stepup', name: 'Dumbbell Step-Up', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Dumbbell Step-Up', 'Legs') },
  { id: 'pistolsq', name: 'Pistol Squat', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Pistol Squat', 'Legs') },
  { id: 'glutebridge', name: 'Glute Bridge', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Glute Bridge', 'Legs') },
  { id: 'sledpush', name: 'Sled Push', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Sled Push', 'Legs') },
  { id: 'stepmill', name: 'Stair Climber', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Stair Climber', 'Legs') },
  { id: 'splitjerk', name: 'Split Squat', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Bulgarian Split Squat', 'Legs') },
  { id: 'legcurl', name: 'Prone Leg Curl', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Lying Leg Curl', 'Legs') },
  { id: 'powerclean', name: 'Power Clean', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Power Clean', 'Legs') },
  { id: 'frontfoot', name: 'Front Foot Elevated Split Squat', muscleGroup: 'Legs', imageUrl: getExerciseImageUrl('Bulgarian Split Squat', 'Legs') },

  // Shoulders
  { id: 'ohp', name: 'Overhead Press', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Overhead Press', 'Shoulders') },
  { id: 'latr', name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Dumbbell Lateral Raise', 'Shoulders') },
  { id: 'cablat', name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Cable Lateral Raise', 'Shoulders') },
  { id: 'dbpress', name: 'Seated Dumbbell Press', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Seated Dumbbell Press', 'Shoulders') },
  { id: 'rearfly', name: 'Rear Delt Fly', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Rear Delt Fly', 'Shoulders') },
  { id: 'shrug', name: 'Dumbbell Shrug', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Dumbbell Shrug', 'Shoulders') },
  { id: 'front', name: 'Front Raise', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Front Raise', 'Shoulders') },
  { id: 'upright', name: 'Upright Row', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Upright Row', 'Shoulders') },
  { id: 'arnold', name: 'Arnold Press', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Arnold Press', 'Shoulders') },
  { id: 'machinepress', name: 'Shoulder Press Machine', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Shoulder Press Machine', 'Shoulders') },
  { id: 'facepulls', name: 'Rope Face Pull', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Rope Face Pull', 'Shoulders') },
  { id: 'behindneck', name: 'Behind-the-Neck Press', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Behind-the-Neck Press', 'Shoulders') },
  { id: 'cuban', name: 'Cuban Press', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Cuban Press', 'Shoulders') },
  { id: 'landminerow', name: 'Landmine Lateral Raise', muscleGroup: 'Shoulders', imageUrl: getExerciseImageUrl('Landmine Lateral Raise', 'Shoulders') },

  // Biceps
  { id: 'cur', name: 'Barbell Bicep Curl', muscleGroup: 'Biceps', imageUrl: getExerciseImageUrl('Barbell Bicep Curl', 'Biceps') },
  { id: 'dbcur', name: 'Dumbbell Bicep Curl', muscleGroup: 'Biceps', imageUrl: getExerciseImageUrl('Dumbbell Bicep Curl', 'Biceps') },
  { id: 'ham', name: 'Hammer Curl', muscleGroup: 'Biceps', imageUrl: getExerciseImageUrl('Hammer Curl', 'Biceps') },
  { id: 'preach', name: 'Preacher Curl', muscleGroup: 'Biceps', imageUrl: getExerciseImageUrl('Preacher Curl', 'Biceps') },
  { id: 'conc', name: 'Concentration Curl', muscleGroup: 'Biceps', imageUrl: getExerciseImageUrl('Concentration Curl', 'Biceps') },
  { id: 'inclinecurl', name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', imageUrl: getExerciseImageUrl('Incline Dumbbell Curl', 'Biceps') },
  { id: 'spidercurl', name: 'Spider Curl', muscleGroup: 'Biceps', imageUrl: getExerciseImageUrl('Spider Curl', 'Biceps') },
  { id: 'zotmancurl', name: 'Zottman Curl', muscleGroup: 'Biceps', imageUrl: getExerciseImageUrl('Zottman Curl', 'Biceps') },

  // Triceps
  { id: 'tri', name: 'Tricep Rope Pushdown', muscleGroup: 'Triceps', imageUrl: getExerciseImageUrl('Tricep Rope Pushdown', 'Triceps') },
  { id: 'skul', name: 'Skullcrushers', muscleGroup: 'Triceps', imageUrl: getExerciseImageUrl('Skullcrushers', 'Triceps') },
  { id: 'ovhtri', name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', imageUrl: getExerciseImageUrl('Overhead Tricep Extension', 'Triceps') },
  { id: 'dips_tri', name: 'Tricep Dips', muscleGroup: 'Triceps', imageUrl: getExerciseImageUrl('Tricep Dips', 'Triceps') },
  { id: 'kick', name: 'Tricep Kickback', muscleGroup: 'Triceps', imageUrl: getExerciseImageUrl('Tricep Kickback', 'Triceps') },
  { id: 'cgbench', name: 'Close Grip Bench Press', muscleGroup: 'Triceps', imageUrl: getExerciseImageUrl('Close Grip Bench Press', 'Triceps') },
  { id: 'jmpress', name: 'JM Press', muscleGroup: 'Triceps', imageUrl: getExerciseImageUrl('JM Press', 'Triceps') },
  { id: 'singlepush', name: 'Single Arm Pushdown', muscleGroup: 'Triceps', imageUrl: getExerciseImageUrl('Single Arm Pushdown', 'Triceps') },

  // Abs
  { id: 'crunch', name: 'Crunch', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Crunch', 'Abs') },
  { id: 'plank', name: 'Plank', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Plank', 'Abs') },
  { id: 'legraise', name: 'Hanging Leg Raise', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Hanging Leg Raise', 'Abs') },
  { id: 'cablecrunch', name: 'Cable Crunch', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Cable Crunch', 'Abs') },
  { id: 'russ', name: 'Russian Twist', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Russian Twist', 'Abs') },
  { id: 'abwheel', name: 'Ab Wheel Rollout', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Ab Wheel Rollout', 'Abs') },
  { id: 'vups', name: 'V-Ups', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('V-Ups', 'Abs') },
  { id: 'sideplank', name: 'Side Plank', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Side Plank', 'Abs') },
  { id: 'mountainclimber', name: 'Mountain Climber (Abs)', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Mountain Climber', 'Abs') },
  { id: 'hollow', name: 'Hollow Hold', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Hollow Hold', 'Abs') },
  { id: 'declinesitup', name: 'Decline Sit-Up', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Decline Sit-Up', 'Abs') },
  { id: 'reversecrunch', name: 'Reverse Crunch', muscleGroup: 'Abs', imageUrl: getExerciseImageUrl('Reverse Crunch', 'Abs') },

  // Cardio
  { id: 'tread', name: 'Treadmill Run', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Treadmill Run', 'Cardio') },
  { id: 'bike', name: 'Cycling', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Cycling', 'Cardio') },
  { id: 'rower', name: 'Rowing Machine', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Rowing Machine', 'Cardio') },
  { id: 'stair', name: 'Stairmaster', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Stairmaster', 'Cardio') },
  { id: 'elliptical', name: 'Elliptical', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Elliptical', 'Cardio') },
  { id: 'spin', name: 'Spin Bike', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Spin Bike', 'Cardio') },
  { id: 'swim', name: 'Swimming', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Swimming', 'Cardio') },
  { id: 'assaultcardio', name: 'Assault Bike (Steady)', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Assault Bike', 'Cardio') },
  { id: 'runout', name: 'Outdoor Run', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Treadmill Run', 'Cardio') },
  { id: 'track', name: 'Track Intervals', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Sprints', 'Cardio') },
  { id: 'hike', name: 'Hiking', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Treadmill Run', 'Cardio') },
  { id: 'stairsprint', name: 'Stair Sprints', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Stairmaster', 'Cardio') },
  { id: 'inclinewalk', name: 'Incline Walking', muscleGroup: 'Cardio', imageUrl: getExerciseImageUrl('Treadmill Run', 'Cardio') },
  
  // HIIT
  { id: 'burp', name: 'Burpees', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Burpees', 'HIIT') },
  { id: 'kettle', name: 'Kettlebell Swing', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Kettlebell Swing', 'HIIT') },
  { id: 'box', name: 'Box Jumps', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Box Jumps', 'HIIT') },
  { id: 'rope', name: 'Jump Rope', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Jump Rope', 'HIIT') },
  { id: 'mount', name: 'Mountain Climbers', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Mountain Climbers', 'HIIT') },
  { id: 'sprint', name: 'Sprints', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Sprints', 'HIIT') },
  { id: 'battlerope', name: 'Battle Ropes', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Battle Ropes', 'HIIT') },
  { id: 'assault', name: 'Assault Bike', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Assault Bike', 'HIIT') },
  { id: 'shuttle', name: 'Shuttle Runs', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Shuttle Runs', 'HIIT') },
  { id: 'prowler', name: 'Prowler Push', muscleGroup: 'HIIT', imageUrl: getExerciseImageUrl('Prowler Push', 'HIIT') },

  // Forearms
  { id: 'wrcurl', name: 'Wrist Curl', muscleGroup: 'Forearms', imageUrl: getExerciseImageUrl('Wrist Curl', 'Forearms') },
  { id: 'revwrcurl', name: 'Reverse Wrist Curl', muscleGroup: 'Forearms', imageUrl: getExerciseImageUrl('Reverse Wrist Curl', 'Forearms') },
  { id: 'hammerfore', name: 'Hammer Curl', muscleGroup: 'Forearms', imageUrl: getExerciseImageUrl('Hammer Curl', 'Forearms') },
  { id: 'farmer', name: 'Farmer\'s Carry', muscleGroup: 'Forearms', imageUrl: getExerciseImageUrl('Farmer\'s Carry', 'Forearms') },
  { id: 'platepinch', name: 'Plate Pinch Hold', muscleGroup: 'Forearms', imageUrl: getExerciseImageUrl('Plate Pinch Hold', 'Forearms') },
  { id: 'towelpull', name: 'Towel Pull-Up', muscleGroup: 'Forearms', imageUrl: getExerciseImageUrl('Towel Pull-Up', 'Forearms') },
  { id: 'reversecurl', name: 'Reverse Curl', muscleGroup: 'Forearms', imageUrl: getExerciseImageUrl('Reverse Curl', 'Forearms') },
  { id: 'wristroller', name: 'Wrist Roller', muscleGroup: 'Forearms', imageUrl: getExerciseImageUrl('Wrist Roller', 'Forearms') },

];

export const MOCK_HISTORY: WorkoutSession[] = [];
