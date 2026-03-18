
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, Calendar, Megaphone, 
  CheckSquare, BarChart3, Settings, User, 
  Plus, Search, Filter, MoreVertical, 
  Clock, MapPin, AlertCircle, CheckCircle2,
  Trash2, Edit, Send, Download, QrCode, X, Check, History, Award, FileText, Eye, Briefcase, ExternalLink, Camera
} from 'lucide-react';
import { UniGuildData } from '../data';
import DashboardShell from '../components/DashboardShell';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, collection, query, where, onSnapshot, getDoc, addDoc, serverTimestamp, orderBy, limit, Timestamp, arrayRemove, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { id: 'events', label: 'My Events', icon: <Calendar size={20} /> },
  { id: 'attendance', label: 'Attendance', icon: <QrCode size={20} /> },
  { id: 'certificates', label: 'Certificates', icon: <Award size={20} /> },
  { id: 'volunteers', label: 'Volunteers', icon: <Users size={20} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { id: 'team', label: 'My Team', icon: <Users size={20} /> },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
];

export default function EventCoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [coordinatorProfile, setCoordinatorProfile] = useState<any>(null);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for Demo Mode
    const isDemo = sessionStorage.getItem('uniguild_demo_mode') === 'true';
    const demoRole = sessionStorage.getItem('uniguild_demo_role');

    if (isDemo && demoRole === 'eventcoordinator') {
      setCoordinatorProfile({
        uid: 'demo-coordinator',
        name: 'Demo Coordinator',
        email: 'event@uniguild.edu',
        role: 'eventcoordinator',
        college: 'Sasi Institute of Technology',
        avatar: 'https://i.pravatar.cc/300?u=event'
      });
      
      // Still fetch global data for demo
      const volunteersUnsub = onSnapshot(query(collection(db, 'users'), where('role', '==', 'volunteer'), limit(10)), (snap) => {
        setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const jobsUnsub = onSnapshot(query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(10)), (snap) => {
        setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      
      setLoading(false);
      return () => { volunteersUnsub(); jobsUnsub(); };
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch Profile
        const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setCoordinatorProfile({ uid: docSnap.id, ...docSnap.data() });
          }
          setLoading(false);
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

        // Fetch My Events
        const eventsQuery = query(collection(db, 'events'), where('coordinatorId', '==', user.uid));
        const eventsUnsub = onSnapshot(eventsQuery, (snapshot) => {
          const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyEvents(eventsData);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'events'));

        // Fetch Volunteers
        const volunteersQuery = query(collection(db, 'users'), where('role', '==', 'volunteer'));
        const volunteersUnsub = onSnapshot(volunteersQuery, (snapshot) => {
          const volunteersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setVolunteers(volunteersData);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

        // Fetch Jobs
        const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
        const jobsUnsub = onSnapshot(jobsQuery, (snapshot) => {
          const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setJobs(jobsData);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'jobs'));

        return () => {
          profileUnsub();
          eventsUnsub();
          volunteersUnsub();
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
      case 'overview': return <OverviewTab coordinator={coordinatorProfile} events={myEvents} setActiveTab={setActiveTab} onScanClick={() => setActiveTab('attendance')} />;
      case 'events': return <EventsTab events={myEvents} setActiveTab={setActiveTab} />;
      case 'attendance': return <AttendanceTab coordinatorId={coordinatorProfile?.uid} coordinatorName={coordinatorProfile?.name} />;
      case 'certificates': return <CertificatesTab />;
      case 'volunteers': return <VolunteersTab volunteers={volunteers} events={myEvents} />;
      case 'tasks': return <TasksTab coordinatorId={coordinatorProfile?.uid} events={myEvents} />;
      case 'team': return <TeamTab events={myEvents} />;
      case 'announcements': return <AnnouncementsTab events={myEvents} />;
      case 'analytics': return <AnalyticsTab events={myEvents} />;
      case 'profile': return <ProfileTab coordinator={coordinatorProfile} onSave={handleSaveProfile} />;
      default: return <OverviewTab coordinator={coordinatorProfile} events={myEvents} setActiveTab={setActiveTab} onScanClick={() => setActiveTab('attendance')} />;
    }
  };

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleName="Event Coordinator"
      userName={coordinatorProfile?.name || "Coordinator"}
      userAvatar={coordinatorProfile?.avatar}
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
    </DashboardShell>
  );
}

// --- EVENTS TAB ---
function EventsTab({ events, setActiveTab }: { events: any[], setActiveTab: (tab: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">My Events</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + "Event,Date,Participants,Status\n" + events.map(r => `${r.title},${r.date},${r.registrationsCount || 0},${r.status}`).join("\n");
              const link = document.createElement("a");
              link.setAttribute("href", encodeURI(csvContent));
              link.setAttribute("download", "events.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">No events found. Create your first event!</div>
        ) : (
          events.map((event, i) => (
            <div key={event.id} className="card p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-red-50 text-red-primary rounded-xl flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  event.status === 'upcoming' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {event.status}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-bold">{event.title}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock size={12} /> {event.date}
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-xs font-bold">{event.registrationsCount || 0} Registered</span>
                </div>
                <button className="text-red-primary text-xs font-bold hover:underline">Manage</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// --- OVERVIEW TAB ---
function OverviewTab({ coordinator, events, setActiveTab, onScanClick }: { coordinator: any, events: any[], setActiveTab: (tab: string) => void, onScanClick: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const latestEvent = events[0];
  const totalRegistrations = events.reduce((acc, curr) => acc + (curr.registrationsCount || 0), 0);

  useEffect(() => {
    if (!coordinator?.uid) return;
    const q = query(collection(db, 'tasks'), where('coordinatorId', '==', coordinator.uid), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [coordinator?.uid]);

  useEffect(() => {
    const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setRecentRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const pendingTasks = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-primary to-red-dark rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-display font-bold tracking-tight mb-2">{latestEvent?.title || 'Welcome Coordinator'}</h2>
          <p className="opacity-90">
            {latestEvent ? `Event starts on ${latestEvent.date}. Manage your team and participants.` : 'Create your first event to get started.'}
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <button onClick={onScanClick} className="bg-white text-red-primary px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2">
              <QrCode size={16} /> Scan Attendance
            </button>
            <button 
              onClick={() => setActiveTab('attendance')}
              className="bg-white/20 border border-white/30 px-6 py-2 rounded-lg font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Eye size={16} /> View Attendance
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="My Events" value={events.length} icon={<Calendar size={20} />} />
        <StatCard label="Total Registrations" value={totalRegistrations} icon={<Users size={20} />} trend={`${events.length > 0 ? Math.round(totalRegistrations/events.length) : 0} avg`} />
        <StatCard label="Active Volunteers" value="12" icon={<Users size={20} />} />
        <StatCard label="Pending Tasks" value={pendingTasks} icon={<CheckSquare size={20} />} isUrgent={pendingTasks > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold">Critical Tasks</h3>
            <button onClick={() => setActiveTab('tasks')} className="text-red-primary text-xs font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No tasks found.</div>
            ) : (
              tasks.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-red-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${t.status === 'todo' ? 'bg-red-primary' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-sm font-bold">{t.title}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Due: {t.deadline || 'No deadline'}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-primary"><CheckCircle2 size={18} /></button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-display font-bold mb-6">Live Updates</h3>
          <div className="space-y-6">
            {recentRegistrations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No recent updates.</div>
            ) : (
              recentRegistrations.map((reg, i) => (
                <div key={i} className="flex gap-3 text-xs relative">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold">New Registration</p>
                    <p className="text-gray-500">{reg.studentName} registered for '{reg.eventName}'.</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {reg.createdAt instanceof Timestamp ? new Date(reg.createdAt.toDate()).toLocaleTimeString() : 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isUrgent, trend }: any) {
  return (
    <div className={`card p-5 ${isUrgent ? 'border-red-primary bg-red-50/20' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUrgent ? 'bg-red-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
        {trend && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{trend}</span>}
      </div>
      <div className="text-3xl font-mono font-bold">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-wider">{label}</div>
    </div>
  );
}

// --- VOLUNTEERS TAB ---
// --- ATTENDANCE TAB ---
function AttendanceTab({ coordinatorId, coordinatorName }: { coordinatorId: string, coordinatorName: string }) {
  const [mode, setMode] = useState<'scan' | 'history'>('scan');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (mode === 'scan' && !scanResult && !isProcessing && !success && !error) {
      const scanner = new Html5QrcodeScanner(
        "reader-coordinator",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        scannerRef.current = null;
      }
    };
  }, [mode, scanResult, isProcessing, success, error]);

  // Fetch history
  useEffect(() => {
    const q = query(
      collection(db, 'registrations'),
      where('attended', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'registrations');
    });

    return () => unsubscribe();
  }, []);

  async function onScanSuccess(decodedText: string) {
    if (isProcessing) return;
    
    setScanResult(decodedText);
    if (scannerRef.current) {
      await scannerRef.current.clear();
    }
    handleMarkAttendance(decodedText);
  }

  function onScanFailure(error: any) {}

  const handleMarkAttendance = async (registrationId: string) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const regRef = doc(db, 'registrations', registrationId);
      const regSnap = await getDoc(regRef);

      if (!regSnap.exists()) {
        setError("Invalid Pass: Registration not found.");
        return;
      }

      const data = regSnap.data();
      if (data.attended) {
        setError(`Already Marked: Attendance for ${data.eventName} was already recorded.`);
        return;
      }

      await updateDoc(regRef, {
        attended: true,
        attendedAt: new Date().toISOString(),
        scannedBy: coordinatorId,
        scannedByName: coordinatorName
      });

      setSuccess(`Success! Attendance marked for ${data.studentName} - ${data.eventName}`);
    } catch (err) {
      setError("Failed to mark attendance. Please try again.");
      handleFirestoreError(err, OperationType.UPDATE, `registrations/${registrationId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualId('');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center">
      <div className="flex gap-4 border-b border-gray-200 mb-8">
        <button 
          onClick={() => setMode('scan')}
          className={`flex-1 pb-3 text-sm font-bold transition-all relative ${mode === 'scan' ? 'text-red-primary' : 'text-gray-400'}`}
        >
          Check-In Scanner
          {mode === 'scan' && <motion.div layoutId="att-coord" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-primary" />}
        </button>
        <button 
          onClick={() => setMode('history')}
          className={`flex-1 pb-3 text-sm font-bold transition-all relative ${mode === 'history' ? 'text-red-primary' : 'text-gray-400'}`}
        >
          Attendance History
          {mode === 'history' && <motion.div layoutId="att-coord" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-primary" />}
        </button>
      </div>

      {mode === 'scan' ? (
        <div className="space-y-6">
          {!scanResult && !success && !error ? (
            <div className="space-y-6">
              <div id="reader-coordinator" className="overflow-hidden rounded-3xl border-4 border-red-primary shadow-2xl bg-black min-h-[400px]" />
              <div>
                <h3 className="text-2xl font-display font-bold">Participant Check-In</h3>
                <p className="text-sm text-gray-500 mt-2 px-8">Scan the student's QR code from their UniGuild event pass.</p>
              </div>
              
              <div className="pt-6 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Manual Entry</p>
                <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                  <input 
                    type="text" 
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Enter Registration ID" 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-primary focus:bg-white transition-all shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualId.trim()) {
                        handleMarkAttendance(manualId.trim());
                      }
                    }}
                  />
                  <button 
                    onClick={() => manualId.trim() && handleMarkAttendance(manualId.trim())}
                    disabled={!manualId.trim() || isProcessing}
                    className="btn-primary px-6 py-3 text-sm flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                  >
                    <Check size={18} /> Mark Present
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 space-y-6">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 border-4 border-red-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-lg font-bold text-gray-500 uppercase tracking-widest">Verifying Pass...</p>
                </div>
              ) : (
                <>
                  {success && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <Check size={48} />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-green-600">Verified Successfully</h3>
                      <p className="text-lg text-gray-600">{success}</p>
                    </div>
                  )}
                  {error && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 bg-red-100 text-red-primary rounded-full flex items-center justify-center">
                        <X size={48} />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-red-primary">Verification Failed</h3>
                      <p className="text-lg text-gray-600">{error}</p>
                    </div>
                  )}
                  <button 
                    onClick={resetScanner}
                    className="btn-primary w-full max-w-xs mx-auto py-4 text-lg"
                  >
                    Scan Next
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-left">
          {history.length > 0 ? (
            <div className="card overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Event</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Time</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Scanner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4 text-sm font-bold">{item.studentName}</td>
                      <td className="px-6 py-4 text-xs font-medium">{item.eventName}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(item.attendedAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-red-primary">{item.scannedByName || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-24 text-gray-400 card">
              <History size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No attendance records found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VolunteersTab({ volunteers, events }: { volunteers: any[], events: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddVolunteerModal, setShowAddVolunteerModal] = useState(false);
  const [allVolunteers, setAllVolunteers] = useState<any[]>([]);
  const [selectedEventForVolunteer, setSelectedEventForVolunteer] = useState(events?.[0]?.id || '');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'volunteer'));
    const unsub = onSnapshot(q, (snap) => {
      setAllVolunteers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    return () => unsub();
  }, []);

  const handleAddVolunteerToEvent = async (volunteerUid: string) => {
    if (!selectedEventForVolunteer) return;
    try {
      const eventRef = doc(db, 'events', selectedEventForVolunteer);
      await updateDoc(eventRef, {
        volunteerIds: arrayUnion(volunteerUid)
      });
      alert('Volunteer added to event successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${selectedEventForVolunteer}`);
    }
  };

  const filteredVolunteers = allVolunteers.filter(v => 
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">Volunteer Directory</h3>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search volunteers..." 
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-primary w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddVolunteerModal(true)}
            className="btn-primary py-2 text-xs flex items-center gap-2"
          >
            <Plus size={16} /> Add Volunteer
          </button>
        </div>
      </div>

      {/* Add Volunteer Modal */}
      <AnimatePresence>
        {showAddVolunteerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAddVolunteerModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold">Add Volunteer to Event</h3>
                <button onClick={() => setShowAddVolunteerModal(false)} className="text-gray-400 hover:text-red-primary"><X size={20} /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Select Event</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-red-primary"
                    value={selectedEventForVolunteer}
                    onChange={e => setSelectedEventForVolunteer(e.target.value)}
                  >
                    {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Available Volunteers</label>
                  {allVolunteers.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <img src={v.avatar || `https://i.pravatar.cc/150?u=${v.id}`} className="w-8 h-8 rounded-full" alt="" />
                        <div>
                          <p className="text-xs font-bold">{v.name}</p>
                          <p className="text-[8px] text-gray-500">{v.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddVolunteerToEvent(v.uid)}
                        className="p-1.5 bg-red-primary text-white rounded-lg hover:bg-red-dark transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                  {allVolunteers.length === 0 && <p className="text-center py-4 text-gray-400 text-xs">No volunteers found.</p>}
                </div>
              </div>

              <button onClick={() => setShowAddVolunteerModal(false)} className="btn-secondary w-full py-2">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Department</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Role</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredVolunteers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No volunteers found.</td>
              </tr>
            ) : (
              filteredVolunteers.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={v.avatar || `https://i.pravatar.cc/150?u=${v.id}`} className="w-8 h-8 rounded-full" alt="" />
                      <div>
                        <p className="text-sm font-bold">{v.name}</p>
                        <p className="text-[10px] text-gray-500">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium">{v.department || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-red-50 text-red-primary px-2 py-0.5 rounded font-bold uppercase">{v.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600" /> Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-red-primary"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- TASKS TAB ---
function TasksTab({ coordinatorId, events }: { coordinatorId: string, events: any[] }) {
  const [activeBoard, setActiveBoard] = useState('all');
  const [tasks, setTasks] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Logistics',
    eventId: events[0]?.id || '',
    priority: 'medium',
    deadline: '',
    assignedTo: [] as string[]
  });
  const [eventVolunteers, setEventVolunteers] = useState<any[]>([]);

  useEffect(() => {
    if (!newTask.eventId) return;
    const eventRef = doc(db, 'events', newTask.eventId);
    const unsub = onSnapshot(eventRef, async (docSnap) => {
      if (docSnap.exists()) {
        const vIds = docSnap.data().volunteerIds || [];
        if (vIds.length > 0) {
          const vQuery = query(collection(db, 'users'), where('uid', 'in', vIds));
          onSnapshot(vQuery, (vSnap) => {
            setEventVolunteers(vSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          });
        } else {
          setEventVolunteers([]);
        }
      }
    });
    return () => unsub();
  }, [newTask.eventId]);

  useEffect(() => {
    if (!coordinatorId) return;
    const q = query(collection(db, 'tasks'), where('coordinatorId', '==', coordinatorId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));
    return () => unsubscribe();
  }, [coordinatorId]);

  const handleCreateTask = async () => {
    try {
      const taskData = {
        ...newTask,
        coordinatorId,
        status: 'todo',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'tasks'), taskData);
      setShowCreateModal(false);
      alert('Task created successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const filteredTasks = tasks.filter(t => activeBoard === 'all' || t.status === activeBoard.replace(' ', ''));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 border-b border-gray-200">
          {['All Tasks', 'To Do', 'In Progress', 'Done'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveBoard(tab.toLowerCase())}
              className={`pb-3 px-2 text-sm font-bold transition-all relative ${
                activeBoard === tab.toLowerCase() ? 'text-red-primary' : 'text-gray-400'
              }`}
            >
              {tab}
              {activeBoard === tab.toLowerCase() && <motion.div layoutId="task-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-primary" />}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary py-2 text-xs flex items-center gap-2"><Plus size={16} /> New Task</button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {['todo', 'inprogress', 'done'].map(status => (
          <div key={status} className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest">
                {status === 'todo' ? 'To Do' : status === 'inprogress' ? 'In Progress' : 'Done'}
              </h4>
              <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            {tasks.filter(t => t.status === status).map(task => (
              <div key={task.id} className="card p-4 space-y-3 cursor-grab active:cursor-grabbing">
                <div className="flex justify-between items-start">
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    task.category === 'Logistics' ? 'bg-red-50 text-red-primary' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {task.category}
                  </span>
                  <button className="text-gray-300 hover:text-red-primary"><MoreVertical size={14} /></button>
                </div>
                <p className="text-sm font-bold">{task.title}</p>
                <p className="text-[10px] text-gray-500 line-clamp-2">{task.description}</p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <div className="flex -space-x-2">
                    {task.assignedTo?.map((v: any, j: number) => (
                      <img key={j} src={`https://i.pravatar.cc/100?u=${v}`} className="w-6 h-6 rounded-full border-2 border-white" alt="" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                    <Clock size={12} /> {task.deadline || 'No deadline'}
                  </div>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === status).length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-[10px] font-bold uppercase">No Tasks</div>
            )}
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-6"
            >
              <h3 className="text-xl font-display font-bold">Create New Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Task Title</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-red-primary"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Description</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-red-primary h-24"
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-red-primary"
                      value={newTask.category}
                      onChange={e => setNewTask({...newTask, category: e.target.value})}
                    >
                      <option>Logistics</option>
                      <option>Marketing</option>
                      <option>Technical</option>
                      <option>Hospitality</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Event</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-red-primary"
                      value={newTask.eventId}
                      onChange={e => setNewTask({...newTask, eventId: e.target.value})}
                    >
                      {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Assign Volunteers</label>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                      {eventVolunteers.map(v => (
                        <label key={v.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="accent-red-primary"
                            checked={newTask.assignedTo.includes(v.uid)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTask({...newTask, assignedTo: [...newTask.assignedTo, v.uid]});
                              } else {
                                setNewTask({...newTask, assignedTo: newTask.assignedTo.filter(id => id !== v.uid)});
                              }
                            }}
                          />
                          <span className="text-xs">{v.name}</span>
                        </label>
                      ))}
                      {eventVolunteers.length === 0 && <p className="text-[10px] text-gray-400 italic">No volunteers assigned to this event yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 py-2">Cancel</button>
                <button onClick={handleCreateTask} className="btn-primary flex-1 py-2">Create Task</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function AnnouncementsTab({ events }: { events: any[] }) {
  const [audience, setAudience] = useState('All');
  const [targetEvent, setTargetEvent] = useState('All Events');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setRecentBroadcasts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'broadcasts'));
    return () => unsub();
  }, []);

  const handleBroadcast = async () => {
    if (!subject || !message) {
      alert('Please fill in both subject and message.');
      return;
    }
    try {
      await addDoc(collection(db, 'announcements'), {
        subject,
        message,
        audience,
        targetEvent,
        createdAt: serverTimestamp(),
        authorId: auth.currentUser?.uid
      });
      alert(`Announcement broadcasted to ${audience} for ${targetEvent}!`);
      setSubject('');
      setMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-display font-bold mb-6">Send New Announcement</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Target Event</label>
              <select 
                value={targetEvent}
                onChange={(e) => setTargetEvent(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary"
              >
                <option>All Events</option>
                {events.map(e => <option key={e.id} value={e.title}>{e.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Target Audience</label>
              <div className="flex gap-3">
                {['All', 'Volunteers', 'Participants', 'Coordinators'].map(t => (
                  <button 
                    key={t} 
                    onClick={() => setAudience(t)}
                    className={`flex-1 py-2 border rounded-lg text-[10px] font-bold uppercase transition-all ${
                      audience === t ? 'bg-red-primary text-white border-red-primary' : 'border-gray-200 text-gray-500 hover:border-red-primary hover:text-red-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Subject</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                placeholder="Emergency Update / General Info..." 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary h-32 resize-none" 
                placeholder="Type your message here..." 
              />
            </div>
            <div className="flex justify-between items-center pt-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-red-primary" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Send as Push</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-red-primary" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Send as Email</span>
                </label>
              </div>
              <button onClick={handleBroadcast} className="btn-primary py-2 text-xs flex items-center gap-2"><Send size={16} /> Broadcast</button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-display font-bold">Recent Broadcasts</h3>
        <div className="space-y-4">
          {recentBroadcasts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No recent broadcasts.</div>
          ) : (
            recentBroadcasts.map(ann => (
              <div key={ann.id} className="card p-4 border-l-4 border-red-primary">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold">{ann.subject}</p>
                  <span className="text-[8px] text-gray-400">
                    {ann.createdAt instanceof Timestamp ? new Date(ann.createdAt.toDate()).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 line-clamp-2">{ann.message}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                  <span className="text-[8px] font-bold text-red-primary uppercase">Sent to: {ann.audience}</span>
                  <button className="text-gray-400 hover:text-red-primary"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- ANALYTICS TAB ---
function AnalyticsTab({ events }: { events: any[] }) {
  const totalRegistrations = events.reduce((acc, curr) => acc + (curr.registrationsCount || 0), 0);
  const avgRegistrations = events.length > 0 ? Math.round(totalRegistrations / events.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Total Registrations</p>
          <p className="text-4xl font-mono font-bold text-red-primary">{totalRegistrations}</p>
          <p className="text-[10px] text-green-600 font-bold mt-2">Across {events.length} events</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Avg per Event</p>
          <p className="text-4xl font-mono font-bold text-red-primary">{avgRegistrations}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-2">Registration rate</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Active Events</p>
          <p className="text-4xl font-mono font-bold text-red-primary">{events.filter(e => e.status === 'upcoming').length}</p>
          <p className="text-[10px] text-red-primary font-bold mt-2">Currently live</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Feedback Score</p>
          <p className="text-4xl font-mono font-bold text-red-primary">4.8</p>
          <p className="text-[10px] text-amber-500 font-bold mt-2">★★★★★</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold">Registration Trend</h3>
            <button className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-red-primary"><Download size={18} /></button>
          </div>
          <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Chart Visualization Placeholder</p>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-display font-bold mb-6">Department Performance</h3>
          <div className="space-y-6">
            {[
              { dept: 'Technical', val: 95 },
              { dept: 'Marketing', val: 78 },
              { dept: 'Logistics', val: 88 },
              { dept: 'Hospitality', val: 92 }
            ].map(d => (
              <div key={d.dept}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>{d.dept}</span>
                  <span className="text-red-primary">{d.val}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-primary transition-all duration-1000" style={{ width: `${d.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PROFILE TAB ---
function ProfileTab({ coordinator, onSave }: { coordinator: any, onSave: (data: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(coordinator);
  
  useEffect(() => {
    setEditedData(coordinator);
    setAvatarPreview(coordinator?.avatar);
  }, [coordinator]);

  const [avatarPreview, setAvatarPreview] = useState(coordinator?.avatar);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave({ ...editedData, avatar: avatarPreview });
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!coordinator) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card p-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="relative group">
          <img src={avatarPreview} className="w-32 h-32 rounded-full border-4 border-red-primary p-1 object-cover" alt="" />
          {isEditing && (
            <>
              <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-red-primary text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
              >
                <Camera size={14} />
              </button>
            </>
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            {isEditing ? (
              <input 
                type="text" 
                value={editedData.name} 
                onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                className="text-3xl font-display font-bold bg-gray-50 border border-gray-200 rounded px-2 outline-none focus:border-red-primary"
              />
            ) : (
              <h3 className="text-3xl font-display font-bold">{coordinator.name}</h3>
            )}
            <span className="bg-red-50 text-red-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase self-center md:self-auto">Event Coordinator</span>
          </div>
          {isEditing ? (
            <div className="space-y-2 mb-6">
              <input 
                type="text" 
                value={editedData.year} 
                onChange={(e) => setEditedData({...editedData, year: e.target.value})}
                className="text-sm text-gray-500 font-medium bg-gray-50 border border-gray-200 rounded px-2 w-full outline-none focus:border-red-primary"
              />
              <input 
                type="text" 
                value={editedData.department} 
                onChange={(e) => setEditedData({...editedData, department: e.target.value})}
                className="text-sm text-gray-500 font-medium bg-gray-50 border border-gray-200 rounded px-2 w-full outline-none focus:border-red-primary"
              />
            </div>
          ) : (
            <p className="text-gray-500 font-medium mb-6">{coordinator.year} • {coordinator.department} • {coordinator.college}</p>
          )}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="text-center px-6 border-r border-gray-100">
              <p className="text-xl font-mono font-bold">12</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Events Managed</p>
            </div>
            <div className="text-center px-6 border-r border-gray-100">
              <p className="text-xl font-mono font-bold">150+</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Volunteers Led</p>
            </div>
            <div className="text-center px-6">
              <p className="text-xl font-mono font-bold">4.9</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="btn-primary py-2 px-6 text-sm flex items-center gap-2 shadow-lg shadow-red-primary/30">
                <CheckCircle2 size={16} /> Save Changes
              </button>
              <button onClick={() => { setIsEditing(false); setEditedData(coordinator); }} className="btn-secondary py-2 px-6 text-sm">Cancel</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h4 className="text-xl font-display font-bold mb-6 border-b border-gray-50 pb-2">Contact Information</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Email Address</label>
              {isEditing ? (
                <input 
                  type="email" 
                  value={editedData.email} 
                  onChange={(e) => setEditedData({...editedData, email: e.target.value})}
                  className="text-sm font-bold bg-gray-50 border border-gray-200 rounded px-2 w-full outline-none focus:border-red-primary"
                />
              ) : (
                <p className="text-sm font-bold">{coordinator.email}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Phone Number</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editedData.phone} 
                  onChange={(e) => setEditedData({...editedData, phone: e.target.value})}
                  className="text-sm font-bold bg-gray-50 border border-gray-200 rounded px-2 w-full outline-none focus:border-red-primary"
                />
              ) : (
                <p className="text-sm font-bold">{coordinator.phone}</p>
              )}
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h4 className="text-xl font-display font-bold mb-6 border-b border-gray-50 pb-2">Coordinator Skills</h4>
          <div className="flex flex-wrap gap-2">
            {coordinator.skills.map((s: string) => (
              <span key={s} className="bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- TEAM TAB ---
function TeamTab({ events }: { events: any[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    
    // Fetch the event to get volunteerIds
    const eventRef = doc(db, 'events', selectedEventId);
    const unsub = onSnapshot(eventRef, async (docSnap) => {
      if (docSnap.exists()) {
        const eventData = docSnap.data();
        const volunteerIds = eventData.volunteerIds || [];
        
        if (volunteerIds.length > 0) {
          // Fetch user details for these volunteers
          const volunteersQuery = query(collection(db, 'users'), where('uid', 'in', volunteerIds));
          onSnapshot(volunteersQuery, (vSnap) => {
            setTeamMembers(vSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
          });
        } else {
          setTeamMembers([]);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [selectedEventId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-display font-bold">Team Management</h3>
          <p className="text-sm text-gray-500">Volunteers assigned to your events</p>
        </div>
        <select 
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-red-primary"
        >
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.title}</option>
          ))}
          {events.length === 0 && <option value="">No Events Found</option>}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-6 bg-red-50 border-red-100">
          <p className="text-[10px] text-red-primary font-bold uppercase mb-1">Total Volunteers</p>
          <p className="text-3xl font-mono font-bold text-red-primary">{teamMembers.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Active Now</p>
          <p className="text-3xl font-mono font-bold">{teamMembers.filter(m => m.status === 'Active').length || teamMembers.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tasks Completed</p>
          <p className="text-3xl font-mono font-bold">85%</p>
        </div>
      </div>
      
      <div className="card p-6">
        <h4 className="font-bold mb-4">Assigned Volunteers</h4>
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading team...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="pb-4">Volunteer</th>
                  <th className="pb-4">Department</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamMembers.map(m => (
                  <tr key={m.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-bold">{m.name}</p>
                        <p className="text-[10px] text-gray-500">{m.email}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-medium text-gray-600">{m.department || 'General'}</span>
                    </td>
                    <td className="py-4">
                      <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Active</span>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={async () => {
                          if (window.confirm(`Remove ${m.name} from this event?`)) {
                            try {
                              const eventRef = doc(db, 'events', selectedEventId);
                              await updateDoc(eventRef, {
                                volunteerIds: arrayRemove(m.uid)
                              });
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, `events/${selectedEventId}`);
                            }
                          }
                        }}
                        className="text-gray-400 hover:text-red-primary p-2 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {teamMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400 text-sm">
                      No volunteers assigned to this event yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- CERTIFICATES TAB ---
function CertificatesTab() {
  const [template, setTemplate] = useState<string | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [namePosition, setNamePosition] = useState({ x: 50, y: 50 }); // Percentage
  const [participants, setParticipants] = useState<any[]>([]);
  const [isIssuing, setIsIssuing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'registrations'),
      where('attended', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setParticipants(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'registrations');
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplatePreview(reader.result as string);
        setTemplate(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNamePosition({ x, y });
  };

  const handleIssueCertificate = async (participantId: string) => {
    if (!template) {
      alert("Please upload a certificate template first.");
      return;
    }

    setIsIssuing(true);
    try {
      const regRef = doc(db, 'registrations', participantId);
      await updateDoc(regRef, {
        certificateIssued: true,
        certificateUrl: 'https://example.com/certificate-template.pdf', // In real app, this would be generated
        issuedAt: new Date().toISOString(),
        namePosition // Store the position for generation
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `registrations/${participantId}`);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleIssueAll = async () => {
    if (!template) {
      alert("Please upload a certificate template first.");
      return;
    }

    const pending = filteredParticipants.filter(p => !p.certificateIssued);
    if (pending.length === 0) {
      alert("No pending certificates to issue.");
      return;
    }

    if (!window.confirm(`Are you sure you want to issue certificates to all ${pending.length} pending participants?`)) {
      return;
    }

    setIsIssuing(true);
    try {
      for (const p of pending) {
        const regRef = doc(db, 'registrations', p.id);
        await updateDoc(regRef, {
          certificateIssued: true,
          certificateUrl: 'https://example.com/certificate-template.pdf',
          issuedAt: new Date().toISOString(),
          namePosition
        });
      }
      alert(`Successfully issued ${pending.length} certificates!`);
    } catch (err) {
      console.error(err);
      alert("Failed to issue some certificates.");
    } finally {
      setIsIssuing(false);
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold">Issue Certificates</h2>
          <p className="text-sm text-gray-500">Generate and send certificates to verified participants.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleIssueAll}
            disabled={isIssuing || !template}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Award size={16} /> Issue All
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Export List
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileText size={18} className="text-red-primary" /> Certificate Template
            </h3>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative overflow-hidden ${
                template ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-red-primary hover:bg-red-50'
              }`}
              onClick={() => !templatePreview && fileInputRef.current?.click()}
            >
              {templatePreview ? (
                <div className="space-y-4">
                  <div 
                    ref={previewRef}
                    className="relative w-full aspect-[1.414/1] bg-white shadow-inner rounded overflow-hidden cursor-crosshair"
                    onClick={handlePreviewClick}
                  >
                    <img src={templatePreview} className="w-full h-full object-contain" alt="Template Preview" />
                    <div 
                      className="absolute pointer-events-none border-2 border-red-primary bg-red-primary/10 px-2 py-1 rounded text-[10px] font-bold text-red-primary whitespace-nowrap"
                      style={{ 
                        left: `${namePosition.x}%`, 
                        top: `${namePosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      [STUDENT NAME]
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-green-600 uppercase font-bold">{template}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="text-[10px] font-bold text-red-primary uppercase hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                    <Plus size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-600">Upload Template</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Image only (PNG/JPG)</p>
                </div>
              )}
            </div>
            {templatePreview && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                  <strong>Tip:</strong> Click on the template preview to set the position where the student's name will be printed.
                </p>
              </div>
            )}
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                <strong>Note:</strong> The system will automatically overlay the student's name and event details onto the selected template.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
              <h3 className="font-bold">Eligible Participants ({participants.length})</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name or ID..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="pb-4">Student</th>
                    <th className="pb-4">College</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredParticipants.map((p) => (
                    <tr key={p.id} className="group hover:bg-gray-50/50 transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-50 text-red-primary flex items-center justify-center font-bold text-xs">
                            {p.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{p.studentName}</p>
                            <p className="text-[10px] text-gray-500">{p.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-xs text-gray-600">{p.college || 'IIT Bombay'}</p>
                      </td>
                      <td className="py-4">
                        {p.certificateIssued ? (
                          <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                            <Check size={10} /> Issued
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase w-fit">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        {p.certificateIssued ? (
                          <button className="text-gray-400 hover:text-red-primary p-2 transition-all">
                            <Eye size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleIssueCertificate(p.id)}
                            disabled={isIssuing || !template}
                            className="btn-primary py-1.5 px-3 text-[10px] disabled:opacity-50"
                          >
                            Issue
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredParticipants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400 text-sm">
                        No eligible participants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

