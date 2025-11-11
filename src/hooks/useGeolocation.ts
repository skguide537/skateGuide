'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';
import { logger } from '@/lib/logger';

export type GeolocationStatus = 'loading' | 'success' | 'fallback';
export type GeolocationFailureReason = 'timeout' | 'denied' | 'unavailable';

export interface GeolocationState {
    status: GeolocationStatus;
    coords: { lat: number; lng: number } | null;
    failureReason?: GeolocationFailureReason;
}

interface UseGeolocationOptions {
    timeout?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
    const timeoutMs = options.timeout ?? HOME_PAGE_CONSTANTS.TIMEOUTS.GEOLOCATION;

    const [state, setState] = useState<GeolocationState>({
        status: 'loading',
        coords: null,
    });

    const requestIdRef = useRef(0);

    const startRequest = useCallback(() => {
        if (typeof window === 'undefined' || !navigator?.geolocation) {
            logger.warn('Geolocation unavailable in this environment', 'useGeolocation');
            setState({
                status: 'fallback',
                coords: null,
                failureReason: 'unavailable',
            });
            return;
        }

        const currentRequestId = ++requestIdRef.current;

        setState({
            status: 'loading',
            coords: null,
        });

        const timeoutId = window.setTimeout(() => {
            if (requestIdRef.current !== currentRequestId) return;
            logger.warn('Geolocation timed out after %dms', timeoutMs, 'useGeolocation');
            setState({
                status: 'fallback',
                coords: null,
                failureReason: 'timeout',
            });
        }, timeoutMs);

        navigator.geolocation.getCurrentPosition(
            position => {
                if (requestIdRef.current !== currentRequestId) return;
                window.clearTimeout(timeoutId);

                setState({
                    status: 'success',
                    coords: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    },
                });
            },
            error => {
                if (requestIdRef.current !== currentRequestId) return;
                window.clearTimeout(timeoutId);

                const failureReason: GeolocationFailureReason =
                    error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable';

                logger.warn('Geolocation error', { code: error.code, message: error.message }, 'useGeolocation');

                setState({
                    status: 'fallback',
                    coords: null,
                    failureReason,
                });
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: timeoutMs,
            }
        );
    }, [timeoutMs]);

    useEffect(() => {
        startRequest();

        return () => {
            requestIdRef.current += 1;
        };
    }, [startRequest]);

    const retry = useCallback(() => {
        startRequest();
    }, [startRequest]);

    return {
        ...state,
        retry,
        isLoading: state.status === 'loading',
    };
}

