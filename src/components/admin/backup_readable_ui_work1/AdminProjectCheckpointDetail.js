import React, { useEffect, useState } from "react";
import AdminInfoPill from "./AdminInfoPill";

const getStatusLabel = (node) => {
  if (node?.status === "deleted") return "Deleted";
  if (node?.status === "archived") return "Archived";
  return "Active";
};

const getStatusClassName = (node) => {
  const label = getStatusLabel(node).toLowerCase();
  if (label === "active") return "bg-emerald-100 text-emerald-800";
  if (label === "deleted") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

const AdminProjectCheckpointDetail = ({
  node,
  currentProjectProgress = 0,
  messages = [],
  updateMode = false,
  updateModeLabel = "Add Node",
  updateMessage = "",
  onUpdateMessageChange,
  formatDateTime,
  onAddNode,
  isSubmitting = false,
  editingNode = null,
  editBounds = null,
  onSaveCorrection,
  onCancelEdit,
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
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodePercentage, setNewNodePercentage] = useState("");

  useEffect(() => {
    if (editingNode) {
      setNewNodeTitle(editingNode.title || "");
      setNewNodePercentage(String(editingNode.cumulativeProgress ?? ""));
    } else {
      setNewNodeTitle("");
      setNewNodePercentage("");
    }
  }, [editingNode]);

  const enteredPercentage = Number(newNodePercentage);
  const isStartingNodeEdit = Boolean(editingNode && editBounds?.isStartingNode);

  // Editing constraints mirror the backend editProjectNode rules exactly:
  //  - starting node: progress is locked at 0%, only title changes
  //  - other node: progress must sit strictly between its neighbours
  //  - new node (not editing): progress must be above current active progress
  let minimumNextPercentage;
  let maximumNextPercentage;
  if (editingNode) {
    minimumNextPercentage = Math.min(100, Number(editBounds?.lowerBound ?? 0) + 0.1);
    maximumNextPercentage = editBounds?.upperBound != null
      ? Math.max(0, Number(editBounds.upperBound) - 0.1)
      : 100;
  } else {
    minimumNextPercentage = Math.min(100, Number(currentProjectProgress || 0) + 0.1);
    maximumNextPercentage = 100;
  }

  const isNewPercentageValid = isStartingNodeEdit
    ? true
    : newNodePercentage !== "" &&
      Number.isFinite(enteredPercentage) &&
      enteredPercentage >= minimumNextPercentage &&
      enteredPercentage <= maximumNextPercentage;
  const canSubmitNode = Boolean(newNodeTitle.trim() && isNewPercentageValid) && !isSubmitting;

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
    return (
      <div className="rounded-[1.25rem] border border-slate-300 bg-slate-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Project Update</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {editingNode ? "Edit Node" : updateModeLabel}
            </h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {editingNode ? "Correction" : (updateModeLabel.includes("Send") ? "Project update" : (node?.title || "New node"))}
          </span>
        </div>

        {editingNode ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Editing "{editingNode.title}" — saving will replace this node with the values below.
          </p>
        ) : null}

        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {editingNode ? "Corrected node details" : "New node update"}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              Current {Number(currentProjectProgress || 0).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <label className="text-xs font-semibold text-slate-700">
              New progress %
              <input
                type="number"
                min={minimumNextPercentage}
                max={maximumNextPercentage}
                step="0.1"
                value={isStartingNodeEdit ? "0" : newNodePercentage}
                onChange={(event) => setNewNodePercentage(event.target.value)}
                placeholder={minimumNextPercentage.toFixed(1)}
                disabled={isStartingNodeEdit}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Node title
              <input
                value={newNodeTitle}
                onChange={(event) => setNewNodeTitle(event.target.value)}
                placeholder="Example: Homepage approved"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <p className={`mt-1.5 text-xs ${newNodePercentage && !isNewPercentageValid ? "text-rose-700" : "text-slate-500"}`}>
            {isStartingNodeEdit
              ? "Starting node stays at 0% — only its title can be changed."
              : `Valid range: ${minimumNextPercentage.toFixed(1)}%–${maximumNextPercentage.toFixed(1)}%.`}
          </p>
        </div>

        <div className="mt-3 rounded-xl border border-slate-300 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-900" htmlFor="admin-update-template">
                Message template
              </label>
              <p className="mt-0.5 text-xs text-slate-500">Choose or edit a template.</p>
            </div>
          </div>
          <select
            id="admin-update-template"
            value={selectedTemplateId}
            onChange={handleTemplateChange}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
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
          className="mt-3 min-h-20 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 outline-none focus:border-slate-500"
        />
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {editingNode ? (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onCancelEdit?.()}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel Edit
              </button>
              <button
                type="button"
                disabled={!canSubmitNode}
                onClick={async () => {
                  await onSaveCorrection?.(editingNode, newNodeTitle.trim(), enteredPercentage, updateMessage.trim());
                }}
                className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Correction"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!canSubmitNode}
                onClick={async () => {
                  await onAddNode?.(newNodeTitle.trim(), enteredPercentage, "");
                  setNewNodeTitle("");
                  setNewNodePercentage("");
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Node"}
              </button>
              <button
                type="button"
                disabled={!canSubmitNode || !updateMessage.trim()}
                onClick={async () => {
                  await onAddNode?.(newNodeTitle.trim(), enteredPercentage, updateMessage.trim());
                  setNewNodeTitle("");
                  setNewNodePercentage("");
                }}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Node & Send"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-500">Select a node to view its details.</p>
      </div>
    );
  }

  const linkedMessages = Array.isArray(messages)
    ? messages.filter((message) => message?.nodeId && message.nodeId === node.nodeId)
    : [];
  const statusLabel = getStatusLabel(node);
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Selected Node</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{node.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(node)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <AdminInfoPill label="Node ID" value={node.nodeId || "N/A"} />
        <AdminInfoPill label="Cumulative Progress" value={`${node.cumulativeProgress || 0}%`} />
        <AdminInfoPill label="Visible To Client" value={node.visibleToClient === false ? "No" : "Yes"} />
        <AdminInfoPill label="Created At" value={formatDateTime(node.createdAt)} />
        <AdminInfoPill label="Related Records" value={linkedMessages.length} />
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Node Records</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {linkedMessages.length} record{linkedMessages.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {linkedMessages.length === 0 ? (
            <p className="text-sm text-slate-500">No related record available for this node.</p>
          ) : (
            linkedMessages.map((message, index) => (
              <div key={message.id || `${node.nodeId}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
