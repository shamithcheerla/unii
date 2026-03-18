
// --- authService.js ---

import { 
  auth, 
  db 
} from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Signs up a new user with email and password.
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @param {object} profileData - Additional user profile data.
 * @returns {Promise<UserCredential>}
 */
const signUpWithEmail = async (email, password, role, profileData) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Add user profile to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    ...profileData,
    uid: user.uid,
    email,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isActive: true,
    isApproved: role === 'student' // Students are pre-approved
  });

  // Update Firebase Auth profile
  await updateProfile(user, { displayName: profileData.name });

  return userCredential;
};

/**
 * Signs in a user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
const signInWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Signs in a user with Google OAuth.
 * @returns {Promise<UserCredential>}
 */
const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
const signout = () => {
  return signOut(auth);
};

/**
 * Listens for authentication state changes.
 * @param {function} callback - A function to call with the user object on auth state change.
 * @returns {Unsubscribe}
 */
const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Sends a password reset email to the given email address.
 * @param {string} email
 * @returns {Promise<void>}
 */
const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Gets the currently signed-in user.
 * @returns {User | null}
 */
const getCurrentUser = () => {
  return auth.currentUser;
};

export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signout,
  onAuthChange,
  resetPassword,
  getCurrentUser,
};

// Exports: signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, onAuthChange, resetPassword, getCurrentUser
// Imported by: various UI components (e.g., LoginPage, RegistrationPage)
