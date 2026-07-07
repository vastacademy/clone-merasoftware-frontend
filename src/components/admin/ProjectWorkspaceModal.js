import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import SummaryApi from '../../common';

const ProjectWorkspaceModal = ({ project, developers = [], onClose, onProjectUpdated, isReadOnly = false }) => {
  const [currentProject, setCurrentProject] = useState(project);
  const [message, setMessage] = useState('');
  const [projectLink, setProjectLink] = useState(project?.projectLink || '');
  const [selectedDeveloper, setSelectedDeveloper] = useState(
    typeof project?.assignedDeveloper === 'object'
      ? project?.assignedDeveloper?._id || ''
      : project?.assignedDeveloper || ''
  );
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const isCompleted = (currentProject?.projectProgress || 0) >= 100 || currentProject?.currentPhase === 'completed';
  const isRejected = currentProject?.orderVisibility === 'payment-rejected';
  const shouldBeReadOnly = isReadOnly || isCompleted || isRejected;

  const messageTextareaRef = useRef(null);
  const projectLinkRef = useRef(null);

  useEffect(() => {
    setCurrentProject(project);
    setProjectLink(project?.projectLink || '');
    setSelectedDeveloper(
      typeof project?.assignedDeveloper === 'object'
        ? project?.assignedDeveloper?._id || ''
        : project?.assignedDeveloper || ''
    );
    setSelectedCheckpoint(null);
    setMessage('');
    setEditingMessageId(null);
    setShowLinkForm(false);
    setLinkText('');
    setLinkUrl('');
  }, [project]);

  if (!currentProject) return null;

  const getNextCheckpoint = (checkpoints = []) => {
    for (let i = 0; i < checkpoints.length; i += 1) {
      if (!checkpoints[i].completed) return i;
    }
    return checkpoints.length;
  };

  const refreshProject = async () => {
    if (typeof onProjectUpdated !== 'function') return;
    const updatedProject = await onProjectUpdated(currentProject._id);
    if (updatedProject) {
      setCurrentProject(updatedProject);
      setProjectLink(updatedProject.projectLink || '');
      setSelectedDeveloper(
        typeof updatedProject.assignedDeveloper === 'object'
          ? updatedProject.assignedDeveloper?._id || ''
          : updatedProject.assignedDeveloper || ''
      );
    }
  };

  const handleAssignDeveloper = async () => {
    if (!selectedDeveloper) {
      toast.error('Please select a developer');
      return;
    }

    try {
      const response = await fetch(SummaryApi.assignDeveloper.url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: currentProject._id,
          developerId: selectedDeveloper,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || 'Failed to assign developer');
        return;
      }

      toast.success('Developer assigned successfully');
      await refreshProject();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to assign developer');
    }
  };

  const handleSendUpdate = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      if (projectLink !== (currentProject.projectLink || '')) {
        const linkUpdateResponse = await fetch(SummaryApi.updateProjectLink.url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: currentProject._id,
            projectLink,
          }),
        });

        const linkUpdateData = await linkUpdateResponse.json();
        if (!linkUpdateData.success) {
          toast.error(linkUpdateData.message || 'Failed to update project link');
        }
      }

      if (selectedCheckpoint) {
        const progressResponse = await fetch(SummaryApi.updateProjectProgress.url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: currentProject._id,
            checkpointId: selectedCheckpoint.checkpointId,
            name: selectedCheckpoint.name,
            completed: true,
          }),
        });

        const progressData = await progressResponse.json();
        if (!progressData.success) {
          toast.error(progressData.message || 'Failed to update progress');
          return;
        }
      }

      const messageResponse = await fetch(SummaryApi.sendProjectMessage.url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: currentProject._id,
          message: message.trim(),
          messageId: editingMessageId,
          isEdit: Boolean(editingMessageId),
          checkpointId: selectedCheckpoint ? selectedCheckpoint.checkpointId : null,
          checkpointName: selectedCheckpoint ? selectedCheckpoint.name : null,
        }),
      });

      const messageData = await messageResponse.json();
      if (!messageData.success) {
        toast.error(messageData.message || 'Failed to send update');
        return;
      }

      toast.success('Update sent successfully');
      setMessage('');
      setSelectedCheckpoint(null);
      setEditingMessageId(null);
      setShowLinkForm(false);
      setLinkText('');
      setLinkUrl('');
      await refreshProject();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send update');
    }
  };

  const addLinkToMessage = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      toast.error('Please enter both button text and URL');
      return;
    }

    const linkMarkup = `[[${linkText}||${linkUrl}]]`;
    setMessage((prevMessage) => `${prevMessage} ${linkMarkup}`.trim());
    setLinkText('');
    setLinkUrl('');
    setShowLinkForm(false);

    setTimeout(() => {
      if (messageTextareaRef.current) {
        messageTextareaRef.current.focus();
      }
    }, 0);
  };

  const nextCheckpointIndex = getNextCheckpoint(currentProject.checkpoints || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">
              {shouldBeReadOnly ? 'Project Details: ' : 'Edit Project: '}{currentProject.productId?.serviceName}
            </h3>
            {shouldBeReadOnly && (
              <p className="mt-1 text-sm text-gray-600">
                {isRejected ? '🔴 Payment Rejected' : '✅ Completed'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">Client: {currentProject.userId?.name}</p>
          <p className="text-gray-600">Ordered: {new Date(currentProject.createdAt).toLocaleDateString()}</p>
          {currentProject.assignedDeveloper && (
            <p className="text-blue-600">
              Developer: {typeof currentProject.assignedDeveloper === 'object'
                ? currentProject.assignedDeveloper.name
                : 'Assigned'}
            </p>
          )}
        </div>

        {!shouldBeReadOnly ? (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Assigned Developer</label>
              {currentProject.assignedDeveloper && (
                <span className="text-xs text-gray-500">
                  Current: {typeof currentProject.assignedDeveloper === 'object'
                    ? currentProject.assignedDeveloper.name
                    : 'Assigned'}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <select
                value={selectedDeveloper}
                onChange={(e) => setSelectedDeveloper(e.target.value)}
                className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Select a Developer --</option>
                {developers
                  .filter((developer) => developer.status !== 'On Leave')
                  .map((developer) => (
                    <option key={developer._id} value={developer._id}>
                      {developer.name} - {developer.department} ({developer.activeProjects.length}/{developer.workload.maxProjects} projects)
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAssignDeveloper}
                disabled={!selectedDeveloper}
                className={`whitespace-nowrap rounded px-4 py-2 text-sm ${
                  !selectedDeveloper
                    ? 'cursor-not-allowed bg-gray-400 text-white'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {currentProject.assignedDeveloper ? 'Reassign' : 'Assign'}
              </button>
            </div>
            {selectedDeveloper && (
              <div className="mt-3 rounded bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  {currentProject.assignedDeveloper
                    ? 'This will reassign the project to a new developer.'
                    : 'The developer will be notified about this assignment.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 rounded bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">Assigned Developer</p>
            <p className="mt-2 text-gray-900">
              {typeof currentProject.assignedDeveloper === 'object'
                ? currentProject.assignedDeveloper?.name || 'Not assigned'
                : currentProject.assignedDeveloper ? 'Assigned' : 'Not assigned'}
            </p>
          </div>
        )}

        {!shouldBeReadOnly ? (
          <>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                Project Link <span className="text-xs text-gray-500">(Visible to client)</span>
              </label>
              <input
                ref={projectLinkRef}
                type="text"
                value={projectLink}
                onChange={(e) => {
                  setProjectLink(e.target.value);
                  setTimeout(() => {
                    if (projectLinkRef.current) {
                      projectLinkRef.current.focus();
                      const length = e.target.value.length;
                      projectLinkRef.current.setSelectionRange(length, length);
                    }
                  }, 0);
                }}
                placeholder="https://example.com/project"
                className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Enter the URL where the client can view their completed project</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">Update Progress</label>
              <select
                value={selectedCheckpoint ? currentProject.checkpoints.findIndex((cp) => cp.checkpointId === selectedCheckpoint.checkpointId) : ''}
                onChange={(e) => {
                  const selectedIndex = parseInt(e.target.value, 10);
                  if (selectedIndex >= 0) {
                    setSelectedCheckpoint(currentProject.checkpoints[selectedIndex]);
                  } else {
                    setSelectedCheckpoint(null);
                  }
                }}
                className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select checkpoint (optional)...</option>
                {(currentProject.checkpoints || []).map((checkpoint, index) => (
                  <option
                    key={checkpoint.checkpointId}
                    value={index}
                    disabled={index !== nextCheckpointIndex}
                  >
                    {checkpoint.name} ({checkpoint.percentage}%) {checkpoint.completed ? '(Completed)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="mb-6 rounded bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">Project Link</p>
            {currentProject.projectLink ? (
              <a
                href={currentProject.projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-blue-600 hover:text-blue-800 underline break-all"
              >
                {currentProject.projectLink}
              </a>
            ) : (
              <p className="mt-2 text-gray-600">No project link provided</p>
            )}
          </div>
        )}

        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium">Completed Steps</h4>
          <div className="space-y-1">
            {(currentProject.checkpoints || [])
              .filter((checkpoint) => checkpoint.completed)
              .map((checkpoint) => (
                <div key={checkpoint.checkpointId} className="flex items-center text-sm text-gray-600">
                  <span className="mr-2 text-green-500">✓</span>
                  {checkpoint.name}
                </div>
              ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium">Previous Updates</h4>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {(currentProject.messages || []).map((msg, index) => (
              <div key={index} className="flex items-start justify-between rounded bg-gray-50 p-2">
                <div className="flex-1">
                  <p className="text-sm">{msg.message}</p>
                  <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMessage(msg.message);
                    setEditingMessageId(msg.id || index);
                  }}
                  className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        {!shouldBeReadOnly ? (
          <div className="space-y-3">
            {selectedCheckpoint && (
              <div className="rounded bg-blue-50 p-2 text-sm text-blue-600">
                Updating progress to: {selectedCheckpoint.name}
              </div>
            )}
            {editingMessageId && (
              <div className="flex items-center justify-between rounded bg-yellow-50 p-2 text-sm text-yellow-600">
                <span>Editing previous message</span>
                <button
                  type="button"
                  onClick={() => {
                    setMessage('');
                    setEditingMessageId(null);
                  }}
                  className="text-xs text-yellow-700 hover:text-yellow-900"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            {showLinkForm && (
              <div className="rounded border bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium">Add Link Button</h4>
                  <button
                    type="button"
                    onClick={() => setShowLinkForm(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Button Text (e.g. Access Your Software)"
                    className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="URL (e.g. https://example.com)"
                    className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowLinkForm(false)}
                      className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addLinkToMessage}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      Add Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={messageTextareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setTimeout(() => {
                      if (messageTextareaRef.current) {
                        messageTextareaRef.current.focus();
                        const length = e.target.value.length;
                        messageTextareaRef.current.setSelectionRange(length, length);
                      }
                    }, 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.target.selectionStart;
                      const end = e.target.selectionEnd;
                      setMessage(message.substring(0, start) + '    ' + message.substring(end));
                      setTimeout(() => {
                        if (messageTextareaRef.current) {
                          messageTextareaRef.current.setSelectionRange(start + 4, start + 4);
                        }
                      }, 0);
                    }
                  }}
                  placeholder={selectedCheckpoint ? 'Message is required for progress update...' : 'Send update to client...'}
                  className="min-h-[80px] w-full resize-none rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">{message.length} characters</div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={handleSendUpdate}
                  disabled={selectedCheckpoint && !message.trim()}
                  className={`whitespace-nowrap rounded px-4 py-2 text-sm ${
                    selectedCheckpoint && !message.trim()
                      ? 'cursor-not-allowed bg-gray-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {editingMessageId ? 'Save Changes' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkForm(true)}
                  className="whitespace-nowrap rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
                >
                  Add Link
                </button>
              </div>
            </div>

            {message.includes('[[') && message.includes('||') && message.includes(']]') && (
              <div className="mt-3 rounded border bg-gray-50 p-3">
                <p className="mb-2 text-xs font-medium">Preview:</p>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{
                    __html: message.replace(
                      /\[\[(.+?)\|\|(.+?)\]\]/g,
                      '<span class="cursor-pointer rounded bg-blue-100 px-2 py-1 text-blue-600">👉 $1</span>'
                    ),
                  }}
                />
                <p className="mt-2 text-xs text-gray-500">Links will appear as buttons in the client\'s email</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-medium text-gray-700">Progress Status</h4>
              <p className="text-gray-900">
                {(currentProject.projectProgress || 0)}% Complete
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectWorkspaceModal;
