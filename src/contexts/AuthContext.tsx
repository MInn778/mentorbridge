import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  role: 'MENTOR' | 'MENTEE' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (newToken: string, newRefreshToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      // best-effort: invalidate the refresh token server-side
      fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  // 액세스 토큰이 만료됐을 때 리프레시 토큰으로 새 토큰을 발급받는다.
  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch('http://localhost:8080/api/auth/reissue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        logout();
        return null;
      }

      const data = await response.json();
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.token;
    } catch (e) {
      console.error('Failed to refresh access token', e);
      return null;
    }
  };

  // 액세스 토큰이 만료돼 401이 오면, 리프레시 토큰으로 재발급 받아 원래 요청을 한 번 재시도한다.
  // 페이지마다 개별 fetch를 다 손대는 대신 window.fetch 자체를 감싸서 앱 전체에 적용한다.
  useEffect(() => {
    const win = window as unknown as { __fetchPatchedForAuth?: boolean };
    if (win.__fetchPatchedForAuth) return;
    win.__fetchPatchedForAuth = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);

      if (response.status !== 401) return response;

      const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      let pathname = '';
      try {
        pathname = new URL(urlString, window.location.origin).pathname;
      } catch {
        pathname = urlString;
      }
      // 로그인/회원가입/재발급 자체가 401이면 재시도 대상이 아님(무한루프 방지)
      if (!pathname.startsWith('/api/') || pathname.startsWith('/api/auth/')) return response;

      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) return response;

      const reissueRes = await originalFetch('http://localhost:8080/api/auth/reissue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!reissueRes.ok) return response;

      const reissued = await reissueRes.json();
      setToken(reissued.token);
      localStorage.setItem('token', reissued.token);
      localStorage.setItem('refreshToken', reissued.refreshToken);

      const retryHeaders = new Headers(init?.headers);
      if (retryHeaders.has('Authorization')) {
        retryHeaders.set('Authorization', `Bearer ${reissued.token}`);
      }

      return originalFetch(input, { ...init, headers: retryHeaders });
    };

    return () => {
      window.fetch = originalFetch;
      win.__fetchPatchedForAuth = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshAccessToken, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
