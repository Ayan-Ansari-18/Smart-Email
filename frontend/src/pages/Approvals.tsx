import { useEffect, useState } from 'react';
import api from '../api';
import { Mail, XCircle, RefreshCw, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface DraftReply {
  id: string;
  emailId: string;
  suggestedText: string;
  feedback: string | null;
  status: string;
  createdAt: string;
  email: {
    sender: string;
    subject: string;
    snippet: string;
    date: string;
  };
}

export default function Approvals() {
  const [drafts, setDrafts] = useState<DraftReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<{ [key: string]: string }>({});
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const fetchDrafts = async () => {
    try {
      const res = await api.get('/drafts');
      setDrafts(res.data);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing({ ...processing, [id]: true });
    try {
      await api.post(`/drafts/${id}/approve`);
      // Remove from list
      setDrafts(drafts.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to send', error);
      alert('Failed to send email. Ensure you have granted Gmail send permissions.');
    } finally {
      setProcessing({ ...processing, [id]: false });
    }
  };

  const handleReject = async (id: string) => {
    setProcessing({ ...processing, [id]: true });
    try {
      await api.post(`/drafts/${id}/reject`);
      setDrafts(drafts.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to reject', error);
    } finally {
      setProcessing({ ...processing, [id]: false });
    }
  };

  const handleRegenerate = async (id: string) => {
    const fb = feedbacks[id];
    if (!fb?.trim()) return alert("Please provide feedback for the AI to rewrite the draft.");

    setProcessing({ ...processing, [id]: true });
    try {
      const res = await api.post(`/drafts/${id}/regenerate`, { feedback: fb });
      
      // Update draft in place
      setDrafts(drafts.map(d => d.id === id ? { ...d, suggestedText: res.data.suggestedText } : d));
      setFeedbacks({ ...feedbacks, [id]: '' });
    } catch (error) {
      console.error('Failed to regenerate', error);
    } finally {
      setProcessing({ ...processing, [id]: false });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Auto-Responder Approvals</h1>
        <p className="text-gray-500">Review AI-drafted replies, tweak them, and approve to send.</p>
      </header>

      {drafts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">All caught up!</p>
          <p>No pending auto-drafts await your approval.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {drafts.map(draft => (
            <motion.div 
              variants={itemVariants}
              key={draft.id} 
              className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col md:flex-row transition-shadow hover:shadow-md"
            >
              {/* Original Context */}
              <div className="md:w-1/3 bg-gray-50/80 p-6 border-r border-gray-100">
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">Original Email</div>
                <h3 className="font-semibold text-gray-900 mb-1">{draft.email.subject}</h3>
                <p className="text-sm text-gray-500 mb-4 font-mono truncate">{draft.email.sender}</p>
                <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 shadow-inner h-48 overflow-y-auto whitespace-pre-wrap">
                  {draft.email.snippet}
                </div>
              </div>

              {/* AI Draft & Actions */}
              <div className="md:w-2/3 p-6 flex flex-col">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center justify-between">
                  AI Suggested Reply
                  <span className="text-gray-400 font-medium normal-case">{format(new Date(draft.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                
                <div className="text-sm text-gray-800 bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 flex-1 whitespace-pre-wrap font-serif mb-6 shadow-inner">
                  {draft.suggestedText}
                </div>

                {/* Feedback Input */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Feedback for AI (Optional)</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="e.g. 'Make it more professional', 'Say I am OOO till Monday'"
                      className="flex-1 text-sm border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-4"
                      value={feedbacks[draft.id] || ''}
                      onChange={e => setFeedbacks({...feedbacks, [draft.id]: e.target.value})}
                    />
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRegenerate(draft.id)}
                      disabled={processing[draft.id]}
                      className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors"
                    >
                      {processing[draft.id] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      Regenerate
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-auto">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleReject(draft.id)}
                    disabled={processing[draft.id]}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Discard
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleApprove(draft.id)}
                    disabled={processing[draft.id]}
                    className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-colors disabled:opacity-50"
                  >
                    {processing[draft.id] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Approve & Send
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
