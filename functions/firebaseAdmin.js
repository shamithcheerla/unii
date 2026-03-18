
// Admin SDK init for Cloud Functions
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage().bucket();

module.exports = { admin, db, auth, storage };

// Exports: admin, db, auth, storage
// Imported by: functions/index.js
