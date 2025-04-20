'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Container, LinearProgress, Paper, Card, CardContent,
  Avatar, Chip, Grid, CircularProgress, Divider, ToggleButtonGroup, ToggleButton, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  RecordVoiceOver,
  Mic,
  MicOff,
  ArrowBack,
  NavigateNext,
  SportsEsports,
  Assessment,
  EmojiEvents,
  Refresh,
  ChevronRight as ChevronRightIcon,
  School as SchoolIcon,
  Chat as ChatIcon,
  SpeakerNotes as SpeakerNotesIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, serverTimestamp } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorBoundary } from '../../hooks/useErrorBoundary';
// Styling components
const GradientTypography = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(to right, #4f46e5, #8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent'
}));

const GradientButton = styled(Button)(({ theme, disabled }) => ({
  background: disabled ? 'rgba(55, 65, 81, 0.5)' : 'linear-gradient(to right, #4f46e5, #8b5cf6)',
  color: 'white',
  padding: '12px 24px',
  '&:hover': {
    background: disabled ? 'rgba(55, 65, 81, 0.5)' : 'linear-gradient(to right, #4f46e5, #7c3aed)',
  },
  boxShadow: disabled ? 'none' : '0 4px 15px -3px rgba(79, 70, 229, 0.4)',
  border: disabled ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(79, 70, 229, 0.3)',
}));

const RedButton = styled(Button)({
  background: 'linear-gradient(to right, #dc2626, #b91c1c)',
  color: 'white',
  padding: '12px 24px',
  '&:hover': {
    background: 'linear-gradient(to right, #dc2626, #991b1b)',
  },
  boxShadow: '0 4px 15px -3px rgba(220, 38, 38, 0.4)',
  border: '1px solid rgba(220, 38, 38, 0.3)',
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(8px)',
  backgroundColor: 'rgba(31, 41, 55, 0.4)',
  borderRadius: '24px',
  border: '1px solid rgba(79, 70, 229, 0.3)',
  padding: '32px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: theme.shadows[10],
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: 'rgba(79, 70, 229, 0.3)',
  border: '1px solid rgba(79, 70, 229, 0.3)',
  color: theme.palette.primary.light,
  width: 56,
  height: 56,
}));

const MessageBubble = styled(Box)(({ isuser, theme }) => ({
  backgroundColor: isuser === "true" ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.6)',
  borderRadius: '12px',
  padding: theme.spacing(2),
  maxWidth: '100%',
  alignSelf: isuser === "true" ? 'flex-end' : 'flex-start',
  border: '1px solid',
  borderColor: isuser === "true" ? 'rgba(79, 70, 229, 0.3)' : 'rgba(107, 114, 128, 0.5)',
  position: 'relative',
  marginBottom: '20px',
}));

const RecordingIndicator = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  '& .pulse': {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 12,
    height: 12,
    marginRight: 8,
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: '#ef4444',
      animation: 'pulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
    },
    '&::after': {
      content: '""',
      position: 'relative',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: '#f87171',
    }
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2)',
      opacity: 0,
    },
  },
});

const SentenceCard = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(79, 70, 229, 0.15)',
  border: '1px solid rgba(79, 70, 229, 0.3)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 20px -5px rgba(79, 70, 229, 0.4)',
}));

const PronunciationPro = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  useErrorBoundary();
  // State for setup
  const [currentStep, setCurrentStep] = useState('intro'); // intro, setup, sentence, game, result
  const [currentSentence, setCurrentSentence] = useState('');
  const [focus, setFocus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('beginner');
  const [category, setCategory] = useState('tongueTwisters');
  const [timeLimit, setTimeLimit] = useState(30); // seconds
  
  // State for game
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gameTimer, setGameTimer] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState({
    accuracy: 0,
    clarity: 0,
    fluency: 0,
    pronunciation: 0,
    overall: 0
  });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [dataSaved, setDataSaved] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [sentenceList, setSentenceList] = useState([]);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(0);

  // For audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const difficultySettings = {
    beginner: {
      timeLimit: 30,
      sentenceComplexity: 'simple',
    },
    intermediate: {
      timeLimit: 20,
      sentenceComplexity: 'moderate',
    },
    advanced: {
      timeLimit: 15,
      sentenceComplexity: 'complex',
    }
  };

  const categoryOptions = {
    tongueTwisters: 'Tongue Twisters',
    pronunciation: 'Challenging Pronunciations',
    prosody: 'Rhythm & Intonation',
    rapidSpeech: 'Rapid Speech',
    soundPairs: 'Similar Sound Pairs'
  };

  // Sample sentences for different categories and difficulty levels
  const sampleSentences = {
    tongueTwisters: {
      beginner: [
        { text: "She sells seashells by the seashore.", focus: "S sound pronunciation" },
        { text: "Red leather, yellow leather.", focus: "L and R sound distinction" },
        { text: "How much wood would a woodchuck chuck?", focus: "W sound consistency" }
      ],
      intermediate: [
        { text: "Unique New York, unique New York, you know you need unique New York.", focus: "Consonant-vowel transitions" },
        { text: "Six sticky skeletons stuck in a spooky situation.", focus: "S and K sound combinations" },
        { text: "Peter Piper picked a peck of pickled peppers.", focus: "P sound articulation" }
      ],
      advanced: [
        { text: "She sells seashells by the seashore, but the shells she sells aren't seashore shells.", focus: "S sound consistency and word separation" },
        { text: "Friendly Frank flips fine flapjacks frequently for fifty-five famished friends.", focus: "F sound clarity and rhythm" },
        { text: "Six slick slim sycamore saplings swiftly swaying in the stormy spring sunshine.", focus: "S sound followed by consonant clusters" }
      ]
    },
    pronunciation: {
      beginner: [
        { text: "The rural juror enjoyed the brewery tour.", focus: "R sound in various positions" },
        { text: "Please believe me when I say these thieves seized the cheese.", focus: "Long E sound vs. short I sound" },
        { text: "The sixth sheikh's sixth sheep is sick.", focus: "TH sound and S sound distinction" }
      ],
      intermediate: [
        { text: "I thought thoroughly about the three thousand things that Thursday brought.", focus: "TH sound variations" },
        { text: "The probability of statistical stability is systematically problematic.", focus: "Multisyllabic word clarity" },
        { text: "Particularly peculiar parallel perspectives perpetually puzzle people.", focus: "P sound and L sound combinations" }
      ],
      advanced: [
        { text: "Inexplicably, his philosophical physiological analysis was paradoxically psychological.", focus: "Complex syllable stress patterns" },
        { text: "The arthritis psychiatrist prescribed an isthmus of antibiotics for the anemones.", focus: "Challenging medical terminology" },
        { text: "The entrepreneurial revolutionary enthusiastically scrutinized the pharmaceutical statistician's preliminary analysis.", focus: "Multiple challenging word combinations" }
      ]
    },
    prosody: {
      beginner: [
        { text: "Is THAT what you MEANT? Or is THAT what YOU meant?", focus: "Word emphasis shift" },
        { text: "I never said he stole the money. (Emphasize different words each time)", focus: "Meaning change through emphasis" },
        { text: "Sometimes slowly, sometimes quickly—rhythm matters in speech.", focus: "Speech pace variation" }
      ],
      intermediate: [
        { text: "The beautiful mountain landscape captivated everyone, especially the children.", focus: "Natural sentence rhythm" },
        { text: "Would you consider, perhaps, that the alternative might actually be preferable?", focus: "Question intonation and pauses" },
        { text: "Once upon a time—a very good time it was—there lived a moocow.", focus: "Narrative prosody and pauses" }
      ],
      advanced: [
        { text: "Not only did he arrive unexpectedly, but he also brought seventeen extraordinary gifts for everyone!", focus: "Complex excitement intonation" },
        { text: "The professor's lecture—widely considered the most important of the semester—was unfortunately canceled due to unforeseen circumstances.", focus: "Academic prosody with parenthetical phrases" },
        { text: "Will you please tell me—and I'm asking this sincerely—whether you truly believe what you're saying?", focus: "Question embedding with emotional undertones" }
      ]
    },
    rapidSpeech: {
      beginner: [
        { text: "Around the rugged rock the ragged rascal ran.", focus: "Quick R sound transitions" },
        { text: "Betty bought a bit of better butter to make the bitter batter better.", focus: "B and T sound rapid alternation" },
        { text: "Four fine fresh fish for you.", focus: "F sound in quick succession" }
      ],
      intermediate: [
        { text: "Imagine an imaginary menagerie manager managing an imaginary menagerie.", focus: "M and N nasal sounds at speed" },
        { text: "The thirty-three thieves thought that they thrilled the throne throughout Thursday.", focus: "TH sound speed transitions" },
        { text: "Six sticky skeletons successfully slipped through the sixty-sixth street station.", focus: "S and ST sounds in rapid speech" }
      ],
      advanced: [
        { text: "The statistics specialist strictly stipulated statistically significant stratification status should systematically stand standardized.", focus: "ST sound combinations at high speed" },
        { text: "A proper copper coffee pot with a proper copper coffee pot lid that properly fits the proper copper coffee pot.", focus: "P and K sound rapid transitions" },
        { text: "How can a clam cram in a clean cream can if a clam can't cram in a clean cream can?", focus: "CL and CR sound clusters at speed" }
      ]
    },
    soundPairs: {
      beginner: [
        { text: "Violet viewed the vast valley.", focus: "V sound vs. F sound" },
        { text: "The thin thimble fits the thumb.", focus: "TH sound (voiced vs. unvoiced)" },
        { text: "She's sure the shop sells shoes.", focus: "SH sound vs. S sound" }
      ],
      intermediate: [
        { text: "The wreath writer wrote the wrong rhythm.", focus: "R sound vs. W sound" },
        { text: "The leisure measure was a pleasure treasure.", focus: "Zh sound vs. J sound" },
        { text: "Choose which cheese dish you wish to share.", focus: "CH sound vs. SH sound" }
      ],
      advanced: [
        { text: "The zealous zebras zigzagged between thickets and thorns while thinking thoroughly about thirst.", focus: "Z sound vs. TH sound" },
        { text: "Lavish village villains vigilantly leverage lovely volatile vinyl.", focus: "L sound vs. V sound distinctions" },
        { text: "Rightfully frightful flights might light nightly delights despite slight height fright.", focus: "R, L, and F sound combinations" }
      ]
    }
  };

  // Scroll to bottom effect
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [feedback]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (isListening && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setGameTimer(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && isListening) {
      stopListening();
    }
    return () => clearInterval(timer);
  }, [isListening, timeLeft]);

  // Generate appropriate sentences based on category and difficulty
  const generateSentences = () => {
    setIsLoading(true);
    try {
      // Using the sample sentences object
      const sentences = sampleSentences[category][difficulty] || [];
      
      if (sentences.length > 0) {
        setSentenceList(sentences);
        setSelectedSentenceIndex(0);
        setCurrentSentence(sentences[0].text);
        setFocus(sentences[0].focus);
      } else {
        // Fallback in case the category/difficulty combination doesn't exist
        setFallbackSentence();
      }
      
      setTimeLimit(difficultySettings[difficulty].timeLimit);
      setTimeLeft(difficultySettings[difficulty].timeLimit);
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating sentences:", error);
      setFallbackSentence();
      setIsLoading(false);
    }
  };

  const setFallbackSentence = () => {
    const fallbackSentences = [
      { text: "She sells seashells by the seashore.", focus: "S sound pronunciation" },
      { text: "The thirty-three thieves thought that they thrilled the throne throughout Thursday.", focus: "TH sound consistency" },
      { text: "Red leather, yellow leather, red leather, yellow leather.", focus: "L and R sound distinction" }
    ];
    
    setSentenceList(fallbackSentences);
    setSelectedSentenceIndex(0);
    setCurrentSentence(fallbackSentences[0].text);
    setFocus(fallbackSentences[0].focus);
    setTimeLimit(difficultySettings[difficulty].timeLimit);
    setTimeLeft(difficultySettings[difficulty].timeLimit);
  };

  // Select a specific sentence from the list
  const selectSentence = (index) => {
    setSelectedSentenceIndex(index);
    setCurrentSentence(sentenceList[index].text);
    setFocus(sentenceList[index].focus);
  };

  // Start recording
  const startListening = async () => {
    setIsListening(true);
    setGameStarted(true);
    
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
        
        if (!gameComplete) {
          // Create a FormData object to send the audio file
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.wav');
          formData.append('model', 'distil-whisper-large-v3-en');
          
          try {
            setIsAnalyzing(true);
            
            // Transcribe the speech
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
            
            const transcribedText = response.data.text;
            setTranscript(transcribedText);
            
            // Now analyze the pronunciation
            await analyzePronunciation(transcribedText);
          } catch (err) {
            console.error("Speech-to-text error:", err);
            setFeedback("Sorry, I couldn't transcribe your speech. Please try again.");
          } finally {
            setIsAnalyzing(false);
          }
        }
      };
      
      mediaRecorder.start(1000); // Start recording and save chunks every second
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
    }
  };

  // Stop recording
  const stopListening = () => {
    setIsListening(false);
    setGameComplete(true);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Also stop all tracks in the stream
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    }
  };

  const analyzePronunciation = async (spokenText) => {
    setIsAiThinking(true);
    let newScores = null;
    
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "system",
              content: `You are evaluating a user's pronunciation of a challenging sentence. Compare their spoken attempt with the target sentence.

Target Sentence: "${currentSentence}"
Focus Area: ${focus}

Evaluate the pronunciation in the following categories:
1. Accuracy: How closely does the spoken text match the target sentence?
2. Clarity: How clear and understandable was their speech?
3. Fluency: How smoothly did they transition between words and sounds?
4. Pronunciation: How well did they pronounce specific challenging sounds?

Provide detailed feedback for each category in the following format:

First provide detailed feedback for each category:
1. Accuracy: [feedback]
2. Clarity: [feedback] 
3. Fluency: [feedback]
4. Pronunciation: [feedback]
5. Overall Impression: [feedback]
6. Specific Sound Issues: [mention any specific sound problems]

SCORES (in valid JSON format):
{"accuracy":80,"clarity":75,"fluency":70,"pronunciation":65,"overall":72}`
            },
            {
              role: "user",
              content: spokenText || "This is a test pronunciation for evaluation."
            }
          ]
        })
      });
  
      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        const analysisText = data.choices[0].message.content;
        
        // Extract JSON scores
        const jsonMatch = analysisText.match(/\{(?:[^{}]|)*\}/);
        let scoreData = null;
        
        if (jsonMatch) {
          try {
            const cleanJson = jsonMatch[0].replace(/[\n\r\t]/g, '').replace(/'/g, '"');
            scoreData = JSON.parse(cleanJson);
            newScores = {
              accuracy: Math.round(scoreData.accuracy || 0),
              clarity: Math.round(scoreData.clarity || 0),
              fluency: Math.round(scoreData.fluency || 0),
              pronunciation: Math.round(scoreData.pronunciation || 0),
              overall: Math.round(scoreData.overall || 0)
            };
            setScores(newScores);

            let feedbackText = analysisText;
            const scoresIndex = feedbackText.indexOf("SCORES");
            if (scoresIndex !== -1) {
              feedbackText = feedbackText.substring(0, scoresIndex).trim();
            }

            feedbackText = feedbackText.replace(/\{[^}]*\}/g, "").trim();
            setFeedback(feedbackText);
          } catch (e) {
            console.error("Error parsing JSON scores:", e);
            setDefaultScores();
          }
        } else {
          setDefaultScores();
          const feedbackText = analysisText.replace(/SCORES[\s\S]*$/i, "").trim();
          setFeedback(feedbackText);
        }
        
        // Save with the actual scores
        setGameStarted(true);
        await saveActivityData(newScores); 
      }        
    } catch (error) {
      console.error("Error analyzing pronunciation:", error);
      setFeedback("I encountered an error while analyzing your pronunciation. Please try again.");
      setDefaultScores();
    } finally {
      setIsAiThinking(false);
      setCurrentStep('result');
      // Try to save data after analysis is complete
      try {
        setGameStarted(true);
      } catch (error) {
        console.error('Failed to save activity data automatically:', error);
        setSaveError('Failed to save your progress. You can retry using the "Save Progress" button.');
      }
    }
  };
  
  // Helper function to set default scores
  const setDefaultScores = () => {
    setScores({
      accuracy: 70,
      clarity: 65,
      fluency: 60,
      pronunciation: 65,
      overall: 65
    });
  };

  // Save data to Firebase
  const saveActivityData = async (currentScores = null) => {
    const scoresToSave = currentScores || scores;
    
    if (!currentUser || !gameStarted || dataSaved) {
      console.log('Skipping data save:', { 
        currentUser: !!currentUser, 
        gameStarted, 
        dataSaved,
        currentScores: scoresToSave 
      });
      return;
    }
  
    try {
      const database = getDatabase();
      const timestamp = Date.now();
      
      console.log('Saving scores:', scoresToSave);
      
      // Create activity data
      const activityData = {
        date: new Date().toISOString(),
        description: `Completed Pronunciation Pro with score: ${Math.round(scoresToSave.overall)}%`,
        duration: `${Math.floor(gameTimer / 60)} min ${gameTimer % 60} sec`,
        id: `pronunciationpro_${timestamp}`,
        score: Math.round(scoresToSave.overall),
        type: "Pronunciation Pro",
        createdAt: serverTimestamp()
      };
  
      // Create game data
      const gameData = {
        timestamp: timestamp,
        sentence: currentSentence,
        focus: focus,
        category: category,
        difficulty: difficulty,
        duration: gameTimer,
        scores: scoresToSave,
        transcript: transcript,
        feedback: feedback,
        createdAt: serverTimestamp()
      };
  
      // Save activity data
      const historyRef = ref(database, `users/${currentUser.uid}/history/data/${timestamp}/activities/0`);
      await set(historyRef, activityData);
      
      // Save game data
      const gameRef = ref(database, `users/${currentUser.uid}/pronunciation-pro/${timestamp}`);
      await set(gameRef, gameData);
  
      console.log('Pronunciation Pro data and activity saved successfully');
      setDataSaved(true);
      setSaveError(null);
    } catch (error) {
      console.error('Error saving to database:', error);
      setSaveError('Failed to save your progress. Please try again.');
      throw error;
    }
  };

  // Manual retry for saving data
  const retrySaveData = async () => {
    try {
      await saveActivityData();
    } catch (error) {
      console.error('Error during manual save retry:', error);
    }
  };

  // Start game session
  const startGame = () => {
    setCurrentStep('game');
    setTimeLeft(timeLimit);
    setGameTimer(0);
    setGameComplete(false);
    setTranscript('');
    setFeedback('');
    setGameStarted(true);
    setDataSaved(false);
    setSaveError(null);
  };

  // Choose sentence from list
  const goToChooseSentence = () => {
    setCurrentStep('sentence');
  };

  // Reset everything for a new game
  const restartGame = () => {
    setCurrentStep('setup');
    setTimeLeft(difficultySettings[difficulty].timeLimit);
    setGameTimer(0);
    setGameComplete(false);
    setTranscript('');
    setFeedback('');
    setScores({
      accuracy: 0,
      clarity: 0,
      fluency: 0,
      pronunciation: 0,
      overall: 0
    });
    setDataSaved(false);
    setGameStarted(false);
    setSaveError(null);
    generateSentences();
  };

  // Go back to practice page
  const goBack = () => {
    navigate('/practice');
  };

  // Initial sentence generation
  useEffect(() => {
    if (currentStep === 'intro') {
      generateSentences();
    }
  }, [currentStep]);

  // Regenerate sentences when category/difficulty changes
  useEffect(() => {
    if (currentStep === 'setup') {
      generateSentences();
    }
  }, [category, difficulty]);

  // Loading screen
  if (isLoading && currentStep === 'intro') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #111827, #312e81)' }}>
        <CircularProgress size={60} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  // Introduction screen
  if (currentStep === 'intro') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StyledAvatar><RecordVoiceOver /></StyledAvatar>
                <GradientTypography variant="h4" fontWeight="bold">Pronunciation Pro</GradientTypography>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 4, color: 'grey.300' }}>
                Master challenging pronunciation with AI feedback! Practice difficult sentences, tongue twisters, and sound distinctions to improve your speech clarity and fluency.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ height: '100%', backgroundColor: 'rgba(31, 41, 55, 0.6)', borderRadius: '16px', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SportsEsports sx={{ mr: 1, color: '#8b5cf6' }} />
                        <Typography variant="h6" fontWeight="medium">Interactive Practice</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        Speak challenging sentences and receive real-time feedback on your pronunciation accuracy, clarity, and fluency.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ height: '100%', backgroundColor: 'rgba(31, 41, 55, 0.6)', borderRadius: '16px', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Assessment sx={{ mr: 1, color: '#8b5cf6' }} />
                        <Typography variant="h6" fontWeight="medium">AI Feedback</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        Receive detailed analysis on your speech patterns, problem areas, and specific sound issues from our advanced AI.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  startIcon={<ArrowBack />}
                  variant="outlined"
                  onClick={goBack}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                  }}
                >
                  Back to Practice
                </Button>
                <GradientButton
                  endIcon={<NavigateNext />}
                  onClick={() => setCurrentStep('setup')}
                >
                  Get Started
                </GradientButton>
              </Box>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

  // Setup screen
  if (currentStep === 'setup') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SchoolIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold">Practice Setup</Typography>
                </Box>
                <Chip 
                  label="New Session" 
                  icon={<Refresh fontSize="small" />} 
                  sx={{ 
                    bgcolor: 'rgba(79, 70, 229, 0.2)', 
                    color: 'white',
                    borderColor: 'rgba(79, 70, 229, 0.3)',
                    border: '1px solid'
                  }} 
                />
              </Box>
              
              <Divider sx={{ mb: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <ChatIcon sx={{ mr: 1, color: '#8b5cf6', fontSize: 20 }} />
                      Choose Category
                    </Typography>
                    <FormControl fullWidth>
                      <RadioGroup
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        sx={{ gap: 1 }}
                      >
                        {Object.entries(categoryOptions).map(([key, label]) => (
                          <FormControlLabel
                            key={key}
                            value={key}
                            control={
                              <Radio
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.3)',
                                  '&.Mui-checked': { color: '#8b5cf6' }
                                }}
                              />
                            }
                            label={label}
                            sx={{
                              bgcolor: category === key ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.4)',
                              borderRadius: 2,
                              p: 1,
                              pl: 2,
                              width: '100%',
                              m: 0,
                              border: '1px solid',
                              borderColor: category === key ? 'rgba(79, 70, 229, 0.5)' : 'transparent'
                            }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <SpeakerNotesIcon sx={{ mr: 1, color: '#8b5cf6', fontSize: 20 }} />
                      Difficulty Level
                    </Typography>
                    <FormControl fullWidth>
                      <RadioGroup
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        sx={{ gap: 1 }}
                      >
                        {['beginner', 'intermediate', 'advanced'].map((level) => (
                          <FormControlLabel
                            key={level}
                            value={level}
                            control={
                              <Radio
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.3)',
                                  '&.Mui-checked': { color: '#8b5cf6' }
                                }}
                              />
                            }
                            label={level.charAt(0).toUpperCase() + level.slice(1)}
                            sx={{
                              bgcolor: difficulty === level ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.4)',
                              borderRadius: 2,
                              p: 1,
                              pl: 2,
                              width: '100%',
                              m: 0,
                              border: '1px solid',
                              borderColor: difficulty === level ? 'rgba(79, 70, 229, 0.5)' : 'transparent'
                            }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>
              
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress size={40} sx={{ color: '#8b5cf6' }} />
                </Box>
              ) : (
                <Box sx={{ mb: 4, mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Preview Sentence</Typography>
                  <SentenceCard>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>{currentSentence}</Typography>
                    <Chip 
                      label={`Focus: ${focus}`}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(79, 70, 229, 0.3)', 
                        color: 'white',
                        borderColor: 'rgba(79, 70, 229, 0.5)',
                        border: '1px solid'
                      }} 
                    />
                  </SentenceCard>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                <Button
                  startIcon={<ArrowBack />}
                  variant="outlined"
                  onClick={() => setCurrentStep('intro')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                  }}
                >
                  Back
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ChevronRightIcon />}
                    onClick={goToChooseSentence}
                    sx={{
                      borderColor: 'rgba(79, 70, 229, 0.5)',
                      color: '#8b5cf6',
                      '&:hover': { borderColor: '#8b5cf6' }
                    }}
                  >
                    Choose Sentence
                  </Button>
                  <GradientButton
                    endIcon={<NavigateNext />}
                    onClick={startGame}
                  >
                    Start Practice
                  </GradientButton>
                </Box>
              </Box>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

  // Sentence selection screen
  if (currentStep === 'sentence') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SpeakerNotesIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold">Choose a Sentence</Typography>
                </Box>
                <Chip 
                  label={`${categoryOptions[category]} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`} 
                  sx={{ 
                    bgcolor: 'rgba(79, 70, 229, 0.2)', 
                    color: 'white',
                    borderColor: 'rgba(79, 70, 229, 0.3)',
                    border: '1px solid'
                  }} 
                />
              </Box>
              
              <Divider sx={{ mb: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="body1" sx={{ mb: 3, color: 'grey.300' }}>
                  Select one of the sentences below to practice with. Each focuses on different aspects of pronunciation.
                </Typography>
                
                {sentenceList.map((sentence, index) => (
                  <Paper 
                    key={index}
                    sx={{
                      p: 3,
                      mb: 2,
                      backgroundColor: selectedSentenceIndex === index ? 'rgba(79, 70, 229, 0.2)' : 'rgba(31, 41, 55, 0.4)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: selectedSentenceIndex === index ? 'rgba(79, 70, 229, 0.5)' : 'transparent',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: selectedSentenceIndex === index ? 'rgba(79, 70, 229, 0.25)' : 'rgba(31, 41, 55, 0.5)',
                      }
                    }}
                    onClick={() => selectSentence(index)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" fontWeight={selectedSentenceIndex === index ? 'medium' : 'normal'}>
                        {sentence.text}
                      </Typography>
                      <Radio 
                        checked={selectedSentenceIndex === index}
                        onChange={() => selectSentence(index)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.3)',
                          '&.Mui-checked': { color: '#8b5cf6' }
                        }}
                      />
                    </Box>
                    <Chip 
                      label={`Focus: ${sentence.focus}`}
                      size="small"
                      sx={{ 
                        mt: 2,
                        bgcolor: 'rgba(79, 70, 229, 0.3)', 
                        color: 'white',
                        borderColor: 'rgba(79, 70, 229, 0.5)',
                        border: '1px solid'
                      }} 
                    />
                  </Paper>
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                <Button
                  startIcon={<ArrowBack />}
                  variant="outlined"
                  onClick={() => setCurrentStep('setup')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                  }}
                >
                  Back to Setup
                </Button>
                <GradientButton
                  endIcon={<NavigateNext />}
                  onClick={startGame}
                >
                  Start Practice
                </GradientButton>
              </Box>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

  // Game screen
  if (currentStep === 'game') {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <StyledPaper>
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Mic sx={{ color: isListening ? '#ef4444' : '#8b5cf6', fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold">Pronunciation Challenge</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isListening && (
                    <RecordingIndicator>
                      <span className="pulse"></span>
                      Recording...
                    </RecordingIndicator>
                  )}
                  <Chip 
                    label={`Time: ${timeLeft}s`} 
                    sx={{ 
                      bgcolor: 'rgba(79, 70, 229, 0.2)', 
                      color: 'white',
                      borderColor: 'rgba(79, 70, 229, 0.3)',
                      border: '1px solid'
                    }} 
                  />
                </Box>
              </Box>
              
              <Divider sx={{ mb: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Box sx={{ mb: 6 }}>
                <Typography variant="body1" sx={{ mb: 3, color: 'grey.300' }}>
                  Read the sentence below, making sure to focus on proper pronunciation. Click "Start Recording" to begin.
                </Typography>
                
                <SentenceCard sx={{ mb: 4 }}>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium' }}>{currentSentence}</Typography>
                  <Chip 
                    label={`Focus: ${focus}`}
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(79, 70, 229, 0.3)', 
                      color: 'white',
                      borderColor: 'rgba(79, 70, 229, 0.5)',
                      border: '1px solid'
                    }} 
                  />
                </SentenceCard>
                
                {transcript && (
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(31, 41, 55, 0.6)', borderRadius: '16px', mb: 4 }}>
                    <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>Your speech:</Typography>
                    <Typography variant="body1">{transcript}</Typography>
                  </Paper>
                )}
                
                {isAnalyzing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', my: 4 }}>
                    <CircularProgress size={50} sx={{ color: '#8b5cf6', mb: 2 }} />
                    <Typography>Analyzing your pronunciation...</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                  {!isListening ? (
                    <GradientButton
                      disabled={isAnalyzing}
                      startIcon={<Mic />}
                      onClick={startListening}
                    >
                      Start Recording
                    </GradientButton>
                  ) : (
                    <RedButton
                      startIcon={<MicOff />}
                      onClick={stopListening}
                    >
                      Stop Recording
                    </RedButton>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                <Button
                  startIcon={<ArrowBack />}
                  variant="outlined"
                  onClick={() => setCurrentStep('setup')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </Container>
      </Box>
    );
  }

  // Results screen
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #312e81)', color: 'white', padding: 3, display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="md">
        <StyledPaper>
          <Box sx={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 200, height: 200, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEvents sx={{ color: '#8b5cf6', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">Practice Results</Typography>
              </Box>
              <Chip 
                label={scores.overall ? `Score: ${scores.overall}%` : 'Complete'}
                sx={{ 
                  bgcolor: 'rgba(79, 70, 229, 0.2)', 
                  color: 'white',
                  borderColor: 'rgba(79, 70, 229, 0.3)',
                  border: '1px solid'
                }} 
              />
            </Box>
            
            <Divider sx={{ mb: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            {isAiThinking ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', my: 6 }}>
                <CircularProgress size={60} sx={{ color: '#8b5cf6', mb: 3 }} />
                <Typography variant="h6">Analyzing your pronunciation...</Typography>
                <Typography variant="body1" sx={{ color: 'grey.400', mt: 2 }}>Our AI is preparing detailed feedback on your pronunciation.</Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 3 }}>Target Sentence</Typography>
                      <Paper sx={{ p: 3, backgroundColor: 'rgba(79, 70, 229, 0.15)', borderRadius: '16px' }}>
                        <Typography variant="body1" fontWeight="medium">{currentSentence}</Typography>
                        <Chip 
                          label={`Focus: ${focus}`}
                          size="small"
                          sx={{ 
                            mt: 2,
                            bgcolor: 'rgba(79, 70, 229, 0.3)', 
                            color: 'white',
                            borderColor: 'rgba(79, 70, 229, 0.5)',
                            border: '1px solid'
                          }} 
                        />
                      </Paper>
                    </Box>
                    
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 3 }}>Your Speech</Typography>
                      <Paper sx={{ p: 3, backgroundColor: 'rgba(31, 41, 55, 0.6)', borderRadius: '16px' }}>
                        <Typography variant="body1">{transcript || "No speech detected"}</Typography>
                      </Paper>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 3 }}>Performance Scores</Typography>
                    <Paper sx={{ p: 3, backgroundColor: 'rgba(31, 41, 55, 0.6)', borderRadius: '16px', mb: 4 }}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'grey.400' }}>Accuracy</Typography>
                          <Typography variant="body2" fontWeight="medium">{scores.accuracy}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={scores.accuracy} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#8b5cf6'
                            }
                          }} 
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'grey.400' }}>Clarity</Typography>
                          <Typography variant="body2" fontWeight="medium">{scores.clarity}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={scores.clarity} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#8b5cf6'
                            }
                          }} 
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'grey.400' }}>Fluency</Typography>
                          <Typography variant="body2" fontWeight="medium">{scores.fluency}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={scores.fluency} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#8b5cf6'
                            }
                          }} 
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'grey.400' }}>Pronunciation</Typography>
                          <Typography variant="body2" fontWeight="medium">{scores.pronunciation}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={scores.pronunciation} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#8b5cf6'
                            }
                          }} 
                        />
                      </Box>
                      
                      <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" fontWeight="medium">Overall Score</Typography>
                          <Typography variant="body1" fontWeight="bold">{scores.overall}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={scores.overall} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(to right, #4f46e5, #8b5cf6)'
                            }
                          }} 
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>Detailed Feedback</Typography>
                  <Paper sx={{ p: 4, backgroundColor: 'rgba(31, 41, 55, 0.6)', borderRadius: '16px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {feedback ? (
  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{feedback}</Typography>
) : (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
    <CircularProgress size={40} sx={{ color: '#8b5cf6', mr: 2 }} />
    <Typography>Generating feedback...</Typography>
  </Box>
)}
                    </Box>
                  </Paper>
                </Box>
                
                {saveError && (
                  <Paper sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                    borderRadius: '16px', 
                    mb: 4,
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <Typography sx={{ color: '#fca5a5' }}>{saveError}</Typography>
                    <Button 
                      variant="outlined" 
                      onClick={retrySaveData}
                      sx={{ 
                        mt: 2,
                        borderColor: '#fca5a5',
                        color: '#fca5a5',
                        '&:hover': {
                          borderColor: '#f87171'
                        }
                      }}
                    >
                      Retry Saving
                    </Button>
                  </Paper>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                  <Box>
                    <Button
                      startIcon={<ArrowBack />}
                      variant="outlined"
                      onClick={goBack}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                      }}
                    >
                      Exit
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => startGame()}
                      sx={{
                        borderColor: 'rgba(79, 70, 229, 0.5)',
                        color: '#8b5cf6',
                        '&:hover': { borderColor: '#8b5cf6' }
                      }}
                    >
                      Try Again
                    </Button>
                    <GradientButton
                      endIcon={<NavigateNext />}
                      onClick={restartGame}
                    >
                      New Practice
                    </GradientButton>
                  </Box>
                </Box>
              </>
            )}
            <div ref={messagesEndRef} />
          </Box>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default PronunciationPro;