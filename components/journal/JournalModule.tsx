
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Module from '../common/Module';
import { BookOpenIcon } from '../common/Icons';
import { JournalEntry } from '../../types';
import { dailyJournalPrompts } from '../../data/journalPrompts';
import { GoogleGenAI } from '@google/genai'; // Import GoogleGenAI

const LOCAL_STORAGE_KEY_ENTRIES = 'lifesyncd_journal_entries';
const LOCAL_STORAGE_KEY_DISMISS = 'lifesyncd_journal_dismiss_date';

const JournalModule: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [entryText, setEntryText] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isLoadingAIResponse, setIsLoadingAIResponse] = useState(false); // New state for AI loading
  const [aiResponseError, setAiResponseError] = useState<string | null>(null); // New state for AI error

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

  const startAITherapySession = useCallback(async (fullText: string, entryId: string) => {
    setIsLoadingAIResponse(true);
    setAiResponseError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are an empathetic and non-judgmental AI therapist. Read the following journal entry and provide a supportive, reflective, and constructive response. Focus on active listening, validation, and gently encouraging self-reflection. Do not give direct advice or medical diagnoses. Keep your response concise, around 100-150 words.

User's journal entry:
${fullText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Using pro for more nuanced responses
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
        }
      });

      const aiResponseText = response.text;

      setJournalEntries(prevEntries => prevEntries.map(entry =>
        entry.id === entryId ? { ...entry, aiResponse: aiResponseText } : entry
      ));

    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiResponseError('Failed to get AI response. Please try again later.');
    } finally {
      setIsLoadingAIResponse(false);
    }
  }, []);


  const handleSaveEntry = useCallback(async () => {
    if (!entryText.trim()) {
      setValidationError('Your journal entry cannot be empty.');
      return;
    }
    setValidationError('');

    const newEntryId = Date.now().toString(); // Generate ID upfront
    const newEntry: JournalEntry = {
      id: newEntryId,
      date: today,
      prompt: dailyPrompt,
      fullText: entryText.trim(),
      snippet: entryText.trim().substring(0, 100) + (entryText.trim().length > 100 ? '...' : ''),
      aiResponse: undefined, // Initialize as undefined, will be filled by AI
    };
    setJournalEntries((prevEntries) => [...prevEntries, newEntry]);
    setEntryText('');
    
    // Start AI session in the background
    startAITherapySession(newEntry.fullText, newEntryId);

  }, [entryText, today, dailyPrompt, startAITherapySession]);

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
             <p className="text-gray-300 italic text-base">"{entryForToday.fullText}"</p> {/* Display full text */}
             <p className="text-purple-300 text-xs mt-2">From prompt: "{entryForToday.prompt.substring(0, Math.min(entryForToday.prompt.length, 50))}..."</p>
          </div>

          {isLoadingAIResponse && (
            <div className="mt-4 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-center text-gray-400 flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI Therapist is thinking...
            </div>
          )}

          {aiResponseError && (
            <p className="text-red-400 text-sm mt-2">{aiResponseError}</p>
          )}

          {entryForToday.aiResponse && (
            <div className="mt-4 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
              <h4 className="font-semibold text-purple-300 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 0A9 9 0 0110.5 20.25h.5m-9.007-11.25H4.5m0 0A8.96 8.96 0 0110.5 4.5h.5M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                AI Therapist's Reflection:
              </h4>
              <p className="text-gray-200 italic text-base whitespace-pre-wrap">{entryForToday.aiResponse}</p>
            </div>
          )}
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