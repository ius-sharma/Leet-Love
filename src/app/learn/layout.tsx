import { requireOwnerPage } from '@/auth/server';
export const dynamic = 'force-dynamic';
export default async function PrivateLayout({children}:{children:React.ReactNode}) {
  await requireOwnerPage();
  return <>{children}</>;
}
