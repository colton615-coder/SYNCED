
import { Workout, Habit, CalendarEvent, Task, JournalEntry, ShoppingItem, Project, EducationResource, Exercise, WorkoutSession } from '../types';

export const mockExercises: Exercise[] = [
  { id: 'ex1', name: 'Push-ups', bodyPart: 'Chest', description: 'Bodyweight exercise for chest, shoulders, and triceps.' },
  { id: 'ex2', name: 'Squats', bodyPart: 'Legs', description: 'Compound exercise for legs and glutes.' },
  { id: 'ex3', name: 'Deadlifts', bodyPart: 'Back', description: 'Full body strength exercise, primarily back and legs.' },
  { id: 'ex4', name: 'Bench Press', bodyPart: 'Chest', description: 'Barbell exercise for chest strength.' },
  { id: 'ex5', name: 'Overhead Press', bodyPart: 'Shoulders', description: 'Barbell or dumbbell exercise for shoulder strength.' },
  { id: 'ex6', name: 'Bicep Curls', bodyPart: 'Arms', description: 'Isolation exercise for biceps.' },
  { id: 'ex7', name: 'Tricep Extensions', bodyPart: 'Arms', description: 'Isolation exercise for triceps.' },
  { id: 'ex8', name: 'Lunges', bodyPart: 'Legs', description: 'Unilateral exercise for legs and glutes.' },
  { id: 'ex9', name: 'Plank', bodyPart: 'Core', description: 'Isometric exercise for core strength.' },
  { id: 'ex10', name: 'Crunches', bodyPart: 'Core', description: 'Traditional exercise for abdominal muscles.' },
  { id: 'ex11', name: 'Rows (Dumbbell/Barbell)', bodyPart: 'Back', description: 'Pulling exercise for back muscles.' },
  { id: 'ex12', name: 'Lateral Raises', bodyPart: 'Shoulders', description: 'Isolation exercise for side deltoids.' },
  { id: 'ex13', name: 'Calf Raises', bodyPart: 'Legs', description: 'Isolation exercise for calf muscles.' },
  { id: 'ex14', name: 'Pull-ups', bodyPart: 'Back', description: 'Bodyweight exercise for back and biceps.' },
  { id: 'ex15', name: 'Dips', bodyPart: 'Triceps', description: 'Bodyweight exercise for triceps and chest.' },
  { id: 'ex16', name: 'Leg Press', bodyPart: 'Legs', description: 'Machine-based exercise for quadriceps and glutes.' },
  { id: 'ex17', name: 'Leg Curls', bodyPart: 'Legs', description: 'Isolation exercise for hamstrings.' },
  { id: 'ex18', name: 'Leg Extensions', bodyPart: 'Legs', description: 'Isolation exercise for quadriceps.' },
  { id: 'ex19', name: 'Russian Twists', bodyPart: 'Core', description: 'Oblique exercise.' },
  { id: 'ex20', name: 'Burpees', bodyPart: 'Full Body', description: 'High-intensity full-body exercise.' }
];

export const mockWorkouts: Workout[] = []; // Now stores workout templates

export const mockWorkoutSessions: WorkoutSession[] = []; // New array for storing completed workout sessions

export const mockHabits: Habit[] = [];

export const mockCalendarEvents: CalendarEvent[] = [];

export const mockTasks: Task[] = [];

export const mockJournalEntries: JournalEntry[] = []; // Entries are now managed via local storage within the JournalModule

export const mockShoppingList: ShoppingItem[] = [];

export const mockProjects: Project[] = [];

export const mockEducationResources: EducationResource[] = [];