
import React, { useState, useCallback } from 'react';
import Module from '../common/Module';
import { AcademicCapIcon } from '../common/Icons';
import { EducationResource, EducationResourceStatus } from '../../types';

interface EducationResourceFormProps {
  initialResource: EducationResource | null;
  onSubmit: (resource: EducationResource) => void;
  onCancel: () => void;
}

const EducationResourceForm: React.FC<EducationResourceFormProps> = ({
  initialResource,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialResource?.title || '');
  const [url, setUrl] = useState(initialResource?.url || '');
  const [description, setDescription] = useState(initialResource?.description || '');
  const [type, setType] = useState<EducationResource['type']>(initialResource?.type || 'Article');
  const [status, setStatus] = useState<EducationResourceStatus>(initialResource?.status || 'To Do');
  const [validationErrors, setValidationErrors] = useState<{ title?: string; url?: string }>({});

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const errors: { title?: string; url?: string } = {};
    if (!title.trim()) {
      errors.title = 'Resource title is required.';
    }
    if (!url.trim()) {
        errors.url = 'Resource URL is required.';
    } else {
        try {
            new URL(url); // Basic URL validation
        } catch (_) {
            errors.url = 'Please enter a valid URL (e.g., https://example.com).';
        }
    }


    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const newOrUpdatedResource: EducationResource = {
      id: initialResource?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      type,
      status,
    };
    onSubmit(newOrUpdatedResource);
  }, [title, url, description, type, status, initialResource, onSubmit]);

  const resourceTypes: EducationResource['type'][] = ['Article', 'Video', 'Course', 'Book', 'Podcast'];
  const statusOptions: EducationResourceStatus[] = ['To Do', 'In Progress', 'Completed'];

  return (
    <Module title={initialResource ? 'Edit Resource' : 'New Resource'} icon={<AcademicCapIcon />}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
        <div>
          <label htmlFor="resourceTitle" className="block text-gray-300 text-sm font-bold mb-2">
            Title:
          </label>
          <input
            type="text"
            id="resourceTitle"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setValidationErrors(prev => ({ ...prev, title: undefined })); }}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
            placeholder="e.g., Advanced React Hooks"
            required
            aria-required="true"
          />
          {validationErrors.title && <p className="text-red-400 text-sm mt-1">{validationErrors.title}</p>}
        </div>
        <div>
          <label htmlFor="resourceUrl" className="block text-gray-300 text-sm font-bold mb-2">
            URL:
          </label>
          <input
            type="url"
            id="resourceUrl"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setValidationErrors(prev => ({ ...prev, url: undefined })); }}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
            placeholder="https://example.com/resource"
            required
            aria-required="true"
          />
           {validationErrors.url && <p className="text-red-400 text-sm mt-1">{validationErrors.url}</p>}
        </div>
        <div>
          <label htmlFor="resourceDescription" className="block text-gray-300 text-sm font-bold mb-2">
            Description (Optional):
          </label>
          <textarea
            id="resourceDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
            placeholder="A brief summary of what this resource is about."
          ></textarea>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <label htmlFor="resourceType" className="block text-gray-300 text-sm font-bold mb-2">
                    Type:
                </label>
                <select
                    id="resourceType"
                    value={type}
                    onChange={(e) => setType(e.target.value as EducationResource['type'])}
                    className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-base"
                >
                    {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <label htmlFor="resourceStatus" className="block text-gray-300 text-sm font-bold mb-2">
                    Status:
                </label>
                <select
                    id="resourceStatus"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EducationResourceStatus)}
                    className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-base"
                >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
            {initialResource ? 'Update Resource' : 'Add Resource'}
          </button>
        </div>
      </form>
    </Module>
  );
};

export default EducationResourceForm;