import React from 'react';
import { Paper, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Book as BookIcon } from '@mui/icons-material';

const LearnMoreSection = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Learning Resources</Typography>
      <List>
        <ListItem>
          <ListItemIcon><BookIcon /></ListItemIcon>
          <ListItemText 
            primary="Practice Guides" 
            secondary="Detailed guides for each practice module"
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon><BookIcon /></ListItemIcon>
          <ListItemText 
            primary="Tips & Tricks" 
            secondary="Expert tips to improve your speaking skills"
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon><BookIcon /></ListItemIcon>
          <ListItemText 
            primary="Video Tutorials" 
            secondary="Step-by-step tutorials for each feature"
          />
        </ListItem>
      </List>
    </Paper>
  );
};

export default LearnMoreSection;