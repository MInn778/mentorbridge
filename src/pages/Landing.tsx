import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, Target, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col items-center mt-12 sm:mt-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-in slide-in-from-bottom-4 duration-700">
          <Sparkles className="text-blue-500 w-4 h-4" />
          <span className="text-sm font-semibold text-slate-700">새로운 멘토링의 시작</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm animate-in slide-in-from-bottom-6 duration-700 delay-100">
          당신의 잠재력을 <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">현실로 만드세요</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200">
          멘토브릿지는 대학생과 현직자를 연결하여 실질적인 커리어 성장을 돕는 최적의 플랫폼입니다. 지금 바로 나만의 여정을 시작해보세요.
        </p>

        <Link 
          to="/dashboard"
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-lg shadow-md hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-1 animate-in slide-in-from-bottom-10 duration-700 delay-300"
        >
          시작하기
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl px-4 w-full mt-24 mb-16 animate-in slide-in-from-bottom-12 duration-700 delay-500">
        {[
          {
            icon: Users,
            title: "맞춤형 멘토 연결",
            description: "관심 직무와 기업에 맞는 현직자 멘토를 추천받고 1:1 커피챗을 진행하세요.",
            color: "bg-blue-50 text-blue-600 border-blue-100"
          },
          {
            icon: Target,
            title: "AI 커리어 분석",
            description: "당신의 활동 내역을 기반으로 AI가 최적의 커리어 패스를 제안해 드립니다.",
            color: "bg-indigo-50 text-indigo-600 border-indigo-100"
          },
          {
            icon: Rocket,
            title: "실무 프로젝트",
            description: "실제 기업 과제를 수행하며 실무 경험을 쌓고 포트폴리오를 완성하세요.",
            color: "bg-purple-50 text-purple-600 border-purple-100"
          }
        ].map((feature, idx) => (
          <div key={idx} className="bg-white/70 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border", feature.color)}>
              <feature.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
