
import React from 'react';
import { ModuleType, WorkoutSession } from '../../types';
import {
  HomeIcon,
  CalendarIcon,
  CheckCircleIcon,
  HeartIcon,
  FireIcon,
  FolderIcon,
  ShoppingCartIcon,
  BookOpenIcon,
  AcademicCapIcon
} from '../common/Icons';

interface BottomNavBarProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  activeSession: WorkoutSession | null; // New prop
}

const navItems: { id: ModuleType; icon: React.ReactNode; label: string }[] = [
  { id: 'dashboard', icon: <HomeIcon />, label: 'Home' },
  { id: 'calendar', icon: <CalendarIcon />, label: 'Agenda' },
  { id: 'tasks', icon: <CheckCircleIcon />, label: 'Tasks' },
  { id: 'habits', icon: <HeartIcon />, label: 'Habits' },
  { id: 'workouts', icon: <FireIcon />, label: 'Workout' },
  { id: 'projects', icon: <FolderIcon />, label: 'Projects' },
  { id: 'shopping', icon: <ShoppingCartIcon />, label: 'List' },
  { id: 'journal', icon: <BookOpenIcon />, label: 'Journal' },
  { id: 'education', icon: <AcademicCapIcon />, label: 'Learn' }
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeModule, setActiveModule, activeSession }) => {
  if (activeSession) {
    return null; // Hide the nav bar if a workout session is active
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/70 backdrop-blur-lg border-t border-slate-700/50 z-50">
      <div className="flex justify-around items-stretch h-full max-w-7xl mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex flex-col items-center justify-center flex-1 pt-2 pb-1 transition-colors duration-200 focus:outline-none ${
              activeModule === item.id ? 'text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
            aria-current={activeModule === item.id ? 'page' : undefined}
            aria-label={item.label}
          >
            {item.icon}
            <span className="text-xs mt-1 tracking-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;