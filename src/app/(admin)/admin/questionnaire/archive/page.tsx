import { AdminShell } from "@/components/admin/admin-shell";
import { ArchivedQuestionsPanel } from "@/components/admin/questionnaire/archived-questions-panel";

export default function AdminQuestionnaireArchivePage() {
  return (
    <AdminShell>
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Archived Questions</h1>
      <ArchivedQuestionsPanel />
    </AdminShell>
  );
}
