"use client";

import { use } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminClientProfile } from "@/components/admin/clients/admin-client-profile";

export default function AdminClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  return (
    <AdminShell>
      <AdminClientProfile sessionId={clientId} />
    </AdminShell>
  );
}
