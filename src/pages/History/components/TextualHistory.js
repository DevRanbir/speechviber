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
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SchoolIcon from '@mui/icons-material/School';

const activityTypes = [
  { id: 'mcq', label: 'MCQ Challenge', icon: EditIcon },
  { id: 'vocabulary', label: 'Word Power', icon: MenuBookIcon },
  { id: 'grammar', label: 'Grammar Check', icon: SpellcheckIcon },
  { id: 'tongueTwister', label: 'Tongue Twister', icon: RecordVoiceOverIcon },
  { id: 'wordContext', label: 'Word in Context', icon: SchoolIcon },
  { id: 'grammarFill', label: 'Grammar Fill', icon: EditIcon }
];

const activityIcons = {
  mcq: EditIcon,
  vocabulary: MenuBookIcon,
  grammar: SpellcheckIcon,
  tongueTwister: RecordVoiceOverIcon,
  wordContext: SchoolIcon,
  grammarFill: EditIcon
};

const TextualHistory = ({ activities }) => {
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
        Recent Textual Learning Activities
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
            icon={<MenuBookIcon />}
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
          const IconComponent = activityIcons[activity.type] || EditIcon;
          
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
                      Score: {activity.score || 'N/A'}
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
              No {selectedTab === 'all' ? 'textual learning' : selectedTab} activities found
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TextualHistory;