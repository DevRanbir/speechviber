import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Stack, 
  CircularProgress, 
  TextField, 
  Snackbar, 
  Alert, 
  IconButton, 
  useMediaQuery,
  Container,
  Divider,
  Card,
  CardContent,
  Chip,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import ReplayIcon from '@mui/icons-material/Replay';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

// Updated API configuration to use Groq
const API_KEY = "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"; 
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
import { db } from '../../firebase/config';
import { getDatabase, ref, push, serverTimestamp } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';

const Chatbox = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [stats, setStats] = useState({ total: 0, correct: 0, incorrect: 0 });
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [dataSaved, setDataSaved] = useState(false);

  // Enhanced question generation with proper error handling and retry mechanism
  const generateQuestion = useCallback(async (retryCount = 0) => {
    if (retryCount > 3) {
      setError("Failed to generate a valid question after multiple attempts. Please try again later.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const difficultyPrompts = {
        easy: 'Generate a simple and short conversational question with straightforward options.',
        medium: 'Generate a detailed scenario-based question that requires careful consideration.',
        hard: 'Generate a complex question that tests advanced interpersonal or problem-solving skills.',
        random: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
      };
      
      const selectedDifficulty = difficulty === 'random' 
        ? difficultyPrompts.random 
        : difficulty;
      
      const difficultyPrompt = difficultyPrompts[selectedDifficulty];

      const basePrompt = `For a ${jobRole} position with the following description: ${jobDescription}. 
      ${typeof difficultyPrompt === 'string' ? difficultyPrompt : difficultyPrompts[difficultyPrompt]}
      
      Generate a unique and diverse conversational interview question that focuses on one of these randomly selected areas:
      1. Problem-solving approach
      2. Leadership and team management
      3. Conflict resolution
      4. Time management and prioritization
      5. Adaptability and change management
      6. Client/stakeholder communication
      7. Decision-making process
      8. Innovation and creativity
      9. Work-life balance
      10. Project management
      11. Cultural fit and values
      12. Career goals and motivation
      
      Format the response as a SINGLE JSON OBJECT with these exact properties:
      {
        "question": "Your question text here",
        "options": ["Option A", "Option B"],
        "correctAnswer": 0 or 1,
        "explanation": "Explanation of why the correct answer is better"
      }
      
      DO NOT return an array of questions. Return only ONE question as a single JSON object.
      
      Make sure:
      - The question is specific and situational
      - The options present realistic but contrasting approaches
      - The question is relevant to the ${jobRole} position
      - The options are challenging to distinguish between for a ${selectedDifficulty} level question
      - Both options should sound plausible but one should be more effective for the given scenario`;

      // Updated API call to use Groq
      const response = await axios.post(API_URL, {
        model: "gemma2-9b-it",
        messages: [{ role: "user", content: basePrompt }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      // Updated response parsing for Groq API format
      let generatedContent = response.data.choices[0].message.content;
      
      // Clean the response by removing markdown formatting
      generatedContent = generatedContent.replace(/```json\n|```/g, '').trim();
      
      try {
        // Check if the response is an array and extract the first item if it is
        let parsedQuestion;
        
        try {
          const parsed = JSON.parse(generatedContent);
          // If it's an array, take the first element
          if (Array.isArray(parsed)) {
            console.log("Received an array of questions, using the first one:", parsed);
            parsedQuestion = parsed[0];
          } else {
            parsedQuestion = parsed;
          }
        } catch (initialParseError) {
          // Sometimes the API returns an array-like string but not valid JSON
          // Try to extract a valid JSON object
          const jsonObjectMatch = generatedContent.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            parsedQuestion = JSON.parse(jsonObjectMatch[0]);
          } else {
            throw new Error('Could not extract valid JSON from response');
          }
        }
        
        // Validate the parsed response
        if (!parsedQuestion || 
            !parsedQuestion.question || 
            !Array.isArray(parsedQuestion.options) || 
            parsedQuestion.options.length !== 2 || 
            typeof parsedQuestion.correctAnswer !== 'number' ||
            parsedQuestion.correctAnswer < 0 || 
            parsedQuestion.correctAnswer > 1 ||
            !parsedQuestion.explanation) {
          console.error('Invalid question format:', parsedQuestion);
          throw new Error('Missing required fields in API response');
        }
        
        setCurrentQuestion(parsedQuestion.question);
        setOptions(parsedQuestion.options);
        setCurrentCorrectAnswer(parsedQuestion.correctAnswer);
        setFeedback(parsedQuestion.explanation);
        setLoading(false);
        
        // Add to question history
        setQuestionHistory(prev => [...prev, parsedQuestion]);
      } catch (parseError) {
        console.error('Error parsing API response:', parseError, generatedContent);
        // Retry with backoff
        setTimeout(() => generateQuestion(retryCount + 1), 1000 * (retryCount + 1));
      }
    } catch (apiError) {
      console.error('API error generating question:', apiError);
      setError("Failed to connect to the question generation service. Please check your connection and try again.");
      setLoading(false);
    }
  }, [jobRole, jobDescription, difficulty]);


  // Start interview with validation
  const handleStartInterview = () => {
    if (!jobRole.trim()) {
      setError("Please enter a job role");
      return;
    }
    
    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }
    
    setIsInterviewStarted(true);
    setStats({ total: 0, correct: 0, incorrect: 0 });
    setQuestionHistory([]);
    setDataSaved(false);
    generateQuestion();
  };

  // Handle answer selection with feedback
  const handleAnswer = (selectedIndex) => {
    setSelectedAnswer(selectedIndex);
    
    const isCorrect = selectedIndex === currentCorrectAnswer;
    const newStats = {
      total: stats.total + 1,
      correct: stats.correct + (isCorrect ? 1 : 0),
      incorrect: stats.incorrect + (isCorrect ? 0 : 1)
    };
    
    setStats(newStats);
    
    // Delay before next question to show feedback
    setTimeout(() => {
      setSelectedAnswer(null);
      setFeedback(null);
      generateQuestion();
    }, 3000);
  };

  // Handle finishing the interview
  const handleFinishInterview = () => {
    // Save final MCQ challenge data to Firebase when finishing
    if (currentUser && stats.total > 0 && !dataSaved) {
      try {
        const database = getDatabase();
        const mcqChallengeData = {
          time: new Date().toISOString(),
          attemptedQuestions: stats.total,
          score: Math.round((stats.correct / stats.total) * 100) || 0,
          jobRole: jobRole,
          difficulty: difficulty
        };

        const mcqChallengeRef = ref(
          database, 
          `users/${currentUser.uid}/mcq-challenges/${Date.now()}`
        );
        
        push(mcqChallengeRef, mcqChallengeData)
          .then(() => {
            console.log('MCQ challenge data saved successfully');
            setDataSaved(true);
          })
          .catch(error => console.error('Error saving MCQ challenge data:', error));
      } catch (error) {
        console.error('Error saving to database:', error);
      }
    }
    
    setShowSummary(true);
  };

  // Reset the interview
  const handleReset = () => {
    // Save MCQ challenge data when resetting if questions were answered
    if (currentUser && stats.total > 0 && !dataSaved) {
      try {
        const database = getDatabase();
        const mcqChallengeData = {
          time: new Date().toISOString(),
          attemptedQuestions: stats.total,
          score: Math.round((stats.correct / stats.total) * 100) || 0,
          jobRole: jobRole,
          difficulty: difficulty
        };

        const mcqChallengeRef = ref(
          database, 
          `users/${currentUser.uid}/mcq-challenges/${Date.now()}`
        );
        
        push(mcqChallengeRef, mcqChallengeData)
          .then(() => {
            console.log('MCQ challenge data saved on reset');
            setDataSaved(true);
          })
          .catch(error => console.error('Error saving MCQ challenge data:', error));
      } catch (error) {
        console.error('Error saving to database:', error);
      }
    }
    
    setIsInterviewStarted(false);
    setCurrentQuestion(null);
    setOptions([]);
    setSelectedAnswer(null);
    setStats({ total: 0, correct: 0, incorrect: 0 });
    setError(null);
    setFeedback(null);
    setIsReviewing(false);
    setShowSummary(false);
    setDataSaved(false);
  };

  // Toggle review mode
  const handleToggleReview = () => {
    setIsReviewing(!isReviewing);
  };

  // Navigation functions
  const goBack = () => {
    navigate('/practice');
  };

  const exitToPractice = () => {
    navigate('/practice');
  };

  const handleBackToQuestions = () => {
    setShowSummary(false);
  };

  // Setup screen
  if (!isInterviewStarted) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 4 }, 
            borderRadius: 2,
            position: 'relative'
          }}
        >
          <Button
            onClick={goBack}
            startIcon={<ArrowBackIcon />}
            sx={{
              position: 'absolute',
              right: { xs: 8, sm: 16 },
              top: { xs: 8, sm: 16 },
              color: 'primary.main',
            }}
          >
            Back
          </Button>
          
          <Box sx={{ pt: { xs: 4, sm: 2 } }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 500 }}>
              Interview Practice Setup
            </Typography>
            
            <Stack spacing={3}>
              <TextField
                label="Job Role"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                fullWidth
                required
                error={!!error && !jobRole.trim()}
                helperText={error && !jobRole.trim() ? "Job role is required" : ""}
                placeholder="e.g., Project Manager, Software Engineer, Marketing Specialist"
                variant="outlined"
                InputProps={{
                  sx: { borderRadius: 1.5 }
                }}
              />
              
              <TextField
                label="Job Description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                multiline
                rows={4}
                fullWidth
                required
                error={!!error && !jobDescription.trim()}
                helperText={error && !jobDescription.trim() ? "Job description is required" : "Please include key responsibilities and skills"}
                placeholder="Enter the job description or key responsibilities..."
                variant="outlined"
                InputProps={{
                  sx: { borderRadius: 1.5 }
                }}
              />
              
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                  Question Difficulty
                </Typography>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2}
                  sx={{ mt: 1 }}
                >
                  {['easy', 'medium', 'hard', 'random'].map((level) => (
                    <Button
                      key={level}
                      variant={difficulty === level ? 'contained' : 'outlined'}
                      onClick={() => setDifficulty(level)}
                      sx={{ 
                        flex: 1, 
                        textTransform: 'capitalize',
                        py: 1.5,
                        borderRadius: 1.5
                      }}
                    >
                      {level}
                    </Button>
                  ))}
                </Stack>
              </Box>
              
              <Button
                variant="contained"
                onClick={handleStartInterview}
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 3, 
                  py: 1.5, 
                  borderRadius: 1.5,
                  fontSize: '1rem'
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Start Interview"}
              </Button>
            </Stack>
          </Box>
        </Paper>
        
        {error && (
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setError(null)} 
              severity="error" 
              sx={{ width: '100%', borderRadius: 1.5 }}
              variant="filled"
            >
              {error}
            </Alert>
          </Snackbar>
        )}
      </Container>
    );
  }

  // Review mode
  if (isReviewing) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <HistoryIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={500}>
              Question Review
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            mb: 3,
            gap: 2
          }}>
            <Button 
              variant="outlined" 
              onClick={handleToggleReview}
              startIcon={<ArrowBackIcon />}
              fullWidth={isMobile}
            >
              Return to Interview
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleReset}
              startIcon={<ReplayIcon />}
              fullWidth={isMobile}
            >
              Reset Interview
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {questionHistory.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              my: 8, 
              p: 4, 
              bgcolor: 'background.default',
              borderRadius: 2
            }}>
              <Typography variant="body1">
                No questions have been answered yet.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {questionHistory.map((item, index) => (
                <Card key={index} sx={{ borderRadius: 2, mb: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={`Question ${index + 1}`} 
                        color="primary" 
                        size="small" 
                        sx={{ mr: 1.5, fontWeight: 500 }}
                      />
                    </Box>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mb: 3, 
                        fontSize: '1.05rem',
                        fontWeight: 500
                      }}
                    >
                      {item.question}
                    </Typography>
                    
                    <Stack spacing={2} sx={{ mb: 3 }}>
                      {item.options.map((option, optIndex) => (
                        <Paper 
                          key={optIndex}
                          elevation={1}
                          sx={{ 
                            p: 2, 
                            borderRadius: 1.5,
                            border: '1px solid',
                            bgcolor: optIndex === item.correctAnswer ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
                            borderColor: optIndex === item.correctAnswer ? '#2196f3' : 'divider',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            {optIndex === item.correctAnswer && (
                              <CheckCircleIcon 
                                sx={{ 
                                  color: '#2196f3', 
                                  mr: 1.5,
                                  fontSize: 20,
                                  mt: '3px'
                                }}
                              />
                            )}
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {option}
                              {optIndex === item.correctAnswer && (
                                <Typography 
                                  component="span" 
                                  sx={{ 
                                    ml: 1, 
                                    color: 'text.secondary', 
                                    fontWeight: 'bold' 
                                  }}
                                >
                                  (Correct)
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                    
                    <Box sx={{ 
                      bgcolor: 'background.default', 
                      p: 2, 
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Explanation:
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {item.explanation}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Paper>
      </Container>
    );
  }

  // Summary view
  if (showSummary) {
    const correctPercentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    
    // Calculate skill ratings based on performance
    const skillRatings = {
      problemSolving: Math.min(5, Math.max(1, Math.round(correctPercentage / 20))),
      criticalThinking: Math.min(5, Math.max(1, Math.round((correctPercentage + 10) / 20))),
      decisionMaking: Math.min(5, Math.max(1, Math.round((correctPercentage - 5) / 20))),
      communication: Math.min(5, Math.max(1, Math.round((correctPercentage + 5) / 20))),
    };
    
    const getScoreColor = (score) => {
      if (score >= 70) return 'success.main';
      if (score >= 40) return 'warning.main';
      return 'error.main';
    };
    
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <BarChartIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={500}>
              Performance Summary
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            mb: 3,
            gap: 2
          }}>
            <Button 
              variant="outlined" 
              onClick={handleBackToQuestions}
              startIcon={<ArrowBackIcon />}
              fullWidth={isMobile}
            >
              Back to Questions
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleToggleReview}
              startIcon={<HistoryIcon />}
              fullWidth={isMobile}
            >
              Review Questions
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleReset}
              startIcon={<ReplayIcon />}
              fullWidth={isMobile}
            >
              New Interview
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Card 
            elevation={2} 
            sx={{ 
              mb: 4, 
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              p: 1.5, 
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle1" fontWeight={500}>
                Your Results
              </Typography>
            </Box>
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 },
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 2
            }}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 1.5,
                bgcolor: 'background.default',
                borderRadius: 1.5
              }}>
                <Typography variant="h6" fontWeight={500}>{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Questions</Typography>
              </Box>
              
              <Box sx={{ 
                textAlign: 'center', 
                p: 1.5,
                bgcolor: 'background.default', 
                borderRadius: 1.5
              }}>
                <Typography variant="h6" color="success.main" fontWeight={500}>{stats.correct}</Typography>
                <Typography variant="body2" color="text.secondary">Correct</Typography>
              </Box>
              
              <Box sx={{ 
                textAlign: 'center', 
                p: 1.5,
                bgcolor: 'background.default',
                borderRadius: 1.5
              }}>
                <Typography variant="h6" color="error.main" fontWeight={500}>{stats.incorrect}</Typography>
                <Typography variant="body2" color="text.secondary">Incorrect</Typography>
              </Box>
              
              <Box sx={{ 
                textAlign: 'center', 
                p: 1.5,
                bgcolor: 'background.default',
                borderRadius: 1.5
              }}>
                <Typography 
                  variant="h6" 
                  color={getScoreColor(correctPercentage)} 
                  fontWeight={500}
                >
                  {correctPercentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">Score</Typography>
              </Box>
            </Box>
          </Card>
          
          <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
            Skill Assessment
          </Typography>
          
          <Card elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent>
              <Stack spacing={2.5}>
                {Object.entries(skillRatings).map(([skill, rating]) => (
                  <Box key={skill} sx={{ width: '100%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 1
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textTransform: 'capitalize',
                          fontWeight: 500
                        }}
                      >
                        {skill.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                      >
                        {rating}/5
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      width: '100%',
                      height: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        height: '100%', 
                        width: `${(rating/5) * 100}%`,
                        bgcolor: 'primary.main',
                        borderRadius: 4
                      }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
          
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
            Feedback
          </Typography>
          
          <Card 
            elevation={1} 
            sx={{ 
              mb: 4, 
              borderRadius: 2,
              bgcolor: 'background.default'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {correctPercentage >= 80 ? 
                  `Excellent work! You've demonstrated strong interview skills for the ${jobRole} position. Your responses show good judgment and understanding of the role.` :
                  correctPercentage >= 60 ?
                  `Good job! You've shown solid understanding of the ${jobRole} position requirements. With a bit more practice, you'll excel in your interviews.` :
                  `You've made a good start in preparing for the ${jobRole} position. Continue practicing to improve your interview performance and confidence.`
                }
              </Typography>
            </CardContent>
          </Card>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ 
              mt: 3,
              width: '100%'
            }}
          >
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleToggleReview}
              startIcon={<HistoryIcon />}
              fullWidth
              sx={{ py: 1.2 }}
            >
              Review All Questions
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={exitToPractice}
              startIcon={<ExitToAppIcon />}
              fullWidth
              sx={{ py: 1.2 }}
            >
              Exit to Practice Page
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Main interview screen
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 3 
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: { xs: 2, sm: 0 },
              fontWeight: 500
            }}
          >
            Interview Practice
          </Typography>
          
          <Box sx={{ 
            display: 'flex',
            gap: 1.5
          }}>
            <Button 
              size="small"
              variant="outlined"
              onClick={handleToggleReview}
              startIcon={<HistoryIcon />}
            >
              Review
            </Button>
            <Button 
              size="small"
              variant="outlined"
              color="error"
              onClick={handleReset}
              startIcon={<ReplayIcon />}
            >
              Reset
            </Button>
          </Box>
        </Box>
        
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ 
            mb: 2, 
            flexWrap: 'wrap', 
            gap: 1 
          }}
        >
          <Chip 
            label={`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label={`Correct: ${stats.correct}`} 
            size="small" 
            color="success" 
            variant="outlined"
          />
          <Chip 
            label={`Incorrect: ${stats.incorrect}`} 
            size="small" 
            color="error" 
            variant="outlined"
          />
          <Chip 
            label={`Total: ${stats.total}`} 
            size="small" 
            color="default" 
            variant="outlined"
          />
        </Stack>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexDirection: 'column',
            height: 300 
          }}>
            <CircularProgress size={50} />
            <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
              Generating your next question...
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4, 
                fontSize: '1.125rem',
                fontWeight: 500
              }}
            >
              {currentQuestion}
            </Typography>
            
            <Stack spacing={2} sx={{ mb: 3 }}>
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  fullWidth
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  sx={{
                    p: 2,
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderWidth: 1,
                    borderColor: selectedAnswer === index 
                      ? (index === currentCorrectAnswer ? 'success.main' : 'error.main')
                      : 'divider',
                    backgroundColor: selectedAnswer === index 
                      ? (index === currentCorrectAnswer ? 'rgba(46, 125, 50, 0.04)' : 'rgba(211, 47, 47, 0.04)') 
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: selectedAnswer === null 
                        ? 'rgba(33, 150, 243, 0.04)'
                        : selectedAnswer === index 
                          ? (index === currentCorrectAnswer ? 'rgba(46, 125, 50, 0.04)' : 'rgba(211, 47, 47, 0.04)')
                          : 'transparent',
                      borderColor: selectedAnswer === null 
                        ? 'primary.main'
                        : selectedAnswer === index 
                          ? (index === currentCorrectAnswer ? 'success.main' : 'error.main')
                          : 'divider',
                    },
                    borderRadius: 1.5,
                    fontSize: '1rem',
                    lineHeight: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                    {selectedAnswer === index && (
                      <Box sx={{ mr: 1.5, mt: '2px' }}>
                        {index === currentCorrectAnswer ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    )}
                    <Typography variant="body1">
                      {option}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Stack>
            
            {selectedAnswer !== null && feedback && (
              <Paper 
                elevation={0} 
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: 'background.default',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Feedback:
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {feedback}
                </Typography>
              </Paper>
            )}
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: 4 
            }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<HomeIcon />}
                onClick={exitToPractice}
              >
                Exit
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleFinishInterview}
                disabled={stats.total < 5}
                endIcon={<BarChartIcon />}
              >
                Finish & View Results
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      {error && (
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setError(null)} 
            severity="error" 
            sx={{ width: '100%' }}
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default Chatbox;