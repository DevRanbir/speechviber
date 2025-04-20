import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  useTheme,
  Container,
  Badge,
  MenuItem,
  CircularProgress 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';

// Import Icons
import MicIcon from '@mui/icons-material/Mic';
import PersonIcon from '@mui/icons-material/Person';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HistoryIcon from '@mui/icons-material/History';
import SpeedIcon from '@mui/icons-material/Speed';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import CelebrationIcon from '@mui/icons-material/Celebration';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import Menu from '@mui/material/Menu';
import QuizIcon from '@mui/icons-material/Quiz';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import GrammarIcon from '@mui/icons-material/Grading';
import ChatIcon from '@mui/icons-material/Chat';
import { AutoStories } from '@mui/icons-material';

// Groq API configuration
const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Styled components
const GradientButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: `0 10px 20px rgba(${theme.palette.primary.main}, 0.3)`,
  }
}));

const FeatureCard = styled(motion(Card))(({ theme }) => ({
  height: '100%',
  borderRadius: 16,
  background: theme.palette.mode === 'dark' 
    ? 'rgba(26, 32, 44, 0.7)' 
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
    borderColor: theme.palette.primary.light,
  }
}));

const CircularProgressContainer = styled(Box)(({ theme, value }) => ({
  position: 'relative',
  width: 60,
  height: 60,
  borderRadius: '50%',
  background: `conic-gradient(
    ${theme.palette.primary.main} ${value}%, 
    ${theme.palette.background.paper} ${value}%
  )`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    borderRadius: '50%',
    background: theme.palette.background.paper,
  }
}));

const CircularProgressValue = styled(Typography)(({ theme }) => ({
  position: 'relative',
  fontWeight: 'bold',
  zIndex: 1,
}));

const ActivityItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  borderRadius: 12,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)',
  }
}));

const AchievementBadge = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: 16,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[4],
  }
}));

const Dashboard = () => {
  useErrorBoundary();
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const database = getDatabase();
  
  // State variables
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [userData, setUserData] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [weeklyImprovement, setWeeklyImprovement] = useState(0);
  const [dailyTip, setDailyTip] = useState('');
  const [tipLoading, setTipLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  
  // New history states (matching the History component)
  const [mcqChallenges, setMcqChallenges] = useState([]);
  const [wordPowerGames, setWordPowerGames] = useState([]);
  const [grammarCheckHistory, setGrammarCheckHistory] = useState([]);
  const [fastTrackHistory, setFastTrackHistory] = useState([]);
  const [debateHistory, setDebateHistory] = useState([]);
  const [storyData, setStoryData] = useState([]);
  const [photoURL, setPhotoURL] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Add this new effect to fetch the profile photo
    const fetchProfilePhoto = async () => {
      if (currentUser.photoURL) {
        setPhotoURL(currentUser.photoURL);
      }
    };

    fetchProfilePhoto();
    fetchUserData();
    fetchUserActivities();
    fetchUserAchievements();
    fetchPerformanceMetrics();
    fetchDailyTip();
  }, [currentUser]);

  const fetchUserData = () => {
    const userRef = ref(database, `users/${currentUser.uid}/profile`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUserData(data);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setError("Failed to load user data");
    });
  };

  // Updated fetchUserActivities to match History component's data fetching
  const fetchUserActivities = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const database = getDatabase();

      // Fetch recent activities from history/data
      const historyRef = ref(database, `users/${currentUser.uid}/history/data`);
      const snapshot = await get(historyRef);
      const historyData = snapshot.val();

      if (historyData) {
        // Get all activities and sort them by date
        const allActivities = Object.entries(historyData)
          .flatMap(([timestamp, entry]) => {
            // Check if activities exist and is an array
            if (entry.activities && Array.isArray(entry.activities)) {
              return entry.activities.map(activity => ({
                ...activity,
                entryTime: entry.time
              }));
            }
            // If activities is a single object, convert it to array
            if (entry.activities && typeof entry.activities === 'object') {
              return Object.values(entry.activities).map(activity => ({
                ...activity,
                entryTime: entry.time
              }));
            }
            return []; // Return empty array if no valid activities
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3); // Limit to 3 most recent activities

        // Map activities to include icons and colors
        const formattedActivities = allActivities.map(activity => {
          let icon, color;
          switch (activity.type) {
            case 'Interview Practice':
              icon = <QuizIcon sx={{ fontSize: 20 }} />;
              color = theme.palette.primary.main;
              break;
            case 'Word Power':
              icon = <SpellcheckIcon sx={{ fontSize: 20 }} />;
              color = theme.palette.secondary.main;
              break;
            case 'Grammar Check':
              icon = <GrammarIcon sx={{ fontSize: 20 }} />;
              color = '#10B981';
              break;
            case 'FastTrack Analysis':
              icon = <MicIcon sx={{ fontSize: 20 }} />;
              color = '#F59E0B';
              break;
            case 'Debate Session':
              icon = <ChatIcon sx={{ fontSize: 20 }} />;
              color = '#EC4899';
              break;
            case 'Story Analysis':
              icon = <AutoStories sx={{ fontSize: 20 }} />;
              color = '#6366F1';
              break;
            default:
              icon = <HistoryIcon sx={{ fontSize: 20 }} />;
              color = theme.palette.grey[500];
          }

          return {
            ...activity,
            icon,
            color
          };
        });

        setRecentActivities(formattedActivities);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setError("Failed to load recent activities");
      setLoading(false);
    }
  };

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

  const fetchUserAchievements = () => {
    const achievementsRef = ref(database, `users/${currentUser.uid}/achievements`);
    onValue(achievementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const achievementsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        
        // Format the achievements for display
        const formattedAchievements = achievementsArray.slice(0, 3).map(achievement => {
          let icon;
          
          switch(achievement.type) {
            case 'streak':
              icon = <EmojiEventsIcon sx={{ color: '#F59E0B', fontSize: 32 }} />;
              break;
            case 'master':
              icon = <StarIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />;
              break;
            case 'completion':
              icon = <CheckCircleIcon sx={{ color: '#10B981', fontSize: 32 }} />;
              break;
            default:
              icon = <CelebrationIcon sx={{ color: theme.palette.secondary.main, fontSize: 32 }} />;
          }
          
          return {
            title: achievement.title,
            icon
          };
        });
        
        setAchievements(formattedAchievements);
      } else {
        setAchievements([]);
      }
    }, (error) => {
      console.error("Error fetching achievements:", error);
    });
  };

  const fetchPerformanceMetrics = () => {
    const metricsRef = ref(database, `users/${currentUser.uid}/metrics`);
    onValue(metricsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Calculate overall score as average of all metrics
        const overallScore = Math.round(
          (data.clarity + data.fluency + data.confidence + data.vocabulary) / 4
        );
        
        // Format metrics for display
        const formattedMetrics = [
          { 
            title: 'Overall Score', 
            value: overallScore || 0, 
            icon: <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />,
            color: theme.palette.primary.main
          },
          { 
            title: 'Clarity', 
            value: data.clarity || 0, 
            icon: <RecordVoiceOverIcon sx={{ color: theme.palette.secondary.main }} />,
            color: theme.palette.secondary.main
          },
          { 
            title: 'Fluency', 
            value: data.fluency || 0, 
            icon: <SpeedIcon sx={{ color: '#10B981' }} />,
            color: '#10B981'
          }
        ];
        
        setPerformanceMetrics(formattedMetrics);
        
        // Calculate weekly improvement
        if (data.previousWeekScore && data.currentWeekScore) {
          const improvement = Math.round(
            ((data.currentWeekScore - data.previousWeekScore) / data.previousWeekScore) * 100
          );
          setWeeklyImprovement(improvement);
        }
      } else {
        // Default metrics if no data
        setPerformanceMetrics([
          { 
            title: 'Overall Score', 
            value: 0, 
            icon: <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />,
            color: theme.palette.primary.main
          },
          { 
            title: 'Clarity', 
            value: 0, 
            icon: <RecordVoiceOverIcon sx={{ color: theme.palette.secondary.main }} />,
            color: theme.palette.secondary.main
          },
          { 
            title: 'Fluency', 
            value: 0, 
            icon: <SpeedIcon sx={{ color: '#10B981' }} />,
            color: '#10B981'
          }
        ]);
      }
    }, (error) => {
      console.error("Error fetching performance metrics:", error);
    });
  };

  const fetchDailyTip = async () => {
    setTipLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "user",
              content: "You are a professional speaking coach. Generate one concise, practical tip for improving public speaking or communication skills. The tip should be specific, actionable, and no longer than 2 sentences."
            }
          ],
          temperature: 0.7,
          max_tokens: 100,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const tip = data.choices[0]?.message?.content || "Practice makes perfect! Regular speaking exercises improve confidence and fluency.";
      setDailyTip(tip);
    } catch (error) {
      console.error("Error fetching daily tip:", error);
      setDailyTip("Practice makes perfect! Regular speaking exercises improve confidence and fluency.");
    } finally {
      setTipLoading(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = async (action) => {
    handleUserMenuClose();
    if (action === 'profile') {
      navigate('/profile');
    } else if (action === 'settings') {
      navigate('/settings');
    } else if (action === 'logout') {
      try {
        await logout();
        navigate('/auth');
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  };

  // Features array
  const features = [
    {
      title: 'Speech Analysis',
      description: 'Get detailed insights on your performance',
      icon: <AnalyticsIcon sx={{ color: '#10B981' }} fontSize="large" />,
      path: '/analysis',
      color: '#10B981',
      delay: 0.3
    },
    {
      title: 'Interview Simulator',
      description: 'Prepare with AI-powered mock interviews',
      icon: <PersonIcon color="secondary" fontSize="large" />,
      path: '/interview',
      color: theme.palette.secondary.main,
      delay: 0.2
    },
    {
      title: 'Progress Tracker',
      description: 'Monitor your improvement over time',
      icon: <HistoryIcon sx={{ color: '#F59E0B' }} fontSize="large" />,
      path: '/history',
      color: '#F59E0B',
      delay: 0.4
    },
    {
      title: 'Practice Mode',
      description: 'Enhance your skills with guided exercises',
      icon: <MicIcon color="primary" fontSize="large" />,
      path: '/practice',
      color: theme.palette.primary.main,
      delay: 0.1
    }
  ];

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: 4,
        px: { xs: 3, sm: '24px' },
        pr: { sm: '90px' }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with User Info and Notifications */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
              Welcome to <Box component="span" sx={{ color: theme.palette.primary.main }}>SpeechViber</Box>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {userData.name ? `Hello, ${userData.name}! Let's improve your skills today` : 'Let\'s improve your communication skills today'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Account">
              <IconButton onClick={handleUserMenuOpen}>
                <Avatar 
                  src={photoURL || userData.photoURL}
                  sx={{ 
                    width: 40,
                    height: 40,
                    background: !photoURL && !userData.photoURL && 
                      `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: theme.shadows[3],
                    cursor: 'pointer',
                    border: `2px solid ${theme.palette.primary.main}`
                  }}
                >
                  {!photoURL && !userData.photoURL && (
                    userData.name ? 
                      userData.name.charAt(0) : 
                      (currentUser?.email ? currentUser.email.charAt(0) : '?')
                  )}
                </Avatar>
              </IconButton>
            </Tooltip>
            {/* User Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              disableScrollLock={true}
              PaperProps={{
                elevation: 3,
                sx: {
                  borderRadius: 2,
                  minWidth: 180,
                  overflow: 'visible',
                  mt: 1.5,
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => handleMenuAction('profile')}>
                <PersonIcon sx={{ mr: 1.5, fontSize: 20 }} />
                View Profile
              </MenuItem>
              <MenuItem onClick={() => handleMenuAction('settings')}>
                <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleMenuAction('logout')} sx={{ color: 'error.main' }}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Hero Banner */}
        <Card 
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '50%',
              opacity: 0.1,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              backgroundSize: 'cover',
              display: { xs: 'none', md: 'block' }
            }}
          />
          
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Chip 
                    label="Made by @Vibers"
                    size="small"
                    sx={{ 
                      mb: 2, 
                      fontWeight: 500,
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(5px)',
                      color: 'white'
                    }}
                  />
                  
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      mb: 2, 
                      color: 'white', 
                      fontWeight: 700,
                      fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' }  // Responsive font size
                    }}
                  >
                    Boost Your Communication Skills
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
                    Get AI-powered analysis and personalized feedback to improve your speaking abilities.
                    Track your progress and practice with customized exercises.
                  </Typography>
                  
                  <Stack direction="row" spacing={2}>
                    <GradientButton 
                      variant="contained"
                      size="large"
                      startIcon={<MicIcon />}
                      onClick={() => navigate('/practice')}
                      sx={{ 
                        bgcolor: 'white',
                        color: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor: 'white',
                        }
                      }}
                    >
                      Start Practicing
                    </GradientButton>
                    
                    <Button 
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/info')}
                      sx={{ 
                        borderColor: 'rgba(255, 255, 255, 0.5)', 
                        color: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          background: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Learn More
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Progress Dashboard */}
          <Grid item xs={12} lg={4}>
            <Card elevation={0} sx={{ borderRadius: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Performance Dashboard
                  </Typography>
                  <Chip 
                    label="Last 30 days" 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    sx={{ borderRadius: 1.5 }}
                  />
                </Box>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {performanceMetrics.map((metric, index) => (
                    <Grid item xs={12} key={index}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 2, 
                          boxShadow: 'none',
                          mb: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: metric.color,
                            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.05)`
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: `${metric.color}15`, color: metric.color }}>
                                {metric.icon}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {metric.title}
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                  {metric.value}%
                                </Typography>
                              </Box>
                            </Box>
                            <CircularProgressContainer value={metric.value}>
                              <CircularProgressValue variant="caption" fontWeight="bold">
                                {metric.value}%
                              </CircularProgressValue>
                            </CircularProgressContainer>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight="500" sx={{ mb: 1 }}>
                    Weekly Improvement
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
                      {weeklyImprovement > 0 ? `+${weeklyImprovement}%` : `${weeklyImprovement}%`}
                    </Typography>
                    {weeklyImprovement >= 0 ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingUpIcon color="error" sx={{ transform: 'rotate(180deg)' }} />
                    )}
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(Math.max(weeklyImprovement, 0), 100)} 
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${theme.palette.primary.main}20`,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Daily Tip */}
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: 3, 
                mb: 3, 
                background: `linear-gradient(135deg, ${theme.palette.secondary.light}20, ${theme.palette.secondary.main}20)`,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                    <TipsAndUpdatesIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="600">
                    Daily Speaking Tip
                  </Typography>
                </Box>

                {tipLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {dailyTip}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            {/* Features */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Key Features
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} key={feature.title}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: feature.delay }}
                  >
                    <FeatureCard
                      onClick={() => handleNavigation(feature.path)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: `${feature.color}15`,
                              color: feature.color,
                              width: 48,
                              height: 48
                            }}
                          >
                            {feature.icon}
                          </Avatar>
                        </Box>
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </FeatureCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Recent Activities Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Recent Activities
              </Typography>
              
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : recentActivities.length > 0 ? (
                    <Stack spacing={2}>
                      {recentActivities.map((activity, index) => (
                        <ActivityItem key={index}>
                          <Avatar
                            sx={{
                              mr: 2,
                              bgcolor: `${activity.color}15`,
                              color: activity.color
                            }}
                          >
                            {activity.icon}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="500">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(activity.date)}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${activity.score}%`}
                            size="small"
                            sx={{
                              bgcolor: `${activity.color}15`,
                              color: activity.color,
                              fontWeight: '500'
                            }}
                          />
                        </ActivityItem>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography color="text.secondary">
                        No recent activities found
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>




          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Dashboard;