

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { WorkoutSession, LoggedExercise, LoggedSet, ModuleType, PlannedSet } from '../../types';
import { mockWorkoutSessions } from '../../data/mockData';
import { FireIcon, CheckCircleIcon, TrashIcon } from '../common/Icons';

// Helper function to format seconds into HH:MM:SS for workout duration
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// Helper function to format seconds into MM:SS for rest timer
const formatRestTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}`;
};

interface ActiveWorkoutSessionProps {
  activeSession: WorkoutSession;
  setActiveSession: (session: WorkoutSession | null) => void;
  setActiveModule: (module: ModuleType) => void;
}

// New Sub-component: SetProgressTracker
interface SetProgressTrackerProps {
  currentSetNumber: number;
  totalPlannedSets: number;
  completedSetNumbers: Set<number>;
}

const SetProgressTracker: React.FC<SetProgressTrackerProps> = ({
  currentSetNumber,
  totalPlannedSets,
  completedSetNumbers,
}) => {
  return (
    <div className="flex justify-center items-center space-x-2 mb-4">
      {Array.from({ length: totalPlannedSets }).map((_, index) => {
        const setNum = index + 1;
        const isCompleted = completedSetNumbers.has(setNum);
        const isActive = setNum === currentSetNumber && !isCompleted;

        return (
          <div
            key={setNum}
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300
              ${isCompleted ? 'bg-green-500 border-green-500' : 'bg-slate-700/50 border-slate-600'}
              ${isActive ? 'bg-purple-500 border-purple-400 animate-pulse' : ''}
            `}
            aria-label={`Set ${setNum} is ${isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'}`}
          >
            {isCompleted && <CheckCircleIcon className="h-3 w-3 text-white" />}
          </div>
        );
      })}
       <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

const COMPLETED_WORKOUT_SESSIONS_KEY = 'lifesyncd_completed_workout_sessions';

const ActiveWorkoutSession: React.FC<ActiveWorkoutSessionProps> = ({
  activeSession,
  setActiveSession,
  setActiveModule,
}) => {
  const [sessionData, setSessionData] = useState<WorkoutSession>(() => {
    // Initialize loggedExercises with planned sets turned into logged sets
    // This ensures that for each planned set, there's a corresponding LoggedSet object
    // with `actualReps` initialized to an empty string for user input.
    const initialLoggedExercises: LoggedExercise[] = activeSession.loggedExercises.map(exercise => ({
      ...exercise,
      loggedSets: exercise.plannedSets.map(plannedSet => ({
        id: `${exercise.exerciseId}-log-${plannedSet.setNumber}`, // Unique ID for logged set
        setNumber: plannedSet.setNumber,
        actualReps: '', // Initialize empty for user input
      })),
    }));
    return { ...activeSession, loggedExercises: initialLoggedExercises };
  });

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  // Guided workout states
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [showWorkoutCompleteModal, setShowWorkoutCompleteModal] = useState(false);

  // New states for rest timer
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const DEFAULT_REST_TIME = 60; // 60 seconds rest by default

  // State for visual feedback when a set is completed
  const [highlightedSetId, setHighlightedSetId] = useState<string | null>(null);

  // Ref to store context for the next auto-advance when rest timer finishes
  const nextProgressionContextRef = useRef<(() => void) | null>(null);

  // Local state for the current reps input field
  const [currentRepsInput, setCurrentRepsInput] = useState<string>('');

  // Calculate max set number from all exercises
  const maxSetsInWorkout = useMemo(() => {
    return Math.max(
      ...sessionData.loggedExercises.map(ex => ex.plannedSets.length),
      1 // Ensure at least 1 set even if no planned sets initially (though templates should have them)
    );
  }, [sessionData.loggedExercises]);


  // Effect for workout duration timer
  useEffect(() => {
    let interval: number | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Effect for rest timer
  useEffect(() => {
    let restInterval: number | null = null;
    if (showRestTimer && restSeconds > 0) {
      restInterval = setInterval(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (showRestTimer && restSeconds === 0) {
      // Rest timer finished, automatically advance if context exists
      if (nextProgressionContextRef.current) {
        nextProgressionContextRef.current(); // Execute the stored advancement logic
      }
      setShowRestTimer(false);
      nextProgressionContextRef.current = null; // Clear context after use
      setHighlightedSetId(null); // Clear highlight
    }
    return () => {
      if (restInterval) clearInterval(restInterval);
    };
  }, [showRestTimer, restSeconds]);


  // REMOVED: This useEffect is no longer needed as loggedSets are initialized directly in useState
  // useEffect(() => {
  //   setSessionData(prevSession => {
  //     const updatedExercises = prevSession.loggedExercises.map(exercise => {
  //       // Ensure loggedSets array is populated for each planned set number
  //       // This ensures there's an input field for each expected set.
  //       const newLoggedSets = [];
  //       for (let i = 1; i <= exercise.plannedSets.length; i++) {
  //           const existingSet = exercise.loggedSets.find(ls => ls.setNumber === i);
  //           if (existingSet) {
  //               newLoggedSets.push(existingSet);
  //           } else {
  //               newLoggedSets.push({
  //                   id: `${exercise.exerciseId}-log-${i}`,
  //                   setNumber: i,
  //                   actualReps: '', // Start empty for actual logging
  //               });
  //           }
  //       }
  //       return { ...exercise, loggedExercises: newLoggedSets };
  //     });
  //     return { ...prevSession, loggedExercises: updatedExercises };
  //   });
  // }, [activeSession.loggedExercises]); // Only run on initial session data load

  const currentExercise = sessionData.loggedExercises[currentExerciseIndex];
  const currentSetToLog = currentExercise?.loggedSets.find(
    (set) => set.setNumber === currentSetNumber
  );
  
  // Effect to update currentRepsInput when currentExercise or currentSetNumber changes
  // or when a set is completed and the input needs to be prepared for the next set.
  useEffect(() => {
    if (currentExercise && currentSetToLog) {
        // Pre-fill with planned reps or existing actual reps
        const plannedReps = currentExercise.plannedSets.find(ps => ps.setNumber === currentSetNumber)?.reps;
        setCurrentRepsInput(currentSetToLog.actualReps !== '' ? currentSetToLog.actualReps.toString() : plannedReps?.toString() || '');
    } else {
        setCurrentRepsInput(''); // Clear if no active set
    }
  }, [currentExercise, currentSetToLog, currentSetNumber, showRestTimer]); // Also trigger when rest timer shows/hides


  const isCurrentSetLogged = currentSetToLog?.actualReps !== '';
  const canCompleteSet = currentRepsInput !== '' && parseInt(currentRepsInput, 10) >= 0;

  // Collect numbers of sets that have actualReps logged for the current exercise
  const completedSetNumbers = useMemo(() => {
    const set = new Set<number>();
    if (currentExercise) {
      currentExercise.loggedSets.forEach(loggedSet => {
        if (loggedSet.actualReps !== '') {
          set.add(loggedSet.setNumber);
        }
      });
    }
    return set;
  }, [currentExercise, sessionData]); // Recompute if currentExercise or sessionData changes


  const advanceWorkout = useCallback(() => {
    // Clear any existing highlight before advancing
    setHighlightedSetId(null); 

    const nextExerciseIdx = currentExerciseIndex + 1;

    // Check if we've completed all exercises for the current set number
    if (nextExerciseIdx < sessionData.loggedExercises.length) {
      // Move to the next exercise for the same set number
      setCurrentExerciseIndex(nextExerciseIdx);
    } else {
      // All exercises for currentSetNumber are done, move to next set number
      const nextSetNum = currentSetNumber + 1;
      if (nextSetNum <= maxSetsInWorkout) {
        setCurrentSetNumber(nextSetNum);
        setCurrentExerciseIndex(0); // Reset to first exercise
      } else {
        // Workout is fully complete!
        setIsRunning(false);
        setShowWorkoutCompleteModal(true);
      }
    }
  }, [currentExerciseIndex, currentSetNumber, maxSetsInWorkout, sessionData.loggedExercises.length]);

  // Handle completing a set
  const handleCompleteSet = useCallback(
    () => {
      if (!currentExercise || !currentSetToLog || currentRepsInput === '') return; // Ensure input is not empty

      const numericValue = parseInt(currentRepsInput, 10);
      
      setSessionData((prevSession) => {
        const updatedLoggedExercises = prevSession.loggedExercises.map((ex) => {
          if (ex.exerciseId === currentExercise.exerciseId) {
            const updatedLoggedSets = ex.loggedSets.map((set) => {
              if (set.id === currentSetToLog.id) {
                return { ...set, actualReps: numericValue };
              }
              return set;
            });
            return { ...ex, loggedSets: updatedLoggedSets };
          }
          return ex;
        });
        return { ...prevSession, loggedExercises: updatedLoggedExercises };
      });

      setHighlightedSetId(currentSetToLog.id); // Highlight the completed set
      setRestSeconds(DEFAULT_REST_TIME);
      setShowRestTimer(true);
      
      // Store the logic to advance the workout for when the rest timer finishes
      nextProgressionContextRef.current = advanceWorkout;
      setCurrentRepsInput(''); // Clear input for the next set
    },
    [currentExercise, currentSetToLog, currentRepsInput, advanceWorkout]
  );

  const handlePauseToggle = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleFinishWorkout = useCallback(() => {
    setIsRunning(false);
    const endTime = new Date().toISOString();
    const finalSession: WorkoutSession = {
      ...sessionData,
      endTime,
      durationSeconds: timerSeconds,
      status: 'completed',
    };
    
    // Save finalSession to local storage
    const storedCompletedSessions = localStorage.getItem(COMPLETED_WORKOUT_SESSIONS_KEY);
    const completedSessions: WorkoutSession[] = storedCompletedSessions ? JSON.parse(storedCompletedSessions) : [];
    completedSessions.push(finalSession);
    localStorage.setItem(COMPLETED_WORKOUT_SESSIONS_KEY, JSON.stringify(completedSessions));

    setActiveSession(null);
    setActiveModule('workouts');
  }, [sessionData, timerSeconds, setActiveSession, setActiveModule]);

  const handleCancelWorkout = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      setIsRunning(false);
      setActiveSession(null);
      setActiveModule('workouts');
    }
  }, [setActiveSession, setActiveModule]);

  const handleSkipRest = useCallback(() => {
    // Immediately set to 0 to trigger the useEffect to advance, but ensure it's
    // still marked as "showing rest timer" for a brief moment to prevent race conditions
    // with the nextProgressionContextRef and the `advanceWorkout` call.
    setRestSeconds(0); 
    // The useEffect for rest timer will handle setShowRestTimer(false) and calling nextProgressionContextRef.current
  }, []);

  const handleGoBackToWorkouts = useCallback(() => {
    // Navigate back to the main workouts module
    setActiveSession(null);
    setActiveModule('workouts');
  }, [setActiveSession, setActiveModule]);


  if (!currentExercise || !currentSetToLog) {
      // This case should ideally not be reached if workout templates are valid
      // or if workout is complete and modal is showing.
      if (showWorkoutCompleteModal) {
          // Render the completion modal if the workout is fully done
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
                <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl p-6 text-center w-full max-w-sm">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Workout Complete!</h2>
                    <p className="text-gray-300 mb-4">You crushed it! Total time: {formatTime(timerSeconds)}</p>
                    <button
                        onClick={handleGoBackToWorkouts}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                    >
                        Go Back to Workouts
                    </button>
                    {/* Add summary or other actions here later */}
                </div>
            </div>
          );
      }
      return (
        <div className="text-center text-gray-400 py-8">
          Loading workout or an unexpected error occurred.
          <button onClick={handleCancelWorkout} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
            Exit
          </button>
        </div>
      );
  }

  const plannedRepsForCurrentSet = currentExercise.plannedSets.find(
    (ps) => ps.setNumber === currentSetNumber
  )?.reps;

  const getCompleteButtonText = () => {
    if (showRestTimer) {
      return 'Resting...';
    }
    if (!canCompleteSet) {
      return 'Enter Reps';
    }
    if (isCurrentSetLogged) { // This state indicates it's already logged but might be awaiting rest timer or advance
      return 'Set Completed';
    }
    return 'Complete Set';
  };


  return (
    <div className="p-4 md:p-6 pb-28 min-h-screen flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Top Action Buttons */}
      <div className="flex justify-between w-full mb-6">
        <button
          onClick={handleFinishWorkout}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors duration-200"
        >
          <CheckCircleIcon className="h-5 w-5 mr-2" /> Finish
        </button>
        <button
          onClick={handleCancelWorkout}
          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors duration-200"
        >
          <TrashIcon className="h-5 w-5 mr-2" /> Cancel
        </button>
      </div>

      {/* Workout Duration Timer */}
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full mb-6 text-center">
        <h2 className="text-gray-300 text-lg mb-2">Workout Duration</h2>
        <p className="text-purple-400 text-5xl font-bold font-mono mb-4">{formatTime(timerSeconds)}</p>
        <button
          onClick={handlePauseToggle}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${
            isRunning
              ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* Rest Timer Overlay */}
      {showRestTimer && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg p-4">
          <h3 className="text-gray-300 text-xl mb-4">Resting...</h3>
          <p className="text-pink-400 text-7xl font-bold font-mono mb-6 animate-pulse">{formatRestTime(restSeconds)}</p>
          <div className="flex space-x-4">
            <button
              onClick={handleSkipRest}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* Current Exercise and Set */}
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full">
        <h3 className="text-3xl font-bold text-white mb-1">{currentExercise.exerciseName}</h3>
        <p className="text-gray-400 text-lg mb-4">{currentExercise.bodyPart}</p>

        {/* Set Progress Tracker */}
        <SetProgressTracker
          currentSetNumber={currentSetNumber}
          totalPlannedSets={currentExercise.plannedSets.length}
          completedSetNumbers={completedSetNumbers}
        />

        <p className="text-gray-300 text-xl font-semibold mb-4">
          Set {currentSetNumber} of {currentExercise.plannedSets.length} (Exercise {currentExerciseIndex + 1} of {sessionData.loggedExercises.length})
        </p>

        {/* Input for Current Set */}
        <div
          key={currentSetToLog.id} // Key to ensure re-render on set change for smooth input updates
          className={`flex flex-col mb-4 p-4 rounded-lg transition-all duration-300 
            ${isCurrentSetLogged && highlightedSetId === currentSetToLog.id ? 'bg-green-600/30 border-green-500' : 'bg-slate-700/30 border-slate-600'}
          `}
        >
          <div className="flex justify-between items-center mb-2">
            <span className={`text-gray-300 font-medium ${isCurrentSetLogged ? 'line-through text-gray-500' : ''}`}>
              Planned: {plannedRepsForCurrentSet || 'N/A'} reps
            </span>
          </div>
          <input
            type="number"
            value={currentRepsInput}
            onChange={(e) => setCurrentRepsInput(e.target.value)}
            placeholder="Actual Reps"
            min="0"
            className={`w-full p-3 rounded-lg bg-slate-800/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-500 text-base
              ${isCurrentSetLogged ? 'bg-slate-700/70' : ''}
            `}
            aria-label={`Actual reps for ${currentExercise.exerciseName} set ${currentSetNumber}`}
            disabled={!isRunning || showRestTimer || isCurrentSetLogged} // Disable if not running, or during rest, or if already logged
            required
          />
        </div>

        <button
          onClick={handleCompleteSet}
          disabled={!canCompleteSet || !isRunning || showRestTimer || isCurrentSetLogged}
          className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center text-lg
            ${
              (canCompleteSet && isRunning && !showRestTimer && !isCurrentSetLogged)
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg'
                : (showRestTimer ? 'bg-yellow-600/70 cursor-not-allowed' : 'bg-gray-600/50 cursor-not-allowed')
            }`}
          aria-label="Complete current set"
        >
          {getCompleteButtonText()}
        </button>
      </div>

      {/* Workout Complete Modal */}
      {showWorkoutCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
          <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl p-6 text-center w-full max-w-sm">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Workout Complete!</h2>
            <p className="text-gray-300 mb-4">You crushed it! Total time: {formatTime(timerSeconds)}</p>
            <button
              onClick={handleGoBackToWorkouts}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
            >
              Go Back to Workouts
            </button>
            {/* Add summary or other actions here later */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveWorkoutSession;