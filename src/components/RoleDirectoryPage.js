import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import SignUp from '../pages/SignUp';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN');
};

const isCurrentMonth = (date) => {
  if (!date) return false;
  const value = new Date(date);
  const now = new Date();
  return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear();
};

const defaultSubtitle = (title) => `Manage all ${title.toLowerCase()} in one place`;

const RoleDirectoryPage = ({
  title,
  role,
  subtitle,
  accent = {
    card: 'text-blue-600',
    header: 'from-blue-50 to-indigo-50',
    chip: 'bg-blue-100 text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
}) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openAddUserModal, setOpenAddUserModal] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.allUser.url, {
        method: SummaryApi.allUser.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.message || `Failed to load ${title.toLowerCase()}`);
        return;
      }

      const filtered = (result.data || []).filter((user) => user.roles?.includes(role));
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (error) {
      console.error(error);
      toast.error(`Error fetching ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [role]);

  useEffect(() => {
    const query = searchTerm.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => (user.status || 'active').toLowerCase() === 'active').length;
    const multiRoleUsers = users.filter((user) => (user.roles || []).length > 1).length;
    const joinedThisMonth = users.filter((user) => isCurrentMonth(user.createdAt)).length;

    return [
      { label: `Total ${title}`, value: users.length, color: 'text-gray-800' },
      { label: `Active ${title}`, value: activeUsers, color: 'text-green-600' },
      { label: 'Multi-role Users', value: multiRoleUsers, color: accent.card },
      { label: 'Joined This Month', value: joinedThisMonth, color: 'text-amber-600' },
    ];
  }, [accent.card, title, users]);

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <p className="mt-2 text-gray-600">{subtitle || defaultSubtitle(title)}</p>
        </div>
        <button
          onClick={() => setOpenAddUserModal(true)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${accent.button}`}
        >
          Add New User
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()} by name, email, or phone...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gradient-to-r ${accent.header} border-b border-gray-200`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Roles</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Join Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="cursor-pointer transition-colors hover:bg-blue-50"
                    onClick={() => navigate(`/admin-panel/users/${user._id}`, { state: { defaultRole: role } })}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.roles && user.roles.length > 0
                        ? user.roles.map((item) => (
                            <span
                              key={item}
                              className={`mr-1 inline-block rounded px-2 py-1 text-xs capitalize ${accent.chip}`}
                            >
                              {item}
                            </span>
                          ))
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No {title.toLowerCase()} found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} {title.toLowerCase()}
      </div>

      {openAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded bg-white p-6 shadow-lg">
            <button
              className="absolute right-2 top-2 text-gray-600 hover:text-gray-900"
              onClick={() => setOpenAddUserModal(false)}
            >
              &times;
            </button>
            <SignUp
              onClose={() => setOpenAddUserModal(false)}
              onUserAdded={() => {
                setOpenAddUserModal(false);
                loadUsers();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleDirectoryPage;
