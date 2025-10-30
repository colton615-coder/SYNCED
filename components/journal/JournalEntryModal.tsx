
import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenIcon } from '../common/Icons';
import { dailyJournalPrompts } from '../../data/journalPrompts';

interface JournalEntryModalProps {
  onClose: () => void;
  onSaveEntry: (prompt: string, fullText: string) => void;
}

const JournalEntryModal: React.FC<JournalEntryModalProps> = ({ onClose, onSaveEntry }) => {
  const [entryText, setEntryText] = useState('');
  const [validationError, setValidationError] = useState('');

  const randomPrompt = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * dailyJournalPrompts.length);
    return dailyJournalPrompts[randomIndex];
  }, []); // Only generate a new random prompt once per modal instance

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryText.trim()) {
      setValidationError('Your journal entry cannot be empty.');
      return;
    }
    setValidationError('');
    onSaveEntry(randomPrompt, entryText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
      <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl h-full max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <h2 className="font-bold text-xl text-gray-200 flex items-center">
            <BookOpenIcon className="h-6 w-6 mr-2 text-purple-400" /> Daily Insight Prompt
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-slate-700"
            aria-label="Close journal entry"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow p-4 overflow-hidden">
          <p className="text-gray-200 text-xl font-semibold mb-4 flex-shrink-0 leading-relaxed">
            "{randomPrompt}"
          </p>
          <div className="flex-grow flex flex-col min-h-0"> {/* Ensure this div can grow and scroll */}
            <label htmlFor="journalEntryText" className="sr-only">Your entry</label>
            <textarea
              id="journalEntryText"
              value={entryText}
              onChange={(e) => { setEntryText(e.target.value); setValidationError(''); }}
              placeholder="Start writing your thoughts and insights here..."
              className="w-full h-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base custom-scrollbar resize-none"
              aria-label="Journal entry text input"
              required
            ></textarea>
            {validationError && (
              <p className="text-red-400 text-sm mt-2 flex-shrink-0">{validationError}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700/50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalEntryModal;
