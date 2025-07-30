import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Paper } from '@mui/material';
import { getGroqApiKey2Synch, getGroqApiUrlSynch } from '../../utils/apiKeys';

// API Configuration - now loaded from Firebase
const getApiKey = () => getGroqApiKey2Synch();
const getApiUrl = () => getGroqApiUrlSynch();

const PracticeLine = ({ onPracticeLine, show }) => {
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');

  if (!show) return null;

  const generatePracticeLine = async () => {
    setLoading(true);
    const difficulties = ['easy', 'medium', 'hard'];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    setDifficulty(randomDifficulty);

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
            content: `Generate a ${randomDifficulty} level English sentence with random grammar mistakes. Follow these rules:
                     - For easy: Include 1-2 basic errors (articles, singular/plural, basic tense)
                     - For medium: Include 2-3 moderate errors (verb agreement, prepositions, complex tenses)
                     - For hard: Include 3-4 advanced errors (complex clauses, conditionals, advanced tenses)
                     - Mix different types of errors
                     - Make the sentence context random (business, casual, academic, etc.)
                     - Just return the sentence with errors, nothing else.`
          }]
        })
      });

      const data = await response.json();
      const practiceLine = data.choices[0].message.content.trim();
      onPracticeLine(practiceLine);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 3,
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(124, 58, 237, 0.1)',
    }}>
      <Typography sx={{ 
        mb: 2,
        color: 'white',
        textAlign: 'center'
      }}>
        Practice Mode: Generate random {difficulty} difficulty sentences to improve your grammar skills!
      </Typography>
      <Button
        variant="contained"
        onClick={generatePracticeLine}
        disabled={loading}
        sx={{
          background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
          width: '100%',
          py: 1.5,
          fontSize: '1rem',
          '&:hover': {
            background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
          }
        }}
      >
        {loading ? 
          <CircularProgress size={24} sx={{ color: 'white' }} /> : 
          'Generate Random Practice Sentence'
        }
      </Button>
    </Paper>
  );
};

export default PracticeLine;