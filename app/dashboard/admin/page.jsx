import { redirect } from 'next/navigation';
import { getSessionUser } from '@/utils/getSessionUser';
import AdminConsole from '@/components/AdminConsole';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getSessionUser();
  if (!session) redirect('/account');
  if (session.user.role !== 'admin') redirect('/unauthorized');
  return <AdminConsole />;
}
