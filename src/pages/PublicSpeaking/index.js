'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Container, LinearProgress, Paper, Card, CardContent,
  Avatar, Chip, Grid, CircularProgress, Divider, ToggleButtonGroup, ToggleButton, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Mic, MicOff, NavigateNext, Refresh, Chat, Assessment, ArrowBack,
  EmojiEvents, SportsEsports, FaceRetouchingOff, ChevronRight, School, SpatialAudio
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, serverTimestamp } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
import { getGroqApiKey2Synch, getGroqApiUrlSynch } from '../../utils/apiKeys';

// API Configuration - now loaded from Firebase
const getApiKey = () => getGroqApiKey2Synch();
const getApiUrl = () => getGroqApiUrlSynch();

// Styling components
const GradientTypography = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(to right, #4f46e5, #8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent'
}));

const GradientButton = styled(Button)(({ theme, disabled }) => ({
  background: disabled ? 'rgba(55, 65, 81, 0.5)' : 'linear-gradient(to right, #4f46e5, #8b5cf6)',
  color: 'white',
  padding: '12px 24px',
  '&:hover': {
    background: disabled ? 'rgba(55, 65, 81, 0.5)' : 'linear-gradient(to right, #4f46e5, #7c3aed)',
  },
  boxShadow: disabled ? 'none' : '0 4px 15px -3px rgba(79, 70, 229, 0.4)',
  border: disabled ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(79, 70, 229, 0.3)',
}));

const RedButton = styled(Button)({
  background: 'linear-gradient(to right, #dc2626, #b91c1c)',
  color: 'white',
  padding: '12px 24px',
  '&:hover': {
    background: 'linear-gradient(to right, #dc2626, #991b1b)',
  },
  boxShadow: '0 4px 15px -3px rgba(220, 38, 38, 0.4)',
  border: '1px solid rgba(220, 38, 38, 0.3)',
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(8px)',
  backgroundColor: 'rgba(31, 41, 55, 0.4)',
  borderRadius: '24px',
  border: '1px solid rgba(79, 70, 229, 0.3)',
  padding: '32px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: theme.shadows[10],
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: 'rgba(79, 70, 229, 0.3)',
  border: '1px solid rgba(79, 70, 229, 0.3)',
  color: theme.palette.primary.light,
  width: 56,
  height: 56,
}));

const MessageBubble = styled(Box)(({ isuser, theme }) => ({
  backgroundColor: isuser === "true" ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.6)',
  borderRadius: '12px',
  padding: theme.spacing(2),
  maxWidth: '100%',
  alignSelf: isuser === "true" ? 'flex-end' : 'flex-start',
  border: '1px solid',
  borderColor: isuser === "true" ? 'rgba(79, 70, 229, 0.3)' : 'rgba(107, 114, 128, 0.5)',
  position: 'relative',
  marginBottom: '20px',
}));

const RecordingIndicator = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  '& .pulse': {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 12,
    height: 12,
    marginRight: 8,
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: '#ef4444',
      animation: 'pulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
    },
    '&::after': {
      content: '""',
      position: 'relative',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: '#f87171',
    }
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2)',
      opacity: 0,
    },
  },
});

const PublicSpeakingSimulator = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  useErrorBoundary();
  // State for setup
  const [currentStep, setCurrentStep] = useState('intro'); // intro, setup, practice, result
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [speechType, setSpeechType] = useState('impromptu');
  const [timeLimit, setTimeLimit] = useState(60); // seconds
  const [customPrompt, setCustomPrompt] = useState('');
  
  // State for practice
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechTimer, setSpeechTimer] = useState(0);
  const [speechComplete, setSpeechComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState({
    clarity: 0,
    confidence: 0,
    structure: 0,
    delivery: 0,
    overall: 0
  });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [dataSaved, setDataSaved] = useState(false);
  const [speechStarted, setSpeechStarted] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // For audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const difficultySettings = {
    easy: {
      timeLimit: 60,
      feedbackLevel: 'supportive',
      tolerance: 'high'
    },
    medium: {
      timeLimit: 120,
      feedbackLevel: 'balanced',
      tolerance: 'medium'
    },
    hard: {
      timeLimit: 180,
      feedbackLevel: 'rigorous',
      tolerance: 'low'
    }
  };

  // Scroll to bottom effect
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [feedback]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (isListening && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setSpeechTimer(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && isListening) {
      stopListening();
    }
    return () => clearInterval(timer);
  }, [isListening, timeLeft]);

  const generateTopic = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl(), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getApiKey()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "system",
              content: `You are a public speaking coach. Generate a relevant topic for a ${speechType} speech. The topic should be:
              - For impromptu: personal experiences or general observations
              - For informative: educational and fact-based
              - For persuasive: controversial but appropriate topics
              - For motivational: inspiring and action-oriented
              
              Return only the topic as a single string, no additional text or formatting.`
            },
            {
              role: "user",
              content: `Generate a ${speechType} speech topic.`
            }
          ]
        })
      });
  
      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        setTopic(data.choices[0].message.content.trim());
      } else {
        throw new Error("Failed to generate topic");
      }
  
      setTimeLimit(difficultySettings[difficulty].timeLimit);
      setTimeLeft(difficultySettings[difficulty].timeLimit);
    } catch (error) {
      console.error("Error generating topic:", error);
      // Simple fallback topics
      const fallbackTopic = {
        impromptu: "The most important lesson I've learned in life",
        informative: "The impact of technology on modern society",
        persuasive: "Why continuous learning is essential in today's world",
        motivational: "Overcoming challenges and achieving your goals"
      }[speechType] || "The importance of public speaking skills";
      
      setTopic(fallbackTopic);
      setTimeLimit(difficultySettings[difficulty].timeLimit);
      setTimeLeft(difficultySettings[difficulty].timeLimit);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up custom topic
  const setCustomTopic = () => {
    if (customPrompt.trim()) {
      setTopic(customPrompt.trim());
    }
  };

  // Start recording
  const startListening = async () => {
    setIsListening(true);
    setSpeechStarted(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        if (!speechComplete) {
          // Create a FormData object to send the audio file
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.wav');
          formData.append('model', 'distil-whisper-large-v3-en');
          
          try {
            setIsAnalyzing(true);
            
            // Transcribe the speech
            const response = await axios.post(
              'https://api.groq.com/openai/v1/audio/transcriptions',
              formData,
              {
                headers: {
                  'Authorization': `Bearer ${getApiKey()}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
            
            const transcribedText = response.data.text;
            setTranscript(transcribedText);
            
            // Now analyze the speech
            await analyzeSpeech(transcribedText);
          } catch (err) {
            console.error("Speech-to-text error:", err);
            setFeedback("Sorry, I couldn't transcribe your speech. Please try again.");
          } finally {
            setIsAnalyzing(false);
          }
        }
      };
      
      mediaRecorder.start(1000); // Start recording and save chunks every second
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
    }
  };

  // Stop recording
  const stopListening = () => {
    setIsListening(false);
    setSpeechComplete(true);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Also stop all tracks in the stream
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    }
  };

  const analyzeSpeech = async (speechText) => {
    setIsAiThinking(true);
    let newScores = null;
    
    try {
      const response = await fetch(getApiUrl(), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getApiKey()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "system",
              content: `You are a professional public speaking coach. Analyze the speech and provide feedback in the following format:
    
  First provide detailed feedback for each category:
  1. Clarity and Coherence: [feedback]
  2. Structure and Organization: [feedback]
  3. Delivery and Confidence: [feedback]
  4. Content and Relevance: [feedback]
  5. Overall Impression: [feedback]
  
  SCORES (in valid JSON format):
  {"clarity":80,"structure":75,"delivery":70,"confidence":65,"overall":72}`
            },
            {
              role: "user",
              content: speechText || "This is a test speech for evaluation."
            }
          ]
        })
      });
  
      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        const analysisText = data.choices[0].message.content;
        
        // Extract JSON scores using a more reliable method
        const jsonMatch = analysisText.match(/\{(?:[^{}]|)*\}/);
        let scoreData = null;
        
        if (jsonMatch) {
          try {
            const cleanJson = jsonMatch[0].replace(/[\n\r\t]/g, '').replace(/'/g, '"');
            scoreData = JSON.parse(cleanJson);
            newScores = {
              clarity: Math.round(scoreData.clarity || 0),
              structure: Math.round(scoreData.structure || 0),
              delivery: Math.round(scoreData.delivery || 0),
              confidence: Math.round(scoreData.confidence || 0),
              overall: Math.round(scoreData.overall || 0)
            };
            setScores(newScores);

            let feedbackText = analysisText;
            const scoresIndex = feedbackText.indexOf("SCORES");
              if (scoresIndex !== -1) {
                feedbackText = feedbackText.substring(0, scoresIndex).trim();
              }

              feedbackText = feedbackText.replace(/\{[^}]*\}/g, "").trim();
              setFeedback(feedbackText);
          } catch (e) {
            console.error("Error parsing JSON scores:", e);
            setDefaultScores();
          }
        } else {
          setDefaultScores();
          const feedbackText = analysisText.replace(/SCORES[\s\S]*$/i, "").trim();
          setFeedback(feedbackText);
        }
        
        // Save with the actual scores
        setSpeechStarted(true);
        await saveActivityData(newScores); 
      }        
    } catch (error) {
      console.error("Error analyzing speech:", error);
      setFeedback("I encountered an error while analyzing your speech. Please try again.");
      setDefaultScores();
    } finally {
      setIsAiThinking(false);
      setCurrentStep('result');
      // Try to save data after analysis is complete, if it fails we can retry later
      try {
        setSpeechStarted(true);
      } catch (error) {
        console.error('Failed to save activity data automatically:', error);
        setSaveError('Failed to save your progress. You can retry using the "Save Progress" button.');
      }
    }
  };
  
  // Helper function to set default scores
  const setDefaultScores = () => {
    setScores({
      clarity: 70,
      structure: 65,
      delivery: 60,
      confidence: 65,
      overall: 65
    });
  };

  // Save data to Firebase
  const saveActivityData = async (currentScores = null) => {
    const scoresToSave = currentScores || scores;
    
    if (!currentUser || !speechStarted || dataSaved) {
      console.log('Skipping data save:', { 
        currentUser: !!currentUser, 
        speechStarted, 
        dataSaved,
        currentScores: scoresToSave 
      });
      return;
    }
  
    try {
      const database = getDatabase();
      const timestamp = Date.now();
      
      console.log('Saving scores:', scoresToSave);
      
      // Create activity data
      const activityData = {
        date: new Date().toISOString(),
        description: `Completed a ${speechType} speech on "${topic}" with score: ${Math.round(scores.overall)}%`,
        duration: `${Math.floor(speechTimer / 60)} min ${speechTimer % 60} sec`,
        id: `publicspeaking_${timestamp}`,
        score: Math.round(scoresToSave.overall),
        type: "Public Speaking",
        createdAt: serverTimestamp()
      };
  
      // Create speech data
      const speechData = {
        timestamp: timestamp,
        topic: topic,
        speechType: speechType,
        difficulty: difficulty,
        duration: speechTimer,
        scores: scoresToSave,
        transcript: transcript,
        feedback: feedback,
        createdAt: serverTimestamp()
      };
  
      // Save activity data
      const historyRef = ref(database, `users/${currentUser.uid}/history/data/${timestamp}/activities/0`);
      await set(historyRef, activityData);
      
      // Save speech data
      const speechRef = ref(database, `users/${currentUser.uid}/public-speaking/${timestamp}`);
      await set(speechRef, speechData);
  
      console.log('Public speaking data and activity saved successfully');
      setDataSaved(true);
      setSaveError(null);
    } catch (error) {
      console.error('Error saving to database:', error);
      setSaveError('Failed to save your progress. Please try again.');
      throw error; // Rethrow to handle at the call site if needed
    }
  };

  // Manual retry for saving data
  const retrySaveData = async () => {
    try {
      await saveActivityData();
    } catch (error) {
      console.error('Error during manual save retry:', error);
    }
  };

  // Start practice session
  const startPractice = () => {
    setCurrentStep('practice');
    setTimeLeft(timeLimit);
    setSpeechTimer(0);
    setSpeechComplete(false);
    setTranscript('');
    setFeedback('');
    setSpeechStarted(true); // Set this to true when practice starts
    setDataSaved(false);
    setSaveError(null);
  };

  // Reset everything for a new practice
  const restartPractice = () => {
    setCurrentStep('setup');
    setTimeLeft(difficultySettings[difficulty].timeLimit);
    setSpeechTimer(0);
    setSpeechComplete(false);
    setTranscript('');
    setFeedback('');
    setScores({
      clarity: 0,
      confidence: 0,
      structure: 0,
      delivery: 0,
      overall: 0
    });
    setDataSaved(false);
    setSpeechStarted(false);
    setSaveError(null);
    generateTopic();
  };

  // Go back to practice page
  const goBack = () => {
    navigate('/practice');
  };

  // Initial topic generation
  useEffect(() => {
    if (currentStep === 'intro') {
      generateTopic();
    }
  }, [currentStep]);

  // Loading screen
  if (isLoading && currentStep === 'intro') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #111827, #312e81)' }}>
        <CircularProgress size={60} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  // Introduction screen
  if (currentStep === 'intro') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StyledAvatar><SpatialAudio /></StyledAvatar>
                <GradientTypography variant="h4" fontWeight="bold">Public Speaking Simulator</GradientTypography>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 4, color: 'grey.300' }}>
                Practice your public speaking skills with AI-powered feedback. Deliver speeches on various topics and receive personalized analysis to improve your delivery, structure, and confidence.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(107, 114, 128, 0.5)', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', mb: 2 }}><Mic /></Avatar>
                      <Typography variant="h6" fontWeight="medium" sx={{ color: 'grey.200', mb: 1 }}>Speech Analysis</Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>Receive detailed feedback on your clarity, structure, delivery and content</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(107, 114, 128, 0.5)', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)', border: '1px solid rgba(79, 70, 229, 0.3)', mb: 2 }}><School /></Avatar>
                      <Typography variant="h6" fontWeight="medium" sx={{ color: 'grey.200', mb: 1 }}>Multiple Formats</Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>Practice impromptu, persuasive, informative and motivational speeches</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <GradientButton fullWidth variant="contained" size="large" onClick={() => setCurrentStep('setup')} endIcon={<NavigateNext />} sx={{ py: 1.5 }}>
                  START PRACTICING
                </GradientButton>
                
                <Button 
                  fullWidth
                  variant="outlined" 
                  startIcon={<ArrowBack />} 
                  onClick={goBack}
                  sx={{ 
                    color: 'grey.300', 
                    borderColor: 'rgba(107, 114, 128, 0.5)',
                    '&:hover': { borderColor: 'grey.300' },
                    py: 1.5
                  }}
                >
                  GO BACK
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

  // Setup screen
  if (currentStep === 'setup') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StyledAvatar><SpatialAudio /></StyledAvatar>
                <GradientTypography variant="h4" fontWeight="bold">Speech Setup</GradientTypography>
              </Box>
              
              <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                <Typography variant="subtitle1" sx={{ color: 'grey.400', mb: 1 }}>Speech Topic:</Typography>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'medium' }}>{topic}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    startIcon={<Refresh />} 
                    size="small" 
                    onClick={generateTopic}
                    disabled={isLoading}
                    sx={{ 
                      color: 'primary.light',
                      '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.1)' }
                    }}
                  >
                    {isLoading ? "Loading..." : "New Topic"}
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ color: 'grey.300', mb: 2 }}>Speech Type:</Typography>
                  <FormControl fullWidth>
                    <ToggleButtonGroup
                      value={speechType}
                      exclusive
                      onChange={(e, newValue) => newValue && setSpeechType(newValue)}
                      sx={{ width: '100%', flexWrap: 'wrap', gap: 1 }}
                    >
                      <ToggleButton 
                        value="impromptu" 
                        sx={{ 
                          flex: '1 0 45%', 
                          py: 2,
                          bgcolor: speechType === 'impromptu' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.6)',
                          color: speechType === 'impromptu' ? 'primary.light' : 'grey.400',
                          border: speechType === 'impromptu' ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid rgba(107, 114, 128, 0.5)',
                          '&:hover': {
                            bgcolor: 'rgba(79, 70, 229, 0.1)'
                          },
                          mb: 1
                        }}
                      >
                        Impromptu
                      </ToggleButton>
                      <ToggleButton 
                        value="informative" 
                        sx={{ 
                          flex: '1 0 45%', 
                          py: 2,
                          bgcolor: speechType === 'informative' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.6)',
                          color: speechType === 'informative' ? 'primary.light' : 'grey.400',
                          border: speechType === 'informative' ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid rgba(107, 114, 128, 0.5)',
                          '&:hover': {
                            bgcolor: 'rgba(79, 70, 229, 0.1)'
                          },
                          mb: 1
                        }}
                      >
                        Informative
                      </ToggleButton>
                      <ToggleButton 
                        value="persuasive" 
                        sx={{ 
                          flex: '1 0 45%', 
                          py: 2,
                          bgcolor: speechType === 'persuasive' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.6)',
                          color: speechType === 'persuasive' ? 'primary.light' : 'grey.400',
                          border: speechType === 'persuasive' ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid rgba(107, 114, 128, 0.5)',
                          '&:hover': {
                            bgcolor: 'rgba(79, 70, 229, 0.1)'
                          },
                          mb: 1
                        }}
                      >
                        Persuasive
                      </ToggleButton>
                      <ToggleButton 
                        value="motivational" 
                        sx={{ 
                          flex: '1 0 45%', 
                          py: 2,
                          bgcolor: speechType === 'motivational' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.6)',
                          color: speechType === 'motivational' ? 'primary.light' : 'grey.400',
                          border: speechType === 'motivational' ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid rgba(107, 114, 128, 0.5)',
                          '&:hover': {
                            bgcolor: 'rgba(79, 70, 229, 0.1)'
                          }
                        }}
                      >
                        Motivational
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ color: 'grey.300', mb: 2 }}>Difficulty Level:</Typography>
                  <FormControl fullWidth>
                    <RadioGroup
                      value={difficulty}
                      onChange={(e) => {
                        setDifficulty(e.target.value);
                        setTimeLimit(difficultySettings[e.target.value].timeLimit);
                        setTimeLeft(difficultySettings[e.target.value].timeLimit);
                      }}
                    >
                      <FormControlLabel 
                        value="easy" 
                        control={
                          <Radio 
                            sx={{ 
                              color: 'grey.500',
                              '&.Mui-checked': {
                                color: '#8b5cf6',
                              },
                            }} 
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="body1" sx={{ color: 'white' }}>Easy (1 minute)</Typography>
                            <Typography variant="body2" sx={{ color: 'grey.400' }}>Supportive feedback, high tolerance</Typography>
                          </Box>
                        }
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel 
                        value="medium" 
                        control={
                          <Radio 
                            sx={{ 
                              color: 'grey.500',
                              '&.Mui-checked': {
                                color: '#8b5cf6',
                              },
                            }} 
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="body1" sx={{ color: 'white' }}>Medium (2 minutes)</Typography>
                            <Typography variant="body2" sx={{ color: 'grey.400' }}>Balanced feedback, medium tolerance</Typography>
                          </Box>
                        }
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel 
                        value="hard" 
                        control={
                          <Radio 
                            sx={{ 
                              color: 'grey.500',
                              '&.Mui-checked': {
                                color: '#8b5cf6',
                              },
                            }} 
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="body1" sx={{ color: 'white' }}>Hard (3 minutes)</Typography>
                            <Typography variant="body2" sx={{ color: 'grey.400' }}>Rigorous feedback, low tolerance</Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: 'grey.300', mb: 2 }}>Or propose your own topic:</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth variant="outlined">
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Enter your own speech topic here..."
                      style={{
                        backgroundColor: 'rgba(31, 41, 55, 0.6)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(107, 114, 128, 0.5)',
                        width: '100%',
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontSize: '1rem'
                      }}
                    />
                  </FormControl>
                  <Button 
                    onClick={setCustomTopic}
                    disabled={!customPrompt.trim()}
                    sx={{ 
                      bgcolor: 'rgba(79, 70, 229, 0.2)',
                      color: 'primary.light',
                      borderRadius: '8px',
                      border: '1px solid rgba(79, 70, 229, 0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(79, 70, 229, 0.3)',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'rgba(31, 41, 55, 0.6)',
                        color: 'grey.500',
                        border: '1px solid rgba(107, 114, 128, 0.3)',
                      }
                    }}
                  >
                    Set Topic
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <GradientButton fullWidth variant="contained" size="large" onClick={startPractice} endIcon={<NavigateNext />} sx={{ py: 1.5 }}>
                  START PRACTICE
                </GradientButton>
                
                <Button 
                  fullWidth
                  variant="outlined" 
                  startIcon={<ArrowBack />} 
                  onClick={() => setCurrentStep('intro')}
                  sx={{ 
                    color: 'grey.300', 
                    borderColor: 'rgba(107, 114, 128, 0.5)',
                    '&:hover': { borderColor: 'grey.300' },
                    py: 1.5
                  }}
                >
                  GO BACK
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

  // Practice screen
  if (currentStep === 'practice') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>Speech Practice</Typography>
                <Chip 
                  label={`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`} 
                  sx={{ 
                    bgcolor: timeLeft < 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(79, 70, 229, 0.2)', 
                    color: timeLeft < 10 ? '#f87171' : 'primary.light',
                    border: timeLeft < 10 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(79, 70, 229, 0.3)',
                    fontSize: '1rem',
                    fontWeight: 'medium',
                    py: 2,
                    px: 2
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                <Typography variant="subtitle1" sx={{ color: 'grey.400', mb: 1 }}>Your Topic:</Typography>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'medium' }}>{topic}</Typography>
                <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
                  <Chip 
                    label={speechType.charAt(0).toUpperCase() + speechType.slice(1)} 
                    sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)', color: 'primary.light', border: '1px solid rgba(79, 70, 229, 0.3)' }} 
                  />
                  <Chip 
                    label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} 
                    sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)' }} 
                  />
                </Box>
              </Box>
              
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                {isListening ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <RecordingIndicator>
                      <span className="pulse"></span>
                      <Typography variant="body1" sx={{ color: '#f87171' }}>Recording...</Typography>
                    </RecordingIndicator>
                    
                    <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
                      Speak clearly into your microphone.
                    </Typography>
                    
                    <RedButton 
                      variant="contained" 
                      startIcon={<MicOff />}
                      onClick={stopListening}
                    >
                      STOP RECORDING
                    </RedButton>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {isAnalyzing ? (
                      <>
                        <CircularProgress size={48} sx={{ color: '#8b5cf6', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'white' }}>Analyzing your speech...</Typography>
                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                          Please wait while the AI evaluates your delivery, structure, and content.
                        </Typography>
                      </>
                    ) : speechComplete ? (
                      <>
                        <Assessment sx={{ fontSize: 48, color: '#8b5cf6', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'white' }}>Speech Complete!</Typography>
                        <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
                          Duration: {Math.floor(speechTimer / 60)}:{(speechTimer % 60).toString().padStart(2, '0')}
                        </Typography>
                        
                        <GradientButton 
                          variant="contained" 
                          startIcon={<NavigateNext />}
                          onClick={() => setCurrentStep('result')}
                        >
                          VIEW RESULTS
                        </GradientButton>
                      </>
                    ) : (
                      <>
                        <Mic sx={{ fontSize: 48, color: '#8b5cf6', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'white' }}>Ready to begin?</Typography>
                        <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
                          Press the button to start recording your speech
                        </Typography>
                        
                        <GradientButton 
                          variant="contained" 
                          startIcon={<Mic />}
                          onClick={startListening}
                        >
                          START RECORDING
                        </GradientButton>
                      </>
                    )}
                  </Box>
                )}
              </Box>
              
              <Button 
                fullWidth
                variant="outlined" 
                startIcon={<ArrowBack />} 
                onClick={() => setCurrentStep('setup')}
                disabled={isListening || isAnalyzing}
                sx={{ 
                  color: 'grey.300', 
                  borderColor: 'rgba(107, 114, 128, 0.5)',
                  '&:hover': { borderColor: 'grey.300' },
                  py: 1.5
                }}
              >
                GO BACK
              </Button>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

  // Results screen
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="md">
        <StyledPaper>
          <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>Speech Analysis</Typography>
              <Chip 
                label={`${Math.floor(speechTimer / 60)}:${(speechTimer % 60).toString().padStart(2, '0')}`} 
                sx={{ 
                  bgcolor: 'rgba(79, 70, 229, 0.2)', 
                  color: 'primary.light',
                  border: '1px solid rgba(79, 70, 229, 0.3)',
                  fontSize: '1rem',
                  fontWeight: 'medium',
                  py: 2,
                  px: 2
                }} 
                icon={<Assessment sx={{ fontSize: '1rem !important', color: 'primary.light !important' }} />}
              />
            </Box>
            
            <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
              <Typography variant="subtitle1" sx={{ color: 'grey.400', mb: 1 }}>Topic:</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'medium' }}>{topic}</Typography>
                
                <Box sx={{ textAlign: 'right' }}>
                  <Chip 
                    label={`${scores.overall}%`} 
                    sx={{ 
                      bgcolor: 'rgba(79, 70, 229, 0.2)', 
                      color: '#8b5cf6',
                      border: '1px solid rgba(79, 70, 229, 0.3)',
                      fontSize: '1rem',
                      fontWeight: 'bold', 
                      mb: 1
                    }} 
                    icon={<EmojiEvents sx={{ fontSize: '1rem !important', color: '#8b5cf6 !important' }} />}
                  />
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>Overall Score</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
                <Chip 
                  label={speechType.charAt(0).toUpperCase() + speechType.slice(1)} 
                  sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)', color: 'primary.light', border: '1px solid rgba(79, 70, 229, 0.3)' }} 
                />
                <Chip 
                  label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} 
                  sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)' }} 
                />
              </Box>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>Performance Analysis</Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(31, 41, 55, 0.6)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                      <CircularProgress
                        variant="determinate"
                        value={scores.clarity}
                        sx={{
                          color: '#8b5cf6',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          borderRadius: '50%'
                        }}
                        size={60}
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
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {scores.clarity}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'grey.300' }}>Clarity</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(31, 41, 55, 0.6)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                      <CircularProgress
                        variant="determinate"
                        value={scores.structure}
                        sx={{
                          color: '#4f46e5',
                          backgroundColor: 'rgba(79, 70, 229, 0.1)',
                          borderRadius: '50%'
                        }}
                        size={60}
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
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {scores.structure}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'grey.300' }}>Structure</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(31, 41, 55, 0.6)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                      <CircularProgress
                        variant="determinate"
                        value={scores.delivery}
                        sx={{
                          color: '#6366f1',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          borderRadius: '50%'
                        }}
                        size={60}
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
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {scores.delivery}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'grey.300' }}>Delivery</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(31, 41, 55, 0.6)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                      <CircularProgress
                        variant="determinate"
                        value={scores.confidence}
                        sx={{
                          color: '#a78bfa',
                          backgroundColor: 'rgba(167, 139, 250, 0.1)',
                          borderRadius: '50%'
                        }}
                        size={60}
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
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {scores.confidence}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'grey.300' }}>Confidence</Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chat sx={{ color: 'primary.light' }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>Speech Transcript</Typography>
                </Box>
                
                <Box sx={{ p: 3, bgcolor: 'rgba(31, 41, 55, 0.6)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)', mb: 3 }}>
                  <Typography sx={{ color: 'grey.300', whiteSpace: 'pre-wrap' }}>
                    {transcript || "No transcript available."}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Assessment sx={{ color: 'primary.light' }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>Feedback & Suggestions</Typography>
                </Box>
                
                <Box sx={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  p: 3, 
                  bgcolor: 'rgba(31, 41, 55, 0.6)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(107, 114, 128, 0.5)',
                  mb: 3,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(31, 41, 55, 0.2)',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(107, 114, 128, 0.5)',
                    borderRadius: '10px',
                  }
                }}>
                  {isAiThinking ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                      <CircularProgress size={40} sx={{ color: '#8b5cf6' }} />
                      <Typography sx={{ color: 'grey.300' }}>Analyzing your speech...</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <MessageBubble isuser="false">
                        <Typography sx={{ color: 'grey.300', whiteSpace: 'pre-wrap' }}>
                          {feedback || "Feedback will appear here after your speech is analyzed."}
                        </Typography>
                      </MessageBubble>
                      <div ref={messagesEndRef} />
                    </Box>
                  )}
                </Box>
                
                {saveError && (
                  <Box sx={{ 
                    p: 2, 
                    mb: 3, 
                    bgcolor: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography sx={{ color: '#f87171' }}>{saveError}</Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={retrySaveData}
                      sx={{ 
                        color: '#f87171', 
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        '&:hover': { 
                          borderColor: '#f87171',
                          bgcolor: 'rgba(239, 68, 68, 0.1)'
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </Box>
                )}
                
                {dataSaved && (
                  <Box sx={{ 
                    p: 2, 
                    mb: 3, 
                    bgcolor: 'rgba(34, 197, 94, 0.1)', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <Typography sx={{ color: '#4ade80' }}>Your progress has been saved successfully!</Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <GradientButton 
                  fullWidth 
                  variant="contained" 
                  startIcon={<Refresh />} 
                  onClick={restartPractice}
                  sx={{ flex: 1 }}
                >
                  TRY AGAIN
                </GradientButton>
                
                <Button 
                  fullWidth
                  variant="outlined" 
                  startIcon={<ArrowBack />} 
                  onClick={goBack}
                  sx={{ 
                    flex: 1,
                    color: 'grey.300', 
                    borderColor: 'rgba(107, 114, 128, 0.5)',
                    '&:hover': { borderColor: 'grey.300' }
                  }}
                >
                  EXIT
                </Button>
              </Box>
            </Box>
          </Box>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default PublicSpeakingSimulator;