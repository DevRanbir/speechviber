import React, { useState, useRef, useContext } from 'react';
import { Box, Typography, Paper, Button, Grid, LinearProgress } from '@mui/material';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import { analyzeSpeech } from '../../services/speechAnalysisService';
import { UserContext } from '../../context/UserContext';

// Update the component props to use recordedAudioData instead of audioData
const PracticeSession = ({ mode, onClose, recordedAudioData }) => {
  // Use recordedAudioData instead of audioData in your component
  
  // When analyzing speech
  const analyzeSpeech = () => {
    if (!recordedAudioData) {
      console.error('Audio data is missing');
      return;
    }
    // Use recordedAudioData for analysis
  };
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef(null);
  const { isRecording, audioData, startAudioRecording, stopAudioRecording } = useAudioRecorder();
  const { saveAnalysis } = useContext(UserContext);
  const [analysis, setAnalysis] = useState(null);

  const startSession = async () => {
    try {
      if (mode === 'video' || mode === 'combined') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
      if (mode === 'audio' || mode === 'combined') {
        startAudioRecording();
      }
      setIsActive(true);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const stopSession = async () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (mode === 'audio' || mode === 'combined') {
      stopAudioRecording();
      const results = analyzeSpeech(audioData);
      setAnalysis(results);
      saveAnalysis('practice', results);
    }
    setIsActive(false);
  };

  return (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Grid container spacing={3} direction="row-reverse">  {/* Added direction="row-reverse" */}
        {analysis && (mode === 'audio' || mode === 'combined') && (
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Analysis Results</Typography>
            {Object.entries(analysis).map(([key, value]) => (
              <Box key={key} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {key.charAt(0).toUpperCase() + key.slice(1)}: {value.score}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={value.confidence * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                  Confidence: {Math.round(value.confidence * 100)}%
                </Typography>
              </Box>
            ))}
          </Grid>
        )}

        <Grid item xs={12} md={mode === 'audio' ? 12 : 8}>
          {(mode === 'video' || mode === 'combined') && (
            <Box sx={{ mb: 3 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color={isActive ? "error" : "primary"}
              onClick={isActive ? stopSession : startSession}
            >
              {isActive ? 'Stop Practice' : 'Start Practice'}
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Exit Practice
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PracticeSession;