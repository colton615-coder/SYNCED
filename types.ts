
export type ModuleType =
  | 'dashboard'
  | 'calendar'
  | 'tasks'
  | 'habits'
  | 'workouts'
  | 'projects'
  | 'shopping'
  | 'journal'
  | 'education'
  | 'activeWorkout'; // New module type for active workout session

export type Priority = 'low' | 'medium' | 'high';

// Add the Task interface
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
}

export type HabitTrackingType = 'checkbox' | 'time';

export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  description?: string;
}

// A planned set, part of an exercise definition in a template
export interface PlannedSet {
  id: string; // Unique ID for a planned set (for UI keys)
  setNumber: number;
  reps: number | ''; // Planned reps
  // weight: number | ''; // Planned weight - REMOVED
}

// An exercise when it's part of a Workout Template
export interface WorkoutTemplateExercise extends Exercise {
  plannedSets: PlannedSet[]; // Each exercise in a template has planned sets
}

export interface Workout { // This now represents a Workout Template
  id: string;
  name: string;
  exercises: WorkoutTemplateExercise[]; // Now uses WorkoutTemplateExercise
}

export interface LoggedSet { // This will now represent an *actual* logged set
  id: string; // Unique ID for the actual logged set
  setNumber: number;
  actualReps: number | ''; // Actual reps performed
  // actualWeight: number | ''; // Actual weight used - REMOVED
}

export interface LoggedExercise {
  exerciseId: string; // ID of the original exercise
  exerciseName: string;
  bodyPart: string;
  // We can include plannedSets here for reference during the active session
  plannedSets: PlannedSet[];
  // And the actual logged sets
  loggedSets: LoggedSet[];
}

export interface WorkoutSession {
    id: string; // Unique ID for this specific session instance
    templateId: string; // ID of the template used
    templateName: string;
    startTime: string; // ISO string
    endTime?: string; // ISO string, once completed
    loggedExercises: LoggedExercise[];
    durationSeconds?: number; // Total duration in seconds
    status: 'in-progress' | 'completed' | 'cancelled';
}

export interface Habit {
  id: string;
  name: string;
  trackingType: HabitTrackingType;
  currentCount?: number; // How many times completed today (for checkbox type)
  targetCount?: number; // Daily target (e.g., 8 glasses) (for checkbox type)
  totalTimeLogged?: number; // Total minutes logged today (for time type)
  targetTime?: number; // Daily target (e.g., 15 minutes) (for time type)
  lastTrackedDate?: string; // YYYY-MM-DD to track daily progress reset
  completedToday?: boolean; // Overall completion for the day
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  reminderMinutes?: number; // Reminder time in minutes before the event
  notificationSent?: boolean; // Flag to check if notification has been sent
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  prompt: string; // The prompt that was answered
  snippet: string; // Short preview of the entry
  fullText: string; // The complete user's response
  aiResponse?: string; // AI Therapist's response
}

export type ShoppingCategory =
  | 'Produce'
  | 'Dairy'
  | 'Meat'
  | 'Pantry'
  | 'Frozen'
  | 'Beverages'
  | 'Personal Care'
  | 'Household'
  | 'Other';

export interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
  category: ShoppingCategory;
}

export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number; // Percentage from 0 to 100
  dueDate?: string; // YYYY-MM-DD
  archived: boolean;
  subTasks: SubTask[];
}

export type EducationResourceStatus = 'To Do' | 'In Progress' | 'Completed';

export interface EducationResource {
  id: string;
  title: string;
  url: string;
  type: 'Article' | 'Video' | 'Course' | 'Book' | 'Podcast';
  status: EducationResourceStatus;
  description?: string;
  tags?: string[];
  aiSummary?: string; // AI Assistant's summary
  isSummarizing?: boolean; // Whether the AI is currently summarizing this resource
  summaryError?: string; // Error message if summarization fails
}