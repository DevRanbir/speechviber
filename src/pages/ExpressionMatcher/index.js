import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, set, serverTimestamp } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  useTheme,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Chip,
  Divider
} from '@mui/material';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
import { 
  Camera as CameraIcon, 
  Refresh as RefreshIcon, 
  Photo as PhotoIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  RemoveRedEye as EyeContactIcon,
  WbIncandescent as LightingIcon,
  Face as FaceIcon,
  Psychology as CustomIcon,
  ArrowBack as ArrowBackIcon,
  AssignmentInd as AnalysisIcon
} from '@mui/icons-material';

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

const CustomInterviewAnalyzer = () => {
  useErrorBoundary();
  const { currentUser } = useAuth();
  const [dataSaved, setDataSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [formattedAnalysis, setFormattedAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [configStep, setConfigStep] = useState(true);
  
  // Analysis configuration
  const [selectedCategories, setSelectedCategories] = useState({
    eyeContact: true,
    lighting: true,
    facialExpression: true,
    professionalPresence: true
  });
  const [customCategory, setCustomCategory] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  
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

  const saveActivityData = async (analysisResults) => {
    if (!currentUser || dataSaved) {
      return;
    }

    try {
      const database = getDatabase();
      const timestamp = Date.now();
      
      // Calculate total score (average of all categories)
      const scores = Object.values(analysisResults).filter(item => 
        typeof item === 'object' && item.score !== undefined
      ).map(item => item.score);
      
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) 
        : 0;

      // Create activity data
      const activityData = {
        date: new Date().toISOString(),
        description: `Custom Interview Analysis - Score: ${averageScore}%`,
        duration: 'N/A',
        id: `custom_analysis_${timestamp}`,
        score: averageScore,
        type: "Custom Interview Analyzer",
        createdAt: serverTimestamp()
      };

      // Create detailed analysis data
      const analysisData = {
        timestamp: timestamp,
        ...analysisResults,
        overallScore: averageScore,
        imageUrl: null, // We're not storing the image
        createdAt: serverTimestamp()
      };

      // Save activity data
      const historyRef = ref(database, `users/${currentUser.uid}/history/data/${timestamp}/activities/custom-interview-analysis`);
      await set(historyRef, activityData);

      // Save detailed analysis data
      const analysisRef = ref(database, `users/${currentUser.uid}/custom-interview-analysis/${timestamp}`);
      await set(analysisRef, analysisData);

      setDataSaved(true);
      setSaveError(null);
    } catch (error) {
      console.error('Error saving to database:', error);
      setSaveError('Failed to save your progress. Please try again.');
    }
  };

  const analyzeImage = async (imageDataUrl) => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract the base64 data from the data URL
      const base64Image = imageDataUrl.split(',')[1];
      
      // Build prompt based on selected categories
      let promptText = "Analyze this person for an interview setting. Provide structured feedback on these specific aspects:\n\n";
      
      // Add standard categories
      if (selectedCategories.eyeContact) {
        promptText += "1. Eye Contact: [assessment]\n";
      }
      if (selectedCategories.lighting) {
        promptText += "2. Lighting/Ambience: [assessment]\n";
      }
      if (selectedCategories.facialExpression) {
        promptText += "3. Facial Expression: [assessment]\n";
      }
      if (selectedCategories.professionalPresence) {
        promptText += "4. Professional Presence: [assessment]\n";
      }
      
      // Add custom categories
      customCategories.forEach((category, index) => {
        promptText += `${index + 5}. ${category}: [assessment]\n`;
      });
      
      // Add score request for each category
      promptText += "\nFor each category, end with a score (0-100%). End with an overall assessment. Keep responses direct with no markdown formatting.";
      
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
                  text: promptText
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

  const parseAnalysisResponse = (text) => {
    // Clean up any markdown formatting
    const cleanedText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    
    const results = {};
    
    // Parse standard categories
    if (selectedCategories.eyeContact) {
      results.eyeContact = extractCategoryWithScore(cleanedText, "Eye Contact");
    }
    if (selectedCategories.lighting) {
      results.lighting = extractCategoryWithScore(cleanedText, "Lighting/Ambience");
    }
    if (selectedCategories.facialExpression) {
      results.facialExpression = extractCategoryWithScore(cleanedText, "Facial Expression");
    }
    if (selectedCategories.professionalPresence) {
      results.professionalPresence = extractCategoryWithScore(cleanedText, "Professional Presence");
    }
    
    // Parse custom categories
    customCategories.forEach(category => {
      results[category.toLowerCase().replace(/\s+/g, '_')] = extractCategoryWithScore(cleanedText, category);
    });
    
    // Extract overall assessment
    results.overallAssessment = extractOverallAssessment(cleanedText);
    
    return results;
  };
  
  const extractCategoryWithScore = (text, categoryName) => {
    // Match the category content until the next numbered category or end
    const contentRegex = new RegExp(`${categoryName}:(.+?)(?=\\d+\\.|Overall|$)`, 's');
    const contentMatch = text.match(contentRegex);
    const content = contentMatch ? contentMatch[1].trim() : '';
    
    // Extract score from content if possible
    const scoreRegex = /(\d+)%/;
    const scoreMatch = content.match(scoreRegex);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    
    // Clean content by removing the score part
    const cleanContent = content.replace(/\s*\d+%\s*\.?$/, '').trim();
    
    return {
      content: cleanContent,
      score: score
    };
  };
  
  const extractOverallAssessment = (text) => {
    // Try to match anything after the last numbered section that might be an overall assessment
    const overallRegex = /(?:Overall|In summary|To summarize|In conclusion)(.+)$/s;
    const match = text.match(overallRegex);
    return match ? match[1].trim() : '';
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

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && customCategories.length < 3) {
      setCustomCategories([...customCategories, customCategory.trim()]);
      setCustomCategory('');
    }
  };
  
  const handleRemoveCustomCategory = (indexToRemove) => {
    setCustomCategories(customCategories.filter((_, index) => index !== indexToRemove));
  };

  const handleStartAnalysis = () => {
    const hasSelectedCategories = Object.values(selectedCategories).some(val => val) || customCategories.length > 0;
    
    if (!hasSelectedCategories) {
      setError("Please select at least one category to analyze");
      return;
    }
    
    setConfigStep(false);
  };

  const handleGoBack = () => {
    if (!configStep && !imageSrc) {
      setConfigStep(true);
    } else {
      navigate('/practice');
    }
  };

  // Function to get score color
  const getScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get icon for each category
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'eyeContact':
        return <EyeContactIcon color="primary" />;
      case 'lighting':
        return <LightingIcon color="primary" />;
      case 'facialExpression':
        return <FaceIcon color="primary" />;
      case 'professionalPresence':
        return <AnalysisIcon color="primary" />;
      case 'overallAssessment':
        return <CheckIcon color="primary" />;
      default:
        return <CustomIcon color="primary" />;
    }
  };
  
  // Get readable name for category
  const getCategoryName = (category) => {
    switch(category) {
      case 'eyeContact':
        return 'Eye Contact';
      case 'lighting':
        return 'Lighting/Ambience';
      case 'facialExpression':
        return 'Facial Expression';
      case 'professionalPresence':
        return 'Professional Presence';
      case 'overallAssessment':
        return 'Overall Assessment';
      default:
        // For custom categories, replace underscores with spaces and capitalize
        return category.replace(/_/g, ' ')
          .replace(/\b\w/g, letter => letter.toUpperCase());
    }
  };

  // Calculate overall score
  const calculateOverallScore = () => {
    if (!formattedAnalysis) return null;
    
    const scores = Object.entries(formattedAnalysis)
      .filter(([key, value]) => key !== 'overallAssessment' && value && typeof value === 'object' && value.score !== null)
      .map(([_, value]) => value.score);
    
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  return (
    <ContentContainer>
      <PageHeader 
        title="Custom Interview Analyzer" 
        subtitle="Analyze specific aspects of your interview presentation"
        icon={<AnalysisIcon fontSize="large" />}
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

      {configStep && (
        <SectionCard title="Select Analysis Categories">
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Choose which aspects of your interview presentation you want to analyze:
            </Typography>
            
            <FormGroup sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: '1px solid', 
                      borderColor: 'divider' 
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={selectedCategories.eyeContact}
                          onChange={() => setSelectedCategories({
                            ...selectedCategories,
                            eyeContact: !selectedCategories.eyeContact
                          })}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EyeContactIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography>Eye Contact</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mt: 0.5 }}>
                      Evaluates how you maintain eye contact with the camera
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: '1px solid', 
                      borderColor: 'divider' 
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={selectedCategories.lighting}
                          onChange={() => setSelectedCategories({
                            ...selectedCategories,
                            lighting: !selectedCategories.lighting
                          })}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LightingIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography>Lighting/Ambience</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mt: 0.5 }}>
                      Assesses lighting quality and background setting
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: '1px solid', 
                      borderColor: 'divider' 
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={selectedCategories.facialExpression}
                          onChange={() => setSelectedCategories({
                            ...selectedCategories,
                            facialExpression: !selectedCategories.facialExpression
                          })}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FaceIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography>Facial Expression</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mt: 0.5 }}>
                      Analyzes your facial expressions and engagement
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: '1px solid', 
                      borderColor: 'divider' 
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={selectedCategories.professionalPresence}
                          onChange={() => setSelectedCategories({
                            ...selectedCategories,
                            professionalPresence: !selectedCategories.professionalPresence
                          })}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AnalysisIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography>Professional Presence</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mt: 0.5 }}>
                      Evaluates your overall professional appearance
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </FormGroup>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
              Add Custom Categories (Optional)
            </Typography>
            
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                label="Custom Category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g., Posture, Confidence, etc."
                disabled={customCategories.length >= 3}
                sx={{ mr: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleAddCustomCategory}
                disabled={!customCategory.trim() || customCategories.length >= 3}
              >
                Add
              </Button>
            </Box>
            
            {customCategories.length > 0 && (
              <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {customCategories.map((category, index) => (
                  <Chip
                    key={index}
                    label={category}
                    onDelete={() => handleRemoveCustomCategory(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
            
            {customCategories.length === 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                You can add up to 3 custom categories to analyze.
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleStartAnalysis}
                  disabled={!Object.values(selectedCategories).some(val => val) && customCategories.length === 0}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    borderRadius: 2
                  }}
                >
                  Continue to Camera
                </Button>
              </motion.div>
            </Box>
          </Box>
        </SectionCard>
      )}

      {!configStep && !capturing && !imageSrc ? (
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
                    Analyzing your selected categories...
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, mb: 4 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        setImageSrc(null);
                        setConfigStep(true);
                      }}
                      startIcon={<ArrowBackIcon />}
                      sx={{ borderRadius: 2, px: 3 }}
                    >
                      Back to Categories
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
                  <Card 
                    sx={{ 
                      width: '100%', 
                      height: '100%',
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 3
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={imageSrc}
                      alt="Captured"
                      sx={{ 
                        width: '100%',
                        maxWidth: '250px',
                        aspectRatio: '1/1',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: `3px solid ${theme.palette.primary.main}`,
                        mb: 3
                      }}
                    />
                    
                    {/* Overall Score */}
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <CircularProgress
                        variant="determinate"
                        value={calculateOverallScore() || 0}
                        size={120}
                        thickness={5}
                        sx={{ 
                          color: getScoreColor(calculateOverallScore() || 0),
                          mb: 1
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="h4"
                          component="div"
                          fontWeight="bold"
                          color="text.primary"
                        >
                          {calculateOverallScore() || 0}%
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight={500} color="text.secondary">
                        Overall Score
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<RefreshIcon />}
                      onClick={handleRetake}
                      sx={{ mt: 3, borderRadius: 2 }}
                    >
                      Retake Analysis
                    </Button>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={8} sx={{ p: 0 }}>
                  <List sx={{ width: '100%', p: 0 }}>
                    {formattedAnalysis && Object.entries(formattedAnalysis)
                      .filter(([key]) => key !== 'overallAssessment')
                      .map(([category, data]) => (
                        <ListItem
                          key={category}
                          alignItems="flex-start"
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            py: 2,
                            px: 3
                          }}
                        >
                          <ListItemIcon sx={{ mt: 1 }}>
                            {getCategoryIcon(category)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                  {getCategoryName(category)}
                                </Typography>
                                {data.score !== null && (
                                  <Chip
                                    label={`${data.score}%`}
                                    size="small"
                                    sx={{
                                      backgroundColor: getScoreColor(data.score),
                                      color: '#fff',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                              >
                                {data.content}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                      
                    {/* Overall Assessment */}
                    {formattedAnalysis.overallAssessment && (
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          py: 2,
                          px: 3,
                          bgcolor: 'background.default'
                        }}
                      >
                        <ListItemIcon sx={{ mt: 1 }}>
                          {getCategoryIcon('overallAssessment')}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={500}>
                              Overall Assessment
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {formattedAnalysis.overallAssessment}
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            </Box>
          </SectionCard>

          {/* Save status messages */}
          {dataSaved && (
            <Alert 
              icon={<CheckIcon fontSize="inherit" />}
              severity="success" 
              sx={{ mt: 2, borderRadius: 2 }}
            >
              Progress saved successfully! You can access this analysis in your history.
            </Alert>
          )}
          
          {saveError && (
            <Alert 
              severity="error" 
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {saveError}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/practice')}
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2 }}
            >
              Return to Practice
            </Button>
          </Box>
        </>
      )}
    </ContentContainer>
  );
};

export default CustomInterviewAnalyzer;