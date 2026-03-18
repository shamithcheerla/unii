
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, FileSpreadsheet, MessageSquare, 
  Calendar, User, Clock, CheckCircle2, AlertCircle, 
  ExternalLink, Github, Youtube, Star, Send, Save, Flag, ChevronLeft,
  Filter, Search
} from 'lucide-react';
import { UniGuildData } from '../data';
import DashboardShell from '../components/DashboardShell';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  orderBy, addDoc, serverTimestamp, Timestamp 
} from 'firebase/firestore';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { id: 'queue', label: 'Judging Queue', icon: <ClipboardList size={20} /> },
  { id: 'broadcasts', label: 'Broadcasts', icon: <Send size={20} /> },
  { id: 'schedule', label: 'Schedule', icon: <Calendar size={20} /> },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
];

export default function EvaluatorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [evaluator, setEvaluator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for Demo Mode
    const isDemo = sessionStorage.getItem('uniguild_demo_mode') === 'true';
    const demoRole = sessionStorage.getItem('uniguild_demo_role');

    if (isDemo && demoRole === 'evaluator') {
      setEvaluator({
        uid: 'demo-evaluator',
        name: 'Prof. Vikram Singh',
        email: 'vikram.singh@iitd.ac.in',
        role: 'evaluator',
        specialization: 'AI & ML',
        organization: 'IIT Delhi',
        avatar: 'https://i.pravatar.cc/300?u=vikram'
      });
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setEvaluator({ uid: docSnap.id, ...docSnap.data() });
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setLoading(false);
        });
        return () => profileUnsub();
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
    if (selectedProject) return <ScoreSheet project={selectedProject} onBack={() => setSelectedProject(null)} />;

    switch (activeTab) {
      case 'overview': return <OverviewTab onSelectProject={setSelectedProject} />;
      case 'queue': return <QueueTab onSelectProject={setSelectedProject} />;
      case 'broadcasts': return <BroadcastsTab />;
      case 'schedule': return <ScheduleTab />;
      case 'profile': return <ProfileTab evaluator={evaluator} setEvaluator={setEvaluator} onSave={handleSaveProfile} />;
      default: return <OverviewTab onSelectProject={setSelectedProject} />;
    }
  };

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleName="Evaluator"
      userName={evaluator?.name || "Evaluator"}
      userAvatar={evaluator?.avatar}
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
          key={activeTab + (selectedProject ? '-scoring' : '')}
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
function OverviewTab({ onSelectProject }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-primary to-red-dark rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-display font-bold tracking-tight mb-2">Welcome back, Prof. Vikram!</h2>
        <p className="opacity-90">You have 8 pending reviews for the Code Rush Hackathon.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Reviewed" value="23" icon={<CheckCircle2 size={20} />} />
        <StatCard label="Pending" value="08" icon={<Clock size={20} />} isUrgent />
        <StatCard label="Avg Score" value="74.5" icon={<FileSpreadsheet size={20} />} />
        <StatCard label="Feedback Sent" value="18" icon={<MessageSquare size={20} />} />
        <StatCard label="Hours Logged" value="14" icon={<Clock size={20} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-xl font-display font-bold mb-6">Active Assignments</h3>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl hover:border-red-primary transition-all cursor-pointer" onClick={() => onSelectProject({ name: i === 1 ? 'CodeCrushers' : 'AIWizards' })}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-sm">{i === 1 ? 'CodeCrushers' : 'AIWizards'}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Code Rush Hackathon • Stage 2</p>
                  </div>
                  <span className="text-[10px] bg-red-50 text-red-primary px-2 py-0.5 rounded font-bold uppercase">2 days left</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-primary w-[65%]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-display font-bold mb-6">Notification Center</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-primary flex-shrink-0">
                  <AlertCircle size={14} />
                </div>
                <div>
                  <p className="font-bold">New submission assigned</p>
                  <p className="text-gray-500">Team 'FinTech Pros' submitted their prototype.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isUrgent }: any) {
  return (
    <div className={`card p-4 text-center ${isUrgent ? 'border-red-primary bg-red-50/30' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3 ${isUrgent ? 'bg-red-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
        {icon}
      </div>
      <div className="text-2xl font-mono font-bold">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase font-bold mt-1">{label}</div>
    </div>
  );
}

// --- QUEUE TAB ---
function QueueTab({ onSelectProject }: any) {
  const [activeSubTab, setActiveSubTab] = useState('pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 border-b border-gray-200 flex-1">
          {['Pending', 'In Progress', 'Completed'].map(tab => (
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
        <div className="flex gap-2 ml-6">
          <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-primary"><Filter size={18} /></button>
          <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-primary"><Search size={18} /></button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['CodeCrushers', 'AIWizards', 'FinTech Pros', 'HealthBots', 'EcoWarriors', 'EduTech'].map((team, i) => (
          <div key={team} className="card p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{team}</h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Code Rush Hackathon</p>
              </div>
              <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold uppercase">Stage 2</span>
            </div>
            <div className="flex gap-2 mb-6">
              <span className="text-[10px] border border-gray-200 px-2 py-0.5 rounded font-medium">HealthTech</span>
              <span className="text-[10px] border border-gray-200 px-2 py-0.5 rounded font-medium">React/Node</span>
            </div>
            <div className="mt-auto">
              <div className="flex justify-between text-[10px] text-gray-400 mb-4">
                <span>Submitted: 12-03-2026</span>
                <span>ID: SUB-04{i}</span>
              </div>
              <button 
                onClick={() => onSelectProject({ name: team })}
                className="btn-primary w-full py-2 text-xs"
              >
                Start Evaluation
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SCORE SHEET PANEL ---
function ScoreSheet({ project, onBack }: any) {
  const [scores, setScores] = useState({ innovation: 22, code: 18, presentation: 15, feasibility: 19 });
  const total = Object.values(scores).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-red-primary font-bold text-sm hover:underline mb-4">
        <ChevronLeft size={18} /> Back to Queue
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Submission Details */}
        <div className="flex-1 space-y-6">
          <div className="card p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-red-primary">{project.name}</h2>
                <p className="text-sm text-gray-500">Code Rush Hackathon • Stage 2 • Submission ID: SUB-045</p>
              </div>
              <div className="text-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Evaluation Timer</p>
                <p className="text-xl font-mono font-bold">12:45</p>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Project Overview</h4>
                <p className="text-sm leading-relaxed text-gray-700">
                  A decentralized healthcare platform that allows patients to securely store and share their medical records with doctors using blockchain technology.
                </p>
                <div className="flex gap-2 mt-4">
                  {['React', 'Solidity', 'IPFS', 'Node.js'].map(t => <span key={t} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold">{t}</span>)}
                </div>
              </section>

              <div className="grid grid-cols-3 gap-4">
                <button className="btn-secondary py-2 text-xs flex items-center justify-center gap-2"><ExternalLink size={14} /> Demo Link</button>
                <button className="btn-secondary py-2 text-xs flex items-center justify-center gap-2"><Github size={14} /> GitHub</button>
                <button className="btn-secondary py-2 text-xs flex items-center justify-center gap-2"><Youtube size={14} /> Video Demo</button>
              </div>

              <section>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Presentation PDF</h4>
                <div className="aspect-video bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                  <iframe src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" className="w-full h-full" />
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Right: Scoring Rubrics */}
        <div className="lg:w-96 space-y-6">
          <div className="card p-6 sticky top-24">
            <div className="text-center mb-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Score</p>
              <div className={`text-6xl font-mono font-bold ${(total as number) >= 75 ? 'text-green-600' : (total as number) >= 50 ? 'text-amber-500' : 'text-red-primary'}`}>
                {total} <span className="text-lg text-gray-300">/ 100</span>
              </div>
              <p className="text-[10px] font-bold text-red-primary mt-2 uppercase tracking-widest">Rank Estimate: 3 / 12</p>
            </div>

            <div className="space-y-6">
              {[
                { id: 'innovation', label: 'Innovation', max: 30 },
                { id: 'code', label: 'Code Quality', max: 25 },
                { id: 'presentation', label: 'Presentation', max: 20 },
                { id: 'feasibility', label: 'Feasibility', max: 25 }
              ].map(c => (
                <div key={c.id}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>{c.label}</span>
                    <span className="text-red-primary">{(scores as any)[c.id]} / {c.max}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={c.max} 
                    value={(scores as any)[c.id]} 
                    onChange={(e) => setScores({ ...scores, [c.id]: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-red-primary"
                  />
                  <textarea className="w-full bg-gray-50 border border-gray-100 rounded mt-2 p-2 text-[10px] outline-none focus:border-red-primary h-12 resize-none" placeholder={`Notes for ${c.label}...`} />
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Overall Feedback</label>
                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs outline-none focus:border-red-primary h-24 resize-none" placeholder="Strengths, improvements..." />
              </div>
              <div className="flex flex-wrap gap-2">
                {['Creative', 'Well-researched', 'Strong team', 'Needs polish', 'Technically sound'].map(tag => (
                  <button key={tag} className="text-[10px] border border-gray-200 px-2 py-1 rounded hover:border-red-primary hover:text-red-primary font-bold">{tag}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button className="btn-secondary py-2 text-xs flex items-center justify-center gap-2"><Save size={14} /> Save Draft</button>
              <button className="btn-primary py-2 text-xs flex items-center justify-center gap-2" onClick={() => { alert('Evaluation Submitted!'); onBack(); }}><Send size={14} /> Submit</button>
            </div>
            <button className="w-full mt-3 text-[10px] font-bold text-gray-400 hover:text-red-primary flex items-center justify-center gap-1"><Flag size={12} /> Flag for Re-review</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- BROADCASTS TAB ---
function BroadcastsTab() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  React.useEffect(() => {
    // Fetch announcements targeted at Evaluators or All
    const q = query(
      collection(db, 'broadcasts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((a: any) => a.audience === 'Evaluators' || a.audience === 'All');
      setAnnouncements(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'broadcasts');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-bold">Broadcasts</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded">
          {announcements.length} Messages
        </span>
      </div>
      
      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.id} className="card p-6 border-l-4 border-red-primary">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg">{announcement.subject || announcement.title}</h4>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">
                    {announcement.targetEvent || announcement.event || 'General Announcement'} • {announcement.createdAt instanceof Timestamp ? announcement.createdAt.toDate().toLocaleString() : new Date(announcement.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="bg-red-50 text-red-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                  {announcement.audience}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {announcement.message}
              </p>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Send size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-400">No broadcasts yet</h3>
            <p className="text-sm text-gray-400">You'll see messages from the Head Coordinator here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SCHEDULE TAB ---
function ScheduleTab() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 card p-6">
        <h3 className="text-xl font-display font-bold mb-6">Evaluation Schedule</h3>
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-[10px] font-bold text-gray-400 uppercase py-2">{day}</div>
          ))}
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1;
            const isDeadline = [15, 20, 25].includes(day);
            return (
              <div key={i} className={`aspect-square flex flex-col items-center justify-center border border-gray-50 rounded-lg relative ${isDeadline ? 'bg-red-50' : ''}`}>
                <span className="text-xs font-medium">{day}</span>
                {isDeadline && <div className="w-1 h-1 bg-red-primary rounded-full mt-1" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-xl font-display font-bold mb-6">Upcoming Deadlines</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 border-l-2 border-red-primary pl-4 py-1">
              <div>
                <p className="text-xs font-bold">Code Rush Stage 2</p>
                <p className="text-[10px] text-gray-500">15-03-2026 • 12 Projects</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- PROFILE TAB ---
function ProfileTab({ evaluator, setEvaluator, onSave }: { evaluator: any, setEvaluator: any, onSave: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...evaluator });

  useEffect(() => {
    setEditData({ ...evaluator });
  }, [evaluator]);

  if (!evaluator) return null;

  const handleSave = () => {
    setEvaluator(editData);
    setIsEditing(false);
    onSave();
  };

  return (
    <div className="max-w-4xl mx-auto card p-8">
      <div className="flex flex-col md:flex-row gap-8 items-center mb-10">
        <div className="relative w-32 h-32 group">
          <img src={isEditing ? editData.avatar : evaluator.avatar} className="w-full h-full rounded-full border-4 border-red-primary p-1 object-cover" alt="" />
          {isEditing && (
            <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Save size={24} />
            </button>
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input 
                type="text" 
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-2xl font-display font-bold outline-none focus:border-red-primary"
              />
              <input 
                type="text" 
                value={editData.organization}
                onChange={(e) => setEditData({ ...editData, organization: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-500 font-medium outline-none focus:border-red-primary"
              />
              <div className="flex gap-2 justify-center md:justify-start">
                <button onClick={handleSave} className="btn-primary py-1.5 px-6 text-xs">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary py-1.5 px-6 text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-display font-bold">{evaluator.name}</h3>
              <p className="text-gray-500 font-medium">{evaluator.role} • {evaluator.organization}</p>
              <button onClick={() => setIsEditing(true)} className="mt-2 text-red-primary text-xs font-bold hover:underline">Edit Profile</button>
              <div className="flex gap-2 mt-4">
                <span className="bg-red-50 text-red-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">AI & ML</span>
                <span className="bg-red-50 text-red-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">Blockchain</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-xl font-display font-bold border-b border-gray-100 pb-2">Experience</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Institution</label>
              <p className="text-sm font-bold">{evaluator.organization}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Expertise</label>
              <p className="text-sm font-bold">{evaluator.specialization}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">LinkedIn</label>
              <p className="text-sm font-bold text-red-primary hover:underline cursor-pointer">linkedin.com/in/vikram-singh</p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="text-xl font-display font-bold border-b border-gray-100 pb-2">Judging History</h4>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-500">Smart India Hackathon</span>
                <span className="font-bold">2024</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
