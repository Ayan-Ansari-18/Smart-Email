import React, { useEffect, useState } from 'react';
import api from '../api';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  category: string | null;
  status: string;
  createdAt: string;
  messageId: string | null;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await api.patch(`/tasks/${id}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task status', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Action Items</h1>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg w-full"></div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            Sync your emails and our AI will automatically extract tasks for you!
          </p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {tasks.map((task) => (
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              key={task.id} 
              className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col transition-all duration-300 ${task.status === 'COMPLETED' ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  task.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                  task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {task.priority}
                </span>
                
                {task.category && (
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {task.category}
                  </span>
                )}
              </div>
              
              <h3 className={`text-lg font-bold text-gray-900 mb-2 ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {task.description}
                </p>
              )}
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-500">
                  {task.dueDate ? (
                    <span className={new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-rose-500 font-bold' : ''}>
                      Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span>No deadline</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {task.messageId && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(`https://mail.google.com/mail/u/0/#all/${task.messageId}`, '_blank')}
                      className="text-xs px-3 py-1.5 font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Open source email in Gmail"
                    >
                      Open Email
                    </motion.button>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: task.status === 'COMPLETED' ? 0 : 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`p-2 rounded-full transition-colors ${
                      task.status === 'COMPLETED' 
                        ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
                    }`}
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Tasks;
