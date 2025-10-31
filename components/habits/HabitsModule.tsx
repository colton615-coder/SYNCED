
import React, { useState, useEffect } from 'react';
import Module from '../common/Module';
import { Habit, HabitTrackingType } from '../../types';
import { HeartIcon, PencilIcon, TrashIcon, FireIcon, CalendarDaysIcon, PlusCircleIcon, MinusCircleIcon } from '../common/Icons';
import HabitHistoryCalendarModal from './HabitHistoryCalendarModal';

const LOCAL_STORAGE_KEY = 'lifesyncd_habits';

// Helper to get date strings
const getISODateString = (date: Date): string => date.toISOString().slice(0, 10);

const HabitsModule: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitTrackingType, setHabitTrackingType] = useState<HabitTrackingType>('checkbox');
  const [targetCount, setTargetCount] = useState<number>(1);
  const [targetTime, setTargetTime] = useState<number>(15); // in minutes
  const [timeInput, setTimeInput] = useState<string>(''); // For logging time
  const [viewingHistoryForHabit, setViewingHistoryForHabit] = useState<Habit | null>(null);

  const today = getISODateString(new Date());

  const checkAndResetHabitData = (habit: Habit): Habit => {
    const yesterday = getISODateString(new Date(Date.now() - 86400000));
    let updatedHabit = { ...habit };
    
    // Reset daily progress if last tracked date is not today
    if (updatedHabit.lastTrackedDate !== today) {
        updatedHabit.completedToday = false;
        if (updatedHabit.trackingType === 'checkbox') updatedHabit.currentCount = 0;
        if (updatedHabit.trackingType === 'time') updatedHabit.totalTimeLogged = 0;
    }

    // Reset streak if the last completed day wasn't yesterday or today
    const lastCompletedDate = updatedHabit.completionHistory[updatedHabit.completionHistory.length - 1];
    if (lastCompletedDate && lastCompletedDate !== today && lastCompletedDate !== yesterday) {
      updatedHabit.streak = 0;
    } else if (!lastCompletedDate) {
      updatedHabit.streak = 0;
    }

    return updatedHabit;
  };

  useEffect(() => {
    const storedHabits = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedHabits) {
      const parsedHabits = JSON.parse(storedHabits) as Habit[];
      setHabits(parsedHabits.map(checkAndResetHabitData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const handleCreateNewHabit = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitTrackingType('checkbox');
    setTargetCount(1);
    setTargetTime(15);
    setShowForm(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitTrackingType(habit.trackingType);
    if (habit.trackingType === 'checkbox') setTargetCount(habit.targetCount || 1);
    else setTargetTime(habit.targetTime || 15);
    setShowForm(true);
  };

  const handleDeleteHabit = (id: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      setHabits(prev => prev.filter(habit => habit.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const baseHabit = {
        name: habitName.trim(),
        trackingType: habitTrackingType,
        lastTrackedDate: today,
        // Preserve existing streak and history if editing
        streak: editingHabit?.streak || 0,
        completionHistory: editingHabit?.completionHistory || [],
    };

    let newOrUpdatedHabit: Habit;
    if (habitTrackingType === 'checkbox') {
        newOrUpdatedHabit = {
            ...editingHabit,
            ...baseHabit,
            id: editingHabit?.id || Date.now().toString(),
            targetCount,
        };
    } else { // 'time'
        newOrUpdatedHabit = {
            ...editingHabit,
            ...baseHabit,
            id: editingHabit?.id || Date.now().toString(),
            targetTime,
        };
    }
    
    // Reset progress if tracking type changed
    if (editingHabit && editingHabit.trackingType !== newOrUpdatedHabit.trackingType) {
        newOrUpdatedHabit.completedToday = false;
        newOrUpdatedHabit.currentCount = 0;
        newOrUpdatedHabit.totalTimeLogged = 0;
    }

    if (editingHabit) {
        setHabits(habits.map(h => (h.id === editingHabit.id ? newOrUpdatedHabit : h)));
    } else {
        setHabits([...habits, newOrUpdatedHabit]);
    }
    setShowForm(false);
  };
  
  const handleCancel = () => setShowForm(false);

  const updateHabitProgress = (id: string, isComplete: boolean, newProgress: Partial<Habit>) => {
      setHabits(habits.map(h => {
          if (h.id !== id) return h;

          let updatedHabit = { ...h, ...newProgress, lastTrackedDate: today, completedToday: isComplete };
          const yesterday = getISODateString(new Date(Date.now() - 86400000));
          
          if (isComplete && !h.completionHistory.includes(today)) {
              updatedHabit.completionHistory = [...h.completionHistory, today];
              if (h.completionHistory.includes(yesterday)) {
                  updatedHabit.streak = h.streak + 1;
              } else {
                  updatedHabit.streak = 1;
              }
          }
          return updatedHabit;
      }));
  };

  const handleTrackCheckboxHabit = (id: string, increment: boolean) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.trackingType !== 'checkbox') return;

    const currentCount = habit.currentCount || 0;
    const newCount = increment ? Math.min(currentCount + 1, habit.targetCount || 1) : Math.max(0, currentCount - 1);
    const isComplete = newCount >= (habit.targetCount || 1);
    
    updateHabitProgress(id, isComplete, { currentCount: newCount });
  };
  
  const handleLogTimeForHabit = (id: string) => {
    const timeToLog = parseInt(timeInput, 10);
    if (isNaN(timeToLog) || timeToLog <= 0) return;
    
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.trackingType !== 'time') return;
    
    const newTotalTime = (habit.totalTimeLogged || 0) + timeToLog;
    const isComplete = newTotalTime >= (habit.targetTime || 15);

    updateHabitProgress(id, isComplete, { totalTimeLogged: newTotalTime });
    setTimeInput('');
  };

  if (showForm) {
    return (
      <Module title={editingHabit ? 'Edit Habit' : 'New Habit'} icon={<HeartIcon />}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="habitName" className="block text-gray-300 text-sm font-bold mb-2">
              Habit Name:
            </label>
            <input
              type="text"
              id="habitName"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-pink-500 focus:border-pink-500 text-gray-100 placeholder-gray-400 text-base"
              placeholder="e.g., Drink 8 glasses of water"
              required
            />
          </div>
          <div>
            <label htmlFor="trackingType" className="block text-gray-300 text-sm font-bold mb-2">
              Tracking Type:
            </label>
            <select
              id="trackingType"
              value={habitTrackingType}
              onChange={(e) => setHabitTrackingType(e.target.value as HabitTrackingType)}
              className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-pink-500 focus:border-pink-500 text-gray-100 text-base"
            >
              <option value="checkbox">Checkbox (e.g., X glasses of water)</option>
              <option value="time">Time (e.g., Y minutes of reading)</option>
            </select>
          </div>
          {habitTrackingType === 'checkbox' && (
            <div>
              <label htmlFor="targetCount" className="block text-gray-300 text-sm font-bold mb-2">
                Daily Target Count:
              </label>
              <input
                type="number"
                id="targetCount"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
                min="1"
                className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-pink-500 focus:border-pink-500 text-gray-100 text-base"
                required
              />
            </div>
          )}
          {habitTrackingType === 'time' && (
            <div>
              <label htmlFor="targetTime" className="block text-gray-300 text-sm font-bold mb-2">
                Daily Target Time (minutes):
              </label>
              <input
                type="number"
                id="targetTime"
                value={targetTime}
                onChange={(e) => setTargetTime(parseInt(e.target.value, 10))}
                min="1"
                className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-pink-500 focus:border-pink-500 text-gray-100 text-base"
                required
              />
            </div>
          )}
           <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {editingHabit ? 'Update Habit' : 'Add Habit'}
            </button>
          </div>
        </form>
      </Module>
    );
  }

  return (
    <>
    <Module title="Daily Habits" icon={<HeartIcon />}>
      {habits.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No habits set up yet. Start by creating a new one!</p>
      ) : (
        <ul className="space-y-4">
          {habits.map(habit => (
            <li key={habit.id} className="bg-slate-700/30 p-4 rounded-lg group">
              <div className="flex justify-between items-start mb-3">
                <span className={`font-semibold text-lg ${habit.completedToday ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{habit.name}</span>
                <div className="flex items-center text-orange-400">
                  <FireIcon />
                  <span className="ml-1 font-bold">{habit.streak}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {(() => {
                let progress = 0;
                if (habit.trackingType === 'checkbox' && habit.targetCount) {
                  progress = ((habit.currentCount || 0) / habit.targetCount) * 100;
                } else if (habit.trackingType === 'time' && habit.targetTime) {
                  progress = ((habit.totalTimeLogged || 0) / habit.targetTime) * 100;
                }
                return (
                  <div className="w-full bg-slate-700/80 rounded-full h-2 my-3">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                  </div>
                );
              })()}

              {/* Interaction Area */}
              {habit.trackingType === 'checkbox' && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Progress: {habit.currentCount || 0} / {habit.targetCount}</span>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleTrackCheckboxHabit(habit.id, false)} className="p-2 rounded-full hover:bg-slate-600/50"><MinusCircleIcon /></button>
                    <button onClick={() => handleTrackCheckboxHabit(habit.id, true)} className="p-2 rounded-full hover:bg-slate-600/50"><PlusCircleIcon /></button>
                  </div>
                </div>
              )}
              {habit.trackingType === 'time' && (
                <div>
                  <p className="text-gray-400 mb-2">Progress: {habit.totalTimeLogged || 0} / {habit.targetTime} min</p>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={timeInput}
                      onChange={e => setTimeInput(e.target.value)}
                      placeholder="Log mins"
                      className="w-full p-2 rounded-lg bg-slate-800/70 border border-slate-700 focus:ring-pink-500 focus:border-pink-500 text-gray-100 placeholder-gray-500 text-sm"
                    />
                    <button onClick={() => handleLogTimeForHabit(habit.id)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm">Log</button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-1 mt-3 pt-3 border-t border-slate-700/50">
                <button onClick={() => setViewingHistoryForHabit(habit)} className="text-gray-400 hover:text-purple-400 p-2 rounded-full hover:bg-slate-600/50"><CalendarDaysIcon /></button>
                <button onClick={() => handleEditHabit(habit)} className="text-gray-400 hover:text-blue-400 p-2 rounded-full hover:bg-slate-600/50"><PencilIcon /></button>
                <button onClick={() => handleDeleteHabit(habit.id)} className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-slate-600/50"><TrashIcon /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <button
          onClick={handleCreateNewHabit}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Habit
        </button>
      </div>
    </Module>
    {viewingHistoryForHabit && (
        <HabitHistoryCalendarModal 
            habit={viewingHistoryForHabit}
            onClose={() => setViewingHistoryForHabit(null)}
        />
    )}
    </>
  );
};

export default HabitsModule;
