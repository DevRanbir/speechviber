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
  const basename = '/speechviber'; // Add basename for GitHub Pages

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
          <Route path={`${basename}/`} element={<Navigate to={`${basename}/dashboard`} replace />} />
          <Route path={`${basename}/dashboard`} element={<Dashboard />} />
          <Route path={`${basename}/interview`} element={<Interview />} />
          <Route path={`${basename}/practice`} element={<Practice />} />
          <Route path={`${basename}/analysis`} element={<Analysis />} />
          <Route path={`${basename}/profile`} element={<Profile />} />
          <Route path={`${basename}/settings`} element={<Settings />} />
          <Route path={`${basename}/chatbox`} element={<Chatbox />} />
          <Route path={`${basename}/grammarcheck`} element={<GrammarCheck />} />
          <Route path={`${basename}/pronunciation`} element={<Pronunciation />} />
          <Route path={`${basename}/wordpower`} element={<WordPower />} />
          <Route path={`${basename}/debatemode`} element={<DebateMode />} />
          <Route path={`${basename}/presentandlearn`} element={<PresentAndLearn />} />
          <Route path={`${basename}/storytime`} element={<StoryTime />} />
          <Route path={`${basename}/AIMentor`} element={<AIMentor />} />

          <Route path="*" element={<Navigate to={`${basename}/dashboard`} replace />} />
        </Routes>
      </Layout>
    </MuiThemeProvider>
  );
}

export default App;