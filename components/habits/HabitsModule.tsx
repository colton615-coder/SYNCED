
import React, { useState, useEffect } from 'react';
import Module from '../common/Module';
import { Habit, HabitTrackingType } from '../../types';
import { HeartIcon, PencilIcon, TrashIcon } from '../common/Icons'; // Import TrashIcon

const LOCAL_STORAGE_KEY = 'lifesyncd_habits';

const HabitsModule: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitTrackingType, setHabitTrackingType] = useState<HabitTrackingType>('checkbox');
  const [targetCount, setTargetCount] = useState<number>(1);
  const [targetTime, setTargetTime] = useState<number>(15); // in minutes
  const [timeInput, setTimeInput] = useState<string>(''); // For logging time

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

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

  // Load habits from local storage on initial mount
  useEffect(() => {
    const storedHabits = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedHabits) {
      const parsedHabits = JSON.parse(storedHabits) as Habit[];
      setHabits(parsedHabits.map(resetHabitProgressIfNewDay));
    }
  }, []);

  // Save habits to local storage whenever they change
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
    if (habit.trackingType === 'checkbox') {
      setTargetCount(habit.targetCount || 1);
    } else {
      setTargetTime(habit.targetTime || 15);
    }
    setShowForm(true);
  };

  const handleDeleteHabit = (id: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      console.log('HabitsModule: Attempting to delete habit with ID:', id);
      setHabits((prevHabits) => {
        console.log('HabitsModule: Previous habits list:', prevHabits);
        const newList = prevHabits.filter((habit) => String(habit.id) !== String(id));
        console.log('HabitsModule: New habits list after filter (should not contain deleted item):', newList);
        console.log('HabitsModule: Calling setHabits with new list of length:', newList.length);
        return newList;
      });
    } else {
      console.log('HabitsModule: Deletion cancelled.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const baseHabit = {
      id: editingHabit ? editingHabit.id : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: habitName.trim(),
      trackingType: habitTrackingType,
      lastTrackedDate: today,
      completedToday: false,
    };

    let newOrUpdatedHabit: Habit;
    if (habitTrackingType === 'checkbox') {
      newOrUpdatedHabit = {
        ...baseHabit,
        currentCount: editingHabit?.id === baseHabit.id && editingHabit.trackingType === 'checkbox' ? editingHabit.currentCount : 0,
        targetCount: targetCount,
        completedToday: editingHabit?.id === baseHabit.id && editingHabit.trackingType === 'checkbox' ? (editingHabit.currentCount || 0) >= targetCount : false,
      };
    } else { // 'time'
      newOrUpdatedHabit = {
        ...baseHabit,
        totalTimeLogged: editingHabit?.id === baseHabit.id && editingHabit.trackingType === 'time' ? editingHabit.totalTimeLogged : 0,
        targetTime: targetTime,
        completedToday: editingHabit?.id === baseHabit.id && editingHabit.trackingType === 'time' ? (editingHabit.totalTimeLogged || 0) >= targetTime : false,
      };
    }

    if (editingHabit) {
      setHabits(
        habits.map((habit) =>
          habit.id === editingHabit.id ? newOrUpdatedHabit : habit
        )
      );
    } else {
      setHabits([...habits, newOrUpdatedHabit]);
    }

    setShowForm(false);
    setEditingHabit(null);
    setHabitName('');
    setHabitTrackingType('checkbox');
    setTargetCount(1);
    setTargetTime(15);
    setTimeInput('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHabit(null);
    setHabitName('');
    setHabitTrackingType('checkbox');
    setTargetCount(1);
    setTargetTime(15);
    setTimeInput('');
  };

  const handleTrackCheckboxHabit = (id: string) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id && habit.trackingType === 'checkbox') {
          const updatedHabit = resetHabitProgressIfNewDay(habit);
          const newCount = Math.min((updatedHabit.currentCount || 0) + 1, updatedHabit.targetCount || 1); // Cap at targetCount
          return {
            ...updatedHabit,
            currentCount: newCount,
            completedToday: newCount >= (updatedHabit.targetCount || 1),
            lastTrackedDate: today,
          };
        }
        return habit;
      })
    );
  };

  const handleLogTimeForHabit = (id: string) => {
    const timeToLog = parseInt(timeInput, 10);
    if (isNaN(timeToLog) || timeToLog <= 0) return;

    setHabits(
      habits.map((habit) => {
        if (habit.id === id && habit.trackingType === 'time') {
          const updatedHabit = resetHabitProgressIfNewDay(habit);
          const newTotalTime = (updatedHabit.totalTimeLogged || 0) + timeToLog;
          return {
            ...updatedHabit,
            totalTimeLogged: newTotalTime,
            completedToday: newTotalTime >= (updatedHabit.targetTime || 15),
            lastTrackedDate: today,
          };
        }
        return habit;
      })
    );
    setTimeInput(''); // Clear input after logging
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
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
            >
              {editingHabit ? 'Update Habit' : 'Add Habit'}
            </button>
          </div>
        </form>
      </Module>
    );
  }

  return (
    <Module title="Daily Habits" icon={<HeartIcon />}>
      {habits.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No habits set up yet. Start building good routines!</p>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => {
            const currentHabit = resetHabitProgressIfNewDay(habit);
            const isCompleted = currentHabit.completedToday;
            const progressText =
              currentHabit.trackingType === 'checkbox'
                ? `${currentHabit.currentCount || 0}/${currentHabit.targetCount || 1}`
                : `${currentHabit.totalTimeLogged || 0}/${currentHabit.targetTime || 15} min`;

            return (
              <li
                key={currentHabit.id}
                className="flex flex-col group bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg p-4 mb-3 transform transition-all duration-300 hover:scale-[1.01] hover:bg-slate-700/50"
              >
                <div className="flex items-center w-full">
                  <div
                    className={`w-6 h-6 mr-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-500 group-hover:border-pink-500'
                    }`}
                  >
                    {isCompleted && <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className={`block ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
                      {currentHabit.name}
                    </span>
                    {currentHabit.trackingType === 'time' && (
                      <span className={`block text-xs mt-0.5 ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                        Today's Progress: {progressText}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleEditHabit(currentHabit)}
                      className="text-gray-300 hover:text-purple-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/80"
                      aria-label={`Edit habit ${currentHabit.name}`}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(currentHabit.id)} // Direct delete button
                      className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/80"
                      aria-label={`Delete habit ${currentHabit.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                {currentHabit.trackingType === 'checkbox' && (
                  <div className="mt-3 flex justify-between items-center pl-10 pr-4"> {/* Adjusted pl to align with icons */}
                    <div className="flex items-center gap-1 flex-wrap"> {/* Added gap-1 for spacing */}
                      {Array.from({ length: currentHabit.targetCount || 1 }).map((_, i) => (
                        <div
                          key={i}
                          onClick={() => handleTrackCheckboxHabit(currentHabit.id)}
                          className={`w-5 h-5 rounded-md border cursor-pointer transition-all duration-200 ${
                            i < (currentHabit.currentCount || 0)
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-500 hover:bg-slate-600'
                          }`}
                          aria-label={`Mark completion ${i + 1} for ${currentHabit.name}`}
                        ></div>
                      ))}
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => handleTrackCheckboxHabit(currentHabit.id)}
                        className="bg-pink-600/80 hover:bg-pink-700 text-white font-bold w-8 h-8 rounded-full text-lg flex items-center justify-center transition-colors duration-200"
                        aria-label={`Increment ${currentHabit.name}`}
                      >
                        +
                      </button>
                    )}
                  </div>
                )}
                {currentHabit.trackingType === 'time' && !isCompleted && (
                  <div className="mt-3 flex justify-end items-center space-x-2">
                    <input
                      type="number"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      placeholder="min"
                      min="1"
                      className="w-28 p-2 rounded-lg bg-slate-700/70 border border-slate-600 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-100 placeholder-gray-400 text-base"
                      aria-label={`Time to log for ${currentHabit.name}`}
                    />
                    <button
                      onClick={() => handleLogTimeForHabit(currentHabit.id)}
                      className="bg-pink-600/80 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors duration-200"
                      aria-label={`Log time for ${currentHabit.name}`}
                    >
                      Log Time
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <button
          onClick={handleCreateNewHabit}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Habit
        </button>
      </div>
    </Module>
  );
};

export default HabitsModule;
