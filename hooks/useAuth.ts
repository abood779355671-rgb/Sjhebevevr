'use client';

import { useState, useEffect, useCallback } from 'react';
import { TOKEN_KEY } from '@/lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsAuthenticated(res.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: data.error || 'فشل تسجيل الدخول' };
    } catch {
      return { success: false, error: 'خطأ في الاتصال بالخادم' };
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    await fetch('/api/auth/verify', { method: 'DELETE' });
    setIsAuthenticated(false);
    window.location.href = '/login';
  }, []);

  function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  function authHeaders(): HeadersInit {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  return { isAuthenticated, isLoading, login, logout, getToken, authHeaders };
}
