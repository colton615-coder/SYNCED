
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Module from '../common/Module';
import { AcademicCapIcon, BookOpenIcon, LinkIcon, PencilIcon, PlusCircleIcon, TrashIcon, VideoCameraIcon, SparkleIcon, ChevronDownIcon } from '../common/Icons'; // Import SparkleIcon and ChevronDownIcon
import { EducationResource, EducationResourceStatus } from '../../types';
import EducationResourceForm from './EducationResourceForm';
import { GoogleGenAI } from '@google/genai'; // Import GoogleGenAI

const LOCAL_STORAGE_KEY = 'lifesyncd_education_resources';

const EducationModule: React.FC = () => {
  const [resources, setResources] = useState<EducationResource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<EducationResource | null>(null);
  const [filter, setFilter] = useState<EducationResourceStatus | 'All'>('All');
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set()); // State for expanded AI summaries

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
  
  const handleSummarizeResource = useCallback(async (resourceId: string, resourceTitle: string) => {
    setResources(prev => prev.map(res => 
      res.id === resourceId ? { ...res, isSummarizing: true, summaryError: undefined } : res
    ));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Based on your general knowledge, provide a concise summary (around 80-120 words) of an educational resource titled '${resourceTitle}'. Focus on key concepts and takeaways. Do not attempt to browse the internet or access external content.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
      });

      const aiSummaryText = response.text;

      setResources(prev => prev.map(res => 
        res.id === resourceId ? { ...res, aiSummary: aiSummaryText, isSummarizing: false } : res
      ));
      setExpandedSummaries(prev => new Set(prev).add(resourceId)); // Expand the summary when generated

    } catch (error) {
      console.error('Error generating AI summary:', error);
      setResources(prev => prev.map(res => 
        res.id === resourceId ? { ...res, summaryError: 'Failed to generate summary.', isSummarizing: false } : res
      ));
    }
  }, []);

  const toggleSummaryExpansion = useCallback((resourceId: string) => {
    setExpandedSummaries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  }, []);
  
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

              {resource.summaryError && (
                <p className="text-red-400 text-sm mb-2 ml-9">{resource.summaryError}</p>
              )}

              {/* AI Summary Section */}
              {resource.aiSummary && (
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <button
                    onClick={() => toggleSummaryExpansion(resource.id)}
                    className="flex items-center justify-between w-full text-gray-300 hover:text-white transition-colors duration-200"
                    aria-expanded={expandedSummaries.has(resource.id)}
                    aria-controls={`ai-summary-${resource.id}`}
                  >
                    <span className="font-medium text-sm flex items-center">
                      <SparkleIcon className="h-4 w-4 mr-2 text-yellow-400" /> AI Summary
                    </span>
                    <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${expandedSummaries.has(resource.id) ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSummaries.has(resource.id) && (
                    <div id={`ai-summary-${resource.id}`} className="mt-3 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg text-sm text-gray-200 whitespace-pre-wrap">
                      {resource.aiSummary}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-700/50">
                {!resource.aiSummary && !resource.isSummarizing && (
                  <button
                    onClick={() => handleSummarizeResource(resource.id, resource.title)}
                    className="flex items-center bg-yellow-600/70 hover:bg-yellow-700/80 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors duration-200"
                    aria-label={`Summarize ${resource.title} with AI`}
                  >
                    <SparkleIcon className="h-4 w-4 mr-1" /> Summarize with AI
                  </button>
                )}
                {resource.isSummarizing && (
                  <span className="flex items-center text-yellow-400 text-sm px-3 py-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Summarizing...
                  </span>
                )}
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