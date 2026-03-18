
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Lock, School, 
  ArrowRight, ArrowLeft, CheckCircle2, 
  Shield, Zap, Globe, Star, Upload, FileText, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function RegistrationPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    role: 'student',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    college: 'Sasi Institute of Technology',
    institutionName: '', // For institution role
    department: '',
    year: '1st Year',
    expertise: '', // For evaluator
    designation: '', // For head coordinator
    password: '',
    confirmPassword: '',
    resume: null as File | null
  });

  const nextStep = () => {
    if (step === 3 && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);
  const goToStep = (s: number) => setStep(s);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] });
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Save to Firestore
      // Note: In a real app, we'd upload the file to Storage first and get the URL.
      // For this demo, we'll use a placeholder URL.
      const resumeUrl = formData.resume ? `https://example.com/resumes/${user.uid}.pdf` : '';

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.role === 'institution' ? formData.institutionName : `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || '',
        college: formData.role === 'institution' ? formData.institutionName : formData.college,
        department: formData.department || '',
        year: formData.year || '',
        expertise: formData.expertise || '',
        designation: formData.designation || '',
        resumeUrl: resumeUrl,
        projects: [],
        workExperience: [],
        skills: [],
        createdAt: new Date().toISOString(),
        status: 'pending' // Most roles need approval
      });

      const dashboardMap: Record<string, string> = {
        student: '/dashboard/student',
        volunteer: '/dashboard/volunteer',
        coordinator: '/dashboard/coordinator',
        head_coordinator: '/dashboard/coordinator',
        evaluator: '/dashboard/evaluator',
        institution: '/dashboard/institution',
        admin: '/dashboard/admin'
      };

      navigate(dashboardMap[formData.role] || '/dashboard/student');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'New User',
          email: user.email,
          role: 'student',
          college: 'Sasi Institute of Technology',
          department: '',
          year: '1st Year',
          resumeUrl: '',
          projects: [],
          workExperience: [],
          skills: [],
          createdAt: new Date().toISOString()
        });
      }

      navigate('/dashboard/student');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding & Visual */}
      <div className="hidden lg:flex bg-black relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-20">
            <div className="w-10 h-10 bg-red-primary rounded-xl flex items-center justify-center text-white font-display font-bold text-2xl">U</div>
            <span className="font-display font-bold text-2xl tracking-tight">UniGuild</span>
          </Link>
          <h1 className="text-8xl font-display font-bold leading-[0.85] mb-8">
            Start Your <br />
            <span className="text-red-primary italic">Journey.</span>
          </h1>
          <p className="text-xl opacity-60 max-w-md">
            Join the most powerful university ecosystem. Connect with peers, manage events, and grow your career.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          {[
            { icon: <Zap size={18} />, text: 'Access to 100+ Campus Events' },
            { icon: <Shield size={18} />, text: 'Verified Internship Sentinel' },
            { icon: <Globe size={18} />, text: 'Global Networking Opportunities' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-red-primary/20 flex items-center justify-center text-red-primary">
                {item.icon}
              </div>
              <span className="text-sm font-bold opacity-80">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Decorative Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* Right: Registration Form */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Progress Bar */}
          <div className="flex gap-2 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-red-primary' : 'bg-gray-100'}`} />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-primary text-sm font-medium">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2 text-red-primary">Select Your Role</h2>
                  <p className="text-gray-500">How would you like to join the UniGuild ecosystem?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'student', label: 'Student', icon: <User size={20} /> },
                    { icon: <Star size={20} />, id: 'volunteer', label: 'Volunteer' },
                    { icon: <Zap size={20} />, id: 'coordinator', label: 'Coordinator' },
                    { icon: <Shield size={20} />, id: 'head_coordinator', label: 'Head Coordinator' },
                    { icon: <Globe size={20} />, id: 'evaluator', label: 'Evaluator' },
                    { icon: <School size={20} />, id: 'institution', label: 'Institution' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        setFormData({ ...formData, role: role.id });
                        nextStep();
                      }}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all hover:border-red-primary hover:bg-red-50/50 ${
                        formData.role === role.id ? 'border-red-primary bg-red-50' : 'border-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        formData.role === role.id ? 'bg-red-primary text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {role.icon}
                      </div>
                      <span className="text-xs font-bold">{role.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2">Personal Details</h2>
                  <p className="text-gray-500">Let's start with your basic information.</p>
                </div>
                <div className="space-y-4">
                  {formData.role === 'institution' ? (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Institution Name</label>
                      <input 
                        type="text" 
                        value={formData.institutionName}
                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                        placeholder="BITS Pilani" 
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">First Name</label>
                        <input 
                          type="text" 
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                          placeholder="John" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Last Name</label>
                        <input 
                          type="text" 
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                          placeholder="Doe" 
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                        placeholder="name@university.edu" 
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={prevStep} className="flex-1 py-4 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] btn-primary py-4 text-lg flex items-center justify-center gap-3">
                    Next Step <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2">
                    {formData.role === 'evaluator' ? 'Professional Info' : formData.role === 'institution' ? 'Organization Info' : 'Academic Info'}
                  </h2>
                  <p className="text-gray-500">Provide details related to your {formData.role}.</p>
                </div>
                <div className="space-y-4">
                  {(formData.role === 'student' || formData.role === 'volunteer' || formData.role === 'coordinator' || formData.role === 'head_coordinator') && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Select College</label>
                        <div className="relative">
                          <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <select 
                            value={formData.college}
                            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all appearance-none"
                          >
                            <option>Sasi Institute of Technology</option>
                            <option>BITS Pilani</option>
                            <option>IIT Madras</option>
                            <option>SRM University</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Department</label>
                          <input 
                            type="text" 
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                            placeholder="CSE" 
                          />
                        </div>
                        {formData.role === 'student' ? (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Year of Study</label>
                            <select 
                              value={formData.year}
                              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all"
                            >
                              <option>1st Year</option>
                              <option>2nd Year</option>
                              <option>3rd Year</option>
                              <option>4th Year</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Phone Number</label>
                            <input 
                              type="tel" 
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                              placeholder="+91 98765 43210" 
                            />
                          </div>
                        )}
                      </div>
                      {formData.role === 'head_coordinator' && (
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Designation</label>
                          <input 
                            type="text" 
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                            placeholder="Head of Department / Senior Professor" 
                          />
                        </div>
                      )}
                    </>
                  )}

                  {formData.role === 'evaluator' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Area of Expertise</label>
                        <input 
                          type="text" 
                          value={formData.expertise}
                          onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                          placeholder="AI/ML, Blockchain, Web Dev..." 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Organization / Company</label>
                        <input 
                          type="text" 
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                          placeholder="Google, Microsoft, IIT..." 
                        />
                      </div>
                    </div>
                  )}

                  {formData.role === 'institution' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Institution Location</label>
                        <input 
                          type="text" 
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                          placeholder="Hyderabad, Telangana" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Institution Type</label>
                        <select 
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all"
                        >
                          <option>Private University</option>
                          <option>Government College</option>
                          <option>Autonomous Institution</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <button onClick={prevStep} className="flex-1 py-4 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] btn-primary py-4 text-lg flex items-center justify-center gap-3">
                    Continue <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2">Security</h2>
                  <p className="text-gray-500">Secure your account with a strong password.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-primary focus:bg-white transition-all" 
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={prevStep} className="flex-1 py-4 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] btn-primary py-4 text-lg flex items-center justify-center gap-3">
                    Next <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2">
                    {formData.role === 'student' ? 'Resume / CV' : formData.role === 'institution' ? 'Official Documents' : 'Supporting Docs'}
                  </h2>
                  <p className="text-gray-500">
                    {formData.role === 'student' ? 'Upload your latest resume to boost your profile.' : 'Upload official documents for verification.'}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-red-primary transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-red-primary/10 flex items-center justify-center text-red-primary group-hover:scale-110 transition-transform">
                        <Upload size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{formData.resume ? formData.resume.name : 'Click to upload or drag & drop'}</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
                      </div>
                    </div>
                  </div>

                  {formData.resume && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-red-primary shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">{formData.resume.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{(formData.resume.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button onClick={() => setFormData({ ...formData, resume: null })} className="text-gray-400 hover:text-red-primary">
                        <ArrowLeft size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 w-4 h-4 accent-red-primary rounded" id="terms" required />
                  <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
                    I agree to the <a href="#" className="text-red-primary font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-red-primary font-bold hover:underline">Privacy Policy</a>.
                  </label>
                </div>

                <div className="flex gap-4">
                  <button onClick={prevStep} className="flex-1 py-4 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button 
                    onClick={handleRegister} 
                    disabled={loading}
                    className="flex-[2] btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Complete'} <CheckCircle2 size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-10 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-red-primary font-bold hover:underline">Sign In</Link>
          </p>

          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-400"><span className="bg-white px-4">Or continue with</span></div>
            </div>

            <button 
              onClick={handleSocialLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm disabled:opacity-50"
            >
              <GoogleIcon /> Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
