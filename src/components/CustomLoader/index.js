import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

const wave = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

const CustomLoader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
        }}
      >
        {['S', 'p', 'e', 'e', 'c', 'h', 'V', 'i', 'b', 'e', 'r'].map((letter, index) => (
          <Typography
            key={index}
            variant="h3"
            sx={{
              color: '#7C3AED',
              fontWeight: 'bold',
              animation: `${wave} 1s ease-in-out infinite`,
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {letter}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default CustomLoader;