import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Chip,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WorkIcon from '@mui/icons-material/Work';
import ScoreIcon from '@mui/icons-material/Score';
import QuizIcon from '@mui/icons-material/Quiz';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import GrammarIcon from '@mui/icons-material/Grading';
import MicIcon from '@mui/icons-material/Mic';
import { motion } from 'framer-motion';
import ChatIcon from '@mui/icons-material/Chat';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// Add import for Dashboard icon
import { 
  AutoStories,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

// Import the HistoryDashboard component
import HistoryDashboard from './tabs/HistoryDashboard';

// Import history tab components
import InterviewPracticeHistory from './tabs/InterviewPracticeHistory';
import WordPowerHistory from './tabs/WordPowerHistory';
import GrammarCheckHistory from './tabs/GrammarCheckHistory';
import FastTrackHistory from './tabs/FastTrackHistory';
import DebateHistory from './tabs/DebateHistory';

// Add the import for StoryHistory
import StoryHistory from './tabs/StoryHistory';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import TongueTwisterHistory from './tabs/TongueTwisterHistory';

// Add new tab components imports
import WordInContextHistory from './tabs/WordInContextHistory';
import GrammarFillHistory from './tabs/GrammarFillHistory';

const History = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [mcqChallenges, setMcqChallenges] = useState([]);
  const [wordPowerGames, setWordPowerGames] = useState([]);
  const [grammarCheckHistory, setGrammarCheckHistory] = useState([]);
  const [fastTrackHistory, setFastTrackHistory] = useState([]);
  const [debateHistory, setDebateHistory] = useState([]); // Add state for debate history
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [storyData, setStoryData] = useState([]);
  
  const [tongueTwisterHistory, setTongueTwisterHistory] = useState([]);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'Interview Practice':
        return <QuizIcon />;
      case 'Word Power':
        return <SpellcheckIcon />;
      case 'Grammar Check':
        return <GrammarIcon />;
      case 'FastTrack Analysis':
        return <MicIcon />;
      case 'Debate Session':
        return <ChatIcon />;
      case 'Story Analysis':
        return <AutoStories />;
      case 'Tongue Twister':
        return <RecordVoiceOverIcon />;
      default:
        return <MicIcon />;
    }
  };

  useEffect(() => {
    const saveRecentActivities = async () => {
      if (!currentUser || !mcqChallenges || !wordPowerGames || !grammarCheckHistory || 
        !fastTrackHistory || !debateHistory || !storyData || !tongueTwisterHistory) {
        return;
      }
  
      try {
        const database = getDatabase();
        
        // Combine all activities with validation and unique ID generation
        const allActivities = [
          ...(mcqChallenges.filter(item => item?.score && item?.time).map(item => ({
            id: `interview_${item.time}_${item.score}`,
            type: 'Interview Practice',
            date: item.time,
            score: item.score,
            description: `Completed an interview practice session with score: ${item.score}%`,
            duration: '15 minutes'
          }))),
          ...(tongueTwisterHistory.filter(item => item?.score && item?.time).map(item => ({
            id: `tonguetwister_${item.time}_${item.score}`,
            type: 'Tongue Twister',
            date: item.time,
            score: item.score,
            description: `Completed a tongue twister practice with score: ${item.score}%`,
            duration: '10 minutes'
          }))),
          ...(wordPowerGames.filter(item => item?.score && item?.time).map(item => ({
            id: `wordpower_${item.time}_${item.score}`,
            type: 'Word Power',
            date: item.time,
            score: item.score,
            description: `Completed a word power game with score: ${item.score}%`,
            duration: '10 minutes'
          }))),
          ...(grammarCheckHistory.filter(item => item?.score && item?.time).map(item => ({
            id: `grammar_${item.time}_${item.score}`,
            type: 'Grammar Check',
            date: item.time,
            score: item.score,
            description: `Completed a grammar check session with score: ${item.score}%`,
            duration: '12 minutes'
          }))),
          ...(fastTrackHistory.filter(item => item?.score && item?.time).map(item => ({
            id: `fasttrack_${item.time}_${item.score}`,
            type: 'FastTrack Analysis',
            date: item.time,
            score: item.score,
            description: `Completed a fast track analysis with score: ${item.score}%`,
            duration: '5 minutes'
          }))),
          ...(debateHistory.filter(item => item?.score && item?.time).map(item => ({
            id: `debate_${item.time}_${item.score}`,
            type: 'Debate Session',
            date: item.time,
            score: item.score,
            description: `Participated in a debate session`,
            duration: '20 minutes'
          }))),
          ...(storyData.filter(item => item?.score && item?.time).map(item => ({
            id: `story_${item.time}_${item.score}`,
            type: 'Story Analysis',
            date: item.time,
            score: item.score,
            description: `Analyzed a story with score: ${item.score}%`,
            duration: '15 minutes'
          })))
        ];
  
        // Get existing data
        const historyRef = ref(database, `users/${currentUser.uid}/history/data`);
        const snapshot = await get(historyRef);
        const existingData = snapshot.val() || {};
  
        // Create a map of existing IDs
        const existingIds = new Set(
          Object.values(existingData)
            .flatMap(entry => entry.activities)
            .map(activity => activity.id)
        );
  
        // Filter out duplicates
        const uniqueActivities = allActivities.filter(activity => !existingIds.has(activity.id));
  
        if (uniqueActivities.length > 0) {
          // Sort and take most recent
          uniqueActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
          const recentActivities = uniqueActivities.slice(0, 10);
  
          // Save only if we have new activities
          await set(ref(database, `users/${currentUser.uid}/history/data/${Date.now()}`), {
            time: new Date().toISOString(),
            activities: recentActivities
          });
  
          console.log(`Saved ${recentActivities.length} new activities`);
        } else {
          console.log('No new activities to save');
        }
  
      } catch (error) {
        console.error('Error saving recent activities:', error);
      }
    };
  
    saveRecentActivities();
  }, [currentUser, mcqChallenges, wordPowerGames, grammarCheckHistory, 
    fastTrackHistory, debateHistory, storyData, tongueTwisterHistory]);

  useEffect(() => {
    const fetchUserHistory = async () => {
      try {
        const database = getDatabase();
        
        // Add Tongue Twister history fetch
        // In the fetchUserHistory function, update the tongue twister fetch:
        const tongueTwisterRef = ref(database, `users/${currentUser.uid}/tongue-twister`);
        onValue(tongueTwisterRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const twisterArray = Object.entries(data).map(([key, value]) => {
              // Get the first value from the nested object and ensure we don't duplicate data
              const sessionData = Object.values(value)[0];
              return {
                id: key,
                ...sessionData,
                time: sessionData.time || new Date().toISOString() // Ensure time exists
              };
            });
            
            // Remove duplicates based on time
            const uniqueTwisterArray = twisterArray.filter((item, index, self) =>
              index === self.findIndex((t) => t.time === item.time)
            );
            
            uniqueTwisterArray.sort((a, b) => new Date(b.time) - new Date(a.time));
            setTongueTwisterHistory(uniqueTwisterArray);
          } else {
            setTongueTwisterHistory([]);
          }
        });

        // Fetch MCQ Challenges
        const mcqChallengesRef = ref(database, `users/${currentUser.uid}/mcq-challenges`);
        onValue(mcqChallengesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const challengesArray = Object.entries(data).map(([key, value]) => {
              const innerKey = Object.keys(value)[0];
              return {
                id: key,
                ...value[innerKey]
              };
            });
            
            challengesArray.sort((a, b) => new Date(b.time) - new Date(a.time));
            setMcqChallenges(challengesArray);
          } else {
            setMcqChallenges([]);
          }
        }, (error) => {
          console.error("Error fetching MCQ challenges:", error);
          setError("Failed to load your MCQ history. Please try again later.");
        });
        
        // Fetch Word Power Games
        const wordPowerRef = ref(database, `users/${currentUser.uid}/word-power`);
        onValue(wordPowerRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const gamesArray = Object.entries(data).map(([key, value]) => {
              const innerKey = Object.keys(value)[0];
              return {
                id: key,
                ...value[innerKey]
              };
            });
            
            gamesArray.sort((a, b) => new Date(b.time) - new Date(a.time));
            setWordPowerGames(gamesArray);
          } else {
            setWordPowerGames([]);
          }
        }, (error) => {
          console.error("Error fetching Word Power games:", error);
          setError("Failed to load your Word Power history. Please try again later.");
        });
        
        // Fetch Grammar Check History
        const grammarCheckRef = ref(database, `users/${currentUser.uid}/grammar-check`);
        onValue(grammarCheckRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const grammarCheckArray = Object.entries(data).map(([key, value]) => {
              const innerKey = Object.keys(value)[0];
              return {
                id: key,
                ...value[innerKey]
              };
            });
            
            grammarCheckArray.sort((a, b) => new Date(b.time) - new Date(a.time));
            setGrammarCheckHistory(grammarCheckArray);
          } else {
            setGrammarCheckHistory([]);
          }
        }, (error) => {
          console.error("Error fetching grammar check history:", error);
          setError("Failed to load your grammar check history. Please try again later.");
        });

        // Fetch FastTrack Analysis History
        const fastTrackRef = ref(database, `users/${currentUser.uid}/fasttractanalysis`);
        onValue(fastTrackRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const fastTrackArray = Object.entries(data).map(([key, value]) => {
              const innerKey = Object.keys(value)[0];
              return {
                id: key,
                ...value[innerKey]
              };
            });
            
            fastTrackArray.sort((a, b) => new Date(b.time) - new Date(a.time));
            setFastTrackHistory(fastTrackArray);
          } else {
            setFastTrackHistory([]);
          }
          
          // Remove setLoading(false) from here as we need to wait for debate history too
        }, (error) => {
          console.error("Error fetching FastTrack analysis history:", error);
          setError("Failed to load your FastTrack analysis history. Please try again later.");
          // Don't set loading to false here
        });

        // Fetch Story Analysis History
        const storyRef = ref(database, `users/${currentUser.uid}/storymode/data`);
        onValue(storyRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const storyArray = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
            }));
            
            storyArray.sort((a, b) => new Date(b.time) - new Date(a.time));
            setStoryData(storyArray);
        } else {
            setStoryData([]);
        }
        setLoading(false);
        }, (error) => {
        console.error("Error fetching story analysis history:", error);
        setError("Failed to load your story analysis history. Please try again later.");
        setLoading(false);
        });
        
        // Fetch Debate History
        const debateRef = ref(database, `users/${currentUser.uid}/debate/data`);
        onValue(debateRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const debateArray = Object.entries(data).map(([key, value]) => {
              // Handle nested structure if present
              const debateData = value && typeof value === 'object' && Object.values(value)[0] 
                ? Object.values(value)[0] 
                : value;
              
              return {
                id: key,
                ...debateData
              };
            });
            
            debateArray.sort((a, b) => new Date(b.time) - new Date(a.time));
            setDebateHistory(debateArray);
          } else {
            setDebateHistory([]);
          }
          setLoading(false); // Now set loading to false after all data is fetched
        }, (error) => {
          console.error("Error fetching debate history:", error);
          setError("Failed to load your debate history. Please try again later.");
          setLoading(false);
        });
        
      } catch (error) {
        console.error("Error setting up database listener:", error);
        setError("Failed to connect to the database. Please check your connection.");
        setLoading(false);
      }
    };

    fetchUserHistory();
  }, [currentUser, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Your Practice History
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
        </Box>

        {error && (
          <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography>{error}</Typography>
          </Paper>
        )}

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ mb: 3 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Dashboard" 
            icon={<DashboardIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Interview Practice" 
            icon={<QuizIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Word Power" 
            icon={<SpellcheckIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Grammar Check" 
            icon={<GrammarIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="FastTrack Analysis" 
            icon={<MicIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Debate Sessions" 
            icon={<ChatIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Story Analysis" 
            icon={<AutoStories />} 
            iconPosition="start" 
          />
          <Tab 
            label="Tongue Twisters" 
            icon={<RecordVoiceOverIcon />} 
            iconPosition="start" 
          />
        </Tabs>

        {/* Add the Dashboard tab content */}
        {activeTab === 0 && (
        <HistoryDashboard 
            mcqChallenges={mcqChallenges}
            wordPowerGames={wordPowerGames}
            grammarCheckHistory={grammarCheckHistory}
            fastTrackHistory={fastTrackHistory}
            debateHistory={debateHistory}
            storyData={storyData}
            formatDate={formatDate}
            navigate={navigate}
        />
        )}

        {/* Update the indices for the other tabs */}
        {activeTab === 1 && (
          <InterviewPracticeHistory 
            mcqChallenges={mcqChallenges} 
            formatDate={formatDate} 
            getScoreColor={getScoreColor} 
            navigate={navigate} 
          />
        )}

        {activeTab === 2 && (
          <WordPowerHistory 
            wordPowerGames={wordPowerGames} 
            formatDate={formatDate} 
            getScoreColor={getScoreColor} 
            navigate={navigate} 
          />
        )}

        {activeTab === 3 && (
          <GrammarCheckHistory 
            grammarCheckHistory={grammarCheckHistory} 
            formatDate={formatDate} 
            getScoreColor={getScoreColor} 
            navigate={navigate} 
          />
        )}

        {activeTab === 4 && (
          <FastTrackHistory 
            fastTrackHistory={fastTrackHistory} 
            formatDate={formatDate} 
            getScoreColor={getScoreColor} 
            navigate={navigate} 
          />
        )}

        {activeTab === 5 && (
          <DebateHistory 
            debateHistory={debateHistory} 
            formatDate={formatDate} 
            getScoreColor={getScoreColor} 
            navigate={navigate} 
          />
        )}

        {activeTab === 6 && (
        <StoryHistory 
            storyData={storyData}
            formatDate={formatDate}
            getScoreColor={getScoreColor}
            navigate={navigate}
        />
        )}
        {activeTab === 7 && (
          <TongueTwisterHistory 
            tongueTwisterHistory={tongueTwisterHistory}
            formatDate={formatDate}
            getScoreColor={getScoreColor}
            navigate={navigate}
          />
        )}
      </motion.div>
    </Container>
  );
};

export default History;