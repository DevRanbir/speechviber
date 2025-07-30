import React, { useState, useMemo, useContext, Suspense, useTransition, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import Chatbox from './pages/Chatbox';
import GrammarCheck from './pages/GrammarCheck';
import WordPower from './pages/WordPower';
import DebateMode from './pages/DebateMode';
import PresentAndLearn from './pages/PresentAndLearn';
import StoryTime from './pages/StoryTime';
import AIMentor from './pages/AIMentor';
import Notes from './pages/Notes';
import Auth from './pages/Auth';
import TongueTwister from './pages/TongueTwister';
import PublicSpeaking from './pages/PublicSpeaking';
import ExpressionMatcher from './pages/ExpressionMatcher';
import WordContext from './pages/WordContext';
import GrammarFill from './pages/GrammarFill';  // Make sure import path matches directory structure
import WordWizardry from './pages/WordWizardry';
import SpeechPrecision from './pages/SpeechPrecision';
import ParticleCursor from './components/ParticleCursor';
import { ParticleProvider } from './contexts/ParticleContext';
import Info from './pages/Info';
import CustomLoader from './components/CustomLoader';
import { initializeEnvironment } from './services/environmentService';
import ApiKeysTest from './components/ApiKeysTest';
import ErrorPage from './pages/ErrorPage';
import ErrorBoundary from './components/ErrorBoundary';

import PrivateRoute from './components/PrivateRoute';
import { Box, CircularProgress } from '@mui/material';

const Practice = React.lazy(() => import('./pages/Practice'));
const History = React.lazy(() => import('./pages/History'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Simplified Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = React.useContext(AuthContext);
  const location = useLocation();
  const [showCustomLoader, setShowCustomLoader] = React.useState(false);

  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowCustomLoader(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowCustomLoader(false);
    }
  }, [loading]);

  if (loading) {
    return showCustomLoader ? (
      <CustomLoader />
    ) : (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)'
      }}>
        <CircularProgress sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => {
  const [mode] = useState('dark');
  const [envInitialized, setEnvInitialized] = useState(false);
  const [envError, setEnvError] = useState(null);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#7C3AED' },
          background: {
            default: '#0F172A',
            paper: '#1E293B',
          },
        },
      }),
    [mode]
  );

  // Initialize environment service on app start
  useEffect(() => {
    const initEnv = async () => {
      try {
        await initializeEnvironment();
        setEnvInitialized(true);
        console.log('Environment service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize environment service:', error);
        setEnvError(error);
        // Still allow app to continue with process.env fallback
        setEnvInitialized(true);
      }
    };

    initEnv();
  }, []);

  if (!envInitialized) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <CircularProgress sx={{ color: '#7C3AED', mb: 2 }} />
        <div>Initializing application...</div>
        {envError && (
          <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
            Loading with fallback configuration
          </div>
        )}
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ParticleProvider>
          <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <ParticleCursor />
            <Suspense fallback={<CustomLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/interview" element={<Interview />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="analysis" element={<Analysis />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="chatbox" element={<Chatbox />} />
                  <Route path="grammarcheck" element={<GrammarCheck />} />
                  <Route path="wordpower" element={<WordPower />} />
                  <Route path="debatemode" element={<DebateMode />} />
                  <Route path="presentandlearn" element={<PresentAndLearn />} />
                  <Route path="storytime" element={<StoryTime />} />
                  <Route path="AIMentor" element={<AIMentor />} />
                  <Route path="history" element={<History />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="tonguetwister" element={<TongueTwister />} />
                  <Route path="publicspeaking" element={<PublicSpeaking />} />
                  <Route path="expressionmatcher" element={<ExpressionMatcher />} />
                  <Route path="wordcontext" element={<WordContext />} />
                  <Route path="grammarfill" element={<GrammarFill />} />
                  <Route path="wordwizardry" element={<WordWizardry />} />
                  <Route path="speechprecision" element={<SpeechPrecision />} />
                  <Route path="info" element={<Info />} />
                  <Route path="api-keys-test" element={<ApiKeysTest />} />
                  <Route path="error" element={<ErrorPage />} />
                </Route>
              </Routes>
            </Suspense>
          </MuiThemeProvider>
        </ParticleProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;