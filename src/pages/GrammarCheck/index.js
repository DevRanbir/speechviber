import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress, 
  IconButton, 
  Grid, 
  Snackbar, 
  Alert, 
  useMediaQuery, 
  Collapse, 
  Divider,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PracticeLine from './PracticeLine';
import { useNavigate } from 'react-router-dom';
import { 
  getDatabase, 
  ref, 
  push, 
  get, 
  query, 
  orderByChild, 
  limitToLast, 
  set, 
  serverTimestamp 
} from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
import { motion } from 'framer-motion';

const API_KEY = process.env.REACT_APP_GROQ_API_KEY_2;
const API_URL = process.env.REACT_APP_GROQ_API_URL;

const GrammarCheck = () => {
  useErrorBoundary();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataSaved, setDataSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [savedTexts, setSavedTexts] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Fetch history when user opens history panel
  useEffect(() => {
    if (showHistory && currentUser && !history.length) {
      fetchHistory();
    }
  }, [showHistory, currentUser]);

  // Fetch saved texts when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchSavedTexts();
    }
  }, [currentUser]);

  const fetchHistory = async () => {
    if (!currentUser) return;
    
    setHistoryLoading(true);
    try {
      const database = getDatabase();
      const historyRef = query(
        ref(database, `users/${currentUser.uid}/grammar-check`),
        orderByChild('time'),
        limitToLast(10)
      );
      
      const snapshot = await get(historyRef);
      if (snapshot.exists()) {
        const historyData = [];
        snapshot.forEach((childSnapshot) => {
          historyData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        setHistory(historyData.reverse());
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      showSnackbar('Failed to load history', 'error');
    }
    setHistoryLoading(false);
  };

  const fetchSavedTexts = async () => {
    if (!currentUser) return;
    
    try {
      const database = getDatabase();
      const savedRef = ref(database, `users/${currentUser.uid}/saved-texts`);
      
      const snapshot = await get(savedRef);
      if (snapshot.exists()) {
        const savedData = [];
        snapshot.forEach((childSnapshot) => {
          savedData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        setSavedTexts(savedData);
      }
    } catch (error) {
      console.error('Error fetching saved texts:', error);
    }
  };

  const handlePaste = async () => {
    try {
      const pastedText = await navigator.clipboard.readText();
      setText(pastedText);
      showSnackbar('Text pasted successfully', 'success');
    } catch (err) {
      console.error('Failed to paste:', err);
      showSnackbar('Failed to paste text', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const saveText = async () => {
    if (!currentUser || !result) return;
    
    try {
      const database = getDatabase();
      const savedTextRef = ref(
        database, 
        `users/${currentUser.uid}/saved-texts/${Date.now()}`
      );
      
      await push(savedTextRef, {
        originalText: text,
        correctedText: result.corrected,
        mistakes: result.mistakes,
        scores: result.scores,
        timestamp: new Date().toISOString()
      });
      
      showSnackbar('Text saved successfully', 'success');
      fetchSavedTexts();
    } catch (error) {
      console.error('Error saving text:', error);
      showSnackbar('Failed to save text', 'error');
    }
  };

  const loadSavedText = (saved) => {
    setText(saved.originalText);
    setResult({
      scores: saved.scores,
      mistakes: saved.mistakes,
      corrected: saved.correctedText
    });
    setShowSaved(false);
    showSnackbar('Saved text loaded', 'success');
  };

  const deleteSavedText = async (id) => {
    if (!currentUser) return;
    
    try {
      const database = getDatabase();
      await ref(database, `users/${currentUser.uid}/saved-texts/${id}`).remove();
      
      setSavedTexts(savedTexts.filter(item => item.id !== id));
      showSnackbar('Text deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting saved text:', error);
      showSnackbar('Failed to delete text', 'error');
    }
  };

  const saveActivityData = async (grammarData) => {
      if (!currentUser || dataSaved) {
        console.log('Skipping data save:', { 
          currentUser: !!currentUser,
          dataSaved
        });
        return;
      }
    
      try {
        const database = getDatabase();
        const timestamp = Date.now();
        
        // Create activity data in the standard format
        const activityData = {
          date: new Date().toISOString(),
          description: `Completed grammar check with scores - Grammar: ${grammarData.scores.grammar}%, Structure: ${grammarData.scores.structure}%, Punctuation: ${grammarData.scores.punctuation}%`,
          duration: "10",
          id: `grammar_${timestamp}_${Math.round((parseInt(grammarData.scores.grammar) + parseInt(grammarData.scores.structure) + parseInt(grammarData.scores.punctuation)) / 3)}`,
          score: Math.round((parseInt(grammarData.scores.grammar) + parseInt(grammarData.scores.structure) + parseInt(grammarData.scores.punctuation)) / 3),
          type: "Grammar Check",
          completed: true
        };
    
        // Save to history/activities path
        const historyRef = ref(
          database,
          `users/${currentUser.uid}/history/data/${timestamp}/activities/0`
        );
    
        const grammarRef = ref(
          database,
          `users/${currentUser.uid}/grammar-check/${timestamp}`
        );
    
        // Save both activity data and detailed grammar check data
        Promise.all([
          set(historyRef, activityData),
          push(grammarRef, {
            time: new Date().toISOString(),
            accuracy: Math.round((parseInt(grammarData.scores.grammar) + parseInt(grammarData.scores.structure) + parseInt(grammarData.scores.punctuation)) / 3),
            originalText: grammarData.originalText,
            correctedText: grammarData.correctedText,
            grammarScore: parseInt(grammarData.scores.grammar) || 0,
            structureScore: parseInt(grammarData.scores.structure) || 0,
            punctuationScore: parseInt(grammarData.scores.punctuation) || 0,
          })
        ])
      .then(() => {
        console.log('Grammar check data saved successfully');
        setDataSaved(true);
        setSaveError(null);
      })
      .catch(error => {
        console.error('Error saving to database:', error);
        setSaveError('Failed to save your progress. Please try again.');
        showSnackbar('Error saving check data', 'error');
      });
  
    } catch (error) {
      console.error('Error saving to database:', error);
      setSaveError('Failed to save your progress. Please try again.');
      showSnackbar('Error saving check data', 'error');
    }
  };

  const checkGrammar = async () => {
    if (!text.trim()) {
      showSnackbar('Please enter some text', 'warning');
      return;
    }
    
    setLoading(true);
    setDataSaved(false);
    
    try {
      // Check if the text is perfect already (save API call if it is)
      // This is a simple check to see if the text is likely grammatically correct
      // A more sophisticated check would be needed for a real application
      
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

      // Check if original text is same as corrected
      const isTextPerfect = text.trim() === corrected.trim();
      
      // If original text equals corrected text, set all scores to 0
      // This is based on the request to give zero in all scores if the input is the same as edited
      const finalScores = isTextPerfect 
        ? { grammar: '0', structure: '0', punctuation: '0' } 
        : scores;
      
      setResult({ 
        scores: finalScores, 
        mistakes: isTextPerfect ? 'No mistakes found.' : mistakes, 
        corrected: corrected 
      });
      
      // Save grammar check data to Firebase
      if (currentUser) {
        const grammarCheckData = {
          originalText: text,
          correctedText: corrected,
          scores: finalScores,
        };

        await saveActivityData(grammarCheckData);
        showSnackbar('Grammar check completed', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      setResult(null);
      showSnackbar('Error checking grammar', 'error');
    }
    
    setLoading(false);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Text copied to clipboard', 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ 
        p: { xs: 2, sm: 3 },
        pr: { xs: 2, sm: '90px' }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}>
          <Typography variant="h4" sx={{ 
            background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            fontSize: { xs: '1.75rem', sm: '2.125rem' }
          }}>
            Grammar Check
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            mt: { xs: 1, sm: 0 },
            width: { xs: '100%', sm: 'auto' }
          }}>
            {isMobile ? (
              <IconButton
                onClick={() => navigate('/practice')}
                sx={{
                  borderColor: 'rgba(124, 58, 237, 0.4)',
                  color: '#A78BFA',
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            ) : (
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
            )}
            
            {currentUser && (
              <>
                <Tooltip title="View History">
                  <IconButton
                    onClick={() => {
                      setShowHistory(!showHistory);
                      setShowSaved(false);
                    }}
                    sx={{
                      color: showHistory ? '#7C3AED' : '#A78BFA',
                      '&:hover': { color: '#7C3AED' }
                    }}
                  >
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Saved Texts">
                  <IconButton
                    onClick={() => {
                      setShowSaved(!showSaved);
                      setShowHistory(false);
                    }}
                    sx={{
                      color: showSaved ? '#7C3AED' : '#A78BFA',
                      '&:hover': { color: '#7C3AED' }
                    }}
                  >
                    <BookmarkIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* History Panel */}
        <Collapse in={showHistory}>
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(124, 58, 237, 0.1)',
          }}>
            <Typography variant="h6" sx={{ color: '#A78BFA', mb: 2 }}>
              Recent Grammar Checks
            </Typography>
            
            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} sx={{ color: '#7C3AED' }} />
              </Box>
            ) : history.length > 0 ? (
              <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {history.map((item, index) => (
                  <Paper 
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      background: 'rgba(124, 58, 237, 0.1)',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        background: 'rgba(124, 58, 237, 0.2)',
                      }
                    }}
                    onClick={() => {
                      setText(item.originalText || '');
                      if (item.correctedText) {
                        setResult({
                          scores: {
                            grammar: item.grammarScore || 0,
                            structure: item.structureScore || 0,
                            punctuation: item.punctuationScore || 0
                          },
                          mistakes: '', // History might not have this
                          corrected: item.correctedText
                        });
                      }
                      setShowHistory(false);
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                      {new Date(item.time).toLocaleString()}
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: 'white', 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.originalText ? item.originalText.substring(0, 50) + '...' : 'No text available'}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      mt: 1 
                    }}>
                      {[
                        { label: 'Grammar', score: item.grammarScore },
                        { label: 'Structure', score: item.structureScore },
                        { label: 'Punctuation', score: item.punctuationScore }
                      ].map((score) => (
                        <Box key={score.label} sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#A78BFA' }}>
                            {score.label}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#7C3AED', fontWeight: 'bold' }}>
                            {score.score}/100
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography sx={{ color: 'white', textAlign: 'center', p: 2 }}>
                No history available
              </Typography>
            )}
          </Paper>
        </Collapse>

        {/* Saved Texts Panel */}
        <Collapse in={showSaved}>
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(124, 58, 237, 0.1)',
          }}>
            <Typography variant="h6" sx={{ color: '#A78BFA', mb: 2 }}>
              Saved Texts
            </Typography>
            
            {savedTexts.length > 0 ? (
              <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {savedTexts.map((item, index) => (
                  <Paper 
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      background: 'rgba(124, 58, 237, 0.1)',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1
                    }}>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Typography>
                      <Box>
                        <IconButton 
                          size="small"
                          onClick={() => loadSavedText(item)}
                          sx={{ color: '#A78BFA' }}
                        >
                          <ContentPasteIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => deleteSavedText(item.id)}
                          sx={{ color: '#A78BFA' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography 
                      sx={{ 
                        color: 'white', 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.originalText ? item.originalText.substring(0, 50) + '...' : 'No text available'}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography sx={{ color: 'white', textAlign: 'center', p: 2 }}>
                No saved texts
              </Typography>
            )}
          </Paper>
        </Collapse>

        <PracticeLine onPracticeLine={(line) => setText(line)} show={!result} />

        <Paper sx={{ 
          p: { xs: 2, sm: 3 },
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
            <IconButton
              onClick={handlePaste}
              disabled={result !== null}
              sx={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white' }
              }}
            >
              <ContentPasteIcon />
            </IconButton>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button
              fullWidth
              variant="contained"
              onClick={result ? () => {
                setText('');
                setResult(null);
                setDataSaved(false);
              } : checkGrammar}
              disabled={loading}
              sx={{
                background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                mb: 2
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (result ? 'Check Again' : 'Check Grammar')}
            </Button>

            {result && currentUser && (
              <Button
                fullWidth
                variant="outlined"
                onClick={saveText}
                sx={{
                  borderColor: 'rgba(124, 58, 237, 0.4)',
                  color: '#A78BFA',
                  mb: 2,
                  '&:hover': {
                    borderColor: '#7C3AED',
                    background: 'rgba(124, 58, 237, 0.1)',
                  }
                }}
                startIcon={<BookmarkBorderIcon />}
              >
                Save Text
              </Button>
            )}
          </Box>

          {result && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ 
                p: { xs: 2, sm: 3 },
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
                  <Grid container spacing={2}>
                    {[
                      { label: 'Grammar Accuracy', score: result.scores.grammar },
                      { label: 'Sentence Structure', score: result.scores.structure },
                      { label: 'Punctuation', score: result.scores.punctuation }
                    ].map((item) => (
                      <Grid item xs={12} sm={4} key={item.label}>
                        <Paper sx={{
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
                            fontWeight: 'bold',
                            fontSize: { xs: '1.5rem', sm: '1.75rem' }
                          }}>
                            {item.score}/100
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Divider sx={{ my: 3, borderColor: 'rgba(124, 58, 237, 0.2)' }} />

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
                      {result.mistakes || 'No mistakes found'}
                    </Typography>
                  </Paper>
                </Box>

                <Divider sx={{ my: 3, borderColor: 'rgba(124, 58, 237, 0.2)' }} />

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
                    <Tooltip title="Copy to clipboard">
                      <IconButton
                        onClick={() => handleCopyText(result.corrected)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': { color: 'white' }
                        }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
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

      {/* Global Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            backgroundColor: snackbar.severity === 'success' ? 'rgba(124, 58, 237, 0.9)' : undefined,
            color: snackbar.severity === 'success' ? 'white' : undefined,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default GrammarCheck;