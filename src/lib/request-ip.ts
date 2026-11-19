/**
 * Read the originating address from headers supplied by the hosting proxy.
 * The first X-Forwarded-For value is the client address by convention.
 */
export function getRequestIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  const forwardedIp = forwardedFor?.split(',')[0]?.trim();

  return forwardedIp || headers.get('x-real-ip')?.trim() || 'unknown';
}
