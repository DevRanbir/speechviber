import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { motion } from 'framer-motion';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MicIcon from '@mui/icons-material/Mic';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WorkIcon from '@mui/icons-material/Work';
import EmailIcon from '@mui/icons-material/Email';
import QuizIcon from '@mui/icons-material/Quiz';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import GradingIcon from '@mui/icons-material/Grading';
import ChatIcon from '@mui/icons-material/Chat';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';

// Material UI Components
import { 
  Avatar, Box, Button, Card, CardContent, Container, CircularProgress, 
  Divider, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemText, 
  Paper, Tab, Tabs, TextField, Typography, Tooltip, Alert, Snackbar,
  Chip, useMediaQuery, useTheme, LinearProgress
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

import TextualHistory from '../History/components/TextualHistory';
import AudioHistory from '../History/components/AudioHistory';
import VisualHistory from '../History/components/VisualHistory';

// Styled components with glass morphism
const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(17, 25, 40, 0.75)',
  backdropFilter: 'blur(16px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.125)',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'rgba(17, 25, 40, 0.75)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.125)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
  }
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[8],
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 64,
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.7)',
  '&.Mui-selected': {
    color: 'white'
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: 'auto',
    padding: theme.spacing(1),
    fontSize: '0.75rem',
  }
}));

const ActivityItem = styled(ListItem)(({ theme }) => ({
  transition: 'background-color 0.2s ease',
  flexWrap: 'wrap',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  }
}));

// Default avatar placeholder
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=150";

// Main component
const ProfilePage = () => {
  useErrorBoundary();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const database = getDatabase();
  const storage = getStorage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State variables
  const [userData, setUserData] = useState({
    name: '',
    profession: '',
    avatar: '',
    bio: '',
    email: '',
    stats: {
      sessions: 0,
      hours: 0,
      audience: 0,
      badges: 0
    },
    achievements: {
      totalTime: 0,
      points: 0,
      currentRank: 'starter',
      currentStage: 'Novice'
    }
  });

  const [editMode, setEditMode] = useState(false);
  const [editedUserData, setEditedUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [practiceTab, setPracticeTab] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [mostRecentActivity, setMostRecentActivity] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const rankInfo = getRankInfo(userData.achievements?.currentRank || 'starter');
  const nextRankInfo = getRankInfo(getNextRank(userData.achievements?.currentRank || 'starter'));

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    fetchUserData();
    fetchUserHistory();

    // Points calculation logic and interval
    const calculatePoints = () => {
      const totalMinutes = userData.achievements?.totalTime || 0;
      const totalHours = totalMinutes / 60;
      const timeBasedPoints = Math.floor(totalHours * 10);
      
      if (currentUser && timeBasedPoints > 0) {
        update(ref(database, `users/${currentUser.uid}/profile/achievements`), {
          points: timeBasedPoints
        });
        
        setUserData(prev => ({
          ...prev,
          achievements: {
            ...prev.achievements,
            points: timeBasedPoints
          }
        }));
      }
    };

    calculatePoints();

    const intervalId = setInterval(() => {
      setUserData(prev => {
        const newPoints = prev.achievements.points + 1;
        update(ref(database, `users/${currentUser.uid}/profile/achievements`), {
          points: newPoints
        });
        return {
          ...prev,
          achievements: {
            ...prev.achievements,
            points: newPoints
          }
        };
      });
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [currentUser, navigate, database, userData.achievements?.totalTime]);

  // Helper functions
  const determineRank = (points) => {
    if (points >= 500) return { rank: 'Master', stage: 'Expert' };
    if (points >= 300) return { rank: 'Advanced', stage: 'Professional' };
    if (points >= 200) return { rank: 'Intermediate', stage: 'Skilled' };
    if (points >= 45) return { rank: 'Beginner Plus', stage: 'Improving' };
    return { rank: 'Starter', stage: 'Novice' };
  };

  const fetchUserData = () => {
    const userRef = ref(database, `users/${currentUser.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      const points = data.profile?.achievements?.points || 0;
      const rankData = determineRank(points);

      update(ref(database, `users/${currentUser.uid}/profile/achievements`), {
        currentRank: rankData.rank,
        currentStage: rankData.stage
      });
      
      setUserData({
        name: data.name || currentUser.displayName || 'User',
        email: data.email || currentUser.email || '',
        avatar: data.photoURL || currentUser.photoURL || DEFAULT_AVATAR,
        profession: data.profile?.profession || 'Speech Professional',
        bio: data.profile?.bio || 'Share your speaking journey and expertise here.',
        stats: data.profile?.stats || {
          sessions: 0,
          hours: 0,
          audience: 0,
          badges: 0
        },
        achievements: {
          totalTime: data.profile?.achievements?.totalTime || 0,
          points: points,
          currentRank: rankData.rank,
          currentStage: rankData.stage
        }
      });
      
      setEditedUserData({
        name: data.name || currentUser.displayName || 'User',
        email: data.email || currentUser.email || '',
        profession: data.profile?.profession || 'Speech Professional',
        bio: data.profile?.bio || 'Share your speaking journey and expertise here.',
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setError("Failed to load your profile data. Please try again later.");
      setLoading(false);
    });
  };

  const fetchUserHistory = () => {
    try {
      const historyRef = ref(database, `users/${currentUser.uid}/history/data`);
      onValue(historyRef, (snapshot) => {
        const data = snapshot.val() || {};
        
        const allActivities = Object.entries(data).map(([timestamp, timeData]) => {
          const activities = timeData.activities || {};
          return Object.entries(activities).map(([key, activity]) => ({
            type: activity.type || 'Practice Session',
            date: activity.date,
            description: activity.description,
            duration: activity.duration,
            score: activity.score || 0,
            id: activity.id,
            icon: getActivityIcon(activity.type)
          }));
        }).flat();

        allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setHistoryData(allActivities);
        setRecentActivities(allActivities.slice(0, 5));
        setMostRecentActivity(allActivities[0] || null);
        
        // Calculate average score
        if (allActivities.length > 0) {
          const totalScore = allActivities.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
          setAverageScore(Math.round(totalScore / allActivities.length));
        }
        
        updateUserStats(allActivities);
      });
    } catch (error) {
      console.error("Error fetching history data:", error);
      setError("Failed to load history data");
    }
  };

  const updateUserStats = (activities) => {
    const totalSessions = activities.length;
    const totalMinutes = activities.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);
    const estimatedHours = Math.round(totalMinutes / 60);

    setUserData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        sessions: totalSessions,
        hours: estimatedHours,
        badges: 0
      }
    }));
  };
    
  const getActivityIcon = (type) => {
    switch(type) {
      case 'Interview Practice': return <QuizIcon color="primary" />;
      case 'Word Power': return <SpellcheckIcon color="secondary" />;
      case 'Grammar Check': return <GradingIcon color="success" />;
      case 'FastTrack': return <MicIcon color="warning" />;
      case 'Debate': return <ChatIcon color="info" />;
      case 'Story': return <MenuBookIcon color="error" />;
      case 'Tongue Twister': return <MicIcon color="primary" />;
      default: return <MicIcon color="primary" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleEditToggle = () => {
    if (editMode) {
      setEditedUserData({
        name: userData.name,
        email: userData.email,
        profession: userData.profession,
        bio: userData.bio,
      });
    }
    setEditMode(!editMode);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarError(false);
    }
  };
  
  const handleAvatarError = () => {
    setAvatarError(true);
  };
  
  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (editedUserData.name !== userData.name) {
        await updateProfile(currentUser, {
          displayName: editedUserData.name
        });
      }
      
      let photoURL = userData.avatar;
      if (avatarFile) {
        const avatarRef = storageRef(storage, `users/${currentUser.uid}/profile/avatar`);
        await uploadBytes(avatarRef, avatarFile);
        photoURL = await getDownloadURL(avatarRef);
        
        await updateProfile(currentUser, { photoURL });
      }
      
      const updates = {
        name: editedUserData.name,
        email: currentUser.email,
        photoURL: photoURL,
        profile: {
          ...userData.profile,
          profession: editedUserData.profession,
          bio: editedUserData.bio,
        }
      };
      
      await update(ref(database, `users/${currentUser.uid}`), updates);
      
      setUserData(prev => ({
        ...prev,
        name: editedUserData.name,
        profession: editedUserData.profession,
        bio: editedUserData.bio,
        avatar: photoURL
      }));
      
      setSuccessMessage('Profile updated successfully!');
      setSnackbarOpen(true);
      setEditMode(false);
      setAvatarFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Get avatar source with error handling
  const getAvatarSrc = () => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (avatarError || !userData.avatar) return DEFAULT_AVATAR;
    return userData.avatar;
  };
  
  // Function to get proper size for avatar based on screen size
  const getAvatarSize = () => {
    return isMobile ? { width: 100, height: 100 } : { width: 150, height: 150 };
  };

  // Helper functions that should be implemented elsewhere but are referenced
  function getRankInfo(rank) {
    const ranks = {
      'starter': { name: 'Starter', pointsNeeded: 0 },
      'beginner plus': { name: 'Beginner Plus', pointsNeeded: 45 },
      'intermediate': { name: 'Intermediate', pointsNeeded: 200 },
      'advanced': { name: 'Advanced', pointsNeeded: 300 },
      'master': { name: 'Master', pointsNeeded: 500 }
    };
    return ranks[rank.toLowerCase()] || ranks['starter'];
  }
  
  function getNextRank(currentRank) {
    const rankOrder = ['starter', 'beginner plus', 'intermediate', 'advanced', 'master'];
    const currentIndex = rankOrder.indexOf(currentRank.toLowerCase());
    
    if (currentIndex === -1 || currentIndex === rankOrder.length - 1) {
      return 'master'; // Return highest rank if current rank not found or already at highest
    }
    
    return rankOrder[currentIndex + 1];
  }
  
  if (loading && !userData.name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1f29 0%, #2d3748 100%)',
      py: { xs: 2, md: 4 },
      px: { xs: 1, md: 3 },
      overflowX: 'hidden',
      // Leave space for sidebar
      maxWidth: { sm: '100%', md: 'calc(100% - 80px)' }
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'white' }}
            size={isMobile ? "small" : "medium"}
          >
            Back
          </Button>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 600 }}>
            Profile
          </Typography>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity="success" 
            variant="filled" 
            elevation={6}
          >
            {successMessage}
          </Alert>
        </Snackbar>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }} 
            onClose={() => setError(null)}
            variant="filled"
          >
            {error}
          </Alert>
        )}
        
        {/* Profile Header with Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={isMobile ? 2 : 4} alignItems="center">
                <Grid item xs={12} md={4} sx={{ 
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {editMode ? (
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <input
                        accept="image/*"
                        id="avatar-upload"
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                      />
                      <label htmlFor="avatar-upload">
                        <ProfileAvatar 
                          alt={userData.name} 
                          src={getAvatarSrc()}
                          sx={{ 
                            cursor: 'pointer',
                            ...getAvatarSize() 
                          }}
                          onError={handleAvatarError}
                        >
                          {(avatarError || !userData.avatar) && userData.name?.charAt(0)}
                        </ProfileAvatar>
                        <IconButton 
                          sx={{ 
                            position: 'absolute', 
                            bottom: 10, 
                            right: 10, 
                            backgroundColor: 'white', 
                            '&:hover': { backgroundColor: '#eee' },
                            width: isMobile ? 30 : 36,
                            height: isMobile ? 30 : 36
                          }}
                          size="small"
                        >
                          <PhotoCameraIcon color="primary" fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </label>
                    </Box>
                  ) : (
                    <ProfileAvatar 
                      alt={userData.name} 
                      src={getAvatarSrc()}
                      sx={getAvatarSize()}
                      onError={handleAvatarError}
                    >
                      {(avatarError || !userData.avatar) && userData.name?.charAt(0)}
                    </ProfileAvatar>
                  )}
                </Grid>
                
                <Grid item xs={12} md={8}>
                  {editMode ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name="name"
                          label="Name"
                          value={editedUserData.name}
                          onChange={handleInputChange}
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name="profession"
                          label="Professional Title"
                          value={editedUserData.profession}
                          onChange={handleInputChange}
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={isMobile ? 2 : 3}
                          name="bio"
                          label="Your Bio"
                          value={editedUserData.bio}
                          onChange={handleInputChange}
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveProfile}
                          disabled={loading}
                          size={isMobile ? "small" : "medium"}
                          sx={{ borderRadius: 2 }}
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleEditToggle}
                          size={isMobile ? "small" : "medium"}
                          sx={{ borderRadius: 2, color: 'white', borderColor: 'white' }}
                        >
                          Cancel
                        </Button>
                      </Grid>
                    </Grid>
                  ) : (
                    <>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 0 }
                      }}>
                        <Typography 
                          variant={isMobile ? "h5" : "h4"} 
                          fontWeight="bold" 
                          gutterBottom 
                          sx={{ color: 'white', mb: 1 }}
                        >
                          {userData.name || 'Your Name'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Profile">
                            <IconButton 
                              onClick={handleEditToggle}
                              sx={{ 
                                color: 'white',
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                }
                              }}
                              size={isMobile ? "small" : "medium"}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Logout">
                            <IconButton 
                              onClick={logout}
                              sx={{ 
                                color: 'white',
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                                }
                              }}
                              size={isMobile ? "small" : "medium"}
                            >
                              <LogoutIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Typography 
                        variant="subtitle1" 
                        color="primary.light" 
                        gutterBottom
                        sx={{ mb: 1 }}
                      >
                        <WorkIcon 
                          fontSize="small" 
                          sx={{ verticalAlign: 'middle', mr: 0.5 }} 
                        />
                        {userData.profession || 'Speech Professional'}
                      </Typography>
                      
                      <Typography 
                        variant="body1" 
                        gutterBottom 
                        sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}
                      >
                        {userData.bio || 'Share your speaking journey and expertise here.'}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 1, sm: 2 }, 
                        flexWrap: 'wrap', 
                        mt: 1 
                      }}>
                        <Chip 
                          icon={<EmailIcon fontSize="small" />} 
                          label={userData.email || 'email@example.com'} 
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: 'white',
                            '& .MuiChip-icon': { color: theme.palette.primary.light }
                          }}
                        />
                        
                        <Chip 
                          icon={<AccessTimeIcon fontSize="small" />} 
                          label={`${userData.stats?.hours || 0} hours of practice`}
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                            color: 'white',
                            '& .MuiChip-icon': { color: theme.palette.secondary.light }
                          }}
                        />
                        
                        <Chip 
                          icon={<EmojiEventsIcon fontSize="small" />} 
                          label={`${userData.achievements?.points || 0} points`}
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            backgroundColor: alpha(theme.palette.warning.main, 0.1),
                            color: 'white',
                            '& .MuiChip-icon': { color: theme.palette.warning.light }
                          }}
                        />
                      </Box>
                    </>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </motion.div>
        
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
              <MetricCard>
                <EmojiEventsIcon sx={{ fontSize: 38, color: theme.palette.warning.main, mb: 1 }} />
                <Typography variant="h5" color="white" fontWeight="bold">
                  {averageScore || 0}%
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Avg. Score
                </Typography>
              </MetricCard>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <MetricCard>
                <TrendingUpIcon sx={{ fontSize: 38, color: theme.palette.primary.main, mb: 1 }} />
                <Typography variant="h5" color="white" fontWeight="bold">
                  {userData.stats?.sessions || 0}
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Sessions
                </Typography>
              </MetricCard>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <MetricCard>
                <AccessTimeIcon sx={{ fontSize: 38, color: theme.palette.secondary.main, mb: 1 }} />
                <Typography variant="h5" color="white" fontWeight="bold">
                  {userData.stats?.hours || 0}
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Hours
                </Typography>
              </MetricCard>
            </Grid>
            
          </Grid>
        </motion.div>
        
        {/* Progress and Rank */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="white" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon sx={{ mr: 1 }} /> Progress & Ranking
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="primary.light">
                          {userData.achievements?.points || 0} points
                        </Typography>
                        <Typography variant="body2" color="primary.light">
                          Next: {nextRankInfo.name} ({nextRankInfo.pointsNeeded} pts)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(
                          ((userData.achievements?.points || 0) / nextRankInfo.pointsNeeded) * 100, 
                          100
                        )} 
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: 5
                          }
                        }} 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                      <EmojiEventsIcon color="warning" />
                      <Box>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          Current rank
                        </Typography>
                        <Typography variant="h6" color="white" fontWeight="bold">
                          {userData.achievements?.currentRank || 'Starter'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" color="white" sx={{ mb: 1 }}>
                  <span style={{ fontWeight: 'bold' }}>Stage:</span> {userData.achievements?.currentStage || 'Novice'}
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Keep practicing to reach the next stage! You need {nextRankInfo.pointsNeeded - (userData.achievements?.points || 0)} more points to advance.
                </Typography>
              </Box>
            </CardContent>
          </GlassCard>
        </motion.div>
        
        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard>
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="profile tabs"
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              >
                <StyledTab label="Overview" icon={<BarChartIcon />} id="tab-0" />
                <StyledTab label="Practice History" icon={<HeadsetMicIcon />} id="tab-1" />
                <StyledTab label="Activity Feed" icon={<CalendarTodayIcon />} id="tab-2" />
              </Tabs>
            </Box>
            
            {/* Overview Tab */}
            {activeTab === 0 && (
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {/* Recent Activity */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" color="white" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon sx={{ mr: 1 }} /> Recent Activity
                  </Typography>
                  
                  {recentActivities.length === 0 ? (
                    <Paper 
                      sx={{ 
                        p: 3, 
                        textAlign: 'center', 
                        backgroundColor: 'rgba(17, 25, 40, 0.75)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.125)',
                      }}
                    >
                      <Typography color="white">
                        No recent activities found. Start practicing to see your progress!
                      </Typography>
                    </Paper>
                  ) : (
                    <List>
                      {recentActivities.map((activity, index) => (
                        <ActivityItem key={index} divider={index < recentActivities.length - 1}>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                                color: theme.palette.primary.main
                              }}
                            >
                              {activity.icon}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" color="white">
                                {activity.type || 'Practice Session'}
                              </Typography>
                            }
                            secondary={
                              <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {activity.description || 'No description available'} • {formatDate(activity.date)}
                              </Box>
                            }
                          />
                          <Box sx={{ 
                            ml: { xs: 0, sm: 2 }, 
                            mt: { xs: 1, sm: 0 }, 
                            width: { xs: '100%', sm: 'auto' } 
                          }}>
                            <Chip 
                              size="small" 
                              label={`${activity.duration || 0} mins`}
                              sx={{ 
                                mr: 1, 
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.light
                              }}
                            />
                            {activity.score && (
                              <Chip 
                                size="small" 
                                label={`Score: ${activity.score}%`}
                                sx={{ 
                                  backgroundColor: activity.score >= 80 
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : activity.score >= 50
                                      ? alpha(theme.palette.warning.main, 0.1)
                                      : alpha(theme.palette.error.main, 0.1),
                                  color: activity.score >= 80 
                                    ? theme.palette.success.light
                                    : activity.score >= 50
                                      ? theme.palette.warning.light
                                      : theme.palette.error.light
                                }}
                              />
                            )}
                          </Box>
                        </ActivityItem>
                      ))}
                    </List>
                  )}
                </Box>
                            
                {/* Goal Setting */}
                <Box>
                  <Typography variant="h6" color="white" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimelineIcon sx={{ mr: 1 }} /> Your Goals
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: 'rgba(17, 25, 40, 0.6)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Weekly Practice Goals
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              Sessions (3 / 7)
                            </Typography>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              43%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={43} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: alpha(theme.palette.primary.main, 0.2),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: theme.palette.primary.main,
                                borderRadius: 4
                              }
                            }} 
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              Practice Time (45 / 120 mins)
                            </Typography>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              38%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={38} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: theme.palette.secondary.main,
                                borderRadius: 4
                              }
                            }} 
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              </CardContent>
            )}
            
            {/* Practice History Tab */}
            {activeTab === 1 && (
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Paper
                  sx={{
                    backgroundColor: 'rgba(17, 25, 40, 0.5)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    p: { xs: 1, sm: 2 },
                    mb: 3
                  }}
                >
                  <Tabs
                    value={practiceTab}
                    onChange={(e, newValue) => setPracticeTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="practice history tabs"
                    sx={{
                      '& .MuiTabs-indicator': {
                        backgroundColor: theme.palette.secondary.main,
                      },
                    }}
                  >
                    <Tab label="All History" sx={{ color: 'white' }} />
                    <Tab label="Textual" sx={{ color: 'white' }} />
                    <Tab label="Audio" sx={{ color: 'white' }} />
                    <Tab label="Visual" sx={{ color: 'white' }} />
                  </Tabs>
                </Paper>
                
                {practiceTab === 0 && (
                  <Box>
                    {historyData.length === 0 ? (
                      <Paper 
                        sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          backgroundColor: 'rgba(17, 25, 40, 0.75)',
                          backdropFilter: 'blur(16px)',
                        }}
                      >
                        <Typography color="white">
                          No practice history found. Start practicing to build your history!
                        </Typography>
                      </Paper>
                    ) : (
                      <List>
                        {historyData.map((activity, index) => (
                          <ActivityItem key={index} divider={index < historyData.length - 1}>
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  color: theme.palette.primary.main
                                }}
                              >
                                {activity.icon}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" color="white">
                                  {activity.type || 'Practice Session'}
                                </Typography>
                              }
                              secondary={
                                <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  {activity.description || 'No description available'} • {formatDate(activity.date)}
                                </Box>
                              }
                            />
                            <Box sx={{ 
                              ml: { xs: 0, sm: 2 }, 
                              mt: { xs: 1, sm: 0 }, 
                              width: { xs: '100%', sm: 'auto' } 
                            }}>
                              <Chip 
                                size="small" 
                                label={`${activity.duration || 0} mins`}
                                sx={{ 
                                  mr: 1, 
                                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                                  color: theme.palette.info.light
                                }}
                              />
                              {activity.score && (
                                <Chip 
                                  size="small" 
                                  label={`Score: ${activity.score}%`}
                                  sx={{ 
                                    backgroundColor: activity.score >= 80 
                                      ? alpha(theme.palette.success.main, 0.1)
                                      : activity.score >= 50
                                        ? alpha(theme.palette.warning.main, 0.1)
                                        : alpha(theme.palette.error.main, 0.1),
                                    color: activity.score >= 80 
                                      ? theme.palette.success.light
                                      : activity.score >= 50
                                        ? theme.palette.warning.light
                                        : theme.palette.error.light
                                  }}
                                />
                              )}
                            </Box>
                          </ActivityItem>
                        ))}
                      </List>
                    )}
                  </Box>
                )}
                
                {practiceTab === 1 && <TextualHistory historyData={historyData.filter(h => h.type === 'Grammar Check' || h.type === 'Word Power')} />}
                {practiceTab === 2 && <AudioHistory historyData={historyData.filter(h => h.type === 'FastTrack' || h.type === 'Tongue Twister')} />}
                {practiceTab === 3 && <VisualHistory historyData={historyData.filter(h => h.type === 'Interview Practice' || h.type === 'Debate')} />}
              </CardContent>
            )}
            
            {/* Activity Feed Tab */}
            {activeTab === 2 && (
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="white">
                    Activity Timeline
                  </Typography>
                  <Button variant="outlined" size="small" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                    Filter
                  </Button>
                </Box>
                
                {historyData.length === 0 ? (
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      backgroundColor: 'rgba(17, 25, 40, 0.75)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <Typography color="white">
                      No activities found. Use the app to see your activity feed grow!
                    </Typography>
                  </Paper>
                ) : (
                  <List sx={{ 
                    backgroundColor: 'rgba(17, 25, 40, 0.5)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                  }}>
                    {historyData.map((activity, index) => (
                      <React.Fragment key={index}>
                        <ActivityItem>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                                color: theme.palette.primary.main
                              }}
                            >
                              {activity.icon}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" color="white">
                                {activity.type || 'Practice Session'}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography component="span" variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                                  {activity.description || 'No description available'}
                                </Typography>
                                <Typography component="span" variant="caption" sx={{ color: 'primary.light' }}>
                                  {formatDate(activity.date)}
                                </Typography>
                              </Box>
                            }
                          />
                          <Box sx={{ 
                            ml: { xs: 0, sm: 2 }, 
                            mt: { xs: 1, sm: 0 }, 
                            width: { xs: '100%', sm: 'auto' },
                            display: 'flex',
                            flexDirection: { xs: 'row', sm: 'column' },
                            alignItems: { xs: 'flex-start', sm: 'flex-end' },
                            gap: 1
                          }}>
                            <Chip 
                              size="small" 
                              label={`${activity.duration || 0} mins`}
                              sx={{ 
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.light
                              }}
                            />
                            {activity.score && (
                              <Chip 
                                size="small" 
                                label={`Score: ${activity.score}%`}
                                sx={{ 
                                  backgroundColor: activity.score >= 80 
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : activity.score >= 50
                                      ? alpha(theme.palette.warning.main, 0.1)
                                      : alpha(theme.palette.error.main, 0.1),
                                  color: activity.score >= 80 
                                    ? theme.palette.success.light
                                    : activity.score >= 50
                                      ? theme.palette.warning.light
                                      : theme.palette.error.light
                                }}
                              />
                            )}
                          </Box>
                        </ActivityItem>
                        {index < historyData.length - 1 && (
                          <Divider variant="inset" component="li" sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            )}
          </GlassCard>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ProfilePage;