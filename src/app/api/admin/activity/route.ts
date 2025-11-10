import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getActivities } from '@/services/admin.service';
import { handleAdminError } from '../_utils/error-response';
import { ActivityType } from '@/models/activity.model';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor') || undefined;
    const typeParam = searchParams.get('type') as ActivityType | null;

    const result = await getActivities({
      limit: limitParam ? Number(limitParam) : undefined,
      cursor,
      type: typeParam ? (typeParam as ActivityType) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleAdminError(error, '/api/admin/activity');
  }
}


