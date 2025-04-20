import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  initializeAuth,
  indexedDBLocalPersistence
} from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { startActivityTracking, stopActivityTracking } from '../services/historyService';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Enable offline persistence with better error handling
    const initAuth = async () => {
      try {
        // Use only one persistence method to avoid conflicts
        await setPersistence(auth, browserLocalPersistence);
        console.log("Firebase persistence set successfully");
      } catch (error) {
        console.error('Persistence setup failed:', error);
        // Continue without persistence rather than failing completely
      }
    };
    
    initAuth();
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `${user.email} logged in` : "No user");
      setCurrentUser(user);
      // Once we have a definitive answer from Firebase about auth state, we can consider loading complete
      setLoading(false);
    });
  
    return unsubscribe;
  }, []);

  // Add activity tracking effect inside the component
  useEffect(() => {
    if (currentUser) {
      startActivityTracking(currentUser.uid);
    }
    return () => {
      stopActivityTracking();
    };
  }, [currentUser]);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    
    if (!navigator.onLine) {
      setError('You appear to be offline. Please check your internet connection.');
      setLoading(false);
      throw new Error('No internet connection');
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check for user data in database
      const database = getDatabase();
      const userRef = ref(database, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);
      
      // If user data doesn't exist, create it instead of throwing an error
      if (!snapshot.exists()) {
        console.log("User authenticated but no database record found. Creating one now.");
        await set(userRef, {
          email: userCredential.user.email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        // Update last login time
        await set(ref(database, `users/${userCredential.user.uid}/lastLogin`), new Date().toISOString());
      }

      setCurrentUser(userCredential.user);
      console.log("Login successful:", userCredential.user.email);
      return userCredential;
    } catch (error) {
      console.error('Login error:', error.code || error.message);
      
      // Handle specific Firebase auth errors with user-friendly messages
      if (error.code === 'auth/network-request-failed') {
        setError('Network connection issue. Please check your internet connection and try again.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please check your email or sign up.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user data in database
      const database = getDatabase();
      await set(ref(database, `users/${userCredential.user.uid}`), {
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
      });

      console.log("User signed up successfully:", userCredential.user.email);
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error.code, error.message);
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error.code, error.message);
      setError(error.message);
      throw error;
    }
  };

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Initialize database
      const database = getDatabase();
      const userRef = ref(database, `users/${result.user.uid}`);
      await set(userRef, {
        name: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        lastLogin: new Date().toISOString()
      });
  
      return result.user;
    } catch (error) {
      console.error("Google Sign-in error:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    error,
    googleSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};