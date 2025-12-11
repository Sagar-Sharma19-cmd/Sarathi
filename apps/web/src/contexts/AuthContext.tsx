import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthErrorHandler } from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  jwt: string | null;
  sarathiId: string | null;
  login: (jwt: string, sarathiId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(localStorage.getItem('jwt'));
  const [sarathiId, setSarathiId] = useState<string | null>(
    localStorage.getItem('sarathiId')
  );
  const navigate = useNavigate();

  const login = (newJwt: string, newSarathiId: string) => {
    localStorage.setItem('jwt', newJwt);
    localStorage.setItem('sarathiId', newSarathiId);
    setJwt(newJwt);
    setSarathiId(newSarathiId);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('sarathiId');
    setJwt(null);
    setSarathiId(null);
    navigate('/login');
  }, [navigate]);

  // Set up automatic logout on auth errors (401)
  useEffect(() => {
    setAuthErrorHandler(() => {
      console.warn('Token expired or invalid - logging out');
      logout();
    });
  }, [logout]);

  const value = {
    isAuthenticated: !!jwt,
    jwt,
    sarathiId,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

