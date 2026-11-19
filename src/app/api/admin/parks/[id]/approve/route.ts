import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { approvePark } from '@/services/admin.service';
import { handleAdminError } from '../../../_utils/error-response';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
  try {
    const admin = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const approve = typeof body?.approve === 'boolean' ? body.approve : true;

    const result = await approvePark({
      parkId: id,
      adminId: admin._id.toString(),
      approve,
    });

    return NextResponse.json({
      success: true,
      alreadyApproved: result.alreadyApproved,
    });
  } catch (error) {
    return handleAdminError(error, `/api/admin/parks/${id}/approve`);
  }
}


