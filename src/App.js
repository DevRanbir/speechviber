import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Interview from './pages/Interview';
import Practice from './pages/Practice';
import Chatbox from './pages/Chatbox';
import { ThemeContext } from './context/ThemeContext';

function App() {
  const [mode, setMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  // Create a theme instance based on the current mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode === 'dark' ? 'dark' : 'light',
          primary: {
            main: '#8B5CF6',
            light: mode === 'dark' ? '#A78BFA' : '#C4B5FD',
            dark: mode === 'dark' ? '#7C3AED' : '#6D28D9',
          },
          secondary: {
            main: '#3B82F6',
            light: mode === 'dark' ? '#60A5FA' : '#93C5FD',
            dark: mode === 'dark' ? '#2563EB' : '#1D4ED8',
          },
          background: {
            default: mode === 'dark' ? '#0A1929' : '#F0F9FF',
            paper: mode === 'dark' ? '#1A2C42' : '#FFFFFF',
          },
          text: {
            primary: mode === 'dark' ? '#F0F9FF' : '#0F172A',
            secondary: mode === 'dark' ? '#94A3B8' : '#475569',
          },
          divider: mode === 'dark' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(51, 65, 85, 0.12)',
          action: {
            hover: mode === 'dark' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
            selected: mode === 'dark' ? 'rgba(139, 92, 246, 0.16)' : 'rgba(139, 92, 246, 0.12)',
          },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                background: mode === 'dark' 
                  ? 'linear-gradient(145deg, rgba(26, 44, 66, 0.9), rgba(15, 23, 42, 0.9))'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(240, 249, 255, 0.9))',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${mode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}`,
                boxShadow: mode === 'dark'
                  ? '0 4px 20px rgba(139, 92, 246, 0.15)'
                  : '0 4px 20px rgba(139, 92, 246, 0.1)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                background: mode === 'dark'
                  ? 'linear-gradient(45deg, #7C3AED, #3B82F6)'
                  : 'linear-gradient(45deg, #8B5CF6, #60A5FA)',
                '&:hover': {
                  background: mode === 'dark'
                    ? 'linear-gradient(45deg, #6D28D9, #2563EB)'
                    : 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  const setTheme = (newTheme) => {
    setMode(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme: mode, setTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chatbox" element={<Chatbox />} />
              
              {/* Redirect any unknown routes to the dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        </Router>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;
