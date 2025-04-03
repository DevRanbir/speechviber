import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  Divider,
  IconButton,
  Chip,
  Container,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MicIcon from '@mui/icons-material/Mic';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';

// Styled components with enhanced visual effects
const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(16px)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.12)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
  }
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: '4px solid rgba(124, 58, 237, 0.6)',
  boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)',
  margin: '0 auto',
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.8) 0%, rgba(99, 102, 241, 0.8) 100%)',
  color: 'white',
  borderRadius: 12,
  padding: '10px 20px',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9) 0%, rgba(129, 140, 248, 0.9) 100%)',
    boxShadow: '0 6px 12px rgba(79, 70, 229, 0.3)',
    transform: 'translateY(-2px)',
  },
}));

const OutlinedButton = styled(Button)(({ theme }) => ({
  borderColor: 'rgba(124, 58, 237, 0.5)',
  color: 'white',
  borderRadius: 12,
  padding: '8px 16px',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: 'rgba(124, 58, 237, 0.8)',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
}));

const AchievementChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(45deg, #4f46e5 30%, #7c3aed 90%)',
  color: 'white',
  fontWeight: 500,
  margin: theme.spacing(0.5),
  '& .MuiChip-icon': {
    color: 'white',
  },
}));

const StatBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const SpeechProfileDashboard = ({
  // User data (replace with real data)
  userData = {
    name: '',
    profession: '',
    avatar: '',
    bio: '',
    stats: {
      sessions: 0,
      hours: 0,
      audience: 0,
      badges: 0
    }
  },
  
  // Performance metrics
  performanceMetrics = [],
  
  // Recent activities
  recentActivities = [],
  
  // Achievements
  achievements = [],
  
  // Goals
  goals = [],
  
  // Upcoming sessions
  upcomingSessions = []
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      py: 6,
    }}>
      <Container maxWidth="lg">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section with Profile Overview */}
          <motion.div variants={itemVariants}>
            <GlassCard elevation={0} sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                    >
                      <LargeAvatar alt={userData.name} src={userData.avatar} />
                      <Typography variant="h4" sx={{ mt: 3, color: 'white', fontWeight: 600 }}>
                        {userData.name || 'Your Name'}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                        {userData.profession || 'Speech Professional'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <GradientButton
                          variant="contained"
                          startIcon={<EditIcon />}
                        >
                          Edit Profile
                        </GradientButton>
                      </Box>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h5" sx={{ color: 'white', mb: 1, fontWeight: 500 }}>
                        Speaking Journey
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                        {userData.bio || 'Share your speaking journey and expertise here.'}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <StatBox>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <MicIcon sx={{ fontSize: 36, color: 'rgba(124, 58, 237, 0.8)', mb: 1 }} />
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                              {userData.stats?.sessions || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Sessions
                            </Typography>
                          </motion.div>
                        </StatBox>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <StatBox>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <AccessTimeIcon sx={{ fontSize: 36, color: 'rgba(124, 58, 237, 0.8)', mb: 1 }} />
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                              {userData.stats?.hours || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Hours
                            </Typography>
                          </motion.div>
                        </StatBox>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <StatBox>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <GroupIcon sx={{ fontSize: 36, color: 'rgba(124, 58, 237, 0.8)', mb: 1 }} />
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                              {userData.stats?.audience || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Audience
                            </Typography>
                          </motion.div>
                        </StatBox>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <StatBox>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <EmojiEventsIcon sx={{ fontSize: 36, color: 'rgba(124, 58, 237, 0.8)', mb: 1 }} />
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                              {userData.stats?.badges || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Badges
                            </Typography>
                          </motion.div>
                        </StatBox>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </GlassCard>
          </motion.div>

          {/* Main Content Section */}
          <Grid container spacing={4}>
            {/* Performance Metrics and Recent Activities */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <motion.div variants={itemVariants}>
                    <GlassCard elevation={0}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 500 }}>
                            Performance Metrics
                          </Typography>
                          <IconButton sx={{ color: 'rgba(124, 58, 237, 0.8)' }}>
                            <BarChartIcon />
                          </IconButton>
                        </Box>
                        
                        <Grid container spacing={3}>
                          {/* Skill progress bars */}
                          <Grid item xs={12}>
                            {performanceMetrics.length > 0 ? 
                              performanceMetrics.map((metric, index) => (
                                <Box key={index} sx={{ mb: 3 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" sx={{ color: 'white' }}>{metric.name}</Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(124, 58, 237, 0.8)' }}>{metric.value}%</Typography>
                                  </Box>
                                  <ProgressBar variant="determinate" value={metric.value} />
                                </Box>
                              )) : 
                              // Placeholder metrics
                              ['Delivery Clarity', 'Content Structure', 'Audience Engagement', 'Impromptu Speaking'].map((name, index) => (
                                <Box key={index} sx={{ mb: 3 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" sx={{ color: 'white' }}>{name}</Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(124, 58, 237, 0.8)' }}>0%</Typography>
                                  </Box>
                                  <ProgressBar variant="determinate" value={0} />
                                </Box>
                              ))
                            }
                          </Grid>
                        </Grid>
                      </CardContent>
                    </GlassCard>
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <motion.div variants={itemVariants}>
                    <GlassCard elevation={0}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 500 }}>
                            Recent Activities
                          </Typography>
                          <IconButton sx={{ color: 'rgba(124, 58, 237, 0.8)' }}>
                            <TrendingUpIcon />
                          </IconButton>
                        </Box>
                        
                        {recentActivities.length > 0 ? (
                          <List>
                            {recentActivities.map((activity, index) => (
                              <React.Fragment key={index}>
                                <ListItem sx={{ px: 0 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                                    <Box 
                                      sx={{ 
                                        width: 10, 
                                        height: 10, 
                                        borderRadius: '50%', 
                                        bgcolor: 'rgba(124, 58, 237, 0.8)',
                                        mt: 1.5,
                                        mr: 2,
                                        boxShadow: '0 0 10px rgba(124, 58, 237, 0.5)'
                                      }} 
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                                        {activity.date}
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: 'white', my: 0.5 }}>
                                        {activity.description}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: 'rgba(124, 58, 237, 0.8)' }}>
                                        Duration: {activity.duration}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </ListItem>
                                {index < recentActivities.length - 1 && (
                                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
                                )}
                              </React.Fragment>
                            ))}
                          </List>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              No recent activities to display
                            </Typography>
                            <GradientButton
                              variant="contained"
                              size="small"
                              startIcon={<AddIcon />}
                              sx={{ mt: 2 }}
                            >
                              Add Activity
                            </GradientButton>
                          </Box>
                        )}
                      </CardContent>
                    </GlassCard>
                  </motion.div>
                </Grid>
              </Grid>
            </Grid>

            {/* Right Sidebar - Achievements, Goals, and Upcoming Sessions */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={4} direction="column">
                <Grid item>
                  <motion.div variants={itemVariants}>
                    <GlassCard elevation={0}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 500 }}>
                            Achievements
                          </Typography>
                          <EmojiEventsIcon sx={{ color: 'rgba(124, 58, 237, 0.8)' }} />
                        </Box>
                        
                        {achievements.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {achievements.map((achievement) => (
                              <motion.div
                                key={achievement.id}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                              >
                                <AchievementChip 
                                  icon={<EmojiEventsIcon />} 
                                  label={achievement.name} 
                                  title={achievement.description}
                                />
                              </motion.div>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 2, mb: 2 }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              No achievements yet
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <OutlinedButton variant="outlined" size="small">
                            View All Achievements
                          </OutlinedButton>
                        </Box>
                      </CardContent>
                    </GlassCard>
                  </motion.div>
                </Grid>
                
                <Grid item>
                  <motion.div variants={itemVariants}>
                    <GlassCard elevation={0}>
                      <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 500, mb: 3 }}>
                          Speaking Goals
                        </Typography>
                        
                        {goals.length > 0 ? (
                          <List>
                            {goals.map((goal, index) => (
                              <ListItem key={index} sx={{ px: 0, py: 1.5 }}>
                                <Box sx={{ width: '100%' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" sx={{ color: 'white' }}>
                                      {goal.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(124, 58, 237, 0.8)' }}>
                                      {goal.progress}%
                                    </Typography>
                                  </Box>
                                  <ProgressBar variant="determinate" value={goal.progress} />
                                </Box>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 2, mb: 2 }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              No goals set
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <OutlinedButton 
                            variant="outlined" 
                            size="small" 
                            startIcon={<AddIcon />}
                          >
                            Add New Goal
                          </OutlinedButton>
                        </Box>
                      </CardContent>
                    </GlassCard>
                  </motion.div>
                </Grid>
                
                <Grid item>
                  <motion.div variants={itemVariants}>
                    <GlassCard elevation={0}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 500 }}>
                            Upcoming Sessions
                          </Typography>
                          <CalendarTodayIcon sx={{ color: 'rgba(124, 58, 237, 0.8)' }} />
                        </Box>
                        
                        {upcomingSessions.length > 0 ? (
                          upcomingSessions.map((session, index) => (
                            <Box 
                              key={index}
                              sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                background: 'linear-gradient(45deg, rgba(124, 58, 237, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                                border: '1px solid rgba(124, 58, 237, 0.3)',
                                mb: index < upcomingSessions.length - 1 ? 2 : 0
                              }}
                            >
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {session.date} • {session.time}
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'white', fontWeight: 500, my: 1 }}>
                                {session.title}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={session.status} 
                                sx={{ 
                                  backgroundColor: session.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                                  color: session.status === 'Confirmed' ? 'rgb(16, 185, 129)' : 'rgb(245, 158, 11)',
                                  fontWeight: 500
                                }} 
                              />
                            </Box>
                          ))
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 2, mb: 2 }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              No upcoming sessions
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                          <GradientButton
                            variant="contained"
                            size="small"
                            startIcon={<CalendarTodayIcon />}
                          >
                            Schedule Session
                          </GradientButton>
                        </Box>
                      </CardContent>
                    </GlassCard>
                  </motion.div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SpeechProfileDashboard;