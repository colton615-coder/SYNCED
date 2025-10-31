import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Module from '../common/Module';
import { FireIcon, ChevronLeftIcon, ChartBarIcon } from '../common/Icons';
import { WorkoutSession, LoggedExercise, Exercise, ModuleType } from '../../types';
import { mockExercises } from '../../data/mockData';

const COMPLETED_WORKOUT_SESSIONS_KEY = 'lifesyncd_completed_workout_sessions';

// --- Helper function to format seconds into HH:MM:SS ---
const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
};

// --- Sub-component: Simple SVG Line Chart for Progress ---
interface LineChartProps {
  data: { date: string; value: number }[];
  exerciseName: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, exerciseName }) => {
    const width = 350;
    const height = 200;
    const padding = 40;

    const maxValue = Math.max(...data.map(d => d.value), 0);
    const minValue = 0; // Assuming reps start from 0

    const getX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
    const getY = (value: number) => height - padding - ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
    
    if (data.length < 2) {
        return <p className="text-center text-gray-400">Not enough data to display a chart. Complete more workouts with this exercise.</p>;
    }

    const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <title>Progress chart for {exerciseName}</title>
            {/* Y-Axis labels */}
            {[...Array(5)].map((_, i) => {
                const value = Math.round(minValue + (i / 4) * (maxValue - minValue));
                const y = getY(value);
                return (
                    <g key={i}>
                        <text x={padding - 10} y={y + 3} textAnchor="end" fill="#9ca3af" fontSize="10">{value}</text>
                        <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
                    </g>
                );
            })}
            {/* X-Axis labels */}
            {data.map((d, i) => (
                 <text key={i} x={getX(i)} y={height - padding + 15} textAnchor="middle" fill="#9ca3af" fontSize="10">
                     {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                 </text>
            ))}
            
            <path d={path} fill="none" stroke="#a78bfa" strokeWidth="2" />
            
            {data.map((d, i) => (
                <circle key={i} cx={getX(i)} cy={getY(d.value)} r="3" fill="#a78bfa" >
                    <title>{`${exerciseName} on ${d.date}: ${d.value} reps`}</title>
                </circle>
            ))}
        </svg>
    );
};


interface WorkoutHistoryProps {
  setActiveModule: (module: ModuleType) => void;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ setActiveModule }) => {
  const [completedSessions, setCompletedSessions] = useState<WorkoutSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [exerciseToTrack, setExerciseToTrack] = useState<Exercise | null>(null);

  useEffect(() => {
    const storedSessions = localStorage.getItem(COMPLETED_WORKOUT_SESSIONS_KEY);
    if (storedSessions) {
      const parsedSessions: WorkoutSession[] = JSON.parse(storedSessions);
      // Sort sessions by start time, most recent first
      parsedSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setCompletedSessions(parsedSessions);
    }
  }, []);

  const progressData = useMemo(() => {
    if (!exerciseToTrack) return [];
    
    const data: { date: string, value: number }[] = [];
    // Iterate through sessions in reverse chronological order to find reps
    [...completedSessions].reverse().forEach(session => {
        let maxRepsForExercise = 0;
        const exerciseLog = session.loggedExercises.find(ex => ex.exerciseId === exerciseToTrack.id);
        if (exerciseLog) {
            exerciseLog.loggedSets.forEach(set => {
                const reps = typeof set.actualReps === 'number' ? set.actualReps : 0;
                if (reps > maxRepsForExercise) {
                    maxRepsForExercise = reps;
                }
            });
            if (maxRepsForExercise > 0) {
                 data.push({ date: session.startTime, value: maxRepsForExercise });
            }
        }
    });
    return data;
  }, [exerciseToTrack, completedSessions]);

  const allPerformedExercises = useMemo(() => {
      const exerciseMap = new Map<string, Exercise>();
      completedSessions.forEach(session => {
          session.loggedExercises.forEach(loggedEx => {
              if (!exerciseMap.has(loggedEx.exerciseId)) {
                  const baseExercise = mockExercises.find(ex => ex.id === loggedEx.exerciseId);
                  if (baseExercise) {
                      exerciseMap.set(baseExercise.id, baseExercise);
                  }
              }
          });
      });
      return Array.from(exerciseMap.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [completedSessions]);
  
  const handleTrackExercise = useCallback((exercise: Exercise) => {
    setExerciseToTrack(exercise);
  }, []);


  const SessionDetailsModal: React.FC = () => {
    if (!selectedSession) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4" onClick={() => setSelectedSession(null)}>
            <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h2 className="font-bold text-xl text-gray-200">{selectedSession.templateName}</h2>
                    <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="p-4 flex-grow overflow-y-auto custom-scrollbar space-y-4">
                    {selectedSession.loggedExercises.map(ex => (
                        <div key={ex.exerciseId} className="bg-slate-700/50 p-3 rounded-lg">
                            <h3 className="font-semibold text-white mb-2">{ex.exerciseName}</h3>
                            <ul className="space-y-1 text-sm">
                                {ex.loggedSets.map(set => (
                                    <li key={set.id} className="flex justify-between items-center text-gray-300">
                                        <span>Set {set.setNumber}</span>
                                        <span className="font-mono text-purple-300">{set.actualReps} reps</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };
  
  const ProgressChartModal: React.FC = () => {
    if (!exerciseToTrack) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4" onClick={() => setExerciseToTrack(null)}>
            <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h2 className="font-bold text-xl text-gray-200">Progress for {exerciseToTrack.name}</h2>
                    <button onClick={() => setExerciseToTrack(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="p-4">
                    <LineChart data={progressData} exerciseName={exerciseToTrack.name} />
                </div>
            </div>
        </div>
    );
  };

  return (
    <>
      <Module title="Workout History" icon={<FireIcon />}>
        <div className="flex flex-col h-full">
            <button onClick={() => setActiveModule('workouts')} className="flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors duration-200 self-start">
              <ChevronLeftIcon />
              <span className="ml-1">Back to Templates</span>
            </button>

            <div className="mb-6 bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Track Your Progress</h3>
                <p className="text-sm text-gray-400 mb-3">Select an exercise to see how your reps have improved over time.</p>
                <select 
                    onChange={e => {
                        const selectedEx = allPerformedExercises.find(ex => ex.id === e.target.value);
                        if (selectedEx) handleTrackExercise(selectedEx);
                    }}
                    className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
                    defaultValue=""
                >
                    <option value="" disabled>Select an exercise...</option>
                    {allPerformedExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
            </div>

            {completedSessions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No completed workouts yet. Go crush a session!</p>
            ) : (
              <ul className="space-y-4">
                {completedSessions.map(session => (
                  <li key={session.id}>
                      <button 
                        onClick={() => setSelectedSession(session)}
                        className="w-full text-left block bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg p-4 transition-all duration-300 hover:scale-[1.01] hover:bg-slate-700/50"
                      >
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="font-bold text-lg text-white">{session.templateName}</h3>
                              <span className="text-sm text-gray-400">
                                  {new Date(session.startTime).toLocaleDateString()}
                              </span>
                          </div>
                          <p className="text-sm text-gray-300">
                              Duration: <span className="font-semibold text-purple-300">{formatDuration(session.durationSeconds || 0)}</span>
                          </p>
                      </button>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </Module>
      
      <SessionDetailsModal />
      <ProgressChartModal />
    </>
  );
};

export default WorkoutHistory;
