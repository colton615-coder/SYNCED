
import React, { useState } from 'react';
import DashboardModule from './components/dashboard/Dashboard';
import CalendarModule from './components/calendar/CalendarModule';
import TasksModule from './components/tasks/TasksModule';
import HabitsModule from './components/habits/HabitsModule';
import WorkoutsModule from './components/workouts/WorkoutsModule';
import ProjectsModule from './components/projects/ProjectsModule';
import ShoppingListModule from './components/shopping/ShoppingListModule';
import JournalModule from './components/journal/JournalModule';
import EducationModule from './components/education/EducationModule';
import BottomNavBar from './components/navigation/BottomNavBar';
import ActiveWorkoutSession from './components/workouts/ActiveWorkoutSession'; // Import new component
import WorkoutHistory from './components/workouts/WorkoutHistory'; // Import workout history component
import { ModuleType, WorkoutSession } from './types';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null); // New state for active workout session

  const renderActiveModule = () => {
    if (activeSession && activeModule === 'activeWorkout') {
      return (
        <ActiveWorkoutSession
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          setActiveModule={setActiveModule}
        />
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'tasks':
        return <TasksModule />;
      case 'habits':
        return <HabitsModule />;
      case 'workouts':
        return (
          <WorkoutsModule
            setActiveModule={setActiveModule}
            setActiveSession={setActiveSession}
          />
        );
      case 'workoutHistory':
        return <WorkoutHistory setActiveModule={setActiveModule} />;
      case 'projects':
        return <ProjectsModule />;
      case 'shopping':
        return <ShoppingListModule />;
      case 'journal':
        return <JournalModule />;
      case 'education':
        return <EducationModule />;
      default:
        return <DashboardModule />;
    }
  };


  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-white bg-slate-900 flex flex-col">
      {/* Animated Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-6000"></div>
      </div>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-6000 { animation-delay: 6s; }

        @keyframes slide-in-fade {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in-fade {
          animation: slide-in-fade 0.5s ease-out forwards;
        }
      `}</style>
      
      <main className={`relative z-10 flex flex-col items-center w-full flex-grow ${activeSession ? 'p-0' : 'p-4 md:p-6 pb-28'}`}>
        {!activeSession && ( // Only show header if no active session
          <header className="w-full max-w-7xl mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">LifeSync'd</h1>
            <p className="text-lg text-gray-300 mt-2">Your personalized life optimization dashboard.</p>
          </header>
        )}
        <div className={`w-full h-full ${activeSession ? 'max-w-full' : 'max-w-2xl'}`}>
          {renderActiveModule()}
        </div>
      </main>

      <BottomNavBar activeModule={activeModule} setActiveModule={setActiveModule} activeSession={activeSession} />
    </div>
  );
};

export default App;