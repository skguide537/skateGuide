import { getRequestIp } from '@/lib/request-ip';

describe('getRequestIp', () => {
  it('uses the first address in X-Forwarded-For', () => {
    const headers = new Headers({ 'x-forwarded-for': '198.51.100.12, 10.0.0.4' });

    expect(getRequestIp(headers)).toBe('198.51.100.12');
  });

  it('falls back to X-Real-IP when X-Forwarded-For is absent', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.13' });

    expect(getRequestIp(headers)).toBe('198.51.100.13');
  });

  it('returns unknown when the proxy provides no client address', () => {
    expect(getRequestIp(new Headers())).toBe('unknown');
  });
});
