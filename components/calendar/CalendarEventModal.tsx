
import React, { useState } from 'react';
import { CalendarEvent } from '../../types';
import { TrashIcon, PlusCircleIcon } from '../common/Icons';

interface CalendarEventModalProps {
  selectedDate: Date;
  eventsForDate: CalendarEvent[];
  onClose: () => void;
  onAddEvent: (title: string, time: string, reminderMinutes?: number) => void;
  onDeleteEvent: (id: string) => void;
}

const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  selectedDate,
  eventsForDate,
  onClose,
  onAddEvent,
  onDeleteEvent,
}) => {
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('12:00');
  const [reminder, setReminder] = useState<string>('15'); // Default to 15 mins
  const [validationError, setValidationError] = useState('');

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      setValidationError('Event title cannot be empty.');
      return;
    }
    const reminderValue = reminder === 'none' ? undefined : parseInt(reminder, 10);
    onAddEvent(newEventTitle, newEventTime, reminderValue);
    setNewEventTitle('');
    setNewEventTime('12:00');
    setReminder('15'); // Reset to default
    setValidationError('');
  };

  const sortedEvents = [...eventsForDate].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4" onClick={onClose}>
      <div
        className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col w-full max-w-lg max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="font-bold text-xl text-gray-200">
            Agenda for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-slate-700"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
          {sortedEvents.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No events scheduled for this day.</p>
          ) : (
            <ul className="space-y-3">
              {sortedEvents.map((event) => (
                <li key={event.id} className="flex items-center group bg-slate-700/30 p-3 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                  <span className="w-20 font-medium text-purple-400">{event.time}</span>
                  <span className="flex-1 text-gray-200">{event.title}</span>
                  <button
                    onClick={() => onDeleteEvent(event.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600 ml-4"
                    aria-label={`Delete event ${event.title}`}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="p-4 border-t border-slate-700/50">
          <h3 className="font-semibold text-lg text-gray-200 mb-3">Add New Event</h3>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-shrink-0">
                <label htmlFor="eventTime" className="sr-only">Event Time</label>
                <input
                  id="eventTime"
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full sm:w-auto p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-base"
                  aria-label="Event time"
                  required
                />
              </div>
              <div className="flex-grow">
                <label htmlFor="eventTitle" className="sr-only">Event Title</label>
                <input
                  id="eventTitle"
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => { setNewEventTitle(e.target.value); setValidationError(''); }}
                  placeholder="Event title"
                  className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
                  aria-label="Event title"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="eventReminder" className="block text-gray-300 text-sm font-bold mb-2">
                Reminder
              </label>
              <select
                id="eventReminder"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-base"
              >
                <option value="none">No reminder</option>
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
              </select>
            </div>
            {validationError && (
              <p className="text-red-400 text-sm mt-1">{validationError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-lg transition-colors duration-200 flex items-center justify-center text-base"
              aria-label="Add event"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Event
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default CalendarEventModal;