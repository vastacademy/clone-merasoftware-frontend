// Shared presentation helpers for client update-request ("submission") surfaces.
//
// Why this file exists: `formatFileSize` was independently redefined in three
// pages (AdminClientWorkspace.js, CustomerDocuments.js, PlanDetails.js) and the
// three copies did not agree — PlanDetails.js's variant reported every file in
// KB, so a 4 MB upload rendered as "4096.0 KB". The status label/tone map lived
// only inside PlanDetails.js (REQUEST_STATUS_META). Both are needed by the admin
// submissions panel too, so they are defined once here rather than copied again.
//
// No JSX in this file — it is a plain helper module like the rest of helpers/.
// getFileIcon returns a lucide-react *component reference*; the caller renders it.

import { FileText, Image as ImageIcon } from "lucide-react";

/**
 * Human-readable byte size. Returns "" for missing/zero so callers can omit the
 * segment entirely instead of printing a meaningless "0 KB".
 */
export const formatFileSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

/** Short type label for a file row, e.g. "pdf" / "png". Falls back to "file". */
export const getFileTypeLabel = (fileType = "") =>
  String(fileType || "").split("/")[1] || "file";

/** Icon component for a file row. Caller renders it: `const Icon = getFileIcon(t)`. */
export const getFileIcon = (fileType = "") =>
  String(fileType || "").startsWith("image/") ? ImageIcon : FileText;

// Update-request status is the `status` enum on updateRequestModel:
// pending | in_progress | completed | rejected.
//
// Two tone sets, same four labels — the portal runs two visual systems and a
// single map would force one surface to wear the other's theme:
//   glass — customer portal (dark glass over BG.png)
//   light — admin panel (white cards on slate)
// Colors follow the zero-blue rule: amber = waiting, emerald = done,
// rose = rejected, neutral slate/white = in progress.
const REQUEST_STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

const REQUEST_STATUS_TONES = {
  glass: {
    pending: "border-amber-400/40 bg-amber-500/20 text-amber-300",
    in_progress: "border-white/25 bg-white/15 text-white",
    completed: "border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
    rejected: "border-rose-400/40 bg-rose-500/20 text-rose-300",
  },
  light: {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    in_progress: "border-slate-200 bg-slate-100 text-slate-700",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

/**
 * Label + badge classes for a submission status.
 * Unknown/missing status falls back to "pending" — a request that exists but
 * carries no status has not been acted on, which is what pending means.
 */
export const getRequestStatusMeta = (status, theme = "light") => {
  const key = REQUEST_STATUS_LABELS[status] ? status : "pending";
  const tones = REQUEST_STATUS_TONES[theme] || REQUEST_STATUS_TONES.light;
  return { label: REQUEST_STATUS_LABELS[key], tone: tones[key] };
};

/**
 * Direct-download URL for a submitted file.
 *
 * submitUpdateRequest.js builds a `downloadLink` per file but updateRequestModel
 * has no `downloadLink` field, so Mongoose drops it on save and stored files
 * carry only `driveFileId`/`driveLink`. The link is therefore derived from
 * driveFileId, with the (unsaved) downloadLink honoured if it is ever present.
 */
export const getFileDownloadLink = (file) => {
  if (!file) return "";
  if (file.downloadLink) return file.downloadLink;
  if (file.driveFileId) return `https://drive.google.com/uc?export=download&id=${file.driveFileId}`;
  return file.driveLink || "";
};

/** Drive viewer URL for a submitted file, falling back to the download link. */
export const getFileViewLink = (file) => {
  if (!file) return "";
  return file.driveLink || file.embedLink || getFileDownloadLink(file);
};
