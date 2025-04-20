'use client';
import React, { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getDatabase, ref, push } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const WordPower = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [difficulty, setDifficulty] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Scoring system
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [dataSaved, setDataSaved] = useState(false);

  // Error handling state
  const [error, setError] = useState(null);
  
  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    generateQuestion(newDifficulty);
  };

  // Modified generateQuestion to handle parsing better
  const generateQuestion = async (level = difficulty) => {
    setLoading(true);
    setQuestion(null);
    setSelectedAnswer('');
    setShowResult(false);
    setError(null);

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
            content: `Generate a unique and challenging vocabulary question for difficulty level ${level}/10. Choose a random type from this list: Synonyms & Antonyms, Word Meanings, Homophones, Idioms, Word Usage, Root Words. Format exactly as follows:
              Question Type: [selected type]
              Question: [challenging question appropriate for level ${level}]
              Options:
              - [option1]
              - [option2]
              - [option3]
              Correct Answer: [exact match with one option]
              Explanation: [brief explanation]
              
              For difficulty ${level}/10:
              - Level 1-3: Use common everyday words
              - Level 4-6: Use intermediate vocabulary
              - Level 7-8: Use advanced vocabulary
              - Level 9-10: Use scholarly or specialized terms`
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
        // Extract sections using split rather than regex
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
        if (!sections.type || !sections.question || !sections.options.length || !sections.correct || !sections.explanation) {
          throw new Error('Failed to parse response correctly');
        }
        
        // Ensure the correct answer is in the options
        if (!sections.options.includes(sections.correct)) {
          sections.options.push(sections.correct);
        }
        
        // Make sure we have exactly 3 options
        while (sections.options.length > 3) {
          const randomIndex = Math.floor(Math.random() * sections.options.length);
          if (sections.options[randomIndex] !== sections.correct) {
            sections.options.splice(randomIndex, 1);
          }
        }
        
        // Fill with dummy options if we don't have enough
        while (sections.options.length < 3) {
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
        if (!showDifficultySelect) {
          setQuestionCount(prev => prev + 1);
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

  const saveGameData = () => {
    if (currentUser && questionCount > 0 && !dataSaved) {
      try {
        const database = getDatabase();
        const wordPowerData = {
          time: new Date().toISOString(),
          attemptedQuestions: questionCount,
          score: score,
          difficulty: difficulty
        };

        const wordPowerRef = ref(
          database, 
          `users/${currentUser.uid}/word-power/${Date.now()}`
        );
        
        push(wordPowerRef, wordPowerData)
          .then(() => {
            console.log('Word Power data saved successfully');
            setDataSaved(true);
          })
          .catch(error => console.error('Error saving Word Power data:', error));
      } catch (error) {
        console.error('Error saving to database:', error);
      }
    }
  };

  const handleAnswerSubmit = () => {
    const correct = selectedAnswer === question.correct;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Update score based on correctness
    if (correct) {
      // Calculate score based on difficulty
      const pointsEarned = difficulty * 10;
      setScore(prev => prev + pointsEarned);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setShowDifficultySelect(false);
    // Reset score and stats when starting new game
    setScore(0);
    setQuestionCount(0);
    setDataSaved(false);
    generateQuestion(difficulty);
  };

  const changeDifficulty = () => {
    // Save data before changing difficulty if game was in progress
    if (questionCount > 0) {
      saveGameData();
    }
    setShowDifficultySelect(true);
    setGameStarted(false);
    setQuestion(null);
    setShowResult(false);
  };

  const handleNextQuestion = () => {
    generateQuestion();
  };

  const handleFinishGame = () => {
    saveGameData();
    navigate('/practice');
  };

  // Retry loading question if there was an error
  const retryQuestion = () => {
    generateQuestion(difficulty);
  };

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
            Word Power
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {gameStarted && (
              <Button
                variant="outlined"
                onClick={changeDifficulty}
                sx={{
                  borderColor: 'rgba(124, 58, 237, 0.4)',
                  color: '#A78BFA',
                  '&:hover': {
                    borderColor: '#7C3AED',
                    background: 'rgba(124, 58, 237, 0.1)',
                  }
                }}
              >
                Change Difficulty
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
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon sx={{ color: '#FFD700' }} />
                  <Typography variant="h6" sx={{ color: '#A78BFA' }}>
                    Score: {score}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: '#A78BFA' }}>
                    Difficulty:
                  </Typography>
                  <Chip 
                    label={`${difficulty}/10`} 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'rgba(124, 58, 237, 0.2)',
                      color: 'white'
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: '#A78BFA' }}>
                    Questions:
                  </Typography>
                  <Chip 
                    label={questionCount} 
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(124, 58, 237, 0.2)',
                      color: 'white'
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {showDifficultySelect ? (
            <Paper sx={{
              p: 4,
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(124, 58, 237, 0.1)',
              textAlign: 'center'
            }}>
              <Typography variant="h5" sx={{ color: '#A78BFA', mb: 3 }}>
                Select Difficulty Level
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 2, 
                mb: 3 
              }}>
                <Button
                  variant="contained"
                  onClick={() => setDifficulty(Math.max(1, difficulty - 1))}
                  sx={{ 
                    minWidth: '48px',
                    background: 'rgba(124, 58, 237, 0.2)',
                    '&:hover': { background: 'rgba(124, 58, 237, 0.3)' }
                  }}
                >
                  -
                </Button>
                <Typography variant="h4" sx={{ color: 'white', mx: 3 }}>
                  {difficulty}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setDifficulty(Math.min(10, difficulty + 1))}
                  sx={{ 
                    minWidth: '48px',
                    background: 'rgba(124, 58, 237, 0.2)',
                    '&:hover': { background: 'rgba(124, 58, 237, 0.3)' }
                  }}
                >
                  +
                </Button>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#A78BFA', mb: 2 }}>
                  Difficulty Guide:
                </Typography>
                <Grid container spacing={2} justifyContent="center">
                  <Grid item xs={3}>
                    <Paper sx={{ p: 2, background: 'rgba(30, 41, 59, 0.6)' }}>
                      <Typography sx={{ color: '#A78BFA' }}>Level 1-3</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>Common words</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 2, background: 'rgba(30, 41, 59, 0.6)' }}>
                      <Typography sx={{ color: '#A78BFA' }}>Level 4-6</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>Intermediate</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 2, background: 'rgba(30, 41, 59, 0.6)' }}>
                      <Typography sx={{ color: '#A78BFA' }}>Level 7-8</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>Advanced</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 2, background: 'rgba(30, 41, 59, 0.6)' }}>
                      <Typography sx={{ color: '#A78BFA' }}>Level 9-10</Typography>
                      <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>Scholarly</Typography>
                    </Paper>
                  </Grid>
                </Grid>
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ color: '#A78BFA' }}>
                            {question.type}
                          </Typography>
                          <Chip 
                            label={`Question ${questionCount}`} 
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(124, 58, 237, 0.2)',
                              color: 'white'
                            }}
                          />
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
                                      Correct! +{difficulty * 10} points
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

export default WordPower;