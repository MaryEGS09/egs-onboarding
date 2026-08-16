"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type ClientRow = {
  sessionId: string;
  clientName: string | null;
  businessName: string | null;
  email: string | null;
  status: string;
  completionPercent: number;
  currentPhase: string | null;
  lastActivityAt: string;
  startedAt: string;
  completedAt: string | null;
  mode: string;
  hasVoiceOrVideo: boolean;
  reviewStatus: string;
};

export function AdminClientsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      return res.json() as Promise<ClientRow[]>;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Business</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Completion</TableHead>
          <TableHead>Phase</TableHead>
          <TableHead>Mode</TableHead>
          <TableHead>Voice/Video</TableHead>
          <TableHead>Last Activity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data ?? []).map((row) => (
          <TableRow key={row.sessionId} className="cursor-pointer hover:bg-muted/40">
            <TableCell>
              <Link href={`/admin/clients/${row.sessionId}`} className="font-medium hover:underline">
                {row.clientName ?? "—"}
              </Link>
            </TableCell>
            <TableCell>{row.businessName ?? "—"}</TableCell>
            <TableCell>{row.email ?? "—"}</TableCell>
            <TableCell>
              <Badge variant="outline">{row.status}</Badge>
            </TableCell>
            <TableCell>{row.completionPercent}%</TableCell>
            <TableCell>{row.currentPhase ?? "—"}</TableCell>
            <TableCell>{row.mode}</TableCell>
            <TableCell>{row.hasVoiceOrVideo ? "Yes" : "No"}</TableCell>
            <TableCell>{new Date(row.lastActivityAt).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
