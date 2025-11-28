import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Events } from './pages/Events';
import { EventPlanner } from './pages/EventPlanner';

// Router Component to manage pages inside the context
const AppRouter = () => {
  const { user } = useStore();
  const [page, setPage] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

  if (!user) {
    return <Login />;
  }

  const navigate = (to: string, eventId?: string) => {
    setPage(to);
    if (eventId) setSelectedEventId(eventId);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'members': return <Members />;
      case 'events': return <Events onNavigate={navigate} />;
      case 'planner': 
        if (selectedEventId) return <EventPlanner eventId={selectedEventId} onBack={() => setPage('events')} />;
        return <Events onNavigate={navigate} />;
      case 'audit': return <div className="p-4">Audit Logs (Admin Only View)</div>;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
};

// Main App Wrapper
const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
};

export default App;
