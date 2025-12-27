'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useMemo,
} from 'react';
import { 
  Auth,
  User, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
  AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { LoginFormData } from '@/components/auth/login-form';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: LoginFormData) => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = (data: LoginFormData) => {
    return signInWithEmailAndPassword(auth, data.email, data.password);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };
  
  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
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
