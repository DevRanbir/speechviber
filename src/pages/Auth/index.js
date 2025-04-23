import React, { useState, useCallback } from 'react';
import {
  Box, Container, Typography, Button, TextField, Card, CardContent,
  Grid, Tabs, Tab, InputAdornment, CircularProgress, Snackbar, Alert,
  Paper, Divider, useTheme, useMediaQuery, IconButton, Tooltip, Avatar,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getAuth, 
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail 
} from 'firebase/auth';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';

// Icons
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import LockIcon from '@mui/icons-material/Lock';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StarIcon from '@mui/icons-material/Star';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import GoogleIcon from '@mui/icons-material/Google';

// Styled components
const GradientButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  }
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: 12,
  background: 'rgba(26, 32, 44, 0.7)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(2),
  gap: theme.spacing(1.5),
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.light,
  }
}));

const AnimatedTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(26, 32, 44, 0.5)',
    '&:hover': {
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiOutlinedInput-input': {
    color: '#fff',
    padding: '12px 14px',
    '&:-webkit-autofill': {
      WebkitBoxShadow: 'none',
      transition: 'background-color 999999s ease-in-out 0s',
      backgroundColor: 'transparent !important'
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  marginBottom: theme.spacing(1.5)
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  padding: '10px 20px',
  borderRadius: 8,
  minWidth: 80,
  color: 'rgba(255, 255, 255, 0.7)',
  transition: 'all 0.2s ease',
  '&.Mui-selected': {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    color: '#6366F1',
  },
}));

const AuthPage = () => {
  useErrorBoundary();
  const { login, signup, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const auth = getAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    phone: '',
  });
  
  // Form errors
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    phone: '',
  });

  const handleForgotPasswordClick = async () => {
    if (!formData.email) {
      setAlertMessage('Please enter your email address first');
      setAlertSeverity('warning');
      setShowAlert(true);
      return;
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setAlertMessage('Please enter a valid email address');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setAlertMessage('Password reset link sent! Please check your email');
      setAlertSeverity('success');
      setShowAlert(true);
    } catch (error) {
      let errorMessage = 'Failed to send reset link. Please try again.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account exists with this email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      }
      setAlertMessage(errorMessage);
      setAlertSeverity('error');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setAlertMessage('Connecting to Google...');
    setAlertSeverity('info');
    setShowAlert(true);
    
    try {
      await googleSignIn();
      setAlertMessage('Login successful!');
      setAlertSeverity('success');
      setShowAlert(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      setAlertMessage(error.message || 'Google sign-in failed. Please try again.');
      setAlertSeverity('error');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFormData({
      name: '',
      email: '',
      password: '',
      age: '',
      phone: '',
    });
    setFormErrors({
      name: '',
      email: '',
      password: '',
      age: '',
      phone: '',
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFormErrors({
      ...formErrors,
      [name]: '',
    });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { ...formErrors };
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    
    if (tabValue === 1) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
        valid = false;
      }
      
      if (!formData.age) {
        newErrors.age = 'Age is required';
        valid = false;
      } else if (isNaN(formData.age) || formData.age < 13) {
        newErrors.age = 'Age must be at least 13';
        valid = false;
      }
      
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
        valid = false;
      } else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'Enter a valid phone number (10 digits)';
        valid = false;
      }
    }
    
    setFormErrors(newErrors);
    return valid;
  };

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    
    if (isLoading || !validateForm()) return;
    
    setIsLoading(true);
    setAlertMessage('Attempting to log in...');
    setAlertSeverity('info');
    setShowAlert(true);
    
    try {
      await login(formData.email, formData.password);
      setAlertMessage('Login successful!');
      setAlertSeverity('success');
      setShowAlert(true);
      
      // Add a small delay before navigation to allow the user to see the success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      setAlertMessage(error.message || 'Login failed. Please try again.');
      setAlertSeverity('error');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, login, navigate]);

  const handleSignup = useCallback(async (e) => {
    e.preventDefault();
    
    if (isLoading || !validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Create new account
      await signup(formData.email, formData.password, {
        name: formData.name,
        age: formData.age,
        phone: formData.phone,
      });
      
      setAlertMessage('Account created successfully!');
      setAlertSeverity('success');
      setShowAlert(true);
      navigate('/dashboard');
    } catch (error) {
      setAlertMessage(error.message || 'Signup failed. Please try again.');
      setAlertSeverity('error');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, signup, navigate]);
  
  const handleAlertClose = () => {
    setShowAlert(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const GoogleSignInButton = (
    <GradientButton
      fullWidth
      variant="outlined"
      size="medium"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      sx={{
        mb: 2,
        color: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        background: 'rgba(255, 255, 255, 0.05)',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.5)',
          background: 'rgba(255, 255, 255, 0.1)',
        }
      }}
      startIcon={<GoogleIcon />}
    >
      Continue with Google
    </GradientButton>
  );

  const features = [
    {
      title: 'Voice Analysis',
      description: 'Instant feedback on speech',
      icon: <MicIcon sx={{ color: '#6366F1' }} fontSize="medium" />,
    },
    {
      title: 'Coaching',
      description: 'Tailored exercises',
      icon: <RecordVoiceOverIcon sx={{ color: '#8B5CF6' }} fontSize="medium" />,
    },
    {
      title: 'Analytics',
      description: 'Track progress',
      icon: <AnalyticsIcon sx={{ color: '#10B981' }} fontSize="medium" />,
    },
    {
      title: 'Results',
      description: 'Improve in weeks',
      icon: <SpeedIcon sx={{ color: '#F59E0B' }} fontSize="medium" />,
    }
  ];

  return (
    <Box sx={{ 
      height: '100vh',
      background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background Elements */}
      <Box sx={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 70%)',
        top: '-100px',
        right: '-100px',
        zIndex: 0
      }} />
      
      <Box sx={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 70%)',
        bottom: '-200px',
        left: '-200px',
        zIndex: 0
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, height: '100%', py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          height: '100%', 
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Grid container spacing={0} alignItems="center" justifyContent="center" 
                sx={{ maxHeight: '100vh' }}>
            
            {/* Left side - App Info */}
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' }, pr: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Card 
                  elevation={0}
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, #3730A3 0%, #6366F1 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                    height: '130px'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: '#FFD700'
                      }}>
                        <StarIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                          Speak with Confidence
                        </Typography>
                        
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                          AI-powered platform for exceptional communication
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            size="small"
                            icon={<TipsAndUpdatesIcon fontSize="small" />} 
                            label="Voice Analytics" 
                            sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: 'white', height: '24px' }} 
                          />
                          
                          <Chip 
                            size="small"
                            icon={<RecordVoiceOverIcon fontSize="small" />} 
                            label="Training" 
                            sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: 'white', height: '24px' }} 
                          />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Grid container spacing={1}>
                  {features.map((feature, index) => (
                    <Grid item xs={6} key={index}>
                      <FeatureCard elevation={0}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'rgba(99, 102, 241, 0.2)',
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                        }}>
                          {feature.icon}
                        </Box>
                        
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white', mt: 0.5 }}>
                          {feature.title}
                        </Typography>
                        
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {feature.description}
                        </Typography>
                      </FeatureCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          
            {/* Right side - Auth Form */}
            <Grid item xs={12} md={6} lg={5}>
              <Paper 
                elevation={12} 
                sx={{ 
                  borderRadius: 3, 
                  overflow: 'hidden',
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  maxHeight: '100vh'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
                    <Box component="span" sx={{ 
                      background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', 
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Speech
                    </Box>
                    <Box component="span">Viber-</Box>
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white' }}>
                      {tabValue === 0 ? '👋 Welcome Back!' : '🚀 Join SpeechViber'}
                    </Typography>
                    
                    <Chip 
                      label={tabValue === 0 ? "Member Login" : "New Account"} 
                      size="small" 
                      sx={{ 
                        bgcolor: tabValue === 0 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: tabValue === 0 ? '#6366F1' : '#10B981',
                        fontWeight: 500,
                        borderRadius: 2,
                        height: '22px'
                      }} 
                    />
                  </Box>
                  
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 2, 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      mb: 2, 
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <Tabs 
                      value={tabValue} 
                      onChange={handleTabChange} 
                      variant="fullWidth"
                      sx={{ minHeight: '36px', width: '100%' }}
                    >
                      <StyledTab label="Login" />
                      <StyledTab label="Sign Up" />
                    </Tabs>
                  </Paper>
                  
                  {/* Login Form */}
                  {tabValue === 0 && (
                    <Box component="form" onSubmit={handleLogin} noValidate>
                      <AnimatedTextField
                        fullWidth
                        size="small"
                        label="Email Address"
                        name="email"
                        type="email"
                        autoComplete="username"
                        variant="outlined"
                        value={formData.email}
                        onChange={handleFormChange}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.2rem' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      
                      <AnimatedTextField
                        fullWidth
                        size="small"
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        variant="outlined"
                        value={formData.password}
                        onChange={handleFormChange}
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.2rem' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={togglePasswordVisibility}
                                edge="end"
                                size="small"
                                sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                              >
                                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                        <Typography 
                          variant="caption" 
                          onClick={handleForgotPasswordClick}
                          sx={{ 
                            color: '#6366F1',
                            cursor: 'pointer',
                            fontWeight: 500,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Forgot password?
                        </Typography>
                      </Box>
                      
                      <GradientButton
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="medium"
                        disabled={isLoading}
                        sx={{ 
                          mb: 2, 
                          background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #4F46E5, #7C3AED)'
                          }
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <>
                            Log In
                            <ArrowForwardIcon sx={{ ml: 1, fontSize: '1rem' }} />
                          </>
                        )}
                      </GradientButton>

                      <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          OR
                        </Typography>
                      </Divider>
                      
                      {GoogleSignInButton}
                      
                      <Typography variant="caption" align="center" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'block'
                      }}>
                        Don't have an account?{' '}
                        <Box 
                          component="span" 
                          onClick={() => setTabValue(1)} 
                          sx={{ 
                            color: '#6366F1',
                            cursor: 'pointer',
                            fontWeight: 600,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Sign Up
                        </Box>
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Signup Form */}
                  {tabValue === 1 && (
                    <Box component="form" onSubmit={handleSignup} noValidate sx={{
                      overflow: 'auto',
                      pr: 1,
                      pt: 2,
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.2)',
                        },
                      },
                    }}>
                      <AnimatedTextField
                        fullWidth
                        size="small"
                        label="Full Name"
                        name="name"
                        variant="outlined"
                        value={formData.name}
                        onChange={handleFormChange}
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.2rem' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      
                      <AnimatedTextField
                        fullWidth
                        size="small"
                        label="Email Address"
                        name="email"
                        type="email"
                        autoComplete="username"
                        variant="outlined"
                        value={formData.email}
                        onChange={handleFormChange}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.2rem' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <AnimatedTextField
                            fullWidth
                            size="small"
                            label="Age"
                            name="age"
                            type="number"
                            variant="outlined"
                            value={formData.age}
                            onChange={handleFormChange}
                            error={!!formErrors.age}
                            helperText={formErrors.age}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CakeIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.2rem' }} />
                                </InputAdornment>
                              ),
                              inputProps: { 
                                min: 13,
                                style: { 
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'textfield',
                                  margin: 0
                                }
                              }
                            }}
                            sx={{
                              '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <AnimatedTextField
                            fullWidth
                            size="small"
                            label="Phone Number"
                            name="phone"
                            variant="outlined"
                            value={formData.phone}
                            onChange={handleFormChange}
                            error={!!formErrors.phone}
                            helperText={formErrors.phone}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.2rem' }} />
                                </InputAdornment>
                              ),
                              inputProps: { maxLength: 10 }
                            }}
                          />
                        </Grid>
                      </Grid>
                      <AnimatedTextField
                        fullWidth
                        size="small"
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        variant="outlined"
                        value={formData.password}
                        onChange={handleFormChange}
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.2rem' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={togglePasswordVisibility}
                                edge="end"
                                size="small"
                                sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                              >
                                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                      
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mb: 2, 
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.7rem'
                      }}>
                        By signing up, you agree to our Terms of Service and Privacy Policy
                      </Typography>
                      
                      <GradientButton
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="medium"
                        disabled={isLoading}
                        sx={{ 
                          mb: 2, 
                          background: 'linear-gradient(90deg, #10B981, #059669)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #059669, #047857)'
                          }
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <>
                            Create Account
                            <ArrowForwardIcon sx={{ ml: 1, fontSize: '1rem' }} />
                          </>
                        )}
                      </GradientButton>

                      <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          OR
                        </Typography>
                      </Divider>
                      
                      <GradientButton
                        fullWidth
                        variant="outlined"
                        size="medium"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        sx={{
                          mb: 2,
                          color: 'white',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            background: 'rgba(255, 255, 255, 0.1)',
                          }
                        }}
                        startIcon={<GoogleIcon />}
                      >
                        Continue with Google
                      </GradientButton>
                      
                      <Typography variant="caption" align="center" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'block'
                      }}>
                        Already have an account?{' '}
                        <Box 
                          component="span" 
                          onClick={() => setTabValue(0)} 
                          sx={{ 
                            color: '#6366F1',
                            cursor: 'pointer',
                            fontWeight: 600,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Log In
                        </Box>
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
      
      {/* Alert Snackbar */}
      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleAlertClose} 
          severity={alertSeverity} 
          variant="filled"
          elevation={6}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AuthPage;