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
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import { getDatabase, ref, push, set } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const WordContext = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Game settings
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', or 'hard'
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLimit, setTimeLimit] = useState(15); // seconds
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);
  
  // Scoring system
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [dataSaved, setDataSaved] = useState(false);

  // Error handling state
  const [error, setError] = useState(null);

  // Generate a question
  // In the generateQuestion function, update the prompt and response handling
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

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [{
            role: "user",
            content: `Generate a "word in context" question with randomly distributed correct and incorrect answers. Choose ${difficultyPrompt}. Format exactly as follows:
              Word: [single word]
              Definition: [brief definition of the word]
              Sentences:
              1. [sentence using the word]
              2. [sentence using the word]
              3. [sentence using the word]
              4. [sentence using the word]
              Correct Answer(s): [randomly select from 1-4]
              Explanation:
              Sentence 1: [explain if correct or incorrect and why, without using asterisks or bold formatting]
              Sentence 2: [explain if correct or incorrect and why, without using asterisks or bold formatting]
              Sentence 3: [explain if correct or incorrect and why, without using asterisks or bold formatting]
              Sentence 4: [explain if correct or incorrect and why, without using asterisks or bold formatting]
            
            Important:
            - Do not use asterisks (*) or bold formatting in any part of the response
            - Randomize which sentences are correct/incorrect (don't follow a pattern)
            - Ensure explanations are clear without relying on formatting
            - Always include exactly 2 correct and 2 incorrect uses of the word`
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
      console.log("API Response:", responseText); // For debugging
      
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
          const sentencesSection = responseText.split('Sentences:')[1].split('Correct Answer(s):')[0];
          const sentenceLines = sentencesSection.split('\n')
            .filter(line => line.trim())
            .map(line => {
              // Remove number and dot from the beginning (e.g., "1. " or "1.")
              return line.replace(/^\d+\.?\s*/, '').trim();
            })
            .filter(line => line); // Remove empty lines
          
          sentences.push(...sentenceLines);
        }
        sections.sentences = sentences;
        
        // Get Correct Answers
        if (responseText.includes('Correct Answer(s):')) {
          try {
            const afterCorrect = responseText.split('Correct Answer(s):')[1].split('\n')[0].trim();
            let correctAnswers = afterCorrect
              .split(',')
              .map(num => parseInt(num.trim()) - 1) // Convert 1-4 to 0-3
              .filter(num => num >= 0 && num <= 3);
            
            // Ensure we have 1-2 answers only
            if (correctAnswers.length > 2) {
              correctAnswers = correctAnswers.slice(0, 2);
            } else if (correctAnswers.length === 0) {
              correctAnswers = [Math.floor(Math.random() * 4)];
            }
            sections.correctAnswers = correctAnswers;
          } catch (e) {
            sections.correctAnswers = [Math.floor(Math.random() * 4)];
          }
        }
        
        // Get Explanation
        if (responseText.includes('Explanation:')) {
          const explanationSection = responseText.split('Explanation:')[1].trim();
          const explanationLines = explanationSection.split('\n')
            .filter(line => line.trim())
            .map(line => line.trim())
            .join('\n\n');
          sections.explanation = explanationLines;
        }
        
        console.log("Parsed sections:", sections); // For debugging
        
        // Validate parsed content
        if (!sections.word || !sections.definition || sections.sentences.length < 2 || !sections.correctAnswers || !sections.explanation) {
          throw new Error('Failed to parse response correctly');
        }
        
        // Ensure we have at least 4 sentences
        while (sections.sentences.length < 4) {
          sections.sentences.push(`Example sentence ${sections.sentences.length + 1} for ${sections.word}.`);
        }
        
        // Ensure correct answers is an array even if only one value
        if (!Array.isArray(sections.correctAnswers)) {
          sections.correctAnswers = [sections.correctAnswers];
        }
        
        setQuestion({
          word: sections.word,
          definition: sections.definition,
          sentences: sections.sentences,
          correctAnswers: sections.correctAnswers,
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
          // Time's up - mark as incorrect if no answer selected
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
    updateAccuracy(correctCount, incorrectCount + 1);
  };

  // Update accuracy percentage
  const updateAccuracy = (correct, incorrect) => {
    const total = correct + incorrect;
    const newAccuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
    setAccuracy(newAccuracy);
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
          duration: "10 minutes", // You can modify this based on actual game duration
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
    
        // Save both activity and game data
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
    const correct = question.correctAnswers.includes(parseInt(selectedAnswer));
    setIsCorrect(correct);
    setShowResult(true);
    
    // Update score and stats
    if (correct) {
      setCorrectCount(prev => prev + 1);
      const pointsEarned = timerEnabled ? Math.ceil(timeRemaining * 10 / timeLimit) * 10 : 10;
      setScore(prev => prev + pointsEarned);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
    
    // Update accuracy
    updateAccuracy(
      correct ? correctCount + 1 : correctCount,
      correct ? incorrectCount : incorrectCount + 1
    );
  };

  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setShowSettings(false);
    // Reset score and stats
    setScore(0);
    setQuestionCount(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setAccuracy(100);
    setDataSaved(false);
    generateQuestion();
  };

  // Go to settings
  const goToSettings = () => {
    // Save data before changing settings if game was in progress
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
    <Box sx={{ 
      p: { xs: 2, sm: 3 }
    }}>
      <Box sx={{ maxWidth: '1000px', mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h4" sx={{ 
            background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            Word in Context Challenge
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
                Game Settings
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
              Go Back
            </Button>
          </Box>
        </Box>

        {/* Score display when game has started */}
        {gameStarted && (
          <Paper sx={{
            p: 2,
            mb: 2,
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(124, 58, 237, 0.1)',
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon sx={{ color: '#FFD700' }} />
                  <Typography variant="h6" sx={{ color: '#A78BFA' }}>
                    Score: {score}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: '#4ade80', fontSize: 20 }} />
                  <Typography sx={{ color: '#A78BFA' }}>
                    Correct: {correctCount}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon sx={{ color: '#f87171', fontSize: 20 }} />
                  <Typography sx={{ color: '#A78BFA' }}>
                    Wrong: {incorrectCount}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
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

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {showSettings ? (
            <Paper sx={{
              p: 4,
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
                  <Grid item xs={4}>
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
                  <Grid item xs={4}>
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
                  <Grid item xs={4}>
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
                    <Box
                      sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2
                      }}
                    >
                      {[5, 10, 15, 20, 30].map((time) => (
                        <Button
                          key={time}
                          variant={timeLimit === time ? "contained" : "outlined"}
                          onClick={() => setTimeLimit(time)}
                          sx={{
                            flex: 1,
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
                      ))}
                    </Box>
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
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  flexDirection: 'column',
                  height: '300px' 
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
                </Box>
              ) : error ? (
                <Paper sx={{
                  p: 4,
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" sx={{ color: '#f87171', mb: 2 }}>
                    Error Loading Question
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
                        p: 3,
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(124, 58, 237, 0.1)',
                        mb: 2
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 2 
                        }}>
                          <Typography variant="h6" sx={{ color: '#A78BFA' }}>
                            Word in Context
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: '#A78BFA', 
                              mb: 1,
                              fontWeight: 'bold'
                            }}
                          >
                            {question.word}
                          </Typography>
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
                        >
                          {question.sentences.map((sentence, index) => (
                            <FormControlLabel
                              key={index}
                              value={index.toString()}
                              disabled={showResult}
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
                                <Box sx={{ 
                                  py: 1, 
                                  position: 'relative',
                                  ...(showResult && {
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      top: 0,
                                      left: -10,
                                      right: -10,
                                      bottom: 0,
                                      background: question.correctAnswers.includes(index) 
                                        ? 'rgba(34, 197, 94, 0.1)'
                                        : index.toString() === selectedAnswer
                                          ? 'rgba(239, 68, 68, 0.1)'
                                          : 'transparent',
                                      borderRadius: 1,
                                      zIndex: -1,
                                    }
                                  })
                                }}>
                                  <Typography sx={{ color: 'white' }}>
                                    {sentence}
                                    {showResult && question.correctAnswers.includes(index) && (
                                      <CheckCircleIcon sx={{ ml: 1, color: '#4ade80', fontSize: 18, verticalAlign: 'middle' }} />
                                    )}
                                    {showResult && !question.correctAnswers.includes(index) && index.toString() === selectedAnswer && (
                                      <CancelIcon sx={{ ml: 1, color: '#f87171', fontSize: 18, verticalAlign: 'middle' }} />
                                    )}
                                  </Typography>
                                </Box>
                              }
                            />
                          ))}
                        </RadioGroup>
                        
                        {!showResult ? (
                          <Button
                            variant="contained"
                            onClick={handleAnswerSubmit}
                            disabled={selectedAnswer === ''}
                            sx={{
                              mt: 3,
                              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                              '&.Mui-disabled': {
                                background: 'rgba(124, 58, 237, 0.3)',
                                color: 'rgba(255, 255, 255, 0.5)'
                              }
                            }}
                          >
                            Submit Answer
                          </Button>
                        ) : (
                          <Box sx={{ mt: 3 }}>
                            <Paper sx={{
                              p: 2,
                              background: isCorrect 
                                ? 'rgba(34, 197, 94, 0.1)' 
                                : 'rgba(239, 68, 68, 0.1)',
                              borderLeft: '4px solid',
                              borderColor: isCorrect ? '#4ade80' : '#f87171',
                              mb: 3
                            }}>
                              <Typography variant="subtitle1" sx={{ 
                                color: isCorrect ? '#4ade80' : '#f87171',
                                fontWeight: 'bold',
                                mb: 1
                              }}>
                                {isCorrect ? 'Correct!' : 'Incorrect!'}
                              </Typography>
                              <Typography sx={{ color: 'white' }}>
                                {question.explanation}
                              </Typography>
                            </Paper>
                            
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Button
                                variant="contained"
                                onClick={handleNextQuestion}
                                sx={{
                                  background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                                  flex: 1
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
                        )}
                      </Paper>
                    </motion.div>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default WordContext;