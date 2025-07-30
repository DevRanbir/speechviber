'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Chip,
  Grid,
  Divider,
  Switch,
  FormControl,
  FormGroup,
  Tooltip,
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import IconButton from '@mui/material/IconButton';

import { getDatabase, ref, push, set } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
import { getGroqApiKey2Synch, getGroqApiUrlSynch } from '../../utils/apiKeys';

// API Configuration - now loaded from Firebase
const getApiKey = () => getGroqApiKey2Synch();
const getApiUrl = () => getGroqApiUrlSynch();

const WordContext = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Game settings
  const [difficulty, setDifficulty] = useState('medium');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLimit, setTimeLimit] = useState(15);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);
  
  // Scoring system
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [dataSaved, setDataSaved] = useState(false);


  const updateAccuracy = (correct, incorrect) => {
    const total = correct + incorrect;
    const newAccuracy = total > 0 ? Math.min(Math.round((correct / total) * 100), 100) : 100;
    setAccuracy(newAccuracy);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for better clarity
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Error handling state
  const [error, setError] = useState(null);

  // Generate a question
  // Add this after the state declarations
  const [usedWords, setUsedWords] = useState(new Set());
  
  // Modify the generateQuestion function
  const generateQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setSelectedAnswer('');
    setShowResult(false);
    setError(null);
  
    let difficultyPrompt = '';
    if (difficulty === 'easy') {
      difficultyPrompt = 'common words suitable for elementary to middle school students';
    } else if (difficulty === 'medium') {
      difficultyPrompt = 'moderately difficult words suitable for high school students';
    } else {
      difficultyPrompt = 'advanced vocabulary words suitable for college students or professionals';
    }
  
  // Add this to the prompt
  const excludeWords = Array.from(usedWords).join(', ');
  const promptWithExclusion = `Generate a "word in context" question with exactly a correct and an incorrect sentence. Choose ${difficultyPrompt}. The word must NOT be any of these previously used words: ${excludeWords}. Format exactly as follows:
    Word: [single word]
    Definition: [brief definition of the word]
    Sentences:
    1. [sentence using the word]
    2. [sentence using the word]
    Correct Answer: [specify 1 or 2]
    Explanation: [explain why the correct answer is correct and why the incorrect answer is incorrect]
  
  Important:
  - Both the options have 50-50 probability of being correct
  - Choose a completely new word not in the exclusion list 
  - Randomize which sentence is correct
  - Ensure explanations are clear
  - Always include exactly 1 correct and 1 incorrect use of the word`;
  
  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`
      },
      body: JSON.stringify({
        model: "gemma2-9b-it",
        messages: [{
          role: "user",
          content: promptWithExclusion
        }]
      })
    });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
      }
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Invalid API response structure');
      }
      
      const responseText = data.choices[0].message.content;
      console.log("API Response:", responseText);
      
      try {
        // Extract sections
        const sections = {};
        
        // Get Word
        if (responseText.includes('Word:')) {
          const afterWord = responseText.split('Word:')[1];
          sections.word = afterWord.split('\n')[0].trim();
        }
        
        // Get Definition
        if (responseText.includes('Definition:')) {
          const afterDef = responseText.split('Definition:')[1];
          sections.definition = afterDef.split('\n')[0].trim();
        }
        
        // Get Sentences
        const sentences = [];
        if (responseText.includes('Sentences:')) {
          const sentencesSection = responseText.split('Sentences:')[1].split('Correct Answer:')[0];
          const sentenceLines = sentencesSection.split('\n')
            .filter(line => line.trim())
            .map(line => {
              // Remove any numbering and extra spaces/periods
              return line.replace(/^\d+\.?\s*|\d+\.\s*/g, '').trim();
            })
            .filter(line => line && !line.startsWith('Sentences'));
          
          // Only take unique sentences
          sentences.push(...new Set(sentenceLines));
        }
        
        // Ensure we have exactly 2 unique sentences
        if (sentences.length !== 2) {
          throw new Error('Invalid number of sentences received');
        }
        
        sections.sentences = sentences;
        
        // Get Correct Answer
        if (responseText.includes('Correct Answer:')) {
          try {
            const afterCorrect = responseText.split('Correct Answer:')[1].split('\n')[0].trim();
            const correctAnswer = parseInt(afterCorrect.match(/\d+/)[0]) - 1; // Extract only the number
            if (!isNaN(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 1) {
              sections.correctAnswer = correctAnswer;
            } else {
              throw new Error('Invalid correct answer format');
            }
          } catch (e) {
            throw new Error('Failed to parse correct answer');
          }
        }
        
        // Get Explanation
        if (responseText.includes('Explanation:')) {
          const explanationSection = responseText.split('Explanation:')[1].trim();
          sections.explanation = explanationSection;
        }
        
        console.log("Parsed sections:", sections);
        
        // Validate parsed content
        if (!sections.word || !sections.definition || sections.sentences.length < 2 || sections.correctAnswer === undefined || !sections.explanation) {
          throw new Error('Failed to parse response correctly');
        }
        
        // Ensure we have exactly 2 sentences
        while (sections.sentences.length < 2) {
          sections.sentences.push(`Example sentence ${sections.sentences.length + 1} for ${sections.word}.`);
        }
        if (sections.sentences.length > 2) {
          sections.sentences = sections.sentences.slice(0, 2);
        }
        
        // Add this after successfully parsing the response and before setting the question
        if (sections.word) {
          if (usedWords.has(sections.word.toLowerCase())) {
            throw new Error('Received a repeated word, generating new question');
          }
          setUsedWords(prev => new Set([...prev, sections.word.toLowerCase()]));
        }

        setQuestion({
          word: sections.word,
          definition: sections.definition,
          sentences: sections.sentences,
          correctAnswer: sections.correctAnswer,
          explanation: sections.explanation
        });
        
        // Increment question count when new question is generated
        if (gameStarted) {
          setQuestionCount(prev => prev + 1);
        }

        // Start timer if enabled
        if (timerEnabled && gameStarted) {
          startTimer();
        }
      } catch (parseError) {
        console.error('Parsing error:', parseError);
        throw new Error(`Failed to parse response: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to load question: ${error.message}`);
    }
    setLoading(false);
  };

  // Timer functions
  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeRemaining(timeLimit);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!showResult) {
            handleTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  const handleTimeUp = () => {
    setIsCorrect(false);
    setShowResult(true);
    setIncorrectCount(prev => prev + 1);
    setScore(prev => Math.max(0, prev - 8)); 
    updateAccuracy(correctCount, incorrectCount + 1);
  };

  // Save game data to Firebase
  const saveGameData = () => {
    if (currentUser && questionCount > 0 && !dataSaved) {
      try {
        const database = getDatabase();
        const timestamp = Date.now();
        
        // Create activity data
        const activityData = {
          date: new Date().toISOString(),
          description: `Completed a word context game with score: ${score}`,
          duration: "10 minutes",
          id: `wordcontext_${new Date().toISOString()}_${score}`,
          score: score,
          type: "Word Context"
        };
    
        // Save to history/activities
        const historyRef = ref(
          database,
          `users/${currentUser.uid}/history/data/${timestamp}/activities/0`
        );
    
        // Save game data
        const wordContextRef = ref(
          database,
          `users/${currentUser.uid}/word-context/${timestamp}`
        );
    
        Promise.all([
          set(historyRef, activityData),
          push(wordContextRef, {
            time: new Date().toISOString(),
            correctCount: correctCount,
            incorrectCount: incorrectCount,
            score: score,
            accuracy: accuracy,
            timerEnabled: timerEnabled,
            timeLimit: timerEnabled ? timeLimit : 0,
            difficulty: difficulty
          })
        ])
          .then(() => {
            console.log('Word Context data and activity saved successfully');
            setDataSaved(true);
          })
          .catch(error => console.error('Error saving data:', error));
      } catch (error) {
        console.error('Error saving to database:', error);
      }
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    stopTimer();
    const correct = parseInt(selectedAnswer) === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    const newCorrectCount = correct ? correctCount + 1 : correctCount;
    const newIncorrectCount = correct ? incorrectCount : incorrectCount + 1;
    
    if (correct) {
      setCorrectCount(newCorrectCount);
      const pointsEarned = timerEnabled ? Math.ceil(timeRemaining * 10 / timeLimit) * 10 : 10;
      setScore(prev => prev + pointsEarned);
    } else {
      setIncorrectCount(newIncorrectCount);
      setScore(prev => Math.max(0, prev - 10)); // Decrease score by 10, but not below 0
    }
    
    updateAccuracy(newCorrectCount, newIncorrectCount);
  };

  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setShowSettings(false);
    setScore(0);
    setQuestionCount(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setAccuracy(100);
    setDataSaved(false);
    setUsedWords(new Set()); // Reset used words
    generateQuestion();
  };

  // Go to settings
  const goToSettings = () => {
    if (questionCount > 0) {
      saveGameData();
    }
    stopTimer();
    setShowSettings(true);
    setGameStarted(false);
    setQuestion(null);
    setShowResult(false);
  };

  // Next question
  const handleNextQuestion = () => {
    generateQuestion();
  };

  // Finish game
  const handleFinishGame = () => {
    saveGameData();
    navigate('/practice');
  };

  // Retry loading question if there was an error
  const retryQuestion = () => {
    generateQuestion();
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Typography variant="h4" sx={{ 
          background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          fontSize: { xs: '1.75rem', sm: '2.25rem' }
        }}>
          Word in Context
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {gameStarted && (
            <Button
              variant="outlined"
              onClick={goToSettings}
              sx={{
                borderColor: 'rgba(124, 58, 237, 0.4)',
                color: '#A78BFA',
                '&:hover': {
                  borderColor: '#7C3AED',
                  background: 'rgba(124, 58, 237, 0.1)',
                }
              }}
            >
              Settings
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => {
              if (questionCount > 0) {
                saveGameData();
              }
              navigate('/practice');
            }}
            sx={{
              borderColor: 'rgba(124, 58, 237, 0.4)',
              color: '#A78BFA',
              '&:hover': {
                borderColor: '#7C3AED',
                background: 'rgba(124, 58, 237, 0.1)',
              }
            }}
          >
            Back
          </Button>
        </Box>
      </Box>

      {/* Score display when game has started */}
      {gameStarted && (
        <Paper sx={{
          p: 2,
          mb: 3,
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(124, 58, 237, 0.1)',
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon sx={{ color: '#FFD700' }} />
                <Typography sx={{ color: '#A78BFA', fontWeight: 'bold' }}>
                  Score: {score}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ color: '#4ade80', fontSize: 20 }} />
                <Typography sx={{ color: '#A78BFA' }}>
                  Correct: {correctCount}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CancelIcon sx={{ color: '#f87171', fontSize: 20 }} />
                <Typography sx={{ color: '#A78BFA' }}>
                  Wrong: {incorrectCount}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#A78BFA' }}>
                  Accuracy:
                </Typography>
                <Chip 
                  label={`${accuracy}%`} 
                  size="small"
                  sx={{ 
                    backgroundColor: 
                      accuracy > 80 ? 'rgba(34, 197, 94, 0.2)' :
                      accuracy > 50 ? 'rgba(250, 204, 21, 0.2)' : 
                      'rgba(239, 68, 68, 0.2)',
                    color: 
                      accuracy > 80 ? '#4ade80' :
                      accuracy > 50 ? '#fbbf24' : 
                      '#f87171'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {showSettings ? (
        <Paper sx={{
          p: { xs: 2, sm: 4 },
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(124, 58, 237, 0.1)',
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ color: '#A78BFA', mb: 3 }}>
            Game Settings
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ color: '#A78BFA', mb: 2, textAlign: 'left' }}>
              Difficulty Level:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    background: difficulty === 'easy' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid',
                    borderColor: difficulty === 'easy' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: 'rgba(124, 58, 237, 0.1)',
                    }
                  }}
                  onClick={() => setDifficulty('easy')}
                >
                  <Typography sx={{ color: '#A78BFA' }}>Easy</Typography>
                  <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                    Common words for elementary to middle school
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    background: difficulty === 'medium' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid',
                    borderColor: difficulty === 'medium' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: 'rgba(124, 58, 237, 0.1)',
                    }
                  }}
                  onClick={() => setDifficulty('medium')}
                >
                  <Typography sx={{ color: '#A78BFA' }}>Medium</Typography>
                  <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                    Moderate difficulty for high school students
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    background: difficulty === 'hard' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid',
                    borderColor: difficulty === 'hard' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: 'rgba(124, 58, 237, 0.1)',
                    }
                  }}
                  onClick={() => setDifficulty('hard')}
                >
                  <Typography sx={{ color: '#A78BFA' }}>Hard</Typography>
                  <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                    Advanced vocabulary for college and professionals
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ color: '#A78BFA', mb: 2, textAlign: 'left', display: 'flex', alignItems: 'center' }}>
              Time Limit
              <Tooltip title="Enabling time limit adds pressure and earns you more points for faster answers!" arrow>
                <InfoIcon sx={{ fontSize: 18, ml: 1, color: '#A78BFA' }} />
              </Tooltip>
            </Typography>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormGroup>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: 1,
                  mb: 2
                }}>
                  <Typography sx={{ color: 'white' }}>Enable Time Limit</Typography>
                  <Switch 
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#7C3AED',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#7C3AED',
                      },
                    }}
                  />
                </Box>
              </FormGroup>
            </FormControl>
            
            {timerEnabled && (
              <Box sx={{ p: 2, background: 'rgba(30, 41, 59, 0.6)', borderRadius: 1 }}>
                <Typography sx={{ color: 'white', mb: 2 }}>
                  Time per question: {timeLimit} seconds
                </Typography>
                <Grid container spacing={1}>
                  {[5, 10, 15, 20, 30].map((time) => (
                    <Grid item xs={isMobile ? 4 : 'auto'} key={time}>
                      <Button
                        variant={timeLimit === time ? "contained" : "outlined"}
                        onClick={() => setTimeLimit(time)}
                        fullWidth={isMobile}
                        sx={{
                          background: timeLimit === time ? 'linear-gradient(45deg, #7C3AED, #3B82F6)' : 'transparent',
                          borderColor: 'rgba(124, 58, 237, 0.3)',
                          color: timeLimit === time ? 'white' : '#A78BFA',
                          '&:hover': {
                            borderColor: '#7C3AED',
                            background: timeLimit === time ? 'linear-gradient(45deg, #7C3AED, #3B82F6)' : 'rgba(124, 58, 237, 0.1)',
                          }
                        }}
                      >
                        {time}s
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
          
          <Button
            variant="contained"
            onClick={startGame}
            sx={{
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              py: 1.5,
              px: 6,
              fontSize: '1.1rem'
            }}
          >
            Start Game
          </Button>
        </Paper>
      ) : (
        <>
          {loading ? (
            <Paper sx={{
              p: 4,
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              flexDirection: 'column',
              height: '300px',
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(124, 58, 237, 0.1)',
            }}>
              <CircularProgress sx={{ 
                color: '#A78BFA',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
                mb: 2
              }} />
              <Typography sx={{ color: '#A78BFA' }}>
                Generating question...
              </Typography>
            </Paper>
          ) : error ? (
            <Paper sx={{
              p: 4,
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#f87171', mb: 2 }}>
                Error Loading Question, its AI, thats so great  
              </Typography>
              <Typography sx={{ color: 'white', mb: 3 }}>
                {error}
              </Typography>
              <Button
                variant="contained"
                onClick={retryQuestion}
                sx={{
                  background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                }}
              >
                Try Again
              </Button>
            </Paper>
          ) : (
            <>
              {question && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper sx={{
                    p: { xs: 2, sm: 3 },
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(124, 58, 237, 0.1)',
                    mb: 2
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 2,
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? 1 : 0
                    }}>
                      <Typography variant="h6" sx={{ color: '#A78BFA' }}>
                        Word in Context
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'space-between' : 'flex-end'
                      }}>
                        {timerEnabled && !showResult && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            background: timeRemaining < 3 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                          }}>
                            <TimerIcon sx={{ 
                              color: timeRemaining < 3 ? '#f87171' : '#A78BFA',
                              mr: 1,
                              fontSize: 20
                            }} />
                            <Typography sx={{ 
                              color: timeRemaining < 3 ? '#f87171' : '#A78BFA',
                              fontWeight: 'bold',
                              animation: timeRemaining < 3 ? 'pulse 1s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                                '100%': { opacity: 1 },
                              }
                            }}>
                              {timeRemaining}s
                            </Typography>
                          </Box>
                        )}
                        
                        <Chip 
                          label={`Question ${questionCount}`} 
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(124, 58, 237, 0.2)',
                            color: 'white'
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Divider sx={{ borderColor: 'rgba(124, 58, 237, 0.2)', mb: 2 }} />
                    
                    <Box sx={{ mb: 3, p: 2, background: 'rgba(15, 23, 42, 0.5)', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: '#A78BFA', 
                            fontWeight: 'bold'
                          }}
                        >
                          {question.word}
                        </Typography>
                        <IconButton
                          onClick={() => speakText(`${question.word}. ${question.definition}`)}
                          sx={{
                            color: '#A78BFA',
                            '&:hover': {
                              color: '#7C3AED',
                              backgroundColor: 'rgba(124, 58, 237, 0.1)',
                            }
                          }}
                        >
                          <VolumeUpIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="body1" sx={{ color: 'white' }}>
                        <strong>Definition:</strong> {question.definition}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                      Which sentence uses this word correctly?
                    </Typography>

                    <RadioGroup
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      sx={{ mb: 3 }}
                    >
                      {question.sentences.map((sentence, index) => (
                        <FormControlLabel
                          key={index}
                          value={index.toString()}
                          control={
                            <Radio 
                              sx={{
                                color: '#A78BFA',
                                '&.Mui-checked': {
                                  color: '#7C3AED',
                                },
                              }}
                            />
                          }
                          label={
                            <Paper 
                              sx={{ 
                                p: 2, 
                                borderRadius: 1, 
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: selectedAnswer === index.toString() ? '1px solid #7C3AED' : '1px solid transparent',
                              }}
                            >
                              <Typography sx={{ color: 'white' }}>
                                {index + 1}. {sentence}
                              </Typography>
                            </Paper>
                          }
                          sx={{
                            alignItems: 'flex-start',
                            '.MuiFormControlLabel-label': {
                              width: '100%',
                              marginTop: 0.5,
                            }
                          }}
                        />
                      ))}
                    </RadioGroup>
                    
                    {showResult ? (
                      <Box sx={{ mt: 3 }}>
                        <Paper sx={{ 
                          p: 2, 
                          background: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          mb: 3
                        }}>
                          <Typography sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            color: isCorrect ? '#4ade80' : '#f87171',
                            fontWeight: 'bold',
                            mb: 1
                          }}>
                            {isCorrect ? (
                              <>
                                <CheckCircleIcon sx={{ mr: 1 }} />
                                Correct Answer!
                              </>
                            ) : (
                              <>
                                <CancelIcon sx={{ mr: 1 }} />
                                Incorrect Answer!
                              </>
                            )}
                          </Typography>
                          
                          <Typography sx={{ color: 'white', mb: 2 }}>
                            The correct usage is sentence #{question.correctAnswer + 1}.
                          </Typography>
                          
                          <Typography variant="subtitle2" sx={{ color: '#A78BFA', mb: 1 }}>
                            Explanation:
                          </Typography>
                          <Typography sx={{ color: 'white' }}>
                            {question.explanation}
                          </Typography>
                        </Paper>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                          <Button
                            variant="contained"
                            onClick={handleNextQuestion}
                            sx={{
                              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                              px: 3
                            }}
                          >
                            Next Question
                          </Button>
                          
                          <Button
                            variant="outlined"
                            onClick={handleFinishGame}
                            sx={{
                              borderColor: 'rgba(124, 58, 237, 0.4)',
                              color: '#A78BFA',
                              '&:hover': {
                                borderColor: '#7C3AED',
                                background: 'rgba(124, 58, 237, 0.1)',
                              }
                            }}
                          >
                            Finish Game
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                          variant="contained"
                          onClick={handleAnswerSubmit}
                          disabled={selectedAnswer === ''}
                          sx={{
                            background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                            px: 4,
                            py: 1,
                            opacity: selectedAnswer === '' ? 0.5 : 1
                          }}
                        >
                          Submit Answer
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              )}
            </>
          )}
        </>
      )}
      
      <Box sx={{ 
        mt: 4, 
        p: 2, 
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(124, 58, 237, 0.1)',
        borderRadius: 1
      }}>
        <Typography variant="subtitle2" sx={{ color: '#A78BFA', fontWeight: 'bold', mb: 1 }}>
          How to Play:
        </Typography>
        <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
          Choose which sentence uses the given word correctly based on its definition. 
          {timerEnabled && ' Answer quickly to earn more points!'} Challenge yourself with different difficulty levels to 
          expand your vocabulary.
        </Typography>
      </Box>
    </Container>
  );
};

export default WordContext;