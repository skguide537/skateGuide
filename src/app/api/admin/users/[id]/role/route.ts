import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { updateUserRole } from '@/services/admin.service';
import { handleAdminError } from '../../../_utils/error-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();
    const { role } = body || {};

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be one of: admin, user' },
        { status: 400 }
      );
    }

    const result = await updateUserRole({
      targetUserId: params.id,
      newRole: role,
      actorId: admin._id.toString(),
    });

    return NextResponse.json({ success: true, user: result });
  } catch (error) {
    return handleAdminError(error, `/api/admin/users/${params.id}/role`);
  }
}


