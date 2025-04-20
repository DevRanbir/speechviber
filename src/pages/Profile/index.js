import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { motion } from 'framer-motion';
import LogoutIcon from '@mui/icons-material/Logout';
import { calculateRankAndStage, getRankInfo, getNextRank } from '../../services/achievementService';

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
import GroupIcon from '@mui/icons-material/Group';
import WorkIcon from '@mui/icons-material/Work';
import EmailIcon from '@mui/icons-material/Email';
import QuizIcon from '@mui/icons-material/Quiz';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import GradingIcon from '@mui/icons-material/Grading';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// Material UI Components
import { 
  Avatar, Box, Button, Card, CardContent, Container, CircularProgress, 
  Divider, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemText, 
  Paper, Tab, Tabs, TextField, Typography, Tooltip, Alert, Snackbar,
  Chip
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

// Styled components with glass morphism
const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(17, 25, 40, 0.75)',
  backdropFilter: 'blur(16px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.125)',
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'rgba(17, 25, 40, 0.75)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.125)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
  }
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
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
  }
}));

const ActivityItem = styled(ListItem)(({ theme }) => ({
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  }
}));

const AchievementCard = styled(GlassCard)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const rankInfo = getRankInfo(userData.achievements?.currentRank || 'starter');
  const nextRankInfo = getRankInfo(getNextRank(userData.achievements?.currentRank || 'starter'));


  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    fetchUserData();
    fetchUserHistory();

    // Set up a timer to increment points every 10 minutes
    const intervalId = setInterval(() => {
      setUserData(prev => {
        const newPoints = prev.achievements.points + 1;
        // Update points in the database
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
    }, 10 * 60 * 1000); // 10 minutes in milliseconds

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [currentUser, navigate, database]);
  
  const fetchUserData = () => {
    const userRef = ref(database, `users/${currentUser.uid}/profile`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      // Handle potential null or missing values with defaults
      setUserData({
        name: currentUser.displayName || 'User',
        email: currentUser.email || '',
        avatar: currentUser.photoURL || DEFAULT_AVATAR,
        profession: data.profession || 'Speech Professional',
        bio: data.bio || 'Share your speaking journey and expertise here.',
        stats: data.stats || {
          sessions: 0,
          hours: 0,
          audience: 0,
          badges: 0
        },
        achievements: data.achievements || {  // Add this section
          totalTime: 0,
          points: 0,
          currentRank: 'starter',
          currentStage: 'Novice'
        }
      });
      
      setEditedUserData({
        name: currentUser.displayName || 'User',
        email: currentUser.email || '',
        profession: data.profession || 'Speech Professional',
        bio: data.bio || 'Share your speaking journey and expertise here.',
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setError("Failed to load your profile data. Please try again later.");
      setLoading(false);
    });
  };

  // Add this section to render achievements
const renderAchievements = () => {
  const rankInfo = getRankInfo(userData.achievements?.currentRank || 'starter');
  const nextRankInfo = getRankInfo(getNextRank(userData.achievements?.currentRank || 'starter'));
  
  // Calculate hours, minutes, and seconds
  const totalMinutes = userData.achievements?.totalTime || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = userData.achievements?.totalSeconds || 0;
  
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3, backgroundColor: 'rgba(17, 25, 40, 0.75)' }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>Achievements</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <CardContent>
              <Typography variant="h6" color="primary">Current Rank</Typography>
              <Typography variant="h4" color="primary">
                {userData.achievements?.currentStage || 'Novice'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {rankInfo?.name || 'Starter'} Level
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <CardContent>
              <Typography variant="h6" color="primary">Total Time</Typography>
              <Typography variant="h4" color="primary">
                {hours}h {minutes}m {seconds}s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <CardContent>
              <Typography variant="h6" color="primary">Points</Typography>
              <Typography variant="h4" color="primary">
                {userData.achievements?.points || 0}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Next rank at {nextRankInfo?.pointsNeeded || 'MAX'} points
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};
  
  const getActivityIcon = (type) => {
    switch(type) {
      case 'Interview Practice': return <QuizIcon color="primary" />;
      case 'Word Power': return <SpellcheckIcon color="secondary" />;
      case 'Grammar Check': return <GradingIcon color="success" />;
      case 'FastTrack': return <MicIcon color="warning" />;
      case 'Debate': return <ChatIcon color="info" />;
      case 'Story': return <StoryIcon color="error" />;
      case 'Tongue Twister': return <MicIcon color="primary" />;
      default: return <MicIcon color="primary" />;
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
        badges: achievements.length
      }
    }));
  };

  const calculatePerformanceMetrics = (activities) => {
    const calculateAvg = (type) => {
      const typeActivities = activities.filter(item => item.type === type);
      if (!typeActivities.length) return 0;
      const sum = typeActivities.reduce((acc, item) => acc + (Number(item.score) || 0), 0);
      return Math.round(sum / typeActivities.length);
    };

    return [
      {
        name: 'Interview Practice',
        value: calculateAvg('Interview Practice'),
        icon: <QuizIcon color="primary" fontSize="large" />,
        color: 'primary',
        description: 'Based on interview sessions'
      },
      {
        name: 'Word Power',
        value: calculateAvg('Word Power'),
        icon: <SpellcheckIcon color="secondary" fontSize="large" />,
        color: 'secondary',
        description: 'Vocabulary mastery'
      },
      {
        name: 'Grammar Skills',
        value: calculateAvg('Grammar Check'),
        icon: <GradingIcon color="success" fontSize="large" />,
        color: 'success',
        description: 'Grammar assessment scores'
      },
      {
        name: 'Overall Progress',
        value: Math.round(activities.reduce((acc, item) => acc + (Number(item.score) || 0), 0) / activities.length || 0),
        icon: <TrendingUpIcon color="warning" fontSize="large" />,
        color: 'warning',
        description: 'Your overall speaking progress'
      }
    ];
  };

  

  const fetchUserHistory = () => {
    try {
      const historyRef = ref(database, `users/${currentUser.uid}/history/data`);
      onValue(historyRef, (snapshot) => {
        const data = snapshot.val() || {};
        
        // Convert activities into array format
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

        // Sort by date (newest first)
        allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Update states
        setHistoryData(allActivities);
        setRecentActivities(allActivities.slice(0, 5));
        
        // Calculate performance metrics
        const metrics = calculatePerformanceMetrics(allActivities);
        setPerformanceMetrics(metrics);
        
        // Update user stats
        updateUserStats(allActivities);
      });
    } catch (error) {
      console.error("Error fetching history data:", error);
      setError("Failed to load history data");
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
      // Cancel edit mode
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
      // Reset any previous avatar errors
      setAvatarError(false);
    }
  };
  
  const handleAvatarError = () => {
    // Set error state when avatar fails to load
    setAvatarError(true);
  };
  
  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update profile in Firebase Auth
      if (editedUserData.name !== userData.name) {
        await updateProfile(currentUser, {
          displayName: editedUserData.name
        });
      }
      
      // Upload new avatar if selected
      let photoURL = userData.avatar;
      if (avatarFile) {
        const avatarRef = storageRef(storage, `users/${currentUser.uid}/profile/avatar`);
        await uploadBytes(avatarRef, avatarFile);
        photoURL = await getDownloadURL(avatarRef);
        
        await updateProfile(currentUser, { photoURL });
      }
      
      // Update profile data in Realtime Database
      const updates = {
        profession: editedUserData.profession,
        bio: editedUserData.bio,
      };
      
      await update(ref(database, `users/${currentUser.uid}/profile`), updates);
      
      // Update local state
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

  const renderAchievementIcon = (iconName) => {
    switch(iconName) {
      case 'MicIcon': return <MicIcon fontSize="large" color="primary" />;
      case 'GradingIcon': return <GradingIcon fontSize="large" color="success" />;
      case 'SpellcheckIcon': return <SpellcheckIcon fontSize="large" color="secondary" />;
      default: return <EmojiEventsIcon fontSize="large" color="warning" />;
    }
  };
  
  // Get avatar source with error handling
  const getAvatarSrc = () => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (avatarError || !userData.avatar) return DEFAULT_AVATAR;
    return userData.avatar;
  };
  
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
      py: 4,
      px: { xs: 2, md: 3 },
      pr: { xs: 2, md: '90px' }  // Added right padding, matches with other pages
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'white' }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
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
            sx={{ mb: 3 }} 
            onClose={() => setError(null)}
            variant="filled"
            elevation={6}
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
          <GlassCard sx={{ mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={4} alignItems="center">
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
                          sx={{ cursor: 'pointer' }}
                          onError={handleAvatarError}
                        >
                          {/* Fallback for when image fails to load */}
                          {(avatarError || !userData.avatar) && userData.name?.charAt(0)}
                        </ProfileAvatar>
                        <IconButton 
                          sx={{ 
                            position: 'absolute', 
                            bottom: 10, 
                            right: 10, 
                            backgroundColor: 'white', 
                            '&:hover': { backgroundColor: '#eee' } 
                          }}
                          size="small"
                        >
                          <PhotoCameraIcon color="primary" />
                        </IconButton>
                      </label>
                    </Box>
                  ) : (
                    <ProfileAvatar 
                      alt={userData.name} 
                      src={getAvatarSrc()}
                      onError={handleAvatarError}
                    >
                      {/* Fallback content */}
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
                          rows={3}
                          name="bio"
                          label="Your Bio"
                          value={editedUserData.bio}
                          onChange={handleInputChange}
                          variant="outlined"
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
                      <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveProfile}
                          disabled={loading}
                          sx={{ borderRadius: 2 }}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleEditToggle}
                          sx={{ borderRadius: 2, color: 'white', borderColor: 'white' }}
                        >
                          Cancel
                        </Button>
                      </Grid>
                    </Grid>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                        {userData.name || 'Your Name'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<EditIcon />}
                          onClick={handleEditToggle}
                          sx={{ borderRadius: 2 }}
                        >
                          Edit Profile
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<LogoutIcon />}
                          onClick={async () => {
                            try {
                              await logout();
                              navigate('/auth');
                            } catch (error) {
                              console.error("Error logging out:", error);
                            }
                          }}
                          sx={{ 
                            borderRadius: 2,
                            borderColor: 'error.main',
                            color: 'error.main',
                            '&:hover': {
                              borderColor: 'error.dark',
                              backgroundColor: 'error.dark',
                              color: 'white'
                            }
                          }}
                        >
                          Logout
                        </Button>
                      </Box>
                      </Box>
                      
                      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', color: 'white' }}>
                        <WorkIcon sx={{ mr: 1 }} /> {userData.profession || 'Speech Professional'}
                      </Typography>
                      
                      <Typography variant="body1" sx={{ mb: 2, opacity: 0.9, color: 'rgba(255, 255, 255, 0.7)' }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                        {userData.email}
                      </Typography>
                      
                      <Typography variant="body1" sx={{ mt: 2, mb: 2, color: 'white' }}>
                        {userData.bio || 'Share your speaking journey and expertise here.'}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              {
                icon: <EmojiEventsIcon sx={{ fontSize: 40, color: '#60A5FA' }} />,
                value: userData.achievements?.currentStage || 'Novice',
                subValue: `${rankInfo?.name || 'Starter'} Level`,
                label: 'Current Rank'
              },
              {
                icon: <AccessTimeIcon sx={{ fontSize: 40, color: '#34D399' }} />,
                value: `${Math.floor((userData.achievements?.totalTime || 0) / 60)}h ${(userData.achievements?.totalTime || 0) % 60}m`,
                subValue: `${userData.achievements?.totalSeconds || 0}s`,
                label: 'Total Active Time'
              },
              {
                icon: getActivityIcon(recentActivities[0]?.type || 'Practice'),
                value: recentActivities[0]?.type || 'No Activity',
                label: 'Latest Activity',
                isActivity: true
              },
              {
                icon: <EmojiEventsIcon sx={{ fontSize: 40, color: '#FBBF24' }} />,
                value: userData.achievements?.points || 0,
                subValue: `Next: ${nextRankInfo?.pointsNeeded || 'MAX'} points`,
                label: 'Achievement Points'
              }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatsCard>
                    {stat.icon}
                    <Typography variant="h4" sx={{ mt: 2, color: 'white', fontWeight: 600 }}>
                      {stat.isActivity ? (
                        <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
                          {stat.value}
                        </Typography>
                      ) : (
                        stat.value
                      )}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {stat.label}
                    </Typography>
                    {stat.isActivity && recentActivities[0]?.date && (
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1 }}>
                        {formatDate(recentActivities[0].date)}
                      </Typography>
                    )}
                  </StatsCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Tabs Section */}
          <Paper 
            sx={{ 
              mb: 4, 
              background: 'rgba(17, 25, 40, 0.75)',
              backdropFilter: 'blur(16px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.125)'
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: 'white'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#60A5FA'
                }
              }}
            >
              <Tab icon={<BarChartIcon />} label="Performance" />
              <Tab icon={<TimelineIcon />} label="Activities" />
              <Tab icon={<EmojiEventsIcon />} label="Achievements" />
            </Tabs>
          </Paper>

          {/* Tab Content with Glass Effect */}
          <GlassCard>
            <CardContent sx={{ p: 4 }}>
              {/* Performance Tab */}
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: 'white' }}>
                    Your Speaking Performance
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {performanceMetrics.map((metric, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <GlassCard sx={{ height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              {metric.icon}
                              <Typography variant="h6" fontWeight="bold" sx={{ ml: 1, color: 'white' }}>
                                {metric.name}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ position: 'relative', width: '100%', height: '100px' }}>
                                <CircularProgress
                                  variant="determinate"
                                  value={metric.value}
                                  size={100}
                                  thickness={4}
                                  sx={{
                                    color: theme => theme.palette[metric.color].main,
                                    opacity: 0.8
                                  }}
                                />
                                <Typography
                                  variant="h4"
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {metric.value}%
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                                {metric.description}
                              </Typography>
                            </CardContent>
                          </GlassCard>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Activities Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, color: 'white', fontWeight: 'bold' }}>
                      Recent Activities
                    </Typography>
                    <List>
                      {recentActivities.map((activity, index) => (
                        <React.Fragment key={index}>
                          <ActivityItem>
                            <ListItemAvatar>
                              {activity.icon}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ color: 'white' }}>
                                  {activity.type}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  {activity.description}
                                </Typography>
                              }
                            />
                            <Chip
                              label={formatDate(activity.date)}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                                color: '#60A5FA',
                                ml: 2
                              }}
                            />
                          </ActivityItem>
                          {index < recentActivities.length - 1 && (
                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Achievements Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, color: 'white', fontWeight: 'bold' }}>
                      Your Achievements
                    </Typography>
                    {renderAchievements()}  {/* Move this outside the achievement cards loop */}
                    <Grid container spacing={3} sx={{ mt: 3 }}>
                      {achievements.map((achievement, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <AchievementCard>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                {renderAchievementIcon(achievement.icon)}
                                <Box sx={{ ml: 2 }}>
                                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {achievement.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    {formatDate(achievement.date)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {achievement.description}
                              </Typography>
                            </CardContent>
                          </AchievementCard>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>
        </Container>
      </Box>
    );
};

export default ProfilePage;