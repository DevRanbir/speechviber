
import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button, 
  Tabs,
  Tab,
  Chip,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import EditIcon from '@mui/icons-material/Edit';
import DuoIcon from '@mui/icons-material/Duo';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';

const Practice = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const practiceSections = [
    {
      id: 'textual',
      title: 'Textual Learning',
      description: 'Enhance your language skills through interactive text-based exercises',
      gradient: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
      color: '#7C3AED',
      borderColor: 'rgba(124, 58, 237, 0.3)',
      items: [
        { 
          id: 'mcq', 
          title: 'MCQ Challenge', 
          subtitle: 'Test your knowledge', 
          icon: <EditIcon />, 
          path: '/chatbox',
          chips: ['Interactive', 'Scoring']
        },
        { 
          id: 'vocabulary', 
          title: 'Word Power', 
          subtitle: 'Expand your vocabulary', 
          icon: <MenuBookIcon />, 
          path: '/WordPower',
          chips: ['Vocabulary', 'Games'] 
        },
        { 
          id: 'grammar', 
          title: 'Grammar Check', 
          subtitle: 'Perfect your writing', 
          icon: <SpellcheckIcon />, 
          path: '/Grammarcheck',
          chips: ['Analysis', 'Correction'] 
        },
        { 
          id: 'tongueTwister', 
          title: 'Tongue Twister Challenge', 
          subtitle: 'Perfect your pronunciation', 
          icon: <RecordVoiceOverIcon />, 
          path: '/tonguetwister',
          chips: ['Similar words', 'Quiz']
        },
        // Add the new WordContext item
        { 
          id: 'wordContext', 
          title: 'Word in Context', 
          subtitle: 'Master word usage', 
          icon: <SchoolIcon />, 
          path: '/wordcontext',
          chips: ['Interactive', 'Vocabulary'] 
        },
        { 
          id: 'grammarFill', 
          title: 'Grammar Fill', 
          subtitle: 'Practice articles and modals', 
          icon: <EditIcon />, 
          path: '/GrammarFill',  // Updated path to match component directory
          chips: ['Interactive', 'Grammar'] 
        },
      ]
    },
    {
      id: 'audio',
      title: 'Audio Practice',
      description: 'Improve your speaking and listening abilities through audio exercises',
      gradient: 'linear-gradient(45deg, #EC4899, #DB2777)',
      color: '#EC4899',
      borderColor: 'rgba(236, 72, 153, 0.3)',
      items: [
        { 
          id: 'speech', 
          title: 'Speech Practice', 
          subtitle: 'Improve clarity and fluency', 
          icon: <MicIcon />, 
          path: '/analysis',
          chips: ['Speech', 'Feedback']
        },
        { 
          id: 'debate', 
          title: 'Debate Mode', 
          subtitle: 'Master the art of persuasion', 
          icon: <GroupsIcon />, 
          path: '/DebateMode',
          chips: ['Interactive', 'Speaking']
        },
        { 
          id: 'story', 
          title: 'Story Time', 
          subtitle: 'Visual storytelling', 
          icon: <AutoStoriesIcon />, 
          path: '/StoryTime',
          chips: ['Narration', 'Creative']
        },
        { 
          id: 'publicSpeaking', 
          title: 'Public Speaking Simulator', 
          subtitle: 'Practice presentations', 
          icon: <PresentToAllIcon />, 
          path: '/publicspeaking',
          chips: ['AI Feedback', 'Speaking']
        },
        { 
          id: 'wordCircumlocution', 
          title: 'Word Wizardry', 
          subtitle: 'Describe words creatively', 
          icon: <RecordVoiceOverIcon />, 
          path: '/wordwizardry',
          chips: ['Speaking', 'Vocabulary'] 
        },
        { 
          id: 'speechPrecision', 
          title: 'Speech Precision', 
          subtitle: 'Master challenging phrases', 
          icon: <HeadsetMicIcon />, 
          path: '/speechprecision',
          chips: ['Pronunciation', 'Feedback'] 
        },
      ]
    },
    {
      id: 'visual',
      title: 'Visual Learning',
      description: 'Learn through dynamic visual interactions and presentations',
      gradient: 'linear-gradient(45deg, #10B981, #059669)',
      color: '#10B981',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      items: [
        { 
          id: 'IRA', 
          title: 'Interview Readiness Analyzer', 
          subtitle: 'Check your style and environment', 
          icon: <PresentToAllIcon />, 
          path: '/PresentAndLearn',
          chips: ['Analysis', 'Feedback']
        },
        { 
          id: 'expressionMatcher', 
          title: 'Expression Matcher', 
          subtitle: 'Master common phrases', 
          icon: <TranslateIcon />, 
          path: '/expressionmatcher',
          chips: ['Interactive', 'Vocabulary']
        },
        { 
          id: 'full', 
          title: 'Full Mode', 
          subtitle: 'Complete interactive experience', 
          icon: <DuoIcon />, 
          path: '/interview',
          chips: ['Comprehensive', 'Video']
        },
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

  const renderPracticeCategory = (category) => {
    return (
      <Box key={category.id} sx={{ mb: 5 }}>
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              paddingLeft: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 4,
                height: '80%',
                background: category.color,
                borderRadius: 4,
              }
            }}
          >
            {category.title}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              ml: 2, 
              color: 'text.secondary',
              mt: 1
            }}
          >
            {category.description}
          </Typography>
        </Box>
        
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={2.5}>
            {category.items.map((item, index) => (
              <Grid item xs={12} sm={6} md={6} lg={4} key={item.id}>
                <motion.div
                  custom={index}
                  variants={cardVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => navigate(item.path)}
                  style={{ height: '100%' }}
                >
                  <Paper 
                    elevation={0}
                    sx={{ 
                      position: 'relative',
                      height: 130,
                      background: 'rgba(13, 26, 38, 0.03)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: 3,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.3s ease',
                      border: `1px solid ${category.borderColor}`,
                      '&:hover': {
                        boxShadow: `0 6px 16px ${alpha(category.color, 0.15)}`,
                        '& .card-icon': {
                          transform: 'scale(1.05) translateY(-2px)',
                        },
                        '& .card-glow': {
                          opacity: 0.15,
                        }
                      }
                    }}
                  >
                    {/* Gradient background glow */}
                    <Box 
                      className="card-glow"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: category.gradient,
                        opacity: 0.05,
                        transition: 'opacity 0.3s ease',
                        zIndex: 0,
                      }}
                    />
                    
                    {/* Icon */}
                    <Box 
                      className="card-icon"
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 1.5,
                        position: 'relative',
                        zIndex: 1,
                        transition: 'all 0.3s ease',
                        ml: 2
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${alpha(category.color, 0.15)}`,
                          boxShadow: `0 4px 10px ${alpha(category.color, 0.2)}`,
                        }}
                      >
                        {React.cloneElement(item.icon, {
                          sx: { 
                            fontSize: 22,
                            color: category.color,
                          }
                        })}
                      </Box>
                    </Box>
                    
                    {/* Content */}
                    <Box 
                      sx={{ 
                        padding: 2,
                        position: 'relative',
                        zIndex: 1,
                        flex: 1,
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: '1rem',
                          fontWeight: 600,
                          mb: 0.5,
                          background: category.gradient,
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
                          color: 'text.secondary',
                          mb: 1
                        }}
                      >
                        {item.subtitle}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {item.chips.map(chip => (
                          <Chip 
                            key={chip}
                            label={chip}
                            size="small"
                            sx={{ 
                              backgroundColor: alpha(category.color, 0.1),
                              color: category.color,
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              height: 22
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Box>
    );
  };

  const renderAIMentorCard = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            background: 'linear-gradient(135deg, rgba(13, 26, 38, 0.03) 0%, rgba(18, 36, 53, 0.05) 100%)',
            backdropFilter: 'blur(15px)',
            borderRadius: 4,
            overflow: 'hidden',
            padding: 3,
            position: 'relative',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            marginBottom: 5,
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
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: {xs: 'flex-start', md: 'center'},
            flexDirection: {xs: 'column', md: 'row'},
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ 
              width: 70,
              height: 70,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 3,
              position: 'relative',
              boxShadow: '0 8px 16px rgba(124, 58, 237, 0.2)',
              mb: {xs: 2, md: 0},
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: '-3px',
                borderRadius: '23px',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.6) 0%, rgba(59, 130, 246, 0.4) 100%)',
                zIndex: -1,
                opacity: 0.3,
              }
            }}>
              <SmartToyIcon sx={{ fontSize: 32, color: '#7C3AED' }} />
            </Box>
            
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
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                Get personalized guidance and instant answers to all your language learning questions from your dedicated AI companion.
              </Typography>
            </Box>
            
            <Box sx={{ ml: {md: 2}, width: {xs: '100%', md: 'auto'}, textAlign: {xs: 'center', md: 'right'} }}>
              <Button 
                variant="contained" 
                sx={{ 
                  background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
                  color: 'white',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #6D28D9, #2563EB)',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                  }
                }}
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/AIMentor')}
              >
                Talk to Mentor
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* New AI Notes Card */}
        <Paper 
          elevation={0}
          sx={{ 
            background: 'linear-gradient(135deg, rgba(13, 26, 38, 0.03) 0%, rgba(18, 36, 53, 0.05) 100%)',
            backdropFilter: 'blur(15px)',
            borderRadius: 4,
            overflow: 'hidden',
            padding: 3,
            position: 'relative',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            marginBottom: 5,
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
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: {xs: 'flex-start', md: 'center'},
            flexDirection: {xs: 'column', md: 'row'},
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ 
              width: 70,
              height: 70,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 3,
              position: 'relative',
              boxShadow: '0 8px 16px rgba(124, 58, 237, 0.2)',
              mb: {xs: 2, md: 0},
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: '-3px',
                borderRadius: '23px',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.6) 0%, rgba(59, 130, 246, 0.4) 100%)',
                zIndex: -1,
                opacity: 0.3,
              }
            }}>
              <MenuBookIcon sx={{ fontSize: 32, color: '#7C3AED' }} />
            </Box>
            
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
                AI Learning Notes
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                Access your personalized AI-powered learning notes and track your progress through interactive study materials.
              </Typography>
            </Box>
            
            <Box sx={{ ml: {md: 2}, width: {xs: '100%', md: 'auto'}, textAlign: {xs: 'center', md: 'right'} }}>
              <Button 
                variant="contained" 
                sx={{ 
                  background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
                  color: 'white',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #6D28D9, #2563EB)',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                  }
                }}
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/notes')}
              >
                Make Notes
              </Button>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    );
  };

  return (
    <Box sx={{ 
      //bgcolor: 'background.default', 
      minHeight: '100vh', 
      py: 0,
      flexGrow: 1,
      width: '100%',
      paddingRight: { xs: 0, md: '70px' },
      backgroundAttachment: 'fixed',
      boxSizing: 'border-box',
      transition: 'padding 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'
    }}>
      <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold">
              Practice Your Skills
            </Typography>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              variant="outlined"
            >
              Back to Dashboard
            </Button>
          </Box>

          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ mb: 4 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="All Categories" 
              icon={<DashboardIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Textual Learning" 
              icon={<MenuBookIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Audio Practice" 
              icon={<HeadsetMicIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Visual Learning" 
              icon={<DuoIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="AI Assistance" 
              icon={<SmartToyIcon />} 
              iconPosition="start" 
            />
          </Tabs>

          {activeTab === 0 && (
            <>
              {renderAIMentorCard()}
              {practiceSections.map(category => renderPracticeCategory(category))}
            </>
          )}
          {activeTab === 1 && renderPracticeCategory(practiceSections[0])}
          {activeTab === 2 && renderPracticeCategory(practiceSections[1])}
          {activeTab === 3 && renderPracticeCategory(practiceSections[2])}
          {activeTab === 4 && renderAIMentorCard()}
        </motion.div>
      </Container>
    </Box>
  );
};

export default Practice;