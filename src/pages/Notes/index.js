import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import UserNotes from './tabs/UserNotes';
import AINotes from './tabs/AINotes'; // Add this import
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// Styled components
const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
  },
  '& .MuiTab-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-selected': {
      color: 'white',
    },
  },
}));

const Notes = () => {
  const navigate = useNavigate();
  useErrorBoundary();
  const [activeTab, setActiveTab] = useState(1); // Changed default value to 1 for AI Notes

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ 
      maxheight: '100%',
      py: 0,
      flexGrow: 1,
      width: '100%',
      paddingRight: { xs: 0, md: '70px' },
      backgroundAttachment: 'fixed',
      boxSizing: 'border-box',
    }}>
      <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold">
              Notes
            </Typography>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              variant="outlined"
            >
              Back to Dashboard
            </Button>
          </Box>

          <StyledTabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ mb: 4 }}
            variant="fullWidth"
          >
            <Tab label="My Notes" />
            <Tab label="AI Assistant" />
          </StyledTabs>

          {activeTab === 0 && <UserNotes />}
          {activeTab === 1 && <AINotes />} {/* Replace the placeholder with actual component */}
        </motion.div>
      </Container>
    </Box>
  );
};

export default Notes;