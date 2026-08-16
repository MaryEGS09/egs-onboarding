export type DisplayStatus = "Not Started" | "In Progress" | "Ready for Review" | "Changes Required" | "Completed";

export function getDisplayStatus(params: { status: string; reviewStatus: string; completedPhaseCount: number }): DisplayStatus {
  if (params.status === "COMPLETED") return "Completed";
  if (params.status === "PENDING_REVIEW") {
    return params.reviewStatus === "NEEDS_CORRECTION" ? "Changes Required" : "Ready for Review";
  }
  if (params.completedPhaseCount === 0) return "Not Started";
  return "In Progress";
}
