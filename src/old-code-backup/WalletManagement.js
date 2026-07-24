// components/admin/WalletManagement.js
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SummaryApi from '../common';

const WalletManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch all users when component mounts
    useEffect(() => {
        fetchUsers();
    }, []);

    // Function to fetch all users
    const fetchUsers = async () => {
        try {
            const response = await fetch(SummaryApi.allUser.url, {
                method: SummaryApi.allUser.method,
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                // Filter out admin users if needed
                const filteredUsers = data.data.filter(user => user.role !== 'ADMIN');
                setUsers(filteredUsers);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        }
    };

    // Handle form submission
    const handleAddBalance = async (e) => {
        e.preventDefault();
        
        if (!selectedUser || !amount) {
            toast.error("Please select user and enter amount");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(SummaryApi.wallet.addBalance.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    userId: selectedUser,
                    amount: Number(amount)
                })
            });

            const data = await response.json();
            
            if (data.success) {
                toast.success("Balance added successfully!");
                // Reset form
                setSelectedUser('');
                setAmount('');
                // Refresh users list to get updated balance
                fetchUsers();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to add balance");
            console.error("Add balance error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Wallet Management</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
                {/* Add Balance Form */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Add Balance</h3>
                    <form onSubmit={handleAddBalance}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Select User</label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                                required
                            >
                                <option value="">Choose a user</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                                min="1"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Balance'}
                        </button>
                    </form>
                </div>

                {/* Users List with Current Balance */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Users Wallet Status</h3>
                    <div className="overflow-y-auto max-h-96">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">User</th>
                                    <th className="p-2 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} className="border-b">
                                        <td className="p-2">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </td>
                                        <td className="p-2 text-right">
                                            ₹{Math.round(user.walletBalance) || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletManagement;