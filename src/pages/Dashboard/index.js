import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Fab,
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
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { styled, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDatabase, ref, onValue, get, set } from 'firebase/database';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
import EditIcon from '@mui/icons-material/Edit';
import { TextField } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
// Add this import with your other imports
import AboutSection from '../Info/components/AboutSection';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  Groups as GroupsIcon,
  Translate as TranslateIcon,
  Mic as MicIcon,
  Person as PersonIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Celebration as CelebrationIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Quiz as QuizIcon,
  Spellcheck as SpellcheckIcon,
  Grading as GrammarIcon,
  Chat as ChatIcon,
  AutoStories
} from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';
import Menu from '@mui/material/Menu';

import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';


import { 
  Tab, 
  Tabs, 
  Fade, 
  FormControlLabel, 
  Checkbox,
  Paper as MuiPaper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import BookIcon from '@mui/icons-material/Book';
import HelpIcon from '@mui/icons-material/Help';
import UpdateIcon from '@mui/icons-material/Update';
import AuthorsSection from '../Info/components/AuthorsSection';
import HelpDeskSection from '../Info/components/HelpDeskSection';

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

const CountdownTimer = React.memo(({ seconds }) => {
  const theme = useTheme();
  return (
    <Typography 
      variant="caption" 
      sx={{ 
        color: theme.palette.text.secondary,
        minWidth: '60px'
      }}
    >
      {`${seconds}s`}
    </Typography>
  );
});

const WelcomePopup = ({ 
  open, 
  onClose, 
  timer, 
  onStayOpen, 
  selectedTab, 
  onTabChange, 
  userData, 
  theme, 
  features,
  showPopupPermanently,
  onTimerChange,
  onPopupPermanentChange
}) => {
  const [infoTab, setInfoTab] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: "2000px" },
          height: isMobile ? '100%' : 'auto',
          borderRadius: isMobile ? 0 : 3,
          background: theme.palette.background.paper,
          backgroundImage: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
        }
      }}
      TransitionProps={{
        timeout: 300
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 }
      }}>
        <Typography variant="subtitle1" component="div" fontWeight="bold" noWrap>
          Welcome to SpeechViber
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <CountdownTimer seconds={timer} />
          <IconButton onClick={onClose} size="small" edge="end" sx={{ ml: 0.5 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Tabs
        value={selectedTab}
        onChange={onTabChange}
        variant={isMobile ? "fullWidth" : "standard"}
        sx={{ 
          px: { xs: 1, sm: 3 },
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: { xs: 56, sm: 48 },
            textTransform: 'none',
            fontWeight: 500,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            p: { xs: 1, sm: 2 }
          }
        }}
      >
        <Tab 
          icon={<SmartToyIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
          iconPosition="start"
          label="Hello" 
        />
        <Tab 
          icon={<InfoIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
          iconPosition="start"
          label="About" 
        />
        <Tab 
          icon={<NewReleasesIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
          iconPosition="start"
          label="What's New" 
        />
      </Tabs>

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 }, 
        overflow: 'auto',
        height: isMobile ? 'calc(100% + 120px)' : 'auto'
      }}>
        <TabPanel value={selectedTab} index={0}>
          <Typography variant="h6" sx={{ 
            mb: { xs: 1.5, sm: 2 }, 
            color: theme.palette.primary.main,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Hello {userData.name ? userData.name.split(' ')[0] : 'there'}! 👋
          </Typography>
          <Typography paragraph sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Welcome to SpeechViber, your AI-powered communication skills enhancement platform. We're here to help you become a more confident and effective communicator.
          </Typography>
          <Typography paragraph sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Here's what you can do with SpeechViber:
          </Typography>
          <Grid container spacing={isMobile ? 1.5 : 2}>
            {features.slice(0, 4).map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1.5, sm: 2 }, 
                  p: { xs: 1.5, sm: 2 }, 
                  borderRadius: 2,
                  bgcolor: alpha(feature.color, 0.1)
                }}>
                  <Box sx={{ pt: 0.25 }}>
                    {React.cloneElement(feature.icon, { 
                      sx: { fontSize: { xs: 18, sm: 22 } } 
                    })}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Box sx={{ 
            height: isMobile ? 'calc(100% - 40px)' : '400px', 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.primary.main,
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.background.paper,
            }
          }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: { xs: 1.5, sm: 2 } }}>
              <Tabs 
                value={infoTab} 
                onChange={(e, newValue) => setInfoTab(newValue)}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    minWidth: { xs: 80, sm: 120 },
                    p: { xs: 1, sm: 2 }
                  }
                }}
              >
                <Tab icon={<InfoIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} iconPosition="start" label="About" />
                <Tab icon={<PersonIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} iconPosition="start" label="Authors" />
                <Tab icon={<HelpIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} iconPosition="start" label="Help" />
              </Tabs>
            </Box>
            
            <TabPanel value={infoTab} index={0}>
              <AboutSection 
                disableNavigation={true} 
                onTabChange={(newValue) => setInfoTab(newValue)}
                isMobile={isMobile}
              />
            </TabPanel>
            <TabPanel value={infoTab} index={1}>
              <AuthorsSection isMobile={isMobile} />
            </TabPanel>
            <TabPanel value={infoTab} index={2}>
              <HelpDeskSection isMobile={isMobile} />
            </TabPanel>
          </Box>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" sx={{ 
            mb: { xs: 1.5, sm: 2 }, 
            color: theme.palette.primary.main,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Latest Updates
          </Typography>
          <Stack spacing={isMobile ? 1.5 : 2}>
            {[
              {
                version: '2.7.4',
                date: 'April 2025',
                features: [
                  'New Interview Practice Module',
                  'Enhanced AI Analysis',
                  'Improved User Interface',
                  'Real-time Feedback System'
                ]
              },
              // Add more updates as needed
            ].map((update, index) => (
              <Box key={index} sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  Version {update.version}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                  Released: {update.date}
                </Typography>
                <List dense sx={{ pt: 0.5, pb: 0 }}>
                  {update.features.map((feature, idx) => (
                    <ListItem key={idx} sx={{ py: { xs: 0.5, sm: 0.75 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ 
                          fontSize: { xs: '0.85rem', sm: '0.9rem' } 
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        pt: { xs: 1, sm: 0 },
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 1 : 0
      }}>
        <FormControlLabel
          control={
            <Checkbox 
              checked={showPopupPermanently}
              onChange={(e) => onPopupPermanentChange(e.target.checked)}
              size="small"
            />
          }
          label={<Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Don't show again</Typography>}
          sx={{ mr: isMobile ? 0 : 'auto' }}
        />
        {!isMobile && <Box sx={{ flex: 1 }} />}
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          width: isMobile ? '100%' : 'auto',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Button 
            onClick={onClose}
            fullWidth={isMobile}
            size={isMobile ? "medium" : "medium"}
          >
            Close
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              onStayOpen();
              onTimerChange(300);
            }}
            startIcon={<SmartToyIcon sx={{ fontSize: isMobile ? 18 : 20 }} />}
            fullWidth={isMobile}
            size={isMobile ? "medium" : "medium"}
          >
            Keep Open
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// Add TabPanel component definition before Dashboard component
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  const theme = useTheme(); // Get theme using useTheme hook
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          pt: { xs: 1, sm: 2 },
          px: { xs: 0, sm: 1 },
          maxHeight: isMobile ? 'auto' : 'auto',
          overflowY: 'auto'
        }}>
          {children}
        </Box>
      )}
    </div>
  );
};

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
  const [tooltipText, setTooltipText] = useState("Chat with AI Mentor");
  
  // New history states (matching the History component)
  const [mcqChallenges, setMcqChallenges] = useState([]);
  const [wordPowerGames, setWordPowerGames] = useState([]);
  const [grammarCheckHistory, setGrammarCheckHistory] = useState([]);
  const [fastTrackHistory, setFastTrackHistory] = useState([]);
  const [debateHistory, setDebateHistory] = useState([]);
  const [storyData, setStoryData] = useState([]);
  const [photoURL, setPhotoURL] = useState(null);
  const [interviewResults, setInterviewResults] = useState(null);
  const [previousInterviewScore, setPreviousInterviewScore] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [popupTimer, setPopupTimer] = useState(15);
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false); // Initialize as false
  const [showPopupPermanently, setShowPopupPermanently] = useState(false);
  const [shouldRenderPopup, setShouldRenderPopup] = useState(false); 

  const CountdownTimer = React.memo(({ seconds }) => {
    return (
      <Typography 
        variant="caption" 
        sx={{ 
          color: theme.palette.text.secondary,
          minWidth: '60px'
        }}
      >
        {`${seconds}s`}
      </Typography>
    );
  });

  useEffect(() => {
    const checkPopupPreference = async () => {
      if (!currentUser) return;

      const database = getDatabase();
      const hidePopupRef = ref(database, `users/${currentUser.uid}/hideWelcomePopup`);
      const snapshot = await get(hidePopupRef);
      
      if (snapshot.exists()) {
        const shouldHidePopup = snapshot.val();
        setShowPopupPermanently(shouldHidePopup);
        setShouldRenderPopup(!shouldHidePopup);
        if (!shouldHidePopup) {
          setWelcomePopupOpen(true);
        }
      } else {
        setShouldRenderPopup(true);
        setWelcomePopupOpen(true);
      }
    };

    checkPopupPreference();
  }, [currentUser]);

  useEffect(() => {
    let timer;
    if (welcomePopupOpen && popupTimer > 0 && !nameDialogOpen) { // Add nameDialogOpen check
      timer = setTimeout(() => {
        setPopupTimer((prev) => prev - 1);
      }, 1000);
    } else if (popupTimer === 0) {
      setWelcomePopupOpen(false);
    }
    return () => clearTimeout(timer);
  }, [welcomePopupOpen, popupTimer, nameDialogOpen]); 

  const handleClosePopup = async () => {
    if (showPopupPermanently && currentUser) {
      const database = getDatabase();
      await set(ref(database, `users/${currentUser.uid}/hideWelcomePopup`), true);
    }
    setWelcomePopupOpen(false);
  };

  const handleStayOpen = () => {
    setPopupTimer(15);
  };

  const handlePopupPermanentChange = async (checked) => {
    setShowPopupPermanently(checked);
    if (currentUser) {
      const database = getDatabase();
      await set(ref(database, `users/${currentUser.uid}/hideWelcomePopup`), checked);
    }
  };


    useEffect(() => {
      const interval = setInterval(() => {
        const texts = ["Chat with AI Mentor", "Talk to Mentor"];
        const randomText = texts[Math.floor(Math.random() * texts.length)];
        setTooltipText(randomText);
      }, Math.floor(Math.random() * 3000) + 1000); // Random interval between 1-4 seconds
      
      return () => clearInterval(interval);
    }, []);
    
    // Remove the duplicate useEffect
    useEffect(() => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      // Add fetchLatestInterviewResults to the existing effect
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
      fetchLatestInterviewResults(); // Add this line
    }, [currentUser]);


    const handleNameSubmit = async () => {
      if (!newName.trim()) return;
      
      try {
        const db = getDatabase();
        await set(ref(db, `users/${currentUser.uid}/name`), newName.trim());
        setNameDialogOpen(false);
        setUserData(prev => ({ ...prev, name: newName.trim() }));
        if (welcomePopupOpen) { // Resume timer if welcome popup is open
          setPopupTimer(15);
        }
      } catch (error) {
        console.error("Error updating name:", error);
      }
    };

  // Add the fetchLatestInterviewResults function
  const fetchLatestInterviewResults = async () => {
    if (!currentUser) return;
    
    const interviewsRef = ref(database, `users/${currentUser.uid}/interviews/scores`);
    try {
      const snapshot = await get(interviewsRef);
      const data = snapshot.val();
      
      if (data) {
        const interviews = Object.entries(data)
          .sort(([a], [b]) => b - a); // Sort by timestamp descending
        
        if (interviews.length > 0) {
          setInterviewResults(interviews[0][1]); // Latest interview
          if (interviews.length > 1) {
            setPreviousInterviewScore(interviews[1][1].overallScore); // Previous interview
          }
        }
      }
    } catch (error) {
      console.error("Error fetching interview results:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error("Error logging out:", error);
    }
    setLogoutDialogOpen(false);
  };
  

  const fetchUserData = () => {
    const userRef = ref(database, `users/${currentUser.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUserData({
        name: data.name || '',
        email: data.email || '',
        photoURL: data.photoURL || currentUser?.photoURL || '',
        lastLogin: data.lastLogin || ''
      });
      // Open name dialog if name is not set
      if (!data.name) {
        setNameDialogOpen(true);
      }
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

  // Modify the handleMenuAction function
  const handleMenuAction = async (action) => {
    handleUserMenuClose();
    if (action === 'profile') {
      navigate('/profile');
    } else if (action === 'settings') {
      navigate('/settings');
    } else if (action === 'logout') {
      setLogoutDialogOpen(true); // Open confirmation dialog instead of logging out directly
    }
  };

  // Features array
  const features = [
    {
      title: 'Rapid Speaking',
      description: 'Get detailed insights on your Speaking Skills',
      icon: <AnalyticsIcon sx={{ color: '#10B981' }} fontSize="large" />,
      path: '/publicspeaking',
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
      title: 'Practice Modules',
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
      {shouldRenderPopup && (
        <WelcomePopup 
          open={welcomePopupOpen}
          onClose={handleClosePopup}
          timer={popupTimer}
          onStayOpen={handleStayOpen}
          selectedTab={selectedTab}
          onTabChange={(e, newValue) => setSelectedTab(newValue)}
          userData={userData}
          theme={theme}
          features={features}
          showPopupPermanently={showPopupPermanently}
          onPopupPermanentChange={handlePopupPermanentChange}
          onTimerChange={setPopupTimer}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
              Welcome to <Box component="span" sx={{ color: theme.palette.primary.main }}>SpeechViber, </Box>
              {userData.name ? ` ${userData.name.split(' ')[0]}` : ' User'}
            </Typography>
          </Box>
    
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

          <Tooltip title="Logout">
            <Box>
              <IconButton 
                onClick={() => handleMenuAction('logout')}
                sx={{ 
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.1)
                  }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          </Tooltip>

            <Dialog
              open={logoutDialogOpen}
              onClose={() => setLogoutDialogOpen(false)}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  boxShadow: theme.shadows[5]
                }
              }}
            >
              <DialogTitle sx={{ pb: 1 }}>Confirm Logout</DialogTitle>
              <DialogContent>
                <Typography variant="body1">
                  Are you sure you want to log out? You will need to sign in again to access your account.
                </Typography>
              </DialogContent>
              <DialogActions sx={{ p: 2, pt: 1 }}>
                <Button 
                  onClick={() => setLogoutDialogOpen(false)}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                 Cancel
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="contained"
                  color="error"
                  sx={{ borderRadius: 2 }}
                >
                  Logout
                </Button>
              </DialogActions>
            </Dialog>



          <Tooltip title="Show Welcome Popup">
              <IconButton onClick={() => {
                    setShouldRenderPopup(true); // Add this line to enable rendering
                    setWelcomePopupOpen(true);
                    setPopupTimer(300); 
              }}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
      
          <Tooltip title="Account">
              <IconButton onClick={handleUserMenuOpen}>
                <Avatar 
                  src={userData?.photoURL}
                  alt={userData?.name || currentUser?.email}
                  sx={{ 
                    width: 40,
                    height: 40,
                    background: !userData?.photoURL && 
                      `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: theme.shadows[3],
                    cursor: 'pointer',
                    border: `2px solid ${theme.palette.primary.main}`
                  }}
                >
                  {!userData?.photoURL && (
                    userData?.name ? 
                      userData.name.charAt(0).toUpperCase() : 
                      currentUser?.email?.charAt(0).toUpperCase() || '?'
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
                  {userData.name ? ` ${userData.name.split(' ')[0]}` : ' User'}, Get AI-powered analysis and personalized feedback to improve your speaking abilities.
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
                    Interview Dashboard
                  </Typography>
                  <Chip 
                    label="Latest Interview" 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    sx={{ borderRadius: 1.5 }}
                  />
                </Box>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {[
                    { 
                      title: 'Overall Score', 
                      value: interviewResults?.overallScore || 0, 
                      icon: <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />,
                      color: theme.palette.primary.main
                    },
                    { 
                      title: 'Communication', 
                      value: interviewResults?.communication || 0,
                      icon: <RecordVoiceOverIcon sx={{ color: theme.palette.secondary.main }} />,
                      color: theme.palette.secondary.main
                    },
                    { 
                      title: 'Technical', 
                      value: interviewResults?.technical || 0,
                      icon: <SpeedIcon sx={{ color: '#10B981' }} />,
                      color: '#10B981'
                    },
                    { 
                      title: 'Confidence', 
                      value: interviewResults?.confidence || 0,
                      icon: <EmojiEventsIcon sx={{ color: '#F59E0B' }} />,
                      color: '#F59E0B'
                    },
                    { 
                      title: 'Cultural', 
                      value: interviewResults?.cultural || 0,
                      icon: <AutoStories sx={{ color: '#6366F1' }} />,
                      color: '#6366F1'
                    },
                    { 
                      title: 'Image', 
                      value: interviewResults?.imageAnalysis || 0,
                      icon: <PersonIcon sx={{ color: '#EC4899' }} />,
                      color: '#EC4899'
                    }
                  ].map((metric, index) => (
                    <Grid item xs={6} sm={4} key={index}>
                      <Box sx={{ textAlign: 'center' }}>
                        <CircularProgressContainer value={metric.value}>
                          <CircularProgressValue variant="h6">
                            {metric.value}
                          </CircularProgressValue>
                        </CircularProgressContainer>
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                          {metric.title}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight="500" sx={{ mb: 1 }}>
                    Comparative Improvement
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
                      {previousInterviewScore > 0 
                        ? ((interviewResults?.overallScore - previousInterviewScore) / previousInterviewScore * 100).toFixed(1)
                        : interviewResults?.overallScore > 0 ? '100' : '0'}%
                    </Typography>
                    {(interviewResults?.overallScore - (previousInterviewScore || 0)) >= 0 ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingUpIcon color="error" sx={{ transform: 'rotate(180deg)' }} />
                    )}
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={previousInterviewScore > 0 
                      ? Math.min(Math.max(((interviewResults?.overallScore - previousInterviewScore) / previousInterviewScore * 100), 0), 100)
                      : interviewResults?.overallScore || 0} 
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

            {/* Recent Activities - Optimized for small space */}
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1.5 }}>
                  Recent Activities
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : recentActivities.length > 0 ? (
                  <Stack spacing={1}>
                    {recentActivities.slice(0, 2).map((activity, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          py: 0.5
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            mr: 1.5,
                            bgcolor: `${activity.color}15`,
                            color: activity.color
                          }}
                        >
                          {activity.icon}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            fontWeight="500"
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {activity.description}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            {formatDate(activity.date)}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${activity.score}%`}
                          size="small"
                          sx={{
                            height: 24,
                            ml: 1,
                            bgcolor: `${activity.color}15`,
                            color: activity.color,
                            fontWeight: '500'
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ textAlign: 'center', py: 1 }}
                  >
                    No recent activities
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

            
                        {/* Random Practice Suggestions */}
                        <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Discover SpeechViber Activities
              </Typography>
              
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: 4 }}>
                  <Grid container spacing={4}>
                    {[
                      {  
                        title: 'Debate Mode', 
                        description: 'Master the art of persuasion', 
                        icon: <GroupsIcon sx={{ fontSize: 24 }}/>, 
                        path: '/DebateMode',
                        color: '#7C3AED',
                        tags: ['Interactive', 'Speaking'],    
                      },
                      { 
                        title: 'Grammar Fill', 
                        description: 'Practice articles and modals', 
                        icon: <EditIcon />, 
                        path: '/GrammarFill',
                        color: '#3B82F6',
                        tags: ['Interactive', 'Grammar'] 
                      },
                      { 
                        title: 'Expression Matcher', 
                        description: 'Master common phrases', 
                        icon: <TranslateIcon />, 
                        path: '/expressionmatcher',
                        color: '#10B981',
                        tags: ['Interactive', 'Vocabulary']
                      }
                    ].map((practice, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Box
                          onClick={() => navigate(practice.path)}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            cursor: 'pointer',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.3s ease',
                            border: `1px solid ${alpha(practice.color, 0.2)}`,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 4px 12px ${alpha(practice.color, 0.2)}`,
                              bgcolor: alpha(practice.color, 0.05)
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              sx={{
                                width: 48,
                                height: 45,
                                bgcolor: alpha(practice.color, 0.1),
                                color: practice.color,
                                mr: 2
                              }}
                            >
                              {practice.icon}
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="600">
                              {practice.title}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                            {practice.description}
                          </Typography>
                          
                          <Stack direction="row" spacing={1}>
                            {practice.tags.map((tag, tagIndex) => (
                              <Chip
                                key={tagIndex}
                                label={tag}
                                size="small"
                                sx={{
                                  bgcolor: alpha(practice.color, 0.1),
                                  color: practice.color,
                                  fontWeight: '500'
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/practice')}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        px: 4
                      }}
                    >
                      Explore All Activities
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>



          </Grid>
        </Grid>

        <Tooltip title={tooltipText} placement="top">
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 24,
              left: 24,
              background: 'linear-gradient(45deg, #7C3AED, #4F46E5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #6D31D9, #4338CA)',
              }
            }}
            onClick={() => navigate('/AIMentor')}
          >
            <SmartToyIcon />
          </Fab>
        </Tooltip>

      </motion.div>
      <Dialog 
        open={nameDialogOpen} 
        onClose={() => {}}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[5],
            width: '100%',
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Welcome to SpeechViber!</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please enter your name to get started:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            label="Your Name"
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={handleNameSubmit}
            variant="contained"
            disabled={!newName.trim()}
            sx={{ borderRadius: 2 }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;