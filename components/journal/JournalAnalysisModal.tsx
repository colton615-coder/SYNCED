import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { JournalEntry } from '../../types';
import { SparklesIcon } from '../common/Icons';

interface JournalAnalysisModalProps {
  onClose: () => void;
  entriesToAnalyze: JournalEntry[];
}

const JournalAnalysisModal: React.FC<JournalAnalysisModalProps> = ({ onClose, entriesToAnalyze }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateAnalysis = async () => {
      setIsAnalyzing(true);
      setError(null);

      const combinedText = entriesToAnalyze
        .map(entry => `Date: ${entry.date}\nTitle: ${entry.title || entry.prompt}\nEntry:\n${entry.fullText}\n\n---\n\n`)
        .join('');

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = "You are a thoughtful, high-level observer reviewing a series of journal entries. Your task is to identify recurring themes, emotional patterns, or common topics without giving direct advice. Summarize your findings in a few concise, insightful paragraphs. Frame your observations gently, using phrases like 'It seems that...' or 'A recurring theme appears to be...'. The goal is to help the user see their own patterns, not to be a therapist.";
        
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: `Here are the recent journal entries:\n\n${combinedText}` }] }],
            config: { systemInstruction },
        });

        let streamedAnalysis = '';
        for await (const chunk of responseStream) {
            streamedAnalysis += chunk.text;
            setAnalysis(streamedAnalysis);
        }

      } catch (err) {
        console.error("Error generating journal analysis:", err);
        setError("Sorry, I couldn't analyze the entries at this moment. Please try again later.");
      } finally {
        setIsAnalyzing(false);
      }
    };

    generateAnalysis();
  }, [entriesToAnalyze]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4" onClick={onClose}>
      <div
        className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="font-bold text-xl text-gray-200 flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2 text-purple-400" />
            AI-Powered Analysis
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-slate-700"
            aria-label="Close analysis"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
          {isAnalyzing && !analysis && (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <SparklesIcon className="h-12 w-12 text-purple-400 animate-pulse mb-4" />
                <p className="text-gray-300">Analyzing your recent entries...</p>
                <p className="text-gray-400 text-sm">This may take a moment.</p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400 p-4">
              <p>{error}</p>
            </div>
          )}

          {!error && (
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {analysis}
              {isAnalyzing && <span className="animate-pulse">|</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalAnalysisModal;
