
import React, { useState, useEffect, useMemo } from 'react';
import Module from '../common/Module';
import { HomeIcon, CalendarIcon, CheckCircleIcon, HeartIcon } from '../common/Icons';
import { Task, CalendarEvent, Habit, Priority } from '../../types';

// Local storage keys from other modules
const LOCAL_STORAGE_KEY_TASKS = 'lifesyncd_tasks';
const LOCAL_STORAGE_KEY_CALENDAR = 'lifesyncd_calendar_events';
const LOCAL_STORAGE_KEY_HABITS = 'lifesyncd_habits';

const DashboardModule: React.FC = () => {
  // State for data from other modules
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  // Load data on component mount
  useEffect(() => {
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    if (storedTasks) setTasks(JSON.parse(storedTasks));

    const storedEvents = localStorage.getItem(LOCAL_STORAGE_KEY_CALENDAR);
    if (storedEvents) setEvents(JSON.parse(storedEvents));

    const storedHabits = localStorage.getItem(LOCAL_STORAGE_KEY_HABITS);
    if (storedHabits) setHabits(JSON.parse(storedHabits));
  }, []);
  
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // --- Processed data for display ---

  const todaysEvents = useMemo(() => {
    return events
      .filter(event => event.date === today)
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 3); // Show top 3
  }, [events, today]);
  
  const priorityOrder: Record<Priority, number> = { high: 1, medium: 2, low: 3 };

  const topTasks = useMemo(() => {
    return tasks
      .filter(task => !task.completed)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 3); // Show top 3
  }, [tasks]);

  const currentHabits = useMemo(() => {
    // Replicate the logic to reset habit progress if it's a new day
    const resetHabitProgressIfNewDay = (habit: Habit): Habit => {
        if (habit.lastTrackedDate !== today) {
            if (habit.trackingType === 'checkbox') {
                return { ...habit, currentCount: 0, completedToday: false, lastTrackedDate: today };
            } else if (habit.trackingType === 'time') {
                return { ...habit, totalTimeLogged: 0, completedToday: false, lastTrackedDate: today };
            }
        }
        return habit;
    };
    return habits.map(resetHabitProgressIfNewDay);
  }, [habits, today]);

  const habitProgress = useMemo(() => {
      const totalHabits = currentHabits.length;
      if (totalHabits === 0) return { overallCompletion: 0, completedCount: 0, totalCount: 0 };
      
      const completedCount = currentHabits.filter(h => h.completedToday).length;
      const overallCompletion = Math.round((completedCount / totalHabits) * 100);

      return { overallCompletion, completedCount, totalCount: totalHabits };
  }, [currentHabits]);


  // Reusable summary section component
  const SummarySection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ title, icon, children, className, style }) => (
    <div className={`bg-slate-700/30 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-lg p-4 ${className}`} style={style}>
      <div className="flex items-center mb-3">
        <div className="text-purple-400 mr-3">{icon}</div>
        <h3 className="font-bold text-lg text-gray-200">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <Module title="Dashboard" icon={<HomeIcon />}>
      <div className="flex flex-col space-y-6">
        {/* Today's Agenda Summary */}
        <SummarySection title="Today's Agenda" icon={<CalendarIcon />} className="animate-slide-in-fade" style={{ animationDelay: '100ms' }}>
          {todaysEvents.length > 0 ? (
            <ul className="space-y-2">
              {todaysEvents.map(event => (
                <li key={event.id} className="flex items-center text-gray-300">
                  <span className="font-semibold text-purple-300 w-16 flex-shrink-0">{event.time}</span>
                  <span>{event.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-2">No events scheduled for today.</p>
          )}
        </SummarySection>

        {/* Top Priorities Summary */}
        <SummarySection title="Top Priorities" icon={<CheckCircleIcon />} className="animate-slide-in-fade" style={{ animationDelay: '200ms' }}>
          {topTasks.length > 0 ? (
            <ul className="space-y-2">
              {topTasks.map(task => {
                 const priorityColors: Record<Priority, string> = {
                    high: 'border-red-400',
                    medium: 'border-yellow-400',
                    low: 'border-blue-400',
                 };
                 return (
                    <li key={task.id} className={`flex items-center text-gray-300 bg-slate-800/20 p-3 rounded-lg border-l-4 ${priorityColors[task.priority]}`}>
                      <span className="ml-2">{task.text}</span>
                    </li>
                 );
              })}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-2">All tasks completed. Great job!</p>
          )}
        </SummarySection>

        {/* Daily Habits Summary */}
        <SummarySection title="Daily Habits" icon={<HeartIcon />} className="animate-slide-in-fade" style={{ animationDelay: '300ms' }}>
          {currentHabits.length > 0 ? (
             <div className="space-y-4">
                <div className="text-center">
                    <p className="text-gray-200 font-bold text-2xl">{habitProgress.overallCompletion}% Complete</p>
                    <p className="text-gray-400 text-sm">({habitProgress.completedCount} of {habitProgress.totalCount} habits)</p>
                </div>
                <div className="w-full bg-slate-700/80 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${habitProgress.overallCompletion}%` }}
                  ></div>
                </div>
                <ul className="space-y-2 pt-2">
                    {currentHabits.map(habit => {
                       let progressText = '';
                       if (habit.trackingType === 'checkbox') {
                           progressText = `${habit.currentCount || 0}/${habit.targetCount || 1}`;
                       } else {
                           progressText = `${habit.totalTimeLogged || 0}/${habit.targetTime || 0} min`;
                       }
                       return (
                           <li key={habit.id} className="flex justify-between items-center text-sm">
                               <span className={habit.completedToday ? "text-gray-500 line-through" : "text-gray-300"}>{habit.name}</span>
                               <span className={habit.completedToday ? "text-green-400 font-medium" : "text-gray-400"}>{progressText}</span>
                           </li>
                       )
                    })}
                </ul>
             </div>
          ) : (
            <p className="text-gray-400 text-center py-2">No habits set up yet.</p>
          )}
        </SummarySection>
      </div>
    </Module>
  );
};

export default DashboardModule;
