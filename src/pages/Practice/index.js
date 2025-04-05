import React from 'react';
import { Box, Typography, Grid, Container, useTheme, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Icons
import MicIcon from '@mui/icons-material/Mic';
import EditIcon from '@mui/icons-material/Edit';
import DuoIcon from '@mui/icons-material/Duo';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Styled components
// Styled components
const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(120deg, #0A1929 0%, #142F4C 100%)',
  position: 'relative',
  overflow: 'hidden',
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(8),
  paddingRight: theme.spacing(6),
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.05) 40%, transparent 70%)',
    pointerEvents: 'none',
  }
}));

const HeadingGradient = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  textAlign: 'center',
  background: 'linear-gradient(90deg, #7C3AED 0%, #4F46E5 50%, #3B82F6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: theme.spacing(2),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -10,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 80,
    height: 4,
    borderRadius: 2,
    background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
  }
}));

const SectionWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  position: 'relative',
}));

const SectionHeading = styled(Typography)(({ theme, color }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 700,
  position: 'relative',
  paddingLeft: theme.spacing(2),
  display: 'inline-block',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 4,
    height: '80%',
    background: color,
    borderRadius: 4,
  }
}));

// Elegant smaller card design
const ElegantCard = styled(motion(Paper))(({ theme, gradient, borderColor }) => ({
  position: 'relative',
  height: 130,
  background: 'rgba(13, 26, 38, 0.6)',
  backdropFilter: 'blur(12px)',
  borderRadius: 12,
  overflow: 'hidden',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  border: `1px solid ${borderColor}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 6px 16px rgba(${borderColor.replace(/[^\d,]/g, '')}, 0.25)`,
    '& .card-icon': {
      transform: 'scale(1.05) translateY(-2px)',
    },
    '& .card-glow': {
      opacity: 0.15,
    }
  }
}));

const CardGlow = styled(Box)(({ gradient }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '100%',
  background: gradient,
  opacity: 0.05,
  transition: 'opacity 0.3s ease',
  zIndex: 0,
}));

const CardIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1.5),
  position: 'relative',
  zIndex: 1,
  transition: 'all 0.3s ease',
}));

const CardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  position: 'relative',
  zIndex: 1,
  flex: 1,
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(219, 234, 254, 0.7)',
  textAlign: 'center',
  maxWidth: '700px',
  margin: '0 auto',
  marginBottom: theme.spacing(6),
}));

// Special AI Mentor card
const MentorCard = styled(motion(Paper))(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(13, 26, 38, 0.95) 0%, rgba(18, 36, 53, 0.95) 100%)',
  backdropFilter: 'blur(15px)',
  borderRadius: 16,
  overflow: 'hidden',
  padding: theme.spacing(3),
  position: 'relative',
  border: '1px solid rgba(124, 58, 237, 0.2)',
  marginBottom: theme.spacing(6),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 30% 40%, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)',
    zIndex: 0,
  }
}));

const MentorIconBg = styled(Box)(({ theme }) => ({
  width: 70,
  height: 70,
  borderRadius: '20px',
  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(3),
  position: 'relative',
  boxShadow: '0 8px 16px rgba(124, 58, 237, 0.2)',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: '-3px',
    borderRadius: '23px',
    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.6) 0%, rgba(59, 130, 246, 0.4) 100%)',
    zIndex: -1,
    opacity: 0.3,
  }
}));

const AccessButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
  color: 'white',
  borderRadius: 8,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    background: 'linear-gradient(90deg, #6D28D9, #2563EB)',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
  }
}));

// Main component
const Practice = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const sections = [
    {
      id: 'textual',
      title: 'Textual Learning',
      gradient: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
      color: '#7C3AED',
      borderColor: 'rgba(124, 58, 237, 0.3)',
      description: 'Enhance your language skills through interactive text-based exercises',
      items: [
        { id: 'mcq', title: 'MCQ Challenge', subtitle: 'Test your knowledge', icon: <EditIcon />, path: '/chatbox' },
        { id: 'vocabulary', title: 'Word Power', subtitle: 'Expand your vocabulary', icon: <MenuBookIcon />, path: '/WordPower' },
        { id: 'grammar', title: 'Grammar Check', subtitle: 'Perfect your writing', icon: <SpellcheckIcon />, path: '/Grammarcheck' },
      ]
    },
    {
      id: 'audio',
      title: 'Audio Practice',
      gradient: 'linear-gradient(45deg, #EC4899, #DB2777)',
      color: '#EC4899',
      borderColor: 'rgba(236, 72, 153, 0.3)',
      description: 'Improve your speaking and listening abilities through audio exercises',
      items: [
        { id: 'speech', title: 'Speech Practice', subtitle: 'Improve clarity and fluency', icon: <MicIcon />, path: '/analysis' },
        { id: 'debate', title: 'Debate Mode', subtitle: 'Master the art of persuasion', icon: <GroupsIcon />, path: '/DebateMode' },
        { id: 'pronunciation', title: 'Pronunciation', subtitle: 'Sound like a native speaker', icon: <RecordVoiceOverIcon />, path: '/Pronunciation' },
      ]
    },
    {
      id: 'visual',
      title: 'Visual Learning',
      gradient: 'linear-gradient(45deg, #10B981, #059669)',
      color: '#10B981',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      description: 'Learn through dynamic visual interactions and presentations',
      items: [
        { id: 'presentation', title: 'Present & Learn', subtitle: 'Practice public speaking', icon: <PresentToAllIcon />, path: '/PresentAndLearn' },
        { id: 'story', title: 'Story Time', subtitle: 'Visual storytelling', icon: <AutoStoriesIcon />, path: '/StoryTime' },
        { id: 'full', title: 'Full Mode', subtitle: 'Complete interactive experience', icon: <DuoIcon />, path: '/interview' },
      ]
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const mentorVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <PageWrapper>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <HeadingGradient variant="h2">
            Practice Your Skills
          </HeadingGradient>
          <Subtitle variant="h6">
            Accelerate your language learning with our interactive practice modes
          </Subtitle>
        </motion.div>

        {/* Special AI Mentor Card */}
        <motion.div
          variants={mentorVariants}
          initial="hidden"
          animate="visible"
        >
          <MentorCard elevation={0}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flexWrap: {xs: 'wrap', md: 'nowrap'},
              mb: {xs: 2, md: 0},
            }}>
              <MentorIconBg>
                <SmartToyIcon sx={{ fontSize: 32, color: '#7C3AED' }} />
              </MentorIconBg>
              
              <Box sx={{ flex: 1, mb: {xs: 2, md: 0} }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  Ask AI Mentor
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(219, 234, 254, 0.8)', maxWidth: 600 }}>
                  Get personalized guidance and instant answers to all your language learning questions from your dedicated AI companion.
                </Typography>
              </Box>
              
              <Box sx={{ ml: {md: 2}, width: {xs: '100%', md: 'auto'}, textAlign: {xs: 'center', md: 'right'} }}>
                <AccessButton 
                  variant="contained" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/AIMentor')}
                >
                  Talk to Mentor
                </AccessButton>
              </Box>
            </Box>
          </MentorCard>
        </motion.div>

        {sections.map((section, sectionIndex) => (
          <SectionWrapper key={section.id}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: sectionIndex * 0.2 }}
            >
              <Box sx={{ mb: 3 }}>
                <SectionHeading variant="h4" color={section.color}>
                  {section.title}
                </SectionHeading>
                <Typography variant="body1" sx={{ ml: 2, color: 'rgba(219, 234, 254, 0.7)' }}>
                  {section.description}
                </Typography>
              </Box>
            </motion.div>

            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Grid container spacing={2.5}>
                {section.items.map((item, index) => (
                  <Grid item xs={12} sm={6} md={6} lg={4} key={item.id}>
                    <motion.div
                      custom={index}
                      variants={cardVariants}
                      onClick={() => navigate(item.path)}
                      style={{ height: '100%' }}
                    >
                      <ElegantCard 
                        elevation={0}
                        gradient={section.gradient}
                        borderColor={section.borderColor}
                      >
                        <CardGlow gradient={section.gradient} className="card-glow" />
                        
                        {/* Left side - Icon */}
                        <CardIconWrapper className="card-icon" sx={{ ml: 2 }}>
                          <Box 
                            sx={{ 
                              width: 44,
                              height: 44,
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: `${section.gradient}25`,
                              boxShadow: `0 4px 10px rgba(${section.borderColor.replace(/[^\d,]/g, '')}, 0.2)`,
                            }}
                          >
                            {React.cloneElement(item.icon, {
                              sx: { 
                                fontSize: 22,
                                color: section.color,
                              }
                            })}
                          </Box>
                        </CardIconWrapper>
                        
                        {/* Right side - Content */}
                        <CardContent>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontSize: '1rem',
                              fontWeight: 600,
                              mb: 0.5,
                              background: section.gradient,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.8rem',
                              color: 'rgba(219, 234, 254, 0.7)'
                            }}
                          >
                            {item.subtitle}
                          </Typography>
                        </CardContent>
                      </ElegantCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </SectionWrapper>
        ))}
      </Container>
    </PageWrapper>
  );
};

export default Practice;