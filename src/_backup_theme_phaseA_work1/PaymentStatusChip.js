import React from 'react';
import { CheckCircle, AlertCircle, Clock, PieChart } from 'lucide-react';
import { isPlanItem } from '../helpers/orderType';

const getPaymentStatus = (order) => {
  if (isPlanItem(order)) {
    if (order?.autoRenewalStatus === 'paused') {
      return { label: 'Overdue', tone: 'rose', icon: AlertCircle };
    }
    return { label: 'Paid', tone: 'emerald', icon: CheckCircle };
  }

  if (order?.isPartialPayment && Array.isArray(order?.installments) && order.installments.length > 0) {
    const hasUnpaid = order.installments.some((installment) => !installment?.paid);
    if (!hasUnpaid) return { label: 'Paid', tone: 'emerald', icon: CheckCircle };

    const hasPaid = order.installments.some((installment) => installment?.paid);
    if (hasPaid) return { label: 'Partial', tone: 'amber', icon: PieChart };

    return { label: 'Pending', tone: 'slate', icon: Clock };
  }

  if ((order?.remainingAmount || 0) > 0) {
    return { label: 'Pending', tone: 'slate', icon: Clock };
  }

  return { label: 'Paid', tone: 'emerald', icon: CheckCircle };
};

const toneClasses = {
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
};

const PaymentStatusChip = ({ order }) => {
  const status = getPaymentStatus(order);
  const Icon = status.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${toneClasses[status.tone]}`}>
      <Icon size={13} />
      {status.label}
    </span>
  );
};

export default PaymentStatusChip;
