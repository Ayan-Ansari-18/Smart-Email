import React from 'react';
import { Mail, CheckCircle, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const handleGoogleLogin = () => {
    // Redirect to backend OAuth route
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 relative overflow-hidden">
      
      {/* Decorative blurred background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-300/20 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center z-10">
        
        {/* Left Side: Marketing / Value Prop */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:flex flex-col space-y-8"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">SmartMail</h1>
          </div>
          <p className="text-2xl text-gray-600 leading-relaxed font-medium">
            Your AI-powered personal email assistant. We turn your inbox into actionable tasks, events, and reminders automatically.
          </p>
          
          <div className="space-y-6 pt-4">
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center space-x-4 text-gray-700 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-lg font-semibold">Automatically detect deadlines & tasks</span>
            </motion.div>
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center space-x-4 text-gray-700 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-lg font-semibold">Smart event & meeting scheduling</span>
            </motion.div>
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center space-x-4 text-gray-700 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="p-2 bg-rose-100 rounded-xl">
                <Clock className="w-6 h-6 text-rose-600" />
              </div>
              <span className="text-lg font-semibold">Never miss a bill payment again</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white/80 backdrop-blur-xl p-10 lg:p-12 rounded-3xl shadow-2xl shadow-indigo-200/50 border border-white flex flex-col items-center text-center"
        >
          <div className="lg:hidden flex items-center space-x-3 mb-8">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-md">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">SmartMail</h2>
          </div>
          
          <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Welcome back</h2>
          <p className="text-lg text-gray-500 mb-10 font-medium">Sign in to organize your inbox</p>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(66, 133, 244, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-4 px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-all focus:ring-4 focus:ring-indigo-100 focus:outline-none"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-bold text-gray-800 text-lg">Continue with Google</span>
          </motion.button>
          
          <p className="mt-10 text-sm font-medium text-gray-400 max-w-xs mx-auto">
            By continuing, you agree to SmartMail's Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
