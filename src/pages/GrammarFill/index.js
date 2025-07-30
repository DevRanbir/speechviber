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
import { getGroqApiKey2Synch, getGroqApiUrlSynch } from '../../utils/apiKeys';

// API Configuration - now loaded from Firebase
const getApiKey = () => getGroqApiKey2Synch();
const getApiUrl = () => getGroqApiUrlSynch();

const GrammarFill = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [answerCorrectness, setAnswerCorrectness] = useState({});
  
  // Game settings
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', or 'hard'
  const [grammarTopic, setGrammarTopic] = useState('mixed'); // 'articles', 'prepositions', 'tenses', 'mixed'
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // seconds
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
  const generateQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setSelectedAnswers({});
    setShowResult(false);
    setAnswerCorrectness({});
    setError(null);

    let difficultyPrompt = '';
    if (difficulty === 'easy') {
      difficultyPrompt = 'simple grammar suitable for elementary to middle school students';
    } else if (difficulty === 'medium') {
      difficultyPrompt = 'moderate difficulty grammar suitable for high school students';
    } else {
      difficultyPrompt = 'advanced grammar suitable for college students or professionals';
    }

    let topicPrompt = '';
    if (grammarTopic === 'articles') {
      topicPrompt = 'focus on articles (a, an, the)';
    } else if (grammarTopic === 'prepositions') {
      topicPrompt = 'focus on prepositions (in, on, at, by, with, etc.)';
    } else if (grammarTopic === 'tenses') {
      topicPrompt = 'focus on verb tenses (present, past, future, perfect, etc.)';
    } else {
      topicPrompt = 'mix of different grammar concepts including articles, prepositions, tenses, modals, and conjunctions';
    }

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
            content: `Generate a grammar fill-in-the-blank exercise with ${difficultyPrompt} and ${topicPrompt}. Format exactly as follows:
              Topic: [specific grammar topic, e.g., "Articles", "Present Perfect vs. Simple Past", etc.]
              Paragraph: [paragraph with EXACTLY 5 blanks marked as [BLANK1], [BLANK2], [BLANK3], [BLANK4], and [BLANK5]]
              Options:
              1. [BLANK1]: [option A] | [option B]
              2. [BLANK2]: [option A] | [option B]
              3. [BLANK3]: [option A] | [option B]
              4. [BLANK4]: [option A] | [option B]
              5. [BLANK5]: [option A] | [option B]
              Correct Answers:
              1. [correct option for BLANK1]
              2. [correct option for BLANK2]
              3. [correct option for BLANK3]
              4. [correct option for BLANK4]
              5. [correct option for BLANK5]
              Explanations:
              1. [explanation for BLANK1]
              2. [explanation for BLANK2]
              3. [explanation for BLANK3]
              4. [explanation for BLANK4]
              5. [explanation for BLANK5]
              
              Important rules:
              - All blanks must be genuinely challenging and focus on grammar, not vocabulary
              - Each blank must have exactly 2 options that are grammatically different but plausible
              - The paragraph must be coherent and make sense as a whole
              - Ensure the blanks test grammatical understanding, not general knowledge
              - No asterisks or bold formatting in any part of the response`
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
        
        // Get Topic
        if (responseText.includes('Topic:')) {
          const afterTopic = responseText.split('Topic:')[1];
          sections.topic = afterTopic.split('\n')[0].trim();
        }
        
        // Get Paragraph
        if (responseText.includes('Paragraph:')) {
          const afterParagraph = responseText.split('Paragraph:')[1];
          sections.paragraph = afterParagraph.split('\n')[0].trim();
        }
        
        // Get Options
        const options = [];
        if (responseText.includes('Options:')) {
          const optionsSection = responseText.split('Options:')[1].split('Correct Answers:')[0];
          const optionLines = optionsSection.split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
          
          for (const line of optionLines) {
            const match = line.match(/(\d+)\.\s+\[BLANK\d+\]:\s+(.+)\s+\|\s+(.+)/);
            if (match) {
              options.push({
                blankNumber: parseInt(match[1]),
                optionA: match[2].trim(),
                optionB: match[3].trim()
              });
            }
          }
        }
        sections.options = options;
        
        // Get Correct Answers
        const correctAnswers = {};
        if (responseText.includes('Correct Answers:')) {
          const answersSection = responseText.split('Correct Answers:')[1].split('Explanations:')[0];
          const answerLines = answersSection.split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
          
          for (const line of answerLines) {
            const match = line.match(/(\d+)\.\s+(.+)/);
            if (match) {
              correctAnswers[match[1]] = match[2].trim();
            }
          }
        }
        sections.correctAnswers = correctAnswers;
        
        // Get Explanations
        const explanations = {};
        if (responseText.includes('Explanations:')) {
          const explanationsSection = responseText.split('Explanations:')[1].trim();
          const explanationLines = explanationsSection.split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
          
          let currentNumber = null;
          let currentExplanation = '';
          
          for (const line of explanationLines) {
            const match = line.match(/^(\d+)\.\s+(.+)/);
            if (match) {
              if (currentNumber !== null) {
                explanations[currentNumber] = currentExplanation.trim();
              }
              currentNumber = match[1];
              currentExplanation = match[2];
            } else if (currentNumber !== null) {
              currentExplanation += ' ' + line;
            }
          }
          
          if (currentNumber !== null) {
            explanations[currentNumber] = currentExplanation.trim();
          }
        }
        sections.explanations = explanations;
        
        console.log("Parsed sections:", sections); // For debugging
        
        // Process paragraph to replace [BLANK#] with indices for rendering
        let processedParagraph = sections.paragraph;
        for (let i = 1; i <= 5; i++) {
          processedParagraph = processedParagraph.replace(`[BLANK${i}]`, `___${i}___`);
        }
        
        // Create blanks array with options, correct answers, and explanations
        const blanks = [];
        for (let i = 1; i <= 5; i++) {
          const option = sections.options.find(opt => opt.blankNumber === i);
          blanks.push({
            id: i,
            options: [option.optionA, option.optionB],
            correct: sections.correctAnswers[i],
            explanation: sections.explanations[i]
          });
        }
        
        setQuestion({
          topic: sections.topic,
          paragraph: processedParagraph,
          blanks: blanks
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
    setShowResult(true);
    // Mark all unanswered questions as incorrect
    const correctnessMap = {};
    let correctOnes = 0;
    let incorrectOnes = 0;
    
    question.blanks.forEach(blank => {
      const isAnswered = selectedAnswers[blank.id] !== undefined;
      const isCorrect = isAnswered && selectedAnswers[blank.id] === blank.correct;
      correctnessMap[blank.id] = isCorrect;
      
      if (isCorrect) {
        correctOnes++;
      } else {
        incorrectOnes++;
      }
    });
    
    setAnswerCorrectness(correctnessMap);
    setCorrectCount(prev => prev + correctOnes);
    setIncorrectCount(prev => prev + incorrectOnes);
    updateAccuracy(correctCount + correctOnes, incorrectCount + incorrectOnes);
  };

  // Update accuracy percentage
  const updateAccuracy = (correct, incorrect) => {
    const total = correct + incorrect;
    const newAccuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
    setAccuracy(newAccuracy);
  };

  // Handle answer selection
  const handleAnswerChange = (blankId, value) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [blankId]: value
    }));
  };

  // Check if all blanks are answered
  const allBlanksAnswered = () => {
    return question?.blanks?.every(blank => selectedAnswers[blank.id] !== undefined) || false;
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
          description: `Completed a grammar fill exercise with score: ${score}`,
          duration: "10 minutes", // You can modify this based on actual game duration
          id: `grammarfill_${new Date().toISOString()}_${score}`,
          score: score,
          type: "Grammar Fill"
        };
    
        // Save to history/activities
        const historyRef = ref(
          database,
          `users/${currentUser.uid}/history/data/${timestamp}/activities/0`
        );
    
        // Save game data
        const grammarFillRef = ref(
          database,
          `users/${currentUser.uid}/grammar-fill/${timestamp}`
        );
    
        // Save both activity and game data
        Promise.all([
          set(historyRef, activityData),
          push(grammarFillRef, {
            time: new Date().toISOString(),
            correctCount: correctCount,
            incorrectCount: incorrectCount,
            score: score,
            accuracy: accuracy,
            timerEnabled: timerEnabled,
            timeLimit: timerEnabled ? timeLimit : 0,
            difficulty: difficulty,
            topic: grammarTopic
          })
        ])
          .then(() => {
            console.log('Grammar Fill data and activity saved successfully');
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
    
    // Check correctness of each answer
    const correctnessMap = {};
    let correctOnes = 0;
    
    question.blanks.forEach(blank => {
      const isCorrect = selectedAnswers[blank.id] === blank.correct;
      correctnessMap[blank.id] = isCorrect;
      
      if (isCorrect) {
        correctOnes++;
      }
    });
    
    setAnswerCorrectness(correctnessMap);
    setShowResult(true);
    
    // Update score and stats
    const pointsEarned = timerEnabled 
      ? Math.ceil(timeRemaining * 10 * correctOnes / (timeLimit * question.blanks.length)) * 10
      : correctOnes * 10;
    
    setScore(prev => prev + pointsEarned);
    setCorrectCount(prev => prev + correctOnes);
    setIncorrectCount(prev => prev + (question.blanks.length - correctOnes));
    
    // Update accuracy
    updateAccuracy(
      correctCount + correctOnes,
      incorrectCount + (question.blanks.length - correctOnes)
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

  // Split paragraph into parts with blanks
  const renderParagraphWithBlanks = () => {
    if (!question || !question.paragraph) return null;
    
    const parts = question.paragraph.split(/___(\d)___/);
    return parts.map((part, index) => {
      // If it's a number (blank placeholder), render the blank
      if (/^\d$/.test(part)) {
        const blankNumber = parseInt(part);
        const blank = question.blanks.find(b => b.id === blankNumber);
        
        if (!blank) return null;
        
        return (
          <Typography 
            component="span" 
            key={`blank-${index}`}
            sx={{ 
              mx: 1, 
              display: 'inline-block', 
              minWidth: '100px',
              px: 1,
              borderBottom: '2px dashed',
              borderColor: showResult 
                ? answerCorrectness[blankNumber] ? '#4ade80' : '#f87171'
                : 'rgba(124, 58, 237, 0.5)',
            }}
          >
            <RadioGroup
              row
              value={selectedAnswers[blankNumber] || ''}
              onChange={(e) => handleAnswerChange(blankNumber, e.target.value)}
            >
              {blank.options.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  disabled={showResult}
                  control={
                    <Radio 
                      size="small" 
                      sx={{ 
                        color: '#A78BFA',
                        '&.Mui-checked': {
                          color: '#7C3AED',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        color: showResult
                          ? option === blank.correct
                            ? '#4ade80'
                            : option === selectedAnswers[blankNumber]
                              ? '#f87171'
                              : 'white'
                          : 'white',
                        fontSize: '0.95rem',
                        fontWeight: showResult && option === blank.correct ? 'bold' : 'normal'
                      }}
                    >
                      {option}
                    </Typography>
                  }
                />
              ))}
            </RadioGroup>
          </Typography>
        );
      }
      // Normal text
      return <span key={`text-${index}`}>{part}</span>;
    });
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
            Grammar Fill Challenge
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
                        Simple grammar for elementary to middle school
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
                        Advanced grammar for college and professionals
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: '#A78BFA', mb: 2, textAlign: 'left' }}>
                  Grammar Topic:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        background: grammarTopic === 'articles' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid',
                        borderColor: grammarTopic === 'articles' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'rgba(124, 58, 237, 0.1)',
                        }
                      }}
                      onClick={() => setGrammarTopic('articles')}
                    >
                      <Typography sx={{ color: '#A78BFA' }}>Articles</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                        a, an, the
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        background: grammarTopic === 'prepositions' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid',
                        borderColor: grammarTopic === 'prepositions' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'rgba(124, 58, 237, 0.1)',
                        }
                      }}
                      onClick={() => setGrammarTopic('prepositions')}
                    >
                      <Typography sx={{ color: '#A78BFA' }}>Prepositions</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                        in, on, at, by, etc.
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        background: grammarTopic === 'tenses' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid',
                        borderColor: grammarTopic === 'tenses' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'rgba(124, 58, 237, 0.1)',
                        }
                      }}
                      onClick={() => setGrammarTopic('tenses')}
                    >
                      <Typography sx={{ color: '#A78BFA' }}>Tenses</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                        present, past, future
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        background: grammarTopic === 'mixed' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid',
                        borderColor: grammarTopic === 'mixed' ? 'rgba(124, 58, 237, 0.5)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: 'rgba(124, 58, 237, 0.1)',
                        }
                      }}
                      onClick={() => setGrammarTopic('mixed')}
                    >
                      <Typography sx={{ color: '#A78BFA' }}>Mixed</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                        All grammar topics
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: '#A78BFA', mb: 2, textAlign: 'left' }}>
                  Timer Settings:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    background: 'rgba(30, 41, 59, 0.6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimerIcon sx={{ color: '#A78BFA', mr: 1 }} />
                    <Typography sx={{ color: 'white' }}>
                      Enable Timer
                    </Typography>
                    <Tooltip title="With timer enabled, you'll have limited time to answer and bonus points for quick responses">
                      <InfoIcon sx={{ color: '#A78BFA', ml: 1, fontSize: 18 }} />
                    </Tooltip>
                  </Box>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={timerEnabled}
                          onChange={() => setTimerEnabled(!timerEnabled)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#7C3AED',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#7C3AED',
                            },
                          }}
                        />
                      }
                      label=""
                    />
                  </FormGroup>
                </Paper>
                
                {timerEnabled && (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ color: 'white', mb: 1 }}>
                      Time Limit: {timeLimit} seconds
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => setTimeLimit(15)}
                          sx={{
                            borderColor: timeLimit === 15 ? '#7C3AED' : 'rgba(124, 58, 237, 0.4)',
                            color: timeLimit === 15 ? '#7C3AED' : '#A78BFA',
                            backgroundColor: timeLimit === 15 ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                            '&:hover': {
                              borderColor: '#7C3AED',
                              background: 'rgba(124, 58, 237, 0.1)',
                            }
                          }}
                        >
                          15s (Hard)
                        </Button>
                      </Grid>
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
                          30s (Medium)
                        </Button>
                      </Grid>
                      <Grid item xs={4}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => setTimeLimit(45)}
                          sx={{
                            borderColor: timeLimit === 45 ? '#7C3AED' : 'rgba(124, 58, 237, 0.4)',
                            color: timeLimit === 45 ? '#7C3AED' : '#A78BFA',
                            backgroundColor: timeLimit === 45 ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                            '&:hover': {
                              borderColor: '#7C3AED',
                              background: 'rgba(124, 58, 237, 0.1)',
                            }
                          }}
                        >
                          45s (Easy)
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
              
              <Button
                variant="contained"
                size="large"
                onClick={startGame}
                sx={{
                  mt: 2,
                  px: 5,
                  py: 1,
                  background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                  borderRadius: '8px',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
                  },
                  fontSize: '1rem',
                }}
              >
                Start Game
              </Button>
            </Paper>
          ) : (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <CircularProgress sx={{ color: '#7C3AED' }} />
                  <Typography sx={{ ml: 2, color: '#A78BFA' }}>
                    Loading question...
                  </Typography>
                </Box>
              ) : error ? (
                <Paper sx={{
                  p: 4,
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  textAlign: 'center'
                }}>
                  <Typography sx={{ color: '#f87171', mb: 2 }}>
                    Error: {error}
                  </Typography>
                  <Button 
                    variant="outlined"
                    onClick={retryQuestion}
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
                </Paper>
              ) : question ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper sx={{
                    p: { xs: 2, sm: 4 },
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(124, 58, 237, 0.1)',
                  }}>
                    {/* Timer display (if enabled) */}
                    {timerEnabled && (
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <Chip
                          icon={<TimerIcon />}
                          label={`${timeRemaining} seconds`}
                          sx={{
                            backgroundColor: 
                              timeRemaining > timeLimit * 0.6 ? 'rgba(34, 197, 94, 0.2)' :
                              timeRemaining > timeLimit * 0.3 ? 'rgba(250, 204, 21, 0.2)' : 
                              'rgba(239, 68, 68, 0.2)',
                            color: 
                              timeRemaining > timeLimit * 0.6 ? '#4ade80' :
                              timeRemaining > timeLimit * 0.3 ? '#fbbf24' : 
                              '#f87171',
                            px: 2,
                            py: 1,
                            '& .MuiChip-icon': {
                              color: 'inherit'
                            }
                          }}
                        />
                      </Box>
                    )}
                    
                    <Typography variant="h6" sx={{ color: '#A78BFA', mb: 2 }}>
                      Topic: {question.topic}
                    </Typography>
                    
                    <Typography sx={{ 
                      color: 'white', 
                      mb: 4, 
                      lineHeight: 1.8,
                      fontSize: '1.1rem',
                      background: 'rgba(30, 41, 59, 0.6)',
                      p: 3,
                      borderRadius: '8px'
                    }}>
                      {renderParagraphWithBlanks()}
                    </Typography>
                    
                    <Divider sx={{ my: 3, backgroundColor: 'rgba(124, 58, 237, 0.2)' }} />
                    
                    {showResult && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ color: '#A78BFA', mb: 2 }}>
                          Explanations:
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {question.blanks.map((blank) => (
                            <Grid item xs={12} key={`explanation-${blank.id}`}>
                              <Paper sx={{ 
                                p: 2, 
                                background: answerCorrectness[blank.id] 
                                  ? 'rgba(34, 197, 94, 0.1)' 
                                  : 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid',
                                borderColor: answerCorrectness[blank.id] 
                                  ? 'rgba(34, 197, 94, 0.2)' 
                                  : 'rgba(239, 68, 68, 0.2)',
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  {answerCorrectness[blank.id] ? (
                                    <CheckCircleIcon sx={{ color: '#4ade80', mr: 1 }} />
                                  ) : (
                                    <CancelIcon sx={{ color: '#f87171', mr: 1 }} />
                                  )}
                                  <Typography sx={{ 
                                    color: answerCorrectness[blank.id] ? '#4ade80' : '#f87171',
                                    fontWeight: 'bold'
                                  }}>
                                    Blank {blank.id}: {selectedAnswers[blank.id] || 'Not answered'} {!answerCorrectness[blank.id] && `(Correct: ${blank.correct})`}
                                  </Typography>
                                </Box>
                                <Typography sx={{ color: 'white', ml: 4 }}>
                                  {blank.explanation}
                                </Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                      {showResult ? (
                        <>
                          <Button
                            variant="contained"
                            onClick={handleNextQuestion}
                            sx={{
                              px: 4,
                              py: 1,
                              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                              borderRadius: '8px',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
                              },
                            }}
                          >
                            Next Question
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleFinishGame}
                            sx={{
                              px: 4,
                              py: 1,
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
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleAnswerSubmit}
                          disabled={!allBlanksAnswered()}
                          sx={{
                            px: 6,
                            py: 1,
                            background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                            borderRadius: '8px',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
                            },
                            '&.Mui-disabled': {
                              background: 'rgba(124, 58, 237, 0.2)',
                              color: 'rgba(255, 255, 255, 0.5)'
                            }
                          }}
                        >
                          Submit Answer
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              ) : null}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default GrammarFill;