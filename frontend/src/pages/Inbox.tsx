
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Email {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  date: string;
  category?: string;
  priority?: string;
  status: string;
}

export default function Inbox() {
  const queryClient = useQueryClient();

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const { data: emails = [], isLoading, error } = useQuery({
    queryKey: ['emails'],
    queryFn: async () => {
      const res = await api.get('/emails');
      return res.data as Email[];
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/emails/sync');
      return res.data;
    },
    onSuccess: (data) => {
      if (data && data.message) alert(data.message);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });

  return (
    <div className="flex-1 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500">Your recent emails requiring attention</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          <span>Sync Gmail</span>
        </button>
      </header>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load emails. Please try syncing.</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Mail className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No emails yet</h3>
            <p className="text-gray-500 mt-1">Click Sync Gmail to fetch your latest messages.</p>
          </div>
        ) : (
          <motion.div 
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-gray-100"
          >
            {emails.map((email) => (
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.005, backgroundColor: 'rgba(249, 250, 251, 1)' }}
                key={email.id} 
                className="p-4 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900 truncate pr-4">{email.sender}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(email.date), 'MMM d, h:mm a')}
                  </span>
                </div>
                <h4 className="font-medium text-gray-800 mb-1 truncate">{email.subject}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{email.snippet}</p>
                
                <div className="mt-3 flex space-x-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                    Status: {email.status}
                  </span>
                  {email.category && (
                    <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md font-medium">
                      {email.category}
                    </span>
                  )}
                  {email.priority === 'High' && (
                    <span className="text-xs px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-md font-medium">
                      High Priority
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
