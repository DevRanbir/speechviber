import environmentService from '../services/environmentService';
import { API_KEY_NAMES } from '../services/apiKeysService';

/**
 * Utility functions to get API keys - replacing direct process.env usage
 */

// Get Groq API Key 1
export const getGroqApiKey1 = async () => {
  return await environmentService.get(API_KEY_NAMES.GROQ_API_KEY_1);
};

// Get Groq API Key 2  
export const getGroqApiKey2 = async () => {
  return await environmentService.get(API_KEY_NAMES.GROQ_API_KEY_2);
};

// Get Google API Key
export const getGoogleApiKey = async () => {
  return await environmentService.get(API_KEY_NAMES.GOOGLE_API_KEY);
};

// Get Speech API Key
export const getSpeechApiKey = async () => {
  return await environmentService.get(API_KEY_NAMES.SPEECH_API_KEY);
};

// Get Groq API URL
export const getGroqApiUrl = async () => {
  return await environmentService.get(API_KEY_NAMES.GROQ_API_URL);
};

// Synchronous versions (uses cache)
export const getGroqApiKey1Synch = () => {
  return environmentService.getSynch(API_KEY_NAMES.GROQ_API_KEY_1);
};

export const getGroqApiKey2Synch = () => {
  return environmentService.getSynch(API_KEY_NAMES.GROQ_API_KEY_2);
};

export const getGoogleApiKeySynch = () => {
  return environmentService.getSynch(API_KEY_NAMES.GOOGLE_API_KEY);
};

export const getSpeechApiKeySynch = () => {
  return environmentService.getSynch(API_KEY_NAMES.SPEECH_API_KEY);
};

export const getGroqApiUrlSynch = () => {
  return environmentService.getSynch(API_KEY_NAMES.GROQ_API_URL);
};

// Generic function to get any environment variable
export const getEnvVar = async (keyName) => {
  return await environmentService.get(keyName);
};

export const getEnvVarSynch = (keyName) => {
  return environmentService.getSynch(keyName);
};

// Default exports for convenience
export default {
  getGroqApiKey1,
  getGroqApiKey2,
  getGoogleApiKey,
  getSpeechApiKey,
  getGroqApiUrl,
  getGroqApiKey1Synch,
  getGroqApiKey2Synch,
  getGoogleApiKeySynch,
  getSpeechApiKeySynch,
  getGroqApiUrlSynch,
  getEnvVar,
  getEnvVarSynch
};
