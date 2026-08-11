import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'escola' | 'sicredi' | 'prefeitura';


interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  schoolId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      }
      
      setLoading(false);
    };

    fetchSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setRole(null);
        setSchoolId(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('role, school_id')
        .eq('id', userId)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );

      const result = await Promise.race([profilePromise, timeoutPromise]) as any;
      const data = result?.data;
      
      if (data) {
        setRole(data.role as UserRole);
        if (data.role === 'escola') {
          setSchoolId(data.school_id);
        }
      }
      // If it fails or times out, we'll try to fallback based on email in a real app, 
      // but here we just leave it or let the user refresh.
    } catch (error) {
      console.warn('Error fetching profile or timed out:', error);
      // Fallback for prefeitura explicitly if we know the email
      if (email === 'prefeitura@ecotroca.com') {
        setRole('prefeitura');
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, schoolId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
