const shortId = (value) => (value ? String(value).slice(-5) : "");

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

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

const getOrdinal = (n) => ORDINALS[n - 1] || `${n}th`;

const getPaymentLabel = (transaction) => {
  const source = transaction?.sourceType || transaction?.type;
  if (source === "installment" || transaction?.isInstallmentPayment) {
    return transaction.installmentNumber
      ? `${getOrdinal(transaction.installmentNumber)} Installment`
      : "Installment Payment";
  }
  if (source === "renewal") return "Renewal Payment";
  if (source === "wallet" || source === "deposit") return "Wallet Deposit";
  return "Payment";
};

const getInvoiceLabel = (invoice) => {
  if (invoice?.invoiceType === "plan_renewal") return "Plan Renewal";
  if (invoice?.installmentNumber) return `${getOrdinal(invoice.installmentNumber)} Installment`;
  return "Invoice";
};

export const buildLedgerItems = (transactions = [], invoices = []) => {
  const transactionInvoiceIds = new Set(
    transactions
      .filter((transaction) => transaction?.invoiceId)
      .map((transaction) => String(transaction.invoiceId?._id || transaction.invoiceId))
  );

  return [
    ...transactions.map((transaction) => {
      const serviceName = transaction.orderId?.productId?.serviceName;
      const paymentLabel = getPaymentLabel(transaction);
      return {
        id: `transaction-${transaction._id}`,
        kind: "transaction",
        statusLabel: getPaymentStatusLabel(transaction),
        title: serviceName ? `${serviceName} — ${paymentLabel}` : paymentLabel,
        label: paymentLabel,
        status: transaction.status,
        amount: transaction.amount,
        method: transaction.paymentMethod || "N/A",
        reference: transaction.upiTransactionId || shortId(transaction.transactionId) || "N/A",
        date: transaction.date || transaction.createdAt,
        raw: transaction,
        sortDate: safeDateTime(transaction.date || transaction.createdAt)?.getTime() || 0,
        orderId: transaction.orderId?._id || transaction.orderId || null,
        serviceName: serviceName || null,
        orderStartDate: transaction.orderId?.createdAt || null,
        orderDeleted: Boolean(transaction.orderDeleted),
      };
    }),
    ...invoices
      .filter((invoice) => !transactionInvoiceIds.has(String(invoice._id)))
      .map((invoice) => {
        const serviceName = invoice.orderId?.productId?.serviceName || invoice.serviceName;
        const invoiceLabel = getInvoiceLabel(invoice);
        return {
          id: `invoice-${invoice._id}`,
          kind: "invoice",
          statusLabel: getInvoiceStatusLabel(invoice),
          title: serviceName ? `${serviceName} — ${invoiceLabel}` : invoiceLabel,
          label: invoiceLabel,
          status: invoice.status,
          amount: invoice.amount,
          method: invoice.paymentMethod || "N/A",
          reference: invoice.transactionReference || "N/A",
          date: invoice.paidDate || invoice.invoiceDate || invoice.createdAt,
          raw: invoice,
          sortDate: safeDateTime(invoice.paidDate || invoice.invoiceDate || invoice.createdAt)?.getTime() || 0,
          orderId: invoice.orderId?._id || invoice.orderId || null,
          serviceName: serviceName || null,
          orderStartDate: invoice.orderId?.createdAt || null,
          orderDeleted: Boolean(invoice.orderDeleted),
        };
      }),
  ].sort((left, right) => right.sortDate - left.sortDate);
};

const formatGroupDate = (value) => {
  const parsed = safeDateTime(value);
  if (!parsed) return null;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const groupLedgerItemsByProject = (ledgerItems = []) => {
  const groups = new Map();

  ledgerItems.forEach((item) => {
    let key;
    let baseName;
    if (item.orderId) {
      key = String(item.orderId);
      baseName = item.serviceName || (item.orderDeleted ? "Deleted Project" : "Project");
    } else {
      key = "general";
      baseName = "Wallet / General Payments";
    }

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        baseName,
        startDate: item.orderStartDate || null,
        items: [],
        latestSortDate: 0,
      });
    }
    const group = groups.get(key);
    group.items.push(item);
    group.latestSortDate = Math.max(group.latestSortDate, item.sortDate);
    if (!group.startDate && item.orderStartDate) group.startDate = item.orderStartDate;
  });

  // When two different projects share the same service name (e.g. two "Standard Website"
  // orders), append the project's start date to each so the admin can tell them apart.
  const nameCounts = new Map();
  groups.forEach((group) => {
    nameCounts.set(group.baseName, (nameCounts.get(group.baseName) || 0) + 1);
  });

  return Array.from(groups.values())
    .map((group) => {
      const isAmbiguous = nameCounts.get(group.baseName) > 1 && group.key !== "general";
      const startLabel = formatGroupDate(group.startDate);
      const displayName = isAmbiguous && startLabel ? `${group.baseName} (Started ${startLabel})` : group.baseName;
      return {
        ...group,
        serviceName: displayName,
        items: group.items.slice().sort((a, b) => b.sortDate - a.sortDate),
      };
    })
    .sort((a, b) => b.latestSortDate - a.latestSortDate);
};
