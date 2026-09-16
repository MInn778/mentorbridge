export interface User {
  id: string;
  nickname: string;
  role: 'mentor' | 'mentee';
  avatar?: string;
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  experience: string;
  specs: string[];
  history: string[];
  avatar: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  type: 'study' | 'community' | 'contest';
  link?: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  fileName: string;
  fileUrl: string;
  menteeId: string;
  mentorComment?: string;
  aiFeedback?: string;
  createdAt: string;
}
