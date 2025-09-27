import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email?: string | null;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    type: 'email-otp' | 'password-login' | 'password-signup',
    data: { email: string; code?: string; password?: string }
  ) => Promise<void>;
  signInAnonymous: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const token = api.getToken();
        console.log('Has token:', !!token);
        if (token) {
          const { user } = await api.auth.getCurrentUser();
          console.log('User authenticated:', { id: user?.id, email: user?.email });
          setUser(user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        api.setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const signIn = async (
    type: 'email-otp' | 'password-login' | 'password-signup',
    data: { email: string; code?: string; password?: string }
  ) => {
    console.log('SignIn type:', type, 'email:', data.email, 'hasPassword:', !!data.password, 'hasCode:', !!data.code);
    if (type === 'email-otp') {
      if (!data.code) {
        console.log('Sending OTP...');
        await api.auth.sendOtp(data.email);
      } else {
        console.log('Verifying OTP...');
        const response = await api.auth.verifyOtp(data.email, data.code);
        console.log('Verify response: success =', !!response.token);
        api.setToken(response.token);
        setUser(response.user);
      }
    } else if (type === 'password-login') {
      const response = await api.auth.login(data.email, data.password!);
      api.setToken(response.token);
      setUser(response.user);
    } else if (type === 'password-signup') {
      const response = await api.auth.signup(data.email, data.password!);
      api.setToken(response.token);
      setUser(response.user);
    }
  };

  const signInAnonymous = async () => {
    console.log('Signing in as guest...');
    const response = await api.auth.guestLogin();
    console.log('Guest login: success =', !!response.token);
    api.setToken(response.token);
    setUser(response.user);
  };

  const signOut = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      api.setToken(null);
      setUser(null);
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    try {
      const { user } = await api.auth.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signInAnonymous,
      signOut,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAuthActions() {
  const { signIn, signInAnonymous, signOut } = useAuth();
  
  return {
    signIn: (provider: string, params?: any) => {
      if (provider === 'email-otp') return signIn('email-otp', params);
      if (provider === 'password-login') return signIn('password-login', params);
      if (provider === 'password-signup') return signIn('password-signup', params);
      if (provider === 'anonymous') return signInAnonymous();
      throw new Error(`Unknown provider: ${provider}`);
    },
    signOut
  };
}