import { NextRequest } from 'next/server';
import { getUserFromRequest } from './auth-helpers';
import { recordAdminLog } from '@/services/admin.service';

export class AdminUnauthorizedError extends Error {
  statusCode = 401;
}

export class AdminForbiddenError extends Error {
  statusCode = 403;
}

export async function requireAdmin(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    await recordAdminLog({
      category: 'auth_failure',
      message: 'Unauthorized access to admin endpoint',
      context: request.nextUrl.pathname,
    });
    const error = new AdminUnauthorizedError('Unauthorized - Please login');
    throw error;
  }

  if (user.role !== 'admin') {
    await recordAdminLog({
      category: 'auth_failure',
      message: 'Forbidden access to admin endpoint',
      context: request.nextUrl.pathname,
      details: { userId: user._id?.toString?.() },
    });
    const error = new AdminForbiddenError('Forbidden - Admin access required');
    throw error;
  }

  return user;
}


