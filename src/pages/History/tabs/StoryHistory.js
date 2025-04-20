import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Grid,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuth } from '../../../contexts/AuthContext';
import { AutoStories as StoryIcon } from '@mui/icons-material';

const StoryHistory = () => {
  const [storyData, setStoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchStoryData = async () => {
      if (!currentUser) return;
      
      try {
        const database = getDatabase();
        const storyRef = ref(database, `users/${currentUser.uid}/storymode/data`);
        
        onValue(storyRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Convert the object to an array and sort by time (newest first)
            const storyArray = Object.entries(data).map(([key, value]) => ({
              id: key,
              ...value
            })).sort((a, b) => new Date(b.time) - new Date(a.time));
            
            setStoryData(storyArray);
          } else {
            setStoryData([]);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('Error fetching story data:', error);
        setLoading(false);
      }
    };

    fetchStoryData();
  }, [currentUser]);

  const getScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Format date using native JavaScript
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    
    return `${month} ${day}, ${year} • ${formattedHours}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (storyData.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <StoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No story analysis history found
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Try analyzing a story in the Story Analyzer mode to see your results here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Your Story Analysis History
      </Typography>
      
      <Grid container spacing={3}>
        {storyData.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StoryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Story Analysis
                  </Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    {formatDate(item.time)}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    border: `3px solid ${getScoreColor(item.score)}`,
                    backgroundColor: theme.palette.background.paper
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: getScoreColor(item.score)
                      }}
                    >
                      {item.score}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StoryHistory;