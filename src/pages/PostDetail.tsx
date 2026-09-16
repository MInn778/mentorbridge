import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, MessageSquare, UserPlus, Send, Edit, Trash2, CheckCircle, RotateCcw, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserPopover from '@/components/UserPopover';
import ApplyModal from '@/components/ApplyModal';

interface Comment {
  commentId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Post {
  boardId: number;
  authorId: number;
  authorName: string;
  boardType: string;
  title: string;
  content: string;
  viewCount: number;
  tags: string[];
  status: 'RECRUITING' | 'COMPLETED';
  participantNames: string[];
  maxMembers: number | null;
  meetingType: '온라인' | '오프라인' | '온오프병행' | null;
  region: string | null;
  timeSlot: '평일_오전' | '평일_오후' | '평일_저녁' | '주말' | '협의' | null;
  createdAt: string;
}

const timeSlotLabels: Record<string, string> = {
  '평일_오전': '평일 오전',
  '평일_오후': '평일 오후',
  '평일_저녁': '평일 저녁',
  '주말': '주말',
  '협의': '시간 협의',
};

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { token, user } = useAuth();

  const fetchPostAndComments = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`, { headers }),
        fetch(`/api/posts/${postId}/comments`, { headers })
      ]);

      if (postRes.ok) {
        setPost(await postRes.json());
      }
      if (commentsRes.ok) {
        setComments(await commentsRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPostAndComments();
  }, [postId, token]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        setNewComment('');
        fetchPostAndComments();
      } else {
        alert("댓글 작성에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchPostAndComments();
      } else {
        alert("댓글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async () => {
    if (!post || !token) return;
    const nextStatus = post.status === 'COMPLETED' ? 'RECRUITING' : 'COMPLETED';
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setPost(await res.json());
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('삭제되었습니다.');
        navigate('/community');
      } else {
        alert("게시글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!post) return;
    if (post.status === 'COMPLETED') {
      alert("이미 모집이 완료된 게시글입니다.");
      return;
    }
    setShowApplyModal(true);
  };

  const submitApplication = async (reason: string) => {
    if (!post) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: post.authorId,
          content: reason,
          messageType: 'APPLICATION',
          relatedGroupId: post.boardId
        })
      });
      if (res.ok) {
        setShowApplyModal(false);
        alert("지원이 완료되었습니다. 방장의 수락을 기다려주세요.");
      } else {
        alert("지원에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    setShowReportModal(true);
  };

  const submitReport = async (reason: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setShowReportModal(false);
        alert("신고가 접수되었습니다. 관리자가 확인 후 처리합니다.");
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || "신고에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!post) {
    return <div className="p-8 text-center text-slate-500">로딩 중...</div>;
  }

  const getCategory = (boardType: string) => {
    if (boardType === '스터디모집') return '스터디';
    if (boardType === '프로젝트모집') return '프로젝트';
    if (boardType === '멘토모집' || boardType === '멘티모집') return '멘토 찾기';
    return '기타';
  };

  const isAuthor = user?.name === post.authorName; // Using name to match for MVP, or we can assume it works if names are unique

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold",
              getCategory(post.boardType) === '멘토 찾기' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
            )}>
              {getCategory(post.boardType)}
            </span>
            <span className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold",
              post.status === 'COMPLETED' ? "bg-slate-200 text-slate-600" : "bg-green-100 text-green-600"
            )}>
              {post.status === 'COMPLETED' ? '모집 완료' : '모집 중'}
            </span>
            <span className="text-sm text-slate-400">
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>

          {isAuthor && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleToggleStatus}
                title={post.status === 'COMPLETED' ? '모집 다시 열기' : '모집 완료로 변경'}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors",
                  post.status === 'COMPLETED'
                    ? "text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                    : "text-green-600 bg-green-50 hover:bg-green-100"
                )}
              >
                {post.status === 'COMPLETED' ? <RotateCcw size={16} /> : <CheckCircle size={16} />}
                {post.status === 'COMPLETED' ? '모집 재개' : '모집 완료'}
              </button>
              <button
                onClick={() => navigate(`/community/write?editId=${post.boardId}`)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={handleDeletePost}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-6">{post.title}</h1>

        {(post.meetingType || post.region || post.timeSlot) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.meetingType && (
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-md">{post.meetingType}</span>
            )}
            {post.region && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-md">{post.region}</span>
            )}
            {post.timeSlot && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md">{timeSlotLabels[post.timeSlot]}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-slate-600 mb-8 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {post.authorName.charAt(0)}
            </div>
            <UserPopover userId={post.authorId} userName={post.authorName} className="font-semibold text-slate-900" />
          </div>
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{post.participantNames?.length || 0}{post.maxMembers ? `/${post.maxMembers}` : ''} 명</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare size={16} />
            <span>{comments.length}</span>
          </div>
          {!isAuthor && (
            <button
              onClick={handleReport}
              className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <Flag size={14} /> 신고하기
            </button>
          )}
        </div>

        <div className="prose prose-slate max-w-none mb-12 min-h-[200px]">
          {post.content.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {(post.tags || []).map(tag => (
            <span key={tag} className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">#{tag}</span>
          ))}
        </div>

        {post.participantNames && post.participantNames.length > 0 && (
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              참여 확정 인원
            </h3>
            <div className="flex flex-wrap gap-3">
              {post.participantNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                    {name.charAt(0)}
                  </div>
                  <UserPopover userId={post.authorId} userName={name} className="text-sm font-semibold text-slate-700" />
                </div>
              ))}
            </div>
          </div>
        )}

        {getCategory(post.boardType) !== '기타' && !isAuthor && (
          <div className="flex justify-center border-t border-slate-100 pt-8">
            <button 
              onClick={handleApply}
              disabled={post.status === 'COMPLETED'}
              className={cn(
                "flex items-center justify-center gap-2 text-white px-12 py-4 rounded-2xl font-bold transition-all shadow-lg",
                post.status === 'COMPLETED' ? "bg-slate-300 shadow-none cursor-not-allowed" :
                getCategory(post.boardType) === '멘토 찾기' ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200" :
                getCategory(post.boardType) === '스터디' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" :
                "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
              )}
            >
              <UserPlus size={20} /> 
              {post.status === 'COMPLETED' ? '모집 완료' : 
               getCategory(post.boardType) === '멘토 찾기' ? '멘토 지원하기' : 
               getCategory(post.boardType) === '스터디' ? '스터디 지원하기' : '프로젝트 지원하기'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <MessageSquare size={24} className="text-blue-600" />
          댓글 <span className="text-blue-600">{comments.length}</span>
        </h2>
        
        <div className="space-y-6 mb-8">
          {comments.map(comment => (
            <div key={comment.commentId} className="flex gap-4 group">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                {comment.authorName.charAt(0)}
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-2xl relative">
                {user?.name === comment.authorName && (
                  <button 
                    onClick={() => handleDeleteComment(comment.commentId)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="flex justify-between items-start mb-2">
                  <UserPopover userId={comment.authorId} userName={comment.authorName} className="font-bold text-slate-900" />
                  <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-4 relative">
          <div className="h-10 w-10 rounded-full bg-slate-200 flex-shrink-0" />
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={token ? "댓글을 남겨보세요..." : "로그인 후 댓글을 남길 수 있습니다."}
            disabled={!token}
            className="flex-1 min-h-[100px] p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button 
            type="submit"
            disabled={!token || !newComment.trim()}
            className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      {showApplyModal && (
        <ApplyModal
          title={post.title}
          actionLabel={
            getCategory(post.boardType) === '멘토 찾기' ? '멘토 지원하기' :
            getCategory(post.boardType) === '스터디' ? '스터디 지원하기' : '프로젝트 지원하기'
          }
          onClose={() => setShowApplyModal(false)}
          onSubmit={submitApplication}
        />
      )}

      {showReportModal && (
        <ApplyModal
          title={post.title}
          actionLabel="게시글 신고하기"
          subtitle={`"${post.title}"을(를) 신고합니다.`}
          fieldLabel="신고 사유"
          placeholder="어떤 점이 문제인지 구체적으로 적어주세요."
          submitLabel="신고하기"
          onClose={() => setShowReportModal(false)}
          onSubmit={submitReport}
        />
      )}
    </div>
  );
}
