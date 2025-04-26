'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Chip,
  Grid,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { motion } from 'framer-motion';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import WorkIcon from '@mui/icons-material/Work';
import PlaceIcon from '@mui/icons-material/Place';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpIcon from '@mui/icons-material/Help';
import { getDatabase, ref, push, set } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';

const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const InterviewPractice = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Setup State
  const [activeStep, setActiveStep] = useState(0);
  const [jobRole, setJobRole] = useState('');
  const [jobPlace, setJobPlace] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeLimit, setTimeLimit] = useState(60); // seconds
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);
  
  // Scoring system
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [dataSaved, setDataSaved] = useState(false);

  // Error handling state
  const [error, setError] = useState(null);

  const stepLabels = ['Job Details', 'Interview Setup', 'Practice'];

  // Generate interview questions
  const generateQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // In the generateQuestions function, update the content property in the API request
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
            content: `Generate 5 interview questions for a ${jobRole} position at ${jobPlace || 'a company'}. ${jobDescription ? `The job involves: ${jobDescription}.` : ''}
            MAKE SURE THE OPTIONS DIFFER, DO NOT MAKE 3 CONSICUTIVE OPTIONS BE SAME
            Format EXACTLY as follows:
            [
              {
                "question": "Question text goes here?",
                "options": {
                  "A": "First answer option",
                  "B": "Second answer option"
                },
                "correctOption": "CORRECT_OPTION_FROM_A_OR_B",
                "explanation": "Detailed explanation of why the correct answer is best."
              },
              ... (4 more similar question objects but with different correct options)
            ]
            
            Important rules:
            - Questions should assess professional knowledge relevant to the ${jobRole} position
            - Questions should be realistic for an actual job interview
            - Questions should vary in difficulty and cover different aspects of the role
            - Make both options plausible but ensure one is clearly better
            - The explanation should be thorough and educational
            - The response MUST be valid JSON format
            - IMPORTANT: Alternate the correct answer between A and B in a random pattern
            - Each question must have exactly 2 options labeled A and B`
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
        // Parse the JSON response
        let parsedQuestions = JSON.parse(responseText);
        
        // Validate structure
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
          throw new Error('Response does not contain an array of questions');
        }
        
        // Process questions to ensure consistent format
        const processedQuestions = parsedQuestions.map((q, index) => {
          // Make sure all required fields exist
          if (!q.question || !q.options || !q.correctOption || !q.explanation) {
            throw new Error(`Question ${index + 1} is missing required fields`);
          }
          
          return {
            id: index + 1,
            question: q.question,
            options: {
              A: q.options.A || "Option A",
              B: q.options.B || "Option B"
            },
            correctOption: q.correctOption,
            explanation: q.explanation,
            answered: false,
            isCorrect: null
          };
        });
        
        setQuestions(processedQuestions);
        setCurrentQuestionIndex(0);
        
        if (timerEnabled) {
          startTimer();
        }
        
        setGameStarted(true);
        setActiveStep(2); // Move to interview practice step
      } catch (parseError) {
        console.error('Parsing error:', parseError);
        throw new Error(`Failed to parse response: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to load questions: ${error.message}`);
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
    const currentQuestion = questions[currentQuestionIndex];
    
    // Mark question as answered and incorrect if no answer was selected
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      answered: true,
      isCorrect: false
    };
    
    setQuestions(updatedQuestions);
    setShowResult(true);
    setIncorrectCount(prev => prev + 1);
    
    // Update accuracy
    updateAccuracy(correctCount, incorrectCount + 1);
  };

  // Update accuracy percentage
  const updateAccuracy = (correct, incorrect) => {
    const total = correct + incorrect;
    const newAccuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
    setAccuracy(newAccuracy);
  };

  // Handle answer selection
  const handleAnswerChange = (event) => {
    setSelectedAnswer(event.target.value);
  };

  // Save game data to Firebase
  const saveGameData = () => {
    if (currentUser && questions.length > 0 && !dataSaved) {
      try {
        const database = getDatabase();
        const timestamp = Date.now();
        
        // Create activity data
        const activityData = {
          date: new Date().toISOString(),
          description: `Completed interview practice for ${jobRole} role with score: ${score}`,
          duration: "15 minutes", // Approximate duration
          id: `interview_${new Date().toISOString()}_${score}`,
          score: score,
          type: "Interview Practice"
        };
    
        // Save to history/activities
        const historyRef = ref(
          database,
          `users/${currentUser.uid}/history/data/${timestamp}/activities/0`
        );
    
        // Save detailed game data
        const interviewRef = ref(
          database,
          `users/${currentUser.uid}/interview-practice/${timestamp}`
        );
    
        // Save both activity and game data
        Promise.all([
          set(historyRef, activityData),
          push(interviewRef, {
            time: new Date().toISOString(),
            jobRole: jobRole,
            jobPlace: jobPlace,
            correctCount: correctCount,
            incorrectCount: incorrectCount,
            score: score,
            accuracy: accuracy,
            questions: questions.map(q => ({
              question: q.question,
              correct: q.isCorrect,
              correctOption: q.correctOption
            }))
          })
        ])
          .then(() => {
            console.log('Interview data and activity saved successfully');
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
    
    if (!selectedAnswer) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctOption;
    
    // Update question status
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      answered: true,
      isCorrect: isCorrect,
      selectedAnswer: selectedAnswer
    };
    
    setQuestions(updatedQuestions);
    setShowResult(true);
    
    // Update score and stats
    const pointsEarned = timerEnabled 
      ? Math.ceil(timeRemaining * 5 / timeLimit) * 20
      : 20;
    
    if (isCorrect) {
      setScore(prev => prev + pointsEarned);
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
    
    // Update accuracy
    updateAccuracy(
      correctCount + (isCorrect ? 1 : 0),
      incorrectCount + (isCorrect ? 0 : 1)
    );
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowResult(false);
      setSelectedAnswer('');
      
      if (timerEnabled) {
        startTimer();
      }
    } else {
      // All questions completed
      saveGameData();
    }
  };

  // Finish practice
  const handleFinishPractice = () => {
    saveGameData();
    navigate('/practice');
  };

  // Retry loading questions if there was an error
  const retryQuestions = () => {
    generateQuestions();
  };

  // Handle next step in the interview setup process
  const handleNextStep = () => {
    if (activeStep === 0) {
      if (!jobRole.trim()) {
        setError('Please enter a job role to continue');
        return;
      }
      setError(null);
    }
    
    if (activeStep === 1) {
      generateQuestions();
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Handle going back a step
  const handleBackStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Reset the form
  const handleReset = () => {
    setActiveStep(0);
    setJobRole('');
    setJobPlace('');
    setJobDescription('');
    setGameStarted(false);
    setQuestions([]);
    setSelectedAnswer('');
    setShowResult(false);
    setScore(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setAccuracy(100);
    setDataSaved(false);
    stopTimer();
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

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
            Interview Practice
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/practice')}
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
                    Progress:
                  </Typography>
                  <Chip 
                    label={`${currentQuestionIndex + 1}/${questions.length}`} 
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(124, 58, 237, 0.2)',
                      color: '#A78BFA'
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Paper sx={{
            p: { xs: 2, sm: 4 },
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(124, 58, 237, 0.1)',
          }}>
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel
              sx={{ 
                mb: 4,
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#7C3AED', 
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#7C3AED',
                },
                '& .MuiStepLabel-label': {
                  color: '#A78BFA',
                }
              }}
            >
              {stepLabels.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Box sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: '#f87171'
              }}>
                {error}
              </Box>
            )}

            {activeStep === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h6" sx={{ color: '#A78BFA', mb: 3 }}>
                  Tell us about the job you're interviewing for
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Job Role"
                      variant="outlined"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      required
                      InputProps={{
                        startAdornment: <WorkIcon sx={{ color: '#A78BFA', mr: 1 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(124, 58, 237, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(124, 58, 237, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#7C3AED',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#A78BFA',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Company/Organization (Optional)"
                      variant="outlined"
                      value={jobPlace}
                      onChange={(e) => setJobPlace(e.target.value)}
                      InputProps={{
                        startAdornment: <PlaceIcon sx={{ color: '#A78BFA', mr: 1 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(124, 58, 237, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(124, 58, 237, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#7C3AED',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#A78BFA',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Job Description (Optional)"
                      variant="outlined"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      multiline
                      rows={4}
                      InputProps={{
                        startAdornment: <DescriptionIcon sx={{ color: '#A78BFA', mr: 1, alignSelf: 'flex-start', mt: 1 }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(124, 58, 237, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(124, 58, 237, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#7C3AED',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#A78BFA',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </motion.div>
            )}

            {activeStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h6" sx={{ color: '#A78BFA', mb: 3 }}>
                  Interview Settings
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{ 
                      p: 3, 
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(124, 58, 237, 0.1)',
                    }}>
                      <Typography variant="subtitle1" sx={{ color: '#A78BFA', mb: 2 }}>
                        Timer Settings
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimerIcon sx={{ color: '#A78BFA', mr: 1 }} />
                          <Typography sx={{ color: 'white' }}>
                            Enable Timer
                          </Typography>
                          <Tooltip title="Timer challenges you to answer within the time limit. Faster responses earn more points.">
                            <InfoIcon sx={{ color: '#A78BFA', ml: 1, fontSize: 18 }} />
                          </Tooltip>
                        </Box>
                        
                        <FormControlLabel
                          control={
                            <Radio
                              checked={timerEnabled}
                              onChange={() => setTimerEnabled(true)}
                              sx={{
                                color: '#A78BFA',
                                '&.Mui-checked': {
                                  color: '#7C3AED',
                                },
                              }}
                            />
                          }
                          label="Yes"
                          sx={{ color: 'white' }}
                        />
                        
                        <FormControlLabel
                          control={
                            <Radio
                              checked={!timerEnabled}
                              onChange={() => setTimerEnabled(false)}
                              sx={{
                                color: '#A78BFA',
                                '&.Mui-checked': {
                                  color: '#7C3AED',
                                },
                              }}
                            />
                          }
                          label="No"
                          sx={{ color: 'white' }}
                        />
                      </Box>
                      
                      {timerEnabled && (
                        <Box sx={{ mt: 2 }}>
                          <Typography sx={{ color: 'white', mb: 1 }}>
                            Time per question: {timeLimit} seconds
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setTimeLimit(30)}
                                sx={{
                                  borderColor: timeLimit === 30 ? '#7C3AED' : 'rgba(124, 58, 237, 0.4)',
                                  color: timeLimit === 30 ? '#7C3AED' : '#A78BFA',
                                  backgroundColor: timeLimit === 30 ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                  '&:hover': {
                                    borderColor: '#7C3AED',
                                    background: 'rgba(124, 58, 237, 0.1)',
                                  }
                                }}
                              >
                                30s (Fast)
                              </Button>
                            </Grid>
                            <Grid item xs={4}>
                              <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setTimeLimit(60)}
                                sx={{
                                  borderColor: timeLimit === 60 ? '#7C3AED' : 'rgba(124, 58, 237, 0.4)',
                                  color: timeLimit === 60 ? '#7C3AED' : '#A78BFA',
                                  backgroundColor: timeLimit === 60 ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                  '&:hover': {
                                    borderColor: '#7C3AED',
                                    background: 'rgba(124, 58, 237, 0.1)',
                                  }
                                }}
                              >
                                60s (Standard)
                              </Button>
                            </Grid>
                            <Grid item xs={4}>
                              <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setTimeLimit(90)}
                                sx={{
                                  borderColor: timeLimit === 90 ? '#7C3AED' : 'rgba(124, 58, 237, 0.4)',
                                  color: timeLimit === 90 ? '#7C3AED' : '#A78BFA',
                                  backgroundColor: timeLimit === 90 ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                  '&:hover': {
                                    borderColor: '#7C3AED',
                                    background: 'rgba(124, 58, 237, 0.1)',
                                  }
                                }}
                              >
                                90s (Relaxed)
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ 
                      p: 3, 
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(124, 58, 237, 0.1)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <InfoIcon sx={{ color: '#A78BFA', mr: 1, mt: 0.5 }} />
                        <Typography sx={{ color: 'white' }}>
                          We'll generate 5 interview questions based on the job role you provided. Each question will have two answer options - choose the one that best demonstrates professional knowledge and interview skills.
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HelpIcon sx={{ color: '#A78BFA', mr: 1 }} />
                        <Typography sx={{ color: '#A78BFA', fontWeight: 'bold' }}>
                          Ready to practice interview questions for: {jobRole} {jobPlace ? `at ${jobPlace}` : ''}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </motion.div>
            )}

            {activeStep === 2 && (
              <>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <CircularProgress sx={{ color: '#7C3AED' }} />
                    <Typography sx={{ ml: 2, color: '#A78BFA' }}>
                      Generating interview questions...
                    </Typography>
                  </Box>
                ) : error ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: '#f87171', mb: 2 }}>
                      Error: {error}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={retryQuestions}
                      sx={{
                        borderColor: 'rgba(124, 58, 237, 0.4)',
                        color: '#A78BFA',
                        '&:hover': {
                          borderColor: '#7C3AED',
                          background: 'rgba(124, 58, 237, 0.1)',
                        }
                      }}
                    >
                      Try Again
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {questions.length > 0 && (
                      <motion.div
                        key={currentQuestionIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Chip 
                              label={`Question ${currentQuestionIndex + 1}/${questions.length}`} 
                              sx={{ 
                                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                                color: '#A78BFA'
                              }}
                            />
                            
                            {timerEnabled && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TimerIcon sx={{ color: '#A78BFA', mr: 1 }} />
                                <Typography sx={{ 
                                  color: timeRemaining < 10 ? '#f87171' : '#A78BFA',
                                  fontWeight: timeRemaining < 10 ? 'bold' : 'normal'
                                }}>
                                  {timeRemaining}s
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                            {currentQuestion.question}
                          </Typography>
                          
                          <RadioGroup
                            value={selectedAnswer}
                            onChange={handleAnswerChange}
                            sx={{ mb: 3 }}
                          >
                            {Object.entries(currentQuestion.options).map(([key, value]) => (
                              <Paper
                                key={key}
                                sx={{ 
                                  mb: 2, 
                                  p: 2,
                                  background: selectedAnswer === key ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                                  border: selectedAnswer === key ? '1px solid #7C3AED' : '1px solid rgba(124, 58, 237, 0.1)',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    background: 'rgba(124, 58, 237, 0.1)',
                                  }
                                }}
                                onClick={() => setSelectedAnswer(key)}
                              >
                                <FormControlLabel
                                  value={key}
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
                                    <Typography sx={{ color: 'white' }}>
                                      {key}: {value}
                                    </Typography>
                                  }
                                  sx={{ width: '100%', margin: 0 }}
                                />
                              </Paper>
                            ))}
                          </RadioGroup>
                          
                          {!showResult ? (
                            <Button
                              variant="contained"
                              onClick={handleAnswerSubmit}
                              disabled={!selectedAnswer}
                              fullWidth
                              sx={{
                                backgroundColor: '#7C3AED',
                                '&:hover': {
                                  backgroundColor: '#6D28D9',
                                },
                                '&.Mui-disabled': {
                                  backgroundColor: 'rgba(124, 58, 237, 0.3)',
                                }
                              }}
                            >
                              Submit Answer
                            </Button>
                          ) : (
                            <>
                              <Paper sx={{ 
                                p: 3, 
                                mb: 3,
                                background: currentQuestion.isCorrect ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                border: currentQuestion.isCorrect ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)',
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                  {currentQuestion.isCorrect ? (
                                    <CheckCircleIcon sx={{ color: '#4ade80', mr: 1 }} />
                                  ) : (
                                    <CancelIcon sx={{ color: '#f87171', mr: 1 }} />
                                  )}
                                  <Typography sx={{ 
                                    color: currentQuestion.isCorrect ? '#4ade80' : '#f87171',
                                    fontWeight: 'bold'
                                  }}>
                                    {currentQuestion.isCorrect ? 'Correct!' : 'Incorrect'}
                                  </Typography>
                                </Box>
                                
                                <Typography sx={{ color: 'white', mb: 2 }}>
                                  Correct answer: Option {currentQuestion.correctOption}
                                </Typography>
                                
                                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                                
                                <Typography sx={{ color: '#A78BFA', fontWeight: 'bold', mb: 1 }}>
                                  Explanation:
                                </Typography>
                                <Typography sx={{ color: 'white' }}>
                                  {currentQuestion.explanation}
                                </Typography>
                              </Paper>
                              
                              {currentQuestionIndex < questions.length - 1 ? (
                                <Button
                                  variant="contained"
                                  onClick={handleNextQuestion}
                                  fullWidth
                                  sx={{
                                    backgroundColor: '#7C3AED',
                                    '&:hover': {
                                      backgroundColor: '#6D28D9',
                                    }
                                  }}
                                >
                                  Next Question
                                </Button>
                              ) : (
                                <Box>
                                  <Typography variant="h6" sx={{ color: '#A78BFA', mb: 2, textAlign: 'center' }}>
                                    Practice Complete!
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    <Button
                                      variant="contained"
                                      onClick={handleReset}
                                      sx={{
                                        backgroundColor: '#7C3AED',
                                        '&:hover': {
                                          backgroundColor: '#6D28D9',
                                        }
                                      }}
                                    >
                                      Start New Practice
                                    </Button>
                                    
                                    <Button
                                      variant="outlined"
                                      onClick={handleFinishPractice}
                                      sx={{
                                        borderColor: 'rgba(124, 58, 237, 0.4)',
                                        color: '#A78BFA',
                                        '&:hover': {
                                          borderColor: '#7C3AED',
                                          background: 'rgba(124, 58, 237, 0.1)',
                                        }
                                      }}
                                    >
                                      Return to Practice Hub
                                    </Button>
                                  </Box>
                                </Box>
                              )}
                            </>
                          )}
                        </Box>
                      </motion.div>
                    )}
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>

        {/* Navigation buttons for steps */}
        {(activeStep < 2 || !gameStarted) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBackStep}
              disabled={activeStep === 0}
              sx={{
                borderColor: 'rgba(124, 58, 237, 0.4)',
                color: '#A78BFA',
                '&:hover': {
                  borderColor: '#7C3AED',
                  background: 'rgba(124, 58, 237, 0.1)',
                },
                '&.Mui-disabled': {
                  borderColor: 'rgba(124, 58, 237, 0.1)',
                  color: 'rgba(167, 139, 250, 0.3)',
                }
              }}
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={handleNextStep}
              sx={{
                backgroundColor: '#7C3AED',
                '&:hover': {
                  backgroundColor: '#6D28D9',
                }
              }}
            >
              {activeStep === 1 ? 'Generate Questions' : 'Next'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InterviewPractice;