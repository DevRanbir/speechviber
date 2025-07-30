import apiKeysService, { API_KEY_NAMES } from './apiKeysService';

/**
 * Environment variables replacement utility
 * This replaces process.env calls with Firebase-backed API keys
 */
class EnvironmentService {
  constructor() {
    this.fallbackToProcessEnv = true; // Fallback to process.env if Firebase fails
  }

  /**
   * Get environment variable (mimics process.env behavior)
   */
  async get(keyName) {
    try {
      // Try to get from Firebase first
      const value = await apiKeysService.getApiKey(keyName);
      if (value) {
        return value;
      }
    } catch (error) {
      console.warn(`Failed to get ${keyName} from Firebase:`, error);
    }

    // Fallback to process.env if enabled and available
    if (this.fallbackToProcessEnv && process.env[keyName]) {
      console.warn(`Using process.env fallback for ${keyName}`);
      return process.env[keyName];
    }

    return undefined;
  }

  /**
   * Get environment variable synchronously (uses cache)
   */
  getSynch(keyName) {
    // Try to get from Firebase cache first
    const value = apiKeysService.getKeySynch(keyName);
    if (value) {
      return value;
    }

    // Fallback to process.env if enabled and available
    if (this.fallbackToProcessEnv && process.env[keyName]) {
      return process.env[keyName];
    }

    return undefined;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      await apiKeysService.initialize();
    } catch (error) {
      console.error('Failed to initialize environment service:', error);
      if (this.fallbackToProcessEnv) {
        console.warn('Will use process.env as fallback');
      }
      throw error;
    }
  }

  /**
   * Disable fallback to process.env (force Firebase only)
   */
  disableProcessEnvFallback() {
    this.fallbackToProcessEnv = false;
  }

  /**
   * Enable fallback to process.env
   */
  enableProcessEnvFallback() {
    this.fallbackToProcessEnv = true;
  }
}

// Create singleton instance
const environmentService = new EnvironmentService();

// Export the service
export default environmentService;

// Convenience methods
export const getEnvVar = (keyName) => environmentService.get(keyName);
export const getEnvVarSynch = (keyName) => environmentService.getSynch(keyName);
export const initializeEnvironment = () => environmentService.initialize();

/**
 * React hook for getting environment variables
 */
import { useState, useEffect } from 'react';

export const useEnvVar = (keyName) => {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnvVar = async () => {
      try {
        setLoading(true);
        setError(null);
        const envValue = await environmentService.get(keyName);
        setValue(envValue);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvVar();
  }, [keyName]);

  return { value, loading, error };
};

/**
 * Higher-order component for components that need environment variables
 */
export const withEnvironmentVariables = (WrappedComponent, requiredKeys = []) => {
  return function WithEnvironmentVariablesComponent(props) {
    const [envVars, setEnvVars] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchEnvVars = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const vars = {};
          for (const key of requiredKeys) {
            vars[key] = await environmentService.get(key);
          }
          
          setEnvVars(vars);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      };

      if (requiredKeys.length > 0) {
        fetchEnvVars();
      } else {
        setLoading(false);
      }
    }, []);

    if (loading) {
      return <div>Loading environment variables...</div>;
    }

    if (error) {
      return <div>Error loading environment variables: {error.message}</div>;
    }

    return <WrappedComponent {...props} envVars={envVars} />;
  };
};
