import type { Metadata } from 'next';
import { AdminShell } from '@/features/admin/AdminShell';
import { AuthProvider } from '@/features/admin/AuthContext';
import { ToastProvider } from '@/features/admin/Toast';

export const metadata: Metadata = { title: { default: 'Dashboard', template: '%s | CARISCA Admin' }, robots: { index: false, follow: false } };

/** Administration area. All data is loaded client-side through the authenticated API. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </AuthProvider>
  );
}
