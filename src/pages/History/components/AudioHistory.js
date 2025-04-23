import React, { useState } from 'react';
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
  Paper 
} from '@mui/material';
import { format } from 'date-fns';
import MicIcon from '@mui/icons-material/Mic';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';

const activityTypes = [
  { id: 'speech', label: 'Speech Practice', icon: MicIcon },
  { id: 'debate', label: 'Debate Mode', icon: GroupsIcon },
  { id: 'story', label: 'Story Time', icon: AutoStoriesIcon },
  { id: 'publicSpeaking', label: 'Public Speaking', icon: PresentToAllIcon },
  { id: 'wordCircumlocution', label: 'Word Wizardry', icon: RecordVoiceOverIcon },
  { id: 'speechPrecision', label: 'Speech Precision', icon: HeadsetMicIcon }
];

const activityIcons = {
  speech: MicIcon,
  debate: GroupsIcon,
  story: AutoStoriesIcon,
  publicSpeaking: PresentToAllIcon,
  wordCircumlocution: RecordVoiceOverIcon,
  speechPrecision: HeadsetMicIcon
};

const AudioHistory = ({ activities }) => {
  const [selectedTab, setSelectedTab] = useState('all');

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const filteredActivities = selectedTab === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === selectedTab);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recent Audio Practice Activities
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
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
            }
          }}
        >
          <Tab 
            label="All Activities"
            value="all"
            icon={<MicIcon />}
            iconPosition="start"
          />
          {activityTypes.map(type => (
            <Tab
              key={type.id}
              label={type.label}
              value={type.id}
              icon={<type.icon />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {filteredActivities.map((activity) => {
          const IconComponent = activityIcons[activity.type] || MicIcon;
          
          return (
            <Grid item xs={12} md={6} key={activity.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconComponent color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {activity.title}
                    </Typography>
                  </Box>
                  
                  <Typography color="textSecondary" gutterBottom>
                    {format(new Date(activity.timestamp), 'PPp')}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Duration: {activity.duration || 'N/A'} seconds
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Accuracy: {activity.accuracy || 'N/A'}%
                    </Typography>
                    {activity.chips && (
                      <Box sx={{ mt: 1 }}>
                        {activity.chips.map((chip) => (
                          <Chip
                            key={chip}
                            label={chip}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        
        {filteredActivities.length === 0 && (
          <Grid item xs={12}>
            <Typography color="textSecondary" align="center">
              No {selectedTab === 'all' ? 'audio practice' : selectedTab} activities found
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AudioHistory;