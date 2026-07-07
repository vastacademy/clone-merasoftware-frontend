import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import SummaryApi from '../../common';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let statusText = status;

  switch (status) {
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      statusText = 'Pending';
      break;
    case 'in_progress':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      statusText = 'In Progress';
      break;
    case 'completed':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      statusText = 'Completed';
      break;
    case 'rejected':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      statusText = 'Rejected';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${bgColor} ${textColor}`}>
      {status === 'pending' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
      <span>{statusText}</span>
    </span>
  );
};

const UpdateRequestWorkspaceModal = ({ request, developers = [], onClose, onRequestUpdated }) => {
  const [currentRequest, setCurrentRequest] = useState(request);
  const [message, setMessage] = useState('');
  const [selectedDeveloper, setSelectedDeveloper] = useState(
    request?.assignedDeveloper?._id || request?.assignedDeveloper || ''
  );

  useEffect(() => {
    setCurrentRequest(request);
    setMessage('');
    setSelectedDeveloper(request?.assignedDeveloper?._id || request?.assignedDeveloper || '');
  }, [request]);

  if (!currentRequest) return null;

  const refreshRequest = async () => {
    if (typeof onRequestUpdated !== 'function') return;
    const updatedRequest = await onRequestUpdated(currentRequest._id);
    if (updatedRequest) {
      setCurrentRequest(updatedRequest);
      setSelectedDeveloper(updatedRequest?.assignedDeveloper?._id || updatedRequest?.assignedDeveloper || '');
    }
  };

  const handleAssignDeveloper = async () => {
    if (!selectedDeveloper) {
      toast.error('Please select a developer');
      return;
    }

    try {
      const response = await fetch(SummaryApi.assignUpdateRequestDeveloper.url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: currentRequest._id,
          developerId: selectedDeveloper,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to assign developer');
        return;
      }

      toast.success('Developer assigned successfully');
      await refreshRequest();
    } catch (error) {
      console.error('Error assigning developer:', error);
      toast.error('Failed to assign developer');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const response = await fetch(SummaryApi.updateRequestMessage.url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: currentRequest._id,
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to send message');
        return;
      }

      toast.success('Message sent successfully');
      setMessage('');
      await refreshRequest();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleCompleteRequest = async () => {
    try {
      const response = await fetch(SummaryApi.completeUpdateRequest.url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: currentRequest._id }),
      });

      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to complete request');
        return;
      }

      toast.success('Update request marked as completed');
      localStorage.setItem('dashboardUpdate', JSON.stringify({ type: 'update', timestamp: Date.now() }));
      await refreshRequest();
    } catch (error) {
      console.error('Error completing request:', error);
      toast.error('Failed to complete request');
    }
  };

  const handleDownloadAll = () => {
    if (!currentRequest.files || currentRequest.files.length === 0) {
      toast.info('No files to download');
      return;
    }

    try {
      toast.info(`Preparing ${currentRequest.files.length} files for download...`);
      const downloadUrl = SummaryApi.downloadAllFiles.url.replace(':requestId', currentRequest._id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      console.error('Error initiating download:', error);
      toast.error('Failed to download files');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">Update Request Details</h3>
            <p className="text-sm text-gray-600">Submitted: {formatDate(currentRequest.createdAt)}</p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={currentRequest.status} />
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-2 font-medium">Client Information</h4>
              <p><span className="text-gray-600">Name:</span> {currentRequest.userId?.name}</p>
              <p><span className="text-gray-600">Email:</span> {currentRequest.userId?.email}</p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-2 font-medium">Update Plan</h4>
              <p><span className="text-gray-600">Plan:</span> {currentRequest.updatePlanId?.productId?.serviceName}</p>
              <p><span className="text-gray-600">Updates Used:</span> {currentRequest.updatePlanId?.updatesUsed} of {currentRequest.updatePlanId?.productId?.updateCount}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Developer Assignment</h4>
              {currentRequest.assignedDeveloper && (
                <span className="text-xs text-gray-500">Current: {currentRequest.assignedDeveloper.name}</span>
              )}
            </div>
            <div className="flex gap-3">
              <select
                value={selectedDeveloper}
                onChange={(e) => setSelectedDeveloper(e.target.value)}
                className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Select a Developer --</option>
                {developers.filter((dev) => dev.status !== 'On Leave').map((developer) => (
                  <option key={developer._id} value={developer._id}>
                    {developer.name} - {developer.department} ({developer.activeProjects?.length || 0}/{developer.workload?.maxProjects || 3} projects)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssignDeveloper}
                disabled={!selectedDeveloper}
                className={`rounded px-4 py-2 text-sm whitespace-nowrap ${!selectedDeveloper ? 'cursor-not-allowed bg-gray-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {currentRequest.assignedDeveloper ? 'Reassign' : 'Assign'}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="mb-2 font-medium">Client Instructions</h4>
            <div className="max-h-48 overflow-y-auto rounded-lg border p-4">
              {currentRequest.instructions && currentRequest.instructions.length > 0 ? (
                <div className="space-y-3">
                  {currentRequest.instructions.map((instruction, index) => (
                    <div key={index} className="rounded bg-gray-50 p-3">
                      <p className="text-sm">{instruction.text}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(instruction.timestamp)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-gray-500">No instructions provided</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Uploaded Files</h4>
              {currentRequest.files && currentRequest.files.length > 0 && (
                <button onClick={handleDownloadAll} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">Download All</button>
              )}
            </div>
            <div className="rounded-lg border p-4">
              {currentRequest.files && currentRequest.files.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {currentRequest.files.map((file, index) => (
                    <div key={index} className="flex items-center rounded bg-gray-50 p-3">
                      <div className="mr-3 h-12 w-12 flex-shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                        {file.type && file.type.startsWith('image/') ? 'IMG' : file.type === 'application/pdf' ? 'PDF' : 'DOC'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.originalName || file.filename}</p>
                        <p className="text-xs text-gray-500">{file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <a href={file.downloadLink || `https://drive.google.com/uc?export=download&id=${file.driveFileId}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Download</a>
                        <a href={file.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">View</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-gray-500">No files uploaded</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="mb-2 font-medium">Messages</h4>
            <div className="max-h-48 overflow-y-auto rounded-lg border p-4">
              {currentRequest.developerMessages && currentRequest.developerMessages.length > 0 ? (
                <div className="space-y-3">
                  {currentRequest.developerMessages.map((entry, index) => (
                    <div key={index} className="rounded bg-blue-50 p-3">
                      <p className="text-sm">{entry.message}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(entry.timestamp)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-gray-500">No messages yet</p>
              )}
            </div>
          </div>

          {currentRequest.status !== 'completed' && currentRequest.status !== 'rejected' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message to the client..."
                    className="min-h-[80px] w-full resize-none rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">{message.length} characters</div>
                </div>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className={`rounded px-4 py-2 text-sm ${!message.trim() ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {currentRequest.status === 'in_progress' && (
          <div className="flex justify-end border-t px-6 py-4">
            <button onClick={handleCompleteRequest} className="flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateRequestWorkspaceModal;
