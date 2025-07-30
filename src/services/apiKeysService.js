import { db } from '../firebase/config';
import { doc, getDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';

class ApiKeysService {
  constructor() {
    this.cache = {};
    this.cacheExpiry = {};
    this.listeners = {};
    this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize the service and fetch all API keys
   */
  async initialize() {
    if (this.isInitialized) {
      return this.cache;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._fetchAllKeys();
    
    try {
      await this.initPromise;
      this.isInitialized = true;
      this._setupRealtimeListener();
      return this.cache;
    } catch (error) {
      console.error('Failed to initialize API keys service:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Get a specific API key
   */
  async getApiKey(keyName) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check cache first
    if (this._isCacheValid(keyName)) {
      return this.cache[keyName];
    }

    // If cache is invalid or missing, fetch from Firebase
    try {
      const value = await this._fetchKeyFromFirebase(keyName);
      this._updateCache(keyName, value);
      return value;
    } catch (error) {
      console.error(`Failed to fetch API key ${keyName}:`, error);
      
      // Return cached value even if expired as fallback
      if (this.cache[keyName]) {
        console.warn(`Using expired cache for ${keyName}`);
        return this.cache[keyName];
      }
      
      throw error;
    }
  }

  /**
   * Get all API keys as an object
   */
  async getAllKeys() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return { ...this.cache };
  }

  /**
   * Get a key synchronously (only works if cache is available)
   */
  getKeySynch(keyName) {
    if (this._isCacheValid(keyName)) {
      return this.cache[keyName];
    }
    
    // Return cached value even if expired as fallback
    if (this.cache[keyName]) {
      return this.cache[keyName];
    }
    
    return null;
  }

  /**
   * Check if a key exists in cache
   */
  hasKey(keyName) {
    return keyName in this.cache;
  }

  /**
   * Clear cache for a specific key or all keys
   */
  clearCache(keyName = null) {
    if (keyName) {
      delete this.cache[keyName];
      delete this.cacheExpiry[keyName];
    } else {
      this.cache = {};
      this.cacheExpiry = {};
    }
  }

  /**
   * Fetch all keys from Firebase Firestore
   */
  async _fetchAllKeys() {
    try {
      const keysCollectionRef = collection(db, 'api-keys');
      const snapshot = await getDocs(keysCollectionRef);
      
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const keyName = doc.id;
          const keyData = doc.data();
          const keyValue = keyData.value || keyData.key || '';
          this._updateCache(keyName, keyValue);
        });
        
        console.log('API keys fetched and cached successfully');
        return this.cache;
      } else {
        console.warn('No API keys found in Firestore');
        return {};
      }
    } catch (error) {
      console.error('Error fetching API keys from Firestore:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific key from Firestore
   */
  async _fetchKeyFromFirebase(keyName) {
    try {
      const keyDocRef = doc(db, 'api-keys', keyName);
      const docSnapshot = await getDoc(keyDocRef);
      
      if (docSnapshot.exists()) {
        const keyData = docSnapshot.data();
        return keyData.value || keyData.key || '';
      } else {
        throw new Error(`API key ${keyName} not found in Firestore`);
      }
    } catch (error) {
      console.error(`Error fetching API key ${keyName}:`, error);
      throw error;
    }
  }

  /**
   * Setup real-time listener for API keys updates
   */
  _setupRealtimeListener() {
    try {
      const keysCollectionRef = collection(db, 'api-keys');
      
      // Remove existing listener if any
      if (this.listeners.apiKeys) {
        this.listeners.apiKeys();
      }
      
      // Setup new listener
      this.listeners.apiKeys = onSnapshot(keysCollectionRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const keyName = change.doc.id;
          const keyData = change.doc.data();
          const keyValue = keyData.value || keyData.key || '';
          
          if (change.type === 'added' || change.type === 'modified') {
            this._updateCache(keyName, keyValue);
            console.log(`API key ${keyName} updated from Firestore realtime update`);
          } else if (change.type === 'removed') {
            delete this.cache[keyName];
            delete this.cacheExpiry[keyName];
            console.log(`API key ${keyName} removed from cache`);
          }
        });
      }, (error) => {
        console.error('Error in API keys realtime listener:', error);
      });
      
    } catch (error) {
      console.error('Error setting up realtime listener:', error);
    }
  }

  /**
   * Update cache with a key-value pair
   */
  _updateCache(keyName, value) {
    this.cache[keyName] = value;
    this.cacheExpiry[keyName] = Date.now() + this.CACHE_DURATION;
  }

  /**
   * Check if cache for a key is still valid
   */
  _isCacheValid(keyName) {
    return (
      keyName in this.cache &&
      keyName in this.cacheExpiry &&
      Date.now() < this.cacheExpiry[keyName]
    );
  }

  /**
   * Cleanup method to remove listeners
   */
  cleanup() {
    Object.values(this.listeners).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners = {};
    this.clearCache();
    this.isInitialized = false;
    this.initPromise = null;
  }
}

// Create singleton instance
const apiKeysService = new ApiKeysService();

// Export both the service instance and individual methods for convenience
export default apiKeysService;

// Convenience methods for direct use
export const getApiKey = (keyName) => apiKeysService.getApiKey(keyName);
export const getAllApiKeys = () => apiKeysService.getAllKeys();
export const getApiKeySynch = (keyName) => apiKeysService.getKeySynch(keyName);
export const initializeApiKeys = () => apiKeysService.initialize();

// Key name constants for consistency
export const API_KEY_NAMES = {
  GROQ_API_KEY_1: 'REACT_APP_GROQ_API_KEY_1',
  GROQ_API_KEY_2: 'REACT_APP_GROQ_API_KEY_2',
  GOOGLE_API_KEY: 'REACT_APP_GOOGLE_API_KEY',
  SPEECH_API_KEY: 'REACT_APP_SPEECH_API_KEY',
  GROQ_API_URL: 'REACT_APP_GROQ_API_URL'
};
