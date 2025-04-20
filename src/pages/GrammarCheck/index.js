import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { motion } from 'framer-motion';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PracticeLine from './PracticeLine';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';

const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GrammarCheck = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataSaved, setDataSaved] = useState(false);

  const handlePaste = async () => {
    try {
      const pastedText = await navigator.clipboard.readText();
      setText(pastedText);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const checkGrammar = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setDataSaved(false);
    
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
            content: `As a grammar checker, analyze this text and provide a clean report in exactly this format:
                     Grammar Accuracy Score: [0-100]
                     Sentence Structure Score: [0-100]
                     Punctuation Score: [0-100]

                     Mistakes Found:
                     1. [Error]: [Explanation of the rule violated]
                     2. [Error]: [Explanation of the rule violated]
                     (List all errors found)

                     Corrected Version:
                     [Write the corrected text without any additional formatting or symbols]

                     Text to analyze: "${text}"`
          }]
        })
      });

      const data = await response.json();
      const response_text = data.choices[0].message.content;
      
      // Parse scores
      const scores = {
        grammar: response_text.match(/Grammar Accuracy Score: (\d+)/)?.[1] || '0',
        structure: response_text.match(/Sentence Structure Score: (\d+)/)?.[1] || '0',
        punctuation: response_text.match(/Punctuation Score: (\d+)/)?.[1] || '0'
      };
      
      // Parse mistakes and corrected version
      const mistakes = response_text.split('Mistakes Found:')[1]?.split('Corrected Version:')[0]?.trim()
        .replace(/\*\*/g, '')  // Remove asterisks
        .replace(/\n\s*\n/g, '\n')  // Remove empty lines
        .trim();
      
      const corrected = response_text.split('Corrected Version:')[1]?.trim()
        .replace(/\*\*/g, '')  // Remove asterisks
        .replace(/\n\s*\n/g, '\n')  // Remove empty lines
        .trim();

      setResult({ scores, mistakes, corrected });
      
      // Save grammar check data to Firebase
      if (currentUser) {
        try {
          const database = getDatabase();
          const grammarCheckData = {
            time: new Date().toISOString(),
            grammarScore: parseInt(scores.grammar) || 0,
            structureScore: parseInt(scores.structure) || 0,
            punctuationScore: parseInt(scores.punctuation) || 0
          };

          const grammarCheckRef = ref(
            database, 
            `users/${currentUser.uid}/grammar-check/${Date.now()}`
          );
          
          push(grammarCheckRef, grammarCheckData)
            .then(() => {
              console.log('Grammar check data saved successfully');
              setDataSaved(true);
            })
            .catch(error => console.error('Error saving grammar check data:', error));
        } catch (error) {
          console.error('Error saving to database:', error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setResult(null);
    }
    
    setLoading(false);
  };

  // Update the result rendering section
  {result && (
    <Box sx={{ mt: 3 }}>
      <Paper sx={{ 
        p: 3,
        background: 'rgba(30, 41, 59, 0.6)',
        color: 'white',
        borderRadius: 2,
      }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ 
            mb: 2,
            color: '#A78BFA',
            fontWeight: 'bold' 
          }}>
            Grammar Analysis Scores
          </Typography>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2
          }}>
            {[
              { label: 'Grammar Accuracy', score: result.scores.grammar },
              { label: 'Sentence Structure', score: result.scores.structure },
              { label: 'Punctuation', score: result.scores.punctuation }
            ].map((item) => (
              <Paper key={item.label} sx={{
                p: 2,
                background: 'rgba(124, 58, 237, 0.1)',
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography variant="body2" sx={{ color: '#A78BFA', mb: 1 }}>
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ 
                  color: '#7C3AED',
                  fontWeight: 'bold'
                }}>
                  {item.score}/100
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ 
            mb: 2,
            color: '#A78BFA',
            fontWeight: 'bold'
          }}>
            Grammar Issues Found
          </Typography>
          <Paper sx={{ 
            p: 2,
            background: 'rgba(124, 58, 237, 0.1)',
            borderRadius: 2
          }}>
            <Typography sx={{ 
              whiteSpace: 'pre-line',
              color: 'white',
              lineHeight: 1.6
            }}>
              {result.mistakes}
            </Typography>
          </Paper>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ 
            mb: 2,
            color: '#A78BFA',
            fontWeight: 'bold'
          }}>
            Corrected Text
          </Typography>
          <Paper sx={{ 
            p: 2,
            background: 'rgba(124, 58, 237, 0.1)',
            borderRadius: 2
          }}>
            <Typography sx={{ 
              whiteSpace: 'pre-line',
              color: 'white',
              lineHeight: 1.6
            }}>
              {result.corrected}
            </Typography>
          </Paper>
        </Box>
      </Paper>
    </Box>
  )}
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ 
        p: 3,
        pr: '90px'  // Added right padding
      }}>
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
            Grammar Check
          </Typography>
          
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

        <PracticeLine onPracticeLine={(line) => setText(line)} show={!result} />

        <Paper sx={{ 
          p: 3,
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(124, 58, 237, 0.1)',
        }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              disabled={result !== null}  // Disable when result exists
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter or paste your text here..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  background: 'rgba(30, 41, 59, 0.4)',
                  '& fieldset': {
                    borderColor: 'rgba(124, 58, 237, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(124, 58, 237, 0.4)',
                  },
                  '&.Mui-disabled': {  // Style for disabled state
                    color: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(30, 41, 59, 0.2)',
                  }
                }
              }}
            />
            <Button
              onClick={handlePaste}
              sx={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white' }
              }}
            >
              <ContentPasteIcon />
            </Button>
          </Box>

          <Button
            variant="contained"
            onClick={result ? () => {
              setText('');
              setResult(null);
            } : checkGrammar}
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              mb: 2
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (result ? 'Check Again' : 'Check Grammar')}
          </Button>

          {result && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ 
                p: 3,
                background: 'rgba(30, 41, 59, 0.6)',
                color: 'white',
                borderRadius: 2,
              }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    mb: 2,
                    color: '#A78BFA',
                    fontWeight: 'bold' 
                  }}>
                    Grammar Analysis Scores
                  </Typography>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 2
                  }}>
                    {[
                      { label: 'Grammar Accuracy', score: result.scores.grammar },
                      { label: 'Sentence Structure', score: result.scores.structure },
                      { label: 'Punctuation', score: result.scores.punctuation }
                    ].map((item) => (
                      <Paper key={item.label} sx={{
                        p: 2,
                        background: 'rgba(124, 58, 237, 0.1)',
                        borderRadius: 2,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: '#A78BFA', mb: 1 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="h5" sx={{ 
                          color: '#7C3AED',
                          fontWeight: 'bold'
                        }}>
                          {item.score}/100
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    mb: 2,
                    color: '#A78BFA',
                    fontWeight: 'bold'
                  }}>
                    Grammar Issues Found
                  </Typography>
                  <Paper sx={{ 
                    p: 2,
                    background: 'rgba(124, 58, 237, 0.1)',
                    borderRadius: 2
                  }}>
                    <Typography sx={{ 
                      whiteSpace: 'pre-line',
                      color: 'white',
                      lineHeight: 1.6
                    }}>
                      {result.mistakes}
                    </Typography>
                  </Paper>
                </Box>

                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#A78BFA',
                      fontWeight: 'bold'
                    }}>
                      Corrected Text
                    </Typography>
                    <Button
                      onClick={() => navigator.clipboard.writeText(result.corrected)}
                      sx={{
                        minWidth: 'auto',
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { color: 'white' }
                      }}
                    >
                      <ContentCopyIcon />
                    </Button>
                  </Box>
                  <Paper sx={{ 
                    p: 2,
                    background: 'rgba(124, 58, 237, 0.1)',
                    borderRadius: 2
                  }}>
                    <Typography sx={{ 
                      whiteSpace: 'pre-line',
                      color: 'white',
                      lineHeight: 1.6
                    }}>
                      {result.corrected}
                    </Typography>
                  </Paper>
                </Box>
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>
    </motion.div>
  );
};

export default GrammarCheck;