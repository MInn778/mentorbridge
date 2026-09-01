import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const role = searchParams.get('role');

    if (token && refreshToken && email && name && role) {
      login(token, refreshToken, { email, name, role: role as 'MENTOR' | 'MENTEE' });
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
    // 콜백 처리는 마운트 시 한 번만 — login/navigate 참조가 렌더마다 바뀌어서
    // 의존성에 넣으면 무한 루프(Maximum update depth exceeded)가 발생함.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-slate-500">로그인 처리 중...</p>
    </div>
  );
}
