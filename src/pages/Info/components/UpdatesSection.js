import React, { useEffect, useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Update as UpdateIcon } from '@mui/icons-material';

const UpdatesSection = () => {
  const [version, setVersion] = useState('1.0.0');

  useEffect(() => {
    // Get stored version or use default
    const storedVersion = localStorage.getItem('appVersion') || '1.0.0';
    const [major, minor, patch] = storedVersion.split('.').map(Number);
    
    // Increment patch version
    const newVersion = `${major}.${minor}.${patch + 1}`;
    localStorage.setItem('appVersion', newVersion);
    setVersion(newVersion);
  }, []);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Latest Updates</Typography>
      <List>
        <ListItem>
          <ListItemIcon><UpdateIcon /></ListItemIcon>
          <ListItemText 
            primary={`Version ${version}`}
            secondary="Intitializing The speechViber"
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon><UpdateIcon /></ListItemIcon>
          <ListItemText 
            primary="Coming Soon" 
            secondary="New features and improvements in development"
          />
        </ListItem>
      </List>
    </Paper>
  );
};

export default UpdatesSection;