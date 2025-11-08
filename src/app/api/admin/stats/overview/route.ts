import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getStatsOverview } from '@/services/admin.service';
import { handleAdminError } from '../../_utils/error-response';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const newUsersDays = searchParams.get('newUsersDays')
      ? Number(searchParams.get('newUsersDays'))
      : undefined;
    const topContributorsLimit = searchParams.get('topContributorsLimit')
      ? Number(searchParams.get('topContributorsLimit'))
      : undefined;

    const stats = await getStatsOverview({
      newUsersDays,
      topContributorsLimit,
    });

    return NextResponse.json(stats);
  } catch (error) {
    return handleAdminError(error, '/api/admin/stats/overview');
  }
}


