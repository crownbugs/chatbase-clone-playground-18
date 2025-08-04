import { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, company?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; company?: string; website?: string; openai_api_key?: string }) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    // TODO: Implement after Supabase setup
    return { error: new Error('Authentication not yet implemented') };
  };

  const signUp = async (email: string, password: string, fullName?: string, company?: string) => {
    // TODO: Implement after Supabase setup
    return { error: new Error('Authentication not yet implemented') };
  };

  const signOut = async () => {
    // TODO: Implement after Supabase setup
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (data: { full_name?: string; company?: string; website?: string; openai_api_key?: string }) => {
    // TODO: Implement after Supabase setup
    return { error: new Error('Profile updates not yet implemented') };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};