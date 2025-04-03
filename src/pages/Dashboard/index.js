import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  CardContent,
  IconButton,
  LinearProgress,
  Card,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SpeedIcon from '@mui/icons-material/Speed';
import BarChartIcon from '@mui/icons-material/BarChart';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';
import InsightsIcon from '@mui/icons-material/Insights';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Styled components
const GlassCard = styled(motion.div)(({ theme }) => ({
  background: 'rgba(30, 41, 59, 0.4)',
  backdropFilter: 'blur(20px)',
  borderRadius: 24,
  border: '1px solid rgba(124, 58, 237, 0.1)',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease-in-out',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px rgba(124, 58, 237, 0.2)',
    border: '1px solid rgba(124, 58, 237, 0.3)',
  }
}));

const AnimatedValue = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold',
}));

const GlowingIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2),
  borderRadius: '50%',
  background: 'rgba(124, 58, 237, 0.1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '140%',
    height: '140%',
    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0) 70%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::after': {
    opacity: 1,
  }
}));

const StatCard = ({ title, value, icon, progress, delay }) => (
  <GlassCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <GlowingIcon>
          {icon}
        </GlowingIcon>
        <Box sx={{ ml: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            {title}
          </Typography>
          <AnimatedValue variant="h4">
            {value}
          </AnimatedValue>
        </Box>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
            borderRadius: 4,
          }
        }}
      />
    </CardContent>
  </GlassCard>
);

const IconWrapper = styled(Box)(({ theme }) => ({
  background: 'rgba(124, 58, 237, 0.1)',
  borderRadius: '50%',
  padding: theme.spacing(2),
  marginRight: theme.spacing(2),
  transition: 'all 0.3s ease',
  '& svg': {
    fontSize: '2rem',
    color: '#7C3AED',
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  padding: theme.spacing(3),
  textAlign: 'left',
  background: 'rgba(30, 41, 59, 0.4)',
  backdropFilter: 'blur(20px)',
  borderRadius: 24,
  border: '1px solid rgba(124, 58, 237, 0.1)',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
  position: 'relative',
  justifyContent: 'flex-start',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1))',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease-in-out',
  },
  '&:hover': {
    transform: 'translateY(-5px)',
    border: '1px solid rgba(124, 58, 237, 0.3)',
    boxShadow: '0 12px 40px rgba(124, 58, 237, 0.2)',
    '&::before': {
      transform: 'translateX(0)',
    },
  }
}));

const SummaryCard = styled(Card)(({ theme }) => ({
  background: 'rgba(30, 41, 59, 0.4)',
  backdropFilter: 'blur(20px)',
  borderRadius: 24,
  border: '1px solid rgba(124, 58, 237, 0.1)',
  padding: theme.spacing(3),
  height: '100%',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 12px 40px rgba(124, 58, 237, 0.2)',
    border: '1px solid rgba(124, 58, 237, 0.3)',
  }
}));

const GradientText = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold',
}));

const Dashboard = () => {
  const navigate = useNavigate();

  const handlePracticeClick = () => {
    navigate('/practice');
  };

  const handleInterviewClick = () => {
    navigate('/interview');
  };

  const handleAnalysisClick = () => {
    navigate('/analysis');
  };

  const handleHistoryClick = () => {
    navigate('/history');
  };

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 },
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ 
          p: { xs: 2, md: 4 }, 
          mb: 4, 
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1))',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: '1px solid rgba(124, 58, 237, 0.2)',
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <GradientText variant="h3" sx={{ mb: 1, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
                Welcome to @SpeechViber 
              </GradientText>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              Made by @Vibers, 
              To Boost your communication skills with AI-powered analysis and feedback
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                Track your progress, analyze your performance, and practice with personalized exercises.
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/practice')}
                sx={{ 
                  background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                  borderRadius: 8,
                  py: 1.5,
                  px: 4,
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
                  }
                }}
              >
                Start Practicing Now
              </Button>
            </Grid>
          </Grid>
        </Card>
      </motion.div>

      <Grid container spacing={4}>
        {/* Quick Actions Section */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Tools & Features
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Explore our powerful features to improve your speech performance
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ height: '100%' }}
              >
                <ActionButton onClick={handlePracticeClick}>
                  <IconWrapper>
                    <MicIcon />
                  </IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                      Practice Mode
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Speech exercises with feedback
                    </Typography>
                  </Box>
                </ActionButton>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} lg={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ height: '100%' }}
              >
                <ActionButton onClick={handleInterviewClick}>
                  <IconWrapper>
                    <PersonSearchIcon />
                  </IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                      Interview Simulator
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      AI-powered mock interviews
                    </Typography>
                  </Box>
                </ActionButton>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} lg={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ height: '100%' }}
              >
                <ActionButton onClick={handleAnalysisClick}>
                  <IconWrapper>
                    <InsightsIcon />
                  </IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                      Speech Analysis
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Get detailed performance insights
                    </Typography>
                  </Box>
                </ActionButton>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} lg={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ height: '100%' }}
              >
                <ActionButton onClick={handleHistoryClick}>
                  <IconWrapper>
                    <HistoryIcon />
                  </IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                      History & Progress
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Track your improvement over time
                    </Typography>
                  </Box>
                </ActionButton>
              </motion.div>
            </Grid>
          </Grid>
          
          {/* Recent Activity */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>
              Recent Activity
            </Typography>
            <SummaryCard>
              <Box sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid rgba(124, 58, 237, 0.1)' }}>
                  <IconWrapper sx={{ padding: 1.5 }}>
                    <MicIcon sx={{ fontSize: '1.5rem' }} />
                  </IconWrapper>
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                      Mock Interview - Software Engineer
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      15 minutes ago
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid rgba(124, 58, 237, 0.1)' }}>
                  <IconWrapper sx={{ padding: 1.5 }}>
                    <SpeedIcon sx={{ fontSize: '1.5rem' }} />
                  </IconWrapper>
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                      Quick Analysis - Presentation
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      18 minutes ago
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconWrapper sx={{ padding: 1.5 }}>
                    <AssignmentIcon sx={{ fontSize: '1.5rem' }} />
                  </IconWrapper>
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                      Practice Session - Public Speaking
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      1 Hr ago
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </SummaryCard>
          </Box>
        </Grid>

        {/* Stats and Progress Section */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Your Performance
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Key metrics and progress indicators
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <StatCard
                title="Overall Speech Score"
                value="85%"
                icon={<TrendingUpIcon sx={{ color: '#7C3AED' }} />}
                progress={85}
                delay={0.1}
              />
            </Grid>
            <Grid item xs={12}>
              <StatCard
                title="Clarity & Pronunciation"
                value="Good"
                icon={<RecordVoiceOverIcon sx={{ color: '#3B82F6' }} />}
                progress={75}
                delay={0.2}
              />
            </Grid>
            <Grid item xs={12}>
              <StatCard
                title="Speaking Fluency"
                value="Excellent"
                icon={<SpeedIcon sx={{ color: '#10B981' }} />}
                progress={90}
                delay={0.3}
              />
            </Grid>
            <Grid item xs={12}>
              <StatCard
                title="Monthly Progress"
                value="+15%"
                icon={<BarChartIcon sx={{ color: '#F59E0B' }} />}
                progress={65}
                delay={0.4}
              />
            </Grid>
          </Grid>
          
          {/* Achievement Card */}
          <Box sx={{ mt: 3, maxWidth: '100%'}}>
            <SummaryCard>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 'bold', width: '100%'}}>
                Recent Achievement
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <IconButton sx={{ 
                  background: 'rgba(124, 58, 237, 0.1)', 
                  p: 2, 
                  mb: 2,
                  '&:hover': { background: 'rgba(124, 58, 237, 0.2)' } 
                }}>
                  <EmojiEventsIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
                </IconButton>
                <GradientText variant="h6">5-Day Streak!</GradientText>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  You've practiced for 5 consecutive days. Keep it up!
                </Typography>
              </Box>
            </SummaryCard>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;