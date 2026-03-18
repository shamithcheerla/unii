
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, X, Check, Trash2, Clock, AlertCircle } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, writeBatch, getDocs 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  subItems?: { id: string; label: string }[];
}

interface DashboardShellProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  roleName: string;
  userName: string;
  userAvatar?: string;
}

interface Notification {
  id: string;
  userId?: string;
  message: string;
  subject?: string; // For announcements
  type: 'event' | 'job' | 'certificate' | 'task' | 'announcement';
  read: boolean;
  createdAt: any;
  audience?: string;
  priority?: string;
}

export default function DashboardShell({
  children,
  sidebarItems,
  activeTab,
  onTabChange,
  roleName,
  userName,
  userAvatar = "https://picsum.photos/seed/user/100/100"
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Personal Notifications
    const qNotifs = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // 2. Global Announcements
    const qAnn = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );

    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      const personalNotifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(prev => {
        const others = prev.filter(n => n.type === 'announcement');
        return [...personalNotifs, ...others].sort((a, b) => {
          const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000;
          const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000;
          return timeB - timeA;
        });
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    const unsubAnn = onSnapshot(qAnn, (snapshot) => {
      const announcementNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          message: `${data.subject}: ${data.message}`,
          type: 'announcement',
          read: false, // We'd need a way to track read status per user for announcements
          createdAt: data.createdAt,
          audience: data.audience,
          priority: data.priority
        } as Notification;
      }).filter(n => {
        if (n.audience === 'All Users') return true;
        if (n.audience === 'Students Only' && roleName.toLowerCase().includes('student')) return true;
        if (n.audience === 'Coordinators Only' && roleName.toLowerCase().includes('coordinator')) return true;
        return false;
      });

      setNotifications(prev => {
        const personal = prev.filter(n => n.type !== 'announcement');
        return [...personal, ...announcementNotifs].sort((a, b) => {
          const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000;
          const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000;
          return timeB - timeA;
        });
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

    return () => {
      unsubNotifs();
      unsubAnn();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.read) {
          const ref = doc(db, 'notifications', n.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  const clearAll = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notifications');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const ref = doc(db, 'notifications', id);
      await updateDoc(ref, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[95]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Notifications Overlay */}
      {isNotificationsOpen && (
        <div 
          className="fixed inset-0 z-[105]"
          onClick={() => setIsNotificationsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-[100] transition-all duration-300 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-red-primary rounded-full shrink-0" />
            <h1 className={`text-2xl font-display font-bold text-gray-900 tracking-tight transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100 lg:w-auto'}`}>
              UniGuild
            </h1>
          </div>
          <button 
            onClick={() => isSidebarOpen ? setIsSidebarOpen(false) : setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-primary transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {sidebarItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <div
                onClick={() => {
                  onTabChange(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer transition-all group
                  ${activeTab === item.id || item.subItems?.some(s => s.id === activeTab)
                    ? 'bg-red-primary text-white shadow-lg shadow-red-primary/20' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-red-primary'}
                  ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <span className="w-5 flex justify-center shrink-0">{item.icon}</span>
                <span className={`font-bold text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100 lg:w-auto'}`}>
                  {item.label}
                </span>
              </div>
              
              {!isCollapsed && item.subItems && (activeTab === item.id || item.subItems.some(s => s.id === activeTab)) && (
                <div className="ml-9 space-y-1">
                  {item.subItems.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        onTabChange(sub.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`
                        py-2 px-4 rounded-lg cursor-pointer text-xs font-bold transition-all
                        ${activeTab === sub.id ? 'text-red-primary bg-red-50' : 'text-gray-400 hover:text-red-primary hover:bg-gray-50'}
                      `}
                    >
                      {sub.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <button 
            onClick={() => navigate('/login')}
            className={`
              flex items-center gap-3 py-3 px-4 text-gray-500 font-bold rounded-xl hover:bg-red-50 hover:text-red-primary transition-all w-full
              ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
            `}
          >
            <X size={18} className="shrink-0" />
            <span className={`font-bold text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100 lg:w-auto'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-900 p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-gray-50 rounded-xl px-4 py-2 gap-2 border border-gray-100 focus-within:border-red-primary focus-within:bg-white transition-all">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative z-[110]">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Bell size={22} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110]"
                  >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                      <h3 className="font-display font-bold text-gray-900">Notifications</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-red-primary uppercase hover:underline"
                        >
                          Mark all read
                        </button>
                        <button 
                          onClick={clearAll}
                          className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-primary"
                        >
                          Clear all
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`p-4 hover:bg-gray-50 transition-all cursor-pointer relative group ${!notif.read ? 'bg-red-50/30' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  notif.type === 'event' ? 'bg-blue-50 text-blue-600' :
                                  notif.type === 'job' ? 'bg-green-50 text-green-600' :
                                  notif.type === 'certificate' ? 'bg-purple-50 text-purple-600' :
                                  notif.type === 'announcement' ? (notif.priority === 'Urgent' ? 'bg-red-50 text-red-primary' : 'bg-red-50 text-red-primary') :
                                  'bg-orange-50 text-orange-600'
                                }`}>
                                  {notif.type === 'event' ? <Clock size={14} /> :
                                   notif.type === 'job' ? <Search size={14} /> :
                                   notif.type === 'certificate' ? <Check size={14} /> :
                                   notif.type === 'announcement' ? <Bell size={14} /> :
                                   <AlertCircle size={14} />}
                                </div>
                                <div className="flex-1">
                                  <p className={`text-xs leading-relaxed ${!notif.read ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                    {notif.message}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    {notif.createdAt?.seconds 
                                      ? new Date(notif.createdAt.seconds * 1000).toLocaleString() 
                                      : new Date(notif.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                {!notif.read && (
                                  <div className="w-2 h-2 bg-red-primary rounded-full mt-2 shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center">
                          <Bell size={40} className="mx-auto text-gray-200 mb-4" />
                          <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div 
              className="flex items-center gap-3 pl-6 border-l border-gray-200 cursor-pointer group"
              onClick={() => onTabChange('profile')}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-red-primary transition-colors">{userName}</p>
                <p className="text-[10px] font-medium text-red-primary uppercase tracking-wider">{roleName}</p>
              </div>
              <img 
                src={userAvatar} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border-2 border-red-primary p-0.5 group-hover:scale-110 transition-transform"
              />
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
