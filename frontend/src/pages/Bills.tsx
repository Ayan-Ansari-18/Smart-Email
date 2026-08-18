import React, { useEffect, useState } from 'react';
import api from '../api';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Bill {
  id: string;
  company: string;
  amount: number | null;
  currency: string | null;
  dueDate: string | null;
  type: string | null;
}

const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills');
      setBills(res.data);
    } catch (error) {
      console.error('Failed to fetch bills', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string | null) => {
    if (currency === 'USD' || currency === '$') return '$';
    if (currency === 'EUR' || currency === '€') return '€';
    if (currency === 'GBP' || currency === '£') return '£';
    if (currency === 'INR' || currency === '₹') return '₹';
    return currency || '$';
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Bills & Subscriptions</h1>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg w-full"></div>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
          <p className="text-gray-500">
            Our AI automatically scans for invoices, receipts, and subscriptions to track here.
          </p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {bills.map((bill) => (
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              key={bill.id} 
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600 shadow-inner">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path></svg>
                </div>
                {bill.type && (
                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                    {bill.type}
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">{bill.company}</h3>
              
              <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Amount Due</p>
                  <p className="text-3xl font-black text-gray-900">
                    {bill.amount ? `${getCurrencySymbol(bill.currency)}${bill.amount.toFixed(2)}` : 'Unknown'}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Due Date</p>
                  <p className={`font-bold ${bill.dueDate && new Date(bill.dueDate) < new Date() ? 'text-rose-600' : 'text-gray-900'}`}>
                    {bill.dueDate ? format(new Date(bill.dueDate), 'MMM d, yyyy') : 'No Date'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Bills;
