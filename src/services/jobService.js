
// --- jobService.js ---

import { db } from '../firebase';
import {
  doc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Creates a new job posting.
 * @param {object} jobData - The data for the new job.
 * @returns {Promise<DocumentReference>}
 */
const createJob = (jobData) => {
  return addDoc(collection(db, 'jobs'), {
    ...jobData,
    createdAt: serverTimestamp(),
    status: 'draft',
    viewCount: 0,
    applicationCount: 0,
  });
};

/**
 * Gets a list of jobs with optional filters.
 * @param {object} filters - The filters to apply.
 * @returns {Promise<QuerySnapshot>}
 */
const getJobs = (filters = {}) => {
  let q = query(collection(db, 'jobs'));

  // Add filters as needed

  return getDocs(q);
};

/**
 * Applies a user for a job.
 * @param {string} jobId - The ID of the job.
 * @param {string} userId - The ID of the user.
 * @param {object} applicationData - The user's application data.
 * @returns {Promise<DocumentReference>}
 */
const applyForJob = (jobId, userId, applicationData) => {
  return addDoc(collection(db, 'jobApplications'), {
    jobId,
    userId,
    ...applicationData,
    status: 'applied',
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Gets all job applications for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<QuerySnapshot>}
 */
const getApplicationsByUser = (userId) => {
  const q = query(collection(db, 'jobApplications'), where('userId', '==', userId));
  return getDocs(q);
};

/**
 * Updates the status of a job application.
 * @param {string} applicationId - The ID of the application to update.
 * @param {string} status - The new status.
 * @returns {Promise<void>}
 */
const updateApplicationStatus = (applicationId, status) => {
  return updateDoc(doc(db, 'jobApplications', applicationId), { 
    status, 
    updatedAt: serverTimestamp() 
  });
};

export {
  createJob,
  getJobs,
  applyForJob,
  getApplicationsByUser,
  updateApplicationStatus,
};

// Exports: createJob, getJobs, applyForJob, getApplicationsByUser, updateApplicationStatus
// Imported by: UI components for job listings and applications
