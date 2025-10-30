
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Module from '../common/Module';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../common/Icons';
import { CalendarEvent } from '../../types';
import CalendarEventModal from './CalendarEventModal';

const LOCAL_STORAGE_KEY_CALENDAR = 'lifesyncd_calendar_events';

const CalendarModule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Load events from local storage on mount
  useEffect(() => {
    const storedEvents = localStorage.getItem(LOCAL_STORAGE_KEY_CALENDAR);
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }
  }, []);

  // Save events to local storage when they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_CALENDAR, JSON.stringify(events));
  }, [events]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for upcoming event notifications every minute
  useEffect(() => {
    const checkNotifications = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const now = new Date();
      let changed = false;
      const updatedEvents = events.map(event => {
        if (event.reminderMinutes && !event.notificationSent) {
          const eventTime = new Date(`${event.date}T${event.time}`);
          const reminderTime = new Date(eventTime.getTime() - event.reminderMinutes * 60000);

          if (now >= reminderTime && now < eventTime) {
            new Notification('Upcoming Event Reminder', {
              body: `${event.title} at ${event.time}`,
              // You can add an icon here, e.g., icon: '/favicon.ico'
            });
            changed = true;
            return { ...event, notificationSent: true };
          }
        }
        return event;
      });

      if (changed) {
        setEvents(updatedEvents);
      }
    };

    const intervalId = setInterval(checkNotifications, 60000); // Check every minute
    checkNotifications(); // Also check immediately on load/change

    return () => clearInterval(intervalId);
  }, [events]);


  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
  };

  const handleAddEvent = useCallback((title: string, time: string, reminderMinutes?: number) => {
    if (!selectedDate) return;
    const newEvent: CalendarEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: selectedDate.toISOString().slice(0, 10), // YYYY-MM-DD
      time,
      title,
      reminderMinutes,
      notificationSent: false, // Initialize as not sent
    };
    setEvents(prev => [...prev, newEvent]);
  }, [selectedDate]);

  const handleDeleteEvent = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
        setEvents(prev => prev.filter(event => event.id !== id));
    }
  }, []);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const { month, year, firstDay, daysInMonth, eventsByDate } = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDay = new Date(year, month, 1).getDay(); // Sunday - 0, ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Group events by date for quick lookup
    const eventsByDate = events.reduce((acc, event) => {
      (acc[event.date] = acc[event.date] || []).push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);

    return { month, year, firstDay, daysInMonth, eventsByDate };
  }, [currentDate, events]);

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Module title="Calendar" icon={<CalendarIcon />}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Previous month">
              <ChevronLeftIcon />
            </button>
            <h3 className="font-bold text-lg text-white">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Next month">
              <ChevronRightIcon />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm flex-grow">
            {weekdays.map(day => (
              <div key={day} className="font-semibold text-gray-400 py-1">{day}</div>
            ))}
            {blanks.map(b => (
              <div key={`blank-${b}`} className="border border-transparent"></div>
            ))}
            {days.map(day => {
              const today = new Date();
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dateString = new Date(year, month, day).toISOString().slice(0, 10);
              const hasEvents = eventsByDate[dateString]?.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative p-1 rounded-lg cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center aspect-square
                    ${isToday ? 'bg-purple-600 text-white font-bold' : 'hover:bg-slate-700/50 text-gray-200'}
                  `}
                >
                  <span>{day}</span>
                  {hasEvents && (
                    <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-purple-400'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Module>

      {selectedDate && (
        <CalendarEventModal
          selectedDate={selectedDate}
          eventsForDate={eventsByDate[selectedDate.toISOString().slice(0, 10)] || []}
          onClose={handleCloseModal}
          onAddEvent={handleAddEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}
    </>
  );
};

export default CalendarModule;