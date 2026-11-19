'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
    const geolocationSupported = useSyncExternalStore(
        () => () => undefined,
        () => typeof navigator !== 'undefined' && 'geolocation' in navigator,
        () => true
    );

    const requestIdRef = useRef(0);

    const startRequest = useCallback(() => {
        if (!geolocationSupported) {
            logger.warn('Geolocation unavailable in this environment', 'useGeolocation');
            return;
        }

        const currentRequestId = ++requestIdRef.current;

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
    }, [timeoutMs, geolocationSupported]);

    useEffect(() => {
        if (geolocationSupported) {
            void (async () => {
                startRequest();
            })();
        }

        return () => {
            requestIdRef.current += 1;
        };
    }, [startRequest, geolocationSupported]);

    const retry = useCallback(() => {
        setState({ status: 'loading', coords: null });
        startRequest();
    }, [startRequest]);

    const resolvedState = geolocationSupported ? state : {
            status: 'fallback' as const,
            coords: null,
            failureReason: 'unavailable' as const,
        };

    return {
        ...resolvedState,
        retry,
        isLoading: resolvedState.status === 'loading',
    };
}

