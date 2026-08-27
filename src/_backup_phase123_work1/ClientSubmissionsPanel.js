import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Download, ExternalLink, Inbox } from "lucide-react";

import {
  formatFileSize,
  getFileDownloadLink,
  getFileIcon,
  getFileTypeLabel,
  getFileViewLink,
  getRequestStatusMeta,
} from "../../helpers/clientSubmissions";

// Admin-side subpage for the data a client submits against a project or plan
// (updateRequestModel: instructions[] + Drive-backed files[]).
//
// This is a SUBPAGE, not an inline card: it is opened from the project/plan detail
// screen and replaces it, with its own Back button — the same open/replace/back shape
// the project subpage itself uses inside AdminClientWorkspace.js. The submissions list
// carries long instruction text and file lists, so it gets its own screen instead of
// competing for room with the Payments card and the node timeline.
//
// Two levels live here: the submissions list, and one submission's detail. Selecting a
// row swaps the list for the detail; Back steps out one level at a time.
//
// Presentation only — this component never fetches. It takes an already-loaded array
// and renders it, which is why it can be reused elsewhere later without change (the
// same reason ClientDocumentsPanel is shaped this way).
//
// Light theme (white cards on slate) because it lives in the admin panel — the customer
// portal glass treatment is not used here. Status colors come from the shared helper so
// the admin and customer surfaces can never drift apart.

const SubmissionFileRow = ({ file }) => {
  const Icon = getFileIcon(file?.type);
  const sizeLabel = formatFileSize(file?.size);
  const typeLabel = getFileTypeLabel(file?.type);
  const downloadLink = getFileDownloadLink(file);
  const viewLink = getFileViewLink(file);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <Icon className="h-5 w-5 shrink-0 text-slate-400" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {file?.originalName || file?.filename || "Untitled file"}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {[sizeLabel, typeLabel].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {viewLink ? (
          <a
            href={viewLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ExternalLink size={13} />
            View
          </a>
        ) : null}
        {downloadLink ? (
          <a
            href={downloadLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <Download size={13} />
            Download
          </a>
        ) : null}
      </div>
    </div>
  );
};

// Level 2 — one submission in full.
const SubmissionDetail = ({ submission, onBack, formatDateTime }) => {
  const meta = getRequestStatusMeta(submission?.status, "light");
  const files = submission?.files || [];
  const instructions = submission?.instructions || [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          Back to Submissions
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold text-slate-900">
            {formatDateTime ? formatDateTime(submission?.createdAt) : "Submission"}
          </h2>
        </div>

        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>
          {meta.label}
        </span>
      </div>

      <div className="space-y-5">
        {/* What the client wrote */}
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Instructions</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {instructions.length} note{instructions.length === 1 ? "" : "s"}
            </span>
          </div>

          {instructions.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              No instructions were sent with this submission.
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {instructions.map((note, index) => (
                <li key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-800">{note?.text}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime ? formatDateTime(note?.timestamp) : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* What the client uploaded */}
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Files</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {files.length} file{files.length === 1 ? "" : "s"}
            </span>
          </div>

          {files.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              No files were attached to this submission.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <SubmissionFileRow key={file?.driveFileId || index} file={file} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Level 1 — the submissions list.
const SubmissionsList = ({
  submissions,
  loading,
  error,
  onBack,
  onOpen,
  recordLabel,
  formatDateTime,
}) => {
  const list = submissions || [];
  const pendingCount = list.filter((item) => item?.status === "pending").length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          Back to {recordLabel}
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold text-slate-900">Client Submissions</h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {pendingCount > 0 ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingCount} pending
            </span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {list.length} record{list.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Submission History</h3>
          <p className="mt-1 text-sm text-slate-500">
            Data and files this client sent through this {String(recordLabel).toLowerCase()}. Open a
            row to read the instructions and download the files.
          </p>
        </div>

        {loading ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
            Loading submissions…
          </div>
        ) : error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : list.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
            <Inbox className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">
              No submissions yet. Anything this client uploads against this record will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
            {list.map((submission, index) => {
              const meta = getRequestStatusMeta(submission?.status, "light");
              const files = submission?.files || [];
              const instructions = submission?.instructions || [];

              return (
                <button
                  key={submission?._id || index}
                  type="button"
                  onClick={() => onOpen(submission)}
                  className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatDateTime ? formatDateTime(submission?.createdAt) : ""}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {files.length} file{files.length === 1 ? "" : "s"} {"·"} {instructions.length}{" "}
                      note{instructions.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <ChevronRight size={16} className="shrink-0 text-slate-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const ClientSubmissionsPanel = ({
  submissions = [],
  loading = false,
  error = "",
  onBack,
  recordLabel = "Project",
  formatDateTime,
}) => {
  // Which submission is open. null = the list. Local because it is pure view state:
  // leaving the subpage should forget it, exactly like the project subpage forgets
  // its selected node.
  const [openSubmission, setOpenSubmission] = useState(null);

  if (openSubmission) {
    return (
      <SubmissionDetail
        submission={openSubmission}
        onBack={() => setOpenSubmission(null)}
        formatDateTime={formatDateTime}
      />
    );
  }

  return (
    <SubmissionsList
      submissions={submissions}
      loading={loading}
      error={error}
      onBack={onBack}
      onOpen={setOpenSubmission}
      recordLabel={recordLabel}
      formatDateTime={formatDateTime}
    />
  );
};

export default ClientSubmissionsPanel;
