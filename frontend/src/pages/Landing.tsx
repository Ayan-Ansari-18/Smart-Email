import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, CreditCard, ArrowRight, Zap, Shield, Mail, FileText, Bell, ChevronDown, LogOut, User } from 'lucide-react';

// Floating animated background blobs
const BackgroundBlobs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div 
      animate={{ 
        x: [0, 100, 0], 
        y: [0, 50, 0],
        scale: [1, 1.2, 1] 
      }}
      transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
      className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-300/20 blur-3xl"
    />
    <motion.div 
      animate={{ 
        x: [0, -80, 0], 
        y: [0, 120, 0],
        scale: [1, 1.5, 1] 
      }}
      transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
      className="absolute top-[20%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-indigo-300/20 blur-3xl"
    />
    <motion.div 
      animate={{ 
        x: [0, 50, 0], 
        y: [0, -100, 0],
        scale: [1, 1.1, 1] 
      }}
      transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
      className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-200/20 blur-3xl"
    />
  </div>
);

// Floating icons for parallax effect
const FloatingIcons = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -250]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -100]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
      <motion.div style={{ y: y1 }} className="absolute top-[30%] left-[10%] text-indigo-200 opacity-50">
        <Mail className="w-16 h-16" />
      </motion.div>
      <motion.div style={{ y: y2 }} className="absolute top-[60%] right-[12%] text-purple-200 opacity-50">
        <Calendar className="w-20 h-20" />
      </motion.div>
      <motion.div style={{ y: y3 }} className="absolute top-[20%] right-[15%] text-blue-200 opacity-50">
        <FileText className="w-12 h-12" />
      </motion.div>
    </div>
  );
};

// Interactive Demo Component
const InteractiveDemo = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto max-w-4xl mt-20">
      <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-2xl p-6 relative overflow-hidden">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-[350px]">
          {/* Left Side: Mock Email */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-6 w-3/4 bg-gray-800 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/6 bg-gray-100 rounded" />
              <motion.div 
                animate={{ backgroundColor: step >= 1 ? '#FEF3C7' : '#F3F4F6' }}
                className="h-4 w-1/2 bg-gray-100 rounded mt-4"
              />
            </div>

            {/* AI Scanner Effect */}
            <AnimatePresence>
              {step === 1 && (
                <motion.div
                  initial={{ top: '-10%' }}
                  animate={{ top: '110%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] z-10"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Right Side: Extraction Result */}
          <div className="h-full flex flex-col justify-center items-center relative">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div 
                  key="waiting"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-gray-400 flex flex-col items-center"
                >
                  <Mail className="w-12 h-12 mb-3 opacity-50" />
                  <p>Waiting for new email...</p>
                </motion.div>
              )}
              {step === 1 && (
                <motion.div 
                  key="analyzing"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-indigo-500 flex flex-col items-center"
                >
                  <Zap className="w-12 h-12 mb-3 animate-pulse" />
                  <p className="font-medium">AI Analyzing Content...</p>
                </motion.div>
              )}
              {step >= 2 && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="w-full bg-white rounded-xl shadow-lg border border-indigo-100 p-5 transform hover:scale-105 transition-transform cursor-default"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                      Task Extracted
                    </span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Submit Project Proposal</h4>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                    Due: Tomorrow, 5:00 PM
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Bell className="w-4 h-4 mr-2 text-orange-500" />
                    Reminder set
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function Landing() {
  const navigate = useNavigate();
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load accounts from localStorage
    const loadAccounts = () => {
      const accountsStr = localStorage.getItem('savedAccounts');
      if (accountsStr) {
        let accounts = JSON.parse(accountsStr);
        // Filter out any corrupted accounts from previous bugs
        accounts = accounts.filter((acc: any) => acc && acc.email);
        localStorage.setItem('savedAccounts', JSON.stringify(accounts));
        
        setSavedAccounts(accounts);
        
        const activeToken = localStorage.getItem('activeToken');
        if (activeToken) {
          const active = accounts.find((acc: any) => acc.token === activeToken);
          setActiveAccount(active || accounts[0]);
          if (!active && accounts.length > 0) {
             localStorage.setItem('activeToken', accounts[0].token);
          }
        } else if (accounts.length > 0) {
          setActiveAccount(accounts[0]);
          localStorage.setItem('activeToken', accounts[0].token);
        }
      }
    };
    loadAccounts();
    
    // Click outside handler for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchAccount = (account: any) => {
    localStorage.setItem('activeToken', account.token);
    setActiveAccount(account);
    setDropdownOpen(false);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAccount) return;
    
    // Remove active account from saved
    const updatedAccounts = savedAccounts.filter((acc: any) => acc.email !== activeAccount.email);
    localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
    setSavedAccounts(updatedAccounts);
    
    if (updatedAccounts.length > 0) {
      // Switch to next available
      localStorage.setItem('activeToken', updatedAccounts[0].token);
      setActiveAccount(updatedAccounts[0]);
    } else {
      // Complete logout
      localStorage.removeItem('activeToken');
      setActiveAccount(null);
    }
    setDropdownOpen(false);
  };

  const containerVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden relative">
      <BackgroundBlobs />
      <FloatingIcons />

      {/* Navigation */}
      <nav className="fixed w-full bg-white/70 backdrop-blur-xl z-50 border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">SmartMail</span>
            </div>
            <div>
              {activeAccount ? (
                <div className="flex items-center gap-4">
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      {activeAccount.picture ? (
                        <img src={activeAccount.picture} alt="Profile" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><User className="w-4 h-4" /></div>
                      )}
                      <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">{activeAccount.email}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50"
                        >
                          <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Switch Account</p>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {savedAccounts.map((acc, idx) => (
                              <button
                                key={idx}
                                onClick={() => switchAccount(acc)}
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${activeAccount.email === acc.email ? 'bg-indigo-50/50' : ''}`}
                              >
                                {acc.picture ? (
                                  <img src={acc.picture} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                                ) : (
                                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><User className="w-5 h-5" /></div>
                                )}
                                <div className="overflow-hidden">
                                  <p className="text-sm font-medium text-gray-900 truncate">{acc.name || 'User'}</p>
                                  <p className="text-xs text-gray-500 truncate">{acc.email}</p>
                                </div>
                                {activeAccount.email === acc.email && (
                                  <CheckCircle className="w-4 h-4 text-indigo-600 ml-auto flex-shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-gray-100 p-2">
                            <button
                              onClick={() => navigate('/login')}
                              className="w-full text-left px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              + Add another account
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Dashboard
                  </motion.button>
                  <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium text-sm" title="Logout">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  className="bg-gray-900 text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Sign In
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden z-10">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl sm:text-8xl font-extrabold tracking-tight mb-6 text-gray-900 leading-tight">
              Your Inbox, <br className="hidden sm:block" /> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">
                Automatically Organized.
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-10 leading-relaxed">
              SmartMail uses state-of-the-art AI to instantly extract tasks, schedule calendar events, and track your bills directly from your emails.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(activeAccount ? '/dashboard' : '/login')}
                className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-full transition-all"
              >
                {activeAccount ? 'Go to Dashboard' : 'Get Started for Free'} <ArrowRight className="ml-2 w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Interactive Mockup */}
          <InteractiveDemo />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white relative z-10 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-gray-900"
            >
              Everything you need to stay on top.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-xl text-gray-500"
            >
              Stop manually entering data. Let AI do the heavy lifting.
            </motion.p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -10, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)" }}
              className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Task Extraction</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Action items, deadlines, and assignments are automatically pulled from long email threads so you never miss a beat.</p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -10, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)" }}
              className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Calendar Sync</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Meetings, flights, and appointments are effortlessly detected and pushed directly to your Google Calendar.</p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -10, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)" }}
              className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Bill Tracking</h3>
              <p className="text-gray-600 leading-relaxed text-lg">Never miss a payment. Invoices and subscription receipts are tracked with automatic pre-deadline reminders.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Security Section */}
      <div className="relative py-32 bg-gray-900 text-white overflow-hidden z-10">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
          className="absolute -top-[50%] -right-[20%] w-[100vw] h-[100vw] rounded-full bg-indigo-900/20 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <Shield className="w-20 h-20 mx-auto mb-8 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Secure & Private by Design</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-xl mb-12 leading-relaxed">
            Your emails are analyzed securely using enterprise-grade AI APIs. We only extract what's necessary and absolutely never train models on your personal inbox data.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-base text-gray-300 font-medium">
            <motion.span whileHover={{ scale: 1.1 }} className="flex items-center gap-2 bg-gray-800 px-6 py-3 rounded-full border border-gray-700">
              <CheckCircle className="w-5 h-5 text-emerald-400" /> OAuth 2.0 Auth
            </motion.span>
            <motion.span whileHover={{ scale: 1.1 }} className="flex items-center gap-2 bg-gray-800 px-6 py-3 rounded-full border border-gray-700">
              <CheckCircle className="w-5 h-5 text-emerald-400" /> API Encryption
            </motion.span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <div className="flex justify-center items-center gap-2 mb-4 hover:text-indigo-600 transition-colors cursor-pointer">
            <Mail className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-gray-900 tracking-tight text-xl">SmartMail</span>
          </div>
          <p>© 2026 SmartMail Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
