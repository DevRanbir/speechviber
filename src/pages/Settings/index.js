import React, { useState, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Switch,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Slider,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Cookie as CookieIcon,
  DataSaverOn as DataSaverOnIcon,
  Fingerprint as FingerprintIcon,
  Animation as AnimationIcon,
  FontDownload as FontDownloadIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import { ThemeContext } from '../../context/ThemeContext';

// Beautiful color palettes
const colorPalettes = {
  blue: {
    primary: '#3a86ff',
    secondary: '#8338ec',
    name: 'Ocean Blue'
  },
  green: {
    primary: '#38b000',
    secondary: '#1a759f',
    name: 'Forest Green'
  },
  pink: {
    primary: '#ff006e',
    secondary: '#8338ec',
    name: 'Vibrant Pink'
  },
  amber: {
    primary: '#fb8500',
    secondary: '#023e8a',
    name: 'Amber Gold'
  },
  turquoise: {
    primary: '#06d6a0',
    secondary: '#073b4c',
    name: 'Turquoise'
  }
};

const SettingsApp = () => {
  const theme = useTheme();
  const { currentTheme, setTheme } = useContext(ThemeContext);
  const [tabValue, setTabValue] = useState(0);
  const [settingsChanged, setSettingsChanged] = useState(false);
  
  const [settings, setSettings] = useState({
    // Appearance settings
    theme: currentTheme || 'dark',
    colorPalette: 'blue',
    animations: true,
    fontSize: 16,
    
    // Content settings
    language: 'english',
    region: 'us',
    contentDensity: 'balanced',
    
    // Privacy settings
    cookieConsent: {
      necessary: true,
      preferences: true,
      statistics: true,
      marketing: false
    },
    dataCollection: 'minimal',
    biometricLogin: false,
    
    // Notifications settings
    notifications: {
      email: true,
      push: true,
      newsletter: false,
      productUpdates: true
    },
    
    // Performance settings
    dataSaver: false,
    prefetch: true,
    imageQuality: 'high'
  });

  const handleChange = (setting, value) => {
    if (typeof setting === 'string' && setting.includes('.')) {
      // Handle nested settings (e.g., notifications.email)
      const [parent, child] = setting.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [setting]: value }));
    }
    
    // Apply theme change immediately
    if (setting === 'theme') {
      setTheme(value);
    }
    
    setSettingsChanged(true);
  };

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveSettings = () => {
    // Here you would typically save settings to your backend or localStorage
    console.log('Saving settings:', settings);
    // For demo purposes, show a success message or notification
    alert('Settings saved successfully!');
    setSettingsChanged(false);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      // Define your default settings here
      const defaultSettings = {
        theme: 'system',
        colorPalette: 'blue',
        animations: true,
        fontSize: 16,
        language: 'english',
        region: 'us',
        contentDensity: 'balanced',
        cookieConsent: {
          necessary: true,
          preferences: true,
          statistics: false,
          marketing: false
        },
        dataCollection: 'minimal',
        biometricLogin: false,
        notifications: {
          email: true,
          push: false,
          newsletter: false,
          productUpdates: true
        },
        dataSaver: false,
        prefetch: true,
        imageQuality: 'medium'
      };
      
      setSettings(defaultSettings);
      setTheme(defaultSettings.theme);
      setSettingsChanged(true);
    }
  };

  const renderSwitch = (name, checked, label) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Typography variant="body2">{label}</Typography>
      <Switch
        checked={checked}
        onChange={(e) => handleChange(name, e.target.checked)}
        color="primary"
        size="small"
      />
    </Box>
  );

  // Create a visually appealing gradient background based on current theme and color palette
  const gradientBackground = theme.palette.mode === 'dark'
    ? `linear-gradient(145deg, ${alpha(colorPalettes[settings.colorPalette].primary, 0.2)} 0%, ${alpha(colorPalettes[settings.colorPalette].secondary, 0.2)} 100%)`
    : `linear-gradient(145deg, ${alpha(colorPalettes[settings.colorPalette].primary, 0.1)} 0%, ${alpha(colorPalettes[settings.colorPalette].secondary, 0.1)} 100%)`;

  const tabs = [
    {
      label: 'Appearance',
      icon: <PaletteIcon fontSize="small" />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
            Visual Preferences
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Theme Mode</Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              mb: 2
            }}>
              {['light', 'dark', 'system'].map((themeOption) => (
                <Card 
                  key={themeOption}
                  onClick={() => handleChange('theme', themeOption)}
                  sx={{
                    width: '33%',
                    p: 1.5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: settings.theme === themeOption ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <Box sx={{ mb: 1 }}>
                    {themeOption === 'light' && <LightModeIcon />}
                    {themeOption === 'dark' && <DarkModeIcon />}
                    {themeOption === 'system' && <DeviceThermostatIcon />}
                  </Box>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {themeOption}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Color Palette</Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 1,
              mb: 2
            }}>
              {Object.entries(colorPalettes).map(([key, palette]) => (
                <Tooltip key={key} title={palette.name}>
                  <Box
                    onClick={() => handleChange('colorPalette', key)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
                      border: settings.colorPalette === key ? `2px solid ${theme.palette.common.white}` : '2px solid transparent',
                      outline: settings.colorPalette === key ? `2px solid ${palette.primary}` : 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Font Size</Typography>
            <Slider
              value={settings.fontSize}
              min={12}
              max={20}
              step={1}
              marks={[
                { value: 12, label: 'Small' },
                { value: 16, label: 'Medium' },
                { value: 20, label: 'Large' }
              ]}
              onChange={(_, value) => handleChange('fontSize', value)}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}px`}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Content Density</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={settings.contentDensity}
                onChange={(e) => handleChange('contentDensity', e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="compact">Compact - Show more content</MenuItem>
                <MenuItem value="balanced">Balanced</MenuItem>
                <MenuItem value="comfortable">Comfortable - More spacious</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 1 }}>
            {renderSwitch('animations', settings.animations, 'Enable animations and transitions')}
          </Box>
        </Box>
      )
    },
    {
      label: 'Content',
      icon: <LanguageIcon fontSize="small" />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
            Content Settings
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Language</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="english">English</MenuItem>
                <MenuItem value="spanish">Español</MenuItem>
                <MenuItem value="french">Français</MenuItem>
                <MenuItem value="german">Deutsch</MenuItem>
                <MenuItem value="chinese">中文</MenuItem>
                <MenuItem value="japanese">日本語</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Content Region</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={settings.region}
                onChange={(e) => handleChange('region', e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="us">United States</MenuItem>
                <MenuItem value="eu">Europe</MenuItem>
                <MenuItem value="asia">Asia</MenuItem>
                <MenuItem value="global">Global - All Regions</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Font Family</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={settings.fontFamily || 'system'}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="system">System Default</MenuItem>
                <MenuItem value="roboto">Roboto</MenuItem>
                <MenuItem value="openSans">Open Sans</MenuItem>
                <MenuItem value="montserrat">Montserrat</MenuItem>
                <MenuItem value="merriweather">Merriweather</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )
    },
    {
      label: 'Privacy',
      icon: <SecurityIcon fontSize="small" />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
            Privacy & Security
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Cookie Preferences</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {renderSwitch('cookieConsent.necessary', settings.cookieConsent.necessary, 'Necessary Cookies (Required)')}
              {renderSwitch('cookieConsent.preferences', settings.cookieConsent.preferences, 'Preference Cookies')}
              {renderSwitch('cookieConsent.statistics', settings.cookieConsent.statistics, 'Analytics & Statistics')}
              {renderSwitch('cookieConsent.marketing', settings.cookieConsent.marketing, 'Marketing & Advertising')}
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Data Collection</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={settings.dataCollection}
                onChange={(e) => handleChange('dataCollection', e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="minimal">Minimal - Essential data only</MenuItem>
                <MenuItem value="balanced">Balanced - Improve user experience</MenuItem>
                <MenuItem value="full">Full - Personalized experience</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 1 }}>
            {renderSwitch('biometricLogin', settings.biometricLogin, 'Enable biometric authentication (if available)')}
          </Box>
        </Box>
      )
    },
    {
      label: 'Notifications',
      icon: <NotificationsIcon fontSize="small" />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
            Notification Preferences
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {renderSwitch('notifications.push', settings.notifications.push, 'Push Notifications')}
            {renderSwitch('notifications.email', settings.notifications.email, 'Email Notifications')}
            {renderSwitch('notifications.productUpdates', settings.notifications.productUpdates, 'Product Updates & Announcements')}
            {renderSwitch('notifications.newsletter', settings.notifications.newsletter, 'Newsletter Subscription')}
          </Box>
        </Box>
      )
    },
    {
      label: 'Performance',
      icon: <DataSaverOnIcon fontSize="small" />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
            Performance Settings
          </Typography>

          <Box sx={{ mb: 3 }}>
            {renderSwitch('dataSaver', settings.dataSaver, 'Data Saver Mode')}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              Reduces data usage by loading lower resolution images and optimizing content
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            {renderSwitch('prefetch', settings.prefetch, 'Enable link prefetching')}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              Preloads linked pages for faster navigation
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Image Quality</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={settings.imageQuality}
                onChange={(e) => handleChange('imageQuality', e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="low">Low - Fastest loading</MenuItem>
                <MenuItem value="medium">Medium - Balanced</MenuItem>
                <MenuItem value="high">High - Best quality</MenuItem>
                <MenuItem value="auto">Auto - Based on connection</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',
      transition: 'all 0.3s ease',
      background: theme.palette.mode === 'dark' 
        ? `${theme.palette.background.default} radial-gradient(circle at top right, ${alpha(colorPalettes[settings.colorPalette].primary, 0.15)}, transparent 60%)`
        : `${theme.palette.background.default} radial-gradient(circle at top right, ${alpha(colorPalettes[settings.colorPalette].primary, 0.07)}, transparent 60%)`
    }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4
        }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              backgroundImage: `linear-gradient(135deg, ${colorPalettes[settings.colorPalette].primary} 0%, ${colorPalettes[settings.colorPalette].secondary} 100%)`,
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Settings
          </Typography>
          
          <Tooltip title="Reset to defaults">
            <IconButton onClick={handleResetSettings} color="primary">
              <RestoreIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Card
          elevation={theme.palette.mode === 'dark' ? 2 : 1}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            backgroundImage: gradientBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${
              theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.05)'
            }`,
          }}
        >
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)',
          }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none',
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab 
                  key={index} 
                  label={tab.label} 
                  icon={tab.icon} 
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>
          
          <CardContent sx={{ p: 0 }}>
            {tabs[tabValue].content}
            
            <Box sx={{ 
              p: 2, 
              borderTop: 1, 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)',
            }}>
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={() => setTabValue((tabValue + 1) % tabs.length)}
              >
                Next
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                disabled={!settingsChanged}
                onClick={handleSaveSettings}
                sx={{
                  backgroundImage: `linear-gradient(135deg, ${colorPalettes[settings.colorPalette].primary} 0%, ${colorPalettes[settings.colorPalette].secondary} 100%)`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                Save Changes
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InfoIcon fontSize="small" />
            Your settings are automatically synced across all your devices
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

// This component would typically be imported but we're including it here
const DeviceThermostatIcon = () => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 13V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V13C7.79 13.91 7 15.37 7 17C7 19.76 9.24 22 12 22C14.76 22 17 19.76 17 17C17 15.37 16.21 13.91 15 13ZM12 4C12.55 4 13 4.45 13 5V8H11V5C11 4.45 11.45 4 12 4Z" fill="currentColor"/>
    </svg>
  );
};

export default SettingsApp;