const safeDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getPaymentStatusLabel = (transaction) => {
  if (!transaction?.status) return "N/A";
  return String(transaction.status).replace(/_/g, " ");
};

export const getInvoiceStatusLabel = (invoice) => {
  if (!invoice?.status) return "N/A";
  return String(invoice.status).replace(/_/g, " ");
};

export const getLedgerStatusLabel = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();
  if (["completed", "paid", "approved"].includes(normalizedStatus)) return "Paid";
  if (["pending", "pending-approval", "unpaid", "overdue"].includes(normalizedStatus)) return "Pending";
  if (["rejected", "failed", "cancelled", "canceled"].includes(normalizedStatus)) return "Rejected";
  return status ? String(status).replace(/_/g, " ") : "N/A";
};

export const buildLedgerItems = (transactions = [], invoices = []) => {
  const transactionInvoiceIds = new Set(
    transactions
      .filter((transaction) => transaction?.invoiceId)
      .map((transaction) => String(transaction.invoiceId?._id || transaction.invoiceId))
  );

  return [
    ...transactions.map((transaction) => ({
      id: `transaction-${transaction._id}`,
      kind: "transaction",
      statusLabel: getPaymentStatusLabel(transaction),
      title: transaction.transactionId || transaction.upiTransactionId || `Payment ${String(transaction._id).slice(-6)}`,
      subtitle: `${transaction.sourceType || transaction.type || "payment"} payment`,
      status: transaction.status,
      amount: transaction.amount,
      method: transaction.paymentMethod || "N/A",
      reference: transaction.upiTransactionId || transaction.transactionId || "N/A",
      date: transaction.date || transaction.createdAt,
      raw: transaction,
      sortDate: safeDateTime(transaction.date || transaction.createdAt)?.getTime() || 0,
    })),
    ...invoices
      .filter((invoice) => !transactionInvoiceIds.has(String(invoice._id)))
      .map((invoice) => ({
        id: `invoice-${invoice._id}`,
        kind: "invoice",
        statusLabel: getInvoiceStatusLabel(invoice),
        title: invoice.invoiceNumber || `Invoice ${String(invoice._id).slice(-6)}`,
        subtitle: invoice.orderId?.productId?.serviceName || invoice.serviceName || "Monthly invoice",
        status: invoice.status,
        amount: invoice.amount,
        method: invoice.paymentMethod || "N/A",
        reference: invoice.transactionReference || "N/A",
        date: invoice.paidDate || invoice.invoiceDate || invoice.createdAt,
        raw: invoice,
        sortDate: safeDateTime(invoice.paidDate || invoice.invoiceDate || invoice.createdAt)?.getTime() || 0,
      })),
  ].sort((left, right) => right.sortDate - left.sortDate);
};
