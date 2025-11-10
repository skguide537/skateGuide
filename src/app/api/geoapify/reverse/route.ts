import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import {
  AdminForbiddenError,
  AdminUnauthorizedError,
  requireAdmin,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type RateLimitState = { count: number; resetTime: number };

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const requestCounts = new Map<string, RateLimitState>();

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface GeoapifyReverseFeature {
  properties?: {
    formatted?: string;
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

interface GeoapifyReverseResult {
  formatted?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

interface ReverseResult {
  formatted: string;
  rawFormatted?: string;
  components: {
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
  };
  lat: number;
  lon: number;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(ip);

  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  current.count += 1;
  return true;
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function buildCacheKey(lat: number, lon: number): string {
  return `geoapify:reverse:${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

function formatLabel(
  feature: GeoapifyReverseFeature | undefined,
  lat: number | undefined,
  lon: number | undefined,
): ReverseResult {
  const formatted = feature?.properties?.formatted;
  const city = feature?.properties?.city;
  const state = feature?.properties?.state;
  const country = feature?.properties?.country;
  const countryCode = feature?.properties?.country_code;

  const locationParts = Array.from(
    new Set([city, state, country].filter((part): part is string => Boolean(part?.trim()))),
  );

  const displayLabel =
    locationParts.length > 0
      ? locationParts.join(', ')
      : formatted || (typeof lat === 'number' && typeof lon === 'number'
          ? `${lat.toFixed(2)}, ${lon.toFixed(2)}`
          : 'Unknown location');

  return {
    formatted: displayLabel,
    rawFormatted: formatted || undefined,
    components: {
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      countryCode: countryCode || undefined,
    },
    lat: lat ?? 0,
    lon: lon ?? 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    if (error instanceof AdminUnauthorizedError || error instanceof AdminForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    throw error;
  }

  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  if (!latParam || !lonParam) {
    return NextResponse.json(
      { error: 'Missing required parameters: lat and lon' },
      { status: 400 },
    );
  }

  const lat = Number.parseFloat(latParam);
  const lon = Number.parseFloat(lonParam);

  if (!isValidLatitude(lat) || !isValidLongitude(lon)) {
    return NextResponse.json(
      { error: 'Invalid coordinates supplied' },
      { status: 400 },
    );
  }

  if (lat === 0 && lon === 0) {
    return NextResponse.json(
      { error: 'Coordinates (0,0) are not supported' },
      { status: 400 },
    );
  }

  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(String(ip))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again shortly.' },
      { status: 429 },
    );
  }

  const cacheKey = buildCacheKey(lat, lon);
  const cached = cache.get<ReverseResult>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
  if (!GEOAPIFY_API_KEY) {
    console.error('❌ GEOAPIFY_API_KEY not configured');
    return NextResponse.json(
      { error: 'Service configuration error' },
      { status: 500 },
    );
  }

  const geoapifyUrl = new URL('https://api.geoapify.com/v1/geocode/reverse');
  geoapifyUrl.searchParams.set('lat', lat.toString());
  geoapifyUrl.searchParams.set('lon', lon.toString());
  geoapifyUrl.searchParams.set('apiKey', GEOAPIFY_API_KEY);
  geoapifyUrl.searchParams.set('format', 'json');

  try {
    const response = await fetch(geoapifyUrl.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Geoapify rate limit exceeded. Please try again later.' },
          { status: 503 },
        );
      }

      if (response.status === 401 || response.status === 403) {
        console.error('❌ Geoapify authentication failed');
        return NextResponse.json(
          { error: 'Service configuration error' },
          { status: 500 },
        );
      }

      throw new Error(`Geoapify reverse geocode failed: ${response.statusText}`);
    }

    const data = await response.json();
    const feature: GeoapifyReverseFeature | undefined = (() => {
      if (Array.isArray(data?.features) && data.features.length > 0) {
        return data.features[0] as GeoapifyReverseFeature;
      }
      if (Array.isArray(data?.results) && data.results.length > 0) {
        const result = data.results[0] as GeoapifyReverseResult;
        return {
          properties: {
            formatted: result.formatted,
            city: result.city,
            state: result.state,
            country: result.country,
            country_code: result.country_code,
          },
        };
      }
      if (data && typeof data === 'object') {
        return {
          properties: {
            formatted: (data as Record<string, any>).formatted,
            city: (data as Record<string, any>).city,
            state: (data as Record<string, any>).state,
            country: (data as Record<string, any>).country,
            country_code: (data as Record<string, any>).country_code,
          },
        };
      }
      return undefined;
    })();

    const result = formatLabel(feature, lat, lon);
    cache.set(cacheKey, result, CACHE_TTL_MS);

    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Geoapify reverse geocode error:', error);
    }

    const fallback = formatLabel(undefined, lat, lon);
    return NextResponse.json(fallback, { status: 200 });
  }
}


