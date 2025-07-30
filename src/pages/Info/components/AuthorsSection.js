import React from 'react';
import { Paper, Typography, Grid, Box, Avatar, Chip } from '@mui/material';
import { Code as CodeIcon, Psychology as PsychologyIcon, Architecture as ArchitectureIcon } from '@mui/icons-material';

const teamMembers = [
  {
    name: 'Sarabdeep Singh Bilkhu',
    role: 'AI Engineer',
    position: 'AI Integration Lead',
    icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
    color: '#10B981'
  },
  {
    name: 'Ranbir Khurana',
    role: 'Team Lead',
    position: 'Project Manager & Lead Developer',
    icon: <ArchitectureIcon sx={{ fontSize: 40 }} />,
    color: '#10B981'
  },
  {
    name: 'Akshay Kumar',
    role: 'Full Frontend Developer',
    position: 'Frontend Designer',
    icon: <CodeIcon sx={{ fontSize: 40 }} />,
    color: '#10B981'
  }
];

const AuthorsSection = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" gutterBottom>Meet The #Vibers</Typography>
      </Box>
      <Grid container spacing={3}>
        {teamMembers.map((member, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box 
              sx={{ 
                textAlign: 'center', 
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3,
                  borderColor: member.color
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: `${member.color}15`,
                  color: member.color,
                  border: `2px solid ${member.color}`
                }}
              >
                {member.icon}
              </Avatar>
              <Typography variant="h6" sx={{ mb: 1 }}>{member.name}</Typography>
              <Typography variant="subtitle1" sx={{ color: member.color, fontWeight: 500, mb: 1 }}>
                {member.role}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {member.position}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default AuthorsSection;