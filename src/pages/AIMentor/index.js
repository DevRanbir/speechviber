import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Stack, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { motion, AnimatePresence } from 'framer-motion';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const AIMentor = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Add timestamp when creating messages
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Add user message to chat with timestamp
    setMessages(prev => [...prev, { 
      text: userMessage, 
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

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
            content: `${userMessage.toLowerCase().includes('how') || 
                     userMessage.toLowerCase().includes('ways') || 
                     userMessage.toLowerCase().includes('explain') || 
                     userMessage.toLowerCase().includes('tell me about') ? 
                     `act as you are a PD Mentor working at speechviber but dont be specific about speechviber, provide 6-7 points for: ${userMessage}. Format with bullet points and be specific with each point.just get to answer in a concise manner. dont write here are 6 points` :
                     `act as you are a PD Mentor working at speechviber but dont be specific about speechviber, provide a brief and concise response to: ${userMessage}. Keep it short and to the point, enough to make student understand.`}`
          }]
        })
      });

      const data = await response.json();
      let aiResponse = data.choices[0].message.content
        .replace(/\*/g, '')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim())
        .join('\n\n');

      // Make responses more concise only for non-detailed questions
      if (!userMessage.toLowerCase().includes('how') && 
          !userMessage.toLowerCase().includes('ways') && 
          !userMessage.toLowerCase().includes('explain') && 
          !userMessage.toLowerCase().includes('tell me about') && 
          aiResponse.length > 200) {
        aiResponse = aiResponse
          .split('\n')
          .slice(0, 3)
          .join('\n')
          .substring(0, 200) + '...';
      }
      
      // Custom response for identity questions
      if (userMessage.toLowerCase().includes('who are you') || 
          userMessage.toLowerCase().includes('what are you')|| 
          userMessage.toLowerCase().includes('what are u')|| 
          userMessage.toLowerCase().includes('who are u')|| 
          userMessage.toLowerCase().includes('who made u')) {
        aiResponse = "Hi! I'm your AI mentor in SpeechViber. I'm here to help you improve your communication skills and personal growth. What would you like to work on?";
      }
      
      // Update the AI response section in handleSend
      setMessages(prev => [...prev, { 
        text: aiResponse, 
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      
      // Update the message rendering section within the mapping
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: message.isUser ? 'flex-start' : 'flex-end',
              width: '100%',
            }}
          >
            <Paper
              sx={{
                p: 2,
                background: message.isUser 
                  ? 'rgba(30, 41, 59, 0.6)'
                  : 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                borderRadius: 2,
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                width: 'fit-content',
                maxWidth: '70%',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                }
              }}
            >
              <Typography
                sx={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  letterSpacing: '0.01em',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  pr: !message.isUser ? '32px' : 0
                }}
              >
                {message.text}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  mt: 0.5,
                  textAlign: 'right'
                }}
              >
                {message.timestamp}
              </Typography>
              {!message.isUser && (
                <Button
                  onClick={() => handleCopy(message.text)}
                  sx={{
                    position: 'absolute',
                    right: '4px',
                    top: '4px',
                    minWidth: 'auto',
                    p: '4px',
                    color: copied ? '#4CAF50' : 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { color: 'white' }
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </Button>
              )}
            </Paper>
          </Box>
        </motion.div>
      ))}
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I couldn't process that request. Please try again.", 
        isUser: false 
      }]);
    }

    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ 
        height: '93vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        pr: '90px',
        overflow: 'hidden',  // Prevent outer scroll
        
      }}>
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ 
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              AI Mentor Chat
            </Typography>
            <Button
              onClick={() => setMessages([])}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'white',
                  background: 'rgba(124, 58, 237, 0.1)'
                }
              }}
            >
              Clear Chat
            </Button>
          </Box>
        </motion.div>

        <Paper sx={{ 
          flex: 1,
          mb: 2,
          p: 2,
          overflowY: 'auto',
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '5px dotted',
          borderColor: 'rgba(124, 58, 237, 0.28)',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(30, 41, 59, 0.2)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
            borderRadius: '10px',
            '&:hover': {
              background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
            },
          },
        }}>
          <Stack spacing={2}>
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.isUser ? 'flex-start' : 'flex-end',
                      width: '100%',
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        background: message.isUser 
                          ? 'rgba(30, 41, 59, 0.6)'
                          : 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                        borderRadius: 2,
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        width: 'fit-content',
                        maxWidth: '70%',
                        position: 'relative',
                        mb: 0.5,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          lineHeight: 1.6,
                          letterSpacing: '0.01em',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          pr: !message.isUser ? '32px' : 0
                        }}
                      >
                        {message.text}
                      </Typography>
                      {!message.isUser && (
                        <Button
                          onClick={() => handleCopy(message.text)}
                          sx={{
                            position: 'absolute',
                            right: '4px',
                            top: '4px',
                            minWidth: 'auto',
                            p: '4px',
                            color: copied ? '#4CAF50' : 'rgba(255, 255, 255, 0.7)',
                            '&:hover': { color: 'white' }
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </Button>
                      )}
                    </Paper>
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        opacity: 0.7,
                        color: 'rgba(255, 255, 255, 0.8)',
                        px: 1
                      }}
                    >
                      {message.timestamp}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </Stack>
        </Paper>

        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Update the TextField section */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ position: 'relative', width: '100%' }}>
              <TextField
                fullWidth
                variant="outlined"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your mentor anything..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    pr: '40px',
                    '& fieldset': {
                      borderColor: 'rgba(124, 58, 237, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(124, 58, 237, 0.4)',
                    },
                  }
                }}
              />
              <Button
                onClick={handlePaste}
                sx={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  minWidth: 'auto',
                  p: '6px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { color: 'white' }
                }}
              >
                <ContentPasteIcon fontSize="small" />
              </Button>
            </Box>
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={loading}
              sx={{
                background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                minWidth: '64px',
                height: '56px'
              }}
            >
              {loading ? <CircularProgress size={24} /> : <SendIcon />}
            </Button>
          </Box>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default AIMentor;