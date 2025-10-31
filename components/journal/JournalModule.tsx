import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import Module from '../common/Module';
import { BookOpenIcon, SparklesIcon, PlusCircleIcon, ChevronLeftIcon } from '../common/Icons';
import { JournalEntry } from '../../types';
import { dailyJournalPrompts } from '../../data/journalPrompts';

const LOCAL_STORAGE_KEY_ENTRIES = 'lifesyncd_journal_entries';
const LOCAL_STORAGE_KEY_DISMISS = 'lifesyncd_journal_dismiss_date';

type JournalView = 'LIST' | 'ENTRY';

// --- Sub-component for the Entry Editor/Viewer ---
interface JournalEntryViewProps {
  entry: Partial<JournalEntry>;
  onSave: (updatedEntry: Partial<JournalEntry>) => void;
  onBack: () => void;
}

const JournalEntryView: React.FC<JournalEntryViewProps> = ({ entry, onSave, onBack }) => {
  const [fullText, setFullText] = useState(entry.fullText || '');
  const [title, setTitle] = useState(entry.title || '');
  const [currentReflection, setCurrentReflection] = useState(entry.aiReflection || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');

  const handleSave = () => {
    if (!fullText.trim()) {
      setValidationError('Your journal entry cannot be empty.');
      return;
    }
    const entryToSave = {
      ...entry,
      title: entry.prompt ? entry.title : title.trim(),
      fullText: fullText.trim(),
      snippet: fullText.trim().substring(0, 100) + (fullText.trim().length > 100 ? '...' : ''),
    };
    onSave(entryToSave);
  };

  const handleGetReflection = useCallback(async () => {
    if (!entry.id || isGenerating) return;

    setIsGenerating(true);
    setGenerationError(null);
    setCurrentReflection('');
    let streamedReflection = '';

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = "You are a supportive, empathetic journal assistant... Your primary function is to facilitate the user's own reflection. Keep your response concise, around 3-4 paragraphs. Start your response with a warm greeting.";

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: fullText }] }],
        config: { systemInstruction },
      });

      for await (const chunk of responseStream) {
        streamedReflection += chunk.text;
        setCurrentReflection(streamedReflection);
      }

      onSave({ ...entry, aiReflection: streamedReflection });
    } catch (error) {
      console.error("Error generating AI reflection:", error);
      setGenerationError("Sorry, I couldn't generate a reflection. Please try again later.");
      setCurrentReflection('');
    } finally {
      setIsGenerating(false);
    }
  }, [entry, fullText, isGenerating, onSave]);

  const moduleTitle = entry.prompt ? "Daily Prompt" : (entry.id ? (entry.title || `Entry from ${entry.date}`) : "New Freeform Entry");

  return (
    <Module title={moduleTitle} icon={<BookOpenIcon />}>
      <div className="flex flex-col h-full">
        <button onClick={onBack} className="flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors duration-200 self-start">
          <ChevronLeftIcon />
          <span className="ml-1">Back to Journal</span>
        </button>

        {entry.prompt && (
          <p className="text-gray-200 text-lg font-semibold mb-3 flex-shrink-0 leading-relaxed">
            "{entry.prompt}"
          </p>
        )}

        {!entry.prompt && !entry.id && (
           <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full p-3 mb-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-lg font-semibold"
          />
        )}

        <div className="flex-grow flex flex-col min-h-0">
          <textarea
            value={fullText}
            onChange={(e) => { setFullText(e.target.value); setValidationError(''); }}
            placeholder="Start writing your thoughts..."
            className="w-full h-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base custom-scrollbar resize-none min-h-[150px]"
            aria-label="Journal entry text input"
          />
          {validationError && (
            <p className="text-red-400 text-sm mt-2 flex-shrink-0">{validationError}</p>
          )}
        </div>

        <div className="mt-4 flex flex-col space-y-4">
           {/* Save button appears for new entries or when text is edited */}
           {( !entry.id || (entry.fullText !== fullText) || (entry.title !== title) ) && (
            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all"
            >
              {entry.id ? 'Update Entry' : 'Save Entry'}
            </button>
           )}

          {/* AI Reflection section */}
          {entry.id && (
            <>
              {(isGenerating || currentReflection) && (
                 <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
                    <div className="flex items-center text-purple-300 mb-2">
                        <SparklesIcon className={`h-5 w-5 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
                        <h4 className="font-semibold">AI Reflection</h4>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{currentReflection || "Reflecting on your thoughts..."}{isGenerating && <span className="animate-pulse">|</span>}</p>
                 </div>
              )}
              
              {!isGenerating && !currentReflection && (
                 <button
                    onClick={handleGetReflection}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Get AI Reflection
                  </button>
              )}

              {generationError && !isGenerating && (
                <p className="text-red-400 text-sm mt-2 text-center">{generationError}</p>
              )}
            </>
          )}
        </div>
      </div>
    </Module>
  );
};


// --- Main JournalModule Component ---
const JournalModule: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [view, setView] = useState<JournalView>('LIST');
  const [activeEntry, setActiveEntry] = useState<Partial<JournalEntry> | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const storedEntries = localStorage.getItem(LOCAL_STORAGE_KEY_ENTRIES);
    if (storedEntries) setJournalEntries(JSON.parse(storedEntries));
    const dismissedDate = localStorage.getItem(LOCAL_STORAGE_KEY_DISMISS);
    if (dismissedDate === today) setIsDismissed(true);
  }, [today]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ENTRIES, JSON.stringify(journalEntries));
  }, [journalEntries]);

  const dailyPrompt = useMemo(() => {
    const date = new Date();
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return dailyJournalPrompts[dayOfYear % dailyJournalPrompts.length];
  }, []);

  const hasAnsweredPromptToday = useMemo(() => 
    journalEntries.some(e => e.date === today && e.prompt), 
  [journalEntries, today]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(LOCAL_STORAGE_KEY_DISMISS, today);
  };

  const handleSaveOrUpdateEntry = (entryToSave: Partial<JournalEntry>) => {
    setJournalEntries(prev => {
      if (entryToSave.id) {
        return prev.map(e => e.id === entryToSave.id ? { ...e, ...entryToSave } as JournalEntry : e);
      } else {
        const newEntry: JournalEntry = {
          id: Date.now().toString(),
          date: today,
          ...entryToSave
        } as JournalEntry;
        return [...prev, newEntry];
      }
    });
    setView('LIST');
    setActiveEntry(null);
  };
  
  const handleStartPromptEntry = () => {
    setActiveEntry({ date: today, prompt: dailyPrompt });
    setView('ENTRY');
  };

  const handleStartFreeformEntry = () => {
    setActiveEntry({ date: today });
    setView('ENTRY');
  };
  
  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setView('ENTRY');
  };

  if (view === 'ENTRY' && activeEntry) {
    return (
      <JournalEntryView 
        entry={activeEntry}
        onSave={handleSaveOrUpdateEntry}
        onBack={() => { setView('LIST'); setActiveEntry(null); }}
      />
    );
  }

  // LIST VIEW
  return (
    <Module title="My Journal" icon={<BookOpenIcon />}>
      {/* Daily Prompt Card */}
      {!hasAnsweredPromptToday && !isDismissed && (
        <div className="bg-slate-700/40 backdrop-blur-md border border-slate-600/60 rounded-xl shadow-lg p-4 mb-6 relative">
          <button onClick={handleDismiss} className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-600/50">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <h3 className="font-semibold text-purple-300 mb-2">Daily Insight Prompt</h3>
          <p className="text-gray-200 mb-4">"{dailyPrompt}"</p>
          <button onClick={handleStartPromptEntry} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Write Your Response
          </button>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {journalEntries.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Your journal is empty. Write your first entry!</p>
        ) : (
          journalEntries.slice().reverse().map(entry => (
            <button key={entry.id} onClick={() => handleSelectEntry(entry)} className="w-full text-left block bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg p-4 transition-all duration-300 hover:scale-[1.01] hover:bg-slate-700/50">
              <p className="text-sm text-gray-400 mb-1">{new Date(entry.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <h4 className="font-bold text-lg text-white mb-2 truncate">{entry.title || entry.prompt}</h4>
              <p className="text-sm text-gray-300 line-clamp-2">{entry.snippet}</p>
            </button>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <button
          onClick={handleStartFreeformEntry}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-lg"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" /> Create New Freeform Entry
        </button>
      </div>
    </Module>
  );
};

export default JournalModule;
