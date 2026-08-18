import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Temporarily set it so the api call works
      localStorage.setItem('activeToken', token);
      
      api.get('/auth/me')
        .then((res) => {
          const user = res.data.user;
          // Store in saved accounts
          const savedAccountsStr = localStorage.getItem('savedAccounts');
          let savedAccounts = savedAccountsStr ? JSON.parse(savedAccountsStr) : [];
          
          // Filter out existing entry for this email if it exists, and any corrupted ones
          savedAccounts = savedAccounts.filter((acc: any) => acc && acc.email && acc.email !== user.email);
          
          // Add new entry
          savedAccounts.push({
            email: user.email,
            name: user.name,
            picture: user.picture,
            token: token
          });
          
          localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts));
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          console.error("Failed to fetch user data with token", err);
          localStorage.removeItem('activeToken');
          navigate('/login?error=auth_failed', { replace: true });
        });
    } else {
      navigate('/login?error=missing_token', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-600 rounded-full mb-4"></div>
        <p className="text-gray-600 font-medium">Completing authentication...</p>
      </div>
    </div>
  );
}
