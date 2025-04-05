import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Practice from './pages/Practice';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Chatbox from './pages/Chatbox';
import GrammarCheck from './pages/GrammarCheck';
import Pronunciation from './pages/Pronunciation';
import WordPower from './pages/WordPower';
import DebateMode from './pages/DebateMode';
import PresentAndLearn from './pages/PresentAndLearn';
import StoryTime from './pages/StoryTime';
import AIMentor from './pages/AIMentor';

function App() {
  const [mode] = useState('dark');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#7C3AED',
          },
          background: {
            default: '#0F172A',
            paper: '#1E293B',
          },
        },
      }),
    [mode]
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
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
          <Route path="/grammarcheck" element={<GrammarCheck />} />
          <Route path="/pronunciation" element={<Pronunciation />} />
          <Route path="/wordpower" element={<WordPower />} />
          <Route path="/debatemode" element={<DebateMode />} />
          <Route path="/presentandlearn" element={<PresentAndLearn />} />
          <Route path="/storytime" element={<StoryTime />} />
          <Route path="/AIMentor" element={<AIMentor />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </MuiThemeProvider>
  );
}

export default App;