import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard/Dashboard';
import IDELayout from './components/Editor/IDELayout';
import './App.css';

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'ide'
  const [activeProjectId, setActiveProjectId] = useState(null);

  const openProject = (projectId) => {
    setActiveProjectId(projectId);
    setView('ide');
  };

  const backToDashboard = () => {
    setView('dashboard');
    setActiveProjectId(null);
  };

  return (
    <div className="app">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e1e2e',
            color: '#e2e8f0',
            border: '1px solid #3a3a5e',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#a78bfa', secondary: '#1e1e2e' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#1e1e2e' } },
        }}
      />
      {view === 'dashboard' ? (
        <Dashboard onOpenProject={openProject} />
      ) : (
        <IDELayout
          projectId={activeProjectId}
          onBackToDashboard={backToDashboard}
        />
      )}
    </div>
  );
}
