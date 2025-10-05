import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Helper function to check rate limiting
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

// Helper function to sort results by relevance
function sortByRelevance(results: string[], query: string): string[] {
  const lowerQuery = query.toLowerCase();
  
  return results.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // 1. Exact match comes first
    if (aLower === lowerQuery) return -1;
    if (bLower === lowerQuery) return 1;
    
    // 2. Starts with query comes second
    const aStartsWith = aLower.startsWith(lowerQuery);
    const bStartsWith = bLower.startsWith(lowerQuery);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // 3. Contains query comes third
    const aContains = aLower.includes(lowerQuery);
    const bContains = bLower.includes(lowerQuery);
    
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;
    
    // 4. Shorter names come first (more specific)
    return a.length - b.length;
  });
}

// Helper function to deduplicate results
function deduplicateResults(results: Record<string, any>[], field: string, query: string): string[] {
  const seen = new Set<string>();
  const uniqueResults = results
    .map(item => {
      let value: string;
      
      switch (field) {
        case 'street':
          value = item.address?.road || item.display_name.split(',')[0];
          break;
        case 'city':
          value = item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0];
          break;
        case 'country':
          value = item.address?.country || item.display_name.split(',')[0];
          break;
        default:
          value = item.display_name;
      }
      
      return value;
    })
    .filter(Boolean)
    .filter(value => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  
  // Sort by relevance and then limit to 5 results
  return sortByRelevance(uniqueResults, query).slice(0, 5);
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'street', 'city', 'country', or 'address'
    const limit = searchParams.get('limit') || '5';
    const country = searchParams.get('country'); // Optional country context
    const city = searchParams.get('city'); // Optional city context

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters long' }, { status: 400 });
    }

    // Create cache key with context
    const cacheKey = `geocoding:${type}:${query.toLowerCase()}:${country || 'none'}:${city || 'none'}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build OpenStreetMap API URL based on type
    let nominatimUrl: string;
    
    switch (type) {
      case 'street':
        // For street search, include country and city context if available
        let streetQuery = query;
        if (country) streetQuery += `, ${country}`;
        if (city) streetQuery += `, ${city}`;
        // Request more results so we can sort by relevance
        nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(streetQuery)}&addressdetails=1&limit=20&featuretype=street`;
        break;
      case 'city':
        // For city search, include country context if available
        let cityQuery = query;
        if (country) cityQuery += `, ${country}`;
        // Request more results so we can sort by relevance
        nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}&addressdetails=1&limit=20&featuretype=city`;
        break;
      case 'country':
        // Request more results from Nominatim so we can sort and filter them ourselves
        nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=20&featuretype=country`;
        break;
      case 'address':
        nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    // Add user agent header (required by Nominatim)
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'SkateGuide/1.0 (https://skateguide.com)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'OpenStreetMap service is temporarily unavailable due to high traffic. Please try again later.' },
          { status: 503 }
        );
      }
      throw new Error(`OpenStreetMap API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Process results based on type
    let processedResults: any;
    
    if (type === 'address') {
      // For address search, return coordinates
      if (data.length > 0) {
        const result = data[0];
        processedResults = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
          address: result.address
        };
      } else {
        processedResults = null;
      }
    } else {
      // For autocomplete, return deduplicated and sorted suggestions
      processedResults = deduplicateResults(data, type, query);
    }

    // Cache the results for 10 minutes
    cache.set(cacheKey, processedResults, 10 * 60 * 1000);

    return NextResponse.json(processedResults);

  } catch (error: any) {
    // Log error in development, but don't expose details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Geocoding API error:', error);
    }
    
    // Return appropriate error response
    if (error.message.includes('OpenStreetMap API')) {
      return NextResponse.json(
        { error: 'Geocoding service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
