import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Lock } from 'lucide-react';
import SummaryApi from '../common';
import { toast } from 'sonner';

const ROLE_OPTIONS = ['admin', 'manager', 'partner', 'customer', 'developer'];

const roleStyles = {
  admin: 'bg-slate-100 text-slate-800 border-slate-200',
  manager: 'bg-pink-100 text-pink-800 border-pink-200',
  partner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  customer: 'bg-blue-100 text-blue-800 border-blue-200',
  developer: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const AddRoleToUserModal = ({ onClose, callFunc, userId }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingAdditions, setPendingAdditions] = useState([]);
  const [pendingRemovals, setPendingRemovals] = useState([]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(SummaryApi.allUser.url, {
        method: SummaryApi.allUser.method,
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast.error(data.message || 'Failed to load users');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error loading users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setPendingAdditions([]);
    setPendingRemovals([]);
  }, [selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const currentRoles = selectedUser?.roles || [];

  const availableRoles = ROLE_OPTIONS.filter(
    (role) => !currentRoles.includes(role) && !pendingAdditions.includes(role)
  );

  const previewRoles = [
    ...currentRoles.filter((role) => !pendingRemovals.includes(role)),
    ...pendingAdditions,
  ];

  const handleAddRole = (role) => {
    setPendingAdditions((prev) => (prev.includes(role) ? prev : [...prev, role]));
  };

  const handleUndoAddition = (role) => {
    setPendingAdditions((prev) => prev.filter((item) => item !== role));
  };

  const handleMarkRemoval = (role) => {
    if (!pendingRemovals.includes(role)) {
      setPendingRemovals((prev) => [...prev, role]);
    }
  };

  const handleUndoRemoval = (role) => {
    setPendingRemovals((prev) => prev.filter((item) => item !== role));
  };

  const handleSaveChanges = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (pendingAdditions.length === 0) {
      if (pendingRemovals.length > 0) {
        toast.info('Role removal will be enabled in the backend integration phase.');
      } else {
        toast.info('No changes to save');
      }
      return;
    }

    try {
      setSaving(true);

      for (const role of pendingAdditions) {
        const response = await fetch(SummaryApi.addRoleToUser.url, {
          method: SummaryApi.addRoleToUser.method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: selectedUserId,
            role,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || `Failed to add ${role}`);
        }
      }

      toast.success('Role changes saved successfully');
      if (pendingRemovals.length > 0) {
        toast.info('Removal requests are shown for preview only and will be enabled in the next phase.');
      }

      await fetchUsers();
      setPendingAdditions([]);
      setPendingRemovals([]);

      if (callFunc) {
        callFunc();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error saving role changes');
    } finally {
      setSaving(false);
    }
  };

  const renderRoleChip = (role, extraContent = null, dimmed = false) => (
    <div
      key={role}
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium capitalize ${
        roleStyles[role] || 'bg-slate-100 text-slate-700 border-slate-200'
      } ${dimmed ? 'opacity-60' : ''}`}
    >
      <span>{role}</span>
      {extraContent}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Manage Access</h2>
            <p className="mt-1 text-sm text-slate-500">
              Role additions can be saved now. Role removal is visible for planning and will be enabled in the next phase.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {!userId && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select User</label>
              <select
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Select User --</option>
                {loadingUsers ? (
                  <option disabled>Loading users...</option>
                ) : (
                  users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {selectedUser ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedUser.name}</h3>
                    <p className="text-sm text-slate-600">{selectedUser.email}</p>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                    {previewRoles.length} active role{previewRoles.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-base font-semibold text-slate-900">Current Roles</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    These roles are currently assigned to the selected user.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {currentRoles.length > 0 ? (
                      currentRoles.map((role) =>
                        renderRoleChip(
                          role,
                          pendingRemovals.includes(role) ? (
                            <button
                              type="button"
                              className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700"
                              onClick={() => handleUndoRemoval(role)}
                            >
                              Undo
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-white"
                              onClick={() => handleMarkRemoval(role)}
                            >
                              Remove
                            </button>
                          ),
                          pendingRemovals.includes(role)
                        )
                      )
                    ) : (
                      <p className="text-sm text-slate-500">No roles assigned</p>
                    )}
                  </div>

                  {pendingRemovals.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Role removal is currently preview-only. Backend support will be connected in the next phase.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-base font-semibold text-slate-900">Available Roles</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add any role that is not already assigned to this user.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {availableRoles.length > 0 ? (
                      availableRoles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleAddRole(role)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium capitalize text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Plus size={15} />
                          {role}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No additional roles available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-base font-semibold text-slate-900">Pending Changes</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review role additions and removal previews before saving.
                </p>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-emerald-700">Roles to Add</h4>
                    <div className="flex flex-wrap gap-3">
                      {pendingAdditions.length > 0 ? (
                        pendingAdditions.map((role) =>
                          renderRoleChip(
                            role,
                            <button
                              type="button"
                              className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700"
                              onClick={() => handleUndoAddition(role)}
                            >
                              Undo
                            </button>
                          )
                        )
                      ) : (
                        <p className="text-sm text-slate-500">No new roles queued</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-amber-700">Roles to Remove</h4>
                    <div className="flex flex-wrap gap-3">
                      {pendingRemovals.length > 0 ? (
                        pendingRemovals.map((role) =>
                          renderRoleChip(
                            role,
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              <Lock size={12} />
                              Pending
                            </span>,
                            true
                          )
                        )
                      ) : (
                        <p className="text-sm text-slate-500">No roles marked for removal</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                This phase is connected to the current backend role-add flow. Additions will be saved immediately. Removal controls are included in the UI so the full management flow is ready for backend integration.
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Select a user to manage roles and access.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || !selectedUserId}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoleToUserModal;
