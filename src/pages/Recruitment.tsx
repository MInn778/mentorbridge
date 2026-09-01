import React, { useEffect, useState } from 'react';
import { ExternalLink, Building2, MapPin, Clock, Search, Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  cacheId: number;
  externalJobId: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  employmentType: string | null;
  jobPosition: string | null;
  deadline: string | null;
  originalUrl: string;
  bookmarked: boolean;
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return '상시';
  const diffDays = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? `D-${diffDays}` : '마감';
}

export default function Recruitment() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const url = new URL('http://localhost:8080/api/jobs');
      if (search) url.searchParams.set('keyword', search);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('채용 공고를 불러오지 못했습니다.');
      const data = await response.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchJobs();
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(keyword);
  };

  const toggleBookmark = async (job: Job) => {
    setJobs((prev) => prev.map((j) => (j.externalJobId === job.externalJobId ? { ...j, bookmarked: !j.bookmarked } : j)));
    try {
      await fetch(`http://localhost:8080/api/jobs/${job.externalJobId}/bookmark`, {
        method: job.bookmarked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // rollback on failure
      setJobs((prev) => prev.map((j) => (j.externalJobId === job.externalJobId ? { ...j, bookmarked: job.bookmarked } : j)));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">채용 & 정보</h1>
        <p className="text-slate-500 mt-2">최신 채용 정보와 기업 트렌드를 확인하세요.</p>
      </header>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
        <div className="p-3 bg-blue-600 text-white rounded-2xl">
          <Building2 size={24} />
        </div>
        <div>
          <h2 className="font-bold text-blue-900">사람인 API 연동 예정</h2>
          <p className="text-sm text-blue-700">지금은 자체 캐시(job_cache)에 저장된 샘플 공고를 보여드리고 있어요. 마음에 드는 공고는 북마크해두세요.</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="회사명, 직무, 키워드로 검색"
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </form>

      {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="text-center text-slate-400 py-12">불러오는 중...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center text-slate-400 py-12">검색 결과가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <div key={job.externalJobId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="text-sm font-semibold text-slate-600">{job.company}</span>
                      {job.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={12} /> {job.location}
                        </div>
                      )}
                      {job.employmentType && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} /> {job.employmentType}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">{formatDeadline(job.deadline)}</span>
                  <button
                    onClick={() => toggleBookmark(job)}
                    className={`p-2 rounded-lg transition-all ${job.bookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                    title={job.bookmarked ? '북마크 해제' : '북마크'}
                  >
                    <Bookmark size={20} fill={job.bookmarked ? 'currentColor' : 'none'} />
                  </button>
                  <a
                    href={job.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
