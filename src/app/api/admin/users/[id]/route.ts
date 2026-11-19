import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { deleteUserAsAdmin } from '@/services/admin.service';
import { handleAdminError } from '../../_utils/error-response';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
  try {
    const admin = await requireAdmin(request);
    const result = await deleteUserAsAdmin({
      targetUserId: id,
      actorId: admin._id.toString(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleAdminError(error, `/api/admin/users/${id}`);
  }
}


