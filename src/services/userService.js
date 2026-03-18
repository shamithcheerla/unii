
// --- userService.js ---

import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Gets a user's profile from Firestore.
 * @param {string} uid - The user's UID.
 * @returns {Promise<DocumentSnapshot>}
 */
const getUserProfile = (uid) => {
  return getDoc(doc(db, 'users', uid));
};

/**
 * Updates a user's profile in Firestore.
 * @param {string} uid - The user's UID.
 * @param {object} data - The data to update.
 * @returns {Promise<void>}
 */
const updateUserProfile = (uid, data) => {
  return updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Gets all users with a specific role.
 * @param {string} role
 * @returns {Promise<QuerySnapshot>}
 */
const getUsersByRole = (role) => {
  const q = query(collection(db, 'users'), where('role', '==', role));
  return getDocs(q);
};

/**
 * Gets all users from a specific college.
 * @param {string} collegeId
 * @returns {Promise<QuerySnapshot>}
 */
const getUsersByCollege = (collegeId) => {
  const q = query(collection(db, 'users'), where('collegeId', '==', collegeId));
  return getDocs(q);
};

/**
 * Suspends a user.
 * @param {string} uid - The user's UID.
 * @returns {Promise<void>}
 */
const suspendUser = (uid) => {
  return updateDoc(doc(db, 'users', uid), { isActive: false });
};

/**
 * Approves a user (e.g., a coordinator).
 * @param {string} uid - The user's UID.
 * @returns {Promise<void>}
 */
const approveUser = (uid) => {
  return updateDoc(doc(db, 'users', uid), { isApproved: true });
};

/**
 * Searches for users by name.
 * @param {string} queryText
 * @returns {Promise<QuerySnapshot>}
 */
const searchUsers = (queryText) => {
  const q = query(collection(db, 'users'), where('name', '>=', queryText), where('name', '<=', queryText + '\uf8ff'));
  return getDocs(q);
};

export {
  getUserProfile,
  updateUserProfile,
  getUsersByRole,
  getUsersByCollege,
  suspendUser,
  approveUser,
  searchUsers,
};

// Exports: getUserProfile, updateUserProfile, getUsersByRole, getUsersByCollege, suspendUser, approveUser, searchUsers
// Imported by: various UI components for user management and profile display
