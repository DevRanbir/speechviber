import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDatabase, ref, onValue } from 'firebase/database';
import { format } from 'date-fns';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Components
import TextualHistory from './components/TextualHistory';
import AudioHistory from './components/AudioHistory';
import VisualHistory from './components/VisualHistory';

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 60,
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const History = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recentActivities, setRecentActivities] = useState({
    textual: [],
    audio: [],
    visual: []
  });

  useEffect(() => {
    if (!currentUser) return;

    const db = getDatabase();
    const activitiesRef = ref(db, `users/${currentUser.uid}/activities`);

    const unsubscribe = onValue(activitiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const activities = {
          textual: [],
          audio: [],
          visual: []
        };

        Object.entries(data).forEach(([key, value]) => {
          const activity = { id: key, ...value };
          if (value.category === 'textual') activities.textual.push(activity);
          else if (value.category === 'audio') activities.audio.push(activity);
          else if (value.category === 'visual') activities.visual.push(activity);
        });

        // Sort activities by timestamp
        Object.keys(activities).forEach(key => {
          activities[key].sort((a, b) => b.timestamp - a.timestamp);
        });

        setRecentActivities(activities);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/dashboard')} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Learning History
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <StyledTab 
            icon={<MenuBookIcon />} 
            label="Textual Learning" 
            iconPosition="start"
          />
          <StyledTab 
            icon={<HeadsetMicIcon />} 
            label="Audio Practice" 
            iconPosition="start"
          />
          <StyledTab 
            icon={<VisibilityIcon />} 
            label="Visual Learning" 
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <TextualHistory activities={recentActivities.textual} />}
          {activeTab === 1 && <AudioHistory activities={recentActivities.audio} />}
          {activeTab === 2 && <VisualHistory activities={recentActivities.visual} />}
        </Box>
      </Paper>
    </Container>
  );
};

export default History;
