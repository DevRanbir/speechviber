import React, { useState, useRef } from 'react';
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
  TextField,
  useTheme
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Refresh as RefreshIcon, 
  Image as ImageIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  AutoStories as StoryIcon,
  Psychology as AnalysisIcon,
  Stop as StopIcon,
  Mic as MicIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
// Add Firebase imports at the top with the other imports
import { getDatabase, ref, push, set } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// Custom styled components
const ImageContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  boxShadow: theme.shadows[5],
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}));

const StyledImage = styled('img')(({ theme }) => ({
  width: '100%',
  maxHeight: '400px',
  objectFit: 'contain',
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
}));

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1, 3),
  boxShadow: theme.shadows[2],
}));

const RecordingButton = styled(Button)(({ theme, isrecording }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1, 3),
  boxShadow: theme.shadows[2],
  backgroundColor: isrecording === 'true' ? theme.palette.error.main : undefined,
  '&:hover': {
    backgroundColor: isrecording === 'true' ? theme.palette.error.dark : undefined,
  }
}));

const UploadInput = styled('input')({
  display: 'none',
});

const FeedbackSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
}));

const StoryMatchAnalyzer = () => {
  // Add currentUser from AuthContext
  useErrorBoundary();
  const { currentUser } = useAuth();
  const [imageSrc, setImageSrc] = useState(null);
  const [story, setStory] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError("Please upload an image file (JPEG/JPG or PNG)");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setAnalysis(null); // Reset any previous analysis
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitStory = async () => {
    if (!imageSrc || !story.trim()) {
      setError("Please upload an image and write a story to continue.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Extract the base64 data from the data URL
      const base64Image = imageSrc.split(',')[1];
      
      // Call to Groq API
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Here's a story someone wrote about this image:

"${story}"

Analyze how well the story matches the image. Provide structured feedback with these exact sections:

1. Story-Image Match: [Detailed assessment of how well the story matches the visual elements]
2. Creative Elements: [Note creative or imaginative elements in the story]
3. Missing Elements: [Note any major visual elements from the image not included in the story]
4. Suggestions: [Brief suggestions for improvement]

End with "Match Score: X%" where X is a percentage between 0-100 representing how well the story matches the image.

Keep your response direct and clear.`
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
          model: "llama-3.2-11b-vision-preview"
        },
        {
          headers: {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const rawAnalysis = response.data.choices[0].message.content;
      console.log('Raw API response:', rawAnalysis);
      
      // Parse and format the analysis
      const formattedResult = parseAnalysisResponse(rawAnalysis);
      console.log('Parsed analysis result:', formattedResult);
      setAnalysis(formattedResult);
      
      // Save data to Firebase - Fixed implementation
      if (currentUser && formattedResult.score !== null && formattedResult.score !== undefined) {
        try {
          const database = getDatabase();
          const storyData = {
            time: new Date().toISOString(),
            score: formattedResult.score
          };
      
          // Create a proper reference structure
          const storyRef = ref(
            database, 
            `users/${currentUser.uid}/storymode/data/${Date.now()}`
          );
          
          // Use set instead of push and handle the promise properly
          await set(storyRef, storyData);
          console.log('Story analysis data saved successfully with score:', formattedResult.score);
        } catch (error) {
          console.error('Error saving to database:', error);
        }
      } else {
        console.log('Not saving to Firebase:', 
          currentUser ? `Score issue: ${formattedResult.score}` : 'User not logged in',
          'Raw score text:', rawAnalysis);
      }
      
    } catch (err) {
      console.error("Error analyzing story and image:", err);
      
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
    // Clean up any asterisks or markdown formatting
    const cleanedText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Extract the different sections
    const sections = {
      storyImageMatch: extractSection(cleanedText, "Story-Image Match"),
      creativeElements: extractSection(cleanedText, "Creative Elements"),
      missingElements: extractSection(cleanedText, "Missing Elements"),
      suggestions: extractSection(cleanedText, "Suggestions"),
      score: extractScore(cleanedText)
    };
    
    return sections;
  };
  
  // Helper function to extract a specific section from the text
  const extractSection = (text, sectionName) => {
    const sectionRegex = new RegExp(`${sectionName}:(.+?)(?=\\d\\.\\s|Match Score:|$)`, 's');
    const match = text.match(sectionRegex);
    return match ? match[1].trim() : '';
  };
  
  // Helper function to extract the match score - improved to handle various formats
  const extractScore = (text) => {
    // Try multiple regex patterns to extract the score
    const patterns = [
      /Match Score:\s*(\d+)%/i,
      /Match Score:\s*(\d+)/i,
      /Score:\s*(\d+)%/i,
      /(\d+)%\s*match/i,
      /(\d+)%/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const score = parseInt(match[1]);
        // Ensure score is within valid range
        if (!isNaN(score) && score >= 0 && score <= 100) {
          return score;
        }
      }
    }
    
    // If no score found, default to 50 to ensure data is saved
    console.log('No valid score found in API response, using default score');
    return 50;
  };

  const handleReset = () => {
    setImageSrc(null);
    setStory('');
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Speech to text functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        // Create a FormData object to send the audio file
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('model', 'distil-whisper-large-v3-en');
        
        setLoading(true);
        try {
          const response = await axios.post(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            formData,
            {
              headers: {
                'Authorization': 'Bearer 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',
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          // Update the story with the transcribed text
          setStory(prev => prev + ' ' + response.data.text);
        } catch (err) {
          console.error("Speech-to-text error:", err);
          setError("Failed to convert speech to text. Please try typing your story instead.");
        } finally {
          setLoading(false);
        }
      };
      
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      
      // Also stop all tracks in the stream
      const stream = mediaRecorderRef.current.stream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      
      setRecording(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);  // Navigate back to the previous page
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <ActionButton
          variant="outlined"
          onClick={handleGoBack}
          startIcon={<ArrowBackIcon />}
          sx={{ 
            borderRadius: 2,
            color: theme.palette.text.secondary,
            borderColor: theme.palette.divider,
          }}
        >
          Go Back
        </ActionButton>
      </Box>

      <Paper 
        elevation={6} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, #1e1e2e 0%, #2d2d3f 100%)' 
            : 'linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)'
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          align="center" 
          gutterBottom 
          color="primary" 
          sx={{ 
            fontWeight: 700,
            mb: 4,
            textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          Story Analyzer
        </Typography>
        <center>Upload an image and write a story about it. The app will analyze how well your story matches the image.</center>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {error && (
            <Alert 
              severity="error" 
              variant="filled" 
              sx={{ width: '100%', mb: 3, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          
          {/* Only show the image upload section if there's no analysis yet */}
          {!analysis && (
            <>
              {!imageSrc ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <label htmlFor="image-upload">
                    <UploadInput
                      accept="image/jpeg,image/png,image/jpg"
                      id="image-upload"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                    <ActionButton
                      variant="contained"
                      color="primary"
                      component="span"
                      size="large"
                      startIcon={<UploadIcon />}
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[8],
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Upload Image
                    </ActionButton>
                  </label>
                </Box>
              ) : null}
              
              {imageSrc && (
                <Card 
                  sx={{ 
                    maxWidth: 600, 
                    width: '100%', 
                    mb: 4,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: theme.shadows[5]
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                      Your Image
                    </Typography>
                  </CardContent>
                  <CardMedia
                    component="div"
                    sx={{ padding: 2 }}
                  >
                    <StyledImage src={imageSrc} alt="Uploaded" />
                  </CardMedia>
                  <CardContent sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                    <label htmlFor="change-image">
                      <UploadInput
                        accept="image/jpeg,image/png,image/jpg"
                        id="change-image"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                      />
                      <ActionButton
                        variant="outlined"
                        color="primary"
                        component="span"
                        startIcon={<ImageIcon />}
                      >
                        Change Image
                      </ActionButton>
                    </label>
                  </CardContent>
                </Card>
              )}
              
              {imageSrc && (
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: 800,
                    mb: 4
                  }}
                >
                  <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                    Write Your Story
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Look at the image and write a creative story about what you see. Try to include visual details from the image.
                  </Typography>
                  
                  <TextField
                    multiline
                    rows={6}
                    variant="outlined"
                    placeholder="Once upon a time..."
                    fullWidth
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
                    <ActionButton
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitStory}
                      disabled={loading || !story.trim()}
                      startIcon={<AnalysisIcon />}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                          Analyzing...
                        </>
                      ) : "Analyze Match"}
                    </ActionButton>
                    
                    {!recording ? (
                      <RecordingButton
                        variant="outlined"
                        color="secondary"
                        onClick={startRecording}
                        disabled={loading}
                        startIcon={<MicIcon />}
                        isrecording="false"
                      >
                        Dictate Story
                      </RecordingButton>
                    ) : (
                      <RecordingButton
                        variant="contained"
                        color="error"
                        onClick={stopRecording}
                        startIcon={<StopIcon />}
                        isrecording="true"
                      >
                        Stop Recording
                      </RecordingButton>
                    )}
                  </Box>
                </Paper>
              )}
            </>
          )}
          
          {analysis && (
            <Box sx={{ width: '100%', mt: 4 }}>
              <Typography 
                variant="h4"
                color="primary"
                align="center" 
                gutterBottom
                sx={{ fontWeight: 700, mb: 3 }}
              >
                Story Analysis Results
              </Typography>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Grid container spacing={0}>
                  <Grid item xs={12} md={5} 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 3,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <Box sx={{ position: 'relative', width: '100%', mb: 3 }}>
                      <StyledImage
                        src={imageSrc}
                        alt="Story Image"
                      />
                    </Box>
                    
                    {analysis.score !== null && (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        mt: 2 
                      }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          Match Score
                        </Typography>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress
                            variant="determinate"
                            value={analysis.score}
                            size={120}
                            thickness={5}
                            sx={{
                              color: 
                                analysis.score >= 80 ? theme.palette.success.main :
                                analysis.score >= 60 ? theme.palette.warning.main :
                                theme.palette.error.main
                            }}
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
                              sx={{ fontWeight: 700 }}
                            >
                              {`${analysis.score}%`}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2, width: '100%' }}>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Your Story
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ 
                          p: 2, 
                          borderRadius: 1, 
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}
                      >
                        {story}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={7}>
                    <Box sx={{ p: 4 }}>
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        color="primary"
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        Story-Image Match Analysis
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      
                      <FeedbackSection>
                        <Typography variant="h6" color="textPrimary" sx={{ mb: 1 }}>
                          Story-Image Match
                        </Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                          {analysis.storyImageMatch}
                        </Typography>
                      </FeedbackSection>
                      
                      <FeedbackSection>
                        <Typography variant="h6" color="textPrimary" sx={{ mb: 1 }}>
                          Creative Elements
                        </Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                          {analysis.creativeElements}
                        </Typography>
                      </FeedbackSection>
                      
                      <FeedbackSection>
                        <Typography variant="h6" color="textPrimary" sx={{ mb: 1 }}>
                          Missing Elements
                        </Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                          {analysis.missingElements}
                        </Typography>
                      </FeedbackSection>
                      
                      <FeedbackSection>
                        <Typography variant="h6" color="textPrimary" sx={{ mb: 1 }}>
                          Suggestions
                        </Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                          {analysis.suggestions}
                        </Typography>
                      </FeedbackSection>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider />
                
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                  <ActionButton
                    variant="contained"
                    color="primary"
                    onClick={() => setAnalysis(null)}
                    startIcon={<RefreshIcon />}
                    sx={{ 
                      minWidth: 150,
                      backgroundColor: theme.palette.primary.main,
                      mr: 2
                    }}
                  >
                    Edit Story
                  </ActionButton>
                  
                  <ActionButton
                    variant="outlined"
                    color="secondary"
                    onClick={handleReset}
                    startIcon={<CancelIcon />}
                    sx={{ minWidth: 150 }}
                  >
                    Start Over
                  </ActionButton>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
        
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Your privacy is important. Images and stories are only processed for analysis and are not stored.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default StoryMatchAnalyzer;