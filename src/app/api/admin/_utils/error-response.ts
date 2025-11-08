import { NextResponse } from 'next/server';
import { AdminForbiddenError, AdminUnauthorizedError } from '@/lib/admin-auth';
import { recordAdminLog } from '@/services/admin.service';

const BAD_REQUEST_PREFIX = 'BAD_REQUEST:';
const NOT_FOUND_PREFIX = 'NOT_FOUND:';

export async function handleAdminError(error: unknown, context: string) {
  if (error instanceof AdminUnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof AdminForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  await recordAdminLog({
    category: 'api_error',
    message: error instanceof Error ? error.message : 'Unknown admin API error',
    context,
  });

  if (error instanceof Error && error.message.startsWith(BAD_REQUEST_PREFIX)) {
    const message = error.message.replace(BAD_REQUEST_PREFIX, '').trim();
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (error instanceof Error && error.message.startsWith(NOT_FOUND_PREFIX)) {
    const message = error.message.replace(NOT_FOUND_PREFIX, '').trim();
    return NextResponse.json({ error: message }, { status: 404 });
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  const status =
    error instanceof Error && /not found/i.test(error.message) ? 404 : 500;

  return NextResponse.json({ error: message }, { status });
}


