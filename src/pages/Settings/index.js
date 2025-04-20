import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  alpha,
  useTheme,
  Divider,
  Alert,
  Snackbar,
  Paper,
  FormControlLabel,
  Switch,
  Slider
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  CleaningServices as CleaningServicesIcon,
  Flare as FlareIcon  // Added icon for cursor effects
} from '@mui/icons-material';
import { 
  getAuth, 
  deleteUser, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getDatabase, ref, remove, update } from 'firebase/database';
import { useParticle } from '../../contexts/ParticleContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';

// Simple color palette since we're only keeping the account page
const colorPalette = {
  primary: '#3a86ff',
  secondary: '#8338ec',
  name: 'Ocean Blue',
  error: '#dc3545',
  errorLight: '#ff4d4d',
  warning: '#ff9800',
  success: '#4caf50'
};

const AccountSettingsApp = () => {
  useErrorBoundary();
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const { particleSettings, updateSettings, resetSettings } = useParticle();
  
  // State for delete account dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // State for clear data dialog
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [clearDataPassword, setClearDataPassword] = useState('');
  const [clearDataError, setClearDataError] = useState(null);
  const [clearDataLoading, setClearDataLoading] = useState(false);

  // State for reset password
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!password) {
      setDeleteError('Please enter your password');
      return;
    }
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Delete user data from database
      const db = getDatabase();
      const userDataRef = ref(db, `users/${currentUser.uid}`);
      await remove(userDataRef);
      
      // Delete the user account
      await deleteUser(currentUser);
      
      // Redirect to landing page
      navigate('/');
    } catch (error) {
      setDeleteLoading(false);
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
    }
  };

  // Handle clear user data
  const handleClearData = async () => {
    if (!clearDataPassword) {
      setClearDataError('Please enter your password');
      return;
    }
    
    setClearDataLoading(true);
    setClearDataError(null);
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        clearDataPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Clear user data from database but keep account
      const db = getDatabase();
      const userDataRef = ref(db, `users/${currentUser.uid}`);
      
      // Reset all data paths
      const updates = {
        'mcq-challenges': null,
        'word-power': null,
        'grammar-check': null,
        'fasttractanalysis': null,
        'tongue-twister': null,
        'debate': null,
        'story': null,
        'history/data': null,
        'preferences': null,
        'savedItems': null,
        'profile/stats': {
          totalSessions: 0,
          totalTime: 0,
          averageScore: 0,
          completedChallenges: 0,
          lastActive: new Date().toISOString()
        }
      };
      
      // Update database
      await update(userDataRef, updates);
      
      // Close dialog and show success message
      setClearDataDialogOpen(false);
      setClearDataPassword('');
      setNotification({
        open: true,
        message: 'Your data has been successfully cleared',
        severity: 'success'
      });
      
      setClearDataLoading(false);
    } catch (error) {
      setClearDataLoading(false);
      setClearDataError(error.message || 'Failed to clear data. Please try again.');
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    // Validate passwords
    if (!currentPassword) {
      setResetPasswordError('Please enter your current password');
      return;
    }
    
    if (!newPassword) {
      setResetPasswordError('Please enter a new password');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setResetPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setResetPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    setResetPasswordLoading(true);
    setResetPasswordError(null);
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      // Close dialog and show success message
      setResetPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setNotification({
        open: true,
        message: 'Your password has been successfully updated',
        severity: 'success'
      });
    } catch (error) {
      setResetPasswordLoading(false);
      setResetPasswordError(error.message || 'Failed to update password. Please try again.');
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setNotification({
        open: true,
        message: 'Password reset email sent. Check your inbox.',
        severity: 'info'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || 'Failed to send reset email. Please try again.',
        severity: 'error'
      });
    }
  };

  // Create a visually appealing gradient background based on current theme
  const gradientBackground = theme.palette.mode === 'dark'
    ? `linear-gradient(145deg, ${alpha(colorPalette.primary, 0.2)} 0%, ${alpha(colorPalette.secondary, 0.2)} 100%)`
    : `linear-gradient(145deg, ${alpha(colorPalette.primary, 0.1)} 0%, ${alpha(colorPalette.secondary, 0.1)} 100%)`;

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',
      transition: 'all 0.3s ease',
      background: theme.palette.mode === 'dark' 
        ? `${theme.palette.background.default} radial-gradient(circle at top right, ${alpha(colorPalette.primary, 0.15)}, transparent 60%)`
        : `${theme.palette.background.default} radial-gradient(circle at top right, ${alpha(colorPalette.primary, 0.07)}, transparent 60%)`
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
              backgroundImage: `linear-gradient(135deg, ${colorPalette.primary} 0%, ${colorPalette.secondary} 100%)`,
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Account Settings
          </Typography>
          
          <AccountCircleIcon 
            fontSize="large" 
            sx={{ 
              color: colorPalette.primary,
              backgroundColor: alpha(colorPalette.primary, 0.1),
              borderRadius: '50%',
              padding: 1,
              boxSizing: 'content-box'
            }} 
          />
        </Box>

        {/* Cursor Effects Card - Styled to match other cards */}
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
            mb: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FlareIcon sx={{ mr: 1, color: colorPalette.secondary }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Cursor Effects
              </Typography>
            </Box>
            
            <Box sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)',
              p: 3,
              borderRadius: 2,
              mb: 3
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3 
              }}>
                <Typography variant="body1">
                  Customize the particle effects that follow your cursor and appear when clicking.
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    resetSettings();
                    setNotification({
                      open: true,
                      message: 'Particle settings have been reset to default',
                      severity: 'success'
                    });
                  }}
                  size="small"
                  sx={{ 
                    borderRadius: 2,
                    ml: 2
                  }}
                >
                  Reset to Default
                </Button>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={particleSettings.enabled}
                    onChange={(e) => updateSettings({ enabled: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: colorPalette.secondary,
                        '&:hover': {
                          backgroundColor: alpha(colorPalette.secondary, 0.1),
                        },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: colorPalette.secondary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body1" fontWeight={500}>
                    Enable Particle Effects
                  </Typography>
                }
              />
              
              {particleSettings.enabled && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={particleSettings.trailEnabled}
                          onChange={(e) => updateSettings({ trailEnabled: e.target.checked })}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colorPalette.secondary,
                              '&:hover': {
                                backgroundColor: alpha(colorPalette.secondary, 0.1),
                              },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colorPalette.secondary,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Mouse Trail Effect
                        </Typography>
                      }
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={particleSettings.clickEnabled}
                          onChange={(e) => updateSettings({ clickEnabled: e.target.checked })}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colorPalette.secondary,
                              '&:hover': {
                                backgroundColor: alpha(colorPalette.secondary, 0.1),
                              },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colorPalette.secondary,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Click Burst Effect
                        </Typography>
                      }
                    />
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Particle Color
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={particleSettings.particleColor}
                          onChange={(e) => updateSettings({ particleColor: e.target.value })}
                          style={{ 
                            width: '60px', 
                            height: '40px', 
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        />
                        <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                          {particleSettings.particleColor}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Trail Particle Count
                      </Typography>
                      <Slider
                        value={particleSettings.trailParticleCount}
                        onChange={(e, value) => updateSettings({ trailParticleCount: value })}
                        min={1}
                        max={5}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{
                          color: colorPalette.secondary,
                          '& .MuiSlider-thumb': {
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: `0px 0px 0px 8px ${alpha(colorPalette.secondary, 0.16)}`
                            },
                          }
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Click Burst Particle Count
                      </Typography>
                      <Slider
                        value={particleSettings.clickParticleCount}
                        onChange={(e, value) => updateSettings({ clickParticleCount: value })}
                        min={5}
                        max={20}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{
                          color: colorPalette.secondary,
                          '& .MuiSlider-thumb': {
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: `0px 0px 0px 8px ${alpha(colorPalette.secondary, 0.16)}`
                            },
                          }
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Particle Size
                      </Typography>
                      <Slider
                        value={particleSettings.particleSize}
                        onChange={(e, value) => updateSettings({ particleSize: value })}
                        min={1}
                        max={5}
                        step={0.5}
                        marks
                        valueLabelDisplay="auto"
                        sx={{
                          color: colorPalette.secondary,
                          '& .MuiSlider-thumb': {
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: `0px 0px 0px 8px ${alpha(colorPalette.secondary, 0.16)}`
                            },
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

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
            mb: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LockResetIcon sx={{ mr: 1, color: colorPalette.primary }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Password Management
              </Typography>
            </Box>
            
            <Box sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)',
              p: 3,
              borderRadius: 2,
              mb: 3
            }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                You can change your password or request a password reset if you've forgotten it.
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setResetPasswordDialogOpen(true)}
                  startIcon={<LockResetIcon />}
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: 2
                  }}
                >
                  Reset Password
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleForgotPassword}
                  sx={{ 
                    borderRadius: 2
                  }}
                >
                  Forgot Password?
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

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
            mb: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CleaningServicesIcon sx={{ mr: 1, color: colorPalette.warning }} />
              <Typography variant="h6" sx={{ fontWeight: 500, color: colorPalette.warning }}>
                Data Management
              </Typography>
            </Box>
            
            <Box sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)',
              p: 3,
              borderRadius: 2,
              mb: 3
            }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Clear your user data without deleting your account. This will reset all your preferences and history.
              </Typography>
              
              <Box sx={{ 
                bgcolor: alpha(colorPalette.warning, 0.05),
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(colorPalette.warning, 0.3)
              }}>
                <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                  Clear All Your Data
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 3 }}>
                  This will remove all your data from our database while keeping your account active.
                  Your saved preferences, history, and personal information will be reset.
                </Typography>
                
                <Button 
                  variant="outlined" 
                  color="warning"
                  onClick={() => setClearDataDialogOpen(true)}
                  startIcon={<CleaningServicesIcon />}
                  sx={{ 
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      bgcolor: 'warning.light',
                      color: 'warning.contrastText'
                    }
                  }}
                >
                  Clear My Data
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

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
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SecurityIcon sx={{ mr: 1, color: colorPalette.error }} />
              <Typography variant="h6" sx={{ fontWeight: 500, color: colorPalette.error }}>
                Danger Zone
              </Typography>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your account details:
              </Typography>
              
              <Box sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)',
                p: 2,
                borderRadius: 2,
                mb: 3
              }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {currentUser?.email || 'Not logged in'}
                </Typography>
                {currentUser?.displayName && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {currentUser.displayName}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Account created:</strong> {currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                    : 'Unknown'}
                </Typography>
              </Box>
              
              <Box sx={{ 
                bgcolor: alpha(colorPalette.error, 0.05),
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: colorPalette.errorLight
              }}>
                <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                  Delete Your Account
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 3 }}>
                  Deleting your account will permanently remove all your data from our servers. This action cannot be undone.
                  All your personal information, saved preferences, and activity history will be erased.
                </Typography>
                
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                  startIcon={<DeleteIcon />}
                  sx={{ 
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      bgcolor: 'error.light',
                      color: 'error.contrastText'
                    }
                  }}
                >
                  Delete Account
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle sx={{ color: colorPalette.error, pb: 1 }}>
          Delete Your Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            This action is permanent and cannot be undone. All your data will be permanently deleted.
            Please enter your password to confirm.
          </DialogContentText>
          {deleteError && (
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: alpha(colorPalette.error, 0.1), 
              borderRadius: 1, 
              borderLeft: '4px solid', 
              borderColor: colorPalette.error 
            }}>
              <Typography variant="body2" color={colorPalette.error}>
                {deleteError}
              </Typography>
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={deleteLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: colorPalette.error,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleteLoading}
            variant="text"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            variant="contained"
            disabled={!password || deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog
        open={clearDataDialogOpen}
        onClose={() => setClearDataDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle sx={{ color: colorPalette.warning, pb: 1 }}>
          Clear Your Data
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            This will reset all your preferences and clear your history while keeping your account active.
            Please enter your password to confirm.
          </DialogContentText>
          {clearDataError && (
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: alpha(colorPalette.warning, 0.1), 
              borderRadius: 1, 
              borderLeft: '4px solid', 
              borderColor: colorPalette.warning 
            }}>
              <Typography variant="body2" color={colorPalette.warning}>
                {clearDataError}
              </Typography>
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={clearDataPassword}
            onChange={(e) => setClearDataPassword(e.target.value)}
            disabled={clearDataLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: colorPalette.warning,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setClearDataDialogOpen(false)} 
            disabled={clearDataLoading}
            variant="text"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearData}
            color="warning" 
            variant="contained"
            disabled={!clearDataPassword || clearDataLoading}
          >
            {clearDataLoading ? 'Clearing...' : 'Clear My Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: colorPalette.primary, pb: 1 }}>
          Reset Your Password
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Please enter your current password and choose a new password.
          </DialogContentText>
          {resetPasswordError && (
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: alpha(colorPalette.error, 0.1), 
              borderRadius: 1, 
              borderLeft: '4px solid', 
              borderColor: colorPalette.error 
            }}>
              <Typography variant="body2" color={colorPalette.error}>
                {resetPasswordError}
              </Typography>
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            variant="outlined"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={resetPasswordLoading}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={resetPasswordLoading}
            sx={{ mb: 2 }}
            helperText="Password must be at least 8 characters long"
          />
          <TextField
            margin="dense"
            label="Confirm New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            disabled={resetPasswordLoading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setResetPasswordDialogOpen(false)} 
            disabled={resetPasswordLoading}
            variant="text"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleResetPassword} 
            color="primary" 
            variant="contained"
            disabled={!currentPassword || !newPassword || !confirmNewPassword || resetPasswordLoading}
          >
            {resetPasswordLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountSettingsApp;