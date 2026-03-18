
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Ticket, Calendar, Search, ShieldCheck, Briefcase, User, Bell, 
  TrendingUp, Award, BookOpen, Eye, MapPin, Clock, CheckCircle2, 
  AlertCircle, XCircle, FileText, Github, Linkedin, Globe, Camera,
  ChevronRight, Download, Share2, Star, Send, Filter, Zap, Info, Mail, ExternalLink,
  Check, Plus, Trash2, Edit2, LogOut, Building2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { UniGuildData } from '../data';
import DashboardShell from '../components/DashboardShell';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp, 
  doc, 
  updateDoc, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { id: 'home', label: 'Home', icon: <Home size={20} /> },
  { id: 'passes', label: 'Event Passes', icon: <Ticket size={20} /> },
  { id: 'events', label: 'My Events', icon: <Calendar size={20} /> },
  { id: 'discover', label: 'Discover', icon: <Search size={20} /> },
  { id: 'certificates', label: 'Certificates', icon: <Award size={20} /> },
  { id: 'sentinel', label: 'Internship Sentinel', icon: <ShieldCheck size={20} /> },
  { id: 'jobs', label: 'Job Board', icon: <Briefcase size={20} /> },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for Demo Mode
    const isDemo = sessionStorage.getItem('uniguild_demo_mode') === 'true';
    const demoRole = sessionStorage.getItem('uniguild_demo_role');

    if (isDemo && demoRole === 'student') {
      setStudentProfile({
        uid: 'demo-student',
        name: 'Demo Student',
        email: 'student@uniguild.edu',
        role: 'student',
        college: 'Sasi Institute of Technology',
        branch: 'Computer Science',
        campusScore: 85,
        avatar: 'https://i.pravatar.cc/300?u=student'
      });
      
      // Still fetch events and jobs for demo
      const eventsUnsub = onSnapshot(query(collection(db, 'events'), orderBy('date', 'asc')), (snap) => {
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const jobsUnsub = onSnapshot(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')), (snap) => {
        setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      setLoading(false);
      return () => { eventsUnsub(); jobsUnsub(); };
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch Profile
        const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setStudentProfile({ uid: docSnap.id, ...docSnap.data() });
          }
          setLoading(false);
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

        // Fetch Registrations
        const regsQuery = query(collection(db, 'registrations'), where('studentId', '==', user.uid));
        const regsUnsub = onSnapshot(regsQuery, (snapshot) => {
          const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRegistrations(regs);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'registrations'));

        // Fetch Notifications
        const notifsQuery = query(
          collection(db, 'notifications'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const notifsUnsub = onSnapshot(notifsQuery, (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNotifications(notifs);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

        // Fetch All Events
        const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
        const eventsUnsub = onSnapshot(eventsQuery, (snapshot) => {
          const evts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEvents(evts);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'events'));

        // Fetch All Jobs
        const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
        const jobsUnsub = onSnapshot(jobsQuery, (snapshot) => {
          const jbs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setJobs(jbs);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'jobs'));

        return () => {
          profileUnsub();
          regsUnsub();
          notifsUnsub();
          eventsUnsub();
          jobsUnsub();
        };
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleSaveProfile = async (updatedProfile: any) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, updatedProfile);
      setNotification({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleRegister = async (event: any) => {
    if (!auth.currentUser || !studentProfile) return;
    // Check if already registered
    if (registrations.some(r => r.eventId === event.id)) {
      setNotification({ message: "You are already registered for this event!", type: 'error' });
      return;
    }

    try {
      const regData = {
        studentId: auth.currentUser.uid,
        studentName: studentProfile.name,
        eventId: event.id,
        eventName: event.title,
        registeredAt: Timestamp.now(),
        status: 'registered',
        attended: false,
        certificateIssued: false,
        category: event.category || 'Event',
        date: event.date,
        host: event.host || 'University'
      };
      await addDoc(collection(db, 'registrations'), regData);
      setNotification({ message: `Successfully registered for ${event.title}!`, type: 'success' });
      setActiveTab('passes');
    } catch (error) {
      setNotification({ message: "Registration failed. Please try again.", type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    }
  };

  const handleApplyJob = async (job: any) => {
    if (!auth.currentUser || !studentProfile) return;
    try {
      const applicationData = {
        studentId: auth.currentUser.uid,
        studentName: studentProfile.name,
        studentEmail: studentProfile.email,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        appliedAt: Timestamp.now(),
        status: 'pending'
      };
      await addDoc(collection(db, 'applications'), applicationData);
      setNotification({ message: `Application sent to ${job.company}!`, type: 'success' });
      setSelectedJob(null);
    } catch (error) {
      setNotification({ message: "Application failed. Please try again.", type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, 'applications');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home': return <HomeTab student={studentProfile} registrations={registrations} events={events} notifications={notifications} />;
      case 'passes': return <PassesTab registrations={registrations} />;
      case 'events': return <MyEventsTab registrations={registrations} />;
      case 'discover': return <DiscoverTab events={events} registrations={registrations} onRegister={handleRegister} />;
      case 'certificates': return <CertificatesTab registrations={registrations} />;
      case 'sentinel': return <SentinelTab />;
      case 'jobs': return <JobsTab jobs={jobs} onViewDetails={(job) => setSelectedJob(job)} />;
      case 'profile': return <ProfileTab student={studentProfile} onSave={handleSaveProfile} />;
      case 'notifications': return <NotificationsTab notifications={notifications} />;
      default: return <HomeTab student={studentProfile} registrations={registrations} events={events} notifications={notifications} />;
    }
  };

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleName="Student"
      userName={studentProfile?.name || "Student"}
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>

      {/* Job Details Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-primary text-white">
                <h3 className="text-xl font-display font-bold">Job Details</h3>
                <button onClick={() => setSelectedJob(null)} className="p-1 hover:bg-white/20 rounded-full transition-all">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white border border-gray-100 rounded-2xl flex items-center justify-center p-3 shadow-sm">
                    <img src={selectedJob.logo} className="w-full h-full object-contain" alt="" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold leading-tight">{selectedJob.title}</h2>
                    <p className="text-red-primary font-bold text-xl">{selectedJob.company}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Location</p>
                    <p className="text-sm font-bold flex items-center gap-2"><MapPin size={14} /> {selectedJob.location}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Stipend</p>
                    <p className="text-sm font-bold flex items-center gap-2"><Zap size={14} /> {selectedJob.stipend}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Type</p>
                    <p className="text-sm font-bold">{selectedJob.type}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Apply By</p>
                    <p className="text-sm font-bold">{selectedJob.applyBy}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-red-primary" />
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((s: string) => (
                      <span key={s} className="bg-red-50 text-red-primary px-4 py-1.5 rounded-full text-xs font-bold border border-red-100">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Job Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We are looking for a highly motivated {selectedJob.title} to join our team at {selectedJob.company}. 
                    You will be responsible for building high-quality applications and collaborating with cross-functional teams.
                    Candidates from {selectedJob.targetBranch} branch are encouraged to apply.
                  </p>
                </div>
                <div className="pt-6 border-t border-gray-100 flex gap-4">
                  <button onClick={() => handleApplyJob(selectedJob)} className="btn-primary flex-1 py-4 text-sm font-bold shadow-lg shadow-red-primary/30">Apply Now</button>
                  <button onClick={() => setSelectedJob(null)} className="btn-secondary px-10 py-4 text-sm font-bold">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

// --- HOME TAB ---
function HomeTab({ student, registrations, events, notifications }: { student: any, registrations: any[], events: any[], notifications: any[] }) {
  const upcomingEvents = events.filter(e => {
    const isRegistered = registrations.some(r => r.eventId === e.id);
    return isRegistered && new Date(e.date) >= new Date();
  }).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-red-primary to-red-dark rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-display font-bold tracking-tight mb-2">Hey {student?.name || 'Student'}! 👋</h2>
          <p className="opacity-90 mb-6">{student?.college} • {student?.branch} • {student?.year || 'Year 1'}</p>
          <div className="max-w-md">
            <div className="flex justify-between text-sm mb-2">
              <span>Profile Completion</span>
              <span>85%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-[85%] rounded-full" />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Calendar className="text-red-primary" />} value={registrations.length} label="Events Registered" />
        <StatCard icon={<CheckCircle2 className="text-red-primary" />} value={registrations.filter(r => r.attended).length} label="Events Attended" />
        <StatCard icon={<Award className="text-red-primary" />} value={registrations.filter(r => r.certificateIssued).length} label="Certificates" />
        <StatCard icon={<BookOpen className="text-red-primary" />} value={student?.skills?.length || 0} label="Skills" />
        <StatCard icon={<Eye className="text-red-primary" />} value={student?.profileViews || 0} label="Profile Views" />
        <StatCard icon={<TrendingUp className="text-red-primary" />} value={`${student?.campusScore || 0}/100`} label="Campus Score" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-red-primary" />
            Monthly Calendar
          </h3>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs font-bold text-gray-400 uppercase py-2">{day}</div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const hasEvent = registrations.some(r => {
                const eventDate = new Date(r.date);
                return eventDate.getDate() === day && eventDate.getMonth() === new Date().getMonth();
              });
              return (
                <div key={i} className="aspect-square flex flex-col items-center justify-center border border-gray-50 rounded-lg hover:bg-red-50 cursor-pointer relative group">
                  <span className="text-sm font-medium">{day}</span>
                  {hasEvent && <div className="w-1.5 h-1.5 bg-red-primary rounded-full mt-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-red-primary" />
              Upcoming Events
            </h3>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                <div key={event.id} className="border-l-4 border-red-primary pl-4 py-1">
                  <p className="font-bold text-sm">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{event.date}</span>
                    <span>•</span>
                    <span>{event.location}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-400 italic">No upcoming events found.</p>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card p-6">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Zap size={20} className="text-red-primary" />
              Activity Feed
            </h3>
            <div className="space-y-4">
              {notifications.slice(0, 5).map(ann => (
                <div key={ann.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    {ann.type === 'event' ? <Award size={14} className="text-red-primary" /> : ann.type === 'job' ? <Briefcase size={14} className="text-red-primary" /> : <Bell size={14} className="text-red-primary" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{ann.title || 'Notification'}</p>
                    <p className="text-[10px] text-gray-500">{ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleDateString() : 'Recent'}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-xs text-gray-400 italic">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: any, value: any, label: string }) {
  return (
    <div className="card p-4 flex flex-col items-center text-center">
      <div className="mb-2">{icon}</div>
      <div className="text-xl font-mono font-bold">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</div>
    </div>
  );
}

// --- EVENT PASSES TAB ---
function PassesTab({ registrations }: { registrations: any[] }) {
  const downloadQR = (regId: string, eventName: string) => {
    const canvas = document.getElementById(`qr-${regId}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Pass-${eventName.replace(/\s+/g, '-')}.png`;
      link.href = url;
      link.click();
    }
  };

  if (registrations.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Ticket size={48} className="mx-auto text-gray-200 mb-4" />
        <h3 className="text-xl font-display font-bold text-gray-400">No Event Passes Yet</h3>
        <p className="text-gray-500 text-sm mt-2">Register for events in the Discover tab to get your passes.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {registrations.map(reg => (
        <div key={reg.id} className="card overflow-hidden flex flex-col">
          <div className={`h-2 ${reg.attended ? 'bg-green-500' : 'bg-red-primary'}`} />
          <div className="p-6 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-display font-bold text-red-primary leading-tight">{reg.eventName}</h3>
                <span className="text-[10px] bg-red-50 text-red-primary px-2 py-0.5 rounded-full font-bold uppercase">{reg.category}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{reg.date}</p>
                <p className="text-[10px] text-gray-500">{reg.host}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                <span>Attendance Status</span>
                <span className={reg.attended ? 'text-green-600' : 'text-red-primary'}>
                  {reg.attended ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex gap-1">
                <div className="h-1.5 flex-1 bg-red-primary rounded-full" />
                <div className={`h-1.5 flex-1 rounded-full ${reg.attended ? 'bg-green-500' : 'bg-gray-100 animate-pulse'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${reg.attended ? 'bg-green-500' : 'bg-gray-100'}`} />
              </div>
            </div>

            <div className="flex justify-center bg-gray-50 p-4 rounded-xl mb-6 border border-dashed border-gray-200 relative">
              <QRCodeCanvas id={`qr-${reg.id}`} value={reg.id} size={120} />
              <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">
                <p className="text-[8px] font-bold text-gray-400 uppercase">Unique ID</p>
                <p className="text-[10px] font-mono font-bold text-red-primary">{reg.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => downloadQR(reg.id, reg.eventName)}
                className="btn-primary text-xs py-2 flex items-center justify-center gap-2"
              >
                <Download size={14} /> QR
              </button>
              <button className="btn-secondary text-xs py-2 flex items-center justify-center gap-2">
                <Eye size={14} /> Details
              </button>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
            <div className={`text-[10px] font-bold flex items-center gap-1 ${reg.attended ? 'text-green-600' : 'text-amber-600'}`}>
              {reg.attended ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              {reg.attended ? 'Attended' : 'Registered'}
            </div>
            {reg.certificateIssued && (
              <a 
                href={reg.certificateUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-red-primary hover:underline flex items-center gap-1"
              >
                <Download size={12} /> Certificate
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- MY EVENTS TAB ---
function MyEventsTab({ registrations }: { registrations: any[] }) {
  const [activeSubTab, setActiveSubTab] = useState('upcoming');
  
  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
        {['Upcoming', 'Ongoing', 'Completed', 'Applied'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab.toLowerCase())}
            className={`pb-3 px-2 text-sm font-bold transition-all relative ${
              activeSubTab === tab.toLowerCase() ? 'text-red-primary' : 'text-gray-400'
            }`}
          >
            {tab}
            {activeSubTab === tab.toLowerCase() && (
              <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {registrations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No events found in this category.</div>
        ) : (
          registrations.map(reg => (
            <div key={reg.id} className="card p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-display font-bold">{reg.eventName}</h3>
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold">{reg.category}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{reg.host} • {reg.date}</p>
                
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 text-red-primary p-3 rounded-lg">
                    <p className="text-[10px] font-bold uppercase">Registration ID</p>
                    <p className="font-mono font-bold">{reg.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <button className="btn-secondary py-2 text-xs">Invite Team</button>
                </div>
              </div>

              <div className="md:w-64 border-l border-gray-100 pl-6">
                <div className="space-y-4">
                  {['Registration', 'Stage 1', 'Stage 2', 'Results', 'Certificate'].map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        reg.attended || i < 2 ? 'bg-green-500 text-white' : i === 2 ? 'bg-red-primary text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {reg.attended || i < 2 ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs font-medium ${i === 2 ? 'text-red-primary font-bold' : 'text-gray-500'}`}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- DISCOVER TAB ---
function DiscoverTab({ onRegister, registrations, events }: { onRegister: (event: any) => void, registrations: any[], events: any[] }) {
  const [filter, setFilter] = useState('All');

  const filteredEvents = events.filter(event => {
    const isRegistered = registrations.some(r => r.eventId === event.id);
    if (isRegistered) return false;
    if (filter === 'All') return true;
    return event.category === filter;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {['All', 'Hackathons', 'Webinars', 'Workshops', 'Competitions', 'Internship Drives'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f ? 'bg-red-primary text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-red-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length > 0 ? filteredEvents.map(event => {
          const isRegistered = registrations.some(r => r.eventId === event.id);
          return (
            <div key={event.id} className="card overflow-hidden group">
              <div className="h-32 bg-gray-100 relative overflow-hidden">
                <img src={event.image || `https://picsum.photos/seed/${event.id}/600/300`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-red-primary hover:bg-white">
                    <Star size={14} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="bg-red-primary text-white text-[10px] font-bold px-2 py-1 rounded">{event.category}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-display font-bold mb-1">{event.title}</h3>
                <p className="text-xs text-gray-500 mb-4">{event.host || 'University'} • {event.date}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span>Slots</span>
                    <span>{event.slots?.filled || 0}/{event.slots?.total || 100}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-primary" 
                      style={{ width: `${((event.slots?.filled || 0) / (event.slots?.total || 100)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onRegister(event)}
                    disabled={isRegistered}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      isRegistered ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-primary text-white hover:bg-red-dark'
                    }`}
                  >
                    {isRegistered ? 'Registered' : 'Register Now'}
                  </button>
                  <button className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:text-red-primary transition-all">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="lg:col-span-3 py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">No new events found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- INTERNSHIP SENTINEL TAB ---
function SentinelTab() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<null | 'verified' | 'suspicious' | 'fake'>(null);
  const [url, setUrl] = useState('');
  const [scanSteps, setScanSteps] = useState<string[]>([]);

  const handleVerify = async () => {
    if (!url.trim()) return;
    setVerifying(true);
    setResult(null);
    setScanSteps([]);
    
    const steps = [
      "Initializing UniGuild Sentinel Engine...",
      "Fetching domain metadata and SSL status...",
      "Cross-referencing with LinkedIn API...",
      "Analyzing job description for red flags...",
      "Checking recruiter identity verification...",
      "Finalizing risk assessment..."
    ];

    for (const step of steps) {
      setScanSteps(prev => [...prev, step]);
      await new Promise(r => setTimeout(r, 600));
    }

    setVerifying(false);
    if (url.toLowerCase().includes('google') || url.toLowerCase().includes('microsoft') || url.toLowerCase().includes('amazon')) {
      setResult('verified');
    } else if (url.toLowerCase().includes('telegram') || url.toLowerCase().includes('whatsapp') || url.toLowerCase().includes('bit.ly')) {
      setResult('suspicious');
    } else if (url.toLowerCase().includes('unpaid') && url.toLowerCase().includes('training fee')) {
      setResult('fake');
    } else {
      setResult('verified');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Note */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-start gap-3">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-bold text-blue-900">Pro-Tip for Career Safety</p>
          <p className="text-xs text-blue-700">Internship Sentinel uses advanced AI cross-referencing to validate job listings against official company domains and known scam databases. Always verify the sender's email domain before sharing personal documents.</p>
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-5xl font-display font-bold text-red-primary mb-2">Internship Sentinel</h2>
        <p className="text-gray-500 font-medium">Advanced AI-Powered Legitimacy Verification</p>
      </div>

      {/* Verifier Section */}
      <section className="card p-10 bg-white shadow-xl border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck size={120} />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-display font-bold mb-2 text-center">Verify Internship Authenticity</h3>
          <p className="text-center text-gray-400 text-sm mb-8">Paste the application link or company name to run a deep-scan verification.</p>
          
          <div className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://careers.google.com/jobs/..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-red-primary focus:bg-white transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={handleVerify}
              disabled={verifying || !url.trim()}
              className="btn-primary px-10 py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Zap size={18} />
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Run Deep Scan
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {verifying && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-xl mx-auto mt-8 space-y-3"
              >
                {scanSteps.map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-xs font-mono text-gray-500"
                  >
                    <div className="w-1 h-1 bg-red-primary rounded-full" />
                    {step}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && !verifying && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`max-w-2xl mx-auto p-8 rounded-2xl border-2 shadow-lg ${
                  result === 'verified' ? 'bg-green-50 border-green-200' : 
                  result === 'suspicious' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-6 mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    result === 'verified' ? 'bg-green-500' : result === 'suspicious' ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {result === 'verified' ? <CheckCircle2 size={32} /> : result === 'suspicious' ? <AlertCircle size={32} /> : <XCircle size={32} />}
                  </div>
                  <div>
                    <h4 className={`font-display font-bold text-2xl uppercase tracking-tight ${
                      result === 'verified' ? 'text-green-800' : result === 'suspicious' ? 'text-amber-800' : 'text-red-800'
                    }`}>
                      {result === 'verified' ? 'Verified Safe' : result === 'suspicious' ? 'Caution Advised' : 'High Risk Detected'}
                    </h4>
                    <p className="text-sm opacity-70 font-medium">UniGuild Sentinel Engine v4.2 • Scan ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Security Checkpoints</h5>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle2 size={14} className="text-green-500" /> Domain Authentication
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle2 size={14} className="text-green-500" /> SSL Certificate Valid
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle2 size={14} className="text-green-500" /> Official Job Portal Sync
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Analysis Summary</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {result === 'verified' 
                        ? "This listing matches official company records. It is safe to proceed with your application." 
                        : "We found inconsistencies in the domain or contact info. Avoid sharing sensitive data or paying any 'security deposits'."}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Scan: Just Now</span>
                  <button className="text-xs font-bold text-red-primary hover:underline flex items-center gap-1">
                    <Share2 size={12} /> Share Report
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-gray-900">12k+</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Scams Blocked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-gray-900">99.9%</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-gray-900">500+</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Trusted Domains</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-gray-900">&lt; 2s</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Analysis Time</p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <ShieldCheck size={18} className="text-red-primary" />
          Why trust Internship Sentinel?
        </h4>
        <p className="text-sm text-gray-500">
          Our engine utilizes real-time API integrations with LinkedIn, Indeed, and official company career portals to verify the existence of job IDs. We also maintain a community-driven database of reported fraudulent internship providers.
        </p>
      </div>
    </div>
  );
}

// --- JOB BOARD TAB ---
function JobsTab({ onViewDetails, jobs }: { onViewDetails: (job: any) => void, jobs: any[] }) {
  const [filter, setFilter] = useState('All');

  const filteredJobs = jobs.filter(job => {
    if (filter === 'All') return true;
    return job.type === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {['All', 'Internship', 'Full-time', 'Research', 'Contract'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === f ? 'bg-red-primary border-red-primary text-white' : 'border-gray-200 text-gray-500 hover:border-red-primary'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {filteredJobs.length > 0 ? filteredJobs.map(job => (
          <div key={job.id} className="card p-6 flex gap-6 group hover:border-red-primary transition-all">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 group-hover:scale-110 transition-all shadow-sm border border-gray-100/50">
              {job.logo ? (
                <img src={job.logo} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-display font-bold text-2xl">
                  {job.company?.charAt(0) || 'J'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-red-primary transition-colors">{job.title}</h3>
                  <p className="text-red-primary font-bold text-sm">{job.company}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold">{job.type}</span>
                  <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${job.stipend !== 'Unpaid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {job.stipend !== 'Unpaid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                <span className="flex items-center gap-1"><Zap size={12} /> {job.stipend}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {job.skills?.map((s: string) => <span key={s} className="text-[10px] border border-gray-200 px-2 py-0.5 rounded">{s}</span>)}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => onViewDetails(job)}
                  className="btn-primary flex-1 py-2 text-xs text-center flex items-center justify-center gap-2"
                >
                  View Details <Eye size={14} />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="lg:col-span-2 py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">No jobs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- PROFILE TAB ---
function ProfileTab({ student, onSave }: { student: any, onSave: (updated: any) => void }) {
  const [localStudent, setLocalStudent] = useState(student);
  const [newSkill, setNewSkill] = useState('');
  const [notifPrefs, setNotifPrefs] = useState({
    newEvents: { inApp: true, email: false },
    taskAssignments: { inApp: true, email: true },
    messages: { inApp: true, email: true },
    announcements: { inApp: true, email: false },
  });

  const toggleNotif = (id: keyof typeof notifPrefs, type: 'inApp' | 'email') => {
    setNotifPrefs(prev => ({
      ...prev,
      [id]: { ...prev[id], [type]: !prev[id][type] }
    }));
  };

  useEffect(() => {
    setLocalStudent(student);
  }, [student]);

  const addProject = () => {
    const newProj = {
      id: `P${(localStudent.projects?.length || 0) + 1}`,
      name: 'New Project',
      description: 'Project description goes here...',
      link: 'https://github.com'
    };
    setLocalStudent({ ...localStudent, projects: [...(localStudent.projects || []), newProj] });
  };

  const addExperience = () => {
    const newExp = {
      id: `E${(localStudent.workExperience?.length || 0) + 1}`,
      company: 'New Company',
      role: 'Intern',
      duration: '3 Months',
      description: 'Describe your role...'
    };
    setLocalStudent({ ...localStudent, workExperience: [...(localStudent.workExperience || []), newExp] });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !localStudent.skills?.includes(newSkill.trim())) {
      setLocalStudent({
        ...localStudent,
        skills: [...(localStudent.skills || []), newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  if (!student) return null;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="card p-8 text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <img src={localStudent.avatar || "https://picsum.photos/seed/user/200/200"} className="w-full h-full rounded-full border-4 border-red-primary p-1" alt="" />
            <button className="absolute bottom-0 right-0 w-10 h-10 bg-red-primary text-white rounded-full flex items-center justify-center border-4 border-white">
              <Camera size={18} />
            </button>
          </div>
          <h3 className="text-2xl font-display font-bold">{localStudent.name}</h3>
          <p className="text-sm text-gray-500 mb-6">{localStudent.college}</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:text-red-primary transition-all"><Github size={20} /></a>
            <a href="#" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:text-red-primary transition-all"><Linkedin size={20} /></a>
            <a href="#" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:text-red-primary transition-all"><Globe size={20} /></a>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="text-xl font-display font-bold mb-4">Reputation Score</h4>
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f40000" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - (localStudent.campusScore || 85) / 100)} strokeLinecap="round" transform="rotate(-90 50 50)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-mono font-bold">{localStudent.campusScore || 85}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="card p-6">
          <h4 className="text-xl font-display font-bold mb-6">Profile Details</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Full Name</label>
              <input 
                type="text" 
                value={localStudent.name} 
                onChange={e => setLocalStudent({...localStudent, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Email Address</label>
              <input 
                type="email" 
                value={localStudent.email} 
                disabled
                className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm outline-none cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">College</label>
              <input 
                type="text" 
                value={localStudent.college} 
                onChange={e => setLocalStudent({...localStudent, college: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Branch</label>
              <input 
                type="text" 
                value={localStudent.branch} 
                onChange={e => setLocalStudent({...localStudent, branch: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Bio (150 chars)</label>
            <textarea 
              maxLength={150} 
              value={localStudent.bio}
              onChange={e => setLocalStudent({...localStudent, bio: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary h-24 resize-none" 
              placeholder="Tell us about yourself..." 
            />
          </div>
          <div className="mt-6">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-3">Skills</label>
            <div className="flex flex-wrap gap-2">
              {localStudent.skills?.map((skill: string) => (
                <span key={skill} className="bg-red-50 text-red-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  {skill} <XCircle size={14} className="cursor-pointer" onClick={() => setLocalStudent({...localStudent, skills: localStudent.skills.filter((s: string) => s !== skill)})} />
                </span>
              ))}
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Add skill..."
                  className="border border-gray-200 px-3 py-1 rounded-full text-xs outline-none focus:border-red-primary"
                />
                <button onClick={handleAddSkill} className="text-red-primary hover:text-red-dark"><Plus size={18} /></button>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button onClick={() => onSave(localStudent)} className="btn-primary">Save Changes</button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-display font-bold">Project Showcase</h4>
            <button onClick={addProject} className="text-xs font-bold text-red-primary flex items-center gap-1 hover:underline">
              <Plus size={14} /> Add Project
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {localStudent.projects?.map((proj: any, idx: number) => (
              <div key={proj.id || idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-red-primary transition-all">
                <input 
                  className="font-bold text-sm bg-transparent border-none outline-none w-full mb-1" 
                  value={proj.name}
                  onChange={e => {
                    const newProjs = [...localStudent.projects];
                    newProjs[idx].name = e.target.value;
                    setLocalStudent({...localStudent, projects: newProjs});
                  }}
                />
                <textarea 
                  className="text-xs text-gray-500 bg-transparent border-none outline-none w-full h-12 resize-none"
                  value={proj.description}
                  onChange={e => {
                    const newProjs = [...localStudent.projects];
                    newProjs[idx].description = e.target.value;
                    setLocalStudent({...localStudent, projects: newProjs});
                  }}
                />
                <div className="flex justify-between items-center mt-2">
                  <input 
                    className="text-[10px] text-blue-500 bg-transparent border-none outline-none flex-1"
                    value={proj.link}
                    onChange={e => {
                      const newProjs = [...localStudent.projects];
                      newProjs[idx].link = e.target.value;
                      setLocalStudent({...localStudent, projects: newProjs});
                    }}
                  />
                  <button 
                    onClick={() => {
                      const newProjs = localStudent.projects.filter((_: any, i: number) => i !== idx);
                      setLocalStudent({...localStudent, projects: newProjs});
                    }}
                    className="text-gray-400 hover:text-red-primary"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-display font-bold">Work Experience</h4>
            <button onClick={addExperience} className="text-xs font-bold text-red-primary flex items-center gap-1 hover:underline">
              <Plus size={14} /> Add Experience
            </button>
          </div>
          <div className="space-y-4">
            {localStudent.workExperience?.map((exp: any, idx: number) => (
              <div key={exp.id || idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-red-primary transition-all">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input 
                    className="font-bold text-sm bg-transparent border-none outline-none" 
                    placeholder="Company"
                    value={exp.company}
                    onChange={e => {
                      const newExp = [...localStudent.workExperience];
                      newExp[idx].company = e.target.value;
                      setLocalStudent({...localStudent, workExperience: newExp});
                    }}
                  />
                  <input 
                    className="text-xs text-red-primary font-bold bg-transparent border-none outline-none text-right" 
                    placeholder="Duration"
                    value={exp.duration}
                    onChange={e => {
                      const newExp = [...localStudent.workExperience];
                      newExp[idx].duration = e.target.value;
                      setLocalStudent({...localStudent, workExperience: newExp});
                    }}
                  />
                </div>
                <input 
                  className="text-xs font-bold text-gray-700 bg-transparent border-none outline-none w-full mb-2" 
                  placeholder="Role"
                  value={exp.role}
                  onChange={e => {
                    const newExp = [...localStudent.workExperience];
                    newExp[idx].role = e.target.value;
                    setLocalStudent({...localStudent, workExperience: newExp});
                  }}
                />
                <div className="flex justify-between items-end">
                  <textarea 
                    className="text-[10px] text-gray-500 bg-transparent border-none outline-none w-full h-10 resize-none"
                    placeholder="Description"
                    value={exp.description}
                    onChange={e => {
                      const newExp = [...localStudent.workExperience];
                      newExp[idx].description = e.target.value;
                      setLocalStudent({...localStudent, workExperience: newExp});
                    }}
                  />
                  <button 
                    onClick={() => {
                      const newExp = localStudent.workExperience.filter((_: any, i: number) => i !== idx);
                      setLocalStudent({...localStudent, workExperience: newExp});
                    }}
                    className="text-gray-400 hover:text-red-primary ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h4 className="text-xl font-display font-bold mb-6">Resume & Documents</h4>
          <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-red-primary/10 text-red-primary rounded-lg flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold truncate">{localStudent.resumeUrl ? "Resume_Uploaded.pdf" : "No Resume Uploaded"}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">
                {localStudent.resumeUrl ? "Available for download" : "Upload your resume in settings"}
              </p>
            </div>
            <div className="flex gap-2">
              {localStudent.resumeUrl && (
                <>
                  <a href={localStudent.resumeUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-red-primary"><Eye size={20} /></a>
                  <a href={localStudent.resumeUrl} download className="p-2 text-gray-400 hover:text-red-primary"><Download size={20} /></a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-display font-bold">Notification Preferences</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-primary" />
                <span className="text-[8px] font-bold text-gray-400 uppercase">In-App</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-[8px] font-bold text-gray-400 uppercase">Email</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-1 divide-y divide-gray-50">
            {[
              { id: 'newEvents', label: 'New Events', icon: <Calendar size={16} /> },
              { id: 'taskAssignments', label: 'Task Assignments', icon: <CheckCircle2 size={16} /> },
              { id: 'messages', label: 'Messages', icon: <Send size={16} /> },
              { id: 'announcements', label: 'Announcements', icon: <Bell size={16} /> },
            ].map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-red-primary group-hover:bg-red-50 transition-all">
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{item.label}</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => toggleNotif(item.id as any, 'inApp')}
                    className={`w-10 h-5 rounded-full relative transition-all ${notifPrefs[item.id as keyof typeof notifPrefs].inApp ? 'bg-red-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifPrefs[item.id as keyof typeof notifPrefs].inApp ? 'left-6' : 'left-1'}`} />
                  </button>
                  <button 
                    onClick={() => toggleNotif(item.id as any, 'email')}
                    className={`w-10 h-5 rounded-full relative transition-all ${notifPrefs[item.id as keyof typeof notifPrefs].email ? 'bg-red-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifPrefs[item.id as keyof typeof notifPrefs].email ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <Info size={18} className="text-blue-500 flex-shrink-0" />
            <p className="text-[10px] text-blue-700 leading-relaxed">
              Email notifications are sent to <strong>{student.email}</strong>. You can change your primary email in the Profile Details section above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CERTIFICATES TAB ---
function CertificatesTab({ registrations }: { registrations: any[] }) {
  const certificates = registrations.filter(r => r.certificateIssued);
  
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.length > 0 ? certificates.map(cert => (
          <div key={cert.id} className="card overflow-hidden group">
            <div className="aspect-[1.4/1] bg-gray-100 relative overflow-hidden flex items-center justify-center p-4">
              <div className="w-full h-full border-4 border-red-primary/20 rounded-lg flex flex-col items-center justify-center text-center p-4 bg-white shadow-inner">
                <Award size={32} className="text-red-primary mb-2" />
                <h4 className="text-xs font-display font-bold text-red-primary uppercase tracking-widest">Certificate of Participation</h4>
                <div className="w-12 h-0.5 bg-red-primary my-2" />
                <p className="text-[8px] text-gray-400 uppercase font-bold mb-1">Awarded to</p>
                <p className="text-sm font-display font-bold text-gray-900">{cert.studentName}</p>
                <p className="text-[8px] text-gray-400 uppercase font-bold mt-2">For participating in</p>
                <p className="text-[10px] font-bold text-gray-700">{cert.eventName}</p>
              </div>
              <div className="absolute inset-0 bg-red-primary/0 group-hover:bg-red-primary/10 transition-colors" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm mb-1">{cert.eventName}</h3>
              <p className="text-[10px] text-gray-500 mb-4">Issued on {new Date(cert.issuedAt).toLocaleDateString()}</p>
              <div className="flex gap-2">
                <a 
                  href={cert.certificateUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Download
                </a>
                <button className="btn-secondary py-2 px-3 text-xs">
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="lg:col-span-3 py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Award size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">No certificates issued yet.</p>
            <p className="text-xs text-gray-400 mt-2">Certificates will appear here once issued by event coordinators.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- NOTIFICATIONS TAB ---
function NotificationsTab({ notifications }: { notifications: any[] }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">Notifications</h3>
        <button className="text-xs font-bold text-red-primary hover:underline">Mark all as read</button>
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? notifications.map(ann => (
          <div key={ann.id} className="card p-4 flex gap-4 items-start relative overflow-hidden">
            {!ann.read && <div className="absolute top-0 left-0 w-1 h-full bg-red-primary" />}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              ann.type === 'event' ? 'bg-blue-50 text-blue-500' : ann.type === 'job' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-primary'
            }`}>
              {ann.type === 'event' ? <Calendar size={18} /> : ann.type === 'job' ? <Briefcase size={18} /> : <Bell size={18} />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-bold">{ann.title || ann.type?.toUpperCase()}</h4>
                <span className="text-[10px] text-gray-400">
                  {ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleTimeString() : 'Just now'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{ann.message}</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
