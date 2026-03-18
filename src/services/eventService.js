
// --- eventService.js ---

import { db } from '../firebase';
import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Creates a new event.
 * @param {object} eventData - The data for the new event.
 * @returns {Promise<DocumentReference>}
 */
const createEvent = (eventData) => {
  return addDoc(collection(db, 'events'), {
    ...eventData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'draft',
    currentParticipants: 0,
    resultsPublished: false,
  });
};

/**
 * Updates an existing event.
 * @param {string} eventId - The ID of the event to update.
 * @param {object} data - The data to update.
 * @returns {Promise<void>}
 */
const updateEvent = (eventId, data) => {
  return updateDoc(doc(db, 'events', eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Deletes an event.
 * @param {string} eventId - The ID of the event to delete.
 * @returns {Promise<void>}
 */
const deleteEvent = (eventId) => {
  return deleteDoc(doc(db, 'events', eventId));
};

/**
 * Gets a single event by its ID.
 * @param {string} eventId - The ID of the event to get.
 * @returns {Promise<DocumentSnapshot>}
 */
const getEventById = (eventId) => {
  return getDoc(doc(db, 'events', eventId));
};

/**
 * Gets a list of events with optional filters.
 * @param {object} filters - The filters to apply.
 * @param {string} [filters.status] - Filter by event status.
 * @param {string} [filters.category] - Filter by event category.
 * @param {string} [filters.college] - Filter by host college.
 * @param {Date} [filters.date] - Filter by date.
 * @returns {Promise<QuerySnapshot>}
 */
const getEvents = (filters = {}) => {
  let q = query(collection(db, 'events'));

  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }
  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters.college) {
    q = query(q, where('hostCollegeId', '==', filters.college));
  }
  if (filters.date) {
    q = query(q, where('startDate', '>=', filters.date));
  }

  return getDocs(q);
};

/**
 * Subscribes to real-time updates for a single event.
 * @param {string} eventId - The ID of the event to subscribe to.
 * @param {function} callback - The function to call with the event data.
 * @returns {Unsubscribe}
 */
const subscribeToEvent = (eventId, callback) => {
  return onSnapshot(doc(db, 'events', eventId), (doc) => {
    callback(doc.data());
  });
};

/**
 * Subscribes to real-time updates for all events.
 * @param {function} callback - The function to call with the array of events.
 * @returns {Unsubscribe}
 */
const subscribeToAllEvents = (callback) => {
  const q = query(collection(db, 'events'), where('status', '==', 'published'));
  return onSnapshot(q, (querySnapshot) => {
    const events = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
    callback(events);
  });
};

/**
 * Publishes a draft event.
 * @param {string} eventId - The ID of the event to publish.
 * @returns {Promise<void>}
 */
const publishEvent = (eventId) => {
  return updateDoc(doc(db, 'events', eventId), { status: 'published' });
};

/**
 * Marks an event as complete.
 * @param {string} eventId - The ID of the event to complete.
 * @returns {Promise<void>}
 */
const markEventComplete = (eventId) => {
  return updateDoc(doc(db, 'events', eventId), { status: 'completed' });
};


export {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getEvents,
  subscribeToEvent,
  subscribeToAllEvents,
  publishEvent,
  markEventComplete,
};

// Exports: createEvent, updateEvent, deleteEvent, getEventById, getEvents, subscribeToEvent, subscribeToAllEvents, publishEvent, markEventComplete
// Imported by: various UI components for event management and display
