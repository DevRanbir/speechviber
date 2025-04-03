import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Fade, Stack, Paper } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import VideocamIcon from '@mui/icons-material/Videocam';
import DuoIcon from '@mui/icons-material/Duo';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit'; // Added EditIcon for MCQ challenge
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import PracticeSession from '../../components/PracticeSession';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import { useNavigate } from 'react-router-dom';

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(3),
  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const CardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '900px',
  marginTop: theme.spacing(2),
}));

const GlassCard = styled(motion(Paper))(({ theme }) => ({
  background: 'rgba(30, 41, 59, 0.4)',
  backdropFilter: 'blur(10px)',
  borderRadius: 12,
  border: '1px solid rgba(124, 58, 237, 0.1)',
  padding: theme.spacing(1.5),
  width: '180px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 20px rgba(124, 58, 237, 0.2)',
    border: '1px solid rgba(124, 58, 237, 0.3)',
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  background: 'rgba(124, 58, 237, 0.1)',
  borderRadius: '50%',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '& svg': {
    fontSize: '1.5rem',
    color: '#7C3AED',
  }
}));

const SessionContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15, 23, 42, 0.95)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  color: 'white',
  background: 'rgba(124, 58, 237, 0.2)',
  '&:hover': {
    background: 'rgba(124, 58, 237, 0.4)',
  }
}));

const PracticeHeader = styled(Typography)(({ gradient }) => ({
  marginBottom: '24px',
  textAlign: 'center',
  background: gradient,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold',
}));

const Practice = () => {
  const navigate = useNavigate();
  const { audioData, isRecording, startAudioRecording, stopAudioRecording } = useAudioRecorder();
  const [selectedMode, setSelectedMode] = useState(null);

  const practiceTypes = [
    {
      id: 'audio',
      title: 'Audio',
      icon: <MicIcon />,
      gradient: 'linear-gradient(45deg, #7C3AED, #3B82F6)'
    },
    {
      id: 'textual',
      title: 'MCQ Challenge',
      icon: <EditIcon />,
      gradient: 'linear-gradient(45deg, #7C3AED, #3B82F6)'
    },
    {
      id: 'combined',
      title: 'Full Mode',
      icon: <DuoIcon />,
      gradient: 'linear-gradient(45deg, #10B981, #059669)'
    }
  ];

  const handleStartPractice = async (practiceType) => {
    if (practiceType === 'audio') {
      navigate('/analysis');
      return;
    }

    if (practiceType === 'combined') {
      // Navigate to interview page for full mode
      navigate('/interview');
      return;
    }
    
    if (practiceType === 'textual') {
      // Navigate to chatbox page for MCQ challenge
      navigate('/chatbox');
      return;
    }

    if (practiceType === 'audio' || practiceType === 'combined') {
      try {
        await startAudioRecording();
      } catch (error) {
        console.error('Error starting audio recording:', error);
        return;
      }
    }
    setSelectedMode(practiceType);
  };

  const handleCloseSession = () => {
    if (isRecording) {
      stopAudioRecording();
    }
    setSelectedMode(null);
  };

  // Function to get session title and description based on selected mode
  const getSessionInfo = (mode) => {
    switch(mode) {
      case 'audio':
        return {
          title: 'Audio Practice Session',
          description: 'Master your vocal delivery with AI-powered speech analysis',
          gradient: 'linear-gradient(45deg, #7C3AED, #3B82F6)'
        };
      case 'video':
        return {
          title: 'Video Practice Session',
          description: 'Enhance your visual presence with body language analysis',
          gradient: 'linear-gradient(45deg, #EC4899, #F43F5E)'
        };
      case 'textual':
        return {
          title: 'MCQ Challenge Session',
          description: 'Test your interview knowledge with multiple-choice questions',
          gradient: 'linear-gradient(45deg, #7C3AED, #3B82F6)'
        };
      case 'combined':
        return {
          title: 'Full Practice Session',
          description: 'Comprehensive practice with both audio and video analysis',
          gradient: 'linear-gradient(45deg, #10B981, #059669)'
        };
      default:
        return {
          title: 'Practice Session',
          description: '',
          gradient: 'linear-gradient(45deg, #7C3AED, #3B82F6)'
        };
    }
  };

  const sessionInfo = selectedMode ? getSessionInfo(selectedMode) : null;

  return (
    <PageContainer>
      <PracticeHeader 
        variant="h4"
        gradient="linear-gradient(45deg, #7C3AED, #3B82F6)"
      >
        Practice Your Skills
      </PracticeHeader>

      <CardContainer>
        <Stack direction="row" spacing={3} justifyContent="center">
          {practiceTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard onClick={() => handleStartPractice(type.id)}>
                <IconWrapper style={{ background: `rgba(${type.id === 'audio' ? '124, 58, 237' : type.id === 'video' ? '236, 72, 153' : '16, 185, 129'}, 0.1)` }}>
                  {type.icon}
                </IconWrapper>
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    background: type.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}
                >
                  {type.title}
                </Typography>
              </GlassCard>
            </motion.div>
          ))}
        </Stack>
      </CardContainer>

      {selectedMode && (
        <Fade in={!!selectedMode}>
          <SessionContainer>
            <CloseButton onClick={handleCloseSession}>
              <CloseIcon />
            </CloseButton>
            
            <Box sx={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
              <PracticeHeader 
                variant="h4"
                gradient={sessionInfo.gradient}
              >
                {sessionInfo.title}
              </PracticeHeader>
              
              <Typography 
                variant="body1"
                sx={{ 
                  mb: 4,
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center'
                }}
              >
                {sessionInfo.description}
              </Typography>
              
              <Box sx={{ 
                background: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(124, 58, 237, 0.2)',
                p: 3,
                mb: 3,
                width: '100%'
              }}>
                <PracticeSession 
                  mode={selectedMode} 
                  onClose={handleCloseSession}
                  recordedAudioData={audioData}
                />
              </Box>
            </Box>
          </SessionContainer>
        </Fade>
      )}
    </PageContainer>
  );
};

export default Practice;