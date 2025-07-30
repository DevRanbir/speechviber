'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Container, LinearProgress, Paper, Card, CardContent,
  Avatar, Chip, Grid, CircularProgress, Divider, ToggleButtonGroup, ToggleButton, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Extension,
  Mic,
  MicOff,
  ArrowBack,
  NavigateNext,
  SportsEsports,
  Assessment,
  EmojiEvents,
  Refresh,
  ChevronRight as ChevronRightIcon,
  School as SchoolIcon,  // Add this import
  Chat as ChatIcon,      // Make sure this is also imported
  Extension as ExtensionIcon  // Add this import
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, serverTimestamp } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';

// API Configuration
const API_KEY = process.env.REACT_APP_GROQ_API_KEY_2;
const API_URL = process.env.REACT_APP_GROQ_API_URL;

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

const WordCard = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(79, 70, 229, 0.15)',
  border: '1px solid rgba(79, 70, 229, 0.3)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 20px -5px rgba(79, 70, 229, 0.4)',
}));

const WordWizardry = () => {
  useErrorBoundary();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for setup
  const [currentStep, setCurrentStep] = useState('intro'); // intro, setup, game, result
  const [currentWord, setCurrentWord] = useState('');
  const [currentWordMeaning, setCurrentWordMeaning] = useState('');
  const [tabooWords, setTabooWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [category, setCategory] = useState('general');
  const [timeLimit, setTimeLimit] = useState(60); // seconds
  
  // State for game
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gameTimer, setGameTimer] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState({
    accuracy: 0,
    creativity: 0,
    efficiency: 0,
    vocabulary: 0,
    overall: 0
  });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [dataSaved, setDataSaved] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [revealWord, setRevealWord] = useState(false);

  // For audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const difficultySettings = {
    easy: {
      timeLimit: 60,
      wordComplexity: 'common',
      tabooCount: 2
    },
    medium: {
      timeLimit: 45,
      wordComplexity: 'moderate',
      tabooCount: 3
    },
    hard: {
      timeLimit: 30,
      wordComplexity: 'advanced',
      tabooCount: 4
    }
  };

  const categoryOptions = {
    general: 'General Knowledge',
    science: 'Science & Technology',
    entertainment: 'Entertainment & Media',
    sports: 'Sports & Games',
    food: 'Food & Cuisine'
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
        setGameTimer(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && isListening) {
      stopListening();
    }
    return () => clearInterval(timer);
  }, [isListening, timeLeft]);

  const generateWord = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "system",
              content: `You are creating content for a word description game. Generate a ${difficultySettings[difficulty].wordComplexity} word from the ${category} category along with its definition and ${difficultySettings[difficulty].tabooCount} taboo words (words that cannot be used in the description). Return the data in JSON format:
              {
                "word": "example",
                "definition": "a clear, concise definition of the word",
                "tabooWords": ["word1", "word2"...]
              }`
            },
            {
              role: "user",
              content: `Generate a ${difficulty} difficulty word in the ${category} category.`
            }
          ]
        })
      });
  
      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        try {
          // Extract JSON from the content, handling markdown code blocks if present
          const content = data.choices[0].message.content;
          let jsonContent = content;
          
          // Check if the content is wrapped in markdown code blocks
          const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            jsonContent = jsonMatch[1];
          }
          
          const parsedContent = JSON.parse(jsonContent);
          setCurrentWord(parsedContent.word);
          setCurrentWordMeaning(parsedContent.definition);
          setTabooWords(parsedContent.tabooWords);
        } catch (error) {
          console.error("Error parsing content:", error);
          setFallbackWord();
        }
      } else {
        throw new Error("Failed to generate word");
      }
  
      setTimeLimit(difficultySettings[difficulty].timeLimit);
      setTimeLeft(difficultySettings[difficulty].timeLimit);
    } catch (error) {
      console.error("Error generating word:", error);
      setFallbackWord();
    } finally {
      setIsLoading(false);
    }
  };

  const setFallbackWord = () => {
    const fallbackWords = {
      general: { word: "Time", definition: "The indefinite continued progress of existence and events in the past, present, and future regarded as a whole.", tabooWords: ["clock", "watch", "hour", "minute"] },
      science: { word: "Gravity", definition: "The force that attracts a body toward the center of the earth, or toward any other physical body having mass.", tabooWords: ["fall", "down", "Earth", "Newton"] },
      entertainment: { word: "Movie", definition: "A story or event recorded by a camera as a set of moving images and shown in a theater or on television.", tabooWords: ["film", "cinema", "screen", "actor"] },
      sports: { word: "Basketball", definition: "A game played between two teams of five players in which goals are scored by throwing a ball through a netted hoop.", tabooWords: ["hoop", "court", "dribble", "NBA"] },
      food: { word: "Chocolate", definition: "A food preparation in the form of a paste or solid block made from roasted and ground cacao seeds.", tabooWords: ["cocoa", "sweet", "brown", "candy"] }
    };
    
    const selected = fallbackWords[category] || fallbackWords.general;
    setCurrentWord(selected.word);
    setCurrentWordMeaning(selected.definition);
    setTabooWords(selected.tabooWords.slice(0, difficultySettings[difficulty].tabooCount));
    setTimeLimit(difficultySettings[difficulty].timeLimit);
    setTimeLeft(difficultySettings[difficulty].timeLimit);
  };

  // Start recording
  const startListening = async () => {
    setIsListening(true);
    setGameStarted(true);
    setRevealWord(false);
    
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
        
        if (!gameComplete) {
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
                  'Authorization': `Bearer ${API_KEY}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
            
            const transcribedText = response.data.text;
            setTranscript(transcribedText);
            
            // Now analyze the description
            await analyzeDescription(transcribedText);
          } catch (err) {
            console.error("Speech-to-text error:", err);
            setFeedback("Sorry, I couldn't transcribe your description. Please try again.");
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
    setGameComplete(true);
    
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

  const analyzeDescription = async (descriptionText) => {
    setIsAiThinking(true);
    let newScores = null;
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "system",
              content: `You are evaluating a player's description in a word guessing game. The player had to describe a word without using certain taboo words.

Target Word: ${currentWord}
Definition: ${currentWordMeaning}
Taboo Words: ${tabooWords.join(", ")}

Evaluate the player's description in the following categories:
1. Accuracy: How well did they capture the meaning of the word?
2. Creativity: How creative and engaging was their description?
3. Efficiency: How concise and clear was their explanation?
4. Vocabulary: How diverse and appropriate was their word choice?

Also check if they accidentally used any of the taboo words.

Provide detailed feedback for each category in the following format:

First provide detailed feedback for each category:
1. Accuracy: [feedback]
2. Creativity: [feedback] 
3. Efficiency: [feedback]
4. Vocabulary: [feedback]
5. Overall Impression: [feedback]
6. Taboo Words: [mention if they used any taboo words]

SCORES (in valid JSON format):
{"accuracy":80,"creativity":75,"efficiency":70,"vocabulary":65,"overall":72}`
            },
            {
              role: "user",
              content: descriptionText || "This is a test description for evaluation."
            }
          ]
        })
      });
  
      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        const analysisText = data.choices[0].message.content;
        
        // Extract JSON scores
        const jsonMatch = analysisText.match(/\{(?:[^{}]|)*\}/);
        let scoreData = null;
        
        if (jsonMatch) {
          try {
            const cleanJson = jsonMatch[0].replace(/[\n\r\t]/g, '').replace(/'/g, '"');
            scoreData = JSON.parse(cleanJson);
            newScores = {
              accuracy: Math.round(scoreData.accuracy || 0),
              creativity: Math.round(scoreData.creativity || 0),
              efficiency: Math.round(scoreData.efficiency || 0),
              vocabulary: Math.round(scoreData.vocabulary || 0),
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
        setGameStarted(true);
        await saveActivityData(newScores); 
      }        
    } catch (error) {
      console.error("Error analyzing description:", error);
      setFeedback("I encountered an error while analyzing your description. Please try again.");
      setDefaultScores();
    } finally {
      setIsAiThinking(false);
      setCurrentStep('result');
      setRevealWord(true);
      // Try to save data after analysis is complete
      try {
        setGameStarted(true);
      } catch (error) {
        console.error('Failed to save activity data automatically:', error);
        setSaveError('Failed to save your progress. You can retry using the "Save Progress" button.');
      }
    }
  };
  
  // Helper function to set default scores
  const setDefaultScores = () => {
    setScores({
      accuracy: 70,
      creativity: 65,
      efficiency: 60,
      vocabulary: 65,
      overall: 65
    });
  };

  // Save data to Firebase
  const saveActivityData = async (currentScores = null) => {
    const scoresToSave = currentScores || scores;
    
    if (!currentUser || !gameStarted || dataSaved) {
      console.log('Skipping data save:', { 
        currentUser: !!currentUser, 
        gameStarted, 
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
        description: `Completed WordWizardry game on "${currentWord}" with score: ${Math.round(scoresToSave.overall)}%`,
        duration: `${Math.floor(gameTimer / 60)} min ${gameTimer % 60} sec`,
        id: `wordwizardry_${timestamp}`,
        score: Math.round(scoresToSave.overall),
        type: "Word Wizardry",
        createdAt: serverTimestamp()
      };
  
      // Create game data
      const gameData = {
        timestamp: timestamp,
        word: currentWord,
        definition: currentWordMeaning,
        tabooWords: tabooWords,
        category: category,
        difficulty: difficulty,
        duration: gameTimer,
        scores: scoresToSave,
        transcript: transcript,
        feedback: feedback,
        createdAt: serverTimestamp()
      };
  
      // Save activity data
      const historyRef = ref(database, `users/${currentUser.uid}/history/data/${timestamp}/activities/0`);
      await set(historyRef, activityData);
      
      // Save game data
      const gameRef = ref(database, `users/${currentUser.uid}/word-wizardry/${timestamp}`);
      await set(gameRef, gameData);
  
      console.log('Word Wizardry data and activity saved successfully');
      setDataSaved(true);
      setSaveError(null);
    } catch (error) {
      console.error('Error saving to database:', error);
      setSaveError('Failed to save your progress. Please try again.');
      throw error;
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

  // Start game session
  const startGame = () => {
    setCurrentStep('game');
    setTimeLeft(timeLimit);
    setGameTimer(0);
    setGameComplete(false);
    setTranscript('');
    setFeedback('');
    setGameStarted(true);
    setDataSaved(false);
    setSaveError(null);
    setRevealWord(false);
  };

  // Reset everything for a new game
  const restartGame = () => {
    setCurrentStep('setup');
    setTimeLeft(difficultySettings[difficulty].timeLimit);
    setGameTimer(0);
    setGameComplete(false);
    setTranscript('');
    setFeedback('');
    setScores({
      accuracy: 0,
      creativity: 0,
      efficiency: 0,
      vocabulary: 0,
      overall: 0
    });
    setDataSaved(false);
    setGameStarted(false);
    setSaveError(null);
    setRevealWord(false);
    generateWord();
  };

  // Go back to practice page
  const goBack = () => {
    navigate('/practice');
  };

  // Initial word generation
  useEffect(() => {
    if (currentStep === 'intro') {
      generateWord();
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
                <StyledAvatar><Extension /></StyledAvatar>
                <GradientTypography variant="h4" fontWeight="bold">Word Wizardry</GradientTypography>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 4, color: 'grey.300' }}>
                Challenge your descriptive skills! Describe words without using any taboo terms and receive AI-powered feedback on your linguistic creativity and accuracy.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(107, 114, 128, 0.5)', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', mb: 2 }}><Mic /></Avatar>
                      <Typography variant="h6" fontWeight="medium" sx={{ color: 'grey.200', mb: 1 }}>Description Analysis</Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>Get feedback on your accuracy, creativity, efficiency, and vocabulary</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card sx={{ bgcolor: 'rgba(31, 41, 55, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(107, 114, 128, 0.5)', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)', border: '1px solid rgba(79, 70, 229, 0.3)', mb: 2 }}><SportsEsports /></Avatar>
                      <Typography variant="h6" fontWeight="medium" sx={{ color: 'grey.200', mb: 1 }}>Multiple Categories</Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>Challenge yourself with words from various categories and difficulty levels</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <GradientButton fullWidth variant="contained" size="large" onClick={() => setCurrentStep('setup')} endIcon={<NavigateNext />} sx={{ py: 1.5 }}>
                  START PLAYING
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
                <StyledAvatar><Extension /></StyledAvatar>
                <GradientTypography variant="h4" fontWeight="bold">Game Setup</GradientTypography>
              </Box>
              
              <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ color: 'grey.300', mb: 2 }}>Word Category:</Typography>
                  <FormControl fullWidth>
                    <ToggleButtonGroup
                      value={category}
                      exclusive
                      onChange={(e, newValue) => newValue && setCategory(newValue)}
                      sx={{ width: '100%', flexWrap: 'wrap', gap: 1 }}
                      >
  {Object.entries(categoryOptions).map(([value, label]) => (
    <ToggleButton 
      key={value} 
      value={value}
      sx={{
        flex: '1 0 calc(50% - 8px)',
        border: '1px solid rgba(107, 114, 128, 0.5)',
        borderRadius: '8px',
        color: 'grey.300',
        '&.Mui-selected': {
          bgcolor: 'rgba(79, 70, 229, 0.2)',
          borderColor: 'rgba(79, 70, 229, 0.5)',
          color: '#e0e7ff',
        }
      }}
    >
      {label}
    </ToggleButton>
  ))}
</ToggleButtonGroup>
</FormControl>
</Grid>

<Grid item xs={12} sm={6}>
  <Typography variant="subtitle1" sx={{ color: 'grey.300', mb: 2 }}>Difficulty Level:</Typography>
  <FormControl fullWidth>
    <RadioGroup
      row
      value={difficulty}
      onChange={(e) => setDifficulty(e.target.value)}
    >
      {['easy', 'medium', 'hard'].map((level) => (
        <FormControlLabel
          key={level}
          value={level}
          control={
            <Radio 
              sx={{
                color: 'grey.500',
                '&.Mui-checked': {
                  color: '#8b5cf6',
                }
              }}
            />
          }
          label={level.charAt(0).toUpperCase() + level.slice(1)}
          sx={{
            flex: 1,
            bgcolor: difficulty === level ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
            borderRadius: '8px',
            padding: '8px',
            margin: '0 4px 0 0',
            border: difficulty === level ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid transparent',
          }}
        />
      ))}
    </RadioGroup>
  </FormControl>
</Grid>
</Grid>

{isLoading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
    <CircularProgress size={40} sx={{ color: '#8b5cf6' }} />
    <Typography sx={{ ml: 2, color: 'grey.300' }}>Generating your word...</Typography>
  </Box>
) : (
  <WordCard sx={{ mb: 4 }}>
    <Typography variant="h5" fontWeight="medium" sx={{ mb: 1, color: '#e0e7ff' }}>{currentWord}</Typography>
    <Divider sx={{ my: 2, borderColor: 'rgba(79, 70, 229, 0.3)' }} />
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 1 }}>Definition:</Typography>
      <Typography sx={{ color: 'grey.300' }}>{currentWordMeaning}</Typography>
    </Box>
    <Box>
      <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 1 }}>Taboo Words:</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        {tabooWords.map((word, index) => (
          <Chip 
            key={index} 
            label={word} 
            sx={{ 
              bgcolor: 'rgba(239, 68, 68, 0.2)', 
              borderColor: 'rgba(239, 68, 68, 0.3)', 
              border: '1px solid', 
              color: '#fca5a5' 
            }} 
          />
        ))}
      </Box>
    </Box>
  </WordCard>
)}

<Typography variant="body2" sx={{ color: 'grey.400', mb: 3, textAlign: 'center' }}>
  You'll have {difficultySettings[difficulty].timeLimit} seconds to describe the word without using any taboo words.
</Typography>

<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
  <GradientButton 
    fullWidth 
    variant="contained" 
    size="large" 
    onClick={startGame} 
    disabled={isLoading}
    endIcon={<NavigateNext />} 
    sx={{ py: 1.5 }}
  >
    START GAME
  </GradientButton>
  
  <Button 
    fullWidth
    variant="outlined" 
    startIcon={<Refresh />}
    onClick={generateWord}
    disabled={isLoading}
    sx={{ 
      color: 'grey.300', 
      borderColor: 'rgba(107, 114, 128, 0.5)',
      '&:hover': { borderColor: 'grey.300' },
      py: 1.5
    }}
  >
    GENERATE NEW WORD
  </Button>
  
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

// Game screen
if (currentStep === 'game') {
return (
<Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
<Container maxWidth="md">
<StyledPaper>
<Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
<Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />

<Box sx={{ position: 'relative', zIndex: 1 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <StyledAvatar><Extension /></StyledAvatar>
      <GradientTypography variant="h5" fontWeight="bold">Word Challenge</GradientTypography>
    </Box>
    
    <Chip 
      label={`${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`}
      sx={{ 
        bgcolor: timeLeft < 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(79, 70, 229, 0.2)', 
        color: timeLeft < 10 ? '#fca5a5' : '#e0e7ff',
        border: '1px solid',
        borderColor: timeLeft < 10 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(79, 70, 229, 0.5)',
        fontWeight: 'bold',
        fontSize: '1rem',
        px: 2,
        py: 1.5
      }}
    />
  </Box>
  
  <LinearProgress 
    variant="determinate" 
    value={(timeLeft / timeLimit) * 100} 
    sx={{ 
      mb: 4, 
      height: 8, 
      borderRadius: 4,
      bgcolor: 'rgba(31, 41, 55, 0.4)',
      '& .MuiLinearProgress-bar': {
        background: timeLeft < 10 
          ? 'linear-gradient(to right, #ef4444, #b91c1c)'
          : 'linear-gradient(to right, #4f46e5, #8b5cf6)',
        borderRadius: 4
      }
    }} 
  />
  
  <WordCard sx={{ mb: 4 }}>
    <Typography variant="h5" fontWeight="medium" sx={{ mb: 1, color: '#e0e7ff' }}>{currentWord}</Typography>
    <Divider sx={{ my: 2, borderColor: 'rgba(79, 70, 229, 0.3)' }} />
    <Box>
      <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 1 }}>Taboo Words:</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        {tabooWords.map((word, index) => (
          <Chip 
            key={index} 
            label={word} 
            sx={{ 
              bgcolor: 'rgba(239, 68, 68, 0.2)', 
              borderColor: 'rgba(239, 68, 68, 0.3)', 
              border: '1px solid', 
              color: '#fca5a5' 
            }} 
          />
        ))}
      </Box>
    </Box>
  </WordCard>
  
  <Typography variant="subtitle1" sx={{ mb: 3, color: 'grey.300', textAlign: 'center' }}>
    {isListening ? (
      <RecordingIndicator>
        <span className="pulse"></span> Recording... Speak clearly to describe the word
      </RecordingIndicator>
    ) : gameComplete ? (
      isAnalyzing ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CircularProgress size={20} sx={{ color: '#8b5cf6' }} />
          <span>Analyzing your description...</span>
        </Box>
      ) : (
        "Time's up! Let's analyze your description"
      )
    ) : (
      "Press the button when you're ready to describe the word"
    )}
  </Typography>

  {transcript && (
    <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(31, 41, 55, 0.4)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
      <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 1 }}>Your transcript:</Typography>
      <Typography sx={{ color: 'grey.300' }}>{transcript}</Typography>
    </Box>
  )}
  
  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
    {isListening ? (
      <RedButton 
        variant="contained" 
        size="large"
        startIcon={<MicOff />} 
        onClick={stopListening}
        sx={{ minWidth: 200, py: 1.5 }}
      >
        STOP RECORDING
      </RedButton>
    ) : gameComplete ? (
      <GradientButton 
        variant="contained" 
        size="large"
        startIcon={<Assessment />} 
        onClick={() => setCurrentStep('result')}
        disabled={isAnalyzing}
        sx={{ minWidth: 200, py: 1.5 }}
      >
        SEE RESULTS
      </GradientButton>
    ) : (
      <GradientButton 
        variant="contained" 
        size="large"
        startIcon={<Mic />} 
        onClick={startListening}
        sx={{ minWidth: 200, py: 1.5 }}
      >
        START RECORDING
      </GradientButton>
    )}
  </Box>
  
  <Button 
    variant="text" 
    startIcon={<ArrowBack />} 
    onClick={() => setCurrentStep('setup')}
    sx={{ 
      color: 'grey.400', 
      mt: 3, 
      width: '100%',
      '&:hover': { color: 'grey.300' },
    }}
  >
    BACK TO SETUP
  </Button>
</Box>
</StyledPaper>
</Container>
</Box>
);
}

// Results screen
if (currentStep === 'result') {
return (
<Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
<Container maxWidth="md">
<StyledPaper>
<Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
<Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />

<Box sx={{ position: 'relative', zIndex: 1 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
    <StyledAvatar><EmojiEvents /></StyledAvatar>
    <GradientTypography variant="h4" fontWeight="bold">Results</GradientTypography>
  </Box>
  
  {isAiThinking ? (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
      <CircularProgress size={60} sx={{ color: '#8b5cf6', mb: 3 }} />
      <Typography variant="h6" sx={{ color: 'grey.300' }}>Analyzing your performance...</Typography>
    </Box>
  ) : (
    <>
      <WordCard sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="medium" sx={{ mb: 1, color: '#e0e7ff' }}>{currentWord}</Typography>
        {revealWord && (
          <>
            <Divider sx={{ my: 2, borderColor: 'rgba(79, 70, 229, 0.3)' }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 1 }}>Definition:</Typography>
              <Typography sx={{ color: 'grey.300' }}>{currentWordMeaning}</Typography>
            </Box>
          </>
        )}
        <Box>
          <Typography variant="subtitle2" sx={{ color: 'grey.400', mb: 1 }}>Taboo Words:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {tabooWords.map((word, index) => (
              <Chip 
                key={index} 
                label={word} 
                sx={{ 
                  bgcolor: 'rgba(239, 68, 68, 0.2)', 
                  borderColor: 'rgba(239, 68, 68, 0.3)', 
                  border: '1px solid', 
                  color: '#fca5a5' 
                }} 
              />
            ))}
          </Box>
        </Box>
      </WordCard>
      
      <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(31, 41, 55, 0.4)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.5)' }}>
        <Typography variant="subtitle1" sx={{ color: 'grey.200', mb: 1 }}>Your description:</Typography>
        <Typography sx={{ color: 'grey.300', mb: 3 }}>"{transcript}"</Typography>
        
        <Divider sx={{ my: 3, borderColor: 'rgba(107, 114, 128, 0.5)' }} />
        
        <Typography variant="subtitle1" sx={{ color: 'grey.200', mb: 2 }}>AI Feedback:</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Display AI feedback with message bubbles */}
          <MessageBubble isuser="false">
            <Typography sx={{ color: 'grey.300', whiteSpace: 'pre-line' }}>{feedback}</Typography>
          </MessageBubble>
          <div ref={messagesEndRef} />
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'rgba(31, 41, 55, 0.4)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
        <Typography variant="h6" sx={{ mb: 3, color: 'grey.200', textAlign: 'center' }}>Your Scores</Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { name: 'Accuracy', value: scores.accuracy, icon: <SchoolIcon sx={{ color: '#e0e7ff' }} /> },
            { name: 'Creativity', value: scores.creativity, icon: <ExtensionIcon sx={{ color: '#e0e7ff' }} /> },
            { name: 'Efficiency', value: scores.efficiency, icon: <ChevronRightIcon sx={{ color: '#e0e7ff' }} /> },
            { name: 'Vocabulary', value: scores.vocabulary, icon: <ChatIcon sx={{ color: '#e0e7ff' }} /> }
          ].map((score) => (
            <Grid item xs={6} key={score.name}>
              <Box sx={{ textAlign: 'center', p: 2, borderRadius: '12px', bgcolor: 'rgba(31, 41, 55, 0.6)', border: '1px solid rgba(107, 114, 128, 0.3)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)', mr: 1, width: 30, height: 30 }}>
                    {score.icon}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ color: 'grey.300' }}>{score.name}</Typography>
                </Box>
                <Typography variant="h5" sx={{ color: score.value > 75 ? '#10b981' : score.value > 50 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                  {score.value}%
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ textAlign: 'center', p: 3, borderRadius: '12px', bgcolor: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
          <Typography variant="h6" sx={{ color: 'grey.300', mb: 1 }}>Overall Score</Typography>
          <Typography variant="h4" sx={{ 
            color: scores.overall > 75 ? '#10b981' : scores.overall > 50 ? '#f59e0b' : '#ef4444',
            fontWeight: 'bold' 
          }}>
            {scores.overall}%
          </Typography>
        </Box>
      </Paper>
      
      {saveError && (
        <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', p: 2, mb: 3 }}>
          <Typography sx={{ color: '#fca5a5', fontSize: '0.9rem' }}>{saveError}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={retrySaveData}
            sx={{ 
              mt: 1, 
              color: '#fca5a5', 
              borderColor: 'rgba(239, 68, 68, 0.5)',
              '&:hover': { borderColor: '#fca5a5' }
            }}
          >
            Retry Saving
          </Button>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <GradientButton 
          fullWidth 
          variant="contained" 
          size="large" 
          onClick={restartGame} 
          endIcon={<Refresh />} 
          sx={{ py: 1.5 }}
        >
          PLAY AGAIN
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
          BACK TO PRACTICE
        </Button>
      </Box>
    </>
  )}
</Box>
</StyledPaper>
</Container>
</Box>
);
}

return null;
};

export default WordWizardry;