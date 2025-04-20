import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Icon
} from '@mui/material';
import {
  Info as InfoIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  Update as UpdateIcon,
  MenuBook as LearnIcon
} from '@mui/icons-material';

const AboutSection = ({ onTabChange }) => {
  const sections = [
    {
      title: 'About',
      icon: <InfoIcon />,
      description: 'Learn about SpeechViber and our mission to improve English speaking skills.',
      tab: 'about'
    },
    {
      title: 'Authors',
      icon: <PersonIcon />,
      description: 'Meet the team behind SpeechViber and their expertise.',
      tab: 'authors'
    },
    {
      title: 'Help Desk',
      icon: <HelpIcon />,
      description: 'Get support, report issues, and track your support tickets.',
      tab: 'helpdesk'
    },
    {
      title: 'Updates',
      icon: <UpdateIcon />,
      description: 'Stay informed about the latest features and improvements.',
      tab: 'updates'
    },
    {
      title: 'Learn More',
      icon: <LearnIcon />,
      description: 'Discover additional resources and documentation.',
      tab: 'learn'
    }
  ];

  const handleNavigate = (tab) => {
    const tabIndexes = {
      'about': 0,
      'learn': 1,
      'authors': 2,
      'helpdesk': 3,
      'updates': 4
    };
    onTabChange(tabIndexes[tab]);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>About SpeechViber</Typography>
      <Typography paragraph>
        SpeechViber is an innovative platform designed to help users improve their English speaking skills
        through various interactive exercises and AI-powered feedback systems.
      </Typography>
      <Typography paragraph>
        Our mission is to make English learning accessible, engaging, and effective for everyone,
        regardless of their current proficiency level.
      </Typography>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Explore Our Sections</Typography>
      <Grid container spacing={2}>
        {sections.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.tab}>
            <Card>
              <CardActionArea onClick={() => handleNavigate(section.tab)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {section.icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {section.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default AboutSection;