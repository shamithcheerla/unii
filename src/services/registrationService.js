
// --- registrationService.js ---

import { db } from '../firebase';
import {
  doc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Registers a user for an event.
 * @param {string} eventId - The ID of the event.
 * @param {string} userId - The ID of the user.
 * @param {Array} answers - The user's answers to custom registration questions.
 * @param {object} teamData - Optional data for team registrations.
 * @returns {Promise<DocumentReference>}
 */
const registerForEvent = (eventId, userId, answers, teamData = {}) => {
  return addDoc(collection(db, 'registrations'), {
    eventId,
    userId,
    registrationAnswers: answers,
    teamName: teamData.name || null,
    teamCode: teamData.code || null,
    teamMembers: teamData.members || [userId],
    status: 'registered',
    paymentStatus: 'pending', // or 'free' if entryFee is 0
    attended: false,
    certificateGenerated: false,
    feedbackGiven: false,
    registeredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Gets all registrations for a specific event.
 * @param {string} eventId - The ID of the event.
 * @returns {Promise<QuerySnapshot>}
 */
const getRegistrationsByEvent = (eventId) => {
  const q = query(collection(db, 'registrations'), where('eventId', '==', eventId));
  return getDocs(q);
};

/**
 * Gets all registrations for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<QuerySnapshot>}
 */
const getRegistrationsByUser = (userId) => {
  const q = query(collection(db, 'registrations'), where('userId', '==', userId));
  return getDocs(q);
};

/**
 * Subscribes to real-time updates for registrations of a specific event.
 * @param {string} eventId - The ID of the event.
 * @param {function} callback - The function to call with the registrations data.
 * @returns {Unsubscribe}
 */
const subscribeToRegistrations = (eventId, callback) => {
  const q = query(collection(db, 'registrations'), where('eventId', '==', eventId));
  return onSnapshot(q, (querySnapshot) => {
    const registrations = [];
    querySnapshot.forEach((doc) => {
      registrations.push({ id: doc.id, ...doc.data() });
    });
    callback(registrations);
  });
};

/**
 * Updates the attendance status for a registration.
 * @param {string} registrationId - The ID of the registration.
 * @param {boolean} status - The new attendance status.
 * @returns {Promise<void>}
 */
const updateAttendance = (registrationId, status) => {
  return updateDoc(doc(db, 'registrations', registrationId), {
    attended: status,
    checkInTime: serverTimestamp(),
  });
};

/**
 * Joins a team by its team code.
 * @param {string} teamCode - The unique code of the team to join.
 * @param {string} userId - The ID of the user joining the team.
 * @returns {Promise<void>}
 */
const joinTeam = async (teamCode, userId) => {
  const q = query(collection(db, 'registrations'), where('teamCode', '==', teamCode));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const registrationDoc = querySnapshot.docs[0];
    const registrationId = registrationDoc.id;
    const teamMembers = registrationDoc.data().teamMembers;
    if (!teamMembers.includes(userId)) {
      return updateDoc(doc(db, 'registrations', registrationId), {
        teamMembers: [...teamMembers, userId],
      });
    }
  }
};

/**
 * Gets the waitlist position for a user for a specific event.
 * @param {string} eventId - The ID of the event.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<number>}
 */
const getWaitlistPosition = async (eventId, userId) => {
  const q = query(
    collection(db, 'registrations'),
    where('eventId', '==', eventId),
    where('status', '==', 'waitlisted')
  );
  const querySnapshot = await getDocs(q);
  const waitlistedRegistrations = [];
  querySnapshot.forEach(doc => {
    waitlistedRegistrations.push({ id: doc.id, ...doc.data() });
  });

  // Sort by registration time to determine position
  waitlistedRegistrations.sort((a, b) => a.registeredAt.toMillis() - b.registeredAt.toMillis());

  const userIndex = waitlistedRegistrations.findIndex(reg => reg.userId === userId);
  return userIndex !== -1 ? userIndex + 1 : -1; // Return 1-based position or -1 if not found
};


export {
  registerForEvent,
  getRegistrationsByEvent,
  getRegistrationsByUser,
  subscribeToRegistrations,
  updateAttendance,
  joinTeam,
  getWaitlistPosition,
};

// Exports: registerForEvent, getRegistrationsByEvent, getRegistrationsByUser, subscribeToRegistrations, updateAttendance, joinTeam, getWaitlistPosition
// Imported by: various UI components for registration and team management
