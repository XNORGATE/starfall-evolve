import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';

// Firebase configuration - Replace with your actual Firebase project config
// Get this from: Firebase Console > Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyA51BBI0SMHT1QC-EGBXf4K_wcvZhyxIOI",
  authDomain: "hackertiger-6821e.firebaseapp.com",
  projectId: "hackertiger-6821e",
  storageBucket: "hackertiger-6821e.firebasestorage.app",
  messagingSenderId: "962064377413",
  appId: "1:962064377413:web:cec4d457f0166fc34c252c",
  measurementId: "G-N4X46WNQ90"
}; 

// TODO: Replace the above with your actual Firebase config from:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing
// 3. Go to Project Settings > General
// 4. Add a Web app if you haven't already
// 5. Copy the config object and replace the above

// Initialize Firebase with duplicate app protection
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    app = getApps()[0]; // Use existing app
  } else {
    throw error;
  }
}
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google sign in
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: {
        email: result.user.email || '',
        name: result.user.displayName || '',
        uid: result.user.uid
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Auth state listener
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};