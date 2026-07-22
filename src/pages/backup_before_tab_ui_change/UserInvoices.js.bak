import React, { useState, useEffect } from 'react';
import SummaryApi from '../common';
import { toast } from 'sonner';

const UserInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchInvoices();
    }, [filter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const url = filter === 'all'
                ? SummaryApi.invoices.getUserInvoices.url
                : `${SummaryApi.invoices.getUserInvoices.url}?status=${filter}`;

            const response = await fetch(url, {
                method: SummaryApi.invoices.getUserInvoices.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setInvoices(data.data);
            } else {
                toast.error(data.message || 'Failed to fetch invoices');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'unpaid':
                return 'bg-yellow-100 text-yellow-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const isOverdue = (dueDate, status) => {
        if (status === 'paid' || status === 'cancelled') return false;
        return new Date(dueDate) < new Date();
    };

    const filteredInvoices = filter === 'all'
        ? invoices
        : invoices.filter(inv => inv.status === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading invoices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">My Invoices</h1>
                    <p className="text-gray-600">View and manage your monthly plan invoices</p>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'unpaid', 'paid', 'overdue', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                                    filter === status
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {status}
                                {status !== 'all' && (
                                    <span className="ml-2 bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                                        {invoices.filter(inv => inv.status === status).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Invoices List */}
                {filteredInvoices.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 text-lg">No invoices found</p>
                        <p className="text-gray-500 text-sm mt-2">
                            {filter === 'all'
                                ? 'You don\'t have any invoices yet'
                                : `No ${filter} invoices`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredInvoices.map((invoice) => (
                            <div
                                key={invoice._id}
                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 ${
                                    invoice.status === 'paid' ? 'border-green-500' :
                                    invoice.status === 'overdue' ? 'border-red-500' :
                                    invoice.status === 'unpaid' ? 'border-yellow-500' :
                                    'border-gray-300'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Left Section */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {invoice.invoiceNumber}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadgeColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                            {isOverdue(invoice.dueDate, invoice.status) && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                    ⚠️ OVERDUE
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>
                                                <span className="font-medium">Plan:</span> {invoice.orderId?.productId?.serviceName || 'N/A'}
                                            </p>
                                            <p>
                                                <span className="font-medium">Billing Period:</span>{' '}
                                                {formatDate(invoice.renewalPeriodStart)} - {formatDate(invoice.renewalPeriodEnd)}
                                            </p>
                                            <p>
                                                <span className="font-medium">Invoice Date:</span> {formatDate(invoice.invoiceDate)}
                                            </p>
                                            <p>
                                                <span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}
                                            </p>
                                            {invoice.paidDate && (
                                                <p className="text-green-600">
                                                    <span className="font-medium">Paid On:</span> {formatDate(invoice.paidDate)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Section */}
                                    <div className="flex flex-col items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Amount</p>
                                            <p className="text-2xl font-bold text-purple-600">
                                                ₹{invoice.amount.toLocaleString()}
                                            </p>
                                        </div>

                                        {invoice.status === 'unpaid' || invoice.status === 'overdue' ? (
                                            <button
                                                onClick={() => {
                                                    toast.info('Payment feature will be available soon!');
                                                }}
                                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                                    invoice.status === 'overdue'
                                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                                }`}
                                            >
                                                Pay Now
                                            </button>
                                        ) : invoice.status === 'paid' ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="font-medium">Paid</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Additional Info */}
                                {invoice.notes && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Note:</span> {invoice.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserInvoices;
