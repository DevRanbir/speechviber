import React, { useState } from 'react';
import { Container, Box, Typography, Tabs, Tab, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Info as InfoIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// Import components
import AboutSection from './components/AboutSection';
import AuthorsSection from './components/AuthorsSection';
import HelpDeskSection from './components/HelpDeskSection';

const Info = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  useErrorBoundary();
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Information Center
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
          sx={{ mb: 3 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<InfoIcon />} label="About" iconPosition="start" />
          <Tab icon={<PersonIcon />} label="Authors" iconPosition="start" />
          <Tab icon={<HelpIcon />} label="Help Desk" iconPosition="start" />
        </Tabs>

        {activeTab === 0 && <AboutSection onTabChange={setActiveTab} />}
        {activeTab === 1 && <AuthorsSection />}
        {activeTab === 2 && <HelpDeskSection />}
      </motion.div>
    </Container>
  );
};

export default Info;