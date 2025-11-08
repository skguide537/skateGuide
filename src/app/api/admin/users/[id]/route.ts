import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { deleteUserAsAdmin } from '@/services/admin.service';
import { handleAdminError } from '../../_utils/error-response';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    const result = await deleteUserAsAdmin({
      targetUserId: params.id,
      actorId: admin._id.toString(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleAdminError(error, `/api/admin/users/${params.id}`);
  }
}


