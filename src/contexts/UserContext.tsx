import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserLoginData, UserRegistrationData } from '../types/user';
import { supabase } from '../lib/supabase-browser';
import { Session } from '@supabase/supabase-js';

interface UserContextType {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'editor' | 'owner' | 'user';
    assistant_access: 'single' | 'all';
    assigned_assistants?: string[];
    default_assistant_id?: string;
    language: string;
    qa_form_submitted?: boolean;
  } | null;
  session: Session | null;
  loading: boolean;
  login: (data: UserLoginData) => Promise<void>;
  register: (data: UserRegistrationData) => Promise<void>;
  logout: () => Promise<void>;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {}
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (session: Session) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: UserLoginData) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email: data.email });
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!authData.user || !authData.session) {
        console.error('Login failed - missing user or session data');
        throw new Error('Login failed - no user data');
      }

      // Note: We don't need to manually set the user here
      // The onAuthStateChange listener will handle setting the user
      
    } catch (error) {
      console.error('Login failed:', error);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: UserRegistrationData) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Registration failed');
      }

      // Note: We don't need to manually set the user here
      // The onAuthStateChange listener will handle setting the user
      
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Note: We don't need to manually set the user here
      // The onAuthStateChange listener will handle setting the user to null
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, session, loading, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 