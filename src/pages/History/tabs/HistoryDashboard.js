import React, { useMemo, useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme
} from '@mui/material';
import { 
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  QuizOutlined as QuizIcon,
  SpellcheckOutlined as SpellcheckIcon,
  GradingOutlined as GrammarIcon,
  MicOutlined as MicIcon,
  ChatOutlined as ChatIcon,
  AutoStoriesOutlined as StoryIcon
} from '@mui/icons-material';

const HistoryDashboard = ({ formatDate, navigate }) => {
  const { currentUser } = useAuth();
  const database = getDatabase();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const historyRef = ref(database, `users/${currentUser.uid}/history/data`);
    onValue(historyRef, (snapshot) => {
      try {
        const data = snapshot.val() || {};
        
        // Convert activities into array format
        const allActivities = Object.entries(data).map(([timestamp, timeData]) => {
          const activities = timeData.activities || {};
          return Object.entries(activities).map(([key, activity]) => ({
            type: activity.type || 'Practice Session',
            time: activity.date,
            description: activity.description,
            duration: activity.duration,
            score: activity.score || 0,
            id: activity.id
          }));
        }).flat();

        setHistoryData(allActivities);
        setLoading(false);
      } catch (error) {
        console.error("Error processing history data:", error);
        setError("Failed to load history data");
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching history data:", error);
      setError("Failed to load history data");
      setLoading(false);
    });
  }, [currentUser, navigate]);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'Interview Practice': return <QuizIcon color="primary" />;
      case 'Word Power': return <SpellcheckIcon color="secondary" />;
      case 'Grammar Check': return <GrammarIcon color="success" />;
      case 'FastTrack': return <MicIcon color="warning" />;
      case 'Debate': return <ChatIcon color="info" />;
      case 'Story': return <StoryIcon color="error" />;
      case 'Tongue Twister': return <MicIcon color="primary" />;
      default: return <MicIcon color="primary" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'Interview Practice': return 'Interview Practice';
      case 'Word Power': return 'Word Power';
      case 'Grammar Check': return 'Grammar Check';
      case 'FastTrack': return 'FastTrack Analysis';
      case 'Debate': return 'Debate Session';
      case 'Story': return 'Story Analysis';
      case 'Tongue Twister': return 'Tongue Twister';
      default: return type;
    }
  };

  // Calculate average scores for each practice type
  const averageScores = useMemo(() => {
    const activities = historyData || [];
    
    const calculateAvg = (type) => {
      const typeActivities = activities.filter(item => item.type === type);
      if (!typeActivities.length) return 0;
      
      const sum = typeActivities.reduce((acc, item) => acc + (Number(item.score) || 0), 0);
      return Math.round(sum / typeActivities.length);
    };
  
    return {
      interview: calculateAvg('Interview Practice'),
      wordPower: calculateAvg('Word Power'),
      grammar: calculateAvg('Grammar Check'),
      fastTrack: calculateAvg('FastTrack'),
      debate: calculateAvg('Debate'),
      story: calculateAvg('Story')
    };
  }, [historyData]);

  // Get recent activities
  const recentActivities = useMemo(() => {
    if (!historyData) return [];
    
    return historyData
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5)
      .map(activity => ({
        type: activity.type,
        time: activity.time,
        score: activity.score,
        icon: getActivityIcon(activity.type)
      }));
  }, [historyData]);

  const getScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Calculate total practice sessions
  const totalSessions = useMemo(() => {
    return historyData.length || 0;
  }, [historyData]);

  // Calculate overall average score
  const overallAverage = useMemo(() => {
    if (!historyData.length) return 0;
    
    const sum = historyData.reduce((acc, item) => acc + (Number(item.score) || 0), 0);
    return Math.round(sum / historyData.length);
  }, [historyData]);


  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Your Practice Overview
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2,
            boxShadow: theme.shadows[3]
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Total Practice Sessions
                </Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 3, fontWeight: 'bold' }}>
                {totalSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2,
            boxShadow: theme.shadows[3]
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Overall Average Score
                </Typography>
              </Box>
              <Typography 
                variant="h3" 
                align="center" 
                sx={{ 
                  my: 3, 
                  fontWeight: 'bold',
                  color: getScoreColor(overallAverage)
                }}
              >
                {overallAverage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2,
            boxShadow: theme.shadows[3]
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StoryIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Most Recent Activity
                </Typography>
              </Box>
              {recentActivities.length > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {getTypeLabel(recentActivities[0].type)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                    ({formatDate(recentActivities[0].time)})
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body1" align="center" sx={{ my: 3 }}>
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Average Scores by Practice Type */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[3] }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Scores by Practice Type
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1]
                  }}>
                    <QuizIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1">Interview</Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: getScoreColor(averageScores.interview)
                      }}
                    >
                      {averageScores.interview}%
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1]
                  }}>
                    <SpellcheckIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1">Word Power</Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: getScoreColor(averageScores.wordPower)
                      }}
                    >
                      {averageScores.wordPower}%
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1]
                  }}>
                    <GrammarIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1">Grammar</Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: getScoreColor(averageScores.grammar)
                      }}
                    >
                      {averageScores.grammar}%
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1]
                  }}>
                    <MicIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1">FastTrack</Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: getScoreColor(averageScores.fastTrack)
                      }}
                    >
                      {averageScores.fastTrack}%
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1]
                  }}>
                    <ChatIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1">Debate</Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: getScoreColor(averageScores.debate)
                      }}
                    >
                      {averageScores.debate}%
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1]
                  }}>
                    <StoryIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1">Story</Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: getScoreColor(averageScores.story)
                      }}
                    >
                      {averageScores.story}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Activities */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[3] }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {recentActivities.length > 0 ? (
                <List>
                  {recentActivities.map((activity, index) => (
                    <ListItem 
                      key={index}
                      sx={{ 
                        mb: 1, 
                        borderRadius: 1,
                        bgcolor: theme.palette.background.paper,
                        boxShadow: theme.shadows[1]
                      }}
                    >
                      <ListItemIcon>
                        {activity.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={getTypeLabel(activity.type)}
                        secondary={formatDate(activity.time)}
                      />
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: getScoreColor(activity.score),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      >
                        {activity.score}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center" sx={{ my: 3 }}>
                  No recent activities found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HistoryDashboard;