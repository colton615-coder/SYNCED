
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Module from '../common/Module';
import { AcademicCapIcon, BookOpenIcon, LinkIcon, PencilIcon, PlusCircleIcon, TrashIcon, VideoCameraIcon } from '../common/Icons';
import { EducationResource, EducationResourceStatus } from '../../types';
import EducationResourceForm from './EducationResourceForm';

const LOCAL_STORAGE_KEY = 'lifesyncd_education_resources';

const EducationModule: React.FC = () => {
  const [resources, setResources] = useState<EducationResource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<EducationResource | null>(null);
  const [filter, setFilter] = useState<EducationResourceStatus | 'All'>('All');

  // Load resources from local storage on initial mount
  useEffect(() => {
    const storedResources = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedResources) {
      setResources(JSON.parse(storedResources));
    }
  }, []);

  // Save resources to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resources));
  }, [resources]);

  const handleCreateNewResource = useCallback(() => {
    setEditingResource(null);
    setShowForm(true);
  }, []);

  const handleEditResource = useCallback((resource: EducationResource) => {
    setEditingResource(resource);
    setShowForm(true);
  }, []);

  const handleDeleteResource = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this learning resource?')) {
      setResources((prev) => prev.filter((res) => res.id !== id));
    }
  }, []);

  const handleSaveResource = useCallback((newOrUpdatedResource: EducationResource) => {
    if (editingResource) {
      setResources((prev) =>
        prev.map((res) =>
          res.id === newOrUpdatedResource.id ? newOrUpdatedResource : res
        )
      );
    } else {
      setResources((prev) => [...prev, newOrUpdatedResource]);
    }
    setShowForm(false);
    setEditingResource(null);
  }, [editingResource]);
  
  const filteredResources = useMemo(() => {
    if (filter === 'All') return resources;
    return resources.filter(res => res.status === filter);
  }, [resources, filter]);

  const getStatusClasses = (status: EducationResourceStatus) => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-500/20 text-gray-300';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-300';
      case 'Completed':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };
  
  const getTypeIcon = (type: EducationResource['type']) => {
    switch(type) {
      case 'Article': return <AcademicCapIcon />;
      case 'Video': return <VideoCameraIcon />;
      case 'Course': return <BookOpenIcon />;
      case 'Book': return <BookOpenIcon />;
      case 'Podcast': return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
      default: return <AcademicCapIcon />;
    }
  };

  if (showForm) {
    return (
      <EducationResourceForm
        initialResource={editingResource}
        onSubmit={handleSaveResource}
        onCancel={() => {
          setShowForm(false);
          setEditingResource(null);
        }}
      />
    );
  }

  const filterButtons: (EducationResourceStatus | 'All')[] = ['All', 'To Do', 'In Progress', 'Completed'];

  return (
    <Module title="Education Center" icon={<AcademicCapIcon />}>
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {filterButtons.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                filter === status ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-700/50 hover:bg-slate-600/70 text-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
      </div>

      {filteredResources.length === 0 ? (
        <p className="text-gray-400 text-center py-4">
          {resources.length === 0 ? "No learning resources added yet. What do you want to learn?" : "No resources match your current filter."}
        </p>
      ) : (
        <ul className="space-y-4">
          {filteredResources.map((resource) => (
             <li
             key={resource.id}
             className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg p-4 transform transition-all duration-300 hover:scale-[1.01] hover:bg-slate-700/50"
           >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                    <div className="text-purple-400">{getTypeIcon(resource.type)}</div>
                    <h3 className="font-bold text-lg text-white pr-4">{resource.title}</h3>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${getStatusClasses(resource.status)}`}>
                  {resource.status}
                </span>
              </div>
              {resource.description && (
                <p className="text-sm text-gray-300 mb-3 ml-9 line-clamp-2">{resource.description}</p>
              )}
              <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-700/50">
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-purple-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50"
                  aria-label={`Open resource ${resource.title}`}
                >
                  <LinkIcon />
                </a>
                <button
                  onClick={() => handleEditResource(resource)}
                  className="text-blue-400 hover:text-blue-500 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50"
                  aria-label={`Edit resource ${resource.title}`}
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => handleDeleteResource(resource.id)}
                  className="text-red-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-slate-700/50"
                  aria-label={`Delete resource ${resource.title}`}
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
          onClick={handleCreateNewResource}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-lg"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" /> Add New Resource
        </button>
      </div>
    </Module>
  );
};

export default EducationModule;