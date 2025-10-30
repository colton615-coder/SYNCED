
import React, { useState, useEffect } from 'react';
import Module from '../common/Module';
import { Task, Priority } from '../../types';
import { CheckCircleIcon, PencilIcon, TrashIcon } from '../common/Icons'; // Import TrashIcon

const LOCAL_STORAGE_KEY = 'lifesyncd_tasks'; // Define local storage key

const TasksModule: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');

  // Load tasks from local storage on initial mount
  useEffect(() => {
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  // Save tasks to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const handleCreateNewTask = () => {
    setEditingTask(null);
    setTaskText('');
    setTaskPriority('medium');
    setShowForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskText(task.text);
    setTaskPriority(task.priority);
    setShowForm(true);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      console.log('TasksModule: Attempting to delete task with ID:', id);
      setTasks((prevTasks) => {
        console.log('TasksModule: Previous tasks list:', prevTasks);
        const newList = prevTasks.filter((task) => String(task.id) !== String(id));
        console.log('TasksModule: New tasks list after filter (should not contain deleted item):', newList);
        console.log('TasksModule: Calling setTasks with new list of length:', newList.length);
        return newList;
      });
    } else {
      console.log('TasksModule: Deletion cancelled.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    if (editingTask) {
      setTasks(
        tasks.map((task) =>
          task.id === editingTask.id
            ? { ...task, text: taskText.trim(), priority: taskPriority }
            : task
        )
      );
    } else {
      const newTask: Task = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More robust unique ID
        text: taskText.trim(),
        completed: false,
        priority: taskPriority,
      };
      setTasks([...tasks, newTask]);
    }

    setShowForm(false);
    setEditingTask(null);
    setTaskText('');
    setTaskPriority('medium');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTask(null);
    setTaskText('');
    setTaskPriority('medium');
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  if (showForm) {
    return (
      <Module title={editingTask ? 'Edit Task' : 'New Task'} icon={<CheckCircleIcon />}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="taskText" className="block text-gray-300 text-sm font-bold mb-2">
              Task Description:
            </label>
            <input
              type="text"
              id="taskText"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100"
              placeholder="What do you need to do?"
              required
            />
          </div>
          <div>
            <label htmlFor="taskPriority" className="block text-gray-300 text-sm font-bold mb-2">
              Priority:
            </label>
            <select
              id="taskPriority"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as Priority)}
              className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
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
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {editingTask ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </Module>
    );
  }

  return (
    <Module title="Tasks" icon={<CheckCircleIcon />}>
      {tasks.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No tasks to complete. Enjoy your free time!</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center group bg-slate-700/30 p-3 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
              <div
                onClick={() => toggleTask(task.id)}
                className={`w-5 h-5 mr-3 rounded-full border-2 flex-shrink-0 cursor-pointer flex items-center justify-center ${
                  task.completed ? 'bg-green-500 border-green-500' : 'border-gray-500 group-hover:border-green-500'
                }`}
              >
                {task.completed && <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 overflow-hidden">
                <span className={`block ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {task.text}
                </span>
                <span className={`block text-xs mt-0.5 ${getPriorityColor(task.priority)}`}>
                  Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>
              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button
                  onClick={() => handleEditTask(task)}
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600"
                  aria-label={`Edit task ${task.text}`}
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)} // Direct delete button
                  className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600"
                  aria-label={`Delete task ${task.text}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <button
          onClick={handleCreateNewTask}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Task
        </button>
      </div>
    </Module>
  );
};

export default TasksModule;
