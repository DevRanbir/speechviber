import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  
  const [historyData, setHistoryData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState({
    sessions: { target: 7, current: 0 },
    minutes: { target: 120, current: 0 }
  });
  const [metrics, setMetrics] = useState({
    averageScore: 0,
    totalSessions: 0,
    totalHours: 0,
    completedExercises: 0
  });
  
  // Calculate weekly stats
  const calculateWeeklyStats = (activities) => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const weeklyActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= weekStart;
    });

    const weeklyMinutes = weeklyActivities.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);
    
    setWeeklyGoals(prev => ({
      sessions: {
        ...prev.sessions,
        current: weeklyActivities.length
      },
      minutes: {
        ...prev.minutes,
        current: weeklyMinutes
      }
    }));
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    fetchUserData();
    fetchUserHistory();
  }, [currentUser, navigate]);

  // Helper functions
  const determineRank = (points) => {
    if (points >= 500) return { rank: 'Master', stage: 'Master' };
    if (points >= 300) return { rank: 'Advanced', stage: 'Advanced' };
    if (points >= 200) return { rank: 'Intermediate', stage: 'Intermediate' };
    if (points >= 45) return { rank: 'Beginner Plus', stage: 'Beginner Plus' };
    return { rank: 'Starter', stage: 'Starter' };
  };

  const calculateMetrics = (activities) => {
    const totalScore = activities.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
    const points = userData.achievements?.points || 0;
    const totalMinutes = points * 10; // Convert points to minutes (1 point = 10 minutes)
    const totalHours = (totalMinutes / 60).toFixed(2);
    const totalSessions = activities.length;
    
    return {
      averageScore: activities.length ? Math.round(totalScore / activities.length) : 0,
      totalHours: Number(totalHours), // Convert back to number to avoid string display
      totalSessions,
      achievementPoints: points,
      totalMinutes
    };
  };

  const fetchUserData = () => {
    const userRef = ref(database, `users/${currentUser.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      const points = data.profile?.achievements?.points || 0;
      const rankData = determineRank(points);
      // Calculate hours from stored minutes if available
      const totalMinutes = points * 10;
      const hours = (totalMinutes / 60).toFixed(2);

      // Update rank in database based on points
      update(ref(database, `users/${currentUser.uid}/profile/achievements`), {
        currentRank: rankData.rank.toLowerCase(),
        currentStage: rankData.stage
      });
      
      setUserData({
        name: data.name || currentUser.displayName || 'User',
        email: data.email || currentUser.email || '',
        avatar: data.photoURL || currentUser.photoURL || DEFAULT_AVATAR,
        profession: data.profile?.profession || 'Speech Professional',
        bio: data.profile?.bio || 'Share your speaking journey and expertise here.',
        stats: {
          sessions: data.profile?.stats?.sessions || 0,
          hours: Number(hours), // Convert to number
          audience: data.profile?.stats?.audience || 0,
          badges: data.profile?.stats?.badges || 0
        },
        achievements: {
          totalTime: totalMinutes,
          points: points,
          currentRank: rankData.rank.toLowerCase(),
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
      const achievementsRef = ref(database, `users/${currentUser.uid}/profile/achievements`);
  
      // First get achievements data
      onValue(achievementsRef, (achievementsSnapshot) => {
        const achievementsData = achievementsSnapshot.val() || {};
        const points = achievementsData.points || 0;
        
        // Then get history data
        onValue(historyRef, (snapshot) => {
          const data = snapshot.val() || {};
          
          const allActivities = Object.entries(data).map(([timestamp, timeData]) => {
            const activities = timeData.activities || {};
            return Object.entries(activities).map(([key, activity]) => ({
              type: activity.type || 'Practice Session',
              date: activity.date,
              description: activity.description,
              duration: parseInt(activity.duration) || 0,
              score: parseInt(activity.score) || 0,
              completed: activity.completed || false,
              id: activity.id,
              icon: getActivityIcon(activity.type)
            }));
          }).flat();
  
          allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          setHistoryData(allActivities);
          setRecentActivities(allActivities.slice(0, 5));
          
          // Calculate metrics using points from achievements
          const calculatedMetrics = {
            averageScore: allActivities.length ? 
              Math.round(allActivities.reduce((acc, curr) => acc + (curr.score || 0), 0) / allActivities.length) : 0,
            totalSessions: allActivities.length,
            totalHours: ((points * 10) / 60).toFixed(2), // Convert points to hours (1 point = 10 minutes)
            achievementPoints: points
          };
  
          setMetrics(calculatedMetrics);
          updateUserStats(allActivities, calculatedMetrics);
          calculateWeeklyStats(allActivities);
        });
      });
    } catch (error) {
      console.error("Error fetching history data:", error);
      setError("Failed to load history data");
    }
  };

  // Update the updateUserStats function
  const updateUserStats = (activities, calculatedMetrics) => {
    const totalMinutes = activities.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);
    const totalHours = Math.round(totalMinutes / 60);
    
    // Update both local state and database
    const updates = {
      [`users/${currentUser.uid}/profile/stats`]: {
        sessions: calculatedMetrics.totalSessions,
        hours: totalHours,
        totalMinutes: totalMinutes // Store raw minutes for accuracy
      }
    };
    
    // Update database
    update(ref(database), updates);
    
    // Update local state
    setUserData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        sessions: calculatedMetrics.totalSessions,
        hours: totalHours
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
  
  // Modify the handleSaveProfile function
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
      
      // Get current data first
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);
      const currentData = snapshot.val() || {};
      
      // Prepare updates while preserving existing data
      const updates = {
        name: editedUserData.name,
        photoURL: photoURL,
        profile: {
          ...currentData.profile, // Preserve existing profile data
          profession: editedUserData.profession,
          bio: editedUserData.bio,
        }
      };
      
      await update(ref(database, `users/${currentUser.uid}`), updates);
      
      setUserData(prev => ({
        ...prev, // Preserve all existing data
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

  // Helper functions
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
  
  const rankInfo = getRankInfo(userData.achievements?.currentRank || 'starter');
  const nextRankInfo = getRankInfo(getNextRank(userData.achievements?.currentRank || 'starter'));
  
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
                          label={`${metrics.totalHours || 0} hours of practice`}
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                            color: 'white',
                            '& .MuiChip-icon': { color: theme.palette.secondary.light }
                          }}
                        />
                        <Chip 
                          icon={<MicIcon fontSize="small" />} 
                          label={`${userData.stats?.sessions || 0} sessions`}
                          size={isMobile ? "small" : "medium"}
                          sx={{ 
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            color: 'white',
                            '& .MuiChip-icon': { color: theme.palette.success.light }
                          }}
                        />
                        
                        <Chip 
                          icon={<EmojiEventsIcon fontSize="small" />} 
                          label={`${userData.achievements?.currentStage || 'Novice'}`}
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
        
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <MetricCard>
                <TimelineIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold" color="white">
                  {metrics.totalSessions}
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Total Sessions
                </Typography>
              </MetricCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard>
                <AccessTimeIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold" color="white">
                  {metrics.totalHours}
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Hours of Practice
                </Typography>
              </MetricCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard>
                <BarChartIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold" color="white">
                  {metrics.averageScore}%
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Average Score
                </Typography>
              </MetricCard>
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard>
                <CheckCircleIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold" color="white">
                  {metrics.achievementPoints}
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Achievement Points
                </Typography>
              </MetricCard>
            </Grid>
          </Grid>
        </motion.div>
        
        {/* Rank Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 2 }}>
                <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Progress Tracking
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#1a2035', 0.7) }}>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="white">
                        Current Level: {rankInfo.name}
                      </Typography>
                      <Chip 
                        label={`${userData.achievements?.points || 0} points`} 
                        size="small"
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: 'white' }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          Next Level: {nextRankInfo.name}
                        </Typography>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          {Math.min(userData.achievements?.points || 0, nextRankInfo.pointsNeeded)}/{nextRankInfo.pointsNeeded}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(100, ((userData.achievements?.points || 0) / nextRankInfo.pointsNeeded) * 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                      Keep practicing to earn more points and unlock new ranks!
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#1a2035', 0.7) }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="white" sx={{ mb: 1 }}>
                      <CalendarTodayIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 'small' }} />
                      Weekly Goals
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          Sessions: {weeklyGoals.sessions.current}/{weeklyGoals.sessions.target}
                        </Typography>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          {Math.min(100, (weeklyGoals.sessions.current / weeklyGoals.sessions.target) * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(100, (weeklyGoals.sessions.current / weeklyGoals.sessions.target) * 100)}
                        color="secondary"
                        sx={{ height: 8, borderRadius: 4, mb: 2 }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          Minutes: {weeklyGoals.minutes.current}/{weeklyGoals.minutes.target}
                        </Typography>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          {Math.min(100, (weeklyGoals.minutes.current / weeklyGoals.minutes.target) * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(100, (weeklyGoals.minutes.current / weeklyGoals.minutes.target) * 100)}
                        color="success"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                      {weeklyGoals.sessions.current >= weeklyGoals.sessions.target && weeklyGoals.minutes.current >= weeklyGoals.minutes.target 
                        ? "Amazing! You've completed your weekly goals!"
                        : "Keep practicing to meet your weekly goals!"}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </motion.div>
        
        {/* Tabs for different sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Paper sx={{ mb: 3, backgroundColor: 'rgba(17, 25, 40, 0.75)', borderRadius: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="inherit"
              aria-label="profile tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <StyledTab 
                icon={<HeadsetMicIcon />} 
                label={isMobile ? "" : "History"} 
                iconPosition="start" 
              />
              <StyledTab 
                icon={<VisibilityIcon />} 
                label={isMobile ? "" : "Activities"} 
                iconPosition="start" 
              />
            </Tabs>
            
            {/* History Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 2 }}>
                  Practice History
                </Typography>
                
                <Paper sx={{ bgcolor: alpha('#1a2035', 0.7), borderRadius: 2, mb: 3 }}>
                  <Tabs
                    value={practiceTab}
                    onChange={(e, val) => setPracticeTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="inherit"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab label="Text" icon={<MenuBookIcon />} iconPosition="start" sx={{ color: 'white' }} />
                    <Tab label="Audio" icon={<MicIcon />} iconPosition="start" sx={{ color: 'white' }} />
                    <Tab label="Visual" icon={<VisibilityIcon />} iconPosition="start" sx={{ color: 'white' }} />
                  </Tabs>
                  
                  <Box sx={{ p: 2 }}>
                    {practiceTab === 0 && (
                      <TextualHistory history={historyData.filter(item => item.type !== 'Audio Practice')} />
                    )}
                    {practiceTab === 1 && (
                      <AudioHistory history={historyData.filter(item => item.type === 'Audio Practice')} />
                    )}
                    {practiceTab === 2 && (
                      <VisualHistory history={historyData} />
                    )}
                  </Box>
                </Paper>
              </Box>
            )}
            
            {/* Activities Tab */}
            {activeTab === 1 && (
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 2 }}>
                  Recent Activities
                </Typography>
                
                {recentActivities.length > 0 ? (
                  <List sx={{ bgcolor: alpha('#1a2035', 0.7), borderRadius: 2, p: 0 }}>
                    {recentActivities.map((activity, index) => (
                      <React.Fragment key={activity.id || index}>
                        <ActivityItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              {activity.icon}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'medium' }}>
                                {activity.type}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                <Typography variant="body2" component="span">
                                  {activity.description || 'Practice session'}
                                </Typography>
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 2, 
                                  mt: 0.5,
                                  flexWrap: 'wrap' 
                                }}>
                                  <Typography variant="caption" component="span">
                                    <AccessTimeIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                                    {activity.duration} min
                                  </Typography>
                                  <Typography variant="caption" component="span">
                                    <CalendarTodayIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                                    {formatDate(activity.date)}
                                  </Typography>
                                  {activity.score > 0 && (
                                    <Typography variant="caption" component="span">
                                      <BarChartIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                                      Score: {activity.score}%
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                        </ActivityItem>
                        {index < recentActivities.length - 1 && <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ 
                    bgcolor: alpha('#1a2035', 0.7), 
                    borderRadius: 2, 
                    p: 3, 
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    <Typography variant="body1">
                      No recent activities found.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Start practicing to see your activities here!
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ProfilePage;