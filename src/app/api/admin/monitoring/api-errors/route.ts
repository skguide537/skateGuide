import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getMonitoringLogs } from '@/services/admin.service';
import { handleAdminError } from '../../_utils/error-response';

function parseDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const from = parseDate(searchParams.get('from'));
    const to = parseDate(searchParams.get('to'));
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const logs = await getMonitoringLogs('api_error', { from, to, page, limit });
    return NextResponse.json(logs);
  } catch (error) {
    return handleAdminError(error, '/api/admin/monitoring/api-errors');
  }
}


