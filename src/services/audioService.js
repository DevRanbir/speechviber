// audioService.js
import axios from 'axios';
import { getSpeechApiKeySynch } from '../utils/apiKeys';

/**
 * Starts recording audio and returns recording controls
 * @returns {Promise<Object>} Object containing recording controls and methods
 */
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    const audioChunks = [];

    // Set up event listeners
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms for smoother handling

    // Return control object
    return {
      mediaRecorder,
      stream,
      
      // Method to stop recording and get the audio data
      async stop() {
        return new Promise((resolve, reject) => {
          mediaRecorder.onstop = () => {
            // Clean up the stream tracks
            stream.getTracks().forEach(track => track.stop());
            
            if (audioChunks.length === 0) {
              reject(new Error("No audio data recorded"));
              return;
            }
            
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            resolve({
              audioBlob,
              audioUrl,
              duration: mediaRecorder.audioDuration || estimateAudioDuration(audioBlob.size)
            });
          };
          
          mediaRecorder.stop();
        });
      },
      
      // Method to cancel recording
      cancel() {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      },
      
      // Get current recording state
      get state() {
        return mediaRecorder.state;
      }
    };
  } catch (error) {
    console.error("Error accessing microphone:", error);
    throw error;
  }
};

/**
 * Estimate audio duration from file size
 * @param {number} fileSize - Size of the audio file in bytes
 * @returns {number} Estimated duration in seconds
 */
const estimateAudioDuration = (fileSize) => {
  // WebM audio at decent quality is roughly 20KB per second
  return fileSize / (20 * 1024);
};

/**
 * Transcribe audio using a reliable external API
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<string>} Transcribed text
 */
const transcribeAudio = async (audioBlob) => {
  try {
    // Create form data for the API request
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', 'en-US');
    
    // Send to a reliable external API
    // Replace with your preferred service (AssemblyAI, Google Speech-to-Text, etc.)
    const response = await axios.post(
      'https://api.speech-to-text-service.com/v1/transcribe', 
      formData,
      {
        headers: {
          'Authorization': `Bearer ${getSpeechApiKeySynch()}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    if (!response.data || !response.data.transcript) {
      throw new Error('No transcript returned from API');
    }
    
    return response.data.transcript;
  } catch (error) {
    console.error('Transcription error:', error);
    
    // If the external API fails, fall back to browser's Speech Recognition API
    return fallbackBrowserTranscription(audioBlob);
  }
};

/**
 * Fallback to browser Speech Recognition API if external API fails
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<string>} Transcribed text
 */
const fallbackBrowserTranscription = async (audioBlob) => {
  return new Promise((resolve, reject) => {
    const audioURL = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioURL);
    
    // Set up Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    
    let transcript = '';
    
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // Still try to resolve with partial transcript if we have one
      resolve(transcript.trim() || 'Transcription failed. Please try again.');
    };
    
    recognition.onend = () => {
      if (audio.currentTime < audio.duration) {
        // If audio is still playing, continue recognition
        recognition.start();
      } else {
        resolve(transcript.trim() || 'No speech detected. Please speak clearly and try again.');
      }
    };
    
    audio.onerror = () => {
      recognition.stop();
      reject(new Error('Audio playback error'));
    };
    
    audio.onended = () => {
      recognition.stop();
    };
    
    // Start playing audio and recognition
    audio.play()
      .then(() => recognition.start())
      .catch(error => {
        reject(new Error('Could not play audio file: ' + error.message));
      });
  });
};

export { startRecording, transcribeAudio };