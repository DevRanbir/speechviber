import React from 'react';
import { Box, Typography, Button, useMediaQuery, useTheme } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { keyframes } from '@mui/system';

// Wave animation from CustomLoader
const wave = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

// Additional animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const CustomLoader = () => {
  const brand = "SpeechViber";
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
      {brand.split('').map((letter, index) => (
        <Typography
          key={index}
          variant="h3"
          sx={{
            color: '#7C3AED',
            fontWeight: 'bold',
            animation: `${wave} 1s ease-in-out infinite`,
            animationDelay: `${index * 0.1}s`,
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
          }}
        >
          {letter}
        </Typography>
      ))}
    </Box>
  );
};

const ErrorPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      padding: { xs: '20px', sm: '40px' },
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(124, 58, 237, 0.05)',
        filter: 'blur(40px)',
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.05)',
        filter: 'blur(50px)',
      }} />
      
      {/* Content */}
      <Box sx={{
        animation: `${fadeIn} 1s ease-out`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
        maxWidth: '500px',
        width: '100%',
      }}>
        <CustomLoader />
        
        <Box sx={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          padding: { xs: '2rem', sm: '3rem' },
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}>
          <Box sx={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(45deg, rgba(124, 58, 237, 0.2), rgba(59, 130, 246, 0.2))',
            border: '2px solid rgba(124, 58, 237, 0.5)',
            mb: 3,
          }}>
            <Typography sx={{
              fontSize: '3rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              !
            </Typography>
          </Box>
          
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              mb: 1,
              textAlign: 'center',
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '1.75rem' }
            }}
          >
            Oops! Something went wrong
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              mb: 4,
              maxWidth: '400px'
            }}
          >
            Don't worry, we're on it. Let's refresh and try again.
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              padding: { xs: '10px 16px', sm: '12px 24px' },
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              animation: `${pulse} 2s infinite ease-in-out`,
              '&:hover': {
                background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(124, 58, 237, 0.5)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Refresh Page
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ErrorPage;