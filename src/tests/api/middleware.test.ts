import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

const buildRequest = ({
  method,
  pathname,
  token,
}: {
  method: string;
  pathname: string;
  token?: string;
}) => {
  const headers = new Headers();
  if (token) headers.set('cookie', `token=${token}`);

  return {
    method,
    nextUrl: { pathname },
    cookies: {
      get: (key: string) => {
        if (key === 'token' && token) return { value: token };
        return undefined;
      },
    },
    headers,
  } as unknown as NextRequest;
};

describe('Middleware', () => {
  it('should allow GET /api/spots without token', () => {
    const req = buildRequest({ method: 'GET', pathname: '/api/spots' });
    const res = middleware(req);
    expect(res.status).toBe(200); // passthrough
  });

  it('should block POST /api/spots without token', () => {
    const req = buildRequest({ method: 'POST', pathname: '/api/spots' });
    const res = middleware(req);
    const data = res.body?.getReader ? res.body : null;

    expect(res.status).toBe(401);
  });

  it('should allow POST /api/spots with token', () => {
    const req = buildRequest({
      method: 'POST',
      pathname: '/api/spots',
      token: 'valid-token',
    });
    const res = middleware(req);
    expect(res.status).toBe(200); // passthrough
  });
});
