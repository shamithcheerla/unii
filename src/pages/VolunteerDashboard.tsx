
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, CheckSquare, QrCode, Award, 
  MessageSquare, User, Clock, MapPin, 
  CheckCircle2, AlertCircle, ChevronRight,
  Camera, History, Star, Bell, X, Check, Calendar, Send, Info, Mail
} from 'lucide-react';
import { UniGuildData } from '../data';
import DashboardShell from '../components/DashboardShell';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, collection, query, where, onSnapshot, getDoc, addDoc, serverTimestamp, orderBy, limit, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { id: 'tasks', label: 'My Tasks', icon: <CheckSquare size={20} /> },
  { id: 'attendance', label: 'Attendance', icon: <QrCode size={20} /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare size={20} /> },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
];

export default function VolunteerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [volunteerProfile, setVolunteerProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for Demo Mode
    const isDemo = sessionStorage.getItem('uniguild_demo_mode') === 'true';
    const demoRole = sessionStorage.getItem('uniguild_demo_role');

    if (isDemo && demoRole === 'volunteer') {
      setVolunteerProfile({
        uid: 'demo-volunteer',
        name: 'Demo Volunteer',
        email: 'vol@uniguild.edu',
        role: 'volunteer',
        college: 'Sasi Institute of Technology',
        avatar: 'https://i.pravatar.cc/300?u=vol'
      });
      
      // Still fetch tasks and announcements for demo (global)
      const tasksUnsub = onSnapshot(query(collection(db, 'tasks'), limit(5)), (snap) => {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const annUnsub = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3)), (snap) => {
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      setLoading(false);
      return () => { tasksUnsub(); annUnsub(); };
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch Volunteer Profile
        const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setVolunteerProfile({ uid: docSnap.id, ...docSnap.data() });
          }
          setLoading(false);
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

        // Fetch Tasks
        const tasksQuery = query(collection(db, 'tasks'), where('assignedTo', 'array-contains', user.uid));
        const tasksUnsub = onSnapshot(tasksQuery, (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTasks(tasksData);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));

        // Fetch Announcements (Real-time)
        const annQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
        const annUnsub = onSnapshot(annQuery, (snapshot) => {
          setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

        return () => {
          profileUnsub();
          tasksUnsub();
          annUnsub();
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

  const handleCompleteTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { 
        status: 'completed',
        completedAt: serverTimestamp()
      });
      setNotification({ message: 'Task marked as complete!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
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
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-400">Loading section...</p>
        </div>
      );
    }

    if (!volunteerProfile && activeTab !== 'overview') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-20 h-20 bg-red-50 text-red-primary rounded-full flex items-center justify-center mb-6">
            <User size={40} />
          </div>
          <h3 className="text-xl font-display font-bold mb-2">Profile Not Found</h3>
          <p className="text-gray-500 text-sm mb-8 max-w-xs">We couldn't find your volunteer profile. This might happen if your account hasn't been fully set up or if there's a connection issue.</p>
          <div className="flex flex-col w-full max-w-xs gap-3">
            <button onClick={() => window.location.reload()} className="btn-primary w-full py-3">Retry Sync</button>
            <button onClick={() => navigate('/login')} className="btn-secondary w-full py-3">Back to Login</button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview': return <OverviewTab volunteer={volunteerProfile} tasks={tasks} announcements={announcements} onScanClick={() => setActiveTab('attendance')} />;
      case 'tasks': return <TasksTab tasks={tasks} onComplete={handleCompleteTask} />;
      case 'attendance': return <AttendanceTab volunteerId={volunteerProfile?.uid} volunteerName={volunteerProfile?.name} />;
      case 'messages': return <MessagesTab />;
      case 'profile': return <ProfileTab volunteer={volunteerProfile} onSave={handleSaveProfile} />;
      default: return <OverviewTab volunteer={volunteerProfile} tasks={tasks} announcements={announcements} onScanClick={() => setActiveTab('attendance')} />;
    }
  };

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleName="Volunteer"
      userName={volunteerProfile?.name || "Volunteer"}
      userAvatar={volunteerProfile?.avatar}
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

// --- OVERVIEW TAB ---
function OverviewTab({ volunteer, tasks, announcements, onScanClick }: { volunteer: any, tasks: any[], announcements: any[], onScanClick: () => void }) {
  const nextTask = tasks.find(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="bg-gradient-to-br from-red-primary to-red-dark rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight">Hi, {volunteer?.name?.split(' ')[0]}!</h2>
            <p className="text-xs opacity-80">You're assigned to '{volunteer?.assignedEvent || 'Campus Events'}'</p>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
            <Star className="text-yellow-400 fill-yellow-400" size={20} />
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase opacity-60">Hours</p>
            <p className="text-xl font-mono font-bold">{volunteer?.volunteerHours || 0}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase opacity-60">Tasks</p>
            <p className="text-xl font-mono font-bold">{completedTasks}/{tasks.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-display font-bold flex items-center justify-between">
          Next Task
          {nextTask && <span className="text-[10px] text-red-primary font-bold uppercase">Due Soon</span>}
        </h3>
        {nextTask ? (
          <div className="card p-4 border-l-4 border-red-primary">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-sm">{nextTask.title}</h4>
              <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold uppercase">{nextTask.category || 'General'}</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">{nextTask.description}</p>
            <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
              <span className="flex items-center gap-1"><MapPin size={12} /> {nextTask.location || 'Campus'}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {nextTask.dueDate || 'Today'}</span>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-400">
            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">All tasks completed! Great job.</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-display font-bold">Recent Announcements</h3>
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Bell size={24} className="mx-auto text-gray-300 mb-2 opacity-50" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No new updates</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ann.priority === 'High' ? 'bg-red-100 text-red-primary' : 'bg-red-50 text-red-primary'
                }`}>
                  <Bell size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{ann.subject}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{ann.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button 
        onClick={onScanClick}
        className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2"
      >
        <QrCode size={20} /> Scan for Attendance
      </button>
    </div>
  );
}

// --- TASKS TAB ---
function TasksTab({ tasks, onComplete }: { tasks: any[], onComplete: (id: string) => void }) {
  const [filter, setFilter] = useState('todo');
  const filteredTasks = tasks.filter(t => {
    if (filter === 'todo') return t.status === 'todo' || t.status === 'pending' || t.status === 'in-progress';
    return t.status === filter;
  });

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {['To Do', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f.toLowerCase().replace(' ', ''))}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              filter === f.toLowerCase().replace(' ', '') ? 'bg-white text-red-primary shadow-sm' : 'text-gray-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No {filter} tasks found.</div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="card p-4 group">
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => (task.status === 'todo' || task.status === 'pending') && onComplete(task.id)}
                  disabled={task.status === 'completed'}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 hover:border-red-primary'
                  }`}
                >
                  {task.status === 'completed' && <Check size={14} />}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </h4>
                    <span className="text-[8px] font-bold uppercase text-gray-400">Task ID: {task.id.substring(0, 5).toUpperCase()}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-3">{task.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center text-[8px] font-bold text-red-primary">
                        {task.coordinatorName?.charAt(0) || 'C'}
                      </div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Coord: {task.coordinatorName || 'Coordinator'}</span>
                    </div>
                    <span className="text-[8px] font-bold text-red-primary uppercase">Due: {task.dueDate || 'Today'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- ATTENDANCE TAB ---
function AttendanceTab({ volunteerId, volunteerName }: { volunteerId: string, volunteerName: string }) {
  const [mode, setMode] = useState<'scan' | 'history'>('scan');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (mode === 'scan' && !scanResult && !isProcessing && !success && !error) {
      // Ensure the element exists before initializing
      const timer = setTimeout(() => {
        const element = document.getElementById("volunteer-reader");
        if (element) {
          scanner = new Html5QrcodeScanner(
            "volunteer-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );

          scanner.render(onScanSuccess, onScanFailure);
          scannerRef.current = scanner;
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(err => console.error("Failed to clear scanner", err));
          scannerRef.current = null;
        }
      };
    }
  }, [mode, scanResult, isProcessing, success, error]);

  // Fetch history
  useEffect(() => {
    const q = query(
      collection(db, 'registrations'),
      where('attended', '==', true),
      where('scannedBy', '==', volunteerId)
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
    
    // The decodedText should be the registrationId
    setScanResult(decodedText);
    if (scannerRef.current) {
      await scannerRef.current.clear();
    }
    handleMarkAttendance(decodedText);
  }

  function onScanFailure(error: any) {
    // console.warn(`Code scan error = ${error}`);
  }

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
        scannedBy: volunteerId,
        scannedByName: volunteerName
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
    <div className="space-y-6 max-w-md mx-auto text-center">
      <div className="flex gap-4 border-b border-gray-200 mb-8">
        <button 
          onClick={() => setMode('scan')}
          className={`flex-1 pb-3 text-sm font-bold transition-all relative ${mode === 'scan' ? 'text-red-primary' : 'text-gray-400'}`}
        >
          Check-In
          {mode === 'scan' && <motion.div layoutId="att" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-primary" />}
        </button>
        <button 
          onClick={() => setMode('history')}
          className={`flex-1 pb-3 text-sm font-bold transition-all relative ${mode === 'history' ? 'text-red-primary' : 'text-gray-400'}`}
        >
          History
          {mode === 'history' && <motion.div layoutId="att" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-primary" />}
        </button>
      </div>

      {mode === 'scan' ? (
        <div className="space-y-6">
          {!scanResult && !success && !error ? (
            <div className="space-y-6">
              <div id="volunteer-reader" className="overflow-hidden rounded-3xl border-4 border-red-primary shadow-2xl bg-black min-h-[300px]" />
              <div>
                <h3 className="text-xl font-display font-bold">Scan Participant Pass</h3>
                <p className="text-xs text-gray-500 mt-2 px-8">Point the camera at the student's event pass QR code to mark their attendance.</p>
              </div>
              
              {/* Manual Entry for Demo/Fallback */}
              <div className="pt-6 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Or Enter Registration ID</p>
                <div className="flex flex-col gap-2">
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
                    className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check size={18} /> Mark Present
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 space-y-6">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-12 h-12 border-4 border-red-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Processing Pass...</p>
                </div>
              ) : (
                <>
                  {success && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <Check size={40} />
                      </div>
                      <h3 className="text-xl font-display font-bold text-green-600">Attendance Recorded</h3>
                      <p className="text-sm text-gray-600">{success}</p>
                    </div>
                  )}
                  {error && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-red-100 text-red-primary rounded-full flex items-center justify-center">
                        <X size={40} />
                      </div>
                      <h3 className="text-xl font-display font-bold text-red-primary">Scan Failed</h3>
                      <p className="text-sm text-gray-600">{error}</p>
                    </div>
                  )}
                  <button 
                    onClick={resetScanner}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    Scan Next Pass
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-left">
          {history.length > 0 ? (
            history.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <History size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.studentName}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{item.eventName} • {new Date(item.attendedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-green-600 uppercase">Verified</span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No attendance records yet for this session.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- CERTIFICATES TAB ---
function CertificatesTab() {
  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="card p-6 bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
        <div className="relative z-10">
          <Award className="text-red-primary mb-4" size={40} />
          <h3 className="text-2xl font-display font-bold mb-2">Volunteer Excellence</h3>
          <p className="text-xs opacity-70 mb-6">Awarded for outstanding contribution to Code Rush 2026.</p>
          <button className="bg-red-primary text-white px-6 py-2 rounded-lg font-bold text-xs hover:bg-red-dark transition-all">Download PDF</button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-display font-bold">Past Certificates</h3>
        {[1, 2].map(i => (
          <div key={i} className="flex items-center justify-between p-4 card">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                <Award size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Annual Tech Fest 2025</p>
                <p className="text-[10px] text-gray-500">Issued: 12-12-2025</p>
              </div>
            </div>
            <button className="p-2 text-red-primary hover:bg-red-50 rounded-lg transition-all"><ChevronRight size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MESSAGES TAB ---
function MessagesTab() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser || !selectedChat) return;
    try {
      const msgData = {
        chatId: selectedChat.id,
        senderId: auth.currentUser.uid,
        text: newMessage,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'chat_messages'), msgData);
      await updateDoc(doc(db, 'messages', selectedChat.id), {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">Team Chat</h3>
        <span className="text-[10px] bg-red-primary text-white px-2 py-0.5 rounded-full font-bold">Real-time</span>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No active chats.</div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              onClick={() => setSelectedChat(m)}
              className={`flex gap-4 p-4 card hover:border-red-primary/30 cursor-pointer transition-all ${selectedChat?.id === m.id ? 'border-red-primary' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-primary font-bold">
                {m.otherPartyName?.charAt(0) || 'T'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="text-sm font-bold">{m.otherPartyName || 'Team Member'}</p>
                    <p className="text-[8px] font-bold text-red-primary uppercase">{m.type || 'Coordinator'}</p>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {m.lastMessageAt ? new Date(m.lastMessageAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{m.lastMessage || 'Start a conversation'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- PROFILE TAB ---
function ProfileTab({ volunteer, onSave }: { volunteer: any, onSave: (data: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...volunteer });
  
  useEffect(() => {
    setEditData({ ...volunteer });
  }, [volunteer]);

  const [notifPrefs, setNotifPrefs] = useState({
    newEvents: { inApp: true, email: true },
    taskAssignments: { inApp: true, email: true },
    messages: { inApp: true, email: false },
    announcements: { inApp: true, email: true },
  });

  const toggleNotif = (type: keyof typeof notifPrefs, channel: 'inApp' | 'email') => {
    setNotifPrefs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel]
      }
    }));
  };

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  if (!volunteer) return null;

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <div className="relative inline-block mb-4 group">
          <img src={isEditing ? editData.avatar : volunteer.avatar || "https://picsum.photos/seed/user/100/100"} className="w-24 h-24 rounded-full border-4 border-red-primary p-1 object-cover" alt="" />
          {isEditing && (
            <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} />
            </button>
          )}
          <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white" />
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <input 
              type="text" 
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-center font-bold outline-none focus:border-red-primary"
            />
            <input 
              type="text" 
              value={editData.college}
              onChange={(e) => setEditData({ ...editData, college: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-center text-sm outline-none focus:border-red-primary"
            />
            <div className="flex gap-2 justify-center">
              <button onClick={handleSave} className="btn-primary py-1.5 px-6 text-xs">Save</button>
              <button onClick={() => setIsEditing(false)} className="btn-secondary py-1.5 px-6 text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-display font-bold">{volunteer.name}</h3>
            <p className="text-gray-500 text-sm font-medium">{volunteer.college}</p>
            <button onClick={() => setIsEditing(true)} className="mt-2 text-red-primary text-xs font-bold hover:underline">Edit Profile</button>
          </>
        )}
        <div className="flex justify-center gap-2 mt-4">
          <span className="bg-red-50 text-red-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">Top Volunteer</span>
          <span className="bg-red-50 text-red-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">4.8 ★</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-mono font-bold">12</p>
          <p className="text-[10px] text-gray-400 uppercase font-bold">Events</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-mono font-bold">85</p>
          <p className="text-[10px] text-gray-400 uppercase font-bold">Hours</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Skills & Badges</h4>
        <div className="flex flex-wrap gap-2">
          {['Leadership', 'Communication', 'Technical Support', 'Management'].map(s => (
            <span key={s} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-600">{s}</span>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Notification Preferences</h4>
        <div className="card p-4 space-y-1 divide-y divide-gray-50">
          {[
            { id: 'newEvents', label: 'New Events', icon: <Calendar size={14} /> },
            { id: 'taskAssignments', label: 'Task Assignments', icon: <CheckCircle2 size={14} /> },
            { id: 'messages', label: 'Messages', icon: <Send size={14} /> },
            { id: 'announcements', label: 'Announcements', icon: <Bell size={14} /> },
          ].map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-red-primary group-hover:bg-red-50 transition-all">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-gray-700">{item.label}</span>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => toggleNotif(item.id as any, 'inApp')}
                    className={`w-8 h-4 rounded-full relative transition-all ${notifPrefs[item.id as keyof typeof notifPrefs].inApp ? 'bg-red-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${notifPrefs[item.id as keyof typeof notifPrefs].inApp ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-[7px] font-bold text-gray-400 uppercase">App</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => toggleNotif(item.id as any, 'email')}
                    className={`w-8 h-4 rounded-full relative transition-all ${notifPrefs[item.id as keyof typeof notifPrefs].email ? 'bg-red-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${notifPrefs[item.id as keyof typeof notifPrefs].email ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-[7px] font-bold text-gray-400 uppercase">Mail</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Settings</h4>
        <div className="card divide-y divide-gray-50">
          <button className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-gray-50 transition-all">
            <span>Privacy Settings</span>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
          <button className="w-full flex items-center justify-between p-4 text-sm font-medium text-red-primary hover:bg-red-50 transition-all">
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
