
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, School, Users, Calendar, Briefcase, Megaphone, 
  CheckSquare, BarChart3, Settings, ScrollText, TrendingUp, 
  ArrowUpRight, Clock, Download, Search, Filter, MoreVertical,
  UserPlus, Mail, Shield, UserX, ExternalLink, XCircle, Plus, X, Trash2, Edit,
  User, CheckCircle2, AlertCircle, Camera
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { UniGuildData } from '../data';
import DashboardShell from '../components/DashboardShell';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, addDoc, serverTimestamp, query, where, 
  onSnapshot, Timestamp, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDocs, orderBy, limit
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const logAction = async (action: string, target: string) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      target,
      timestamp: serverTimestamp(),
      userId: auth.currentUser?.uid || 'system',
      userName: auth.currentUser?.displayName || auth.currentUser?.email || 'System',
      ipAddress: '127.0.0.1'
    });
  } catch (err) {
    console.error('Audit Log failed:', err);
  }
};

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { id: 'colleges', label: 'Colleges', icon: <School size={20} /> },
  { id: 'users', label: 'Users', icon: <Users size={20} /> },
  { id: 'events', label: 'Events', icon: <Calendar size={20} /> },
  { id: 'jobs', label: 'Jobs', icon: <Briefcase size={20} /> },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
  { id: 'approvals', label: 'Approvals', icon: <CheckSquare size={20} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  { id: 'audit', label: 'Audit Logs', icon: <ScrollText size={20} /> },
];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<string[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);

  useEffect(() => {
    // Check for Demo Mode
    const isDemo = sessionStorage.getItem('uniguild_demo_mode') === 'true';
    const demoRole = sessionStorage.getItem('uniguild_demo_role');

    if (isDemo && demoRole === 'superadmin') {
      setAdmin({
        uid: 'demo-admin',
        name: 'Demo Admin',
        email: 'admin@uniguild.edu',
        role: 'superadmin',
        avatar: 'https://i.pravatar.cc/300?u=admin'
      });
      
      // Still fetch institutions for demo
      const instUnsub = onSnapshot(collection(db, 'institutions'), (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setInstitutions(docs);
        setColleges(docs.map((d: any) => d.name).sort());
      });
      setLoading(false);
      return () => instUnsub();
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch Admin Profile
        const adminUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists() && docSnap.data().role === 'superadmin') {
            setAdmin({ uid: docSnap.id, ...docSnap.data() });
          } else {
            console.error('Unauthorized access attempt');
            setAdmin(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setLoading(false);
        });

        // Fetch Institutions
        const instUnsub = onSnapshot(collection(db, 'institutions'), (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setInstitutions(docs);
          setColleges(docs.map((d: any) => d.name).sort());
        });

        return () => {
          adminUnsub();
          instUnsub();
        };
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleSaveProfile = () => {
    setNotification({ message: 'Profile updated successfully!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'colleges': return <CollegesTab institutions={institutions} colleges={colleges} />;
      case 'users': return <UsersTab colleges={colleges} />;
      case 'events': return <EventsTab colleges={colleges} />;
      case 'jobs': return <JobsTab colleges={colleges} />;
      case 'announcements': return <AnnouncementsTab />;
      case 'approvals': return <ApprovalsTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'profile': return <ProfileTab admin={admin} setAdmin={setAdmin} onSave={handleSaveProfile} />;
      case 'settings': return <SettingsTab />;
      case 'audit': return <AuditTab />;
      default: return <OverviewTab />;
    }
  };  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Authenticating Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-sm">
          <AlertCircle className="mx-auto text-red-primary mb-4 shrink-0" size={48} />
          <h2 className="text-xl font-display font-bold mb-2">Access Restricted</h2>
          <p className="text-gray-500 text-sm mb-6">Your account does not have Super Admin privileges or your profile was not found.</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full py-3 text-sm">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleName="Super Admin"
      userName={admin?.name || "Super Admin"}
      userAvatar={admin?.avatar}
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-full overflow-y-auto">
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
      </div>
    </DashboardShell>
  );
}

// --- OVERVIEW TAB ---
function OverviewTab() {
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Users',
        data: [2000, 3500, 4800, 6200, 7500, 9000, 10500, 12000, 13500, 14200, 14800, 15248],
        borderColor: '#f40000',
        backgroundColor: 'rgba(244, 0, 0, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Events',
        data: [5, 12, 18, 22, 28, 30, 35, 40, 42, 38, 35, 34],
        borderColor: '#444444',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
      }
    ]
  };

  const doughnutData = {
    labels: ['Students', 'Coordinators', 'Evaluators', 'Volunteers', 'Orgs'],
    datasets: [{
      data: [12000, 500, 300, 2000, 448],
      backgroundColor: ['#f40000', '#333333', '#666666', '#999999', '#cccccc'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Total Users" value="15,248" trend="+8.2%" icon={<Users size={20} />} />
        <MetricCard label="Active Events" value="34" trend="Stable" icon={<Calendar size={20} />} />
        <MetricCard label="Organizations" value="218" trend="+4.1%" icon={<School size={20} />} />
        <MetricCard label="Pending Approvals" value="7" trend="Urgent" icon={<CheckSquare size={20} />} isUrgent />
        <MetricCard label="Jobs Posted" value="89" trend="+12%" icon={<Briefcase size={20} />} />
        <MetricCard label="Revenue" value="₹4.8L" trend="+18%" icon={<TrendingUp size={20} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-xl font-display font-bold mb-6">Platform Growth (12 Months)</h3>
          <div className="h-80">
            <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-display font-bold mb-6">User Distribution</h3>
          <div className="h-80 flex justify-center">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-xl font-display font-bold mb-6">Events by Category</h3>
          <div className="h-64">
            <Bar 
              data={{
                labels: ['Hackathons', 'Webinars', 'Workshops', 'Competitions', 'Drives'],
                datasets: [{
                  label: 'Events',
                  data: [12, 8, 15, 10, 5],
                  backgroundColor: '#f40000',
                  borderRadius: 6,
                }]
              }} 
              options={{ maintainAspectRatio: false }} 
            />
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-display font-bold mb-6">Live Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3 border-l-2 border-red-primary pl-4 py-1">
                <div>
                  <p className="text-xs font-bold">New Event Approval Request</p>
                  <p className="text-[10px] text-gray-500">IIT Bombay • 2 mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, icon, isUrgent }: any) {
  return (
    <div className={`card p-4 ${isUrgent ? 'border-red-primary bg-red-50/30' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${isUrgent ? 'bg-red-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
        {icon}
      </div>
      <div className="text-2xl font-mono font-bold leading-tight">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase font-bold mt-1">{label}</div>
      <div className={`text-[10px] font-bold mt-2 ${trend.includes('+') ? 'text-green-600' : isUrgent ? 'text-red-primary' : 'text-gray-400'}`}>
        {trend}
      </div>
    </div>
  );
}

// --- COLLEGES TAB ---
function CollegesTab({ institutions, colleges }: { institutions: any[], colleges: string[] }) {
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'students' | 'coordinators'>('details');
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [newInst, setNewInst] = useState({ name: '', location: '', logo: '', type: 'University' });
  const [userCounts, setUserCounts] = useState<Record<string, { students: number, coordinators: number }>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const counts: Record<string, { students: number, coordinators: number }> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.college) {
          if (!counts[data.college]) counts[data.college] = { students: 0, coordinators: 0 };
          if (data.role === 'student') counts[data.college].students++;
          else if (data.role === 'coordinator') counts[data.college].coordinators++;
        }
      });
      setUserCounts(counts);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    return () => unsub();
  }, []);

  const handleCreateInst = async () => {
    if (!newInst.name) return;
    try {
      await addDoc(collection(db, 'institutions'), {
        ...newInst,
        createdAt: serverTimestamp()
      });
      logAction('CREATE_INSTITUTION', newInst.name);
      setShowAddInstModal(false);
      setNewInst({ name: '', location: '', logo: '', type: 'University' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'institutions');
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const newInstitutions = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = values[i]?.trim();
        });
        return obj;
      });

      try {
        for (const inst of newInstitutions) {
          if (!inst.name) continue;
          await addDoc(collection(db, 'institutions'), {
            ...inst,
            createdAt: serverTimestamp()
          });
        }
        logAction('BULK_UPLOAD_INSTITUTIONS', `${newInstitutions.length} institutions`);
        alert('Bulk upload successful!');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'institutions');
      }
    };
    reader.readAsText(file);
  };

  const [students, setStudents] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCollege) return;
    setLoading(true);

    const qStudents = query(collection(db, 'users'), where('college', '==', selectedCollege), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const qCoords = query(collection(db, 'users'), where('college', '==', selectedCollege), where('role', '==', 'coordinator'));
    const unsubCoords = onSnapshot(qCoords, (snap) => {
      setCoordinators(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => {
      unsubStudents();
      unsubCoords();
    };
  }, [selectedCollege]);

  const removeStudent = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    try {
      // For now, we just remove the college link or delete if needed. 
      // Usually, we just update the 'college' field to null or delete the user doc.
      await updateDoc(doc(db, 'users', id), { college: null });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const removeCoordinator = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this coordinator?')) return;
    try {
      await updateDoc(doc(db, 'users', id), { college: null });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberRole, setMemberRole] = useState<'student' | 'coordinator'>('student');
  const [memberEmail, setMemberEmail] = useState('');

  const handleAddMember = async () => {
    if (!memberEmail) return;
    try {
      const q = query(collection(db, 'users'), where('email', '==', memberEmail));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert('User not found. Please ensure the email is correct.');
        return;
      }
      const userDoc = snap.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        college: selectedCollege,
        role: memberRole
      });
      alert(`User ${userDoc.data().name} assigned as ${memberRole} to ${selectedCollege}`);
      setShowAddMemberModal(false);
      setMemberEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const addStudent = () => {
    setMemberRole('student');
    setShowAddMemberModal(true);
  };

  const addCoordinator = () => {
    setMemberRole('coordinator');
    setShowAddMemberModal(true);
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xl font-display font-bold">Institutional Network</h3>
          <p className="text-xs text-gray-500">{institutions.length} active campuses across the platform</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleBulkUpload} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2 text-xs py-2"
          >
            <Download size={16} /> Bulk Upload (CSV)
          </button>
          <button 
            onClick={async () => {
              const q = query(collection(db, 'users'), where('role', '==', 'student'));
              const snap = await getDocs(q);
              downloadCSV(snap.docs.map(d => ({id: d.id, ...d.data()})), 'All_Students.csv');
            }}
            className="btn-secondary flex items-center gap-2 text-xs py-2"
          >
            <Download size={16} /> Export Students
          </button>
          <button 
            onClick={() => setShowAddInstModal(true)}
            className="btn-primary flex items-center gap-2 text-xs py-2"
          >
            <Plus size={16} /> Add Institution
          </button>
        </div>
      </div>

      <div className="flex gap-6 relative">
      <div className={`flex-1 grid md:grid-cols-2 xl:grid-cols-3 gap-6 transition-all ${selectedCollege ? 'mr-96' : ''}`}>
        {institutions.map(inst => (
          <div 
            key={inst.id} 
            onClick={() => {
              setSelectedCollege(inst.name);
              setViewMode('details');
            }}
            className="card p-6 cursor-pointer group hover:border-red-primary transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-display font-bold text-2xl group-hover:bg-red-primary group-hover:text-white transition-all">
                {inst.logo ? <img src={inst.logo} className="w-full h-full object-contain" alt="" /> : inst.name.charAt(0)}
              </div>
              <button className="text-gray-400 hover:text-red-primary"><MoreVertical size={18} /></button>
            </div>
            <h3 className="text-xl font-display font-bold mb-2">{inst.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{inst.location || 'Location Pending'}</p>
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Students</p>
                <p className="font-mono font-bold">{userCounts[inst.name]?.students || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Coords</p>
                <p className="font-mono font-bold">{userCounts[inst.name]?.coordinators || 0}</p>
              </div>
            </div>
          </div>
        ))}
        {institutions.length === 0 && (
          <div className="col-span-full py-20 text-center card bg-gray-50 border-dashed">
            <School size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No institutions found</p>
            <button onClick={() => fileInputRef.current?.click()} className="mt-4 text-red-primary font-bold text-sm hover:underline">Upload your first CSV</button>
          </div>
        )}
      </div></div>

      {/* Right Side Panel */}
      <AnimatePresence>
        {selectedCollege && (
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-16 right-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-[85] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-red-primary">{selectedCollege}</h2>
                <button onClick={() => setSelectedCollege(null)} className="p-2 hover:bg-gray-100 rounded-full"><XCircle size={24} /></button>
              </div>
              
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                {(['details', 'students', 'coordinators'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                      viewMode === mode ? 'bg-white text-red-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-8">
              {viewMode === 'details' && (
                <>
                  <section>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">Quick Stats</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-mono font-bold">{userCounts[selectedCollege!]?.students || 0}</p>
                        <p className="text-[8px] uppercase font-bold text-gray-500">Students</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-mono font-bold">{userCounts[selectedCollege!]?.coordinators || 0}</p>
                        <p className="text-[8px] uppercase font-bold text-gray-500">Coordinators</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-mono font-bold">34</p>
                        <p className="text-[8px] uppercase font-bold text-gray-500">Events</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">College Info</h4>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location</span>
                        <span className="font-bold">Mumbai, Maharashtra</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Established</span>
                        <span className="font-bold">1958</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-bold">Public Technical University</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">Recent Events</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-red-primary cursor-pointer">
                          <p className="text-xs font-bold">Code Rush Hackathon</p>
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold">Active</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <button 
                    onClick={() => downloadCSV([institutions.find(i => i.name === selectedCollege)], `${selectedCollege}_Report.csv`)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Download College Report
                  </button>
                </>
              )}

              {viewMode === 'students' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Student List</h4>
                    <button 
                      onClick={addStudent}
                      className="text-[10px] text-red-primary font-bold hover:underline"
                    >
                      Add Student
                    </button>
                  </div>
                  <div className="space-y-3">
                    {students.map(stu => (
                      <div key={stu.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-primary/10 text-red-primary flex items-center justify-center font-bold text-xs">
                              {stu.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{stu.name}</p>
                              <p className="text-[10px] text-gray-500">{stu.branch} • {stu.year}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeStudent(stu.id)}
                            className="text-gray-300 hover:text-red-primary opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => downloadCSV(students, `${selectedCollege}_Students.csv`)}
                    className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download Student Data
                  </button>
                </div>
              )}

              {viewMode === 'coordinators' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Coordinators</h4>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => downloadCSV(coordinators, `${selectedCollege}_Coordinators.csv`)}
                        className="text-[10px] text-gray-400 hover:text-red-primary font-bold transition-all"
                      >
                        Download Data
                      </button>
                      <button 
                        onClick={addCoordinator}
                        className="text-[10px] text-red-primary font-bold hover:underline"
                      >
                        Add Coordinator
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {coordinators.map(coord => (
                      <div key={coord.id} className="p-4 bg-red-50 rounded-xl border border-red-100 group">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-primary text-white flex items-center justify-center font-bold">
                              {coord.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{coord.name}</p>
                              <p className="text-xs text-gray-500">{coord.dept} Department</p>
                              <p className="text-[10px] text-gray-400 mt-1">{coord.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeCoordinator(coord.id)}
                            className="text-red-200 hover:text-red-primary opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add Member Modal */}
            <AnimatePresence>
              {showAddMemberModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAddMemberModal(false)}
                    className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
                  >
                    <h3 className="text-lg font-display font-bold mb-4">Add {memberRole === 'student' ? 'Student' : 'Coordinator'}</h3>
                    <p className="text-xs text-gray-500 mb-4 uppercase font-bold">Target: {selectedCollege}</p>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Search by Email</label>
                      <input 
                        type="email" 
                        value={memberEmail}
                        onChange={e => setMemberEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none mt-1 focus:border-red-primary"
                      />
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowAddMemberModal(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                      <button onClick={handleAddMember} className="btn-primary flex-1 py-2 text-xs">Assign Member</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Add Institution Modal */}
      <AnimatePresence>
        {showAddInstModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddInstModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8"
            >
              <h3 className="text-xl font-display font-bold mb-6 text-red-primary">Register New Institution</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 tracking-widest">Campus Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary transition-all" 
                    placeholder="e.g. National Institute of Technology"
                    value={newInst.name}
                    onChange={e => setNewInst({...newInst, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 tracking-widest">Location</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary transition-all" 
                    placeholder="City, State"
                    value={newInst.location}
                    onChange={e => setNewInst({...newInst, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 tracking-widest">Institution Type</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary transition-all appearance-none"
                    value={newInst.type}
                    onChange={e => setNewInst({...newInst, type: e.target.value})}
                  >
                    <option>University</option>
                    <option>Private College</option>
                    <option>Government Institute</option>
                    <option>Academy</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 tracking-widest">Logo URL (Optional)</label>
                  <input 
                    type="url" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary transition-all" 
                    placeholder="https://link-to-logo.png"
                    value={newInst.logo}
                    onChange={e => setNewInst({...newInst, logo: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowAddInstModal(false)} className="btn-secondary flex-1 py-3 text-sm rounded-xl">Cancel</button>
                <button onClick={handleCreateInst} className="btn-primary flex-1 py-3 text-sm font-bold rounded-xl shadow-lg shadow-red-primary/20 hover:scale-[1.02] transition-all">Register Campus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- USERS TAB ---
function UsersTab({ colleges }: { colleges: string[] }) {
  const [roleFilter, setRoleFilter] = useState('All');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'student', college: '', status: 'active' });

  useEffect(() => {
    const q = roleFilter === 'All' 
      ? query(collection(db, 'users'))
      : query(collection(db, 'users'), where('role', '==', roleFilter.toLowerCase().slice(0, -1) || roleFilter.toLowerCase())); // handle plural to singular
    
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    return () => unsub();
  }, [roleFilter]);

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email) return;
    try {
      await addDoc(collection(db, 'users'), {
        ...userForm,
        joinedAt: serverTimestamp(),
        avatar: `https://i.pravatar.cc/150?u=${userForm.email}`
      });
      logAction('CREATE_USER', userForm.email);
      setShowAddModal(false);
      setUserForm({ name: '', email: '', role: 'student', college: '', status: 'active' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), userForm);
      logAction('UPDATE_USER', editingUser.email);
      setEditingUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${editingUser.id}`);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      logAction('DELETE_USER', email);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['All', 'Students', 'Coordinators', 'Evaluators', 'Volunteers'].map(role => (
            <button 
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                roleFilter === role ? 'bg-red-primary text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-red-primary'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"><Download size={16} /> Export CSV</button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2"><UserPlus size={16} /> Add User</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-20 text-center"><div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">User</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">College</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} className="w-8 h-8 rounded-full" alt="" />
                      <div>
                        <p className="text-sm font-bold">{user.name}</p>
                        <p className="text-[10px] text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold uppercase">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{user.college || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${user.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.joinedAt?.toDate ? user.joinedAt.toDate().toLocaleDateString() : 'Just Now'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingUser(user); setUserForm({ name: user.name, email: user.email, role: user.role, college: user.college || '', status: user.status }); }} className="p-2 text-gray-400 hover:text-red-primary"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteUser(user.id, user.email)} className="p-2 text-gray-400 hover:text-red-primary transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {(showAddModal || editingUser) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setEditingUser(null); }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-8"
            >
              <h3 className="text-xl font-display font-bold mb-6">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none mt-1" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                  <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none mt-1" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Role</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm mt-1" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                      <option value="student">Student</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="evaluator">Evaluator</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm mt-1" value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => { setShowAddModal(false); setEditingUser(null); }} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
                <button onClick={editingUser ? handleUpdateUser : handleCreateUser} className="btn-primary flex-1 py-3 text-sm">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- EVENTS TAB ---
function EventsTab({ colleges }: { colleges: string[] }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    host: 'All',
    date: '',
    category: 'Hackathon',
    description: '',
    location: '',
    capacity: '',
    status: 'Upcoming'
  });

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'events'));
    return () => unsub();
  }, []);

  const handleCreateEvent = async () => {
    try {
      if (!newEvent.name || !newEvent.date) return;
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        slots: { filled: 0, total: parseInt(newEvent.capacity) || 100 },
        createdAt: serverTimestamp()
      });
      logAction('CREATE_EVENT', newEvent.name);
      setShowCreateModal(false);
      setNewEvent({ name: '', host: 'All', date: '', category: 'Hackathon', description: '', location: '', capacity: '', status: 'Upcoming' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'events');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    try {
      await updateDoc(doc(db, 'events', editingEvent.id), newEvent);
      logAction('UPDATE_EVENT', newEvent.name);
      setEditingEvent(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${editingEvent.id}`);
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      logAction('DELETE_EVENT', name);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">Event Management</h3>
        <button 
          onClick={() => { setEditingEvent(null); setShowCreateModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Calendar size={18} /> Create Event
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-20 text-center"><div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Event Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Host College</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Participants</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 font-bold text-sm">{event.name}</td>
                  <td className="px-6 py-4 text-sm">{event.host}</td>
                  <td className="px-6 py-4 text-sm">{event.date}</td>
                  <td className="px-6 py-4 font-mono text-sm">{event.slots?.filled || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${event.status === 'Live' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-primary'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => { setEditingEvent(event); setNewEvent({...event}); setShowCreateModal(true); }} className="p-2 text-gray-400 hover:text-red-primary"><Edit size={16} /></button>
                       <button onClick={() => handleDeleteEvent(event.id, event.name)} className="p-2 text-gray-400 hover:text-red-primary"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-primary text-white">
                <h3 className="text-xl font-display font-bold">Create New Event</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Event Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                      placeholder="e.g. Annual Tech Symposium"
                      value={newEvent.name}
                      onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Host Institution</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary"
                      value={newEvent.host}
                      onChange={e => setNewEvent({...newEvent, host: e.target.value})}
                    >
                      <option value="All">All Institutions</option>
                      {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Category</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary"
                      value={newEvent.category}
                      onChange={e => setNewEvent({...newEvent, category: e.target.value})}
                    >
                      {['Hackathon', 'Webinar', 'Workshop', 'Competition', 'Cultural'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Event Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                      value={newEvent.date}
                      onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Capacity</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                      placeholder="e.g. 500"
                      value={newEvent.capacity}
                      onChange={e => setNewEvent({...newEvent, capacity: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Target Audience</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary">
                      <option>All Students</option>
                      <option>Specific Branch</option>
                      <option>Specific Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Registration Fee</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                      placeholder="e.g. Free or ₹100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Location / Link</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                      placeholder="e.g. Main Auditorium or Zoom Link"
                      value={newEvent.location}
                      onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Description</label>
                    <textarea 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary h-32" 
                      placeholder="Describe the event..."
                      value={newEvent.description}
                      onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Cover Image</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-red-primary transition-all cursor-pointer bg-gray-50">
                      <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-300 mb-2" />
                      <p className="text-xs font-bold text-gray-500">Click to Upload Cover Image</p>
                      <p className="text-[10px] text-gray-400 mt-1">Recommended: 1200x600px</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Min Team Size</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" defaultValue={1} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Max Team Size</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" defaultValue={4} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary px-6">Cancel</button>
                <button onClick={editingEvent ? handleUpdateEvent : handleCreateEvent} className="btn-primary px-10">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- JOBS TAB ---
function JobsTab({ colleges }: { colleges: string[] }) {
  const [showPostModal, setShowPostModal] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    skills: '',
    isPaid: true,
    stipend: '',
    appLink: '',
    type: 'Full-time',
    location: 'Remote',
    targetSection: 'All',
    targetBranch: 'All',
    targetYear: 'All',
    targetPersona: 'All',
    targetInstitution: 'All',
    targetCoordinator: 'All'
  });

  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'jobs'));
    return () => unsub();
  }, []);

  const handlePostJob = async () => {
    try {
      if (!newJob.title || !newJob.company) return;
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        createdAt: serverTimestamp(),
        skills: newJob.skills.split(',').map(s => s.trim())
      });
      logAction('CREATE_JOB', `${newJob.title} @ ${newJob.company}`);
      setShowPostModal(false);
      setNewJob({ title: '', company: '', skills: '', isPaid: true, stipend: '', appLink: '', type: 'Full-time', location: 'Remote', targetSection: 'All', targetBranch: 'All', targetYear: 'All', targetPersona: 'All', targetInstitution: 'All', targetCoordinator: 'All' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'jobs');
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    try {
      await updateDoc(doc(db, 'jobs', editingJob.id), {
        ...newJob,
        skills: typeof newJob.skills === 'string' ? newJob.skills.split(',').map(s => s.trim()) : newJob.skills
      });
      logAction('UPDATE_JOB', `${newJob.title} @ ${newJob.company}`);
      setEditingJob(null);
      setShowPostModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jobs/${editingJob.id}`);
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!window.confirm('Delete this job listing?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', id));
      logAction('DELETE_JOB', title);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">Job Board Management</h3>
        <button 
          onClick={() => { setEditingJob(null); setShowPostModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Briefcase size={18} /> Post Job
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="lg:col-span-2 py-20 text-center"><div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-display font-bold text-2xl overflow-hidden shadow-sm border border-gray-100/50">
                    {job.logo ? <img src={job.logo} className="w-full h-full object-contain" alt="" /> : job.company.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold truncate max-w-[200px]">{job.title}</h4>
                    <p className="text-xs text-red-primary font-bold">{job.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                  <p className="text-sm font-bold text-green-600">Active</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="bg-gray-50 px-3 py-1.5 rounded text-[10px] font-bold uppercase text-gray-500">{job.type}</div>
                <div className="bg-gray-50 px-3 py-1.5 rounded text-[10px] font-bold uppercase text-gray-500">{job.location}</div>
                <div className="bg-gray-50 px-3 py-1.5 rounded text-[10px] font-bold uppercase text-gray-500">{job.stipend}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1 py-2 text-xs">Applications</button>
                <button 
                  onClick={() => { setEditingJob(job); setNewJob({...job, skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}); setShowPostModal(true); }}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Edit
                </button>
                <button onClick={() => handleDeleteJob(job.id, job.title)} className="p-2 text-gray-400 hover:text-red-primary transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Job Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPostModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-primary text-white">
                <h3 className="text-xl font-display font-bold">Post New Opportunity</h3>
                <button onClick={() => setShowPostModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Job Title</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                      placeholder="e.g. Software Engineer Intern"
                      value={newJob.title}
                      onChange={e => setNewJob({...newJob, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Company Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                      placeholder="e.g. Google"
                      value={newJob.company}
                      onChange={e => setNewJob({...newJob, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Job Type</label>
                    <div className="flex items-center gap-4 h-11">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newJob.isPaid} 
                          onChange={e => setNewJob({...newJob, isPaid: e.target.checked})}
                          className="w-4 h-4 accent-red-primary"
                        />
                        <span className="text-sm font-bold">Paid Position</span>
                      </label>
                    </div>
                  </div>
                  {newJob.isPaid && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Stipend / Salary</label>
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                        placeholder="e.g. ₹25,000 / month"
                        value={newJob.stipend}
                        onChange={e => setNewJob({...newJob, stipend: e.target.value})}
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Required Skills (Comma separated)</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
                      placeholder="React, TypeScript, Node.js..."
                      value={newJob.skills}
                      onChange={e => setNewJob({...newJob, skills: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Official Application Link</label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="url" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-red-primary" 
                        placeholder="https://company.com/careers/job-123"
                        value={newJob.appLink}
                        onChange={e => setNewJob({...newJob, appLink: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase text-red-primary tracking-widest">Targeting Filters</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FilterSelect label="Section" value={newJob.targetSection} onChange={v => setNewJob({...newJob, targetSection: v})} options={['All', 'A', 'B', 'C']} />
                    <FilterSelect label="Branch" value={newJob.targetBranch} onChange={v => setNewJob({...newJob, targetBranch: v})} options={['All', 'CSE', 'ECE', 'ME', 'CE']} />
                    <FilterSelect label="Year" value={newJob.targetYear} onChange={v => setNewJob({...newJob, targetYear: v})} options={['All', '1st', '2nd', '3rd', '4th']} />
                    <FilterSelect label="Persona" value={newJob.targetPersona} onChange={v => setNewJob({...newJob, targetPersona: v})} options={['All', 'Student', 'Volunteer', 'Coordinator']} />
                    <FilterSelect label="Institution" value={newJob.targetInstitution} onChange={v => setNewJob({...newJob, targetInstitution: v})} options={['All', ...colleges]} />
                    <FilterSelect label="Coordinator" value={newJob.targetCoordinator} onChange={v => setNewJob({...newJob, targetCoordinator: v})} options={['All', 'Dr. Ramesh', 'Prof. Sunita']} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setShowPostModal(false); setEditingJob(null); }} className="btn-secondary px-6">Cancel</button>
                <button onClick={editingJob ? handleUpdateJob : handlePostJob} className="btn-primary px-10">
                  {editingJob ? 'Update Job' : 'Post Job'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{label}</label>
      <select 
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-red-primary"
      >
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

// --- ANNOUNCEMENTS TAB ---
function AnnouncementsTab() {
  const [announcement, setAnnouncement] = useState({
    subject: '',
    message: '',
    priority: 'Normal',
    audience: 'All Users',
    channels: 'In-App Only'
  });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!announcement.subject || !announcement.message) {
      alert('Subject and Message are required.');
      return;
    }
    setSending(true);
    try {
      // 1. Save to global announcements
      await addDoc(collection(db, 'announcements'), {
        ...announcement,
        createdAt: serverTimestamp(),
        sender: 'Super Admin',
        senderId: auth.currentUser?.uid
      });

      // 2. In a real app, a cloud function would distribute notifications.
      // For this demo, we'll just show success.
      
      alert('Announcement sent successfully!');
      setAnnouncement({ subject: '', message: '', priority: 'Normal', audience: 'All Users', channels: 'In-App Only' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card p-8">
        <h3 className="text-2xl font-display font-bold mb-6">Create Platform Announcement</h3>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Subject</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
              placeholder="Enter announcement subject..." 
              value={announcement.subject}
              onChange={e => setAnnouncement({...announcement, subject: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Message</label>
            <textarea 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary h-32 resize-none" 
              placeholder="Enter announcement message..." 
              value={announcement.message}
              onChange={e => setAnnouncement({...announcement, message: e.target.value})}
            />
            <div className="flex justify-end mt-1 text-[10px] text-gray-400">{announcement.message.length} / 500 characters</div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Priority</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary"
                value={announcement.priority}
                onChange={e => setAnnouncement({...announcement, priority: e.target.value})}
              >
                <option>Normal</option>
                <option>Important</option>
                <option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Target Audience</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary"
                value={announcement.audience}
                onChange={e => setAnnouncement({...announcement, audience: e.target.value})}
              >
                <option>All Users</option>
                <option>Students Only</option>
                <option>Coordinators Only</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Send Via</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary"
                value={announcement.channels}
                onChange={e => setAnnouncement({...announcement, channels: e.target.value})}
              >
                <option>In-App Only</option>
                <option>Email Only</option>
                <option>Both</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button className="btn-secondary" onClick={() => setAnnouncement({ subject: '', message: '', priority: 'Normal', audience: 'All Users', channels: 'In-App Only' })}>Discard</button>
            <button 
              className="btn-primary px-10 disabled:opacity-50"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- APPROVALS TAB ---
function ApprovalsTab() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      setPendingUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users (pending)'));
    return () => unsub();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { status: 'active' });
      logAction('APPROVE_USER', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Reject this registration? Document will be deleted.')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      logAction('REJECT_USER', id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
          <CheckSquare size={20} className="text-red-primary" />
          Pending Approvals ({pendingUsers.length})
        </h3>
        <div className="space-y-4">
          {loading ? (
            <div className="p-10 text-center"><div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : pendingUsers.length === 0 ? (
            <div className="card p-10 text-center text-gray-400 font-bold">No pending registrations found.</div>
          ) : (
            pendingUsers.map(user => (
              <div key={user.id} className="card p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-red-primary font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold">{user.name || 'Anonymous User'}</h4>
                    <p className="text-xs text-gray-500">{user.role || 'New User'} • {user.email}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{user.institutionName || user.college || 'No Institutional Affiliation'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="btn-secondary py-2 px-4 text-xs">View Docs</button>
                  <button onClick={() => handleApprove(user.id)} className="btn-primary py-2 px-6 text-xs">Approve</button>
                  <button onClick={() => handleReject(user.id)} className="bg-gray-100 text-gray-600 font-bold py-2 px-4 rounded-lg text-xs hover:bg-gray-200">Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// --- ANALYTICS TAB ---
function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">Platform Analytics</h3>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold">Last 30 Days</button>
          <button className="btn-primary py-1.5 px-4 text-xs">Download Report</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h4 className="text-sm font-bold uppercase text-gray-400 mb-6 tracking-widest">Students by College</h4>
          <div className="h-80">
            <Bar 
              data={{
                labels: UniGuildData.colleges.slice(0, 8),
                datasets: [{
                  label: 'Students',
                  data: [1200, 1100, 950, 800, 750, 600, 550, 400],
                  backgroundColor: '#f40000',
                  borderRadius: 4,
                }]
              }} 
              options={{ indexAxis: 'y', maintainAspectRatio: false }} 
            />
          </div>
        </div>
        <div className="card p-6">
          <h4 className="text-sm font-bold uppercase text-gray-400 mb-6 tracking-widest">Event Participation Rate</h4>
          <div className="h-80">
            <Line 
              data={{
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                  label: 'Participation %',
                  data: [65, 72, 85, 82],
                  borderColor: '#f40000',
                  tension: 0.4,
                  fill: true,
                  backgroundColor: 'rgba(244, 0, 0, 0.05)'
                }]
              }} 
              options={{ maintainAspectRatio: false }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PROFILE TAB ---
function ProfileTab({ admin, setAdmin, onSave }: { admin: any, setAdmin: (a: any) => void, onSave: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...admin });

  useEffect(() => {
    setEditedData({ ...admin });
  }, [admin]);

  if (!admin) return null;

  const handleSave = () => {
    setAdmin(editedData);
    setIsEditing(false);
    onSave();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card p-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="relative group">
          <img src={admin.avatar} className="w-32 h-32 rounded-full border-4 border-red-primary p-1" alt="" />
          <button className="absolute bottom-0 right-0 bg-red-primary text-white p-2 rounded-full shadow-lg transition-all"><Camera size={14} /></button>
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
              <h3 className="text-3xl font-display font-bold">{admin.name}</h3>
            )}
            <span className="bg-red-50 text-red-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase self-center md:self-auto">Super Admin</span>
          </div>
          <p className="text-gray-500 font-medium mb-6">Platform Administrator • UniGuild Central</p>
        </div>
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="btn-primary py-2 px-6 text-sm flex items-center gap-2 shadow-lg shadow-red-primary/30">
                <CheckCircle2 size={16} /> Save Changes
              </button>
              <button onClick={() => { setIsEditing(false); setEditedData(admin); }} className="btn-secondary py-2 px-6 text-sm">Cancel</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn-primary py-2 px-6 text-sm flex items-center gap-2">
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h4 className="text-xl font-display font-bold mb-6 border-b border-gray-50 pb-2">Account Information</h4>
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
              <p className="text-sm font-bold">{admin.email}</p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Admin Level</label>
            <p className="text-sm font-bold">Level 10 (Full Access)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SETTINGS TAB ---
function SettingsTab() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    selfRegistration: true,
    sessionTimeout: 30,
    maxFileSize: 5
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'platform'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'config', 'platform'), settings);
      logAction('UPDATE_SETTINGS', 'General Configuration');
      alert('Settings saved successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'config/platform');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card divide-y divide-gray-100">
        <div className="p-6">
          <h3 className="text-xl font-display font-bold mb-6">Platform Settings</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">Maintenance Mode</p>
                <p className="text-xs text-gray-500">Take the platform offline for updates</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={`w-12 h-6 rounded-full relative transition-all ${settings.maintenanceMode ? 'bg-red-primary' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">Self-Registration</p>
                <p className="text-xs text-gray-500">Allow new users to register without invite</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, selfRegistration: !settings.selfRegistration})}
                className={`w-12 h-6 rounded-full relative transition-all ${settings.selfRegistration ? 'bg-red-primary' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.selfRegistration ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-display font-bold mb-6">Security & Policy</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Session Timeout (mins)</label>
              <input 
                type="number" 
                value={settings.sessionTimeout}
                onChange={e => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Max File Size (MB)</label>
              <input 
                type="number" 
                value={settings.maxFileSize}
                onChange={e => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-red-primary" 
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary py-3 px-10">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// --- AUDIT TAB ---
function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs'));
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">System Audit Logs</h3>
        <button className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"><Download size={16} /> Export Logs</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-20 text-center"><div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <table className="w-full text-left font-mono text-[10px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold uppercase text-gray-400">Timestamp</th>
                <th className="px-6 py-4 font-bold uppercase text-gray-400">User</th>
                <th className="px-6 py-4 font-bold uppercase text-gray-400">Action</th>
                <th className="px-6 py-4 font-bold uppercase text-gray-400">Target</th>
                <th className="px-6 py-4 font-bold uppercase text-gray-400">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just Now'}</td>
                  <td className="px-6 py-4 font-bold">{log.userName || 'System'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      log.action?.includes('DELETE') ? 'text-red-600 bg-red-50' : 
                      log.action?.includes('CREATE') ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">{log.target}</td>
                  <td className="px-6 py-4 text-gray-400">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 uppercase font-bold">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
