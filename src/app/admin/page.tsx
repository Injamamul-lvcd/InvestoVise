import { Metadata } from 'next';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Dashboard | Admin Panel',
  description: 'Admin dashboard overview with key metrics and analytics',
};

export default function AdminPage() {
  return <AdminDashboard />;
}