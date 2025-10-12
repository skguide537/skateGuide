import { NextRequest } from 'next/server';

/**
 * Test helper utilities for Next.js API testing
 */

/**
 * Options for creating a mock NextRequest
 */
export interface MockRequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  searchParams?: Record<string, string>;
}

/**
 * Create a mock NextRequest for testing
 * Properly formats the request for Next.js API routes
 * 
 * @param url - Request URL (e.g., '/api/skateparks')
 * @param options - Request options
 */
export function createMockRequest(
  url: string,
  options: MockRequestOptions = {}
): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    cookies = {},
    searchParams = {},
  } = options;

  // Build URL with search params
  const fullUrl = new URL(url, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    fullUrl.searchParams.set(key, value);
  });

  // Create headers
  const headersObj = new Headers(headers);
  
  // Add cookies to headers
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    headersObj.set('cookie', cookieString);
  }

  // Add content-type for POST/PUT requests
  if ((method === 'POST' || method === 'PUT') && body) {
    headersObj.set('content-type', 'application/json');
  }

  // Create request init object
  const requestInit: any = {
    method,
    headers: headersObj,
  };

  // Add body if present
  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(fullUrl, requestInit);
}

/**
 * Create an authenticated NextRequest with token in cookie
 * 
 * @param url - Request URL
 * @param token - JWT authentication token
 * @param options - Additional request options
 */
export function createAuthenticatedRequest(
  url: string,
  token: string,
  options: MockRequestOptions = {}
): NextRequest {
  return createMockRequest(url, {
    ...options,
    cookies: {
      ...options.cookies,
      token,
    },
  });
}

/**
 * Extract JSON from NextResponse
 * Handles the response parsing
 * 
 * @param response - NextResponse from API route
 */
export async function extractJsonResponse(response: Response): Promise<{
  data: any;
  status: number;
  ok: boolean;
}> {
  const data = await response.json();
  
  return {
    data,
    status: response.status,
    ok: response.ok,
  };
}

/**
 * Create params object for dynamic routes
 * Used for routes like /api/skateparks/[id]
 * 
 * @param params - Key-value pairs for route params
 */
export function createRouteParams(params: Record<string, string>): { params: Record<string, string> } {
  return { params };
}

/**
 * Wait for a specific amount of time
 * Useful for testing timeouts or delays
 * 
 * @param ms - Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random MongoDB ObjectId string
 * Useful for testing with non-existent IDs
 */
export function generateRandomObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomHex = 'x'.repeat(16).replace(/x/g, () => 
    Math.floor(Math.random() * 16).toString(16)
  );
  return (timestamp + randomHex).substring(0, 24);
}

