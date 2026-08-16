import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { QuestionnaireTreeEditor } from "@/components/admin/questionnaire/questionnaire-tree-editor";
import { Button } from "@/components/ui/button";

export default function AdminQuestionnairePage() {
  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Questionnaire</h1>
        <Button variant="outline" asChild size="sm">
          <Link href="/admin/questionnaire/archive">View archived questions</Link>
        </Button>
      </div>
      <QuestionnaireTreeEditor />
    </AdminShell>
  );
}
