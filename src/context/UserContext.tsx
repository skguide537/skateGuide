'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authClient } from '@/services/skateparkClient';
import { logger } from '@/utils/logger';

export interface User {
    _id: string;
    email: string;
    name?: string;
    photoUrl?: string;
    role?: string; // Add role field for admin checking
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
            // Check if we have the JWT token cookie
            const hasTokenCookie = document.cookie.includes('token=');
            
            if (!hasTokenCookie) {
                // No token cookie = definitely not logged in
                // Don't waste an API call
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const userData = await authClient.getCurrentUser();
                setUser(userData);
            } catch (err) {
                // Token expired or invalid - clear user state
                setUser(null);
                // Only log errors in non-test environments
                if (process.env.NODE_ENV !== 'test') {
                    logger.error("Failed to restore session", err as Error, { component: 'UserContext' });
                }
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []); // Remove user dependency to always check auth

    const logout = async () => {
        try {
            await authClient.logout();
        } catch (err) {
            // Only log errors in non-test environments
            if (process.env.NODE_ENV !== 'test') {
                logger.error("Logout failed", err as Error, { component: 'UserContext' });
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
