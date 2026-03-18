
/**
 * Firestore Collection Schemas
 * This file documents the structure of the Firestore database.
 */

// -------------------
// --- COLLECTIONS ---
// -------------------

/**
 * users
 * @type {object}
 * @property {string} uid - Firebase Auth UID
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} role - student | head_coordinator | event_coordinator | evaluator | volunteer | super_admin
 * @property {string} college
 * @property {string} collegeId - ref to institutions doc
 * @property {string} branch - students only
 * @property {number} year - students only
 * @property {string} rollNumber - students only
 * @property {string[]} skills
 * @property {string[]} interests
 * @property {string} linkedIn
 * @property {string} github
 * @property {string} portfolio
 * @property {string} resumeUrl
 * @property {string} profilePicUrl
 * @property {string} bio
 * @property {boolean} isActive
 * @property {boolean} isApproved - false until admin approves (coordinators, evaluators)
 * @property {number} campusScore - auto-calculated
 * @property {Timestamp} createdAt
 * @property {Timestamp} updatedAt
 * @property {string} designation - Coordinator-specific
 * @property {string} staffId - Coordinator-specific
 * @property {string} department - Coordinator-specific
 * @property {number} yearsExperience - Coordinator-specific
 * @property {string[]} expertise - Evaluator-specific
 * @property {string} employer - Evaluator-specific
 * @property {string} tshirtSize - Volunteer-specific
 * @property {object} emergencyContact - Volunteer-specific
 * @property {string} emergencyContact.name
 * @property {string} emergencyContact.phone
 */
const users = {};

/**
 * institutions
 * @type {object}
 * @property {string} id
 * @property {string} name
 * @property {string} shortName - e.g. "IITB"
 * @property {string} city
 * @property {string} state
 * @property {string} type - IIT | NIT | BITS | State | Private | Deemed
 * @property {string} logoUrl
 * @property {string} website
 * @property {string} headCoordinatorId - ref to users doc
 * @property {number} totalStudents - auto-updated by function
 * @property {number} totalEvents - auto-updated by function
 * @property {Timestamp} createdAt
 */
const institutions = {};

/**
 * events
 * @type {object}
 * @property {string} id
 * @property {string} title
 * @property {string} shortDescription
 * @property {string} fullDescription
 * @property {string} category - hackathon | webinar | workshop | competition | internship_drive | coding_contest
 * @property {string[]} tags
 * @property {string} coverImageUrl
 * @property {string} hostCollegeId
 * @property {string} hostCoordinatorId
 * @property {string} status - draft | published | ongoing | completed | cancelled
 * @property {boolean} isTeamEvent
 * @property {number} minTeamSize
 * @property {number} maxTeamSize
 * @property {boolean} allowSolo
 * @property {number} maxParticipants
 * @property {number} currentParticipants - auto-updated
 * @property {number} entryFee - 0 = free
 * @property {string} openTo - all | my_college | invite_only
 * @property {string[]} targetCollegeIds - for invite_only
 * @property {string[]} requiredDocuments - ["resume", "id", "portfolio"]
 * @property {Timestamp} registrationOpen
 * @property {Timestamp} registrationClose
 * @property {Timestamp} startDate
 * @property {Timestamp} endDate
 * @property {string} venueType - online | offline | hybrid
 * @property {string} venueName
 * @property {string} venueAddress
 * @property {string} meetingLink
 * @property {string} platform - Zoom, GMeet etc
 * @property {object[]} stages
 * @property {number} stages.stageNumber
 * @property {string} stages.stageName
 * @property {string} stages.description
 * @property {string} stages.submissionType - file | link | text | presentation
 * @property {Timestamp} stages.deadline
 * @property {boolean} stages.isUnlocked
 * @property {object[]} judgingCriteria
 * @property {string} judgingCriteria.name
 * @property {number} judgingCriteria.maxScore
 * @property {string} judgingMode - live | post_event | peer
 * @property {string[]} assignedEvaluatorIds
 * @property {string[]} assignedCoordinatorIds
 * @property {string[]} assignedVolunteerIds
 * @property {object[]} prizes
 * @property {number} prizes.rank
 * @property {string} prizes.label
 * @property {number} prizes.amount
 * @property {object[]} customQuestions
 * @property {string} customQuestions.id
 * @property {string} customQuestions.question
 * @property {string} customQuestions.type - short|long|dropdown|mcq|file
 * @property {string[]} customQuestions.options
 * @property {boolean} customQuestions.required
 * @property {boolean} resultsPublished
 * @property {Timestamp} createdAt
 * @property {Timestamp} updatedAt
 */
const events = {};

/**
 * registrations
 * @type {object}
 * @property {string} id
 * @property {string} eventId
 * @property {string} userId
 * @property {string} teamName
 * @property {string} teamCode - unique 6-char code for team joining
 * @property {string[]} teamMembers - array of userIds
 * @property {string} status - registered | shortlisted | selected | waitlisted | rejected
 * @property {number} waitlistPosition
 * @property {string} paymentStatus - pending | paid | free
 * @property {number} paymentAmount
 * @property {string} paymentTransactionId
 * @property {boolean} attended
 * @property {Timestamp} checkInTime
 * @property {Timestamp} checkOutTime
 * @property {string} checkInSource - qr | manual
 * @property {string} qrToken - unique encrypted token for QR
 * @property {string} certificateUrl - filled after cert generation
 * @property {boolean} certificateGenerated
 * @property {object[]} registrationAnswers
 * @property {string} registrationAnswers.questionId
 * @property {string} registrationAnswers.answer
 * @property {number} currentStage
 * @property {object[]} stageSubmissions
 * @property {number} stageSubmissions.stageNumber
 * @property {string} stageSubmissions.submissionUrl
 * @property {Timestamp} stageSubmissions.submittedAt
 * @property {number} finalScore
 * @property {number} finalRank
 * @property {string} prizeWon - "1st", "2nd", "3rd", or special award
 * @property {boolean} feedbackGiven
 * @property {Timestamp} registeredAt
 * @property {Timestamp} updatedAt
 */
const registrations = {};

/**
 * evaluations
 * @type {object}
 * @property {string} id
 * @property {string} eventId
 * @property {string} registrationId
 * @property {string} teamId
 * @property {string} evaluatorId
 * @property {number} stageNumber
 * @property {object[]} scores
 * @property {string} scores.criterionName
 * @property {number} scores.maxScore
 * @property {number} scores.score
 * @property {string} scores.notes
 * @property {number} totalScore
 * @property {string} strengths
 * @property {string} improvements
 * @property {string[]} ratingTags
 * @property {string} privateNotes
 * @property {string} status - draft | submitted | flagged
 * @property {Timestamp} submittedAt
 * @property {Timestamp} updatedAt
 */
const evaluations = {};

/**
 * jobs
 * @type {object}
 * @property {string} id
 * @property {string} title
 * @property {string} company
 * @property {string} type - internship | full_time | part_time | contract | research
 * @property {string} domain
 * @property {number} stipend
 * @property {string} ctc
 * @property {string} location
 * @property {string} mode - remote | onsite | hybrid
 * @property {string} duration
 * @property {Timestamp} applyBy
 * @property {string} description
 * @property {string[]} skills
 * @property {boolean} targetAll
 * @property {string[]} targetCollegeIds
 * @property {number[]} targetYears
 * @property {string[]} targetSkills
 * @property {string} attachmentUrl
 * @property {string} postedBy - super_admin userId
 * @property {string} status - active | closed | draft
 * @property {number} viewCount
 * @property {number} applicationCount
 * @property {Timestamp} createdAt
 */
const jobs = {};

/**
 * jobApplications
 * @type {object}
 * @property {string} id
 * @property {string} jobId
 * @property {string} userId
 * @property {string} resumeUrl
 * @property {string} coverNote
 * @property {string} status - applied | under_review | shortlisted | selected | rejected
 * @property {Timestamp} appliedAt
 * @property {Timestamp} updatedAt
 */
const jobApplications = {};

/**
 * notifications
 * @type {object}
 * @property {string} id
 * @property {string} userId
 * @property {string} type - event | job | system | approval | scan | result | certificate
 * @property {string} title
 * @property {string} message
 * @property {string} relatedId - eventId or jobId etc.
 * @property {boolean} read
 * @property {Timestamp} createdAt
 */
const notifications = {};

/**
 * announcements
 * @type {object}
 * @property {string} id
 * @property {string} subject
 * @property {string} message
 * @property {string} priority - normal | important | urgent
 * @property {string} targetAudience - all | students | coordinators | volunteers
 * @property {string[]} targetCollegeIds - empty = all colleges
 * @property {string} targetEventId - if event-specific
 * @property {string} sentBy - userId
 * @property {string} sentVia - in_app | email | both
 * @property {Timestamp} scheduledFor
 * @property {Timestamp} sentAt
 * @property {string} status - scheduled | sent | draft
 * @property {Timestamp} createdAt
 */
const announcements = {};

/**
 * volunteerZones
 * @type {object}
 * @property {string} id
 * @property {string} eventId
 * @property {string} volunteerId
 * @property {string} zone - gate_a|gate_b|registration|help_desk|tech_support|stage|vip|stall
 * @property {string} assignedBy
 * @property {boolean} checkedIn
 * @property {Timestamp} checkInTime
 * @property {string} status - on_duty | on_break | offline
 * @property {Timestamp} lastActive
 */
const volunteerZones = {};

/**
 * audit_logs
 * @type {object}
 * @property {string} id
 * @property {string} userId
 * @property {string} userName
 * @property {string} action - "EVENT_CREATED", "USER_SUSPENDED" etc.
 * @property {string} targetType - "event", "user", "job"
 * @property {string} targetId
 * @property {string} targetName
 * @property {string} ipAddress
 * @property {string} result - success | failure
 * @property {object} metadata
 * @property {Timestamp} createdAt
 */
const audit_logs = {};

/**
 * feedback
 * @type {object}
 * @property {string} id
 * @property {string} eventId
 * @property {string} userId
 * @property {number} rating - 1-5
 * @property {string} comment
 * @property {Timestamp} createdAt
 */
const feedback = {};

/**
 * messages
 * @type {object}
 * @property {string} id
 * @property {string} eventId
 * @property {string} senderId
 * @property {string} senderName
 * @property {string} senderRole
 * @property {string} content
 * @property {string} targetGroup - volunteers | coordinator | all
 * @property {Timestamp} createdAt
 */
const messages = {};


// Exports: Nothing
// Imported by: Nobody. This file is for documentation purposes.
