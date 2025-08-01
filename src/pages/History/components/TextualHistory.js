import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
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
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SchoolIcon from '@mui/icons-material/School';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const activityTypes = [
  { id: 'mcq', label: 'MCQ Challenge', icon: EditIcon, color: '#3f51b5' },
  { id: 'vocabulary', label: 'Word Power', icon: MenuBookIcon, color: '#009688' },
  { id: 'grammar', label: 'Grammar Check', icon: SpellcheckIcon, color: '#f44336' },
  { id: 'tongueTwister', label: 'Tongue Twister', icon: RecordVoiceOverIcon, color: '#ff9800' },
  { id: 'wordContext', label: 'Word in Context', icon: SchoolIcon, color: '#2196f3' },
  { id: 'grammarFill', label: 'Grammar Fill', icon: EditIcon, color: '#9c27b0' }
];

const activityIcons = {
  mcq: EditIcon,
  vocabulary: MenuBookIcon,
  grammar: SpellcheckIcon,
  tongueTwister: RecordVoiceOverIcon,
  wordContext: SchoolIcon,
  grammarFill: EditIcon
};

const activityColors = {
  mcq: '#3f51b5',
  vocabulary: '#009688',
  grammar: '#f44336',
  tongueTwister: '#ff9800',
  wordContext: '#2196f3',
  grammarFill: '#4caf50'
};

const TextualHistory = () => {
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

      // Process MCQ Challenges
      if (data['interview-practice']) {
        Object.entries(data['interview-practice']).forEach(([timestamp, challenge]) => {
          allActivities.push({
            id: `mcq-${timestamp}`,
            type: 'mcq',
            title: `MCQ Challenge - ${challenge.jobRole}`,
            timestamp: challenge.time,
            score: `${challenge.score}%`,
            rawScore: challenge.score,
            chips: [
              `Role: ${challenge.jobRole}`,
              `Place: ${challenge.jobPlace}`,
              `Correct: ${challenge.correctCount}`,
              `Accuracy: ${challenge.accuracy}%`
            ]
          });
        });
      }

      // Process Word Power
      if (data['word-power']) {
        Object.entries(data['word-power']).forEach(([key, value]) => {
          Object.values(value).forEach(game => {
            allActivities.push({
              id: `vocab-${key}`,
              type: 'vocabulary',
              title: 'Word Power Challenge',
              timestamp: game.time,
              score: `${game.score}%`,
              rawScore: game.score,
              chips: [`Difficulty: ${game.difficulty}`, `Questions: ${game.attemptedQuestions}`]
            });
          });
        });
      }

      // Process Grammar Check
      if (data['grammar-check']) {
        Object.entries(data['grammar-check']).forEach(([key, value]) => {
          Object.values(value).forEach(check => {
            allActivities.push({
              id: `grammar-${key}`,
              type: 'grammar',
              title: 'Grammar Check',
              timestamp: check.time,
              score: `${check.grammarScore}%`,
              rawScore: check.grammarScore,
              chips: [
                `Structure: ${check.structureScore}%`,
                `Punctuation: ${check.punctuationScore}%`
              ]
            });
          });
        });
      }

      // Process Tongue Twister
      if (data['tongue-twister']) {
        Object.entries(data['tongue-twister']).forEach(([key, value]) => {
          Object.values(value).forEach(game => {
            allActivities.push({
              id: `tongue-${key}`,
              type: 'tongueTwister',
              title: 'Tongue Twister Challenge',
              timestamp: game.time,
              score: `${game.score}%`,
              rawScore: game.score,
              chips: [
                `Accuracy: ${game.accuracy}%`,
                `Type: ${game.questionType}`,
                game.timerEnabled ? `Time: ${game.timeLimit}s` : 'No Timer'
              ]
            });
          });
        });
      }

      // Process Word Context
      if (data['word-context']) {
        Object.entries(data['word-context']).forEach(([key, value]) => {
          Object.values(value).forEach(game => {
            allActivities.push({
              id: `context-${key}`,
              type: 'wordContext',
              title: 'Word Context Challenge',
              timestamp: game.time,
              score: `${game.score}%`,
              rawScore: game.score,
              chips: [
                `Accuracy: ${game.accuracy}%`,
                `Difficulty: ${game.difficulty}`,
                game.timerEnabled ? `Time: ${game.timeLimit}s` : 'No Timer'
              ]
            });
          });
        });
      }

      // Process Grammar Fill
      if (data['grammar-fill']) {
        Object.entries(data['grammar-fill']).forEach(([key, value]) => {
          Object.values(value).forEach(game => {
            allActivities.push({
              id: `fill-${key}`,
              type: 'grammarFill',
              title: `Grammar Fill - ${game.topic}`,
              timestamp: game.time,
              score: `${game.score}%`,
              rawScore: game.score,
              chips: [
                `Accuracy: ${game.accuracy}%`,
                `Difficulty: ${game.difficulty}`,
                game.timerEnabled ? `Time: ${game.timeLimit}s` : 'No Timer'
              ]
            });
          });
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

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'PPp');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const renderActivityItem = (activity) => {
    const IconComponent = activityIcons[activity.type] || EditIcon;
    const activityColor = activityColors[activity.type] || theme.palette.primary.main;
    const isHighScore = activity.rawScore === highScore && highScore > 0;
    
    if (viewMode === 'list') {
      return (
        <Fade in={true} timeout={300} key={activity.id}>
          <Grid item xs={12}>
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
                    Score: {activity.score || 'N/A'}
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
      <Fade in={true} timeout={300} key={activity.id}>
        <Grid item xs={12} sm={6} md={4}>
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
                  Score: {activity.score || 'N/A'}
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
          My Learning Journey
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
                  TabIndicatorProps={{
                    style: {
                      backgroundColor: theme.palette.primary.main
                    }
                  }}
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                      minHeight: 48,
                      textTransform: 'none'
                    }
                  }}
                >
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MenuBookIcon />
                        <span>All Activities</span>
                      </Box>
                    }
                    value="all"
                  />
                  
                  {activityTypes.map(type => {
                    const count = activityCounts[type.id] || 0;
                    return (
                      <Tab
                        key={type.id}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <type.icon />
                            <span>{type.label}</span>
                            {count > 0 && (
                              <Badge
                                badgeContent={count}
                                color="secondary"
                                sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
                              />
                            )}
                          </Box>
                        }
                        value={type.id}
                      />
                    );
                  })}
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
                No textual learning activities found. Start practicing to see your progress!
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default TextualHistory;