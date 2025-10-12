import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

/**
 * Geoapify Autocomplete API Proxy
 * Provides secure address autocomplete with Hebrew & English support
 * 
 * Features:
 * - Rate limiting (30 req/min per IP)
 * - Response caching (10 min TTL)
 * - Hebrew language support (lang=he)
 * - Structured address results with coordinates
 */

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if IP has exceeded rate limit
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);
  
  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userRequests.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  userRequests.count++;
  return true;
}

/**
 * Geoapify API response feature structure
 */
interface GeoapifyFeature {
  type: string;
  properties: {
    formatted: string;
    address_line1?: string;
    address_line2?: string;
    street?: string;
    housenumber?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
    state?: string;
    country?: string;
    country_code?: string;
    lon: number;
    lat: number;
    place_id: string;
    result_type: string;
    rank?: {
      importance: number;
      confidence: number;
    };
  };
}

/**
 * Our normalized autocomplete result
 */
export interface AutocompleteResult {
  formatted: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  postcode?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  lat: number;
  lon: number;
  placeId: string;
  resultType: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const limit = parseInt(searchParams.get('limit') || '5');

    // Validation
    if (!text) {
      return NextResponse.json(
        { error: 'Missing required parameter: text' },
        { status: 400 }
      );
    }

    if (text.length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `geoapify:autocomplete:${text.toLowerCase()}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get API key from environment
    const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
    if (!GEOAPIFY_API_KEY) {
      console.error('❌ GEOAPIFY_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Build Geoapify API URL
    const geoapifyUrl = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    geoapifyUrl.searchParams.set('text', text);
    geoapifyUrl.searchParams.set('limit', limit.toString());
    geoapifyUrl.searchParams.set('lang', 'he'); // Hebrew support
    geoapifyUrl.searchParams.set('apiKey', GEOAPIFY_API_KEY);

    // Call Geoapify API
    const response = await fetch(geoapifyUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable due to high traffic. Please try again later.' },
          { status: 503 }
        );
      }
      
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Geoapify API authentication failed');
        return NextResponse.json(
          { error: 'Service configuration error' },
          { status: 500 }
        );
      }

      throw new Error(`Geoapify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Geoapify response to our format
    const results: AutocompleteResult[] = (data.features || []).map((feature: GeoapifyFeature) => ({
      formatted: feature.properties.formatted,
      street: feature.properties.street,
      houseNumber: feature.properties.housenumber,
      city: feature.properties.city || feature.properties.suburb,
      postcode: feature.properties.postcode,
      state: feature.properties.state,
      country: feature.properties.country,
      countryCode: feature.properties.country_code,
      lat: feature.properties.lat,
      lon: feature.properties.lon,
      placeId: feature.properties.place_id,
      resultType: feature.properties.result_type,
    }));

    // Cache results for 10 minutes
    cache.set(cacheKey, results, 10 * 60 * 1000);

    return NextResponse.json(results);

  } catch (error: any) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Geoapify autocomplete error:', error);
    }
    
    // Return generic error to client
    return NextResponse.json(
      { error: 'Address search service error. Please try again.' },
      { status: 500 }
    );
  }
}

