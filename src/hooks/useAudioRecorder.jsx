import { useState, useEffect, useCallback } from 'react';
import { startRecording } from '../services/audioService';

/**
 * Custom hook for managing audio recording functionality
 * @returns {Object} Audio recording state and control methods
 */
const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState(null);

  // Timer for tracking recording duration
  useEffect(() => {
    let intervalId;
    
    if (isRecording && recordingStartTime) {
      intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording, recordingStartTime]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (recorder) {
        if (recorder.state === 'recording') {
          recorder.cancel();
        }
      }
    };
  }, [recorder]);

  /**
   * Start recording audio
   */
  const startAudioRecording = useCallback(async () => {
    try {
      setRecordingError(null);
      setAudioData(null);
      
      const recorderInstance = await startRecording();
      setRecorder(recorderInstance);
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingError(error.message || 'Failed to access microphone');
      return false;
    }
  }, []);

  /**
   * Stop recording and process audio data
   */
  const stopAudioRecording = useCallback(async () => {
    if (!recorder) {
      setRecordingError('No active recording found');
      return null;
    }
    
    try {
      const data = await recorder.stop();
      setIsRecording(false);
      setAudioData(data);
      setRecorder(null);
      
      return data;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setRecordingError(error.message || 'Failed to process recording');
      setIsRecording(false);
      setRecorder(null);
      
      return null;
    }
  }, [recorder]);

  /**
   * Cancel recording without saving data
   */
  const cancelAudioRecording = useCallback(() => {
    if (recorder) {
      recorder.cancel();
      setIsRecording(false);
      setRecorder(null);
      setRecordingDuration(0);
    }
  }, [recorder]);

  return {
    isRecording,
    recordingError,
    audioData,
    recordingDuration,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording
  };
};

export default useAudioRecorder;