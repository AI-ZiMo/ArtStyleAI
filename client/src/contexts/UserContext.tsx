import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const freshUser = await getUser(user.email);
      setUser(freshUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh user data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use a demo email for this example
    const loadUser = async () => {
      try {
        const loadedUser = await getUser('demo@example.com');
        setUser(loadedUser);
      } catch (err) {
        console.error('Failed to load user:', err);
        setError('Failed to load user data');
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [toast]);

  return (
    <UserContext.Provider value={{ user, loading, error, updateUser, refreshUser }}>
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
