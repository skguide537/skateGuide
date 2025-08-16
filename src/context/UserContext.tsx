'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface User {
    _id: string;
    email: string;
    name?: string;
    photoUrl?: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const restoreSession = async () => {
            // Only check auth if we don't already have user data
            if (user) {
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    if (res.status !== 401) {
                        // Only log non-401 errors in non-test environments
                        if (process.env.NODE_ENV !== 'test') {
                            console.error('Auth check failed');
                        }
                    }
                    return;
                }

                const userData = await res.json();
                setUser(userData);
            } catch (err) {
                // Only log errors in non-test environments
                if (process.env.NODE_ENV !== 'test') {
                    console.error("Failed to restore session", err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, [user]); // Only run when user changes

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
            // Only log errors in non-test environments
            if (process.env.NODE_ENV !== 'test') {
                console.error("Logout failed", err);
            }
        }
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
}
