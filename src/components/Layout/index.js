import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, List, Tooltip, useMediaQuery, Drawer } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

// Import MUI icons
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

// Import the new icon for Notes
import NotesIcon from '@mui/icons-material/Notes';

// Add this to the imports section at the top
import InfoIcon from '@mui/icons-material/Info';

// Constants
// Update the constants at the top
const SIDEBAR_WIDTH = 250;
const MOBILE_SIDEBAR_WIDTH = 100; // Add this new constant
const ICON_SIDEBAR_WIDTH = 70;

// Styled components
const SidebarContainer = styled(Box)(({ theme, isopen }) => ({
  position: 'fixed',
  right: 0,
  top: 0,
  width: isopen === 'true' ? SIDEBAR_WIDTH : ICON_SIDEBAR_WIDTH,
  height: '100vh',
  background: 'rgba(17, 25, 40, 0.95)',
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

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  background: 'rgba(124, 58, 237, 0.9)',
  color: '#fff',
  borderRadius: '50%',
  width: 48,
  height: 48,
  zIndex: 1300,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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
  justifyContent: isopen === 'true' ? 'flex-start' : 'center',
}));

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // State for sidebar visibility - changed default state
  const [open, setOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [iconMode, setIconMode] = useState(true);  // Set to true by default
  
  // Update state when screen size changes
  // Update the useEffect hooks
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
      setIconMode(true);
    } else if (isTablet) {
      setOpen(false);
      setIconMode(true);
    } else {
      setOpen(false);
      setIconMode(true);  // Keep sidebar closed by default on desktop
    }
  }, [isMobile, isTablet]);

  const location = useLocation();

  // Update state when screen size changes
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
      setIconMode(true);
    } else if (isTablet) {
      setOpen(false);
      setIconMode(true);
    } else {
      setOpen(false);
      setIconMode(true);
    }
  }, [isMobile, isTablet]);

  const topMenuItems = [
    { text: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/' },
    { text: 'Practice', icon: <MicRoundedIcon />, path: '/practice' },
    { text: 'History', icon: <HistoryRoundedIcon />, path: '/history' },
    { text: 'Notes', icon: <NotesIcon />, path: '/notes' }, // Add this line
  ];
  
  // Update the bottomMenuItems array
  const bottomMenuItems = [
    { text: 'Profile', icon: <PersonRoundedIcon />, path: '/profile' },
    { text: 'Info', icon: <InfoIcon />, path: '/info' },
    { text: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' },
  ];

  const toggleSidebar = () => {
    if (isMobile) {
      // For mobile, toggle the drawer
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      // For desktop, toggle between icon mode and full sidebar
      setIconMode(!iconMode);
    }
  };

  // Render a navigation item
  const renderNavItem = (item) => {
    const isActive = location.pathname === item.path;
    const showFullSidebar = open && !iconMode;
    // Always show text in mobile view
    const showText = showFullSidebar || isMobile;
    
    return (
      <NavItem
        key={item.text}
        isactive={isActive.toString()}
      >
        <Tooltip 
          title={showText ? '' : item.text} 
          placement="left" 
          arrow
          enterDelay={500}
        >
          <NavLink 
            to={item.path} 
            isopen={showText.toString()} 
            onClick={isMobile ? () => setMobileDrawerOpen(false) : undefined}
          >
            <IconWrapper isactive={isActive.toString()}>
              {item.icon}
            </IconWrapper>
            
            {showText && (
              <Box sx={{ ml: 2, whiteSpace: 'nowrap' }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            )}
          </NavLink>
        </Tooltip>
      </NavItem>
    );
  };

  // Sidebar content component to reuse in both desktop and mobile
  // Update the List components in SidebarContent
  const SidebarContent = () => (
    <>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: open && !iconMode ? 'space-between' : 'center',
        mb: 1,
        borderBottom: '1px solid rgba(124, 58, 237, 0.15)',
        height: 60
      }}>
        {open && !iconMode && (
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
        {!isMobile && (
          <ToggleButton onClick={toggleSidebar} aria-label="Toggle sidebar">
            {!iconMode ? <CloseRoundedIcon /> : <MenuOpenRoundedIcon />}
          </ToggleButton>
        )}
      </Box>
  
      {/* Top menu items */}
      <List sx={{ 
        width: '100%',
        px: open && !iconMode ? 2 : 0,
        pt: 1,
        pb: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '& > *': {
          maxWidth: open && !iconMode ? '100%' : ICON_SIDEBAR_WIDTH - 16,
        }
      }}>
        {topMenuItems.map(renderNavItem)}
      </List>
  
      {/* Spacer - adjust height for mobile */}
      <Box sx={{ 
        flexGrow: 1,
        minHeight: isMobile ? '180px' : 'auto' // Increased from '20px' to '100px'
      }} />
  
      {/* Bottom menu items */}
      <List sx={{ 
        width: '100%',
        px: open && !iconMode ? 2 : 0,
        pt: 1,
        pb: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '& > *': {
          maxWidth: open && !iconMode ? '100%' : ICON_SIDEBAR_WIDTH - 16,
        }
      }}>
        {bottomMenuItems.map(renderNavItem)}
      </List>
      
      {open && !iconMode && (
        <Box 
          sx={{ 
            p: 2, 
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
    </>
  );

  // Calculate main content padding
  const getMainContentPadding = () => {
    if (isMobile) {
      return '20px'; // No sidebar on mobile by default
    } else if (iconMode) {
      return `24px ${24}px 24px 24px`;
    } else {
      return `24px ${24}px 24px 24px`;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      Height: '100%',
      position: 'relative',
      overflow: 'hidden'  // Add this to prevent scrolling issues
    }}>
      <Outlet />
      {/* Content area with proper padding */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          padding: getMainContentPadding(),
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          backgroundAttachment: 'fixed',
          position: 'relative',  // Add this
          height: '100%',
          display: 'none',
          // Remove minHeight: '100vh' as it's causing the extra space
          boxSizing: 'border-box',
          transition: theme => theme.transitions.create(['padding'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        {children}
      </Box>

      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && (
        <SidebarContainer isopen={(open && !iconMode).toString()}>
          <SidebarContent />
        </SidebarContainer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: MOBILE_SIDEBAR_WIDTH, // Changed from SIDEBAR_WIDTH
            background: 'rgba(17, 25, 40, 0.95)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1px solid rgba(124, 58, 237, 0.15)',
            boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.2)',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <Box sx={{ position: 'relative', height: '100%' }}>
          <SidebarContent />
          <IconButton
            onClick={() => setMobileDrawerOpen(false)}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: 'white',
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </Drawer>
      )}

      {/* Mobile menu button */}
      {isMobile && (
        <MobileMenuButton 
          onClick={toggleSidebar} 
          aria-label="Open menu"
        >
          <MenuRoundedIcon />
        </MobileMenuButton>
      )}
    </Box>
  );
};

export default Layout;