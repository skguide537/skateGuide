import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getPendingParks } from '@/services/admin.service';
import { handleAdminError } from '../../_utils/error-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const result = await getPendingParks({ page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return handleAdminError(error, '/api/admin/parks/pending');
  }
}


