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

  const generateTextToSpeech = async (text) => {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/speech',
        {
          model: "playai-tts",
          voice: "Gail-PlayAI",
          input: text,
          response_format: "wav"
        },
        {
          headers: {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      
      // Convert array buffer to blob
      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return audioUrl;
    } catch (error) {
      console.error("Error generating text-to-speech:", error);
      return null;
    }
  };
  
  const playAudio = async (text, messageId) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setCurrentSpeakingId(messageId);
    
    try {
      // Generate TTS only if needed
      const audioUrl = await generateTextToSpeech(text);
      
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        
        audioRef.current.onended = () => {
          setCurrentSpeakingId(null);
        };
        
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          setCurrentSpeakingId(null);
        });
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setCurrentSpeakingId(null);
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
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentSpeakingId(null);
    }
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
                'Authorization': 'Bearer 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',
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
            model: "meta-llama/llama-4-scout-17b-16e-instruct"
          },
          {
            headers: {
              'Authorization': 'Bearer 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',
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
            model: "meta-llama/llama-4-scout-17b-16e-instruct"
          },
          {
            headers: {
              'Authorization': 'Bearer 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',
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
          model: "meta-llama/llama-4-scout-17b-16e-instruct"
        },
        {
          headers: {
            'Authorization': 'Bearer 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',
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
              model: "meta-llama/llama-4-scout-17b-16e-instruct"
            },
            {
              headers: {
                'Authorization': 'Bearer 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',
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
              model: "meta-llama/llama-4-scout-17b-16e-instruct"
            },
            {
              headers: {
                'Authorization': 'Bearer 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',
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
            model: "meta-llama/llama-4-scout-17b-16e-instruct"
          },
          {
            headers: {
              'Authorization': 'Bearer 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',
              'Content-Type': 'application/json'
            }
          }
        );
        
        const fullResponse = response.data.choices[0].message.content;
        const parts = fullResponse.split('|||');
        
        firstMsg = parts[0].trim();
        secondMsg = parts.length > 1 ? parts[1].trim() : `So, tell me about your experience that makes you a good fit for this ${jobRole} position?`;
      }
      
      // Add each part of the interviewer's response separately
      await addMessageWithAutoPlay({ text: firstMsg, isUser: false }, false);
      
      // Wait a moment before showing the question
      setTimeout(async () => {
        await addMessageWithAutoPlay({ text: secondMsg, isUser: false }, false);
      }, 1500);
      
      setLoading(false);
    } catch (error) {
      // Continuation from the error handling in getInterviewerResponse
      console.error("Error getting interviewer response:", error);
      await addMessageWithAutoPlay({ 
        text: "That's an interesting perspective. Can you tell me more about your experience with similar challenges?", 
        isUser: false 
      }, false);
      setLoading(false);
    }
  };
  
  const generateInterviewResults = async () => {
    try {
      setLoading(true);
      setStep('results');
      
      // Construct the conversation history for analysis
      const conversationHistory = messages.map(msg => {
        return {
          role: msg.isUser ? "Candidate" : "Interviewer",
          content: msg.text
        };
      });
      
      const promptContext = `You are an AI interview analyzer. You need to analyze the following interview for the ${jobRole} position at ${company}.

Conversation history:
${JSON.stringify(conversationHistory)}

Provide a comprehensive analysis with the following sections:
1. Overall Performance - A summary of how well the candidate did (1-2 paragraphs)
2. Communication Skills - How effectively the candidate communicated (score 1-5)
3. Technical Knowledge - Assessment of relevant knowledge for the ${jobRole} role (score 1-5)
4. Cultural Fit - How well the candidate might fit with ${company}'s culture (score 1-5)
5. Key Strengths - 2-3 bullet points
6. Areas for Improvement - 2-3 bullet points
7. Final Recommendation - Whether to progress to the next round (Yes/No/Maybe)

For each section, provide a brief explanation of your assessment. Format your response as a JSON object with these sections as keys.`;
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          messages: [
            {
              role: "user",
              content: promptContext
            }
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct"
        },
        {
          headers: {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const analysisText = response.data.choices[0].message.content;
      let analysisJson;
      
      try {
        // Extract JSON from the response if needed
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisJson = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON format found, create a basic structure
          analysisJson = {
            "Overall Performance": "The candidate showed some promising qualities during the interview.",
            "Communication Skills": { "score": 3, "explanation": "The candidate communicated adequately." },
            "Technical Knowledge": { "score": 3, "explanation": "The candidate demonstrated basic knowledge relevant to the role." },
            "Cultural Fit": { "score": 3, "explanation": "The candidate appears to align with the company values." },
            "Key Strengths": ["Good communication", "Relevant experience", "Positive attitude"],
            "Areas for Improvement": ["Could provide more specific examples", "Could demonstrate more depth in technical knowledge"],
            "Final Recommendation": "Maybe"
          };
        }
      } catch (jsonErr) {
        console.error("Error parsing analysis JSON:", jsonErr);
        analysisJson = {
          "Overall Performance": "The candidate showed some promising qualities during the interview.",
          "Communication Skills": { "score": 3, "explanation": "The candidate communicated adequately." },
          "Technical Knowledge": { "score": 3, "explanation": "The candidate demonstrated basic knowledge relevant to the role." },
          "Cultural Fit": { "score": 3, "explanation": "The candidate appears to align with the company values." },
          "Key Strengths": ["Good communication", "Relevant experience", "Positive attitude"],
          "Areas for Improvement": ["Could provide more specific examples", "Could demonstrate more depth in technical knowledge"],
          "Final Recommendation": "Maybe"
        };
      }
      
      setInterviewResults(analysisJson);
      setLoading(false);
    } catch (error) {
      console.error("Error generating interview results:", error);
      
      // Set default results in case of error
      setInterviewResults({
        "Overall Performance": "The candidate showed some promising qualities during the interview.",
        "Communication Skills": { "score": 3, "explanation": "The candidate communicated adequately." },
        "Technical Knowledge": { "score": 3, "explanation": "The candidate demonstrated basic knowledge relevant to the role." },
        "Cultural Fit": { "score": 3, "explanation": "The candidate appears to align with the company values." },
        "Key Strengths": ["Good communication", "Relevant experience", "Positive attitude"],
        "Areas for Improvement": ["Could provide more specific examples", "Could demonstrate more depth in technical knowledge"],
        "Final Recommendation": "Maybe"
      });
      
      setLoading(false);
    }
  };
  
  const startInterview = () => {
    setStep('interview');
    buildRelationship();
  };
  
  const handleSetupSubmit = (e) => {
    e.preventDefault();
    setStep('setup');
  };
  
  const handleBackClick = () => {
    // Stop any currently playing audio
    stopSpeaking();
    
    if (step === 'setup') {
      setStep('intro');
    } else if (step === 'interview') {
      setStep('setup');
    } else if (step === 'results') {
      navigate('/');
    }
  };
  
  const renderIntroSection = () => (
    <ContentContainer>
      <PageHeader 
        title="Interview Simulator" 
        subtitle="Practice your interview skills with AI and get instant feedback" 
        icon={<ChatIcon fontSize="large" />} 
      />
      
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        <SectionCard title="Welcome to Interview Simulator" icon={<VerifiedUserIcon />}>
          <Box sx={{ p: 3 }}>
            <Typography paragraph>
              Our AI-powered interview simulator helps you prepare for job interviews by providing realistic interview experiences 
              with personalized feedback. Here's how it works:
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    <PersonIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" gutterBottom>Setup Your Interview</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose the job role and company you're interviewing for
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    <ChatIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" gutterBottom>Practice Interview</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Have a realistic conversation with an AI interviewer
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    <InsightsIcon fontSize="large" />
                  </Box>
                  <Typography variant="h6" gutterBottom>Get Feedback</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive detailed feedback and improvement suggestions
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Button 
              variant="contained" 
              size="large" 
              fullWidth 
              onClick={handleSetupSubmit}
              sx={{ mt: 2 }}
            >
              Get Started
            </Button>
          </Box>
        </SectionCard>
        
        <SectionCard title="How It Works" icon={<EmojiObjectsIcon />}>
          <Box sx={{ p: 3 }}>
            <Typography paragraph>
              Our simulator uses advanced AI to create realistic interview scenarios. During the interview:
            </Typography>
            
            <Box sx={{ pl: 2 }}>
              <Typography paragraph sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} component="div">
                <CameraIcon color="primary" fontSize="small" />
                <span>Your webcam tracks facial expressions for more personalized responses</span>
              </Typography>
              
              <Typography paragraph sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} component="div">
                <MicIcon color="primary" fontSize="small" />
                <span>Speak naturally - our voice recognition captures your responses</span>
              </Typography>
              
              <Typography paragraph sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} component="div">
                <BarChartIcon color="primary" fontSize="small" />
                <span>Receive detailed feedback on your performance after the interview</span>
              </Typography>
            </Box>
          </Box>
        </SectionCard>
      </Box>
    </ContentContainer>
  );
  
  const renderSetupSection = () => (
    <ContentContainer>
      <PageHeader 
        title="Interview Setup" 
        subtitle="Configure your practice interview" 
        icon={<WorkIcon fontSize="large" />}
        backButton
        onBackClick={handleBackClick}
      />
      
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        <SectionCard title="Interview Details" icon={<WorkIcon />}>
          <Box component="form" sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Job Role/Position"
                  placeholder="e.g. Software Engineer, Marketing Manager"
                  fullWidth
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Company Name"
                  placeholder="e.g. Google, Netflix, Startup Inc."
                  fullWidth
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={audioEnabled} 
                      onChange={(e) => setAudioEnabled(e.target.checked)} 
                      color="primary"
                    />
                  }
                  label="Enable text-to-speech (interviewer speaks aloud)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  You'll need to allow access to your camera and microphone for the best experience.
                </Alert>
                
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  disabled={!jobRole || !company}
                  onClick={startInterview}
                >
                  Start Interview
                </Button>
              </Grid>
            </Grid>
          </Box>
        </SectionCard>
        
        <SectionCard title="Interview Tips" icon={<EmojiObjectsIcon />}>
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              To get the most out of your practice session:
            </Typography>
            
            <Typography paragraph sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} component="div">
              • Dress and prepare as you would for a real interview
            </Typography>
            
            <Typography paragraph sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} component="div">
              • Find a quiet space with good lighting
            </Typography>
            
            <Typography paragraph sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} component="div">
              • Speak clearly and at a natural pace
            </Typography>
            
            <Typography paragraph sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} component="div">
              • To end the interview at any time, simply say "Thank you for your time" or "Let's end the interview"
            </Typography>
          </Box>
        </SectionCard>
      </Box>
    </ContentContainer>
  );
  
  const renderInterviewSection = () => (
    <ContentContainer>
      <PageHeader 
        title={`Interview for ${jobRole} at ${company}`} 
        subtitle="Speak naturally when prompted" 
        icon={<ChatIcon fontSize="large" />} 
        backButton
        onBackClick={handleBackClick}
      />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <SectionCard>
            <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
              <Box 
                sx={{ 
                  p: 2, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {interviewerPersona.avatar}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {interviewerPersona.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {interviewerPersona.role}
                  </Typography>
                </Box>
              </Box>
              
              <Box 
                sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {messages.length === 0 && !relationshipBuilt ? (
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      flexDirection: 'column',
                      gap: 2,
                      color: 'text.secondary'
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 60, opacity: 0.5 }} />
                    <Typography variant="body1">
                      Your interview will begin in a moment...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <ChatMessage 
                        key={index} 
                        message={message} 
                        isUser={message.isUser} 
                        avatar={!message.isUser ? interviewerPersona.avatar : null}
                        isSpeaking={!message.isUser && currentSpeakingId === message.id}
                        onPlayAudio={!message.isUser && audioEnabled ? playAudio : null}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>
              
              <Box 
                sx={{ 
                  p: 2, 
                  borderTop: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                {isListening ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box
                      component={motion.div}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        color: 'error.contrastText'
                      }}
                    >
                      <MicIcon />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Recording... ({timeLeft}s)
                      </Typography>
                      <LinearProgress variant="determinate" value={(30 - timeLeft) / 30 * 100} />
                    </Box>
                    <IconButton onClick={stopListening}>
                      <CancelIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<MicIcon />}
                    onClick={startListening}
                    fullWidth
                    disabled={loading || !relationshipBuilt || interviewEnded}
                  >
                    {interviewEnded ? "Interview Completed" : "Click to Speak"}
                  </Button>
                )}
              </Box>
            </Box>
          </SectionCard>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Box sx={{ mb: 3 }}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              style={{ 
                width: '100%', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: '#f0f0f0',
                aspectRatio: '16/9',
                objectFit: 'cover'
              }} 
            />
          </Box>
          
          <SectionCard title="Tips & Reminders" icon={<EmojiObjectsIcon />}>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" paragraph>
                • Speak clearly and at a natural pace
              </Typography>
              <Typography variant="body2" paragraph>
                • Make eye contact with the camera
              </Typography>
              <Typography variant="body2" paragraph>
                • To end the interview at any time, say "Thank you for your time" or "Let's end the interview"
              </Typography>
              <Typography variant="body2">
                • Take your time to think before answering
              </Typography>
            </Box>
          </SectionCard>
          
          {loading && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}
        </Grid>
      </Grid>
    </ContentContainer>
  );
  
  const renderResultsSection = () => (
    <ContentContainer>
      <PageHeader 
        title="Interview Results" 
        subtitle="Detailed feedback on your performance" 
        icon={<InsightsIcon fontSize="large" />} 
        backButton
        onBackClick={handleBackClick}
      />
      
      <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
        {interviewResults ? (
          <>
            <SectionCard title="Overall Performance" icon={<BarChartIcon />}>
              <Box sx={{ p: 3 }}>
                <Typography paragraph>
                  {interviewResults["Overall Performance"]}
                </Typography>
                
                <Typography 
                  variant="subtitle1" 
                  sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Chip 
                    label={interviewResults["Final Recommendation"]} 
                    color={interviewResults["Final Recommendation"] === "Yes" ? "success" : 
                          interviewResults["Final Recommendation"] === "Maybe" ? "warning" : "error"} 
                    size="small" 
                  />
                  Final Recommendation
                </Typography>
              </Box>
            </SectionCard>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FeedbackCard 
                  title="Communication Skills" 
                  description={interviewResults["Communication Skills"].explanation} 
                  score={interviewResults["Communication Skills"].score}
                  icon={<ChatIcon />}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FeedbackCard 
                  title="Technical Knowledge" 
                  description={interviewResults["Technical Knowledge"].explanation} 
                  score={interviewResults["Technical Knowledge"].score}
                  icon={<EmojiObjectsIcon />}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FeedbackCard 
                  title="Cultural Fit" 
                  description={interviewResults["Cultural Fit"].explanation} 
                  score={interviewResults["Cultural Fit"].score}
                  icon={<WorkIcon />}
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <SectionCard title="Key Strengths" icon={<VerifiedUserIcon />}>
                  <Box sx={{ p: 3 }}>
                    <ul>
                      {interviewResults["Key Strengths"].map((strength, index) => (
                        <Typography component="li" key={index} paragraph>
                          {strength}
                        </Typography>
                      ))}
                    </ul>
                  </Box>
                </SectionCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <SectionCard title="Areas for Improvement" icon={<InsightsIcon />}>
                  <Box sx={{ p: 3 }}>
                    <ul>
                      {interviewResults["Areas for Improvement"].map((area, index) => (
                        <Typography component="li" key={index} paragraph>
                          {area}
                        </Typography>
                      ))}
                    </ul>
                  </Box>
                </SectionCard>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => navigate('/')}
                startIcon={<ArrowBackIcon />}
              >
                Back to Home
              </Button>
              
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => {
                  setMessages([]);
                  setInterviewEnded(false);
                  setRelationshipBuilt(false);
                  setInterviewResults(null);
                  setStep('setup');
                }}
              >
                Practice Again
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </ContentContainer>
  );
  
  let content;
  if (step === 'intro') {
    content = renderIntroSection();
  } else if (step === 'setup') {
    content = renderSetupSection();
  } else if (step === 'interview') {
    content = renderInterviewSection();
  } else if (step === 'results') {
    content = renderResultsSection();
  }
  
  return (
    <>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 3, pb: 2, px: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            size="small" 
            sx={{ ml: 2 }} 
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </Alert>
      )}
      
      {content}
    </>
  );
};

export default InterviewSimulator;