// Linter refresh
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, LogOut, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import Inbox from './Inbox';
import Tasks from './Tasks';
import Events from './Events';
import Bills from './Bills';
import Approvals from './Approvals';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'tasks' | 'events' | 'bills' | 'approvals'>('dashboard');
  const [stats, setStats] = useState({ emails: 0, tasks: 0, events: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('activeToken');
      if (token) {
        setIsAuthenticated(true);
      } else {
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAuthenticated) {
          const res = await api.get('/stats');
          setStats(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };

    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed', error);
    }
    
    // Remove active account from saved accounts
    const activeToken = localStorage.getItem('activeToken');
    const savedAccountsStr = localStorage.getItem('savedAccounts');
    
    if (activeToken && savedAccountsStr) {
      const savedAccounts = JSON.parse(savedAccountsStr);
      const activeAcc = savedAccounts.find((acc: any) => acc.token === activeToken);
      if (activeAcc) {
        const updatedAccounts = savedAccounts.filter((acc: any) => acc.email !== activeAcc.email);
        localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
        
        if (updatedAccounts.length > 0) {
          localStorage.setItem('activeToken', updatedAccounts[0].token);
        } else {
          localStorage.removeItem('activeToken');
        }
      }
    } else {
      localStorage.removeItem('activeToken');
    }

    setIsAuthenticated(false);
    navigate('/', { replace: true });
  };

  if (isAuthenticated === null) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Sidebar with Glassmorphism */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-64 bg-white/70 backdrop-blur-xl border-r border-gray-200/50 p-4 flex flex-col shadow-sm z-10"
      >
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8 tracking-tight">SmartMail</h2>
        <nav className="space-y-2 flex-1">
          {['dashboard', 'inbox', 'tasks', 'events', 'bills', 'approvals'].map((tab, idx) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab as any)}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === tab 
                  ? tab === 'approvals' 
                    ? 'bg-indigo-100/80 text-indigo-700 shadow-sm' 
                    : 'bg-purple-100/80 text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100/50'
              }`}
            >
              {tab === 'approvals' ? 'Auto-Replies' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </nav>
        
        <div className="pt-4 border-t border-gray-200/50 mt-auto flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
          >
            <Home className="w-5 h-5" />
            Go to Landing Page
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && (
              <div className="p-8 max-w-6xl mx-auto">
                <header className="mb-10 flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-2 text-lg">Welcome to your SmartMail assistant</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur border border-gray-200/50 shadow-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
                  </motion.button>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Synced Emails</h3>
                    <p className="text-5xl font-black text-indigo-600 mt-3">{stats.emails}</p>
                  </motion.div>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Pending Tasks</h3>
                    <p className="text-5xl font-black text-orange-500 mt-3">{stats.tasks}</p>
                  </motion.div>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Upcoming Events</h3>
                    <p className="text-5xl font-black text-emerald-500 mt-3">{stats.events}</p>
                  </motion.div>
                </div>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="bg-indigo-50/50 backdrop-blur-md border border-indigo-100/50 p-8 rounded-2xl shadow-sm"
                >
                  <h3 className="text-xl font-bold text-indigo-900 mb-3">How it works</h3>
                  <p className="text-indigo-700/80 leading-relaxed text-lg">
                    The SmartMail engine is running in the background. As emails arrive in your connected Gmail account, our Gemini AI reads them and automatically extracts actionable tasks, calendar events, and bills. 
                    <br /><br />
                    Use the sidebar to view your newly populated AI extractions!
                  </p>
                </motion.div>
              </div>
            )}
            {activeTab === 'inbox' && <Inbox />}
            {activeTab === 'tasks' && <Tasks />}
            {activeTab === 'events' && <Events />}
            {activeTab === 'bills' && <Bills />}
            {activeTab === 'approvals' && <Approvals />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
