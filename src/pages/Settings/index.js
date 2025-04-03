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
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import MicIcon from '@mui/icons-material/Mic';
import StorageIcon from '@mui/icons-material/Storage';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { ThemeContext } from '../../context/ThemeContext'; // Add this import

const SettingsApp = () => {
  const theme = useTheme();
  const { currentTheme, setTheme } = useContext(ThemeContext); // Add theme context
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    notifications: true,
    language: 'english',
    autoRecord: false,
    storageLimit: '1gb',
    theme: currentTheme || 'dark', // Initialize with current theme
    soundEffects: true,
    autoSave: true
  });

  const handleChange = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    
    // Apply theme change when the theme setting changes
    if (setting === 'theme') {
      setTheme(value);
    }
  };

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  const renderSettingItem = (icon, primary, secondary, type, options) => {
    return (
      <>
        <ListItem sx={{ py: 2 }}>
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary={primary} secondary={secondary} />
          {type === 'switch' ? (
            <Switch
              checked={settings[options.name]}
              onChange={(e) => handleChange(options.name, e.target.checked)}
              color="primary"
            />
          ) : (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={settings[options.name]}
                onChange={(e) => handleChange(options.name, e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                {options.items.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </ListItem>
        <Divider />
      </>
    );
  };

  const tabs = [
    {
      label: 'General',
      content: (
        <List disablePadding>
          {renderSettingItem(
            <NotificationsIcon color="primary" />,
            'Notifications',
            'Enable push notifications',
            'switch',
            { name: 'notifications' }
          )}
          {renderSettingItem(
            <LanguageIcon color="primary" />,
            'Language',
            'Select your preferred language',
            'select',
            {
              name: 'language',
              items: [
                { value: 'english', label: 'English' },
                { value: 'spanish', label: 'Spanish' },
                { value: 'french', label: 'French' }
              ]
            }
          )}
          {renderSettingItem(
            <DarkModeIcon color="primary" />,
            'Theme',
            'Choose your preferred theme',
            'select',
            {
              name: 'theme',
              items: [
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'colorful', label: 'Colorful' }
              ]
            }
          )}
        </List>
      )
    },
    {
      label: 'Recording',
      content: (
        <List disablePadding>
          {renderSettingItem(
            <MicIcon color="primary" />,
            'Auto Recording',
            'Automatically start recording',
            'switch',
            { name: 'autoRecord' }
          )}
          {renderSettingItem(
            <StorageIcon color="primary" />,
            'Storage Limit',
            'Set maximum storage for recordings',
            'select',
            {
              name: 'storageLimit',
              items: [
                { value: '500mb', label: '500 MB' },
                { value: '1gb', label: '1 GB' },
                { value: '2gb', label: '2 GB' }
              ]
            }
          )}
          {renderSettingItem(
            <VolumeUpIcon color="primary" />,
            'Sound Effects',
            'Enable sound effects when recording',
            'switch',
            { name: 'soundEffects' }
          )}
        </List>
      )
    },
    {
      label: 'Advanced',
      content: (
        <List disablePadding>
          {renderSettingItem(
            <ColorLensIcon color="primary" />,
            'Auto Save',
            'Automatically save recordings',
            'switch',
            { name: 'autoSave' }
          )}
        </List>
      )
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            textAlign: 'center',
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Settings
        </Typography>

        <Card
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 41, 59, 0.8)' 
              : 'background.paper',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${
              theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)'
            }`
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
          <CardContent sx={{ p: 0 }}>
            {tabs[tabValue].content}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SettingsApp;