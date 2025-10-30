
import React, { useState, useEffect, useCallback } from 'react';
import Module from '../common/Module';
import { FolderIcon, PlusCircleIcon, PencilIcon, CheckCircleIcon, ChevronDownIcon, ArchiveIcon, UnarchiveIcon, TrashIcon } from '../common/Icons'; // Import TrashIcon
import { Project, ProjectStatus, SubTask } from '../../types';

const LOCAL_STORAGE_KEY = 'lifesyncd_projects';

// --- Sub-component: SubTaskItem ---
interface SubTaskItemProps {
  subTask: SubTask;
  onToggleComplete: (id: string) => void;
  onUpdateText: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
}

const SubTaskItem: React.FC<SubTaskItemProps> = ({ subTask, onToggleComplete, onUpdateText, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(subTask.text);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim() && editText !== subTask.text) {
      onUpdateText(subTask.id, editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <li className="flex items-center group bg-slate-700/30 p-2 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
      <div
        onClick={() => onToggleComplete(subTask.id)}
        className={`w-5 h-5 mr-3 rounded-full border-2 flex-shrink-0 cursor-pointer flex items-center justify-center ${
          subTask.completed ? 'bg-green-500 border-green-500' : 'border-gray-500 group-hover:border-green-500'
        }`}
      >
        {subTask.completed && <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
      </div>
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="flex-1 flex items-center">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditSubmit}
            className="w-full p-1 rounded-md bg-slate-800 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-sm"
            autoFocus
          />
        </form>
      ) : (
        <span className={`flex-1 ${subTask.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
          {subTask.text}
        </span>
      )}
      <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600"
            aria-label={`Edit sub-task ${subTask.text}`}
          >
            <PencilIcon />
          </button>
        )}
        <button
          onClick={() => onDelete(subTask.id)}
          className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600"
          aria-label={`Delete sub-task ${subTask.text}`}
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
};


// --- Sub-component: ProjectForm ---
interface ProjectFormProps {
  initialProject: Project | null;
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialProject, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status || 'Not Started');
  const [progress, setProgress] = useState(initialProject?.progress || 0);
  const [dueDate, setDueDate] = useState(initialProject?.dueDate || '');
  const [subTasks, setSubTasks] = useState<SubTask[]>(initialProject?.subTasks || []);
  const [newSubTaskText, setNewSubTaskText] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Project name is required.');
      return;
    }

    const newOrUpdatedProject: Project = {
      id: initialProject?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim(),
      status: status,
      progress: Math.max(0, Math.min(100, progress)), // Ensure progress is between 0 and 100
      dueDate: dueDate || undefined, // Store as undefined if empty string
      archived: initialProject?.archived || false, // Preserve archived status or default to false
      subTasks: subTasks,
    };
    onSubmit(newOrUpdatedProject);
  }, [name, description, status, progress, dueDate, subTasks, initialProject, onSubmit]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setProgress(value);
    } else {
      setProgress(0); // Default to 0 if input is cleared or invalid
    }
  }, []);

  const handleAddSubTask = useCallback(() => {
    if (newSubTaskText.trim()) {
      const newSubTask: SubTask = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: newSubTaskText.trim(),
        completed: false,
      };
      setSubTasks((prev) => [...prev, newSubTask]);
      setNewSubTaskText('');
    }
  }, [newSubTaskText]);

  const handleToggleSubTaskComplete = useCallback((id: string) => {
    setSubTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const handleUpdateSubTaskText = useCallback((id: string, newText: string) => {
    setSubTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, text: newText } : task
      )
    );
  }, []);

  const handleDeleteSubTask = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this sub-task?')) {
      setSubTasks((prev) => prev.filter((task) => task.id !== id));
    }
  }, []);

  return (
    <Module title={initialProject ? 'Edit Project' : 'New Project'} icon={<FolderIcon />}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
        <div>
          <label htmlFor="projectName" className="block text-gray-300 text-sm font-bold mb-2">
            Project Name:
          </label>
          <input
            type="text"
            id="projectName"
            value={name}
            onChange={(e) => { setName(e.target.value); setValidationError(''); }}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
            placeholder="e.g., Learn React Native"
            required
            aria-required="true"
          />
          {validationError && (
            <p className="text-red-400 text-sm mt-1">{validationError}</p>
          )}
        </div>
        <div>
          <label htmlFor="projectDescription" className="block text-gray-300 text-sm font-bold mb-2">
            Description:
          </label>
          <textarea
            id="projectDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
            placeholder="Outline the steps or goals for this project."
          ></textarea>
        </div>
        <div>
          <label htmlFor="projectStatus" className="block text-gray-300 text-sm font-bold mb-2">
            Status:
          </label>
          <select
            id="projectStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-base"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label htmlFor="projectProgress" className="block text-gray-300 text-sm font-bold mb-2">
            Progress (%):
          </label>
          <input
            type="number"
            id="projectProgress"
            value={progress}
            onChange={handleProgressChange}
            min="0"
            max="100"
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-base"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Project progress percentage"
          />
        </div>
        <div>
          <label htmlFor="projectDueDate" className="block text-gray-300 text-sm font-bold mb-2">
            Due Date:
          </label>
          <input
            type="date"
            id="projectDueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-base"
            aria-label="Project due date"
          />
        </div>

        {/* Sub-tasks Section */}
        <div>
          <h3 className="block text-gray-300 text-sm font-bold mb-2">Sub-tasks:</h3>
          <div className="space-y-2 mb-4">
            {subTasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center">No sub-tasks added yet.</p>
            ) : (
              <ul>
                {subTasks.map((task) => (
                  <SubTaskItem
                    key={task.id}
                    subTask={task}
                    onToggleComplete={handleToggleSubTaskComplete}
                    onUpdateText={handleUpdateSubTaskText}
                    onDelete={handleDeleteSubTask}
                  />
                ))}
              </ul>
            )}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSubTaskText}
              onChange={(e) => setNewSubTaskText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission
                  handleAddSubTask();
                }
              }}
              className="flex-grow p-2 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-sm"
              placeholder="Add a new sub-task..."
              aria-label="Add new sub-task"
            />
            <button
              type="button"
              onClick={handleAddSubTask}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors duration-200"
              aria-label="Add sub-task"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700/50">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {initialProject ? 'Update Project' : 'Add Project'}
          </button>
        </div>
      </form>
    </Module>
  );
};


const ProjectsModule: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false); // New state to toggle archived view

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for comparison

  // Load projects from local storage on initial mount
  useEffect(() => {
    const storedProjects = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    }
  }, []);

  // Save projects to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const handleCreateNewProject = useCallback(() => {
    setEditingProject(null);
    setShowForm(true);
  }, []);

  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  }, []);

  const handleDeleteProject = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      console.log('ProjectsModule: Attempting to delete project with ID:', id);
      setProjects((prevProjects) => {
        console.log('ProjectsModule: Previous projects list:', prevProjects);
        const newList = prevProjects.filter((project) => String(project.id) !== String(id));
        console.log('ProjectsModule: New projects list after filter (should not contain deleted item):', newList);
        console.log('ProjectsModule: Calling setProjects with new list of length:', newList.length);
        return newList;
      });
    } else {
      console.log('ProjectsModule: Deletion cancelled.');
    }
  }, []);

  const handleToggleArchive = useCallback((id: string) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === id ? { ...project, archived: !project.archived } : project
      )
    );
  }, []);

  const handleSaveProject = useCallback((newOrUpdatedProject: Project) => {
    if (editingProject) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === newOrUpdatedProject.id ? newOrUpdatedProject : project
        )
      );
    } else {
      setProjects((prevProjects) => [...prevProjects, newOrUpdatedProject]);
    }
    setShowForm(false);
    setEditingProject(null);
  }, [editingProject]);

  const getStatusClasses = (status: ProjectStatus) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-500/20 text-gray-300';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-300';
      case 'On Hold':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'Completed':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const filteredProjects = projects.filter(project => project.archived === showArchived);

  // Sub-component for Module Header Content
  const ProjectsHeaderContent = (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setShowArchived(!showArchived)}
        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${
          showArchived
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-slate-700/50 hover:bg-slate-600/70 text-gray-300'
        }`}
        aria-label={showArchived ? "Show Archived Projects" : "Show Active Projects"}
      >
        {showArchived ? 'Archived' : 'Active'}
      </button>
    </div>
  );

  return (
    <Module title="Projects" icon={<FolderIcon />} headerContent={ProjectsHeaderContent}>
      {showForm ? (
        <ProjectForm
          initialProject={editingProject}
          onSubmit={handleSaveProject}
          onCancel={() => {
            setShowForm(false);
            setEditingProject(null);
          }}
        />
      ) : (
        <>
          {filteredProjects.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              {showArchived ? "No archived projects." : "No active projects currently. What's next on your plate?"}
            </p>
          ) : (
            <ul className="space-y-4">
              {filteredProjects.map((project) => {
                const isOverdue = project.dueDate && project.status !== 'Completed' && project.dueDate < today;
                const [showSubTasks, setShowSubTasks] = useState(false);
                const completedSubTasksCount = project.subTasks.filter(st => st.completed).length;

                return (
                  <li
                    key={project.id}
                    className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg p-4 transform transition-all duration-300 hover:scale-[1.01] hover:bg-slate-700/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-white pr-4">{project.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${getStatusClasses(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{project.description}</p>
                    )}
                    {project.dueDate && (
                      <p className={`text-sm mb-3 ${isOverdue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                        Due: {project.dueDate} {isOverdue && '(Overdue)'}
                      </p>
                    )}

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-400">Progress:</span>
                      <span className="text-sm text-gray-200">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${project.progress}%` }}
                        role="progressbar"
                        aria-valuenow={project.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Project progress is ${project.progress} percent`}
                      ></div>
                    </div>

                    {project.subTasks.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-700/50">
                        <button
                          onClick={() => setShowSubTasks(!showSubTasks)}
                          className="flex items-center justify-between w-full text-gray-300 hover:text-white transition-colors duration-200"
                          aria-expanded={showSubTasks}
                          aria-controls={`subtasks-${project.id}`}
                        >
                          <span className="font-medium text-sm">
                            Sub-tasks ({completedSubTasksCount}/{project.subTasks.length} Completed)
                          </span>
                          <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${showSubTasks ? 'rotate-180' : ''}`} />
                        </button>
                        {showSubTasks && (
                          <ul id={`subtasks-${project.id}`} className="mt-3 space-y-2">
                            {project.subTasks.map((subTask) => (
                              <li key={subTask.id} className="flex items-center">
                                <div
                                  className={`w-4 h-4 mr-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                    subTask.completed ? 'bg-green-500 border-green-500' : 'border-gray-500'
                                  }`}
                                >
                                  {subTask.completed && <CheckCircleIcon className="h-3 w-3 text-white" />}
                                </div>
                                <span className={`${subTask.completed ? 'line-through text-gray-500' : 'text-gray-300'} text-sm`}>
                                  {subTask.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-700/50">
                      <button
                        onClick={() => handleEditProject(project)}
                        className="text-blue-400 hover:text-blue-500 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50"
                        aria-label={`Edit project ${project.name}`}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(project.id)}
                        className={`transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50 ${project.archived ? 'text-green-400 hover:text-green-500' : 'text-yellow-400 hover:text-yellow-500'}`}
                        aria-label={project.archived ? `Unarchive project ${project.name}` : `Archive project ${project.name}`}
                      >
                        {project.archived ? <UnarchiveIcon /> : <ArchiveIcon />}
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)} // Direct delete button
                        className="text-red-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50"
                        aria-label={`Delete project ${project.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!showArchived && ( // Only show 'Create New Project' button if viewing active projects
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <button
                onClick={handleCreateNewProject}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-lg"
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" /> Create New Project
              </button>
            </div>
          )}
        </>
      )}
    </Module>
  );
};

export default ProjectsModule;
