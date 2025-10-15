import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  role: 'buyer' | 'facility' | 'auditor' | 'admin';
  first_name?: string;
  last_name?: string;
  email?: string;
  reputation_score: number;
  verification_status: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  resendVerification: (email: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Session timeout: 30 minutes of inactivity
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const { toast } = useToast();

  // Track user activity for session timeout
  useEffect(() => {
    if (!session) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check for session timeout every minute
    const timeoutCheck = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      
      if (inactiveTime > SESSION_TIMEOUT) {
        console.log('Session timeout due to inactivity');
        signOut();
        toast({
          title: "Session Expired",
          description: "Your session has expired due to inactivity. Please log in again.",
          variant: "destructive",
        });
      }
    }, 60000); // Check every minute

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(timeoutCheck);
    };
  }, [session, lastActivity]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Reset activity timer on login
          setLastActivity(Date.now());
          
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setLastActivity(Date.now());
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Profile not found:', profileError);
        // Profile doesn't exist - sign out the user
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        toast({
          title: "Account Error",
          description: "Your profile data is missing. Please sign up again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch user role from secure user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('role', { ascending: true }) // admin < auditor < facility < buyer
        .limit(1)
        .maybeSingle();

      // Combine profile with role from user_roles table
      setProfile({
        ...profileData,
        role: (roleData?.role || 'buyer') as 'buyer' | 'facility' | 'auditor' | 'admin'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // On any error, sign out to prevent infinite loading
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      toast({
        title: "Authentication Error",
        description: "There was a problem loading your profile. Please sign in again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, role?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role || 'buyer', // Default to buyer if no role specified
        },
      },
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user && !data.session && data.user.identities?.length === 0) {
      // User already exists - Supabase doesn't send confirmation email for existing users
      toast({
        title: "Account Already Exists",
        description: "This email is already registered. Please sign in or contact support if you need to reset your password.",
        variant: "destructive",
      });
      return { error: new Error("User already exists") };
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const resendVerification = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectUrl },
    });

    if (error) {
      toast({
        title: "Resend failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verification email sent",
        description: "Please check your inbox (and spam folder).",
      });
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password reset email sent",
        description: "Check your email for the reset link.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      resendVerification,
      resetPassword,
      signOut,
      updateProfile,
      refreshProfile,
    }}>
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