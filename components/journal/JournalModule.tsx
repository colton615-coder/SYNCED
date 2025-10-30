
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Module from '../common/Module';
import { BookOpenIcon } from '../common/Icons';
import { JournalEntry } from '../../types';
import { dailyJournalPrompts } from '../../data/journalPrompts';

const LOCAL_STORAGE_KEY_ENTRIES = 'lifesyncd_journal_entries';
const LOCAL_STORAGE_KEY_DISMISS = 'lifesyncd_journal_dismiss_date';

const JournalModule: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [entryText, setEntryText] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [validationError, setValidationError] = useState('');

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Load entries and dismissal state from local storage on initial mount
  useEffect(() => {
    const storedEntries = localStorage.getItem(LOCAL_STORAGE_KEY_ENTRIES);
    if (storedEntries) {
      setJournalEntries(JSON.parse(storedEntries));
    }
    const dismissedDate = localStorage.getItem(LOCAL_STORAGE_KEY_DISMISS);
    if (dismissedDate === today) {
      setIsDismissed(true);
    }
  }, [today]);

  // Save entries to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ENTRIES, JSON.stringify(journalEntries));
  }, [journalEntries]);

  const entryForToday = useMemo(() => {
    return journalEntries.find(entry => entry.date === today);
  }, [journalEntries, today]);

  const dailyPrompt = useMemo(() => {
    const date = new Date();
    // Simple way to get a deterministic index for the day
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const randomIndex = dayOfYear % dailyJournalPrompts.length;
    return dailyJournalPrompts[randomIndex];
  }, [today]); // Reruns only when the day changes

  const handleSaveEntry = useCallback(() => {
    if (!entryText.trim()) {
      setValidationError('Your journal entry cannot be empty.');
      return;
    }
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: today,
      prompt: dailyPrompt,
      fullText: entryText.trim(),
      snippet: entryText.trim().substring(0, 100) + (entryText.trim().length > 100 ? '...' : ''),
    };
    setJournalEntries((prevEntries) => [...prevEntries, newEntry]);
    setEntryText('');
    setValidationError('');
  }, [entryText, today, dailyPrompt]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(LOCAL_STORAGE_KEY_DISMISS, today);
  };
  
  const headerContent = (
    <button
      onClick={handleDismiss}
      className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-slate-700"
      aria-label="Dismiss daily prompt"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  return (
    <Module 
      title="Daily Insight Prompt" 
      icon={<BookOpenIcon />} 
      headerContent={!entryForToday && !isDismissed ? headerContent : undefined}
    >
      {entryForToday ? (
        <div>
          <h3 className="font-semibold text-green-400 mb-2 text-center">Today's entry saved!</h3>
          <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600/50">
             <p className="text-gray-300 italic text-base">"{entryForToday.snippet}"</p>
             <p className="text-purple-300 text-xs mt-2">From prompt: "{entryForToday.prompt.substring(0, 50)}..."</p>
          </div>
        </div>
      ) : isDismissed ? (
        <p className="text-gray-400 text-center py-4">Prompt for today dismissed. See you tomorrow!</p>
      ) : (
        <div className="flex flex-col h-full">
            <p className="text-gray-200 text-lg font-semibold mb-3 flex-shrink-0 leading-relaxed">
                "{dailyPrompt}"
            </p>
            <div className="flex-grow flex flex-col min-h-0">
                <textarea
                    value={entryText}
                    onChange={(e) => { setEntryText(e.target.value); setValidationError(''); }}
                    placeholder="Start writing your thoughts..."
                    className="w-full h-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base custom-scrollbar resize-none min-h-[120px]"
                    aria-label="Journal entry text input"
                ></textarea>
                 {validationError && (
                    <p className="text-red-400 text-sm mt-2 flex-shrink-0">{validationError}</p>
                )}
            </div>
            <button
                onClick={handleSaveEntry}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-lg mt-4"
            >
                Save Entry
            </button>
        </div>
      )}
    </Module>
  );
};

export default JournalModule;
