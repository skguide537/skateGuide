'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGeolocation, GeolocationStatus } from '@/hooks/useGeolocation';

interface GeolocationContextType {
    status: GeolocationStatus;
    coords: { lat: number; lng: number } | null;
    failureReason?: 'timeout' | 'denied' | 'unavailable';
    retry: () => void;
    isLoading: boolean;
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export function GeolocationProvider({ children }: { children: ReactNode }) {
    const geolocation = useGeolocation();

    return (
        <GeolocationContext.Provider value={geolocation}>
            {children}
        </GeolocationContext.Provider>
    );
}

export function useGeolocationContext(): GeolocationContextType {
    const context = useContext(GeolocationContext);
    if (!context) {
        // Return a default/fallback state if context is not available
        return {
            status: 'fallback',
            coords: null,
            retry: () => {},
            isLoading: false,
        };
    }
    return context;
}


