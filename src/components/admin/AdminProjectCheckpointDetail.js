import React, { useEffect, useState } from "react";
import AdminInfoPill from "./AdminInfoPill";

const getStatusLabel = (checkpoint) => (checkpoint?.completed ? "Completed" : "Pending");

const getStatusClassName = (checkpoint) => (
  checkpoint?.completed
    ? "bg-emerald-100 text-emerald-800"
    : "bg-slate-100 text-slate-700"
);

const AdminProjectCheckpointDetail = ({
  checkpoint,
  cumulativeProgress = 0,
  messages = [],
  updateMode = false,
  updateModeLabel = "Update Node",
  allCheckpoints = [],
  selectedUpdateKeys = [],
  updateMessage = "",
  onUpdateSelectionChange,
  onUpdateMessageChange,
  canCompleteNodes = false,
  formatDateTime,
}) => {
  const [templates, setTemplates] = useState([
    { id: "progress", name: "Progress Update", message: "Your project has moved forward. We are continuing work on the selected node(s)." },
    { id: "completed", name: "Node Completed", message: "The selected node(s) have been completed successfully." },
    { id: "review", name: "Ready for Review", message: "The selected work is ready for your review. Please share any feedback." },
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isTemplateDirty, setIsTemplateDirty] = useState(false);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const selectedCheckpointKey = checkpoint
    ? `checkpoint-${checkpoint?.checkpointId ?? checkpoint?.checkpointIndex}`
    : null;
  const selectedNodeKey = selectedUpdateKeys[0] || selectedCheckpointKey || "";

  useEffect(() => {
    if (!updateMode || !selectedCheckpointKey || selectedUpdateKeys.length > 0) return;
    onUpdateSelectionChange?.([selectedCheckpointKey]);
  }, [onUpdateSelectionChange, selectedCheckpointKey, selectedUpdateKeys, updateMode]);

  if (updateMode) {
    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
    const handleTemplateChange = (event) => {
      const templateId = event.target.value;
      setSelectedTemplateId(templateId);
      setIsTemplateDirty(false);
      setIsSaveAsOpen(false);
      setSaveAsName("");
      setIsDeleteConfirmOpen(false);
      const template = templates.find((item) => item.id === templateId);
      onUpdateMessageChange?.(template?.message || "");
    };
    const handleSaveTemplate = () => {
      if (!selectedTemplate || !isTemplateDirty) return;
      setTemplates((current) => current.map((template) => (
        template.id === selectedTemplate.id
          ? { ...template, message: updateMessage }
          : template
      )));
      setIsTemplateDirty(false);
    };
    const handleSaveAsTemplate = () => {
      if (!saveAsName.trim() || !updateMessage.trim()) return;
      const template = {
        id: `custom-${Date.now()}`,
        name: saveAsName.trim(),
        message: updateMessage,
      };
      setTemplates((current) => [...current, template]);
      setSelectedTemplateId(template.id);
      setIsTemplateDirty(false);
      setIsSaveAsOpen(false);
      setSaveAsName("");
    };
    const handleDeleteTemplate = () => {
      if (!selectedTemplate) return;
      setTemplates((current) => current.filter((template) => template.id !== selectedTemplate.id));
      setSelectedTemplateId("");
      setIsTemplateDirty(false);
      setIsDeleteConfirmOpen(false);
    };
    const handleNodeChange = (event) => {
      const selectionKey = event.target.value;
      if (!selectionKey) return;
      onUpdateSelectionChange?.([selectionKey]);
    };

    return (
      <div className="rounded-[1.5rem] border border-slate-300 bg-slate-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Project Update</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{updateModeLabel}</h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {updateModeLabel.includes("Send") ? "All nodes completed" : `${selectedUpdateKeys.length} selected`}
          </span>
        </div>

        <div className="mt-4 rounded-[1.25rem] border border-slate-300 bg-white p-4">
          <label className="text-sm font-semibold text-slate-900" htmlFor="admin-update-checkpoints">
            Select node
          </label>
          <select
            id="admin-update-checkpoints"
            value={selectedNodeKey}
            onChange={handleNodeChange}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-800 outline-none focus:border-slate-500"
          >
            {allCheckpoints.map((node, index) => {
              const selectionKey = `checkpoint-${node?.checkpointId ?? node?.checkpointIndex ?? index}`;
              return (
                <option key={selectionKey} value={selectionKey}>
                  {node?.name || "Unnamed checkpoint"}{node?.completed ? " (Completed)" : ""}
                </option>
              );
            })}
          </select>
          <p className="mt-2 text-xs text-slate-500">Current working node is selected by default. All project nodes are available in the dropdown.</p>
        </div>

        <div className="mt-4 rounded-[1.25rem] border border-slate-300 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-900" htmlFor="admin-update-template">
                Message template
              </label>
              <p className="mt-1 text-xs text-slate-500">Choose a template or edit the current message.</p>
            </div>
          </div>
          <select
            id="admin-update-template"
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-800 outline-none focus:border-slate-500"
          >
            <option value="">Choose a template</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>

          {selectedTemplate ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={!isTemplateDirty}
                className={[
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                  isTemplateDirty
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border border-slate-300 bg-white text-slate-400",
                ].join(" ")}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsSaveAsOpen((current) => !current)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Save As
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen((current) => !current)}
                className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Delete
              </button>
            </div>
          ) : null}

          {isDeleteConfirmOpen && selectedTemplate ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <p className="text-xs font-medium text-rose-800">Delete “{selectedTemplate.name}” permanently?</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTemplate}
                  className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                >
                  Delete template
                </button>
              </div>
            </div>
          ) : null}

          {isSaveAsOpen && selectedTemplate ? (
            <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                value={saveAsName}
                onChange={(event) => setSaveAsName(event.target.value)}
                placeholder="New template name"
                className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none focus:border-slate-500"
              />
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={!saveAsName.trim() || !updateMessage.trim()}
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save as new
              </button>
            </div>
          ) : null}
        </div>

        <textarea
          value={updateMessage}
          onChange={(event) => {
            const value = event.target.value;
            onUpdateMessageChange?.(value);
            setIsTemplateDirty(Boolean(selectedTemplate && value !== selectedTemplate.message));
          }}
          placeholder="Write an update message..."
          className="mt-4 min-h-28 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 outline-none focus:border-slate-500"
        />
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={!canCompleteNodes}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete Selected
          </button>
          <button
            type="button"
            disabled={!updateMessage.trim()}
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send Update
          </button>
          {!updateModeLabel.includes("Send") && (
            <button
              type="button"
              disabled={!canCompleteNodes || !updateMessage.trim()}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Complete &amp; Send
            </button>
          )}
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {linkedMessages.length} record{linkedMessages.length === 1 ? "" : "s"}
            </span>
          </div>
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
