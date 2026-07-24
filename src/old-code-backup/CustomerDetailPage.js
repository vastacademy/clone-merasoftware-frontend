import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SummaryApi from '../common';

const TABS = [
  { id: 'orders',    label: 'Orders & Projects', icon: '📦' },
  { id: 'renewals',  label: 'Renewals',           icon: '🔄' },
  { id: 'payments',  label: 'Payments & Wallet',  icon: '💳' },
  { id: 'invoices',  label: 'Invoices',            icon: '🧾' },
  { id: 'updates',   label: 'Update Requests',     icon: '📝' },
  { id: 'closure',   label: 'Plan Closure',        icon: '🔒' },
];

const CustomerDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  // Customer Info
  const [customer, setCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(true);

  // All data
  const [allData, setAllData] = useState({
    orders: [],
    renewals: [],
    transactions: [],
    invoices: [],
    updates: [],
    plans: [],
  });

  const [loading, setLoading] = useState({
    orders: false,
    renewals: false,
    payments: false,
    invoices: false,
    updates: false,
    closure: false,
  });

  // Fetch customer info
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setCustomerLoading(true);
        const response = await fetch(SummaryApi.allUser.url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const result = await response.json();
        if (result.success) {
          const cust = result.data.find(user => user._id === customerId);
          setCustomer(cust || null);
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      } finally {
        setCustomerLoading(false);
      }
    };

    if (customerId) fetchCustomer();
  }, [customerId]);

  // Fetch all data in parallel
  useEffect(() => {
    if (!customerId) return;

    const fetchAllData = async () => {
      try {
        const results = await Promise.allSettled([
          fetch(SummaryApi.ordersList.url, { method: SummaryApi.ordersList.method, credentials: 'include' }),
          fetch(SummaryApi.getPendingRenewals.url, { method: SummaryApi.getPendingRenewals.method, credentials: 'include' }),
          fetch(SummaryApi.wallet.pendingTransactions.url, { method: SummaryApi.wallet.pendingTransactions.method, credentials: 'include' }),
          fetch(SummaryApi.wallet.adminTransactionHistory.url, { method: SummaryApi.wallet.adminTransactionHistory.method, credentials: 'include' }),
          fetch(SummaryApi.invoices.getAllInvoices.url, { method: SummaryApi.invoices.getAllInvoices.method, credentials: 'include' }),
          fetch(SummaryApi.adminUpdateRequests.url, { method: SummaryApi.adminUpdateRequests.method, credentials: 'include' }),
          fetch(SummaryApi.getUpdatePlans.url, { method: SummaryApi.getUpdatePlans.method, credentials: 'include' }),
        ]);

        const parseData = async (result) => {
          if (result.status === 'fulfilled') {
            const json = await result.value.json();
            return json.success ? (json.data || []) : [];
          }
          return [];
        };

        const [ordersData, renewalsData, transData, historyData, invoicesData, updatesData, plansData] = await Promise.all(
          results.map(parseData)
        );

        // Filter by customerId
        const filteredOrders = ordersData.filter(o => o.userId?._id === customerId);
        const filteredRenewals = renewalsData.filter(r => r.user?._id === customerId || r.userId?._id === customerId);
        const filteredTransactions = transData.filter(t => t.userId?._id === customerId);
        const filteredHistory = historyData.filter(t => t.userId?._id === customerId);
        const filteredInvoices = invoicesData.filter(i => i.userId?._id === customerId);
        const filteredUpdates = updatesData.filter(u => u.userId?._id === customerId);
        const filteredPlans = plansData.filter(p => p.userId?._id === customerId);

        setAllData({
          orders: filteredOrders,
          renewals: filteredRenewals,
          transactions: [...filteredTransactions, ...filteredHistory],
          invoices: filteredInvoices,
          updates: filteredUpdates,
          plans: filteredPlans,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAllData();
  }, [customerId]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  // Tab Components
  const OrdersTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {allData.orders.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No orders found for this customer</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Order ID</th>
                <th className="px-6 py-3 text-left font-semibold">Product</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Progress</th>
                <th className="px-6 py-3 text-left font-semibold">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allData.orders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{order._id?.slice(-8)}</td>
                  <td className="px-6 py-3">{order.productId?.serviceName || 'N/A'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      order.orderVisibility === 'pending-approval' ? 'bg-yellow-100 text-yellow-800' :
                      order.orderVisibility === 'payment-rejected' ? 'bg-red-100 text-red-800' :
                      order.projectProgress >= 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.orderVisibility === 'pending-approval' ? 'Processing' :
                       order.orderVisibility === 'payment-rejected' ? 'Rejected' :
                       order.projectProgress >= 100 ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-6 py-3">{order.projectProgress || 0}%</td>
                  <td className="px-6 py-3">{formatCurrency(order.totalPrice || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const RenewalsTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {allData.renewals.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No renewals found for this customer</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Renewal ID</th>
                <th className="px-6 py-3 text-left font-semibold">Plan</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allData.renewals.map(renewal => (
                <tr key={renewal._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{renewal._id?.slice(-8)}</td>
                  <td className="px-6 py-3">{renewal.planDetails?.planName || 'N/A'}</td>
                  <td className="px-6 py-3">{formatCurrency(renewal.amount || 0)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      renewal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      renewal.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {renewal.status?.charAt(0).toUpperCase() + renewal.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">{formatDate(renewal.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const PaymentsTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {allData.transactions.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No transactions found for this customer</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-6 py-3 text-left font-semibold">Type</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allData.transactions.map(trans => (
                <tr key={trans._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{formatDate(trans.date || trans.createdAt)}</td>
                  <td className="px-6 py-3">{trans.type || 'N/A'}</td>
                  <td className="px-6 py-3">{formatCurrency(trans.amount || 0)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trans.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      trans.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {trans.status?.charAt(0).toUpperCase() + trans.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">{trans.paymentMethod || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const InvoicesTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {allData.invoices.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No invoices found for this customer</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Invoice #</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Due Date</th>
                <th className="px-6 py-3 text-left font-semibold">Issued Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allData.invoices.map(invoice => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{invoice.invoiceNumber || invoice._id?.slice(-8)}</td>
                  <td className="px-6 py-3">{formatCurrency(invoice.amount || 0)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</td>
                  <td className="px-6 py-3">{formatDate(invoice.invoiceDate || invoice.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const UpdatesTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {allData.updates.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No update requests found for this customer</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Update ID</th>
                <th className="px-6 py-3 text-left font-semibold">Plan</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Assigned Dev</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allData.updates.map(update => (
                <tr key={update._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{update._id?.slice(-8)}</td>
                  <td className="px-6 py-3">{update.updatePlanId?.productId?.serviceName || 'N/A'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      update.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      update.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      update.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {update.status?.replace('_', ' ').charAt(0).toUpperCase() + update.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">{update.assignedDeveloper?.name || 'Unassigned'}</td>
                  <td className="px-6 py-3">{formatDate(update.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const ClosureTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {allData.plans.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No plans found for this customer</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Plan ID</th>
                <th className="px-6 py-3 text-left font-semibold">Product</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Updates Used</th>
                <th className="px-6 py-3 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allData.plans.map(plan => (
                <tr key={plan._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{plan._id?.slice(-8)}</td>
                  <td className="px-6 py-3">{plan.productId?.serviceName || 'N/A'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      plan.planStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {plan.planStatus?.charAt(0).toUpperCase() + plan.planStatus?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">{plan.updatesUsed || 0}</td>
                  <td className="px-6 py-3">{formatDate(plan.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (customerLoading) {
    return <div className="p-6 text-center">Loading customer details...</div>;
  }

  if (!customer) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/admin-panel/clients-services')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="mr-2" size={20} /> Back
        </button>
        <div className="text-center text-gray-500">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin-panel/clients-services')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="mr-2" size={20} /> Back to Clients
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-800">{customer.name}</h1>
          <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600">
            <div><span className="font-semibold">Email:</span> {customer.email}</div>
            <div><span className="font-semibold">Phone:</span> {customer.phone || 'N/A'}</div>
            <div><span className="font-semibold">Status:</span> <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">{customer.status || 'Active'}</span></div>
            <div><span className="font-semibold">Joined:</span> {formatDate(customer.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Buttons */}
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'orders'   && <OrdersTab />}
          {activeTab === 'renewals' && <RenewalsTab />}
          {activeTab === 'payments' && <PaymentsTab />}
          {activeTab === 'invoices' && <InvoicesTab />}
          {activeTab === 'updates'  && <UpdatesTab />}
          {activeTab === 'closure'  && <ClosureTab />}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
