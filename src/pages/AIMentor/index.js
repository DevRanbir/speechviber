import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Stack, 
  CircularProgress,
  IconButton,
  useMediaQuery,
  Tooltip,
  Avatar,
  Chip,
  Backdrop,
  Fade,
  useTheme,
  Divider,
  Menu,
  MenuItem,
  Slider,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import ImageIcon from '@mui/icons-material/Image';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DoneIcon from '@mui/icons-material/Done';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SpeedIcon from '@mui/icons-material/Speed';
import SchoolIcon from '@mui/icons-material/School';
import FaceIcon from '@mui/icons-material/Face';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import TuneIcon from '@mui/icons-material/Tune';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { InputAdornment } from '@mui/material';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
import { getGroqApiKey1Synch, getGroqApiUrlSynch } from '../../utils/apiKeys';

// Note: API keys are now loaded from Firebase
// These will be null initially until the environment service loads them
const getApiKey = () => getGroqApiKey1Synch();
const getApiUrl = () => getGroqApiUrlSynch();

// Suggested conversation starters
const CONVERSATION_STARTERS = [
  "How can I improve my public speaking skills?",
  "What are some effective communication techniques for presentations?",
  "How do I handle difficult conversations at work?",
  "Tips for active listening in meetings?",
  "How to build rapport with new colleagues?",
  "Ways to manage nervousness before speaking?"
];

// Mentor topics for side menu
const MENTOR_TOPICS = [
  { title: "Communication Skills", icon: <SmartToyIcon />, count: 8 },
  { title: "Leadership Development", icon: <SchoolIcon />, count: 6 },
  { title: "Personal Growth", icon: <FaceIcon />, count: 10 },
  { title: "Career Advancement", icon: <SpeedIcon />, count: 5 },
];

const AIMentor = () => {
  useErrorBoundary();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [showStarters, setShowStarters] = useState(true);
  const [responseLength, setResponseLength] = useState(20);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);

  const navigate = useNavigate();
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Add welcome message when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        text: "Hello! I'm your AI Mentor. I'm here to help you develop your communication and leadership skills. How can I assist you today?",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isIntro: true
      }]);
    }
  }, []);

  // Handle sending messages
  const handleSend = async () => {
    if (!input.trim() && !currentImage) return;

    const userMessage = input;
    setInput('');
    setLoading(true);
    setShowStarters(false);

    // Create message object
    const newUserMessage = {
      text: userMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: currentImage
    };

    // Add user message to chat
    setMessages(prev => [...prev, newUserMessage]);

    try {
      let requestBody = {
        model: "compound-beta",
        messages: []
      };

      // Prepare messages for API request with length preference
      if (currentImage) {
        // When an image is included, use a vision model
        requestBody = {
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `${userMessage ? userMessage : "What's in this image? Please describe it and provide insights."}`
              },
              {
                type: "image_url",
                image_url: {
                  url: currentImage
                }
              }
            ]
          }]
        };
      } else {
        // Text-only request with length adjustment
        const lengthInstruction = responseLength < 30 ? 
          "Keep your response very brief and concise." : 
          responseLength > 70 ? 
          "Provide a comprehensive and detailed response." : 
          "Give a balanced, moderate-length response.";
        
        requestBody = {
          model: "compound-beta",
          messages: [{
            role: "user",
            content: `act as you are a Professional Development Mentor working at speechviber in india but don't be specific about speechviber. ${lengthInstruction} ${userMessage.toLowerCase().includes('how') || 
                userMessage.toLowerCase().includes('ways') || 
                userMessage.toLowerCase().includes('explain') || 
                userMessage.toLowerCase().includes('tell me about') ? 
                `provide ${responseLength > 70 ? '6-8' : '3-5'} points for: ${userMessage}. Format with bullet points and be specific with each point. Don't use lengthy introductions.` :
                `provide a ${responseLength < 30 ? 'very brief and concise' : responseLength > 70 ? 'thorough and detailed' : 'balanced'} response to: ${userMessage}. Keep it focused and practical.`}`
          }]
        };
      }

      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApiKey()}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      let aiResponse = "";

      if (data.choices && data.choices[0] && data.choices[0].message) {
        if (typeof data.choices[0].message.content === 'string') {
          aiResponse = data.choices[0].message.content;
        } else if (Array.isArray(data.choices[0].message.content)) {
          // Handle structured content from vision models
          aiResponse = data.choices[0].message.content
            .filter(item => item.type === 'text')
            .map(item => item.text)
            .join('\n');
        }
      }

      // Clean up and format response
      aiResponse = aiResponse
        .replace(/\*/g, '')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim())
        .join('\n\n');

      // Make responses more concise based on the responseLength slider
      if (responseLength < 30 && 
          !userMessage.toLowerCase().includes('how') && 
          !userMessage.toLowerCase().includes('ways') && 
          !userMessage.toLowerCase().includes('explain') && 
          !userMessage.toLowerCase().includes('tell me about') && 
          !currentImage && 
          aiResponse.length > 150) {
        aiResponse = aiResponse
          .split('\n')
          .slice(0, 2)
          .join('\n')
          .substring(0, 150) + '...';
      }
      
      // Custom response for identity questions
      if (userMessage.toLowerCase().includes('who are you') || 
          userMessage.toLowerCase().includes('what are you')|| 
          userMessage.toLowerCase().includes('what are u')|| 
          userMessage.toLowerCase().includes('who are u')|| 
          userMessage.toLowerCase().includes('who made u')) {
        aiResponse = "Hi! I'm your AI mentor in SpeechViber. I'm here to help you improve your communication skills and personal growth. What would you like to work on?";
      }
      
      // Add AI response to chat
      setMessages(prev => [...prev, { 
        text: aiResponse, 
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      // Clear the image after sending
      setCurrentImage(null);
      
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I couldn't process that request. Please try again.", 
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const goBack = () => {
    navigate('/practice');
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      console.error("Please upload an image file (JPEG/JPG or PNG)");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setCurrentImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Speech to text functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        // Create a FormData object to send the audio file
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('model', 'distil-whisper-large-v3-en');
        
        setLoading(true);
        try {
          const response = await fetch(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${getApiKey()}`
              },
              body: formData
            }
          );
          
          const data = await response.json();
          // Update the input field with the transcribed text
          setInput(prev => prev + ' ' + data.text);
        } catch (err) {
          console.error("Speech-to-text error:", err);
          setMessages(prev => [...prev, { 
            text: "Failed to convert speech to text. Please try typing your message instead.", 
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } finally {
          setLoading(false);
        }
      };
      
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setMessages(prev => [...prev, { 
        text: "Could not access microphone. Please check permissions.", 
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      
      // Also stop all tracks in the stream
      const stream = mediaRecorderRef.current.stream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      
      setRecording(false);
    }
  };

  // Reset current image
  const handleResetImage = () => {
    setCurrentImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle conversation starter click
  const handleStarterClick = (starter) => {
    setInput(starter);
    setShowStarters(false);
  };

  // Format message text (convert bullet points to proper formatting)
  const formatMessageText = (text) => {
    if (!text) return '';
    
    // Check if text contains bullet points
    if (text.includes('•') || text.includes('-') || /^\d+\./.test(text)) {
      return text.split('\n\n').map((paragraph, idx) => {
        // Check if paragraph starts with bullet point or number
        if (paragraph.trim().startsWith('•') || 
            paragraph.trim().startsWith('-') || 
            /^\d+\./.test(paragraph.trim())) {
          return (
            <Typography 
              component="div" 
              key={idx} 
              sx={{ mb: 1 }}
            >
              {paragraph}
            </Typography>
          );
        }
        return (
          <Typography 
            component="div" 
            key={idx} 
            sx={{ mb: 1 }}
          >
            {paragraph}
          </Typography>
        );
      });
    }
    
    return text;
  };

  // Handle message context menu
  const handleMessageContextMenu = (event, index) => {
    event.preventDefault();
    setContextMenuAnchor(event.currentTarget);
    setSelectedMessageIndex(index);
  };

  // Close context menu
  const handleCloseContextMenu = () => {
    setContextMenuAnchor(null);
    setSelectedMessageIndex(null);
  };

  // Delete message
  const handleDeleteMessage = () => {
    if (selectedMessageIndex !== null) {
      setMessages(messages.filter((_, index) => index !== selectedMessageIndex));
    }
    handleCloseContextMenu();
  };

  // Settings drawer
  const renderSettingsDrawer = () => (
    <SwipeableDrawer
      anchor="right"
      open={settingsDrawerOpen}
      onClose={() => setSettingsDrawerOpen(false)}
      onOpen={() => setSettingsDrawerOpen(true)}
      PaperProps={{
        sx: {
          width: isMobile ? '85%' : 320,
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          borderLeft: '1px solid rgba(124, 58, 237, 0.2)',
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={() => setSettingsDrawerOpen(false)}
            sx={{ mr: 1, color: 'white' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Mentor Settings
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
          Response Length
        </Typography>
        
        <Box sx={{ px: 1, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Concise</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Detailed</Typography>
          </Box>

          <Slider
            value={responseLength}
            onChange={(e, newValue) => setResponseLength(newValue)}
            aria-labelledby="response-length-slider"
            valueLabelDisplay="auto"
            step={10}
            marks
            min={10}
            max={90}
            sx={{
              color: '#7C3AED',
              '& .MuiSlider-thumb': {
                height: 20,
                width: 20,
                backgroundColor: '#fff',
                '&:hover, &.Mui-active': {
                  boxShadow: '0 0 0 8px rgba(124, 58, 237, 0.16)',
                },
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 1,
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            borderRadius: 2,
            p: 1
          }}>
            <Typography variant="body2" sx={{ color: 'white', textAlign: 'center' }}>
              {responseLength < 30 ? 'Short & direct responses' : 
              responseLength < 70 ? 'Balanced explanations' : 
              'Comprehensive guidance'}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={() => {
            setMessages([{
              text: "Hello! I'm your AI Mentor. I'm here to help you develop your communication and leadership skills. How can I assist you today?",
              isUser: false,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isIntro: true
            }]);
            setShowStarters(true);
            setSettingsDrawerOpen(false);
          }}
          startIcon={<DeleteSweepIcon />}
          sx={{ 
            mb: 2,
            background: 'rgba(239, 68, 68, 0.8)',
            '&:hover': {
              background: 'rgba(239, 68, 68, 1)',
            }
          }}
        >
          Clear Conversation
        </Button>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ExitToAppIcon />}
          onClick={goBack}
          sx={{ 
            color: 'white',
            borderColor: 'rgba(124, 58, 237, 0.5)',
            '&:hover': {
              borderColor: 'rgba(124, 58, 237, 0.8)',
              background: 'rgba(124, 58, 237, 0.1)'
            }
          }}
        >
          Exit to Dashboard
        </Button>
      </Box>
    </SwipeableDrawer>
  );

  // Side menu drawer
  const renderSideMenu = () => (
    <SwipeableDrawer
      anchor="left"
      open={sideMenuOpen}
      onClose={() => setSideMenuOpen(false)}
      onOpen={() => setSideMenuOpen(true)}
      PaperProps={{
        sx: {
          width: isMobile ? '85%' : 300,
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          borderRight: '1px solid rgba(124, 58, 237, 0.2)',
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: 'transparent',
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            <PsychologyIcon />
          </Avatar>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Mentor Hub
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Typography variant="subtitle2" sx={{ color: 'white', mb: 2, px: 1 }}>
          Learning Pathways
        </Typography>
        
        <List>
          {MENTOR_TOPICS.map((topic, index) => (
            <ListItem 
              key={index}
              button
              sx={{
                borderRadius: 2,
                mb: 1,
                '&:hover': {
                  background: 'rgba(124, 58, 237, 0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ color: '#7C3AED', minWidth: 40 }}>
                {topic.icon}
              </ListItemIcon>
              <ListItemText 
                primary={topic.title} 
                primaryTypographyProps={{ 
                  color: 'white',
                  fontWeight: 500
                }} 
              />
              <Chip 
                label={topic.count} 
                size="small"
                sx={{ 
                  background: 'rgba(124, 58, 237, 0.2)',
                  color: 'white',
                  height: 24,
                  minWidth: 28
                }}
              />
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Button
          fullWidth
          variant="contained"
          startIcon={<ExitToAppIcon />}
          sx={{ 
            background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
            '&:hover': {
              background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
            }
          }}
        >
          Return to Dashboard
        </Button>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      pr: isMobile ? 0 : isMediumScreen ? '16px' : '60px',  // Space for right sidebar on desktop
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header with gradient */}
      <Box 
        component={motion.div}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{ 
          p: 2, 
          pb: 1,
          background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <IconButton 
              onClick={() => setSideMenuOpen(true)}
              sx={{ 
                mr: 1.5, 
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': { color: 'white' }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Avatar
            sx={{
              bgcolor: 'transparent',
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              mr: 1.5,
              width: 40,
              height: 40
            }}
          >
            <PsychologyIcon />
          </Avatar>
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              mb: 0
            }}>
              AI Mentor
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Your personal growth companion
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Settings">
            <IconButton
              onClick={() => setSettingsDrawerOpen(true)}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                mr: 1,
                '&:hover': {
                  color: 'white',
                  background: 'rgba(124, 58, 237, 0.1)'
                }
              }}
            >
              <TuneIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Exit to Dashboard">
            <IconButton
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'white',
                  background: 'rgba(124, 58, 237, 0.1)'
                }
              }}
              onClick={goBack}
            >
              <ExitToAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper 
      ref={chatContainerRef}
      sx={{ 
        flex: 1,
        p: 2,
        overflowY: 'auto',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        paddingRight: isMobile ? 2 : 3, // More padding space on desktop
        paddingBottom: isMobile ? '80px' : '90px', // Add padding to account for fixed input area
        marginBottom: isMobile ? '56px' : '64px', // Add margin to prevent content being hidden behind input area
        '&::-webkit-scrollbar': {
          width: '6px',
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
      }}
    >
        <Stack spacing={2} sx={{ flex: 1 }}>
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onContextMenu={(e) => handleMessageContextMenu(e, index)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: message.isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    width: '100%',
                    mb: 1.5,
                  }}
                >
                  {/* Avatar for AI messages */}
                  {!message.isUser && (
                    <Avatar
                      sx={{
                        bgcolor: 'transparent',
                        background: message.isIntro ? 'linear-gradient(45deg, #7C3AED, #3B82F6)' : 'rgba(124, 58, 237, 0.2)',
                        color: 'white',
                        mr: 1,
                        width: 40,
                        height: 40,
                        mt: 0.5
                      }}
                    >
                      {message.isIntro ? <PsychologyIcon /> : <LightbulbIcon />}
                    </Avatar>
                  )}
                  
                  {/* Message bubble */}
                  <Box sx={{ 
                    maxWidth: isMobile ? '85%' : '70%',
                    background: message.isUser 
                      ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' 
                      : 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                    padding: 2,
                    borderRadius: message.isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                    border: '1px solid',
                    borderColor: message.isUser 
                      ? 'rgba(124, 58, 237, 0.5)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    position: 'relative',
                  }}>
                    {/* Message content */}
                    <Box>
                      {message.image && (
                        <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                          <img 
                            src={message.image} 
                            alt="Uploaded content"
                            style={{ 
                              width: '100%', 
                              maxHeight: '200px', 
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }} 
                          />
                        </Box>
                      )}
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'white',
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {formatMessageText(message.text)}
                      </Typography>
                    </Box>
                    
                    {/* Time stamp with copy button for AI messages */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: message.isUser ? 'flex-start' : 'space-between',
                      alignItems: 'center',
                      mt: 1.5,
                      opacity: 0.7,
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {message.timestamp}
                      </Typography>
                      
                      {!message.isUser && (
                        <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                          <IconButton 
                            size="small"
                            onClick={() => handleCopy(message.text)}
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': { color: 'white' },
                              p: 0.5
                            }}
                          >
                            {copied ? <DoneIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Avatar for user messages */}
                  {message.isUser && (
                    <Avatar
                      sx={{
                        bgcolor: 'transparent',
                        background: 'rgba(59, 130, 246, 0.2)',
                        ml: 1,
                        width: 40,
                        height: 40,
                        mt: 0.5
                      }}
                    >
                      <FaceIcon />
                    </Avatar>
                  )}
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', pl: 7, mt: 1 }}>
              <CircularProgress size={20} sx={{ color: '#7C3AED', mr: 2 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Thinking...
              </Typography>
            </Box>
          )}
          
          {/* Conversation starters */}
          {showStarters && messages.length <= 2 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  color: 'white', 
                  mb: 2,
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  How can I help you today?
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 2
                }}>
                  {CONVERSATION_STARTERS.map((starter, index) => (
                    <Paper
                      key={index}
                      component={motion.div}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleStarterClick(starter)}
                      sx={{
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        borderRadius: 3,
                        p: 2,
                        cursor: 'pointer',
                        maxWidth: isMobile ? '100%' : '45%',
                        flex: isMobile ? '1 1 100%' : '1 1 45%',
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {starter}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </Stack>
      </Paper>

      {/* Input area */}
      <Box 
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{ 
          p: isMobile ? '16px 12px' : 2,
          background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(124, 58, 237, 0.2)',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 10,
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Preview of uploaded image if any */}
        {currentImage && (
          <Box sx={{ 
            mb: 1.5, 
            position: 'relative', 
            width: 80,
            height: 80,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(124, 58, 237, 0.3)'
          }}>
            <img 
              src={currentImage} 
              alt="Upload preview" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
            <IconButton
              size="small"
              onClick={handleResetImage}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                p: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                }
              }}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Mobile Send Button */}
        {isMobile && (
          <Button
            fullWidth
            variant="contained"
            onClick={handleSend}
            disabled={(!input.trim() && !currentImage) || loading}
            sx={{
              mb: 2,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
              '&:hover': {
                background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
              },
              '&.Mui-disabled': {
                background: 'rgba(124, 58, 237, 0.3)',
                color: 'rgba(255, 255, 255, 0.4)'
              }
            }}
          >
            {loading ? 'Thinking...' : 'Send Message'}
          </Button>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          maxWidth: isMobile ? '100%' : '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          
          <Tooltip title="Upload Image">
            <IconButton 
              onClick={() => fileInputRef.current?.click()}
              sx={{ 
                color: currentImage ? '#3B82F6' : 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'white',
                  background: 'rgba(124, 58, 237, 0.1)'
                }
              }}
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Lets communicate with skills..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() || currentImage) {
                  handleSend();
                }
              }
            }}
            InputProps={{
              sx: {
                color: 'white',
                borderRadius: 3,
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(124, 58, 237, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(124, 58, 237, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#7C3AED',
                },
              }
            }}
            multiline
            minRows={1}
            maxRows={3}
          />
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', ml: 1 }}>
            {!isMobile && (
              <Tooltip title="Paste from clipboard">
                <IconButton 
                  onClick={handlePaste} 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: 'white',
                      background: 'rgba(124, 58, 237, 0.1)'
                    }
                  }}
                >
                  <ContentPasteIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title={recording ? "Stop recording" : "Voice input"}>
              <IconButton 
                onClick={recording ? stopRecording : startRecording}
                sx={{ 
                  color: recording ? '#EF4444' : 'rgba(255, 255, 255, 0.7)',
                  animation: recording ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)',
                    },
                    '70%': {
                      boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)',
                    },
                    '100%': {
                      boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)',
                    },
                  },
                  '&:hover': {
                    color: recording ? '#EF4444' : 'white',
                    background: recording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(124, 58, 237, 0.1)'
                  }
                }}
              >
                {recording ? <StopIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Desktop Send Button */}
          {!isMobile && (
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSend}
              disabled={(!input.trim() && !currentImage) || loading}
              sx={{
                ml: 1,
                borderRadius: 3,
                minWidth: '80px',
                background: 'linear-gradient(45deg, #7C3AED, #3B82F6)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #6D28D9, #2563EB)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(124, 58, 237, 0.3)',
                  color: 'rgba(255, 255, 255, 0.4)'
                }
              }}
            >
              {loading ? 'Thinking...' : 'Send'}
            </Button>
          )}
          </Box>
        </Box>
      </Box>
      
      {/* Context menu for messages */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleCloseContextMenu}
        PaperProps={{
          sx: {
            backgroundColor: '#1E293B',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            handleCopy(messages[selectedMessageIndex]?.text);
            handleCloseContextMenu();
          }}
          sx={{ 
            '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.1)' } 
          }}
        >
          <ContentCopyIcon fontSize="small" sx={{ mr: 1.5 }} />
          Copy
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteMessage}
          sx={{ 
            color: '#EF4444',
            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' } 
          }}
        >
          <DeleteSweepIcon fontSize="small" sx={{ mr: 1.5 }} />
          Delete
        </MenuItem>
      </Menu>
      
      {/* Settings drawer */}
      {renderSettingsDrawer()}
      
      {/* Side menu */}
      {renderSideMenu()}
      
      {/* Backdrop when recording */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
        open={recording}
      >
        <Fade in={recording}>
          <Paper sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 3,
            maxWidth: '300px',
          }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                mb: 2,
                background: 'linear-gradient(45deg, #EF4444, #F87171)',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)',
                  },
                  '70%': {
                    boxShadow: '0 0 0 20px rgba(239, 68, 68, 0)',
                  },
                  '100%': {
                    boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)',
                  },
                },
              }}
            >
              <MicIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Listening...
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
              Speak clearly and I'll transcribe what you say
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              sx={{
                borderRadius: 2,
              }}
            >
              Stop Recording
            </Button>
          </Paper>
        </Fade>
      </Backdrop>
    </Box>
  );
};

export default AIMentor;