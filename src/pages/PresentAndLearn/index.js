import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  useTheme
} from '@mui/material';
import { 
  Camera as CameraIcon, 
  Refresh as RefreshIcon, 
  Photo as PhotoIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Person as PersonIcon,
  Face as FaceIcon,
  AccessibilityNew as BodyLanguageIcon,
  ArrowBack as ArrowBackIcon,
  AssignmentInd as PresentationIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// Internal Components
const PageHeader = ({ title, subtitle, icon, backButton, onBackClick }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      {backButton && (
        <IconButton onClick={onBackClick} sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon />
        </IconButton>
      )}
      {icon && (
        <Box sx={{ color: 'primary.main' }}>
          {icon}
        </Box>
      )}
      <Typography variant="h4" component="h1" fontWeight="bold">
        {title}
      </Typography>
    </Box>
    {subtitle && (
      <Typography variant="body1" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

const SectionCard = ({ title, children }) => (
  <Paper 
    elevation={0}
    sx={{ 
      mb: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden'
    }}
  >
    {title && (
      <Box 
        sx={{ 
          px: 3, 
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="h6" color="primary">
          {title}
        </Typography>
      </Box>
    )}
    {children}
  </Paper>
);

const ContentContainer = ({ children }) => (
  <Box sx={{ py: 4, minHeight: '100vh' }}>
    <Container maxWidth="lg">
      {children}
    </Container>
  </Box>
);

// Add these imports at the top
import { getDatabase, ref, set, serverTimestamp } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';

const InterviewReadinessAnalyzer = () => {
  useErrorBoundary();
  // Add these states
  const { currentUser } = useAuth();
  const [dataSaved, setDataSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [capturing, setCapturing] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [formattedAnalysis, setFormattedAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const theme = useTheme();
  const navigate = useNavigate();

  // Start webcam when capturing is enabled
  useEffect(() => {
    if (capturing) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [capturing]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access webcam. Please check permissions.");
      setCapturing(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 data URL
    const dataUrl = canvas.toDataURL('image/jpeg');
    setImageSrc(dataUrl);
    setCapturing(false);
    
    return dataUrl;
  };

  // Add this function to save data to Firebase
  const saveActivityData = async (analysisResults) => {
    if (!currentUser || dataSaved) {
      return;
    }

    try {
      const database = getDatabase();
      const timestamp = Date.now();

      // Create activity data
      const activityData = {
        date: new Date().toISOString(),
        description: `Interview Readiness Analysis - Score: ${analysisResults.score}%`,
        duration: 'N/A',
        id: `interview_readiness_${timestamp}`,
        score: analysisResults.score,
        type: "Interview Readiness Analyzer",
        createdAt: serverTimestamp()
      };

      // Create detailed analysis data
      const analysisData = {
        timestamp: timestamp,
        professionalAppearance: analysisResults.professionalAppearance,
        facialExpression: analysisResults.facialExpression,
        bodyLanguage: analysisResults.bodyLanguage,
        overallPresentation: analysisResults.overallPresentation,
        score: analysisResults.score,
        imageUrl: null,
        createdAt: serverTimestamp()
      };

      // Save activity data under Interview Readiness Analyzer
      const historyRef = ref(database, `users/${currentUser.uid}/history/data/${timestamp}/activities/interview-readiness`);
      await set(historyRef, activityData);

      // Save detailed analysis data
      const analysisRef = ref(database, `users/${currentUser.uid}/interview-readiness/${timestamp}`);
      await set(analysisRef, analysisData);

      setDataSaved(true);
      setSaveError(null);
    } catch (error) {
      console.error('Error saving to database:', error);
      setSaveError('Failed to save your progress. Please try again.');
    }
  };

  // Modify the analyzeImage function to include saving
  const analyzeImage = async (imageDataUrl) => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract the base64 data from the data URL
      const base64Image = imageDataUrl.split(',')[1];
      
      // Direct API call to Groq
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this person's interview readiness. Provide structured feedback using exactly these four sections:

1. Professional Appearance: [assessment]
2. Facial Expression: [assessment]
3. Body Language: [assessment]
4. Overall Presentation: [assessment]

End with "Interview readiness score: X%" where X is a percentage between 0-100.

Keep your responses direct and clear, with no asterisks or markdown formatting.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  }
                }
              ]
            }
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct"
        },
        {
          headers: {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const rawAnalysis = response.data.choices[0].message.content;
      setAnalysis(rawAnalysis);
      
      // Parse and format the analysis
      const formattedResult = parseAnalysisResponse(rawAnalysis);
      setFormattedAnalysis(formattedResult);
      
      // Save the analysis results
      await saveActivityData(formattedResult);
      
    } catch (err) {
      console.error("Error analyzing image:", err);
      
      // More detailed error message to help with debugging
      if (err.response) {
        setError(`API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        setError("No response received from API. Check your network connection.");
      } else {
        setError(`Error setting up request: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to parse the API response into structured sections
  const parseAnalysisResponse = (text) => {
    // Clean up any markdown or extra formatting
    const cleanedText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Extract the different sections
    const sections = {
      professionalAppearance: extractSection(cleanedText, "Professional Appearance"),
      facialExpression: extractSection(cleanedText, "Facial Expression"),
      bodyLanguage: extractSection(cleanedText, "Body Language"),
      overallPresentation: extractSection(cleanedText, "Overall Presentation"),
      score: extractScore(cleanedText)
    };
    
    return sections;
  };
  
  // Helper function to extract a specific section from the text
  const extractSection = (text, sectionName) => {
    const sectionRegex = new RegExp(`${sectionName}:(.+?)(?=\\d\\.\\s|Interview readiness score:|$)`, 's');
    const match = text.match(sectionRegex);
    return match ? match[1].trim() : '';
  };
  
  // Helper function to extract the readiness score
  const extractScore = (text) => {
    const scoreRegex = /Interview readiness score:\s*(\d+)%/;
    const match = text.match(scoreRegex);
    return match ? parseInt(match[1]) : null;
  };

  const handleCapture = async () => {
    const dataUrl = captureImage();
    if (dataUrl) {
      await analyzeImage(dataUrl);
    }
  };

  const handleRetake = () => {
    setImageSrc(null);
    setAnalysis(null);
    setFormattedAnalysis(null);
    setCapturing(true);
  };

  // Get icon for each category
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'professionalAppearance':
        return <PersonIcon color="primary" />;
      case 'facialExpression':
        return <FaceIcon color="primary" />;
      case 'bodyLanguage':
        return <BodyLanguageIcon color="primary" />;
      case 'overallPresentation':
        return <PresentationIcon color="primary" />;
      default:
        return <CheckIcon color="primary" />;
    }
  };

  const handleGoBack = () => {
    navigate('/practice');
  };

  // Function to get score color
  const getScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <ContentContainer>
      <PageHeader 
        title="Interview Readiness Analyzer" 
        subtitle="Analyze your professional appearance and get instant feedback"
        icon={<PresentationIcon fontSize="large" />}
        backButton={true}
        onBackClick={handleGoBack}
      />
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity="error" 
            variant="filled" 
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CancelIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </motion.div>
      )}

      {!capturing && !imageSrc ? (
        <SectionCard title="Start Camera">
          <Box display="flex" flexDirection="column" alignItems="center" p={3}>
            <Typography variant="body1" color="textSecondary" gutterBottom align="center" sx={{ mb: 3 }}>
              Position yourself as you would for a job interview. Ensure good lighting and a neutral background.
            </Typography>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CameraIcon />}
                onClick={() => setCapturing(true)}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  borderRadius: 2
                }}
              >
                Start Camera
              </Button>
            </motion.div>
          </Box>
        </SectionCard>
      ) : null}
      
      {capturing && (
        <SectionCard title="Camera Preview">
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              mb: 3
            }}>
              <video 
                ref={videoRef} 
                autoPlay
                style={{ 
                  width: '100%',
                  maxHeight: '500px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCapture}
                  startIcon={<PhotoIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Take Photo
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCapturing(false)}
                  startIcon={<CancelIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Cancel
                </Button>
              </motion.div>
            </Box>
          </Box>
        </SectionCard>
      )}
      
      {imageSrc && !formattedAnalysis && (
        <SectionCard title="Processing Image">
          <Box sx={{ p: 3 }}>
            <Card 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 'none',
                border: `1px solid ${theme.palette.divider}`,
                mb: 3
              }}
            >
              <CardMedia
                component="img"
                image={imageSrc}
                alt="Captured"
                sx={{ aspectRatio: '4/3', objectFit: 'cover' }}
              />
            </Card>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 60 }}>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    Analyzing your interview readiness...
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, mb: 4 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate('/practice')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ borderRadius: 2, px: 3 }}
                  >
                    Back to Practice
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRetake}
                    startIcon={<RefreshIcon />}
                    sx={{ borderRadius: 2, px: 3 }}
                  >
                    Try Again
                  </Button>
                </motion.div>
                  
                  
                </Box>
              )}
            </Box>
          </Box>
        </SectionCard>
      )}
      
      {formattedAnalysis && (
        <>
          <SectionCard title="Analysis Results">
            <Box sx={{ p: 0 }}>
              <Grid container spacing={0}>
                <Grid item xs={12} md={4} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 3,
                    borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
                    borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' }
                  }}
                >
                  <Box sx={{ width: '100%', mb: 3 }}>
                    <Card 
                      elevation={0} 
                      sx={{ 
                        borderRadius: 2, 
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={imageSrc}
                        alt="Analyzed"
                        sx={{ aspectRatio: '4/3', objectFit: 'cover' }}
                      />
                    </Card>
                  </Box>
                  
                  {formattedAnalysis.score !== null && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      mt: 2 
                    }}>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Readiness Score
                      </Typography>
                      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress
                          variant="determinate"
                          value={formattedAnalysis.score}
                          size={120}
                          thickness={4}
                          sx={{ color: getScoreColor(formattedAnalysis.score) }}
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography
                            variant="h4"
                            component="div"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            {`${formattedAnalysis.score}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Box sx={{ p: 3 }}>
                    <List disablePadding>
                      {Object.entries(formattedAnalysis)
                        .filter(([key]) => key !== 'score')
                        .map(([key, value]) => {
                          const categoryIcon = getCategoryIcon(key);
                          
                          // Format the key for display
                          const formattedKey = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase());
                            
                          return (
                            <ListItem 
                              key={key}
                              alignItems="flex-start"
                              sx={{
                                px: 2,
                                py: 2,
                                mb: 2,
                                bgcolor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                              }}
                            >
                              <ListItemIcon sx={{ mt: 0.5, minWidth: 40 }}>
                                {categoryIcon}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" color="primary" fontWeight={500}>
                                    {formattedKey}
                                  </Typography>
                                }
                                secondary={
                                  <Typography 
                                    variant="body2" 
                                    color="textSecondary"
                                    sx={{ mt: 0.5, lineHeight: 1.6 }}
                                  >
                                    {value}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          );
                        })
                      }
                    </List>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </SectionCard>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, mb: 4 }}>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/practice')}
                startIcon={<ArrowBackIcon />}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Back to Practice
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRetake}
                startIcon={<RefreshIcon />}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Try Again
              </Button>
            </motion.div>
          </Box>
        </>
      )}
      
      <Box sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Your privacy is important. Images are only processed for analysis and are not stored.
        </Typography>
      </Box>
    </ContentContainer>
  );
};

export default InterviewReadinessAnalyzer;