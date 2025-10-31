import React, { useMemo } from 'react';
import { Habit } from '../../types';

interface HabitHistoryCalendarModalProps {
  habit: Habit;
  onClose: () => void;
}

const HabitHistoryCalendarModal: React.FC<HabitHistoryCalendarModalProps> = ({ habit, onClose }) => {
  const calendarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const months: { monthName: string; year: number; days: (Date | null)[] }[] = [];
    const completionSet = new Set(habit.completionHistory);

    for (let i = 3; i >= 0; i--) { // Go back 4 months (current + 3 past)
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
      const firstDay = date.getDay();

      const days: (Date | null)[] = Array(firstDay).fill(null);
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, date.getMonth(), day));
      }
      months.push({ monthName, year, days });
    }
    return { months, completionSet };
  }, [habit.completionHistory]);

  const getColorClass = (date: Date): string => {
    if (date > new Date()) return 'bg-slate-700/30'; // Future date
    const dateString = date.toISOString().slice(0, 10);
    if (calendarData.completionSet.has(dateString)) {
        return 'bg-green-500'; // Completed
    }
    return 'bg-slate-600/50'; // Not completed
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4" onClick={onClose}>
      <div
        className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="font-bold text-xl text-gray-200">History for "{habit.name}"</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-slate-700"
            aria-label="Close history view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
          <div className="flex justify-start space-x-2 mb-4 text-xs text-gray-400">
             <span>Less</span>
             <div className="w-4 h-4 rounded-sm bg-slate-600/50"></div>
             <div className="w-4 h-4 rounded-sm bg-green-500"></div>
             <span>More</span>
          </div>
          <div className="space-y-4">
            {calendarData.months.map(({ monthName, year, days }) => (
              <div key={`${monthName}-${year}`}>
                <h3 className="font-semibold text-gray-300 mb-2">{monthName} {year}</h3>
                <div className="grid grid-cols-7 gap-1.5">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayInitial, i) => (
                      <div key={i} className="text-xs text-center text-gray-400">{dayInitial}</div>
                  ))}
                  {days.map((day, index) =>
                    day ? (
                      <div
                        key={index}
                        className={`w-full aspect-square rounded-md ${getColorClass(day)}`}
                        title={day.toLocaleDateString()}
                      ></div>
                    ) : (
                      <div key={`blank-${index}`} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitHistoryCalendarModal;
