import React, { useEffect, useState } from 'react';
import api from '../api';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Event {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string | null;
  location: string | null;
  isConfirmed: boolean;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  };

  const syncToCalendar = async (id: string) => {
    try {
      await api.post(`/events/${id}/calendar`);
      alert('Event successfully synced to Google Calendar!');
      fetchEvents();
    } catch (error) {
      console.error('Failed to sync to calendar', error);
      alert('Failed to sync to Google Calendar. Check console for details.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Upcoming Events</h1>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg w-full"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">
            Our AI will automatically detect calendar invites, flights, and meetings from your inbox.
          </p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {events.map((event) => (
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.01, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              key={event.id} 
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="bg-indigo-50/80 p-4 rounded-xl text-center min-w-[80px] shadow-inner">
                  <p className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                    {format(new Date(event.eventDate), 'MMM')}
                  </p>
                  <p className="text-3xl font-black text-indigo-900 mt-1">
                    {format(new Date(event.eventDate), 'd')}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-gray-500 text-sm font-medium">
                    {event.eventTime && (
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {event.eventTime}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                {event.isConfirmed ? (
                  <span className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm">
                    <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Added to Calendar
                  </span>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => syncToCalendar(event.id)}
                    className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                  >
                    <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Add to Calendar
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Events;
