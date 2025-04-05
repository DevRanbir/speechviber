'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Container, LinearProgress, Paper, Card, CardContent,
  Avatar, Chip, Grid, CircularProgress, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Mic, MicOff, NavigateNext, Refresh, Quiz, Assessment, ArrowBack
} from '@mui/icons-material';

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

const FeatureCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(31, 41, 55, 0.4)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(107, 114, 128, 0.5)',
  borderRadius: '12px',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: 'rgba(79, 70, 229, 0.3)',
  border: '1px solid rgba(79, 70, 229, 0.3)',
  color: theme.palette.primary.light,
  width: 56,
  height: 56,
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

const InterviewSimulator = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isListening, setIsListening] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);

  // Fetch questions from API on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Generate 4 job interview questions starting with tell me about yourself. Return only the 4 questions as a JSON array with no additional text." }]
          }]
        })
      });

      const data = await response.json();
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const responseText = data.candidates[0].content.parts[0].text;
        
        // Extract JSON array from response
        let parsedQuestions;
        try {
          // Try to directly parse JSON
          parsedQuestions = JSON.parse(responseText);
        } catch (e) {
          // If direct parsing fails, try to extract JSON portion
          const jsonMatch = responseText.match(/\[.*\]/s);
          if (jsonMatch) {
            parsedQuestions = JSON.parse(jsonMatch[0]);
          }
        }
        
        if (Array.isArray(parsedQuestions) && parsedQuestions.length >= 4) {
          setQuestions(parsedQuestions.slice(0, 4));
        } else {
          // Fallback questions if parsing fails
          setQuestions([
            "Tell me about yourself.",
            "What are your greatest strengths?",
            "Where do you see yourself in 5 years?",
            "Why should we hire you?"
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      // Fallback questions
      setQuestions([
        "Tell me about yourself.",
        "What are your greatest strengths?",
        "Where do you see yourself in 5 years?",
        "Why should we hire you?"
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const startListening = () => {
    setTimeLeft(15);
    setIsListening(true);
    
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.start();
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = transcript;
        return newAnswers;
      });
    };

    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
    };
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < 3) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(15);
    } else {
      setTestComplete(true);
      evaluateAllAnswers();
    }
  };

  const evaluateAllAnswers = async () => {
    setIsEvaluating(true);
    const evaluationResults = [];
    
    for (let i = 0; i < questions.length; i++) {
      try {
        const result = await askAI(questions[i], answers[i]);
        evaluationResults.push(result);
      } catch (error) {
        console.error("Evaluation error:", error);
        evaluationResults.push({ response: "Evaluation failed", accuracy: "N/A" });
      }
    }
    
    setEvaluations(evaluationResults);
    
    // Calculate average score
    const scores = evaluationResults
      .map(result => parseInt(result.accuracy))
      .filter(score => !isNaN(score));
    
    if (scores.length > 0) {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      setAverageScore(Math.round(avg));
    }
    
    setIsEvaluating(false);
  };

  const askAI = async (question, answer) => {
    const body = JSON.stringify({
      contents: [{
        parts: [{ text: `Question: '${question}', Answer: '${answer || "No answer provided"}'. Give a very brief evaluation (max 2 sentences) and rate correctness from 0-100%.` }]
      }]
    });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      let accuracyValue = "N/A";
      let responseText = "No response";
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = data.candidates[0].content.parts[0].text;
        const match = responseText.match(/\b(\d{1,3})\b/);
        if (match) {
          accuracyValue = match[1];
        }
      }
      
      return {
        response: responseText,
        accuracy: accuracyValue
      };
    } catch (error) {
      console.error("Error fetching AI response:", error);
      return {
        response: "Error fetching response",
        accuracy: "N/A"
      };
    }
  };

  const restartInterview = () => {
    setTestComplete(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setEvaluations([]);
    setTimeLeft(15);
    fetchQuestions();
  };

  const goBack = () => {
    // Navigate to the practice page instead of showing intro
    window.location.href = '/practice';
  };

  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex) / 4) * 100;

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #111827, #312e81)' }}>
        <CircularProgress size={60} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  if (showIntro) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            {/* Decorative elements */}
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StyledAvatar><Quiz /></StyledAvatar>
                <GradientTypography variant="h4" fontWeight="bold">Audio Fastrack Analysis</GradientTypography>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 4, color: 'grey.300' }}>
                Perfect your interview skills with AI-powered feedback. Practice with real questions and receive personalized evaluations.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <FeatureCard>
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', mb: 2 }}><Mic /></Avatar>
                      <Typography variant="h6" fontWeight="medium" sx={{ color: 'grey.200', mb: 1 }}>Voice Recognition</Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>Speak your answers naturally like in a real interview</Typography>
                    </CardContent>
                  </FeatureCard>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FeatureCard>
                    <CardContent sx={{ p: 3 }}>
                      <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)', border: '1px solid rgba(79, 70, 229, 0.3)', mb: 2 }}><Assessment /></Avatar>
                      <Typography variant="h6" fontWeight="medium" sx={{ color: 'grey.200', mb: 1 }}>AI Feedback</Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>Receive detailed evaluations for all your responses</Typography>
                    </CardContent>
                  </FeatureCard>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <GradientButton fullWidth variant="contained" size="large" onClick={() => setShowIntro(false)} endIcon={<NavigateNext />} sx={{ py: 1.5 }}>
                  BEGIN YOUR INTERVIEW
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

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StyledAvatar><Quiz /></StyledAvatar>
            <GradientTypography variant="h5" fontWeight="bold">Audio Fastrack Analysis</GradientTypography>
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
              Go Back
            </Button>
            
            {!testComplete && (
              <Chip 
                label={`Question ${currentQuestionIndex + 1} of 4`}
                sx={{ bgcolor: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(107, 114, 128, 0.5)', color: 'grey.300', px: 1 }}
              />
            )}
            
            {!testComplete && (
              <Box sx={{ 
                width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid', borderColor: timeLeft > 10 ? 'success.main' : timeLeft > 5 ? 'warning.main' : 'error.main',
                bgcolor: timeLeft > 10 ? 'rgba(16, 185, 129, 0.1)' : timeLeft > 5 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                fontWeight: 'bold'
              }}>
                {timeLeft}
              </Box>
            )}
          </Box>
        </Box>
        
        {!testComplete ? (
          <StyledPaper>
            {/* Decorative elements */}
            <Box sx={{ position: 'absolute', bottom: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', top: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Progress bar */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'primary.light' }}>Progress: </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>{Math.floor(progressPercentage)}% complete</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progressPercentage} sx={{ 
                  height: 8, borderRadius: 4, bgcolor: 'rgba(31, 41, 55, 0.8)',
                  '& .MuiLinearProgress-bar': { background: 'linear-gradient(to right, #4f46e5, #8b5cf6)', borderRadius: 4 }
                }} />
              </Box>

              {/* Question card */}
              <Paper sx={{ bgcolor: 'rgba(31, 41, 55, 0.7)', backdropFilter: 'blur(8px)', p: 4, borderRadius: 4, border: '1px solid rgba(107, 114, 128, 0.5)', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
                  <StyledAvatar sx={{ width: 64, height: 64 }}>{currentQuestionIndex + 1}</StyledAvatar>
                  <Typography variant="h5" fontWeight="medium" sx={{ color: 'white' }}>Q: {questions[currentQuestionIndex]}</Typography>
                </Box>
                
                {answers[currentQuestionIndex] && (
                  <Box sx={{ mt: 3, p: 2.5, bgcolor: 'rgba(17, 24, 39, 0.7)', borderRadius: 3, border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', color: 'grey.500', mb: 1 }}>
                      <Mic fontSize="small" />Your Response:
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'grey.300' }}>{answers[currentQuestionIndex]}</Typography>
                  </Box>
                )}
              </Paper>

              {/* Action buttons */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  {isListening ? (
                    <RedButton fullWidth variant="contained" onClick={stopListening} startIcon={(<RecordingIndicator><span className="pulse"></span></RecordingIndicator>)} sx={{ py: 1.5 }}>
                      Stop Recording
                    </RedButton>
                  ) : (
                    <GradientButton fullWidth variant="contained" onClick={startListening} startIcon={<Mic />} sx={{ py: 1.5 }}>
                      Start Speaking
                    </GradientButton>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <GradientButton fullWidth variant="contained" onClick={nextQuestion} disabled={isListening || (timeLeft > 0 && !answers[currentQuestionIndex])} endIcon={<NavigateNext />} sx={{ py: 1.5 }}>
                    Next Question
                  </GradientButton>
                </Grid>
              </Grid>
            </Box>
          </StyledPaper>
        ) : (
          <StyledPaper>
            {/* Decorative elements */}
            <Box sx={{ position: 'absolute', top: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)', border: '1px solid rgba(79, 70, 229, 0.3)' }}><Assessment /></Avatar>
                  <GradientTypography variant="h5" fontWeight="bold">Interview Results</GradientTypography>
                </Box>
                
                {!isEvaluating && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={restartInterview}
                      startIcon={<Refresh />}
                      sx={{
                        color: 'grey.300', 
                        borderColor: 'rgba(107, 114, 128, 0.5)',
                        '&:hover': { borderColor: 'grey.300' }
                      }}
                    >
                      Try Again
                    </Button>
                  </Box>
                )}
              </Box>
              
              {isEvaluating ? (
                <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'rgba(31, 41, 55, 0.5)', backdropFilter: 'blur(8px)', borderRadius: 4, border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                  <CircularProgress size={80} sx={{ color: '#8b5cf6', mb: 4 }} />
                  <GradientTypography variant="h5" fontWeight="medium" sx={{ mb: 1 }}>Analyzing your responses</GradientTypography>
                  <Typography sx={{ color: 'grey.500' }}>Our AI is evaluating your interview performance</Typography>
                </Box>
              ) : (
                <>
                  {/* Average Score Section */}
                  <Paper sx={{ 
                    bgcolor: 'rgba(31, 41, 55, 0.7)', 
                    backdropFilter: 'blur(8px)', 
                    p: 3, 
                    borderRadius: 4,
                    border: '1px solid rgba(79, 70, 229, 0.3)',
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(79, 70, 229, 0.3)', 
                        border: '1px solid rgba(139, 92, 246, 0.5)',
                        width: 64,
                        height: 64,
                        fontSize: '1.5rem',
                        fontWeight: 'bold' 
                      }}>
                        {averageScore}%
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white' }}>Overall Performance</Typography>
                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                          Your average score across all interview questions
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      px: 3, 
                      py: 1, 
                      borderRadius: 2, 
                      bgcolor: averageScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 
                              averageScore >= 60 ? 'rgba(245, 158, 11, 0.2)' : 
                              'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${
                        averageScore >= 80 ? 'rgba(16, 185, 129, 0.4)' : 
                        averageScore >= 60 ? 'rgba(245, 158, 11, 0.4)' : 
                        'rgba(239, 68, 68, 0.4)'
                      }`
                    }}>
                      <Typography fontWeight="medium" sx={{ 
                        color: averageScore >= 80 ? 'rgb(16, 185, 129)' : 
                               averageScore >= 60 ? 'rgb(245, 158, 11)' : 
                               'rgb(239, 68, 68)' 
                      }}>
                        {averageScore >= 80 ? 'Excellent' : 
                         averageScore >= 60 ? 'Good' : 
                         'Needs Improvement'}
                      </Typography>
                    </Box>
                  </Paper>
                
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {questions.map((question, index) => (
                      <Paper key={index} sx={{
                        bgcolor: 'rgba(75, 85, 99, 0.7)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 4,
                        border: '1px solid rgba(107, 114, 128, 0.5)',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <StyledAvatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.2)' }}>{index + 1}</StyledAvatar>
                            <Box>
                              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Q: {question}</Typography>
                              <Box sx={{ bgcolor: 'rgba(17, 24, 39, 0.4)', borderRadius: 2, p: 2, border: '1px solid rgba(107, 114, 128, 0.5)' }}>
                                <Typography sx={{ fontStyle: 'italic', color: 'grey.300' }}>
                                  You Replied: {answers[index] || "No answer provided"}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                        
                        {evaluations[index] && (
                          <Box sx={{ bgcolor: 'rgba(17, 24, 39, 0.7)', p: 3, borderTop: '1px solid rgba(107, 114, 128, 0.5)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c4b5fd' }}>
                                {evaluations[index].accuracy}%
                              </Avatar>
                              <Typography sx={{ color: 'grey.300' }}>{evaluations[index].response}</Typography>
                            </Box>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </StyledPaper>
        )}
      </Container>
    </Box>
  );
};

export default InterviewSimulator;