import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, 
    Button, 
    Typography, 
    Container, 
    Paper, 
    Grid, 
    CircularProgress,
    Alert,
    IconButton,
    Avatar,
    TextField,
    Chip,
    Stepper,
    Step,
    StepLabel,
    Rating,
    Divider,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    LinearProgress
} from '@mui/material';
import { 
  Camera as CameraIcon, 
  Mic as MicIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Insights as InsightsIcon,
  Chat as ChatIcon,
  VerifiedUser as VerifiedUserIcon,
  BarChart as BarChartIcon,
  EmojiObjects as EmojiObjectsIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, set, serverTimestamp } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getGroqApiKey2Synch, getGroqApiUrlSynch } from '../../utils/apiKeys';

// API Configuration - now loaded from Firebase
const getApiKey = () => getGroqApiKey2Synch();
const getApiUrl = () => getGroqApiUrlSynch();

// Internal Components
const PageHeader = ({ title, subtitle, icon, backButton, onBackClick }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      {backButton && (
        <IconButton onClick={onBackClick} sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon />
        </IconButton>
      )}
      {icon && (
        <Box sx={{ color: 'primary.main' }}>
          {icon}
        </Box>
      )}
      <Typography variant="h4" component="h1" fontWeight="bold">
        {title}
      </Typography>
    </Box>
    {subtitle && (
      <Typography variant="body1" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

const SectionCard = ({ title, children, icon }) => (
  <Paper 
    elevation={0}
    sx={{ 
      mb: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden'
    }}
  >
    {title && (
      <Box 
        sx={{ 
          px: 3, 
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        {icon && (
          <Box sx={{ color: 'primary.main' }}>
            {icon}
          </Box>
        )}
        <Typography variant="h6" color="primary" fontWeight="medium">
          {title}
        </Typography>
      </Box>
    )}
    {children}
  </Paper>
);

const ContentContainer = ({ children }) => (
  <Box sx={{ py: 4, minHeight: '100vh' }}>
    <Container maxWidth="lg">
      {children}
    </Container>
  </Box>
);

const ChatMessage = ({ message, isUser, avatar, audioUrl, isSpeaking, onPlayAudio }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 2,
    }}
  >
    {!isUser && (
      <Avatar 
        sx={{ 
          bgcolor: 'primary.main', 
          width: 36, 
          height: 36, 
          mr: 1.5,
          mt: 0.5
        }}
      >
        {avatar || 'I'}
      </Avatar>
    )}
    <Box
      sx={{
        maxWidth: '80%',
        p: 2,
        borderRadius: 2,
        bgcolor: isUser ? 'primary.light' : 'background.paper',
        color: isUser ? 'primary.contrastText' : 'text.primary',
        border: '1px solid',
        borderColor: isUser ? 'primary.main' : 'divider',
        position: 'relative'
      }}
    >
      <Typography variant="body1">{message.text}</Typography>
      
      {!isUser && onPlayAudio && (
        <IconButton 
          size="small" 
          sx={{ 
            position: 'absolute', 
            bottom: 2, 
            right: 2, 
            opacity: 0.7,
            color: isSpeaking ? 'primary.main' : 'text.secondary',
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'background.default',
              opacity: 1
            }
          }}
          onClick={() => onPlayAudio(message.text, message.id)}
        >
          {isSpeaking ? <VolumeUpIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>
      )}
    </Box>
    {isUser && (
      <Avatar 
        sx={{ 
          bgcolor: 'secondary.main', 
          width: 36, 
          height: 36, 
          ml: 1.5,
          mt: 0.5
        }}
      >
        U
      </Avatar>
    )}
  </Box>
);

const FeedbackCard = ({ title, description, score, icon }) => (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: 'primary.main', mr: 1.5 }}>
            {icon}
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Score:
          </Typography>
          <Rating 
            value={typeof score === 'object' ? score.score : score} 
            readOnly 
            precision={0.5} 
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({typeof score === 'object' ? score.score : score}/5)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

const InterviewSimulator = () => {
  const [jobRole, setJobRole] = useState('');
  const [company, setCompany] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [step, setStep] = useState('intro'); // intro, setup, interview, results
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserImage, setCurrentUserImage] = useState(null);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [relationshipBuilt, setRelationshipBuilt] = useState(false);
  const [interviewResults, setInterviewResults] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentSpeakingId, setCurrentSpeakingId] = useState(null);
  const [messageIdCounter, setMessageIdCounter] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [interviewerPersona, setInterviewerPersona] = useState({
    name: 'Alex',
    role: 'Senior Recruiter',
    avatar: 'A'
  });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(new Audio());
  const navigate = useNavigate();
  
  const steps = ['Welcome', 'Setup', 'Interview', 'Results'];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, [auth]);


  useEffect(() => {
    // Clean up audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Start webcam when interview begins
  useEffect(() => {
    if (step === 'interview') {
      startWebcam();
      setActiveStep(2);
    } else if (step === 'setup') {
      setActiveStep(1);
    } else if (step === 'results') {
      setActiveStep(3);
    } else {
      setActiveStep(0);
    }
    
    return () => {
      stopWebcam();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [step]);
  
  // Scroll to bottom of chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Timer countdown when listening
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            stopListening();
            clearInterval(timerRef.current);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening]);
  
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access webcam. Please check permissions.");
    }
  };
  
  const stopWebcam = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };
  
  const captureImage = () => {
    if (!videoRef.current) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 data URL
    const dataUrl = canvas.toDataURL('image/jpeg');
    return dataUrl;
  };

  // Updated Text-to-Speech function with improved voice model and caching
  const generateTextToSpeech = async (text) => {
    try {
      // Check if text is cached
      const cacheKey = `tts_${text.substring(0, 50)}`;
      const cachedAudio = sessionStorage.getItem(cacheKey);
      
      if (cachedAudio) {
        return cachedAudio;
      }
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/speech',
        {
          model: "playai-tts",
          voice: "Gail-PlayAI",
          input: text,
          speed: 1.1,
          response_format: "mp3"
        },
        {
          headers: {
            'Authorization': `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      
      // Convert array buffer to blob
      const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the result
      try {
        sessionStorage.setItem(cacheKey, audioUrl);
      } catch (e) {
        console.warn("Failed to cache audio:", e);
      }
      
      return audioUrl;
    } catch (error) {
      console.error("Error generating text-to-speech:", error);
      return null;
    }
  };
  
  // Update the playAudio function
  const playAudio = async (text, messageId) => {
    stopSpeaking(); // Stop any current audio before starting new one
    
    setCurrentSpeakingId(messageId);
    setIsSpeaking(true);
    
    try {
      const audioUrl = await generateTextToSpeech(text);
      
      if (audioUrl) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.playbackRate = 1.1;
        
        audioRef.current.onended = () => {
          setCurrentSpeakingId(null);
          setIsSpeaking(false);
        };
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error("Error playing audio:", err);
            fallbackSpeak(text);
          });
        }
      } else {
        fallbackSpeak(text);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      fallbackSpeak(text);
    }
  };
  
  const addMessageWithAutoPlay = async (newMessage, isUser) => {
    const messageId = messageIdCounter;
    setMessageIdCounter(prev => prev + 1);
    
    const messageWithId = {
      ...newMessage,
      id: messageId
    };
    
    setMessages(prev => [...prev, messageWithId]);
    
    // Auto-play audio for interviewer messages if audio is enabled
    if (!isUser && audioEnabled) {
      // Wait a short delay for UI to update before playing
      setTimeout(() => {
        playAudio(newMessage.text, messageId);
      }, 300);
    }
    
    return messageId;
  };
  
  const stopSpeaking = () => {
    // Stop primary TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    // Stop Web Speech API
    window.speechSynthesis.cancel();
    
    setCurrentSpeakingId(null);
    setIsSpeaking(false);
  };
  
  const startListening = async () => {
    // Stop any currently playing audio
    stopSpeaking();
    
    // Capture an image of the user before they speak
    const imageDataUrl = captureImage();
    setCurrentUserImage(imageDataUrl);
    
    setTimeLeft(30);
    setIsListening(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Create a FormData object to send the audio file
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');
        formData.append('model', 'distil-whisper-large-v3-en');
        
        try {
          setLoading(true);
          const response = await axios.post(
            'https://api.groq.com/openai/v1/audio/transcriptions',
            formData,
            {
              headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          // Add the user's message
          const userMessage = response.data.text;
          
          // Check if the user wants to end the interview
          const endInterviewKeywords = [
            'end this interview', 'finish this interview', 'end the interview', 
            'finish the interview', 'let\'s end this', 'end this meeting',
            'finish this meeting', 'end the meeting', 'let\'s wrap up',
            'that\'s all for today', 'let\'s conclude', 'thank you for your time',
            'i need to go', 'i have to leave', 'got to go', 'gotta go'
          ];
          
          const wantsToEnd = endInterviewKeywords.some(keyword => 
            userMessage.toLowerCase().includes(keyword.toLowerCase())
          );
          
          await addMessageWithAutoPlay({ text: userMessage, isUser: true }, true);
          
          if (wantsToEnd) {
            // User wants to end the interview
            await getEndingResponse(userMessage, currentUserImage);
            setInterviewEnded(true);
            
            // Generate interview results after a delay
            setTimeout(() => {
              generateInterviewResults();
            }, 2000);
          } else {
            // Normal interview flow
            await getInterviewerResponse(userMessage, currentUserImage);
          }
          
          setLoading(false);
        } catch (err) {
          console.error("Speech-to-text error:", err);
          addMessageWithAutoPlay({ 
            text: "Sorry, I couldn't understand what you said. Please try again.", 
            isUser: false
          }, false);
          setLoading(false);
        }
      };
      
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
      setError("Could not access microphone. Please check permissions.");
    }
  };
  
  const stopListening = () => {
    setIsListening(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Also stop all tracks in the stream
      const stream = mediaRecorderRef.current.stream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Update the fallbackSpeak function
  const fallbackSpeak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get all available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a female English voice
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => 
      voice.lang.startsWith('en') && 
      !voice.name.toLowerCase().includes('male')
    ) || voices[0];
    
    utterance.voice = preferredVoice;
    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;
    
    // Add event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    };
    
    window.speechSynthesis.speak(utterance);
  };
  
  const getEndingResponse = async (userMessage, imageDataUrl) => {
    try {
      setLoading(true);
      
      // Check if imageDataUrl is null before trying to split it
      const base64Image = imageDataUrl ? imageDataUrl.split(',')[1] : null;
      
      const promptContext = `You are ${interviewerPersona.name}, ${interviewerPersona.role} interviewing for the position of ${jobRole} at ${company}. 
      The candidate just said: "${userMessage}"
      
      It seems they want to end the interview. Thank them politely for their time and provide a brief, positive closing statement.
      Sound friendly and conversational. Use contractions (I'm, you've), mild interjections (Well, Great), and simple sentences - like you're talking to them in person. Include an exclamation mark to sound more warm.
      Always use "I" statements from your perspective as the interviewer, not third-person.
      Keep your response conversational and brief (2-3 sentences).`;
      
      let response;
      
      if (base64Image) {
        response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: promptContext
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`,
                    }
                  }
                ]
              }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct"
          },
          {
            headers: {
              'Authorization': `Bearer ${getApiKey()}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            messages: [
              {
                role: "user",
                content: promptContext
              }
            ],
            model: "gemma2-9b-it"
          },
          {
            headers: {
              'Authorization': `Bearer ${getApiKey()}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      const closingMessage = response.data.choices[0].message.content;
      await addMessageWithAutoPlay({ text: closingMessage, isUser: false }, false);
      
      setLoading(false);
    } catch (error) {
      console.error("Error getting closing response:", error);
      await addMessageWithAutoPlay({ 
        text: `Thank you for your time today! I've really enjoyed our conversation. I'll be in touch soon about next steps!`, 
        isUser: false 
      }, false);
      setLoading(false);
    }
  };
  
  const buildRelationship = async () => {
    try {
      setLoading(true);
      
      const promptContext = `You are ${interviewerPersona.name}, ${interviewerPersona.role} at ${company} interviewing for the ${jobRole} position.
      
      Write two messages to build a personal connection before starting the formal interview:
      1. A warm, friendly greeting introducing yourself (use your name) and expressing excitement to meet the candidate. Express that you're looking forward to learning more about them. (2-3 sentences)
      2. A casual question to help them relax before getting into interview questions. Something personal but appropriate like asking about their day or their interest in the role. (1-2 sentences)
      
      Format your responses separated by ||| as a delimiter.
      
      Use a warm, friendly tone with:
      - Contractions (I'm, you're)
      - Personal pronouns (I, we, you)
      - Exclamation marks occasionally
      - Simple friendly phrases ("Great to meet you", "Hope you're doing well")
      
      Sound like a real person having a conversation, not formal or robotic.`;
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          messages: [
            {
              role: "user",
              content: promptContext
            }
          ],
          model: "gemma2-9b-it"
        },
        {
          headers: {
            'Authorization': `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const fullResponse = response.data.choices[0].message.content;
      const parts = fullResponse.split('|||');
      
      const firstMsg = parts[0].trim();
      const secondMsg = parts.length > 1 ? parts[1].trim() : "How's your day going so far?";
      
      // Add each part of the interviewer's response separately
      await addMessageWithAutoPlay({ text: firstMsg, isUser: false }, false);
      
      // Wait a moment before showing the question
      setTimeout(async () => {
        await addMessageWithAutoPlay({ text: secondMsg, isUser: false }, false);
        setRelationshipBuilt(true);
      }, 2000);
      
      setLoading(false);
    } catch (error) {
      console.error("Error starting conversation:", error);
      await addMessageWithAutoPlay({ 
        text: `Hi there! I'm ${interviewerPersona.name}, ${interviewerPersona.role} at ${company}. It's great to meet you!`, 
        isUser: false 
      }, false);
      setTimeout(async () => {
        await addMessageWithAutoPlay({ 
          text: "How are you feeling about our chat today?", 
          isUser: false 
        }, false);
        setRelationshipBuilt(true);
      }, 2000);
      setLoading(false);
    }
  };
  
  const getInterviewerResponse = async (userMessage, imageDataUrl) => {
    try {
      setLoading(true);
      
      let firstMsg = '';
      let secondMsg = '';
      let promptContext = '';
      
      // First interview question after relationship building
      if (relationshipBuilt && messages.length <= 3) {
        promptContext = `You are ${interviewerPersona.name}, ${interviewerPersona.role} at ${company} interviewing for the ${jobRole} position.
        
        The candidate just said: "${userMessage}"
        
        Now transition into the interview with:
        1. A brief acknowledgment of their response (1 sentence)
        2. A statement transitioning to the formal interview (1 sentence)
        3. Your first real interview question - make it specific to the ${jobRole} role
        
        Format your response in two parts separated by ||| as a delimiter:
        - First part: Acknowledgment + transition (2 sentences)
        - Second part: Your first interview question (1-2 sentences)
        
        Use a warm, conversational tone with contractions, personal pronouns, and natural language.
        Sound like a real person talking, not a formal interviewer reading from a script.`;
      } else {
        // Check if imageDataUrl is null before trying to split it
        const base64Image = imageDataUrl ? imageDataUrl.split(',')[1] : null;
        
        promptContext = `You are ${interviewerPersona.name}, ${interviewerPersona.role} at ${company} interviewing for the ${jobRole} position.
        
        The candidate just answered: "${userMessage}"
        
        Format your response in two parts separated by ||| as a delimiter:
        1. A personal reaction to their answer (1-2 sentences). Use "I" statements like "I appreciate that perspective" or "I see what you mean" - react as yourself, not as a third-party.
        2. Your next interview question - make it relevant to their response if possible
        3. Do not mention or say "first part" or "second part" in your response as it will be shown to user.

        Use a warm, conversational tone with contractions, personal pronouns, and natural language.
        
        Make your response sound human and conversational:
        - Use contractions (I'm, you've, that's)
        - Include personal reactions ("I like that approach" or "That's interesting!")
        - React to their facial expression if noticeable in the image
        - Occasionally use mild interjections (Well, Great, Hmm)
        - Vary your sentence structure and length
        
        Keep both parts natural and conversational as if you're having a real-time dialogue.`;
        
        // Only make API call with image if we have a valid image
        if (base64Image) {
          const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: promptContext
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/jpeg;base64,${base64Image}`,
                      }
                    }
                  ]
                }
              ],
              model: "meta-llama/llama-4-maverick-17b-128e-instruct"
            },
            {
              headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const fullResponse = response.data.choices[0].message.content;
          const parts = fullResponse.split('|||');
          
          firstMsg = parts[0].trim();
          secondMsg = parts.length > 1 ? parts[1].trim() : "Could you tell me about a challenge you faced in your previous role?";
        } else {
          const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              messages: [
                {
                  role: "user",
                  content: promptContext
                }
              ],
              model: "gemma2-9b-it"
            },
            {
              headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const fullResponse = response.data.choices[0].message.content;
          const parts = fullResponse.split('|||');
          
          firstMsg = parts[0].trim();
          secondMsg = parts.length > 1 ? parts[1].trim() : "Could you tell me about a challenge you faced in your previous role?";
        }
      }
      
      // If this is the first interview question after relationship building
      if (relationshipBuilt && messages.length <= 3) {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            messages: [
              {
                role: "user",
                content: promptContext
              }
            ],
            model: "meta-llama/llama-4-maverick-17b-128e-instruct"
          },
          {
            headers: {
              'Authorization': `Bearer ${getApiKey()}`,
              'Content-Type': 'application/json'
            }
          }
        );
            
            const fullResponse = response.data.choices[0].message.content;
            const parts = fullResponse.split('|||');
            
            firstMsg = parts[0].trim();
            secondMsg = parts.length > 1 ? parts[1].trim() : "Can you tell me about your experience with similar roles?";
            }
            
            // Add each part of the interviewer's response separately
            await addMessageWithAutoPlay({ text: firstMsg, isUser: false }, false);
            
            // Wait a moment before showing the second question
            setTimeout(async () => {
              await addMessageWithAutoPlay({ text: secondMsg, isUser: false }, false);
            }, 2000);
            
            setLoading(false);
            } catch (error) {
              console.error("Error getting interviewer response:", error);
              await addMessageWithAutoPlay({ 
                text: "That's interesting. Could you tell me more about your approach to problem-solving?", 
                isUser: false 
              }, false);
              setLoading(false);
            }
            };
            
            const generateInterviewResults = async () => {
              try {
                setLoading(true);
                
                const interviewHistory = messages.map(msg => {
                  return {
                    role: msg.isUser ? "Candidate" : "Interviewer",
                    text: msg.text
                  };
                });
                
                const promptContext = `You are an expert hiring manager for ${company}. 
                You need to provide feedback on this interview for the ${jobRole} position.
                
                Here is the full transcript of the interview:
                ${JSON.stringify(interviewHistory)}
                
                Provide a balanced, constructive assessment with:
                
                1. Overall impression (strengths and areas for improvement)
                2. Communication skills (clarity, confidence, listening)
                3. Technical/domain knowledge for the ${jobRole} role
                4. Cultural fit with ${company}
                5. A score from 1-5 for each category and an overall score
                
                Format your response as a JSON object with these fields:
                {
                  "overallImpression": { "feedback": "string", "score": number },
                  "communicationSkills": { "feedback": "string", "score": number },
                  "technicalKnowledge": { "feedback": "string", "score": number },
                  "culturalFit": { "feedback": "string", "score": number },
                  "overallScore": number,
                  "strengths": ["string", "string"],
                  "areasForImprovement": ["string", "string"],
                  "nextSteps": "string"
                }
                
                Keep feedback constructive, specific and actionable. Be honest but encouraging.`;
                
                const response = await axios.post(
                  'https://api.groq.com/openai/v1/chat/completions',
                  {
                    messages: [
                      {
                        role: "user",
                        content: promptContext
                      }
                    ],
                    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
                    response_format: { type: "json_object" }
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${getApiKey()}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                const resultsData = JSON.parse(response.data.choices[0].message.content);
                setInterviewResults(resultsData);
                setStep('results');
                setLoading(false);
                await saveInterviewData(resultsData);
              } catch (error) {
                console.error("Error generating interview results:", error);
                
                // Create fallback results if API fails
                const fallbackResults = {
                  overallImpression: { 
                    feedback: "You demonstrated good communication skills and knowledge relevant to the position.", 
                    score: 4 
                  },
                  communicationSkills: { 
                    feedback: "Your responses were clear and well-structured.", 
                    score: 4 
                  },
                  technicalKnowledge: { 
                    feedback: "You showed strong domain knowledge with practical examples.", 
                    score: 3.5 
                  },
                  culturalFit: { 
                    feedback: "Your values seem well-aligned with our company culture.", 
                    score: 4 
                  },
                  overallScore: 3.8,
                  strengths: [
                    "Clear communication style",
                    "Relevant experience shared",
                  ],
                  areasForImprovement: [
                    "Could provide more specific examples",
                    "Consider asking more questions about the role"
                  ],
                  nextSteps: "We'll review your interview and be in touch within the next week regarding next steps."
                };
                await saveInterviewData(fallbackResults);
                setInterviewResults(fallbackResults);
                setStep('results');
                setLoading(false);
              }
            };

            const saveInterviewData = async (results) => {
              if (!currentUser || !results) {
                console.log('Skipping interview data save:', { 
                  currentUser: !!currentUser, 
                  hasResults: !!results
                });
                return;
              }
            
              try {
                const database = getDatabase();
                const timestamp = Date.now();
                const imageAnalysisScore = calculateImageScore();
                
                // Create activity data for history
                const activityData = {
                  date: new Date().toISOString(),
                  description: `Completed Interview for ${jobRole} position at ${company}`,
                  duration: `${Math.floor(messages.length * 2)} min`,
                  id: `interview_${timestamp}`,
                  score: Math.round(results.overallScore * 20),
                  type: "Interview",
                  createdAt: serverTimestamp()
                };
            
                // Simplified scoring data for analytics
                const scoringData = {
                  overallScore: Math.round(results.overallScore * 20),
                  communication: Math.round(results.communicationSkills.score * 20),
                  technical: Math.round(results.technicalKnowledge.score * 20),
                  cultural: Math.round(results.culturalFit.score * 20),
                  confidence: Math.round((results.communicationSkills.score + results.overallScore) * 10),
                  imageAnalysis: imageAnalysisScore,
                  createdAt: serverTimestamp(),
                  jobRole,
                  company
                };
            
                // Save activity to history
                const historyRef = ref(database, `users/${currentUser.uid}/history/data/${timestamp}/activities/0`);
                await set(historyRef, activityData);
                
                // Save simplified scoring data
                const scoringRef = ref(database, `users/${currentUser.uid}/interviews/scores/${timestamp}`);
                await set(scoringRef, scoringData);
            
                // Save detailed interview data separately
                const detailsRef = ref(database, `users/${currentUser.uid}/interviews/details/${timestamp}`);
                await set(detailsRef, {
                  conversation: messages,
                  results,
                  metadata: {
                    jobRole,
                    company,
                    interviewer: interviewerPersona,
                    createdAt: serverTimestamp()
                  }
                });
            
                console.log('Interview data saved successfully');
              } catch (error) {
                console.error('Error saving interview data:', error);
                setError('Failed to save interview data. Please try again.');
              }
            };
            
            const calculateImageScore = () => {
              // If no messages, return default score
              if (!messages.length) return 50;
            
              const userMessages = messages.filter(msg => msg.isUser);
              
              // If no user messages, return default score
              if (!userMessages.length) return 50;
            
              // Count messages with good posture/engagement
              const positiveSignals = userMessages.reduce((count, msg) => {
                // Consider message positive if user is visible and engaged
                const hasImage = msg.imageDataUrl != null;
                return hasImage ? count + 1 : count;
              }, 0);
            
              // Calculate percentage but ensure minimum score of 70
              const baseScore = (positiveSignals / userMessages.length) * 100;
              return Math.max(70, Math.round(baseScore));
            };
            
            const handleStartSimulation = () => {
              if (!jobRole || !company) {
                setError("Please fill in all required fields");
                return;
              }
              
              setError(null);
              setStep('interview');
              
              // Reset interview state
              setMessages([]);
              setRelationshipBuilt(false);
              setInterviewEnded(false);
              setInterviewResults(null);
              
              // Start building relationship after a short delay
              setTimeout(() => {
                buildRelationship();
              }, 1000);
            };
            
            const handleSetupInterview = () => {
              setStep('setup');
              setError(null);
            };
            
            const handleBackToIntro = () => {
              setStep('intro');
              setError(null);
            };
            
            const handleBackToSetup = () => {
              setStep('setup');
              setError(null);
              setMessages([]);
              setInterviewEnded(false);
              setInterviewResults(null);
            };
            
            const handleBackToHome = () => {
              navigate('/');
            };
            
            return (
              <ContentContainer>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                
                {step === 'intro' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <PageHeader 
                      title="Interview Simulator" 
                      subtitle="Practice your interview skills with AI-powered mock interviews"
                      icon={<InsightsIcon fontSize="large" />}
                    />
                    
                    <SectionCard 
                      title="Welcome to Interview Simulator"
                      icon={<EmojiObjectsIcon />}
                    >
                      <Box sx={{ p: 3 }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          Our AI-powered interview simulator helps you practice for job interviews in a realistic environment. You'll interact with an AI interviewer through voice and video, just like a real interview.
                        </Typography>
                        
                        <Typography variant="body1" sx={{ mb: 3 }}>
                          The simulator will analyze your responses and provide detailed feedback to help you improve your interview skills.
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ 
                              p: 2, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              bgcolor: 'background.default',
                              borderRadius: 2
                            }}>
                              <MicIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                              <Typography variant="h6" textAlign="center">Voice Interaction</Typography>
                              <Typography variant="body2" textAlign="center" color="text.secondary">
                                Answer questions using your microphone
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ 
                              p: 2, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              bgcolor: 'background.default',
                              borderRadius: 2
                            }}>
                              <CameraIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                              <Typography variant="h6" textAlign="center">Video Feedback</Typography>
                              <Typography variant="body2" textAlign="center" color="text.secondary">
                                Practice with video to simulate real interviews
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ 
                              p: 2, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              bgcolor: 'background.default',
                              borderRadius: 2
                            }}>
                              <BarChartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                              <Typography variant="h6" textAlign="center">Detailed Analysis</Typography>
                              <Typography variant="body2" textAlign="center" color="text.secondary">
                                Get feedback on your performance
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        <Button 
                          variant="contained" 
                          size="large" 
                          onClick={handleSetupInterview}
                          startIcon={<WorkIcon />}
                          sx={{ mt: 2 }}
                        >
                          Get Started
                        </Button>
                      </Box>
                    </SectionCard>
                  </motion.div>
                )}
                
                {step === 'setup' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <PageHeader 
                      title="Setup Your Interview" 
                      subtitle="Enter details about the job you're interviewing for"
                      icon={<WorkIcon fontSize="large" />}
                      backButton
                      onBackClick={handleBackToIntro}
                    />
                    
                    <SectionCard title="Interview Details" icon={<PersonIcon />}>
                      <Box component="form" noValidate sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              id="jobRole"
                              label="Job Position/Role"
                              value={jobRole}
                              onChange={(e) => setJobRole(e.target.value)}
                              variant="outlined"
                              placeholder="e.g. Software Engineer, Product Manager"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              id="company"
                              label="Company Name"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              variant="outlined"
                              placeholder="e.g. Acme Inc."
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              id="interviewerName"
                              label="Interviewer Name (Optional)"
                              value={interviewerName}
                              onChange={(e) => setInterviewerName(e.target.value)}
                              variant="outlined"
                              placeholder="e.g. Alex Smith"
                              helperText="Leave blank for a default interviewer"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={audioEnabled}
                                  onChange={(e) => setAudioEnabled(e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Enable Text-to-Speech"
                            />
                          </Grid>
                        </Grid>
                        
                        {error && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                          </Alert>
                        )}
                        
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                          <Button
                            variant="outlined"
                            onClick={handleBackToIntro}
                            startIcon={<ArrowBackIcon />}
                          >
                            Back
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleStartSimulation}
                            disabled={loading}
                          >
                            Start Interview
                          </Button>
                        </Box>
                      </Box>
                    </SectionCard>
                  </motion.div>
                )}
                
                {step === 'interview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <PageHeader 
                      title={`Interview for ${jobRole} at ${company}`}
                      subtitle="Speak naturally and answer the questions as you would in a real interview"
                      icon={<ChatIcon fontSize="large" />}
                    />
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={5}>
                        <SectionCard>
                          <Box sx={{ position: 'relative', minHeight: 350 }}>
                            <video
                              ref={videoRef}
                              autoPlay
                              muted
                              playsInline
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                backgroundColor: '#000',
                                minHeight: '350px'
                              }}
                            />
                            
                            {isListening && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 16,
                                  right: 16,
                                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                                  color: 'white',
                                  p: 1,
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <TimeIcon fontSize="small" />
                                <Typography variant="body2">{timeLeft}s</Typography>
                              </Box>
                            )}
                            
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 16,
                                left: 16,
                                display: 'flex',
                                gap: 1
                              }}
                            >
                              {isListening ? (
                                <Button
                                  variant="contained"
                                  color="error"
                                  onClick={stopListening}
                                  startIcon={<CancelIcon />}
                                  sx={{ borderRadius: 8 }}
                                >
                                  Stop Recording
                                </Button>
                              ) : (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={startListening}
                                  startIcon={<MicIcon />}
                                  disabled={loading || interviewEnded}
                                  sx={{ borderRadius: 8 }}
                                >
                                  {interviewEnded ? "Interview Ended" : "Speak"}
                                </Button>
                              )}
                              
                              {audioEnabled && (
                                <IconButton
                                  color="primary"
                                  onClick={() => {
                                    stopSpeaking();
                                    setAudioEnabled(false);
                                    // Auto enable audio after 1 second
                                    setTimeout(() => {
                                      setAudioEnabled(true);
                                    }, 1000);
                                  }}
                                  sx={{ bgcolor: 'background.paper' }}
                                >
                                  <VolumeUpIcon />
                                </IconButton>
                              )}
                              
                              {!audioEnabled && (
                                <IconButton
                                  color="default"
                                  onClick={() => setAudioEnabled(true)}
                                  sx={{ bgcolor: 'background.paper' }}
                                >
                                  <VolumeOffIcon />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </SectionCard>
                      </Grid>
                      
                      <Grid item xs={12} md={7}>
                        <SectionCard title="Interview Chat" icon={<ChatIcon />}>
                          <Box
                            sx={{
                              height: 400,
                              overflowY: 'auto',
                              p: 2,
                              bgcolor: 'background.default',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {messages.map((message, index) => (
                              <ChatMessage
                                key={index}
                                message={message}
                                isUser={message.isUser}
                                avatar={message.isUser ? null : interviewerPersona.avatar}
                                isSpeaking={!message.isUser && currentSpeakingId === message.id}
                                onPlayAudio={message.isUser ? null : playAudio}
                              />
                            ))}
                            
                            {loading && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                <CircularProgress size={24} />
                              </Box>
                            )}
                            
                            <div ref={messagesEndRef} />
                          </Box>
                          
                          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="body2" color="text.secondary">
                              {interviewEnded 
                                ? "Interview completed. Generating your results..."
                                : relationshipBuilt 
                                  ? "Click the microphone button and speak to answer the question"
                                  : "The interviewer is introducing themselves..."
                              }
                            </Typography>
                          </Box>
                        </SectionCard>
                      </Grid>
                    </Grid>
                  </motion.div>
                )}
                
                {step === 'results' && interviewResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <PageHeader 
                      title="Interview Results" 
                      subtitle={`Your feedback for the ${jobRole} position at ${company}`}
                      icon={<VerifiedUserIcon fontSize="large" />}
                      backButton
                      onBackClick={handleBackToSetup}
                    />
                    
                    <SectionCard title="Overall Performance" icon={<BarChartIcon />}>
                      <Box sx={{ p: 3 }}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Overall Score: {interviewResults.overallScore.toFixed(1)}/5
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(interviewResults.overallScore / 5) * 100} 
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        
                        <Typography variant="body1" gutterBottom>
                          {interviewResults.overallImpression.feedback}
                        </Typography>
                      </Box>
                    </SectionCard>
                    
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={6}>
                        <FeedbackCard
                          title="Communication Skills"
                          description={interviewResults.communicationSkills.feedback}
                          score={interviewResults.communicationSkills}
                          icon={<ChatIcon />}
                        />
                        
                        <FeedbackCard
                          title="Technical Knowledge"
                          description={interviewResults.technicalKnowledge.feedback}
                          score={interviewResults.technicalKnowledge}
                          icon={<WorkIcon />}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FeedbackCard
                          title="Cultural Fit"
                          description={interviewResults.culturalFit.feedback}
                          score={interviewResults.culturalFit}
                          icon={<PersonIcon />}
                        />
                        
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Strengths & Areas for Improvement
                            </Typography>
                            
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                              Strengths:
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                              {interviewResults.strengths.map((strength, index) => (
                                <Box component="li" key={index} sx={{ mb: 0.5 }}>
                                  <Typography variant="body2">{strength}</Typography>
                                </Box>
                              ))}
                            </Box>
                            
                            <Typography variant="subtitle1" color="secondary" gutterBottom>
                              Areas for Improvement:
                            </Typography>
                            <Box component="ul" sx={{ pl: 2 }}>
                              {interviewResults.areasForImprovement.map((area, index) => (
                                <Box component="li" key={index} sx={{ mb: 0.5 }}>
                                  <Typography variant="body2">{area}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    <SectionCard title="Next Steps" icon={<ArrowBackIcon />} sx={{ mt: 3 }}>
                      <Box sx={{ p: 3 }}>
                        <Typography variant="body1" gutterBottom>
                          {interviewResults.nextSteps}
                        </Typography>
                        
                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                          <Button
                            variant="outlined"
                            onClick={handleBackToHome}
                            startIcon={<ArrowBackIcon />}
                          >
                            Back to Home
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleSetupInterview}
                            startIcon={<WorkIcon />}
                          >
                            Practice Again
                          </Button>
                        </Box>
                      </Box>
                    </SectionCard>
                  </motion.div>
                )}
              </ContentContainer>
            );
            };
            
            export default InterviewSimulator;