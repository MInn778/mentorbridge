import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AICareer from './pages/AICareer';
import Community from './pages/Community';
import WritePost from './pages/WritePost';
import MentorSystem from './pages/MentorSystem';
import Recruitment from './pages/Recruitment';
import Activities from './pages/Activities';
import Feedback from './pages/Feedback';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PostDetail from './pages/PostDetail';
import MessageInbox from './pages/MessageInbox';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ai-career" element={<AICareer />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/write" element={<WritePost />} />
            <Route path="/mentors" element={<MentorSystem />} />
            <Route path="/recruitment" element={<Recruitment />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/community/:postId" element={<PostDetail />} />
            <Route path="/messages" element={<MessageInbox />} />
          </Routes>
        </main>
        
        <footer className="border-t border-slate-200 bg-white py-12 mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900">MentorBridge</span>
              </div>
              <p className="text-sm text-slate-400">© 2024 MentorBridge. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="text-sm text-slate-400 hover:text-blue-600">이용약관</a>
                <a href="#" className="text-sm text-slate-400 hover:text-blue-600">개인정보처리방침</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      </Router>
    </AuthProvider>
  );
}
