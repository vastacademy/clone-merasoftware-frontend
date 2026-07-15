import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Mail, Send, Wallet } from "lucide-react";
import { toast } from "sonner";
import SummaryApi from "../common";
import AdminLayout from "../components/AdminLayout";

const safeDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value) => {
  const parsed = safeDateTime(value);
  return parsed ? parsed.toLocaleString("en-IN") : "N/A";
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getLedgerStatusLabel = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();
  if (["completed", "paid", "approved"].includes(normalizedStatus)) return "Paid";
  if (["pending", "pending-approval", "unpaid", "overdue"].includes(normalizedStatus)) return "Pending";
  if (["rejected", "failed", "cancelled", "canceled"].includes(normalizedStatus)) return "Rejected";
  return status ? String(status).replace(/_/g, " ") : "N/A";
};

const getBadgeClassName = (label) => {
  switch ((label || "").toLowerCase()) {
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "rejected":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const reminderTemplates = {
  gentle: "This is a friendly reminder that your invoice payment is still pending. Please clear the payment at your earliest convenience.",
  overdue: "Your invoice is overdue. Please clear the pending payment to avoid interruption in service processing.",
  final: "This is a final reminder for your pending invoice payment. Please complete the payment as soon as possible.",
};

const InfoLine = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "N/A"}</p>
  </div>
);

const AdminPaymentRecordDetail = () => {
  const navigate = useNavigate();
  const { customerId, recordType, recordId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [record, setRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState("");
  const [template, setTemplate] = useState("gentle");
  const [customMessage, setCustomMessage] = useState(reminderTemplates.gentle);
  const [markPaidMethod, setMarkPaidMethod] = useState("upi");
  const [markPaidReference, setMarkPaidReference] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const transaction = record?.transaction || null;
  const invoice = record?.invoice || null;
  const primaryStatus = getLedgerStatusLabel(transaction?.status || invoice?.status);
  const canUseInvoiceActions = Boolean(invoice?._id);
  const canSendReminder = Boolean(invoice?._id && ["unpaid", "overdue"].includes(invoice?.status));
  const canMarkPaid = Boolean(invoice?._id && ["unpaid", "overdue"].includes(invoice?.status));
  const canApproveReject = Boolean(transaction?.transactionId && transaction?.status === "pending");
  const title = transaction?.transactionId || invoice?.invoiceNumber || "Payment record";
  const amount = transaction?.amount ?? invoice?.amount ?? 0;

  const baseActionUrl = useMemo(
    () => `${SummaryApi.adminPaymentRecord.url}/${customerId}/payment-records/${recordType}/${recordId}`,
    [customerId, recordType, recordId]
  );

  useEffect(() => {
    let isMounted = true;

    const loadRecord = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(baseActionUrl, {
          method: SummaryApi.adminPaymentRecord.method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to load payment record");
        }

        if (isMounted) {
          setRecord(result.data || null);
        }
      } catch (loadError) {
        if (!isMounted) return;
        console.error("Error loading payment record:", loadError);
        setError(loadError.message || "Failed to load payment record");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecord();
    return () => {
      isMounted = false;
    };
  }, [baseActionUrl]);

  useEffect(() => {
    if (!invoice) return;
    setMarkPaidMethod(invoice.paymentMethod || "upi");
    setMarkPaidReference(invoice.transactionReference || "");
  }, [invoice]);

  const handleDownloadInvoice = async () => {
    if (!canUseInvoiceActions || actionLoading) return;

    try {
      setActionLoading("download");
      const response = await fetch(`${baseActionUrl}/download-invoice`, {
        credentials: "include",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Invoice-${invoice.invoiceNumber || invoice._id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice download started");
    } catch (downloadError) {
      console.error("Error downloading invoice:", downloadError);
      toast.error(downloadError.message || "Failed to download invoice");
    } finally {
      setActionLoading("");
    }
  };

  const handleResendInvoice = async () => {
    if (!canUseInvoiceActions || actionLoading) return;

    try {
      setActionLoading("resend");
      const response = await fetch(`${baseActionUrl}/resend-invoice`, {
        method: "post",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to resend invoice");
      }

      toast.success(result.message || "Invoice email resent");
    } catch (resendError) {
      console.error("Error resending invoice:", resendError);
      toast.error(resendError.message || "Failed to resend invoice");
    } finally {
      setActionLoading("");
    }
  };

  const handleApproveTransaction = async () => {
    if (!canApproveReject || actionLoading) return;

    try {
      setActionLoading("approve");
      const response = await fetch(SummaryApi.wallet.approveTransaction.url, {
        method: SummaryApi.wallet.approveTransaction.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: transaction.transactionId }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to approve payment");
      }

      setRecord((prev) => ({
        ...prev,
        transaction: result.data?.transaction || prev?.transaction,
        invoice: result.data?.invoice || prev?.invoice,
      }));
      toast.success(result.message || "Payment approved");
    } catch (approveError) {
      console.error("Error approving transaction:", approveError);
      toast.error(approveError.message || "Failed to approve payment");
    } finally {
      setActionLoading("");
    }
  };

  const handleRejectTransaction = async () => {
    if (!canApproveReject || actionLoading) return;

    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setActionLoading("reject");
      const response = await fetch(SummaryApi.wallet.rejectTransaction.url, {
        method: SummaryApi.wallet.rejectTransaction.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.transactionId,
          rejectionReason: rejectionReason.trim(),
        }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to reject payment");
      }

      setRecord((prev) => ({
        ...prev,
        transaction: result.data?.transaction || prev?.transaction,
      }));
      setRejectionReason("");
      toast.success(result.message || "Payment rejected");
    } catch (rejectError) {
      console.error("Error rejecting transaction:", rejectError);
      toast.error(rejectError.message || "Failed to reject payment");
    } finally {
      setActionLoading("");
    }
  };

  const handleMarkPaid = async () => {
    if (!canMarkPaid || actionLoading) return;

    try {
      setActionLoading("markPaid");
      const response = await fetch(`${SummaryApi.invoices.markInvoiceAsPaid.url}/${invoice._id}/mark-paid`, {
        method: SummaryApi.invoices.markInvoiceAsPaid.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: markPaidMethod,
          transactionReference: markPaidReference.trim(),
        }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to mark invoice as paid");
      }

      setRecord((prev) => ({
        ...prev,
        transaction: result.data?.transaction || prev?.transaction,
        invoice: result.data?.invoice || prev?.invoice,
      }));
      toast.success(result.message || "Invoice marked as paid");
    } catch (markPaidError) {
      console.error("Error marking invoice paid:", markPaidError);
      toast.error(markPaidError.message || "Failed to mark invoice as paid");
    } finally {
      setActionLoading("");
    }
  };

  const handleTemplateChange = (event) => {
    const nextTemplate = event.target.value;
    setTemplate(nextTemplate);
    setCustomMessage(reminderTemplates[nextTemplate] || reminderTemplates.gentle);
  };

  const handleSendReminder = async () => {
    if (!canSendReminder || actionLoading) return;

    try {
      setActionLoading("reminder");
      const response = await fetch(`${baseActionUrl}/reminder`, {
        method: "post",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          message: customMessage.trim(),
        }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to send reminder");
      }

      setRecord((prev) => ({
        ...prev,
        invoice: result.data?.invoice || prev?.invoice,
      }));
      toast.success(result.message || "Payment reminder sent");
    } catch (reminderError) {
      console.error("Error sending reminder:", reminderError);
      toast.error(reminderError.message || "Failed to send reminder");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-5">
          <button
            type="button"
            onClick={() => navigate(`/admin-panel/clients/${customerId}`, { state: { activeTab: "payments" } })}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Payment & Invoices
          </button>

          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              Loading payment record...
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <>
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-500">
                      <Wallet size={14} />
                      {recordType === "transaction" ? "Transaction Detail" : "Invoice Detail"}
                    </div>
                    <h1 className="mt-4 break-words text-2xl font-bold text-slate-900">{title}</h1>
                    <p className="mt-2 text-sm text-slate-500">
                      Single ledger record from the customer backend source.
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClassName(primaryStatus)}`}>
                      {primaryStatus}
                    </span>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(amount)}</p>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-bold text-slate-900">Transaction</h2>
                    {transaction ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InfoLine label="Transaction ID" value={transaction.transactionId} />
                        <InfoLine label="Status" value={getLedgerStatusLabel(transaction.status)} />
                        <InfoLine label="Source Type" value={transaction.sourceType || transaction.type} />
                        <InfoLine label="Payment Method" value={transaction.paymentMethod} />
                        <InfoLine label="Reference" value={transaction.upiTransactionId || transaction.transactionId} />
                        <InfoLine label="Date" value={formatDateTime(transaction.date || transaction.createdAt)} />
                        <InfoLine label="Verified By" value={transaction.verifiedBy?.name || transaction.verifiedBy?.email} />
                        <InfoLine label="Rejection Reason" value={transaction.rejectionReason} />
                      </div>
                    ) : (
                      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Transaction is not created yet for this pending invoice.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-bold text-slate-900">Invoice</h2>
                    {invoice ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InfoLine label="Invoice Number" value={invoice.invoiceNumber} />
                        <InfoLine label="Status" value={getLedgerStatusLabel(invoice.status)} />
                        <InfoLine label="Plan" value={invoice.orderId?.productId?.serviceName} />
                        <InfoLine label="Due Date" value={formatDateTime(invoice.dueDate)} />
                        <InfoLine label="Invoice Date" value={formatDateTime(invoice.invoiceDate)} />
                        <InfoLine label="Paid Date" value={formatDateTime(invoice.paidDate)} />
                        <InfoLine label="Reminders Sent" value={invoice.remindersSent ?? 0} />
                        <InfoLine label="Last Reminder" value={formatDateTime(invoice.lastReminderDate)} />
                      </div>
                    ) : (
                      <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        No invoice is linked with this legacy payment record.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-bold text-slate-900">Actions</h2>
                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        onClick={handleDownloadInvoice}
                        disabled={!canUseInvoiceActions || Boolean(actionLoading)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Download size={16} />
                        {actionLoading === "download" ? "Preparing..." : "Download Invoice"}
                      </button>
                      <button
                        type="button"
                        onClick={handleResendInvoice}
                        disabled={!canUseInvoiceActions || Boolean(actionLoading)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Mail size={16} />
                        {actionLoading === "resend" ? "Sending..." : "Resend Invoice Email"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-bold text-slate-900">Payment Status Action</h2>
                    {canApproveReject ? (
                      <div className="mt-4 space-y-4">
                        <button
                          type="button"
                          onClick={handleApproveTransaction}
                          disabled={Boolean(actionLoading)}
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === "approve" ? "Approving..." : "Accept Payment"}
                        </button>
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">Reject reason</span>
                          <textarea
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            disabled={Boolean(actionLoading)}
                            rows={3}
                            placeholder="Wrong UPI reference, amount mismatch, duplicate payment, etc."
                            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRejectTransaction}
                          disabled={Boolean(actionLoading) || !rejectionReason.trim()}
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === "reject" ? "Rejecting..." : "Reject Payment"}
                        </button>
                      </div>
                    ) : canMarkPaid ? (
                      <div className="mt-4 space-y-4">
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">Payment method</span>
                          <select
                            value={markPaidMethod}
                            onChange={(event) => setMarkPaidMethod(event.target.value)}
                            disabled={Boolean(actionLoading)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank transfer</option>
                            <option value="cash">Cash</option>
                            <option value="wallet">Wallet</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">Transaction reference</span>
                          <input
                            type="text"
                            value={markPaidReference}
                            onChange={(event) => setMarkPaidReference(event.target.value)}
                            disabled={Boolean(actionLoading)}
                            placeholder="UPI ID, bank reference, or admin note"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleMarkPaid}
                          disabled={Boolean(actionLoading)}
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === "markPaid" ? "Saving..." : "Mark Invoice Paid"}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        No payment approval action is available for this record status.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-bold text-slate-900">Payment Reminder</h2>
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Template</span>
                        <select
                          value={template}
                          onChange={handleTemplateChange}
                          disabled={!canSendReminder || Boolean(actionLoading)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="gentle">Gentle reminder</option>
                          <option value="overdue">Overdue reminder</option>
                          <option value="final">Final reminder</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Message</span>
                        <textarea
                          value={customMessage}
                          onChange={(event) => setCustomMessage(event.target.value)}
                          disabled={!canSendReminder || Boolean(actionLoading)}
                          rows={5}
                          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSendReminder}
                        disabled={!canSendReminder || Boolean(actionLoading) || !customMessage.trim()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Send size={16} />
                        {actionLoading === "reminder" ? "Sending..." : "Send Reminder"}
                      </button>
                    </div>
                    {!canSendReminder ? (
                      <p className="mt-3 text-xs text-slate-500">
                        Reminder is available only for unpaid or overdue invoices.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentRecordDetail;
