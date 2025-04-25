import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider, 
  signInWithPopup
} from 'firebase/auth';
import { getDatabase, ref, get, set, update } from 'firebase/database';
import { startActivityTracking, stopActivityTracking } from '../services/historyservice';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const database = getDatabase();
      const userRef = ref(database, `users/${user.uid}`);
      
      // Check if user data exists
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        // Only create new user data if it doesn't exist
        await set(userRef, {
          email: user.email,
          name: user.displayName || '',
          photoURL: user.photoURL || '',
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          profile: {
            achievements: {
              currentRank: "Starter",
              currentStage: "Novice",
              points: 0,
              totalTime: 0,
              totalSeconds: 0
            }
          }
        });
      } else {
        // Only update login time and preserve all other data
        await update(userRef, {
          lastLogin: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Enable offline persistence
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("Firebase persistence set successfully");
      } catch (error) {
        console.error('Persistence setup failed:', error);
        // Continue without persistence rather than failing completely
      }
    };
    
    initAuth();
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `${user.email} logged in` : "No user");
      
      if (user) {
        // Store the authenticated user's UID in localStorage
        localStorage.setItem('authenticatedUID', user.uid);
        
        const database = getDatabase();
        const userRef = ref(database, `users/${user.uid}`);
        
        try {
          const snapshot = await get(userRef);
          
          if (!snapshot.exists()) {
            // Only create new user data if it doesn't exist
            await set(userRef, {
              email: user.email,
              name: user.displayName || '',
              photoURL: user.photoURL || '',
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              profile: {
                achievements: {
                  currentRank: "Starter",
                  currentStage: "Novice",
                  points: 0,
                  totalTime: 0,
                  totalSeconds: 0
                }
              }
            });
          } else {
            // Update only login time and preserve existing data
            await update(userRef, {
              lastLogin: new Date().toISOString(),
              email: user.email,
              name: user.displayName || snapshot.val().name,
              photoURL: user.photoURL || snapshot.val().photoURL
            });
          }
        } catch (error) {
          console.error("Database operation failed:", error);
        }
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Add activity tracking effect
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
        await update(userRef, {
          lastLogin: new Date().toISOString()
        });
      }

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
        lastLogin: new Date().toISOString(),
        profile: {
          achievements: {
            currentRank: "Starter",
            currentStage: "Novice",
            points: 0,
            totalTime: 0,
            totalSeconds: 0
          }
        }
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
      localStorage.removeItem('authenticatedUID');
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error.code, error.message);
      setError(error.message);
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    googleSignIn,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}