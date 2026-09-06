import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import SummaryApi from '../common';
import { toast } from 'sonner';
import CustomerWorkspaceTabs from '../components/CustomerWorkspaceTabs';
import backgroundImage from '../assets/BG.png';

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
                return 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300';
            case 'unpaid':
                return 'border-amber-400/40 bg-amber-500/20 text-amber-300';
            case 'overdue':
                return 'border-red-400/40 bg-red-500/20 text-red-300';
            case 'cancelled':
                return 'border-white/15 bg-white/10 text-slate-300';
            default:
                return 'border-white/15 bg-white/10 text-slate-300';
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
            <div
                className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14 flex items-center justify-center"
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
                <div className="relative text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
                    <p className="mt-4 text-base text-white">Loading invoices...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

            <div className="relative mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">My Invoices</h1>
                    <p className="mt-1 text-base text-slate-300">View and manage your monthly plan invoices</p>
                </div>

                {/* Card: filter row + invoice list */}
                <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />

                    <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-white" />
                            <h2 className="text-lg font-semibold text-white">Invoices</h2>
                        </div>
                        <CustomerWorkspaceTabs
                            tabs={['all', 'unpaid', 'paid', 'overdue', 'cancelled'].map((status) => ({
                                id: status,
                                label: status === 'all'
                                    ? 'All'
                                    : `${status.charAt(0).toUpperCase()}${status.slice(1)} (${invoices.filter((inv) => inv.status === status).length})`,
                            }))}
                            activeTab={filter}
                            onChange={setFilter}
                            ariaLabel="Invoice status filters"
                            variant="inline"
                        />
                    </div>

                    <div className="relative bg-white/5 px-5 py-5 sm:px-6">
                        {filteredInvoices.length === 0 ? (
                            <div className="p-8 text-center">
                                <FileText className="h-12 w-12 mx-auto text-slate-400" />
                                <p className="mt-4 text-lg font-semibold text-white">No invoices found</p>
                                <p className="text-sm text-slate-300 mt-2">
                                    {filter === 'all'
                                        ? 'You don\'t have any invoices yet'
                                        : `No ${filter} invoices`}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredInvoices.map((invoice, index) => (
                                    <div
                                        key={invoice._id}
                                        className={`rounded-2xl border border-white/10 p-5 ${index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.06]'}`}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Left Section */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {invoice.invoiceNumber}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full border text-sm font-semibold uppercase backdrop-blur-md ${getStatusBadgeColor(invoice.status)}`}>
                                                        {invoice.status}
                                                    </span>
                                                    {isOverdue(invoice.dueDate, invoice.status) && (
                                                        <span className="px-2 py-1 rounded border border-red-400/40 bg-red-500/20 text-red-300 text-sm font-medium">
                                                            ⚠️ OVERDUE
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-sm text-slate-300 space-y-1">
                                                    <p>
                                                        <span className="font-medium text-slate-400">Plan:</span> {invoice.orderId?.productId?.serviceName || 'N/A'}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-400">Billing Period:</span>{' '}
                                                        {formatDate(invoice.renewalPeriodStart)} - {formatDate(invoice.renewalPeriodEnd)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-400">Invoice Date:</span> {formatDate(invoice.invoiceDate)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium text-slate-400">Due Date:</span> {formatDate(invoice.dueDate)}
                                                    </p>
                                                    {invoice.paidDate && (
                                                        <p className="text-emerald-300">
                                                            <span className="font-medium">Paid On:</span> {formatDate(invoice.paidDate)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Section */}
                                            <div className="flex flex-col items-end gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-300">Amount</p>
                                                    <p className="text-2xl font-bold text-white">
                                                        ₹{invoice.amount.toLocaleString()}
                                                    </p>
                                                </div>

                                                {invoice.status === 'unpaid' || invoice.status === 'overdue' ? (
                                                    <button
                                                        onClick={() => {
                                                            toast.info('Payment feature will be available soon!');
                                                        }}
                                                        className={`px-6 py-2 rounded-lg font-medium transition-colors text-white ${
                                                            invoice.status === 'overdue'
                                                                ? 'bg-red-600 hover:bg-red-700'
                                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                                        }`}
                                                    >
                                                        Pay Now
                                                    </button>
                                                ) : invoice.status === 'paid' ? (
                                                    <div className="flex items-center gap-2 text-emerald-300">
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
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <p className="text-sm text-slate-300">
                                                    <span className="font-medium text-slate-400">Note:</span> {invoice.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInvoices;
