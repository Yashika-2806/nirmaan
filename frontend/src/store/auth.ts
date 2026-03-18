import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';

interface User {
    _id: string;
    email: string;
    name: string;
    role: string;
    subscription: {
        tier: string;
        validUntil?: Date;
    };
    profile?: any;
    preferences?: {
        weeklyGoal?: number;
        onboarding?: {
            year?: string;
            targetRole?: string;
            prepLevel?: string;
            completedAt?: string;
        };
    };
    createdAt?: string;
}

interface ProfileUpdatePayload {
    name?: string;
    profile?: Record<string, unknown>;
    preferences?: {
        learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
        weeklyGoal?: number;
        notifications?: {
            email?: boolean;
            push?: boolean;
        };
        onboarding?: {
            year: string;
            targetRole: string;
            prepLevel: string;
            completedAt: string;
        };
    };
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; name: string }) => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    updateProfile: (data: ProfileUpdatePayload) => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            setTokens: (accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                set({ accessToken, refreshToken, isAuthenticated: true });
            },

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { user, tokens } = response.data.data;

                    get().setTokens(tokens.accessToken, tokens.refreshToken);
                    set({ user, isAuthenticated: true });
                } catch (error: any) {
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            register: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/register', data);
                    const { user, tokens } = response.data.data;

                    get().setTokens(tokens.accessToken, tokens.refreshToken);
                    set({ user, isAuthenticated: true });
                } catch (error: any) {
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                }
            },

            fetchUser: async () => {
                try {
                    const response = await api.get('/auth/me');
                    set({ user: response.data.data.user, isAuthenticated: true });
                } catch (error) {
                    get().logout();
                }
            },

            updateProfile: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await api.put('/auth/profile', data);
                    set({ user: response.data.data.user });
                } catch (error: any) {
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
