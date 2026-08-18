import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Events from './pages/Events';
import Bills from './pages/Bills';
import Landing from './pages/Landing';
import AuthSuccess from './pages/AuthSuccess';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/auth/callback" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="tasks" element={<Tasks />} />
            <Route path="events" element={<Events />} />
            <Route path="bills" element={<Bills />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
