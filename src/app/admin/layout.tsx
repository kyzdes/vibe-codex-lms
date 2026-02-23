import { AdminSidebar } from "@/components/layout/admin-sidebar";

export const metadata = {
  title: "Админ-панель",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
