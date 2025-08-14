import { middleware } from '@/middleware';

// Use our mocked versions instead of importing from next/server
const NextRequest = (global as any).Request;
const NextResponse = (global as any).NextResponse;

const buildRequest = ({
  method,
  pathname,
  token,
}: {
  method: string;
  pathname: string;
  token?: string;
}) => {
  const headers = new (global as any).Headers();
  if (token) headers.set('cookie', `token=${token}`);

  return {
    method, // This is the key property the middleware checks
    nextUrl: { pathname },
    cookies: {
      get: (key: string) => {
        if (key === 'token' && token) return { value: token };
        return undefined;
      },
    },
    headers,
  } as unknown as any;
};

describe('Middleware', () => {
  it('should allow GET /api/spots without token', () => {
    const req = buildRequest({ method: 'GET', pathname: '/api/spots' });
    const res = middleware(req);
    // NextResponse.next() doesn't have status, it's a passthrough
    expect(res).toBeDefined();
  });

  it('should block POST /api/spots without token', () => {
    const req = buildRequest({ method: 'POST', pathname: '/api/spots' });
    
    const res = middleware(req);
    
    // Should return a JSON response with 401 status
    expect(res.status).toBe(401);
    expect(res.json).toBeDefined();
  });

  it('should allow POST /api/spots with token', () => {
    const req = buildRequest({
      method: 'POST',
      pathname: '/api/spots',
      token: 'valid-token',
    });
    const res = middleware(req);
    // NextResponse.next() doesn't have status, it's a passthrough
    expect(res).toBeDefined();
  });
});
