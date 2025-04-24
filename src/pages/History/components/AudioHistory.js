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
import MicIcon from '@mui/icons-material/Mic';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimerIcon from '@mui/icons-material/Timer';

const activityTypes = [
  { id: 'speech', label: 'Speech Practice', icon: MicIcon, color: '#3f51b5' },
  { id: 'debate', label: 'Debate Mode', icon: GroupsIcon, color: '#009688' },
  { id: 'story', label: 'Story Time', icon: AutoStoriesIcon, color: '#f44336' },
  { id: 'publicSpeaking', label: 'Public Speaking', icon: PresentToAllIcon, color: '#ff9800' },
  { id: 'wordCircumlocution', label: 'Word Wizardry', icon: RecordVoiceOverIcon, color: '#2196f3' },
  { id: 'speechPrecision', label: 'Speech Precision', icon: HeadsetMicIcon, color: '#9c27b0' }
];

const activityIcons = {
  speech: MicIcon,
  debate: GroupsIcon,
  story: AutoStoriesIcon,
  publicSpeaking: PresentToAllIcon,
  wordCircumlocution: RecordVoiceOverIcon,
  speechPrecision: HeadsetMicIcon
};

const activityColors = {
  speech: '#3f51b5',
  debate: '#009688',
  story: '#f44336',
  publicSpeaking: '#ff9800',
  wordCircumlocution: '#2196f3',
  speechPrecision: '#9c27b0'
};

const AudioHistory = () => {
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

      // Process Fast Track Analysis
      if (data['fasttractanalysis']) {
        Object.entries(data['fasttractanalysis']).forEach(([key, value]) => {
          Object.values(value).forEach(interview => {
            allActivities.push({
              id: `speech-${key}`,
              type: 'speech',
              title: 'Fast Track Analysis',
              timestamp: interview.time,
              score: `${interview.averageScore}%`,
              rawScore: interview.averageScore,
              duration: interview.duration || 'N/A',
              chips: interview.questionScores 
                ? interview.questionScores.map(qs => `Q${qs.question}: ${qs.score}%`)
                : []
            });
          });
        });
      }

      // Process Debate Mode
      if (data['debate']) {
        Object.entries(data['debate']).forEach(([key, value]) => {
          Object.values(value).forEach(debate => {
            allActivities.push({
              id: `debate-${key}`,
              type: 'debate',
              title: `Debate: ${debate.topic}`,
              timestamp: debate.time,
              score: `${debate.score}%`,
              rawScore: debate.score,
              duration: debate.duration || 'N/A',
              chips: [
                `Result: ${debate.result}`,
                `Difficulty: ${debate.difficulty}`,
                `Position: ${debate.position}`
              ]
            });
          });
        });
      }

      // Process Story Mode
      if (data['storymode']) {
        Object.entries(data['storymode']).forEach(([key, value]) => {
          Object.values(value).forEach(story => {
            allActivities.push({
              id: `story-${key}`,
              type: 'story',
              title: 'Story Time Analysis',
              timestamp: story.time,
              score: `${story.score}%`,
              rawScore: story.score, 
              duration: story.duration || 'N/A',
              chips: [
                story.book ? `Book: ${story.book}` : 'Custom Story',
                story.difficulty ? `Difficulty: ${story.difficulty}` : ''
              ].filter(item => item)
            });
          });
        });
      }

      // Process Public Speaking
      if (data['public-speaking']) {
        Object.entries(data['public-speaking']).forEach(([key, speech]) => {
          allActivities.push({
            id: `publicSpeaking-${key}`,
            type: 'publicSpeaking',
            title: `Speech: ${speech.topic}`,
            timestamp: speech.timestamp,
            duration: speech.duration || 'N/A',
            score: `${speech.scores?.overall || 0}%`,
            rawScore: speech.scores?.overall || 0,
            chips: [
              `Type: ${speech.speechType}`,
              `Difficulty: ${speech.difficulty}`
            ]
          });
        });
      }

      // Process Word Wizardry
      if (data['word-wizardry']) {
        Object.entries(data['word-wizardry']).forEach(([key, game]) => {
          allActivities.push({
            id: `wordCircumlocution-${key}`,
            type: 'wordCircumlocution',
            title: `Word: ${game.word}`,
            timestamp: game.timestamp,
            duration: game.duration || 'N/A',
            score: `${game.scores?.overall || 0}%`,
            rawScore: game.scores?.overall || 0,
            chips: [
              `Category: ${game.category}`,
              `Difficulty: ${game.difficulty}`
            ]
          });
        });
      }

      // Process Speech Precision
      if (data['pronunciation-pro']) {
        Object.entries(data['pronunciation-pro']).forEach(([key, game]) => {
          allActivities.push({
            id: `speechPrecision-${key}`,
            type: 'speechPrecision',
            title: `Focus: ${game.focus}`,
            timestamp: game.timestamp,
            duration: game.duration || 'N/A',
            score: `${game.scores?.overall || 0}%`,
            rawScore: game.scores?.overall || 0,
            chips: [
              `Category: ${game.category}`,
              `Difficulty: ${game.difficulty}`
            ]
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

  const renderActivityItem = (activity) => {
    const IconComponent = activityIcons[activity.type] || MicIcon;
    const activityColor = activityColors[activity.type] || theme.palette.primary.main;
    const isHighScore = activity.rawScore === highScore && highScore > 0;
    
    // Add date validation and formatting helper
    const formatDate = (timestamp) => {
      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        return format(date, 'PPp');
      } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid Date';
      }
    };

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
                    {formatDate(activity.timestamp)}
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
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                    <TimerIcon sx={{ fontSize: '0.9rem', mr: 0.5, verticalAlign: 'middle' }} />
                    {activity.duration}s
                  </Typography>
                  
                  {isMobile && (
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                      {formatDate(activity.timestamp)}
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
                  {formatDate(activity.timestamp)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimerIcon sx={{ fontSize: '0.9rem', mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="textSecondary">
                  Duration: {activity.duration}s
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
          My Audio Practice Journey
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
                    icon={<MicIcon />}
                    iconPosition="start"
                    sx={{ py: 1.5 }}
                    wrapped
                  />
                  
                  {activityTypes.map(type => (
                    <Tab
                      key={type.id}
                      label={
                        <Badge 
                          badgeContent={activityCounts[type.id] || null} 
                          color="secondary"
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <type.icon sx={{ mr: 1 }} />
                            {type.label}
                          </Box>
                        </Badge>
                      }
                      value={type.id}
                      wrapped
                      sx={{ py: 1.5 }}
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
                No audio practice activities found. Start practicing to see your progress!
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

// Add default export
export default AudioHistory;