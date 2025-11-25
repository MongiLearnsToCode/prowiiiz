import { useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthState {
    user: User | null;
    loading: boolean;
    session: Session | null;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        loading: true,
        session: null
    });

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setAuthState({ user: null, loading: false, session: null });
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    await fetchUserProfile(session.user.id);
                } else {
                    setAuthState({ user: null, loading: false, session: null });
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Profile fetch error details:', error);
                throw error;
            }

            if (data) {
                const user: User = {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
                    jobTitle: data.job_title || 'Team Member'
                };

                const session = (await supabase.auth.getSession()).data.session;
                setAuthState({ user, loading: false, session });
            } else {
                console.error('No profile data found for user:', userId);
                setAuthState({ user: null, loading: false, session: null });
            }
        } catch (error: any) {
            console.error('Error fetching user profile:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            // Don't sign out here to avoid infinite loops
            // Just set loading to false and user to null
            setAuthState({ user: null, loading: false, session: null });
        }
    };

    const signUp = async (name: string, email: string, password: string) => {
        try {
            // Sign up the user
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                console.error('Auth signup error:', error);
                throw error;
            }

            if (data.user) {
                console.log('User created in auth, now creating profile for:', data.user.id);

                // Create profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        name,
                        email,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                        job_title: 'Team Member'
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    console.error('Profile error details:', JSON.stringify(profileError, null, 2));
                    throw profileError;
                }

                console.log('Profile created successfully');
            }

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true, error: null };
        } catch (error: any) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    };

    return {
        user: authState.user,
        session: authState.session,
        loading: authState.loading,
        signUp,
        signIn,
        signOut
    };
};
