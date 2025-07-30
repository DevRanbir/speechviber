import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Divider,
  Tabs,
  Tab,
  Paper,
  Container,
  IconButton,
  Fade,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import TranslateIcon from '@mui/icons-material/Translate';
import DuoIcon from '@mui/icons-material/Duo';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const activityTypes = [
  { id: 'IRA', label: 'Interview Readiness Analyzer', icon: PresentToAllIcon, color: '#3f51b5' },
  { id: 'expressionMatcher', label: 'Expression Matcher', icon: TranslateIcon, color: '#009688' },
  { id: 'full', label: 'Full Mode', icon: DuoIcon, color: '#f44336' }
];

const activityIcons = {
  IRA: PresentToAllIcon,
  expressionMatcher: TranslateIcon,
  full: DuoIcon
};

const activityColors = {
  IRA: '#3f51b5',
  expressionMatcher: '#009688',
  full: '#f44336'
};

const VisualHistory = () => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [activities, setActivities] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const database = getDatabase();
    const activitiesRef = ref(database, `users/${currentUser.uid}`);

    const unsubscribe = onValue(activitiesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const allActivities = [];

      // Process Interview Readiness Analysis
      if (data['interview-readiness']) {
        Object.entries(data['interview-readiness']).forEach(([key, analysis]) => {
          allActivities.push({
            id: key,
            type: 'IRA',
            title: 'Interview Readiness Analysis',
            timestamp: analysis.timestamp,
            score: analysis.score,
            rawScore: parseInt(analysis.score) || 0,
            chips: [
              `Professional: ${analysis.professionalAppearance}%`,
              `Expression: ${analysis.facialExpression}%`,
              `Body Language: ${analysis.bodyLanguage}%`,
              `Overall: ${analysis.overallPresentation}%`
            ]
          });
        });
      }

      // Process Custom Interview Analysis
      if (data['custom-interview-analysis']) {
        Object.entries(data['custom-interview-analysis']).forEach(([key, analysis]) => {
          const scoreChips = Object.entries(analysis)
            .filter(([key]) => !['timestamp', 'imageUrl', 'createdAt', 'overallScore'].includes(key))
            .map(([key, value]) => `${key}: ${typeof value === 'number' ? value + '%' : value}`);
            
          allActivities.push({
            id: key,
            type: 'expressionMatcher',
            title: 'Custom Interview Analysis',
            timestamp: analysis.timestamp,
            score: analysis.overallScore,
            rawScore: parseInt(analysis.overallScore) || 0,
            chips: scoreChips
          });
        });
      }

      // Process Full Interview Analysis
      if (data['interviews'] && data['interviews'].scores) {
        Object.entries(data['interviews'].scores).forEach(([key, score]) => {
          if (score) {
            allActivities.push({
              id: key,
              type: 'full',
              title: `Interview for ${score.jobRole || 'Game tester'} at ${score.company || 'Mogang'}`,
              timestamp: score.createdAt,  // Use createdAt from the score object
              score: score.overallScore,
              rawScore: parseInt(score.overallScore) || 0,
              chips: [
                `Communication: ${score.communication}`,
                `Technical: ${score.technical}`,
                `Cultural: ${score.cultural}`,
                `Confidence: ${score.confidence}`,
                `Image Analysis: ${score.imageAnalysis}`
              ].map(score => `${score}%`)
            });
          }
        });
      }

      // Sort activities by timestamp
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(allActivities);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const filteredActivities = selectedTab === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === selectedTab);

  // Get activity type counts for badges
  const activityCounts = {};
  activityTypes.forEach(type => {
    activityCounts[type.id] = activities.filter(a => a.type === type.id).length;
  });

  // Calculate high score for current filter
  const highScore = filteredActivities.length > 0 
    ? Math.max(...filteredActivities.map(a => a.rawScore || 0))
    : 0;

  // Calculate average score for current filter
  const averageScore = filteredActivities.length > 0
    ? Math.round(filteredActivities.reduce((sum, a) => sum + (a.rawScore || 0), 0) / filteredActivities.length)
    : 0;

  const renderActivityItem = (activity) => {
    const IconComponent = activityIcons[activity.type] || PresentToAllIcon;
    const activityColor = activityColors[activity.type] || theme.palette.primary.main;
    const isHighScore = activity.rawScore === highScore && highScore > 0;
    
    if (viewMode === 'list') {
      return (
        <Fade in={true} timeout={300}>
          <Grid item xs={12} key={activity.id}>
            <Card 
              sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center',
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                },
                borderLeft: `5px solid ${activityColor}`
              }}
            >
              <CardContent sx={{ display: 'flex', width: '100%', py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : '30%', mb: isMobile ? 1 : 0 }}>
                  <IconComponent sx={{ mr: 1, color: activityColor }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {activity.title}
                    {isHighScore && (
                      <Tooltip title="Highest Score">
                        <EmojiEventsIcon sx={{ ml: 1, color: '#FFD700', fontSize: '0.9rem' }} />
                      </Tooltip>
                    )}
                  </Typography>
                </Box>
                
                {!isMobile && (
                  <Typography color="textSecondary" sx={{ width: '20%' }}>
                    {format(new Date(activity.timestamp), 'PPp')}
                  </Typography>
                )}
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center', 
                  width: isMobile ? '100%' : '50%',
                  mt: isMobile ? 1 : 0
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mr: 2, 
                      fontWeight: 'bold',
                      color: isHighScore ? theme.palette.success.main : 'inherit'
                    }}
                  >
                    Score: {activity.score || 'N/A'}%
                  </Typography>
                  
                  {isMobile && (
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                      {format(new Date(activity.timestamp), 'PPp')}
                    </Typography>
                  )}
                  
                  {activity.chips && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {activity.chips.map((chip) => (
                        <Chip
                          key={chip}
                          label={chip}
                          size="small"
                          sx={{ 
                            backgroundColor: `${activityColor}20`,
                            color: activityColor
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Fade>
      );
    }

    // Grid view
    return (
      <Fade in={true} timeout={300}>
        <Grid item xs={12} sm={6} md={4} key={activity.id}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-4px)',
              transition: 'all 0.3s ease'
            },
            position: 'relative',
            overflow: 'visible'
          }}>
            {isHighScore && (
              <Tooltip title="Highest Score">
                <EmojiEventsIcon 
                  sx={{ 
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    color: '#FFD700',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    padding: '2px',
                    boxShadow: 2
                  }} 
                />
              </Tooltip>
            )}
            
            <Box sx={{ 
              bgcolor: activityColor,
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center'
            }}>
              <IconComponent sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'medium', flexGrow: 1 }}>
                {activity.title}
              </Typography>
            </Box>
            
            <CardContent sx={{ flexGrow: 1, pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarMonthIcon sx={{ fontSize: '0.9rem', mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="textSecondary">
                  {format(new Date(activity.timestamp), 'PPp')}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 'bold', 
                    display: 'flex',
                    alignItems: 'center',
                    color: isHighScore ? theme.palette.success.main : 'inherit'
                  }}
                >
                  <TrendingUpIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} />
                  Score: {activity.score || 'N/A'}%
                </Typography>
                
                {activity.chips && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {activity.chips.map((chip) => (
                      <Chip
                        key={chip}
                        label={chip}
                        size="small"
                        sx={{ 
                          backgroundColor: `${activityColor}20`,
                          color: activityColor
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Fade>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Visual Learning Journey
        </Typography>
        
        <Box>
          <Tooltip title={viewMode === 'grid' ? 'List View' : 'Grid View'}>
            <IconButton onClick={toggleViewMode} color="primary">
              {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activities.length > 0 ? (
            <>
              {/* Stats Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
                    <CardContent>
                      <Typography variant="h6">Total Activities</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {activities.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: theme.palette.success.main, color: 'white' }}>
                    <CardContent>
                      <Typography variant="h6">Highest Score</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {highScore}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: theme.palette.warning.main, color: 'white' }}>
                    <CardContent>
                      <Typography variant="h6">Average Score</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {averageScore}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            
              <Paper 
                elevation={3} 
                sx={{ 
                  mb: 3,
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <Tabs 
                  value={selectedTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                      minHeight: 48,
                      textTransform: 'none',
                      fontWeight: 'medium'
                    }
                  }}
                >
                  <Tab 
                    label="All Activities"
                    value="all"
                    icon={<PresentToAllIcon />}
                    iconPosition="start"
                    sx={{ py: 1.5 }}
                    wrapped
                  />
                  
                  {activityTypes.map(type => (
                    <Tab
                      key={type.id}
                      label={type.label}
                      value={type.id}
                      icon={<type.icon />}
                      iconPosition="start"
                      wrapped
                      sx={{ py: 1.5 }}
                      component={activityCounts[type.id] > 0 ? Badge : 'div'}
                      badgeContent={activityCounts[type.id] || null}
                      color="secondary" 
                    />
                  ))}
                </Tabs>
              </Paper>

              <Grid container spacing={3}>
                {filteredActivities.map((activity) => renderActivityItem(activity))}
              </Grid>
            </>
          ) : (
            <Alert 
              severity="info" 
              variant="outlined"
              sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <Typography>
                No visual learning activities found. Start practicing to see your progress!
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default VisualHistory;