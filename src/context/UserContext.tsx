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
                const res = await fetch('/api/auth/me'); // or your route
                if (!res.ok) return;

                const user = await res.json();
                setUser(user);
            } catch (err) {
                console.error("Failed to restore session", err);
            }
        };

        restoreSession();
    }, []);


    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
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
