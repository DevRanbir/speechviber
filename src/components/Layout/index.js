import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MicIcon from '@mui/icons-material/Mic';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const DRAWER_WIDTH = 250;
const MINI_DRAWER_WIDTH = 80; // Reduced from 80

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
      width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(124, 58, 237, 0.1)', // Changed from borderRight
      borderRight: 'none', // Added to remove right border
      right: 0, // Added to position on right
      left: 'auto', // Added to override default left positioning
      boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.1)', // Adjusted shadow direction
      transition: theme.transitions.create(['width', 'transform'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),
    },
  }),
);

const NavItem = styled(motion.div)(({ theme, active }) => ({
  marginBottom: theme.spacing(1.5),
  borderRadius: 16,
  background: active ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(124, 58, 237, 0.1)',
  overflow: 'hidden',
  '&:hover': {
    background: 'rgba(124, 58, 237, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.15)',
  },
}));

const GlowingIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120%',
    height: '120%',
    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0) 70%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::after': {
    opacity: 1,
  },
}));

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Practice', icon: <MicIcon />, path: '/practice' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <StyledDrawer
        variant="permanent"
        open={open}
      >
        <Box sx={{ 
          p: 2, // Reduced from p: 3
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: open ? 'space-between' : 'center',
          borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
        }}>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold',
                  }}
                >
                  SpeechViber
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
          <IconButton 
            onClick={() => setOpen(!open)}
            sx={{ 
              color: 'primary.light',
              '&:hover': {
                background: 'rgba(124, 58, 237, 0.1)',
              }
            }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>

        <List sx={{ px: 1, mt: 1 }}> {/* Reduced padding and margin */}
          {menuItems.map((item, index) => (
            <NavItem
              key={item.text}
              active={location.pathname === item.path ? 1 : 0}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem
                component={Link}
                to={item.path}
                sx={{
                  px: 1.5, // Reduced padding
                  py: 1.2,  // Reduced padding
                  transition: 'all 0.3s ease',
                }}
              >
                <GlowingIcon>
                  <ListItemIcon 
                    sx={{ 
                      color: 'primary.light',
                      minWidth: open ? 40 : '100%',
                      textAlign: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </GlowingIcon>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <ListItemText 
                        primary={item.text}
                        sx={{ 
                          color: 'text.primary',
                          '& .MuiListItemText-primary': {
                            fontWeight: location.pathname === item.path ? 600 : 400,
                          }
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </ListItem>
            </NavItem>
          ))}
        </List>
      </StyledDrawer>
      <Box
        component={motion.main}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          backgroundAttachment: 'fixed',
          transition: theme => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          marginRight: `${MINI_DRAWER_WIDTH}px`,
          ...(open && {
            marginRight: `${DRAWER_WIDTH}px`,
          }),
          padding: '24px',
          marginLeft: '-24px', // Add negative margin to remove the extra space
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;