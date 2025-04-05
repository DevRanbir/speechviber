import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, Stack, CircularProgress, TextField, Snackbar, Alert, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Updated API configuration to use Groq
const API_KEY = "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"; 
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const Chatbox = () => {
  const navigate = useNavigate();
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
  const [showSummary, setShowSummary] = useState(false); // New state for summary view

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
    generateQuestion();
  };

  // Handle answer selection with feedback
  const handleAnswer = (selectedIndex) => {
    setSelectedAnswer(selectedIndex);
    
    const isCorrect = selectedIndex === currentCorrectAnswer;
    
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));
    
    // Delay before next question to show feedback
    setTimeout(() => {
      setSelectedAnswer(null);
      setFeedback(null);
      generateQuestion();
    }, 3000);
  };

  // Reset the interview
  const handleReset = () => {
    setIsInterviewStarted(false);
    setCurrentQuestion(null);
    setOptions([]);
    setSelectedAnswer(null);
    setStats({ total: 0, correct: 0, incorrect: 0 });
    setError(null);
    setFeedback(null);
    setIsReviewing(false);
  };

  // Toggle review mode
  const handleToggleReview = () => {
    setIsReviewing(!isReviewing);
  };

  // Add goBack function
  const goBack = () => {
    navigate('/practice');
  };

  // Setup screen
  if (!isInterviewStarted) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', position: 'relative' }}>
        <Button
          onClick={goBack}
          startIcon={<ArrowBackIcon />}
          sx={{
            position: 'absolute',
            right: 24,
            top: 24,
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }
          }}
          variant="outlined"
        >
          Go Back
        </Button>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
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
            />
            <Typography variant="subtitle1" gutterBottom>
              Question Difficulty
            </Typography>
            <Stack direction="row" spacing={2}>
              {['easy', 'medium', 'hard', 'random'].map((level) => (
                <Button
                  key={level}
                  variant={difficulty === level ? 'contained' : 'outlined'}
                  onClick={() => setDifficulty(level)}
                  sx={{ flex: 1, textTransform: 'capitalize' }}
                >
                  {level}
                </Button>
              ))}
            </Stack>
            <Button
              variant="contained"
              onClick={handleStartInterview}
              size="large"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Start Interview"}
            </Button>
          </Stack>
        </Paper>
        
        {error && (
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Snackbar>
        )}
      </Box>
    );
  }

  // Review mode
  if (isReviewing) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
            Question Review
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button variant="" onClick={handleToggleReview}>
              Return to Interview
            </Button>
            <Button variant="outlined" color="error" onClick={handleReset}>
              Reset Interview
            </Button>
          </Box>
          
          {questionHistory.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
              No questions have been answered yet.
            </Typography>
          ) : (
            <Stack spacing={4}>
              {questionHistory.map((item, index) => (
                <Paper key={index} elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Question {index + 1}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {item.question}
                  </Typography>
                  
                  // In the Review mode section
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {item.options.map((option, optIndex) => (
                      <Box 
                        key={optIndex}
                        sx={{ 
                          p: 2, 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: optIndex === item.correctAnswer ? '#2196f3' : 'divider',
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {option}
                          {optIndex === item.correctAnswer && (
                            <Typography 
                              component="span" 
                              sx={{ 
                                ml: 1, 
                                color: '#2196f3', 
                                fontWeight: 'bold' 
                              }}
                            >
                              ✓ Correct
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                  
                  <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                    Explanation:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {item.explanation}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    );
  }

  // New function to handle finishing the interview
  const handleFinishInterview = () => {
    setShowSummary(true);
  };

  // New function to go back to questions from summary
  const handleBackToQuestions = () => {
    setShowSummary(false);
  };

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
    
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            Performance Summary
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Button variant="outlined" onClick={handleBackToQuestions}>
              Back to Questions
            </Button>
            <Button variant="outlined" color="error" onClick={handleReset}>
              Start New Interview
            </Button>
          </Box>
          
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h6">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Questions</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h6" color="success.main">{stats.correct}</Typography>
              <Typography variant="body2" color="text.secondary">Correct</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h6" color="error.main">{stats.incorrect}</Typography>
              <Typography variant="body2" color="text.secondary">Incorrect</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h6" color={correctPercentage >= 70 ? 'success.main' : correctPercentage >= 40 ? 'warning.main' : 'error.main'}>
                {correctPercentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Score</Typography>
            </Box>
          </Paper>
          
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Skill Assessment
          </Typography>
          
          <Stack spacing={3} sx={{ mb: 4 }}>
            {Object.entries(skillRatings).map(([skill, rating]) => (
              <Paper 
                key={skill} 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                    {skill.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Box sx={{ display: 'flex' }}>
                    {[...Array(5)].map((_, i) => (
                      <Box 
                        key={i}
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          mx: 0.5,
                          bgcolor: i < rating ? '#2196f3' : 'rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
          
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Feedback
          </Typography>
          
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              mb: 3
            }}
          >
            <Typography variant="body1">
              {correctPercentage >= 80 ? 
                `Excellent work! You've demonstrated strong interview skills for the ${jobRole} position. Your responses show good judgment and understanding of the role.` :
                correctPercentage >= 60 ?
                `Good job! You've shown solid understanding of the ${jobRole} position requirements. With a bit more practice, you'll excel in your interviews.` :
                `You've made a good start in preparing for the ${jobRole} position. Continue practicing to improve your interview performance and confidence.`
              }
            </Typography>
          </Paper>
          
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={handleToggleReview}
            sx={{ mt: 2 }}
          >
            Review All Questions
          </Button>
        </Paper>
      </Box>
    );
  }

  // Main interview screen
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Interview Practice
          </Typography>
          
          <Box>
            <Button 
              size="small" 
              onClick={handleToggleReview}
              sx={{ mr: 1 }}
              disabled={questionHistory.length === 0}
            >
              Review
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              color="error" 
              onClick={handleReset}
            >
              Reset
            </Button>
          </Box>
        </Box>

        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-around',
            borderRadius: 2
          }}
        >
          <Typography variant="body1">
            Questions: <strong>{stats.total}</strong>
          </Typography>
          <Typography variant="body1" color="success.main">
            Correct: <strong>{stats.correct}</strong>
          </Typography>
          <Typography variant="body1" color="error.main">
            Incorrect: <strong>{stats.incorrect}</strong>
          </Typography>
          <Typography variant="body1">
            Score: <strong>{stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%</strong>
          </Typography>
        </Paper>

        {/* Show Finish Now button after 4 questions */}
        {stats.total >= 4 && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleFinishInterview}
              sx={{ px: 4 }}
            >
              Finish Now & See Results
            </Button>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Generating question...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h5" sx={{ mb: 4, lineHeight: 1.5 }}>
              {currentQuestion}
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    py: 2,
                    px: 3,
                    whiteSpace: 'normal',
                    height: 'auto',
                    color: 'white',
                    borderColor: selectedAnswer !== null && (
                      index === selectedAnswer 
                        ? (index === currentCorrectAnswer ? '#2196f3' : '#ff4d4f')
                        : (index === currentCorrectAnswer ? '#2196f3' : 'inherit')
                    ),
                  }}
                >
                  {option}
                </Button>
              ))}
            </Stack>

            {selectedAnswer !== null && (
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  mt: 2, 
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: selectedAnswer === currentCorrectAnswer? 'info.main' : 'warning.main',
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: selectedAnswer === currentCorrectAnswer ? 'info.dark' : 'warning.dark'
                  }}
                >
                  {selectedAnswer === currentCorrectAnswer ? 'Correct!' : 'Good attempt, but not quite right.'}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {feedback}
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Paper>
      
      {error && (
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default Chatbox;