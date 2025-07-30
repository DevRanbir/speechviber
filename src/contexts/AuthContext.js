import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getDatabase, ref, get, set, update } from 'firebase/database';
import { startActivityTracking, stopActivityTracking } from '../services/historyservice';
import CustomLoader from '../components/CustomLoader';

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

  // Reset password function that was referenced but not defined
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Password reset error:", error.code, error.message);
      setError(error.message);
      throw error;
    }
  };

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

  // Initialize auth and set up persistence
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
    
    if (!navigator.onLine) {
      setError('You appear to be offline. Please check your internet connection.');
      throw new Error('No internet connection');
    }
    
    try {
      // First verify credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Show success message immediately after credentials verification
      setError('Login successful! Preparing your dashboard...');
      
      
      // Then proceed with loading and database operations
      setLoading(true);
      
      const database = getDatabase();
      const userRef = ref(database, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        await set(userRef, {
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
      } else {
        await update(userRef, {
          lastLogin: new Date().toISOString()
        });
      }

      console.log("Login successful:", userCredential.user.email);
      return userCredential;
      
    } catch (error) {
      console.error('Login error:', error.code || error.message);
      
      let errorMessage;
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please check your email or sign up.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else {
        errorMessage = 'Authentication failed. Please try again.';
      }
      
      setError(errorMessage);
      throw error;
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

  const value = useMemo(() => ({
    currentUser,
    loading,
    error,
    login,
    signup,
    logout,
    googleSignIn,
    resetPassword
  }), [currentUser, loading, error]);

  // Loading state rendering
  if (loading) {
    return <CustomLoader />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}