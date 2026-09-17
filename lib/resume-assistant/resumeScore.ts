/**
 * The scoring rubric lives in `resumeHealth.ts`. This module exists as the
 * stable import path for score helpers and deliberately avoids ATS language —
 * the product calls this "Resume Health", not a score, because the rules are
 * our own opinion rather than a measurement of any real screening system.
 */
export {
  calculateResumeHealth,
  HEALTH_MAX,
} from "@/lib/resume-assistant/resumeHealth";

export type { HealthCategoryScore, ResumeHealthReport } from "@/types/suggestion";

/** Colour token for a score, used by the health panel. */
export function healthTone(score: number): "success" | "info" | "warning" | "error" {
  if (score >= 85) return "success";
  if (score >= 70) return "info";
  if (score >= 50) return "warning";
  return "error";
}
