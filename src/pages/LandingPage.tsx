
import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Users, Calendar, Award, 
  ChevronRight, Star, Globe, Shield, 
  Zap, CheckCircle2, Github, Twitter, Linkedin
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-primary rounded-xl flex items-center justify-center text-white font-display font-bold text-2xl">U</div>
            <span className="font-display font-bold text-2xl tracking-tight">UniGuild</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-gray-600 hover:text-red-primary transition-all">Features</a>
            <a href="#events" className="text-sm font-bold text-gray-600 hover:text-red-primary transition-all">Events</a>
            <a href="#colleges" className="text-sm font-bold text-gray-600 hover:text-red-primary transition-all">Colleges</a>
            <Link to="/login" className="text-sm font-bold text-gray-900 hover:text-red-primary transition-all">Login</Link>
            <Link to="/register" className="btn-primary py-2 px-6 text-xs">Get Started</Link>
          </div>
          <button className="md:hidden text-gray-900"><Zap size={24} /></button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <Zap size={14} /> The Future of Campus Life
            </div>
            <h1 className="text-7xl md:text-9xl font-display font-bold leading-[0.85] mb-8">
              Unite. <br />
              <span className="text-red-primary">Collaborate.</span> <br />
              Grow.
            </h1>
            <p className="text-xl text-gray-600 max-w-lg mb-10 leading-relaxed">
              UniGuild is the all-in-one ecosystem for university events, professional networking, and student growth. Join 50,000+ students across 100+ colleges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="btn-primary text-lg flex items-center justify-center gap-3">
                Join the Guild <ArrowRight size={20} />
              </Link>
              <button className="btn-secondary text-lg flex items-center justify-center gap-3">
                Explore Events
              </button>
            </div>
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="" />
                ))}
              </div>
              <p className="text-sm font-bold text-gray-500">
                <span className="text-red-primary">50k+</span> Active Students
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
              <img src="https://picsum.photos/seed/campus/800/1000" className="w-full h-auto" alt="Campus Life" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="text-yellow-400 fill-yellow-400" size={16} />
                  <span className="text-xs font-bold uppercase">Featured Event</span>
                </div>
                <h3 className="text-3xl font-display font-bold">Code Rush Hackathon 2026</h3>
                <p className="text-sm opacity-80">Sasi Institute of Technology • March 20-22</p>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-red-primary/5 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Colleges', val: '120+' },
              { label: 'Events Hosted', val: '2.5k+' },
              { label: 'Internships', val: '800+' },
              { label: 'User Rating', val: '4.9/5' }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-5xl font-mono font-bold text-red-primary mb-2">{s.val}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-5xl font-display font-bold mb-6">Built for the <span className="text-red-primary">Modern Campus</span></h2>
            <p className="text-lg text-gray-600">Everything you need to manage events, track progress, and build your professional portfolio in one place.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Smart Ticketing', desc: 'Instant QR-based event passes with real-time check-ins and stage tracking.', icon: <Zap /> },
              { title: 'Internship Sentinel', desc: 'Secure blockchain-verified internship certificates and automated verification.', icon: <Shield /> },
              { title: 'Global Job Board', desc: 'Access exclusive job opportunities and internships from top tech companies.', icon: <Globe /> },
              { title: 'Reputation System', desc: 'Build your profile with a unique reputation score based on participation.', icon: <Award /> },
              { title: 'Team Collaboration', desc: 'Find teammates for hackathons and group projects with smart matching.', icon: <Users /> },
              { title: 'Advanced Analytics', desc: 'Detailed insights for organizers to track event success and engagement.', icon: <Calendar /> }
            ].map((f, i) => (
              <div key={i} className="card p-8 group">
                <div className="w-12 h-12 bg-red-50 text-red-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-primary group-hover:text-white transition-all">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-white text-gray-900 relative overflow-hidden border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-6xl md:text-8xl font-display font-bold mb-8">Ready to <span className="text-red-primary italic">Level Up?</span></h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12">Join thousands of students who are already shaping their future with UniGuild. Start your journey today.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/register" className="btn-primary text-lg px-12">Create Free Account</Link>
            <button className="bg-gray-50 border border-gray-200 text-gray-900 px-12 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all">Contact Sales</button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-primary/5 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-red-primary rounded-xl flex items-center justify-center text-white font-display font-bold text-2xl">U</div>
              <span className="font-display font-bold text-2xl tracking-tight">UniGuild</span>
            </div>
            <p className="text-gray-500 max-w-sm mb-8">The ultimate university event management and professional growth platform. Empowering students since 2024.</p>
            <div className="flex gap-4">
              <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-primary transition-all"><Twitter size={18} /></button>
              <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-primary transition-all"><Linkedin size={18} /></button>
              <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-primary transition-all"><Github size={18} /></button>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-red-primary">Features</a></li>
              <li><a href="#" className="hover:text-red-primary">Event Board</a></li>
              <li><a href="#" className="hover:text-red-primary">Job Board</a></li>
              <li><a href="#" className="hover:text-red-primary">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-red-primary">About Us</a></li>
              <li><a href="#" className="hover:text-red-primary">Contact</a></li>
              <li><a href="#" className="hover:text-red-primary">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-red-primary">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">© 2026 UniGuild Inc. All rights reserved.</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">Made with <Zap size={12} className="text-red-primary" /> for students everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
