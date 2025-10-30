
import React, { useState, useEffect, useCallback, useReducer } from 'react';
import Module from '../common/Module';
import { mockExercises, mockWorkoutSessions } from '../../data/mockData';
import { FireIcon, PencilIcon, TrashIcon, CheckCircleIcon, PlusCircleIcon, MinusCircleIcon, DuplicateIcon } from '../common/Icons';
import { Workout, Exercise, ModuleType, WorkoutSession, WorkoutTemplateExercise, PlannedSet, LoggedExercise, LoggedSet } from '../../types';

interface WorkoutsModuleProps {
  setActiveModule: (module: ModuleType) => void;
  setActiveSession: (session: WorkoutSession | null) => void;
}

const LOCAL_STORAGE_KEY = 'lifesyncd_workout_templates';

// --- Form State Management with useReducer ---

interface FormState {
  workoutName: string;
  selectedExercises: WorkoutTemplateExercise[];
  searchTerm: string;
  openExerciseIdInForm: string | null;
  validationErrors: { name?: string; exercises?: string; sets?: string };
  draggedItemIndex: number | null; // For drag and drop within the form
}

type FormAction =
  | { type: 'SET_WORKOUT_NAME'; payload: string }
  | { type: 'TOGGLE_EXERCISE_SELECTION'; payload: Exercise }
  | { type: 'REMOVE_SELECTED_EXERCISE'; payload: string }
  | { type: 'ADD_PLANNED_SET'; payload: string }
  | { type: 'UPDATE_PLANNED_SET'; payload: { exerciseId: string; setId: string; field: 'reps'; value: string } } // Removed 'weight' field
  | { type: 'REMOVE_PLANNED_SET'; payload: { exerciseId: string; setId: string } }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_OPEN_EXERCISE_IN_FORM'; payload: string | null }
  | { type: 'SET_FORM_ERRORS'; payload: FormState['validationErrors'] }
  | { type: 'REORDER_EXERCISES'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_DRAGGED_ITEM_INDEX'; payload: number | null }
  | { type: 'RESET_FORM'; payload?: Workout | null }; // Payload is optional for editing existing workout

const initialFormState: FormState = {
  workoutName: '',
  selectedExercises: [],
  searchTerm: '',
  openExerciseIdInForm: null,
  validationErrors: {},
  draggedItemIndex: null,
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_WORKOUT_NAME':
      return { ...state, workoutName: action.payload, validationErrors: { ...state.validationErrors, name: undefined } };
    case 'TOGGLE_EXERCISE_SELECTION':
      {
        const exercise = action.payload;
        const isSelected = state.selectedExercises.some((ex) => ex.id === exercise.id);
        let newExercises;
        let newOpenExerciseIdInForm = state.openExerciseIdInForm;

        if (isSelected) {
          newExercises = state.selectedExercises.filter((ex) => ex.id !== exercise.id);
          // If the removed exercise was open, close it
          if (newOpenExerciseIdInForm === exercise.id) {
            newOpenExerciseIdInForm = null;
          }
        } else {
          const newTemplateExercise: WorkoutTemplateExercise = {
            ...exercise,
            plannedSets: [{ id: Date.now().toString() + '-1', setNumber: 1, reps: '' }], // Removed weight
          };
          newExercises = [...state.selectedExercises, newTemplateExercise];
          newOpenExerciseIdInForm = exercise.id; // Automatically open the newly added exercise
        }
        return {
          ...state,
          selectedExercises: newExercises,
          openExerciseIdInForm: newOpenExerciseIdInForm,
          validationErrors: { ...state.validationErrors, exercises: undefined },
        };
      }
    case 'REMOVE_SELECTED_EXERCISE':
      return {
        ...state,
        selectedExercises: state.selectedExercises.filter((ex) => ex.id !== action.payload),
        validationErrors: { ...state.validationErrors, exercises: undefined },
      };
    case 'ADD_PLANNED_SET':
      return {
        ...state,
        selectedExercises: state.selectedExercises.map((ex) => {
          if (ex.id === action.payload) {
            const newSetNumber = ex.plannedSets.length > 0 ? Math.max(...ex.plannedSets.map(s => s.setNumber)) + 1 : 1;
            const newSet: PlannedSet = { id: `${Date.now()}-${newSetNumber}`, setNumber: newSetNumber, reps: '' }; // Removed weight
            return { ...ex, plannedSets: [...ex.plannedSets, newSet] };
          }
          return ex;
        }),
      };
    case 'UPDATE_PLANNED_SET':
      return {
        ...state,
        selectedExercises: state.selectedExercises.map((ex) => {
          if (ex.id === action.payload.exerciseId) {
            return {
              ...ex,
              plannedSets: ex.plannedSets.map((set) => {
                if (set.id === action.payload.setId) {
                  const numericValue = action.payload.value === '' ? '' : parseInt(action.payload.value, 10);
                  return { ...set, [action.payload.field]: numericValue };
                }
                return set;
              }),
            };
          }
          return ex;
        }),
      };
    case 'REMOVE_PLANNED_SET':
      return {
        ...state,
        selectedExercises: state.selectedExercises.map((ex) => {
          if (ex.id === action.payload.exerciseId) {
            const updatedSets = ex.plannedSets.filter((set) => set.id !== action.payload.setId);
            const renumberedSets = updatedSets.map((set, index) => ({
              ...set,
              setNumber: index + 1
            }));
            return { ...ex, plannedSets: renumberedSets };
          }
          return ex;
        }),
      };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_OPEN_EXERCISE_IN_FORM':
      return { ...state, openExerciseIdInForm: action.payload };
    case 'SET_FORM_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'REORDER_EXERCISES':
      {
        const newExercises = [...state.selectedExercises];
        const [draggedItem] = newExercises.splice(action.payload.fromIndex, 1);
        newExercises.splice(action.payload.toIndex, 0, draggedItem);
        return { ...state, selectedExercises: newExercises };
      }
    case 'SET_DRAGGED_ITEM_INDEX':
      return { ...state, draggedItemIndex: action.payload };
    case 'RESET_FORM':
      if (action.payload) { // If editing an existing workout
        return {
          ...initialFormState,
          workoutName: action.payload.name,
          selectedExercises: action.payload.exercises.map(ex => ({
            ...ex,
            plannedSets: ex.plannedSets.map(set => ({...set})) // Deep copy
          })),
        };
      }
      return initialFormState; // For creating a new workout or cancelling
    default:
      return state;
  }
};

// --- Sub-component: SelectedExerciseItem ---
interface SelectedExerciseItemProps {
  exercise: WorkoutTemplateExercise;
  index: number;
  dispatch: React.Dispatch<FormAction>;
  isOpen: boolean;
  isDragged: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: () => void;
}

const SelectedExerciseItem: React.FC<SelectedExerciseItemProps> = ({
  exercise,
  index,
  dispatch,
  isOpen,
  isDragged,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling collapse when deleting
    dispatch({ type: 'REMOVE_SELECTED_EXERCISE', payload: exercise.id });
  }, [dispatch, exercise.id]);

  const toggleCollapse = useCallback(() => {
    dispatch({ type: 'SET_OPEN_EXERCISE_IN_FORM', payload: isOpen ? null : exercise.id });
  }, [dispatch, isOpen, exercise.id]);

  const handleUpdateSet = useCallback((setId: string, field: 'reps', value: string) => { // Removed 'weight' field
    dispatch({ type: 'UPDATE_PLANNED_SET', payload: { exerciseId: exercise.id, setId, field, value } });
  }, [dispatch, exercise.id]);

  const handleRemoveSet = useCallback((setId: string) => {
    dispatch({ type: 'REMOVE_PLANNED_SET', payload: { exerciseId: exercise.id, setId } });
  }, [dispatch, exercise.id]);

  const handleAddSet = useCallback(() => {
    dispatch({ type: 'ADD_PLANNED_SET', payload: exercise.id });
  }, [dispatch, exercise.id]);

  // const hasEmptySets = exercise.plannedSets.some(set => set.reps === ''); // Only check reps

  return (
    <div
      draggable="true"
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`bg-slate-700/50 backdrop-blur-md border border-slate-600 rounded-lg overflow-hidden
                  ${isDragged ? 'opacity-50 border-purple-500' : ''}
                  transition-all duration-100 ease-in-out group relative`}
    >
      <button
        type="button"
        onClick={toggleCollapse}
        className="w-full flex items-center justify-between p-3 text-left font-semibold text-white hover:bg-slate-600/50 transition-colors duration-200 cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={`planned-sets-${exercise.id}`}
      >
        <span className="flex items-center space-x-2 flex-grow">
          {/* Drag Handle */}
          <svg className="h-5 w-5 text-gray-400 group-hover:text-purple-300 cursor-grab flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M3 8a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
          </svg>
          <span className="flex-grow">{exercise.name} <span className="text-gray-400 font-normal">({exercise.bodyPart})</span></span>
        </div>
      </button>

      {isOpen && (
        <div id={`planned-sets-${exercise.id}`} className="p-3 border-t border-slate-600">
          <h4 className="text-gray-300 text-sm font-medium mb-2">Planned Sets:</h4>
          <div className="space-y-2 mb-3">
            {exercise.plannedSets.map((plannedSet) => (
              <div key={plannedSet.id} className="flex flex-wrap items-center gap-2">
                <span className="text-gray-400 text-sm w-10 flex-shrink-0">Set {plannedSet.setNumber}</span>
                <input
                  type="number"
                  value={plannedSet.reps}
                  onChange={(e) => handleUpdateSet(plannedSet.id, 'reps', e.target.value)}
                  placeholder="Reps"
                  min="0"
                  className={`flex-grow p-2 rounded-lg bg-slate-800/70 border ${plannedSet.reps === '' ? 'border-red-500' : 'border-slate-700'} focus:ring-pink-500 focus:border-pink-500 text-gray-100 placeholder-gray-500 text-sm`}
                  aria-label={`Planned reps for ${exercise.name} set ${plannedSet.setNumber}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSet(plannedSet.id)}
                  className="text-red-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-slate-700/50"
                  aria-label={`Remove planned set ${plannedSet.setNumber}`}
                >
                  <MinusCircleIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddSet}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center mt-2"
            aria-label={`Add planned set for ${exercise.name}`}
          >
            <PlusCircleIcon className="h-5 w-5 mr-1" /> Add Planned Set
          </button>
        </div>
      )}
    </div>
  );
};

// --- Sub-component: ExerciseLibraryItem ---
interface ExerciseLibraryItemProps {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: (exercise: Exercise) => void; // Changed to callback
}

const ExerciseLibraryItem: React.FC<ExerciseLibraryItemProps> = ({ exercise, isSelected, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(exercise)}
      className={`cursor-pointer bg-slate-800/40 backdrop-blur-md border rounded-lg p-3 text-sm transition-all duration-200 hover:scale-[1.02] ${
        isSelected
          ? 'border-green-500 bg-green-600/30 shadow-md ring-2 ring-green-500'
          : 'border-slate-700/60 hover:bg-slate-700/50'
      }`}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${exercise.name}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>{exercise.name}</span>
        {isSelected && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
      </div>
      <span className="text-xs text-gray-400 block">{exercise.bodyPart}</span>
    </div>
  );
};

// --- Sub-component: ExerciseLibraryModal ---
interface ExerciseLibraryModalProps {
  onClose: () => void;
  selectedExercises: WorkoutTemplateExercise[];
  onToggleExercise: (exercise: Exercise) => void;
}

const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({ onClose, selectedExercises, onToggleExercise }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyPartFilter, setSelectedBodyPartFilter] = useState<string>('All'); // New state for body part filter

  // Get unique body parts for filter buttons
  const allBodyParts = Array.from(new Set(mockExercises.map(ex => ex.bodyPart)));

  const filteredExercises = mockExercises.filter(
    (exercise) =>
      (selectedBodyPartFilter === 'All' || exercise.bodyPart === selectedBodyPartFilter) && // Apply body part filter
      (exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.bodyPart.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
      <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl h-full max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <h2 className="font-bold text-xl text-gray-200">Exercise Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-slate-700"
            aria-label="Close library"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 flex-grow flex flex-col overflow-hidden">
          {/* Body Part Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <button
              onClick={() => setSelectedBodyPartFilter('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedBodyPartFilter === 'All' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-700/50 hover:bg-slate-600/70 text-gray-300'
              }`}
            >
              All
            </button>
            {allBodyParts.map((bodyPart) => (
              <button
                key={bodyPart}
                onClick={() => setSelectedBodyPartFilter(bodyPart)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedBodyPartFilter === bodyPart ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-700/50 hover:bg-slate-600/70 text-gray-300'
                }`}
              >
                {bodyPart}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search exercises (e.g., 'squat', 'chest')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
          />
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {filteredExercises.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No exercises found matching your search or filter.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredExercises.map((exercise) => (
                  <ExerciseLibraryItem
                    key={exercise.id}
                    exercise={exercise}
                    isSelected={selectedExercises.some((ex) => ex.id === exercise.id)}
                    onToggle={onToggleExercise}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="p-4 border-t border-slate-700/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            aria-label="Done selecting exercises"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};


// --- Sub-component: WorkoutTemplateForm ---
interface WorkoutTemplateFormProps {
  initialWorkout: Workout | null;
  onSubmit: (workout: Workout) => void;
  onCancel: () => void;
}

const WorkoutTemplateForm: React.FC<WorkoutTemplateFormProps> = ({ initialWorkout, onSubmit, onCancel }) => {
  const [state, dispatch] = useReducer(formReducer, initialFormState, (init) => {
    if (initialWorkout) {
      return formReducer(init, { type: 'RESET_FORM', payload: initialWorkout });
    }
    return init;
  });

  const { workoutName, selectedExercises, openExerciseIdInForm, validationErrors, draggedItemIndex } = state;

  const [showExerciseLibraryModal, setShowExerciseLibraryModal] = useState(false); // State for modal visibility

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    dispatch({ type: 'SET_DRAGGED_ITEM_INDEX', payload: index });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Crucial to allow a drop
    // Add visual indicator to the target
    if (e.currentTarget && !e.currentTarget.classList.contains('drag-over-indicator')) {
      e.currentTarget.classList.add('drag-over-indicator');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget) {
      e.currentTarget.classList.remove('drag-over-indicator');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (e.currentTarget) {
      e.currentTarget.classList.remove('drag-over-indicator');
    }

    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);

    if (draggedIndex === null || isNaN(draggedIndex) || draggedIndex === targetIndex) {
      dispatch({ type: 'SET_DRAGGED_ITEM_INDEX', payload: null });
      return;
    }

    dispatch({ type: 'REORDER_EXERCISES', payload: { fromIndex: draggedIndex, toIndex: targetIndex } });
    dispatch({ type: 'SET_DRAGGED_ITEM_INDEX', payload: null });
  }, []);

  const handleDragEnd = useCallback(() => {
    dispatch({ type: 'SET_DRAGGED_ITEM_INDEX', payload: null });
    document.querySelectorAll('.drag-over-indicator').forEach(el => el.classList.remove('drag-over-indicator'));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const errors: FormState['validationErrors'] = {};

    if (!workoutName.trim()) {
      errors.name = 'Workout template name is required.';
    }
    if (selectedExercises.length === 0) {
      errors.exercises = 'Please select at least one exercise for your template.';
    }
    const exercisesWithEmptySets = selectedExercises.filter(ex =>
      ex.plannedSets.length === 0 || ex.plannedSets.some(set => set.reps === '') // Only check reps
    );
    if (exercisesWithEmptySets.length > 0) {
      errors.sets = 'All selected exercises must have at least one planned set with reps filled.';
    }

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_FORM_ERRORS', payload: errors });
      return;
    }

    const newOrUpdatedWorkout: Workout = {
      id: initialWorkout ? initialWorkout.id : Date.now().toString(),
      name: workoutName.trim(),
      exercises: selectedExercises,
    };
    onSubmit(newOrUpdatedWorkout);
    dispatch({ type: 'RESET_FORM' });
  }, [workoutName, selectedExercises, initialWorkout, onSubmit]);

  const handleCancel = useCallback(() => {
    onCancel();
    dispatch({ type: 'RESET_FORM' });
  }, [onCancel]);

  return (
    <Module title={initialWorkout ? 'Edit Workout Template' : 'New Workout Template'} icon={<FireIcon />} className="max-h-[calc(100vh-80px)] md:max-h-[calc(100vh-120px)]">
      {/* CSS for drag-and-drop feedback and visual styling */}
      <style>{`
        .drag-over-indicator {
          border: 2px dashed #a78bfa !important; /* purple-400 */
          background-color: rgba(167, 139, 250, 0.1) !important; /* light purple tint */
        }
        .group:hover .cursor-grab {
          cursor: grab;
        }
        .cursor-grabbing {
          cursor: grabbing;
        }
      `}</style>

      {/* Fix: Closing the form tag, and adding missing content to complete the component */}
      <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
        <div>
          <label htmlFor="workoutName" className="block text-gray-300 text-sm font-bold mb-2">
            Workout Name:
          </label>
          <input
            type="text"
            id="workoutName"
            value={workoutName}
            onChange={(e) => dispatch({ type: 'SET_WORKOUT_NAME', payload: e.target.value })}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
            placeholder="e.g., Full Body A"
            required
          />
          {validationErrors.name && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
          )}
        </div>

        <div className="flex-grow flex flex-col min-h-0"> {/* Use min-h-0 for flex children overflow */}
          <h3 className="text-gray-300 text-sm font-bold mb-2">Exercises in this Workout:</h3>
          {validationErrors.exercises && (
            <p className="text-red-400 text-sm mb-2">{validationErrors.exercises}</p>
          )}
          {validationErrors.sets && (
            <p className="text-red-400 text-sm mb-2">{validationErrors.sets}</p>
          )}
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {selectedExercises.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No exercises added to this workout yet.</p>
            ) : (
              selectedExercises.map((exercise, index) => (
                <SelectedExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  dispatch={dispatch}
                  isOpen={openExerciseIdInForm === exercise.id}
                  isDragged={draggedItemIndex === index}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowExerciseLibraryModal(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 mt-4 flex items-center justify-center"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" /> Add/Remove Exercises
          </button>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700/50 flex-shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
          >
            {initialWorkout ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </form>

      {showExerciseLibraryModal && (
        <ExerciseLibraryModal
          onClose={() => setShowExerciseLibraryModal(false)}
          selectedExercises={selectedExercises}
          onToggleExercise={(exercise) => dispatch({ type: 'TOGGLE_EXERCISE_SELECTION', payload: exercise })}
        />
      )}
    </Module>
  );
};


// --- Main WorkoutsModule Component ---
const WorkoutsModule: React.FC<WorkoutsModuleProps> = ({ setActiveModule, setActiveSession }) => {
  const [workoutTemplates, setWorkoutTemplates] = useState<Workout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Workout | null>(null);

  // Load templates from local storage on initial mount
  useEffect(() => {
    const storedTemplates = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTemplates) {
      setWorkoutTemplates(JSON.parse(storedTemplates));
    }
  }, []);

  // Save templates to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(workoutTemplates));
  }, [workoutTemplates]);

  const handleCreateNewTemplate = useCallback(() => {
    setEditingTemplate(null);
    setShowForm(true);
  }, []);

  const handleEditTemplate = useCallback((template: Workout) => {
    setEditingTemplate(template);
    setShowForm(true);
  }, []);

  const handleDeleteTemplate = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this workout template?')) {
      setWorkoutTemplates((prevTemplates) => prevTemplates.filter((template) => template.id !== id));
    }
  }, []);

  const handleSaveTemplate = useCallback((newOrUpdatedWorkout: Workout) => {
    if (editingTemplate) {
      setWorkoutTemplates((prevTemplates) =>
        prevTemplates.map((template) =>
          template.id === newOrUpdatedWorkout.id ? newOrUpdatedWorkout : template
        )
      );
    } else {
      setWorkoutTemplates((prevTemplates) => [...prevTemplates, newOrUpdatedWorkout]);
    }
    setShowForm(false);
    setEditingTemplate(null);
  }, [editingTemplate]);

  const handleStartWorkout = useCallback((template: Workout) => {
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      templateId: template.id,
      templateName: template.name,
      startTime: new Date().toISOString(),
      loggedExercises: template.exercises.map(ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        bodyPart: ex.bodyPart,
        plannedSets: ex.plannedSets,
        loggedSets: [] // Will be populated during the active session
      })),
      status: 'in-progress',
    };
    setActiveSession(newSession);
    setActiveModule('activeWorkout');
  }, [setActiveSession, setActiveModule]);


  if (showForm) {
    return (
      <WorkoutTemplateForm
        initialWorkout={editingTemplate}
        onSubmit={handleSaveTemplate}
        onCancel={() => {
          setShowForm(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  // Sub-component for Module Header Content
  const WorkoutsHeaderContent = (
    <button
      onClick={() => setActiveModule('activeWorkout')} // Navigate to a history/logs view
      className="bg-slate-700/50 hover:bg-slate-600/70 text-gray-300 text-sm font-medium px-3 py-1 rounded-full transition-colors duration-200"
      aria-label="View workout history"
    >
      History
    </button>
  );

  return (
    <Module title="Workout Templates" icon={<FireIcon />} headerContent={WorkoutsHeaderContent}>
      {workoutTemplates.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No workout templates created yet. Let's build your first one!</p>
      ) : (
        <ul className="space-y-4">
          {workoutTemplates.map((template) => (
            <li
              key={template.id}
              className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg p-4 transform transition-all duration-300 hover:scale-[1.01] hover:bg-slate-700/50"
            >
              <h3 className="font-bold text-lg text-white mb-2">{template.name}</h3>
              <p className="text-sm text-gray-400 mb-3">
                {template.exercises.length} Exercises
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.exercises.map((ex, idx) => (
                  <span key={ex.id} className="text-xs bg-slate-700/50 px-2 py-1 rounded-full text-gray-300">
                    {ex.name}
                  </span>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-700/50">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="text-blue-400 hover:text-blue-500 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50"
                  aria-label={`Edit workout template ${template.name}`}
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50"
                  aria-label={`Delete workout template ${template.name}`}
                >
                  <TrashIcon />
                </button>
                <button
                  onClick={() => handleStartWorkout(template)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                  aria-label={`Start workout with template ${template.name}`}
                >
                  Start Workout
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <button
          onClick={handleCreateNewTemplate}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-lg"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" /> Create New Template
        </button>
      </div>
    </Module>
  );
};

export default WorkoutsModule;
