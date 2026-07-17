import React from "react";
import AdminInfoPill from "./AdminInfoPill";

const getStatusLabel = (checkpoint) => (checkpoint?.completed ? "Completed" : "Pending");

const getStatusClassName = (checkpoint) => (
  checkpoint?.completed
    ? "bg-emerald-100 text-emerald-800"
    : "bg-slate-100 text-slate-700"
);

const AdminProjectCheckpointDetail = ({ checkpoint, cumulativeProgress = 0, messages = [], formatDateTime }) => {
  if (!checkpoint) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-500">Select a checkpoint to view its details.</p>
      </div>
    );
  }

  const linkedMessages = Array.isArray(messages)
    ? messages.filter((message) => {
        const messageCheckpointId = message?.checkpointId != null ? Number(message.checkpointId) : null;
        return (
          messageCheckpointId === Number(checkpoint.checkpointId) ||
          (message?.checkpointName && checkpoint?.name && message.checkpointName === checkpoint.name)
        );
      })
    : [];
  const statusLabel = getStatusLabel(checkpoint);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Selected Checkpoint</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{checkpoint.name}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(checkpoint)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <AdminInfoPill label="Checkpoint ID" value={checkpoint.checkpointId || "N/A"} />
        <AdminInfoPill label="Progress Weight" value={`${checkpoint.percentage || 0}%`} />
        <AdminInfoPill label="Total Progress Till Here" value={`${cumulativeProgress}%`} />
        <AdminInfoPill label="Completed At" value={formatDateTime(checkpoint.completedAt)} />
        <AdminInfoPill label="Related Records" value={linkedMessages.length} />
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Checkpoint Records</p>
          <span className="text-xs text-slate-500">
            {linkedMessages.length} record{linkedMessages.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {linkedMessages.length === 0 ? (
            <p className="text-sm text-slate-500">No related record available for this checkpoint.</p>
          ) : (
            linkedMessages.map((message, index) => (
              <div key={message.id || `${checkpoint.checkpointId}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold capitalize text-slate-900">{message.sender || "Unknown"}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(message.timestamp)}</p>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {message.message || "No message details available."}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjectCheckpointDetail;
