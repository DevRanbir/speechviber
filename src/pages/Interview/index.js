import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Button, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CameraIcon from '@mui/icons-material/Camera';
import CloseIcon from '@mui/icons-material/Close';

// Styled components - simplified
const GlassContainer = styled(Box)({
  background: 'rgba(30, 41, 59, 0.4)',
  backdropFilter: 'blur(20px)',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  marginBottom: 24,
});

const VideoPreview = styled('video')({
  width: '100%',
  borderRadius: 8,
  background: 'rgba(15, 23, 42, 0.6)',
  maxHeight: '40vh',
  objectFit: 'cover',
  transform: 'scaleX(-1)',
});

const QuestionCard = styled(Box)({
  background: 'rgba(15, 23, 42, 0.8)',
  borderRadius: 8,
  padding: 16,
});

const ControlsContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 16,
  marginTop: 16,
});

const ControlButton = styled(IconButton)({
  background: 'rgba(30, 41, 59, 0.6)',
  color: 'white',
  '&:hover': {
    background: 'rgba(15, 23, 42, 0.8)',
  },
  padding: 12,
});

const NavigationContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 24,
});

const ProgressBar = styled(Box)({
  width: '100%',
  height: 8,
  background: 'rgba(15, 23, 42, 0.4)',
  borderRadius: 4,
  marginBottom: 16,
  overflow: 'hidden',
});

// Sample interview questions
const interviewQuestions = [
  "Tell me about yourself and your background.",
  "What are your greatest strengths and how do they help you in your work?",
  "Why are you interested in this position and what can you bring to the role?",
  "Describe a challenging situation you faced and how you resolved it.",
  "Where do you see yourself in five years?",
];

const Interview = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // State variables - consolidated
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [evaluations, setEvaluations] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [detailedResults, setDetailedResults] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [emotionAnalysis, setEmotionAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Speech recognition setup
  useEffect(() => {
    const initializeSpeechRecognition = () => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error('Speech recognition not supported in this browser');
          return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setTranscript(finalTranscript || interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            alert('Microphone access was denied. Please allow microphone access to use speech recognition.');
          }
        };

        recognitionRef.current.onend = () => {
          if (isRecording) {
            recognitionRef.current.start();
          }
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
      }
    };

    initializeSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  // Recording functions
  const startRecording = () => {
    try {
      setTranscript('');
      setIsRecording(true);
      setTimeLeft(30);
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (transcript) {
        setAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[currentQuestion] = transcript;
          return newAnswers;
        });
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };
  
  // Timer effect
  useEffect(() => {
    let timer;
    if (isRecording && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  // Camera setup
  useEffect(() => {
    let stream;
    const setupCamera = async () => {
      try {
        setIsLoading(true);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, 
          audio: true 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
        }
      } catch (err) {
        console.error('Camera access error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    setupCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestion < interviewQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(30);
      setTranscript('');
    } else {
      completeInterview();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setTimeLeft(30);
    }
  };

  const handleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Complete interview
  const completeInterview = () => {
    setIsComplete(true);
    evaluateResponses();
  };

  // Image analysis function
  const captureAndAnalyzeImage = async () => {
    if (videoRef.current) {
      try {
        setIsAnalyzing(true);
        
        // Capture the image from video
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Create FormData and append the blob
        const formData = new FormData();
        formData.append('image', blob, 'image.jpg');
        
        // Prepare request to Google Cloud Vision API
        const visionApiUrl = 'https://vision.googleapis.com/v1/images:annotate';
        const apiKey = 'AIzaSyAuELPrqtXf62evHfITrBUo_eX3kojdo04';
        
        // Convert image to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
          // Get base64 data (remove the data:image/jpeg;base64, prefix)
          const base64Image = reader.result.split(',')[1];
          
          // Create request body for Google Cloud Vision API
          const requestBody = {
            requests: [
              {
                image: {
                  content: base64Image
                },
                features: [
                  {
                    type: 'FACE_DETECTION',
                    maxResults: 1
                  },
                  {
                    type: 'EMOTION_DETECTION'  // Note: This is a placeholder - actual emotion detection may use a combination of features
                  }
                ]
              }
            ]
          };
          
          // Make the API request
          const response = await fetch(`${visionApiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          if (!response.ok) {
            throw new Error('Failed to analyze image: ' + response.statusText);
          }
          
          const data = await response.json();
          console.log('Vision API response:', data);
          
          // Process the response
          if (data.responses && data.responses[0] && data.responses[0].faceAnnotations && data.responses[0].faceAnnotations.length > 0) {
            const faceAnnotation = data.responses[0].faceAnnotations[0];
            
            // Map likelihood strings to numeric values for processing
            const likelihoodMap = {
              'VERY_UNLIKELY': 0,
              'UNLIKELY': 25,
              'POSSIBLE': 50,
              'LIKELY': 75,
              'VERY_LIKELY': 90
            };
            
            // Determine dominant emotion based on likelihood values
            const emotions = {
              joy: likelihoodMap[faceAnnotation.joyLikelihood] || 0,
              sorrow: likelihoodMap[faceAnnotation.sorrowLikelihood] || 0,
              anger: likelihoodMap[faceAnnotation.angerLikelihood] || 0,
              surprise: likelihoodMap[faceAnnotation.surpriseLikelihood] || 0
            };
            
            // Find the emotion with highest confidence
            let dominantEmotion = 'neutral';
            let highestConfidence = 0;
            
            for (const [emotion, confidence] of Object.entries(emotions)) {
              if (confidence > highestConfidence) {
                highestConfidence = confidence;
                dominantEmotion = emotion;
              }
            }
            
            // If no strong emotion is detected, default to neutral
            if (highestConfidence < 50) {
              dominantEmotion = 'neutral';
              highestConfidence = Math.max(50, highestConfidence);
            }
            
            // Map to interview-relevant terminology
            const emotionMapping = {
              'joy': 'confident',
              'sorrow': 'nervous',
              'anger': 'tense',
              'surprise': 'engaged',
              'neutral': 'neutral'
            };
            
            // Set emotion analysis results
            setEmotionAnalysis({
              emotion: emotionMapping[dominantEmotion] || dominantEmotion,
              confidence: highestConfidence,
              description: `Detected ${emotionMapping[dominantEmotion] || dominantEmotion} with ${highestConfidence}% confidence.`
            });
          } else {
            // Handle case where no face was detected
            setEmotionAnalysis({
              emotion: 'unknown',
              confidence: 0,
              description: 'No face detected or unable to analyze expression.'
            });
          }
          
          setIsAnalyzing(false);
        };
      } catch (error) {
        console.error('Error analyzing image:', error);
        setEmotionAnalysis({
          emotion: 'error',
          confidence: 0,
          description: 'Error analyzing image: ' + error.message
        });
        setIsAnalyzing(false);
      }
    }
  };

  // Reset captured image
  const resetImage = () => {
    setCapturedImage(null);
    setEmotionAnalysis(null);
  };

  // Mock evaluation function
  const evaluateResponses = () => {
    setIsEvaluating(true);
    
    setTimeout(() => {
      // Generate mock evaluations
      const mockEvaluations = answers.map(answer => {
        if (!answer) return null;
        return {
          score: Math.floor(Math.random() * 30) + 65,
          feedback: "Your response was concise and addressed the question. Try to include specific examples to strengthen your answer next time."
        };
      });
      
      // Create mock detailed results
      const mockFactors = {
        voiceModulation: Math.floor(Math.random() * 20) + 65,
        clarity: Math.floor(Math.random() * 20) + 65,
        confidence: Math.floor(Math.random() * 20) + 65,
        facialExpressions: Math.floor(Math.random() * 20) + 65,
        eyeContact: Math.floor(Math.random() * 20) + 65,
        contentRelevance: Math.floor(Math.random() * 20) + 65,
      };
      
      const averageScore = Math.round(
        Object.values(mockFactors).reduce((sum, score) => sum + score, 0) / Object.values(mockFactors).length
      );
      
      setEvaluations(mockEvaluations);
      setDetailedResults({
        averageScore,
        factors: mockFactors
      });
      
      setIsEvaluating(false);
    }, 2000);
  };

  // Helper function for score colors
  const getScoreColor = (score) => {
    if (score >= 85) return 'success.dark';
    if (score >= 75) return 'warning.dark';
    return 'error.dark';
  };

  // Progress percentage
  const progressPercentage = ((currentQuestion) / (interviewQuestions.length - 1)) * 100;

  // Reset interview
  const resetInterview = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setEvaluations([]);
    setDetailedResults(null);
    setTimeLeft(30);
    setIsComplete(false);
    setTranscript('');
    setCapturedImage(null);
    setEmotionAnalysis(null);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        p: { xs: 2, sm: 4 }, 
        background: 'linear-gradient(135deg, #0F172A, #1E293B)', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '800px' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            AI Interview Analyser
          </Typography>
          
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackIcon />}
            sx={{ 
              background: 'linear-gradient(90deg, #ef4444, #dc2626)',
              color: 'white',
              borderRadius: '8px',
              '&:hover': {
                background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
              }
            }}
          >
            Exit
          </Button>
        </Box>
        
        {!isComplete ? (
          <>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Progress: {Math.floor(progressPercentage)}%
              </Typography>
              {isRecording && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: timeLeft > 15 ? 'success.main' : timeLeft > 8 ? 'warning.main' : 'error.main',
                      animation: 'pulse 1.5s infinite'
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    Time left: {timeLeft}s
                  </Typography>
                </Box>
              )}
            </Box>
            
            <ProgressBar>
              <Box 
                sx={{ 
                  width: `${progressPercentage}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                  transition: 'width 0.3s ease'
                }}
              />
            </ProgressBar>
            
            <GlassContainer>
              {!isLoading ? (
                <VideoPreview ref={videoRef} autoPlay muted />
              ) : (
                <Box sx={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              )}
              
              <QuestionCard>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'medium' }}>
                  <Box component="span" sx={{ 
                    background: 'rgba(59, 130, 246, 0.8)', 
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1
                  }}>
                    {currentQuestion + 1}
                  </Box>
                  {interviewQuestions[currentQuestion]}
                </Typography>
              </QuestionCard>
              
              {/* Image analysis section */}
              {capturedImage && (
                <Box sx={{ background: 'rgba(15, 23, 42, 0.4)', p: 2, borderRadius: 2, position: 'relative' }}>
                  <IconButton 
                    size="small" 
                    onClick={resetImage}
                    sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  
                  <Typography variant="body2" sx={{ color: 'white', mb: 1, fontWeight: 'bold' }}>
                    Snapshot Analysis
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img 
                      src={capturedImage} 
                      alt="Captured" 
                      style={{ 
                        width: 100, 
                        height: 100, 
                        objectFit: 'cover', 
                        borderRadius: 4 
                      }} 
                    />
                    
                    {isAnalyzing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Analyzing...
                        </Typography>
                      </Box>
                    ) : emotionAnalysis && (
                      <Box>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {emotionAnalysis.description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
              
              {isRecording && transcript && (
                <Box sx={{ background: 'rgba(15, 23, 42, 0.4)', p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: 'white', fontStyle: 'italic' }}>
                    <Box component="span" sx={{ fontWeight: 'bold', color: 'rgba(59, 130, 246, 0.8)' }}>
                      Recording:
                    </Box> {transcript}
                  </Typography>
                </Box>
              )}
              
              {!isRecording && answers[currentQuestion] && (
                <Box sx={{ background: 'rgba(15, 23, 42, 0.4)', p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: 'white', fontStyle: 'italic' }}>
                    <Box component="span" sx={{ fontWeight: 'bold', color: 'rgba(59, 130, 246, 0.8)' }}>
                      Your Response:
                    </Box> {answers[currentQuestion]}
                  </Typography>
                </Box>
              )}
              
              <ControlsContainer>
                <ControlButton 
                  onClick={handleRecording} 
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                  sx={{ 
                    background: isRecording ? 'rgba(220, 38, 38, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                    width: 64,
                    height: 64,
                  }}
                >
                  {isRecording ? <StopIcon /> : <MicIcon />}
                </ControlButton>
                
                {!capturedImage && !isRecording && (
                  <ControlButton 
                    onClick={captureAndAnalyzeImage}
                    aria-label="Take snapshot"
                    sx={{ background: 'rgba(30, 41, 59, 0.8)' }}
                  >
                    <CameraIcon />
                  </ControlButton>
                )}
              </ControlsContainer>
            </GlassContainer>
            
            <NavigationContainer>
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                disabled={currentQuestion === 0}
                onClick={goToPreviousQuestion}
                sx={{ 
                  background: 'rgba(30, 41, 59, 0.8)',
                  '&:hover': { background: 'rgba(15, 23, 42, 0.9)' },
                  color: 'white',
                }}
              >
                Previous
              </Button>
              
              <Typography variant="body2" sx={{ color: 'white' }}>
                {currentQuestion + 1} / {interviewQuestions.length}
              </Typography>
              
              <Button
                variant="contained"
                endIcon={currentQuestion === interviewQuestions.length - 1 ? <AssessmentIcon /> : <ArrowForwardIcon />}
                onClick={goToNextQuestion}
                sx={{ 
                  background: 'rgba(59, 130, 246, 0.8)',
                  '&:hover': { background: 'rgba(37, 99, 235, 0.9)' },
                  color: 'white',
                }}
              >
                {currentQuestion === interviewQuestions.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </NavigationContainer>
          </>
        ) : (
          <GlassContainer>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
              <AssessmentIcon sx={{ mr: 1 }} /> 
              Interview Results
            </Typography>
            
            {isEvaluating ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ color: 'white' }}>
                  Analyzing your responses...
                </Typography>
              </Box>
            ) : (
              <>
                {/* Overall performance section */}
                {detailedResults && (
                  <Box sx={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 2, p: 2, mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                      Overall Performance
                      <Box sx={{ bgcolor: getScoreColor(detailedResults.averageScore), color: 'white', borderRadius: 8, px: 2, py: 0.5 }}>
                        {detailedResults.averageScore}%
                      </Box>
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {Object.entries(detailedResults.factors).map(([factor, score]) => {
                        const factorName = factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <Box key={factor} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(30, 41, 59, 0.6)', borderRadius: 2, p: 1.5, width: { xs: '45%', sm: '30%' } }}>
                            <Typography variant="body2" sx={{ color: 'white', mb: 1, fontSize: '0.75rem' }}>
                              {factorName}
                            </Typography>
                            <Box sx={{ width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: getScoreColor(score), color: 'white', fontWeight: 'bold' }}>
                              {score}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
                
                {/* Questions section */}
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Question Analysis
                </Typography>
                
                {interviewQuestions.map((question, index) => (
                  <Box key={index} sx={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 2, p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                      Q{index + 1}: {question}
                    </Typography>
                    
                    {answers[index] ? (
                      <>
                        <Typography variant="body2" sx={{ color: 'white', fontStyle: 'italic', mb: 2 }}>
                          Your response: {answers[index]}
                        </Typography>
                        
                        {evaluations[index] && (
                          <Box sx={{ background: 'rgba(15, 23, 42, 0.8)', p: 2, borderRadius: 1, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ bgcolor: getScoreColor(evaluations[index].score), color: 'white', borderRadius: 8, px: 1.5, py: 0.5 }}>
                              {evaluations[index].score}%
                            </Box>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              {evaluations[index].feedback}
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                        No answer provided
                      </Typography>
                    )}
                  </Box>
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={resetInterview}
                    sx={{ background: 'rgba(59, 130, 246, 0.8)', color: 'white' }}
                  >
                    Try Again
                  </Button>
                </Box>
              </>
            )}
          </GlassContainer>
        )}
      </motion.div>
    </Box>
  );
};

export default Interview;