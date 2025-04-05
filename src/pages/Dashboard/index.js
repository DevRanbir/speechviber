import React, { useState } from 'react';
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
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

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
  const theme = useTheme();
  const navigate = useNavigate();
  const [notifications] = useState(3);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const features = [
    {
      title: 'Practice Mode',
      description: 'Enhance your skills with guided exercises',
      icon: <MicIcon color="primary" fontSize="large" />,
      path: '/practice',
      color: theme.palette.primary.main,
      delay: 0.1
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
      title: 'Speech Analysis',
      description: 'Get detailed insights on your performance',
      icon: <AnalyticsIcon sx={{ color: '#10B981' }} fontSize="large" />,
      path: '/analysis',
      color: '#10B981',
      delay: 0.3
    },
    {
      title: 'Progress Tracker',
      description: 'Monitor your improvement over time',
      icon: <HistoryIcon sx={{ color: '#F59E0B' }} fontSize="large" />,
      path: '/history',
      color: '#F59E0B',
      delay: 0.4
    }
  ];

  const progressMetrics = [
    { 
      title: 'Overall Score', 
      value: 85, 
      icon: <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main
    },
    { 
      title: 'Clarity', 
      value: 75, 
      icon: <RecordVoiceOverIcon sx={{ color: theme.palette.secondary.main }} />,
      color: theme.palette.secondary.main
    },
    { 
      title: 'Fluency', 
      value: 90, 
      icon: <SpeedIcon sx={{ color: '#10B981' }} />,
      color: '#10B981'
    }
  ];

  const recentActivities = [
    {
      title: 'Mock Interview - Software Engineer',
      time: '15 minutes ago',
      icon: <MicIcon />,
      color: theme.palette.primary.main,
      completed: true
    },
    {
      title: 'Quick Analysis - Presentation',
      time: '18 minutes ago',
      icon: <SpeedIcon />,
      color: theme.palette.secondary.main,
      completed: true
    },
    {
      title: 'Practice Session - Public Speaking',
      time: '1 hour ago',
      icon: <RecordVoiceOverIcon />,
      color: '#10B981',
      completed: true
    }
  ];

  const achievements = [
    {
      title: '5-Day Streak',
      icon: <EmojiEventsIcon sx={{ color: '#F59E0B', fontSize: 32 }} />
    },
    {
      title: 'Speech Master',
      icon: <StarIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
    },
    {
      title: 'First Analysis',
      icon: <CheckCircleIcon sx={{ color: '#10B981', fontSize: 32 }} />
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
              Let's improve your communication skills today
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Notifications">
              <IconButton>
                <Badge badgeContent={notifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Avatar 
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: theme.shadows[3]
              }}
            >
              U
            </Avatar>
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
              background: 'url("https://placeholder.com/800x400") no-repeat center center',
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
                  
                  <Typography variant="h3" sx={{ mb: 2, color: 'white', fontWeight: 700 }}>
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
                  {progressMetrics.map((metric, index) => (
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
                      +15%
                    </Typography>
                    <TrendingUpIcon color="success" />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={65} 
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

                <Typography variant="body2" sx={{ mb: 2 }}>
                  Practice "diaphragmatic breathing" to support your voice. Breathe deeply from your 
                  diaphragm rather than your chest for better speech control and reduced nervousness.
                </Typography>

                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />} 
                  sx={{ color: theme.palette.secondary.main }}
                >
                  More Tips
                </Button>
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
                <Grid item xs={12} sm={6} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: feature.delay }}
                    style={{ height: '100%' }}
                  >
                    <FeatureCard 
                      elevation={0} 
                      onClick={() => handleNavigation(feature.path)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Avatar 
                          sx={{ 
                            mb: 2, 
                            width: 56, 
                            height: 56,
                            bgcolor: `${feature.color}15`,
                            color: feature.color
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                        
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                          {feature.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {feature.description}
                        </Typography>
                        
                        <Button 
                          size="small" 
                          sx={{ color: feature.color }}
                          endIcon={<ArrowForwardIcon />}
                        >
                          Explore
                        </Button>
                      </CardContent>
                    </FeatureCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Recent Activity and Achievements */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card elevation={0} sx={{ borderRadius: 3, mb: { xs: 3, md: 0 }, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Recent Activity
                      </Typography>
                      <Button size="small" endIcon={<ArrowForwardIcon />}>
                        View All
                      </Button>
                    </Box>

                    <Divider sx={{ mb: 2 }} />
                    
                    <Stack spacing={1}>
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
                            <Typography variant="body1" fontWeight="500">
                              {activity.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activity.time}
                            </Typography>
                          </Box>
                          {activity.completed && (
                            <Chip 
                              size="small" 
                              label="Completed" 
                              sx={{ 
                                bgcolor: '#10B98120', 
                                color: '#10B981',
                                fontWeight: 500
                              }} 
                            />
                          )}
                        </ActivityItem>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Achievements
                      </Typography>
                      <Chip 
                        icon={<CelebrationIcon fontSize="small" />} 
                        label="3 New" 
                        size="small" 
                        color="primary" 
                        sx={{ borderRadius: 1.5 }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      {achievements.map((achievement, index) => (
                        <Grid item xs={4} key={index}>
                          <AchievementBadge>
                            {achievement.icon}
                            <Typography variant="caption" align="center" sx={{ mt: 1, fontWeight: 500 }}>
                              {achievement.title}
                            </Typography>
                          </AchievementBadge>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant="text" 
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                      >
                        All Badges
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Dashboard;