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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const restoreSession = async () => {
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

                const user = await res.json();
                setUser(user);
            } catch (err) {
                // Only log errors in non-test environments
                if (process.env.NODE_ENV !== 'test') {
                    console.error("Failed to restore session", err);
                }
            }
        };

        restoreSession();
    }, []);

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
        <UserContext.Provider value={{ user, setUser, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
}
