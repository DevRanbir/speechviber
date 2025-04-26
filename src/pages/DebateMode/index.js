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
  EmojiEvents, SportsEsports, FaceRetouchingOff, ChevronRight, ThumbUp, ThumbDown
} from '@mui/icons-material';
import axios from 'axios';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// API key
const API_KEY = "AIzaSyDtTaeo58Dzie60E-F2l3SVFmCdkCegrsk";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Styled components
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
  backgroundColor: isuser ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.7)',
  borderRadius: '18px',
  padding: '16px',
  maxWidth: '80%',
  alignSelf: isuser ? 'flex-end' : 'flex-start',
  border: isuser ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
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

// Add useNavigate to the imports at the top
import { useNavigate } from 'react-router-dom';

// Add Firebase imports at the top with the other imports
import { getDatabase, ref, push, set } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';

const DebateSimulator = () => {
  useErrorBoundary();
  // Add currentUser from AuthContext
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for setting up the debate
  const [currentStep, setCurrentStep] = useState('intro'); // intro, setup, debate, result
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [userPosition, setUserPosition] = useState('for');
  const [showSetup, setShowSetup] = useState(true);
  
  // State for the debate itself
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);
  const [debateComplete, setDebateComplete] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [dataSaved, setDataSaved] = useState(false);

  // For audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let timer;
    if (isListening && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isListening) {
      stopListening();
    }
    return () => clearInterval(timer);
  }, [isListening, timeLeft]);

  const difficultySettings = {
    easy: {
      rounds: 3,
      userWinProbability: 0.8
    },
    medium: {
      rounds: 4,
      userWinProbability: 0.5
    },
    hard: {
      rounds: 5,
      userWinProbability: 0.3
    }
  };

  const generateTopic = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Generate a balanced, thoughtful debate topic that reasonable people could argue for or against. Return only the topic as a clear statement. it can be on new tect,advancement,GK,any random topic etc, but not too much Universal basic income related" }]
          }]
        })
      });

      const data = await response.json();
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const responseText = data.candidates[0].content.parts[0].text;
        setTopic(responseText.trim());
      } else {
        // Fallback topic
        setTopic("Social media has done more harm than good to society.");
      }
    } catch (error) {
      console.error("Error generating topic:", error);
      setTopic("Social media has done more harm than good to society.");
    } finally {
      setIsLoading(false);
    }
  };

  const startDebate = () => {
    // Set up the debate parameters based on difficulty
    const settings = difficultySettings[difficulty];
    setMaxRounds(settings.rounds);
    
    // Initialize the debate
    setCurrentStep('debate');
    setMessages([
      {
        text: `Topic: "${topic}"`,
        isUser: false,
        isSystem: true
      },
      {
        text: `You are arguing ${userPosition === 'for' ? 'FOR' : 'AGAINST'} this topic. Let's begin the debate!`,
        isUser: false,
        isSystem: true
      }
    ]);
  };

  const startListening = async () => {
    setTimeLeft(30);
    setIsListening(true);
    
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
        
        // Create a FormData object to send the audio file
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('model', 'distil-whisper-large-v3-en');
        
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
          
          // Add the user's message
          const userMessage = response.data.text;
          setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
          
          // Now let the AI respond
          getAIResponse(userMessage);
        } catch (err) {
          console.error("Speech-to-text error:", err);
          setMessages(prev => [...prev, { 
            text: "Sorry, I couldn't understand what you said. Please try again.", 
            isUser: false, 
            isSystem: true 
          }]);
        }
      };
      
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Also stop all tracks in the stream
      const stream = mediaRecorderRef.current.stream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const getAIResponse = async (userMessage) => {
    setIsAiThinking(true);
    
    const aiPosition = userPosition === 'for' ? 'against' : 'for';
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `
              As an AI debater, respond to the following argument in a debate.
              
              Topic: "${topic}"
              
              You are arguing ${aiPosition} this topic.
              Your opponent said: "${userMessage}"
              
              Current round: ${currentRound} of ${maxRounds}
              Difficulty level: ${difficulty}
              
              Provide a concise, persuasive counterargument. Be respectful but assertive in your position.
              Limit your response to 2-3 sentences for easy reading.
            ` }]
          }]
        })
      });
      
      const data = await response.json();
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiResponse = data.candidates[0].content.parts[0].text.trim();
        setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
      } else {
        setMessages(prev => [...prev, { 
          text: "I'm having trouble formulating a response. Let's continue the debate.", 
          isUser: false 
        }]);
      }
      
      // Check if we need to move to the next round or end the debate
      if (currentRound < maxRounds) {
        setCurrentRound(prev => prev + 1);
      } else {
        // End of debate, move to evaluation
        evaluateDebate();
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages(prev => [...prev, { 
        text: "I'm having technical difficulties. Let's continue.", 
        isUser: false 
      }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const evaluateDebate = async () => {
    setIsEvaluating(true);
    setDebateComplete(true);
    
    // Create a transcript of the debate for evaluation
    const transcript = messages
      .filter(msg => !msg.isSystem)
      .map((msg, i) => `${msg.isUser ? 'Human' : 'AI'}: ${msg.text}`)
      .join('\n\n');
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `
              Evaluate the following debate transcript:
              
              Topic: "${topic}"
              
              The human was arguing ${userPosition} the topic.
              The AI was arguing ${userPosition === 'for' ? 'against' : 'for'} the topic.
              
              Transcript:
              ${transcript}
              
              Difficulty level: ${difficulty}
              
              Based on the quality of arguments, persuasiveness, and debating skills:
              1. Who do you think won the debate?
              2. Give a score (0-100) for the human's performance
              3. Provide brief feedback on the human's debate skills
              
              Format your response as JSON:
              {
                "winner": "human" or "ai",
                "score": number,
                "feedback": "text"
              }
            ` }]
          }]
        })
      });
      
      const data = await response.json();
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const responseText = data.candidates[0].content.parts[0].text;
        
        let result;
        try {
          // Extract JSON from the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (e) {
          console.error("Error parsing JSON result:", e);
        }
        
        if (result) {
          // Apply difficulty bias to winning determination
          const settings = difficultySettings[difficulty];
          const biasedWinner = Math.random() < settings.userWinProbability ? "human" : "ai";
          
          // If biased winner is human but AI actually won, adjust the score up
          let finalWinner = result.winner;
          let finalScore = result.score;
          
          if (biasedWinner === "human" && result.winner === "ai") {
            finalWinner = "human";
            finalScore = Math.min(100, result.score + Math.floor(Math.random() * 20) + 10);
          }
          
          // If biased winner is AI but human actually won, adjust score down
          if (biasedWinner === "ai" && result.winner === "human") {
            finalWinner = "ai";
            finalScore = Math.max(40, result.score - Math.floor(Math.random() * 20) - 10);
          }
          
          setIsWinner(finalWinner === "human");
          setFinalScore(finalScore);
          
          // Add a conclusion message
          setMessages(prev => [...prev, { 
            text: `Debate concluded! ${result.feedback}`, 
            isUser: false,
            isSystem: true
          }]);
          
          // Save debate data to Firebase
          if (currentUser) {
            try {
              const database = getDatabase();
              const timestamp = Date.now();
          
              // Create activity data in the same format
              const activityData = {
                date: new Date().toISOString(),
                description: `Completed debate on "${topic}" with score: ${finalScore}%`,
                duration: "15", // Duration in minutes
                id: `debate_${timestamp}_${finalScore}`,
                score: finalScore,
                type: "Debate",
                completed: true
              };
          
              // Save to history/activities path
              const historyRef = ref(
                database,
                `users/${currentUser.uid}/history/data/${timestamp}/activities/0`
              );
          
              // Save both activity data and detailed debate data
              Promise.all([
                set(historyRef, activityData),
                push(ref(database, `users/${currentUser.uid}/debate/data`), {
                  time: new Date().toISOString(),
                  topic: topic,
                  difficulty: difficulty,
                  position: userPosition,
                  score: finalScore,
                  result: finalWinner === "human" ? "victory" : "defeat"
                })
              ])
              .then(() => {
                console.log('Debate data saved successfully');
                setDataSaved(true);
              })
              .catch(error => console.error('Error saving debate data:', error));
          
            } catch (error) {
              console.error('Error saving to database:', error);
            }
          }
          
        } else {
          // Fallback if JSON parsing fails
          const fallbackScore = Math.floor(Math.random() * 30) + 60;
          const fallbackWinner = Math.random() < difficultySettings[difficulty].userWinProbability ? "human" : "ai";
          
          setIsWinner(fallbackWinner === "human");
          setFinalScore(fallbackScore);
          
          // Save fallback data to Firebase - FIXED
          if (currentUser) {
            try {
              const database = getDatabase();
              const debateData = {
                time: new Date().toISOString(),
                score: fallbackScore,
                result: fallbackWinner === "human" ? "victory" : "defeat", // This is correct
                topic: topic,
                difficulty: difficulty,
                position: userPosition
              };

              const debateRef = ref(
                database, 
                `users/${currentUser.uid}/debate/data`
              );
              
              push(debateRef, debateData)
                .then(() => {
                  console.log('Debate data saved successfully');
                })
                .catch(error => console.error('Error saving debate data:', error));
            } catch (error) {
              console.error('Error saving to database:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error evaluating debate:", error);
      // Fallback random result weighted by difficulty
      const fallbackScore = Math.floor(Math.random() * 30) + 60;
      const fallbackWinner = Math.random() < difficultySettings[difficulty].userWinProbability ? "human" : "ai";
      
      setIsWinner(fallbackWinner === "human");
      setFinalScore(fallbackScore);
      
      // Save fallback data to Firebase - FIXED
      if (currentUser) {
        try {
          const database = getDatabase();
          const debateData = {
            time: new Date().toISOString(),
            score: fallbackScore,
            result: fallbackWinner === "human" ? "victory" : "defeat", // This is correct
            topic: topic,
            difficulty: difficulty,
            position: userPosition
          };

          const debateRef = ref(
            database, 
            `users/${currentUser.uid}/debate/data`
          );
          
          push(debateRef, debateData)
            .then(() => {
              console.log('Debate data saved successfully');
            })
            .catch(error => console.error('Error saving debate data:', error));
        } catch (error) {
          console.error('Error saving to database:', error);
        }
      }
    } finally {
      setIsEvaluating(false);
      setCurrentStep('result');
    }
  };

  const restartDebate = () => {
    // Reset all debate state
    setCurrentStep('setup');
    setMessages([]);
    setCurrentRound(1);
    setDebateComplete(false);
    setFinalScore(null);
    setIsWinner(false);
    generateTopic();
  };

  const goBack = () => {
    navigate('/practice');
  };

  // Calculate progress percentage
  const progressPercentage = ((currentRound - 1) / maxRounds) * 100;

  useEffect(() => {
    // Generate a topic when component mounts
    if (currentStep === 'intro') {
      generateTopic();
    }
  }, [currentStep]);

  if (isLoading && currentStep === 'intro') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #111827, #312e81)' }}>
        <CircularProgress size={60} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  if (currentStep === 'intro') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StyledAvatar><Chat /></StyledAvatar>
                <GradientTypography variant="h4" fontWeight="bold">AI Debate Arena</GradientTypography>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 4, color: 'grey.300' }}>
                Challenge yourself in a real-time debate against an AI opponent. Use your voice to argue your position and receive instant feedback on your persuasive skills.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(107, 114, 128, 0.5)', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', mb: 2 }}><Mic /></Avatar>
                      <Typography variant="h6" fontWeight="medium" sx={{ color: 'grey.200', mb: 1 }}>Voice Debates</Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>Argue your position using natural speech like in a real debate</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(107, 114, 128, 0.5)', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)', border: '1px solid rgba(79, 70, 229, 0.3)', mb: 2 }}><SportsEsports /></Avatar>
                      <Typography variant="h6" fontWeight="medium" sx={{ color: 'grey.200', mb: 1 }}>Difficulty Levels</Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>Choose your challenge from easy to expert opponent difficulty</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <GradientButton fullWidth variant="contained" size="large" onClick={() => setCurrentStep('setup')} endIcon={<NavigateNext />} sx={{ py: 1.5 }}>
                  START DEBATING
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

  if (currentStep === 'setup') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StyledAvatar><Chat /></StyledAvatar>
                <GradientTypography variant="h4" fontWeight="bold">Debate Setup</GradientTypography>
              </Box>
              
              <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                <Typography variant="subtitle1" sx={{ color: 'grey.400', mb: 1 }}>Today's Debate Topic:</Typography>
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
                  <Typography variant="subtitle1" sx={{ color: 'grey.300', mb: 2 }}>Choose Your Position:</Typography>
                  <FormControl fullWidth>
                    <ToggleButtonGroup
                      value={userPosition}
                      exclusive
                      onChange={(e, newValue) => newValue && setUserPosition(newValue)}
                      sx={{ width: '100%' }}
                    >
                      <ToggleButton 
                        value="for" 
                        sx={{ 
                          flex: 1, 
                          py: 2,
                          bgcolor: userPosition === 'for' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.6)',
                          color: userPosition === 'for' ? 'primary.light' : 'grey.400',
                          border: userPosition === 'for' ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid rgba(107, 114, 128, 0.5)',
                          '&:hover': {
                            bgcolor: 'rgba(79, 70, 229, 0.1)'
                          }
                        }}
                      >
                        <ThumbUp sx={{ mr: 1 }} />
                        For
                      </ToggleButton>
                      <ToggleButton 
                        value="against" 
                        sx={{ 
                          flex: 1, 
                          py: 2,
                          bgcolor: userPosition === 'against' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.6)',
                          color: userPosition === 'against' ? 'primary.light' : 'grey.400',
                          border: userPosition === 'against' ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid rgba(107, 114, 128, 0.5)',
                          '&:hover': {
                            bgcolor: 'rgba(79, 70, 229, 0.1)'
                          }
                        }}
                      >
                        <ThumbDown sx={{ mr: 1 }} />
                        Against
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ color: 'grey.300', mb: 2 }}>Select Difficulty:</Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <FormControlLabel 
                        value="easy" 
                        control={
                          <Radio 
                            sx={{ 
                              color: 'grey.500',
                              '&.Mui-checked': {
                                color: '#10b981',
                              },
                            }} 
                          />
                        } 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ color: difficulty === 'easy' ? '#10b981' : 'grey.400' }}>Easy</Typography>
                            <Chip 
                              size="small" 
                              label={`${difficultySettings.easy.rounds} rounds`} 
                              sx={{ 
                                ml: 1, 
                                bgcolor: difficulty === 'easy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(75, 85, 99, 0.2)',
                                border: difficulty === 'easy' ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
                                color: difficulty === 'easy' ? '#10b981' : 'grey.500'
                              }} 
                            />
                          </Box>
                        }
                      />
                      <FormControlLabel 
                        value="medium" 
                        control={
                          <Radio 
                            sx={{ 
                              color: 'grey.500',
                              '&.Mui-checked': {
                                color: '#f59e0b',
                              },
                            }} 
                          />
                        } 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ color: difficulty === 'medium'? '#f59e0b' : 'grey.400' }}>Medium</Typography>
                            <Chip 
                              size="small" 
                              label={`${difficultySettings.medium.rounds} rounds`} 
                              sx={{ 
                                ml: 1, 
                                bgcolor: difficulty === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(75, 85, 99, 0.2)',
                                border: difficulty === 'medium' ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
                                color: difficulty === 'medium' ? '#f59e0b' : 'grey.500'
                              }} 
                            />
                          </Box>
                        }
                      />
                      <FormControlLabel 
                        value="hard" 
                        control={
                          <Radio 
                            sx={{ 
                              color: 'grey.500',
                              '&.Mui-checked': {
                                color: '#ef4444',
                              },
                            }} 
                          />
                        } 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ color: difficulty === 'hard' ? '#ef4444' : 'grey.400' }}>Hard</Typography>
                            <Chip 
                              size="small" 
                              label={`${difficultySettings.hard.rounds} rounds`} 
                              sx={{ 
                                ml: 1, 
                                bgcolor: difficulty === 'hard' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(75, 85, 99, 0.2)',
                                border: difficulty === 'hard' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                                color: difficulty === 'hard' ? '#ef4444' : 'grey.500'
                              }} 
                            />
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <GradientButton 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  onClick={startDebate} 
                  endIcon={<ChevronRight />} 
                  sx={{ py: 1.5 }}
                >
                  BEGIN DEBATE
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
                  BACK TO INTRO
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StyledAvatar><Chat /></StyledAvatar>
            <GradientTypography variant="h5" fontWeight="bold">AI Debate Arena</GradientTypography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBack />} 
              onClick={goBack}
              sx={{ 
                color: 'grey.300', 
                borderColor: 'rgba(107, 114, 128, 0.5)',
                '&:hover': { borderColor: 'grey.300' }
              }}
            >
              Exit Debate
            </Button>
          </Box>
        </Box>

        <StyledPaper>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'primary.light' }}>Progress: </Typography>
              <Typography variant="body2" sx={{ color: 'grey.500' }}>Round {currentRound} of {maxRounds}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={(currentRound / maxRounds) * 100} sx={{ 
              height: 8, borderRadius: 4, bgcolor: 'rgba(31, 41, 55, 0.8)',
              '& .MuiLinearProgress-bar': { background: 'linear-gradient(to right, #4f46e5, #8b5cf6)', borderRadius: 4 }
            }} />
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            mb: 4, 
            maxHeight: '60vh', 
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(31, 41, 55, 0.4)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(79, 70, 229, 0.5)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(79, 70, 229, 0.7)',
              },
            },
          }}>
            {messages.map((message, index) => (
              <MessageBubble key={index} isuser={message.isUser} sx={message.isSystem && message.text.includes("Debate concluded!") ? { width: '100%', alignSelf: 'center' } : {}}>
                {message.isSystem ? (
                  message.text.includes("Debate concluded!") ? (
                    <Box sx={{ 
                      textAlign: 'center',
                      py: 3,
                      px: 4,
                      background: 'linear-gradient(to right, rgba(79, 70, 229, 0.1), rgba(139, 92, 246, 0.1))',
                      borderRadius: 2,
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      width: '100%',
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: 'primary.light',
                        mb: 1,
                        background: 'linear-gradient(to right, #4f46e5, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        🏆 Debate Concluded!
                      </Typography>
                      <Typography sx={{ color: 'grey.300' }}>
                        {message.text.replace("Debate concluded!", "").trim()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography sx={{ color: 'grey.400', fontStyle: 'italic' }}>{message.text}</Typography>
                  )
                ) : (
                  <Typography sx={{ color: 'white' }}>{message.text}</Typography>
                )}
              </MessageBubble>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {!debateComplete && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {isListening ? (
                <RedButton 
                  fullWidth 
                  variant="contained" 
                  onClick={stopListening} 
                  startIcon={(<RecordingIndicator><span className="pulse"></span></RecordingIndicator>)} 
                  sx={{ py: 1.5 }}
                >
                  Stop Recording ({timeLeft}s)
                </RedButton>
              ) : (
                <GradientButton 
                  fullWidth 
                  variant="contained" 
                  onClick={startListening} 
                  disabled={isAiThinking}
                  startIcon={<Mic />} 
                  sx={{ py: 1.5 }}
                >
                  Start Speaking
                </GradientButton>
              )}
            </Box>
          )}

          {currentStep === 'result' && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  margin: '0 auto', 
                  mb: 2,
                  bgcolor: finalScore >= 49 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${finalScore >= 49 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                }}
              >
                <EmojiEvents sx={{ fontSize: 40, color: finalScore >= 49 ? '#10b981' : '#ef4444' }} />
              </Avatar>
              
              <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
                {finalScore >= 49 ? 'Victory!' : 'Defeat'}
              </Typography>
              
              <Typography variant="body1" sx={{ color: 'grey.400', mb: 3 }}>
                Your debate performance score: {finalScore}%
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={restartDebate}
                  startIcon={<Refresh />}
                  sx={{
                    color: 'grey.300',
                    borderColor: 'rgba(107, 114, 128, 0.5)',
                    '&:hover': { borderColor: 'grey.300' }
                  }}
                >
                  New Debate
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={goBack}
                  startIcon={<ArrowBack />}
                  sx={{
                    color: 'grey.300',
                    borderColor: 'rgba(107, 114, 128, 0.5)',
                    '&:hover': { borderColor: 'grey.300' }
                  }}
                >
                  Exit
                </Button>
              </Box>
            </Box>
          )}
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default DebateSimulator;