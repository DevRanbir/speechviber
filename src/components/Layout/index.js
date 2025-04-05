import React, { useState } from 'react';
import { Box, IconButton, Typography, List, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import MUI icons
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

// Constants
const SIDEBAR_WIDTH = 250;
const ICON_SIDEBAR_WIDTH = 70;

// Styled components
const SidebarContainer = styled(Box)(({ theme, isopen }) => ({
  position: 'fixed',
  right: 0,
  top: 0,
  width: isopen === 'true' ? SIDEBAR_WIDTH : ICON_SIDEBAR_WIDTH,
  height: '100vh',
  background: 'rgba(17, 25, 40, 0.85)',
  backdropFilter: 'blur(16px)',
  borderLeft: '1px solid rgba(124, 58, 237, 0.15)',
  boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.2)',
  zIndex: 1200,
  display: 'flex',
  flexDirection: 'column',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.standard,
  }),
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
  background: 'rgba(124, 58, 237, 0.9)',
  color: '#fff',
  borderRadius: '50%',
  width: 40,
  height: 40,
  '&:hover': {
    background: 'rgba(124, 58, 237, 1)',
  },
}));

const NavItem = styled(Box)(({ theme, isactive }) => ({
  marginBottom: 12,
  width: '100%',
  borderRadius: 12,
  overflow: 'hidden',
  position: 'relative',
  background: isactive === 'true' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'rgba(124, 58, 237, 0.1)',
  },
  // Ensure icon is centered when sidebar is collapsed
  display: 'flex',
  justifyContent: 'center',
}));

const IconWrapper = styled(Box)(({ theme, isactive }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 40,
  height: 40,
  borderRadius: '10px',
  background: isactive === 'true' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
  color: isactive === 'true' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
  '&:hover': {
    color: '#fff',
  },
}));

const NavLink = styled(Link)(({ theme, isopen }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '10px',
  textDecoration: 'none',
  color: '#fff',
  transition: 'all 0.2s ease',
  height: '100%',
  width: '100%',
  // Ensure proper centering when sidebar is collapsed
  justifyContent: isopen === 'true' ? 'flex-start' : 'center',
}));

const TextLabel = styled(motion.div)({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  marginLeft: 16,
});

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/' },
    { text: 'Practice', icon: <MicRoundedIcon />, path: '/practice' },
    { text: 'Profile', icon: <PersonRoundedIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' },
  ];

  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      {/* Content area with proper padding */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          paddingRight: `${open ? SIDEBAR_WIDTH : ICON_SIDEBAR_WIDTH}px`,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          padding: '24px',
          boxSizing: 'border-box',
          transition: theme => theme.transitions.create('padding', {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        {children}
      </Box>

      {/* Sidebar */}
      <SidebarContainer isopen={open.toString()}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: open ? 'space-between' : 'center',
          mb: 1,
          borderBottom: '1px solid rgba(124, 58, 237, 0.15)',
          height: 60
        }}>
          {open && (
            <Typography 
              variant="h6" 
              sx={{ 
                background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}
            >
              SpeechViber
            </Typography>
          )}
          <ToggleButton onClick={toggleSidebar} aria-label="Toggle sidebar">
            {open ? <CloseRoundedIcon /> : <MenuOpenRoundedIcon />}
          </ToggleButton>
        </Box>

        <List sx={{ 
          width: '100%',
          px: open ? 2 : 0,  // Remove padding when closed
          pt: 1,
          pb: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // Ensure items remain centered in the container
          '& > *': {
            maxWidth: open ? '100%' : ICON_SIDEBAR_WIDTH - 16,
          }
        }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <NavItem
                key={item.text}
                isactive={isActive.toString()}
              >
                <Tooltip 
                  title={open ? '' : item.text} 
                  placement="left" 
                  arrow
                  enterDelay={500}
                >
                  <NavLink to={item.path} isopen={open.toString()}>
                    <IconWrapper isactive={isActive.toString()}>
                      {item.icon}
                    </IconWrapper>
                    
                    {open && (
                      <TextLabel>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          {item.text}
                        </Typography>
                      </TextLabel>
                    )}
                  </NavLink>
                </Tooltip>
              </NavItem>
            );
          })}
        </List>

        {open && (
          <Box 
            sx={{ 
              p: 2, 
              mt: 'auto', 
              textAlign: 'center',
              borderTop: '1px solid rgba(124, 58, 237, 0.15)',
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'block',
              }}
            >
              © 2025 SpeechViber
            </Typography>
          </Box>
        )}
      </SidebarContainer>
    </Box>
  );
};

export default Layout;