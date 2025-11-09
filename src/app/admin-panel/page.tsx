import { redirect } from 'next/navigation';
import { getServerAuthUser } from '@/lib/auth-server';
import AdminPanel from '@/components/admin/AdminPanel';

export default async function AdminPanelPage() {
  const user = await getServerAuthUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  return <AdminPanel />;
}


