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
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import TranslateIcon from '@mui/icons-material/Translate';
import DuoIcon from '@mui/icons-material/Duo';

const activityTypes = [
  { id: 'IRA', label: 'Interview Readiness Analyzer', icon: PresentToAllIcon },
  { id: 'expressionMatcher', label: 'Expression Matcher', icon: TranslateIcon },
  { id: 'full', label: 'Full Mode', icon: DuoIcon }
];

const activityIcons = {
  IRA: PresentToAllIcon,
  expressionMatcher: TranslateIcon,
  full: DuoIcon
};

const VisualHistory = ({ activities }) => {
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
        Recent Visual Learning Activities
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
            icon={<PresentToAllIcon />}
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
          const IconComponent = activityIcons[activity.type] || PresentToAllIcon;
          
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
                      Analysis Score: {activity.score || 'N/A'}
                    </Typography>
                    {activity.feedback && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Feedback: {activity.feedback}
                      </Typography>
                    )}
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
              No {selectedTab === 'all' ? 'visual learning' : selectedTab} activities found
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default VisualHistory;