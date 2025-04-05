'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, CircularProgress, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { motion } from 'framer-motion';

const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const WordPower = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Add new function to handle difficulty change
  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    generateQuestion(newDifficulty);
  };

  // Modify generateQuestion to accept difficulty
  // Modify generateQuestion to use Groq API
  const generateQuestion = async (level = difficulty) => {
    setLoading(true);
    setQuestion(null);
    setSelectedAnswer('');
    setShowResult(false);

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
      const responseText = data.choices[0].message.content;
      
      // Parse all components
      const type = responseText.match(/Question Type:\s*(.*?)(?=\n)/)?.[1]?.trim() || '';
      const questionText = responseText.match(/Question:\s*(.*?)(?=\n)/)?.[1]?.trim() || '';
      const optionsSection = responseText.split('Options:')[1]?.split('Correct Answer:')[0] || '';
      const options = optionsSection
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(1).trim());
      
      const correct = responseText.match(/Correct Answer:\s*(.*?)(?=\n)/)?.[1]?.trim() || '';
      const explanation = responseText.match(/Explanation:\s*(.*?)(?=$)/s)?.[1]?.trim() || '';

      if (type && questionText && options.length === 3 && correct && explanation) {
        const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
        setQuestion({
          type,
          question: questionText,
          options: shuffledOptions,
          correct,
          explanation
        });
      } else {
        console.error('Invalid response format:', { type, questionText, options, correct, explanation });
        setQuestion(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setQuestion(null);
    }
    setLoading(false);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === question.correct) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
    setShowResult(true);
  };


  const startGame = () => {
    setGameStarted(true);
    setShowDifficultySelect(false);
    generateQuestion(difficulty);
  };

  const changeDifficulty = () => {
    setShowDifficultySelect(true);
    setGameStarted(false);
    setQuestion(null);
    setShowResult(false);
  };

  return (
    <Box sx={{ minHeight: '93vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', p: 3, pr: '90px' }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3 
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

        {showDifficultySelect ? (
          <Paper sx={{
            p: 4,
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(124, 58, 237, 0.1)',
            textAlign: 'center'
          }}>
            <Typography variant="h5" sx={{ color: '#A78BFA', mb: 4 }}>
              Select Difficulty Level
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2, 
              mb: 4 
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
                minHeight: '300px' 
              }}>
                <CircularProgress sx={{ 
                  color: '#A78BFA',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} />
              </Box>
            ) : (
              <>
                {question && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Paper sx={{
                      p: 4,
                      background: 'rgba(30, 41, 59, 0.4)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(124, 58, 237, 0.1)',
                      mb: 3
                    }}>
                      <Typography variant="h6" sx={{ color: '#A78BFA', mb: 1 }}>
                        {question.type}
                      </Typography>
                      
                      <Typography variant="h5" sx={{ color: 'white', mb: 4 }}>
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
                            control={<Radio sx={{ 
                              color: '#A78BFA',
                              '&.Mui-checked': {
                                color: showResult && option === question.correct ? '#4ade80' : 
                                      showResult ? '#f87171' : '#A78BFA'
                              },
                            }} />}
                            label={option}
                            sx={{
                              mb: 2,
                              color: showResult && option === question.correct ? '#4ade80' : 'white',
                              backgroundColor: showResult && option === question.correct ? 'rgba(34, 197, 94, 0.1)' : 
                                             showResult && option === selectedAnswer ? 'rgba(239, 68, 68, 0.1)' : 
                                             'transparent',
                              borderRadius: 1,
                              '&:hover': { 
                                background: !showResult && 'rgba(124, 58, 237, 0.1)' 
                              }
                            }}
                          />
                        ))}
                      </RadioGroup>

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

                      {showResult && (
                        <Box sx={{ mt: 3, p: 2, background: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}>
                          <Typography sx={{ color: isCorrect ? '#4ade80' : '#f87171', mb: 1 }}>
                            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                          </Typography>
                          <Typography sx={{ color: 'white' }}>
                            {question.explanation}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </motion.div>
                )}

                {showResult && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    mt: 3 
                  }}>
                    <Button
                      variant="contained"
                      onClick={() => generateQuestion()}
                      sx={{
                        background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                        py: 1.5,
                        px: 4
                      }}
                    >
                      Next Question
                    </Button>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default WordPower;