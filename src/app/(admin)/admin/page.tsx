import { AdminShell } from "@/components/admin/admin-shell";
import { AdminClientsTable } from "@/components/admin/clients/admin-clients-table";

export default function AdminClientsPage() {
  return (
    <AdminShell>
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Clients</h1>
      <AdminClientsTable />
    </AdminShell>
  );
}
