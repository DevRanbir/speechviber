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
  TextField,
  Slider,
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

const API_KEY = process.env.REACT_APP_GROQ_API_KEY_2;
const API_URL = process.env.REACT_APP_GROQ_API_URL;

const TongueTwister = () => {
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
  const [questionType, setQuestionType] = useState('both'); // 'homophones', 'homonyms', or 'both'
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLimit, setTimeLimit] = useState(10); // seconds
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);
  
  // Scoring system
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [dataSaved, setDataSaved] = useState(false);
  const [tongueTwisterHistory, setTongueTwisterHistory] = useState([]);
  

  // Error handling state
  const [error, setError] = useState(null);

  // Generate a question
  const generateQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setSelectedAnswer('');
    setShowResult(false);
    setError(null);

    let typeForPrompt = '';
    if (questionType === 'both') {
      // Randomly choose between homophones and homonyms
      typeForPrompt = Math.random() > 0.5 ? 'Homophones' : 'Homonyms';
    } else {
      typeForPrompt = questionType === 'homophones' ? 'Homophones' : 'Homonyms';
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
            content: `Generate a challenging ${typeForPrompt} question. Format exactly as follows:
              Question Type: ${typeForPrompt}
              Question: [challenging question that asks to identify the correct word in a context]
              Options:
              - [option1]
              - [option2]
              Correct Answer: [exact match with one option]
              Explanation: [brief explanation of why this is the correct word and its meaning]
              
              For Homophones: Use words that sound alike but have different spellings and meanings 
              For Homonyms: Use words with the same spelling and pronunciation but different meanings 
              
              Make the question challenging by creating a sentence with a blank space where the word should go, and have the user pick the correct option. Follow every command correctly`
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
        
        // Get Question Type
        if (responseText.includes('Question Type:')) {
          const afterType = responseText.split('Question Type:')[1];
          sections.type = afterType.split('\n')[0].trim();
        }
        
        // Get Question
        if (responseText.includes('Question:')) {
          const afterQuestion = responseText.split('Question:')[1];
          sections.question = afterQuestion.split('\n')[0].trim();
        }
        
        // Get Options
        const options = [];
        if (responseText.includes('Options:')) {
          const optionsSection = responseText.split('Options:')[1].split('Correct Answer:')[0];
          const optionLines = optionsSection.split('\n').filter(line => line.trim().startsWith('-'));
          
          optionLines.forEach(line => {
            const option = line.replace('-', '').trim();
            if (option) options.push(option);
          });
        }
        sections.options = options;
        
        // Get Correct Answer
        if (responseText.includes('Correct Answer:')) {
          const afterCorrect = responseText.split('Correct Answer:')[1];
          sections.correct = afterCorrect.split('\n')[0].trim();
        }
        
        // Get Explanation
        if (responseText.includes('Explanation:')) {
          sections.explanation = responseText.split('Explanation:')[1].trim();
        }
        
        console.log("Parsed sections:", sections); // For debugging
        
        // Validate parsed content
        if (!sections.type || !sections.question || sections.options.length < 2 || !sections.correct || !sections.explanation) {
          throw new Error('Failed to parse response correctly');
        }
        
        // Ensure the correct answer is in the options
        if (!sections.options.includes(sections.correct)) {
          sections.options.push(sections.correct);
        }
        
        // Make sure we have exactly 2 options for this game
        while (sections.options.length > 2) {
          const randomIndex = Math.floor(Math.random() * sections.options.length);
          if (sections.options[randomIndex] !== sections.correct) {
            sections.options.splice(randomIndex, 1);
          }
        }
        
        // Fill with dummy options if we don't have enough
        while (sections.options.length < 2) {
          const dummyOption = `Option ${sections.options.length + 1}`;
          if (!sections.options.includes(dummyOption) && dummyOption !== sections.correct) {
            sections.options.push(dummyOption);
          }
        }
        
        // Shuffle options
        const shuffledOptions = [...sections.options].sort(() => Math.random() - 0.5);
        
        setQuestion({
          type: sections.type,
          question: sections.question,
          options: shuffledOptions,
          correct: sections.correct,
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

  // In the saveGameData function, update the Firebase save section:
  const saveGameData = () => {
    if (currentUser && questionCount > 0 && !dataSaved) {
      try {
        const database = getDatabase();
        const timestamp = Date.now();

        // Create activity data in the standard format
        const activityData = {
          date: new Date().toISOString(),
          description: `Completed Tongue Twister challenge with score: ${score}, Accuracy: ${accuracy}%`,
          duration: 15,
          id: `tonguetwister_${timestamp}_${score}`,
          score: score,
          type: "Tongue Twister",
          completed: true
        };

        // Save to history/activities path
        const historyRef = ref(
          database,
          `users/${currentUser.uid}/history/data/${timestamp}/activities/0`
        );

        // Save both activity data and detailed tongue twister data
        Promise.all([
          set(historyRef, activityData),
          push(ref(database, `users/${currentUser.uid}/tongue-twister/${timestamp}`), {
            time: timestamp,  // Changed to use timestamp directly
            correctCount: correctCount,
            incorrectCount: incorrectCount,
            score: score,
            accuracy: accuracy,
            timerEnabled: timerEnabled,
            timeLimit: timerEnabled ? timeLimit : 0,
            questionType: questionType
          })
        ])
        .then(() => {
          console.log('Tongue Twister data saved successfully');
          setDataSaved(true);
        })
        .catch(error => console.error('Error saving Tongue Twister data:', error));

      } catch (error) {
        console.error('Error saving to database:', error);
      }
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    stopTimer();
    const correct = selectedAnswer === question.correct;
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
            Tongue Twister Challenge
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
                  Question Type:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        background: questionType === 'homophones' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid',
                        borderColor: questionType === 'homophones' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'rgba(124, 58, 237, 0.1)',
                        }
                      }}
                      onClick={() => setQuestionType('homophones')}
                    >
                      <Typography sx={{ color: '#A78BFA' }}>Homophones</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                        Words that sound alike but have different spellings
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        background: questionType === 'homonyms' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid',
                        borderColor: questionType === 'homonyms' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'rgba(124, 58, 237, 0.1)',
                        }
                      }}
                      onClick={() => setQuestionType('homonyms')}
                    >
                      <Typography sx={{ color: '#A78BFA' }}>Homonyms</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                        Words with same spelling but different meanings
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        background: questionType === 'both' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid',
                        borderColor: questionType === 'both' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'rgba(124, 58, 237, 0.1)',
                        }
                      }}
                      onClick={() => setQuestionType('both')}
                    >
                      <Typography sx={{ color: '#A78BFA' }}>Mixed</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                        Both types of questions
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
                    <Slider
                      value={timeLimit}
                      onChange={(e, newValue) => setTimeLimit(newValue)}
                      min={3}
                      max={30}
                      step={1}
                      valueLabelDisplay="auto"
                      sx={{
                        '& .MuiSlider-thumb': {
                          color: '#7C3AED',
                        },
                        '& .MuiSlider-track': {
                          color: '#7C3AED',
                        },
                        '& .MuiSlider-rail': {
                          color: '#475569',
                        },
                      }}
                    />
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
                            {question.type}
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
                        
                        <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
                          {question.question}
                        </Typography>

                        <RadioGroup
                          value={selectedAnswer}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                        >
                          {question.options.map((option, index) => (
                            <FormControlLabel
                              key={index}
                              value={option}
                              disabled={showResult}
                              control={
                                <Radio 
                                  sx={{ 
                                    color: '#A78BFA',
                                    '&.Mui-checked': {
                                      color: showResult && option === question.correct ? '#4ade80' : 
                                            showResult && option === selectedAnswer ? '#f87171' : '#A78BFA'
                                    },
                                  }} 
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography component="span">{option}</Typography>
                                  {showResult && option === question.correct && (
                                    <CheckCircleIcon sx={{ ml: 1, color: '#4ade80', fontSize: 20 }} />
                                  )}
                                  {showResult && option === selectedAnswer && option !== question.correct && (
                                    <CancelIcon sx={{ ml: 1, color: '#f87171', fontSize: 20 }} />
                                  )}
                                </Box>
                              }
                              sx={{
                                mb: 2,
                                p: 1.5,
                                width: '100%',
                                color: showResult && option === question.correct ? '#4ade80' : 
                                      showResult && option === selectedAnswer && option !== question.correct ? '#f87171' : 'white',
                                backgroundColor: showResult && option === question.correct ? 'rgba(34, 197, 94, 0.1)' : 
                                              showResult && option === selectedAnswer && option !== question.correct ? 'rgba(239, 68, 68, 0.1)' : 
                                              'transparent',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: showResult && option === question.correct ? 'rgba(34, 197, 94, 0.3)' : 
                                            showResult && option === selectedAnswer && option !== question.correct ? 'rgba(239, 68, 68, 0.3)' : 
                                            'rgba(124, 58, 237, 0.2)',
                                transition: 'all 0.2s',
                                '&:hover': { 
                                  background: !showResult && 'rgba(124, 58, 237, 0.1)',
                                  borderColor: !showResult && 'rgba(124, 58, 237, 0.4)'
                                }
                              }}
                            />
                          ))}
                        </RadioGroup>

                        {!showResult && (
                          <Button
                            variant="contained"
                            onClick={handleAnswerSubmit}
                            disabled={!selectedAnswer}
                            sx={{
                              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                              mt: 2
                            }}
                          >
                            Check Answer
                          </Button>
                        )}

                        {showResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Box sx={{ 
                              mt: 2, 
                              p: 2, 
                              background: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: isCorrect ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {isCorrect ? (
                                  <>
                                    <CheckCircleIcon sx={{ color: '#4ade80', mr: 1 }} />
                                    <Typography variant="h6" sx={{ color: '#4ade80' }}>
                                      Correct! {timerEnabled ? `+${Math.ceil(timeRemaining * 10 / timeLimit) * 10} points` : '+10 points'}
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <CancelIcon sx={{ color: '#f87171', mr: 1 }} />
                                    <Typography variant="h6" sx={{ color: '#f87171' }}>
                                      Incorrect
                                    </Typography>
                                  </>
                                )}
                              </Box>
                              <Typography sx={{ color: 'white' }}>
                                {question.explanation}
                              </Typography>
                            </Box>
                          </motion.div>
                        )}
                      </Paper>
                    </motion.div>
                  )}
                </>
              )}
            </>
          )}
        </Box>
        
        {/* Footer buttons */}
        {gameStarted && showResult && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 'auto',
            pt: 2
          }}>
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
            <Button
              variant="contained"
              onClick={handleNextQuestion}
              sx={{
                background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                py: 1,
                px: 3
              }}
            >
              Next Question
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TongueTwister;
