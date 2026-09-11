import React from 'react';
import { CheckCircle, AlertCircle, Clock, PieChart } from 'lucide-react';
import Badge from './Badge';
import { isPlanItem } from '../helpers/orderType';

const getPaymentStatus = (order) => {
  if (isPlanItem(order)) {
    if (order?.autoRenewalStatus === 'paused') {
      return { label: 'Overdue', tone: 'error', icon: AlertCircle };
    }
    return { label: 'Paid', tone: 'success', icon: CheckCircle };
  }

  if (order?.isPartialPayment && Array.isArray(order?.installments) && order.installments.length > 0) {
    const hasUnpaid = order.installments.some((installment) => !installment?.paid);
    if (!hasUnpaid) return { label: 'Paid', tone: 'success', icon: CheckCircle };

    const hasPaid = order.installments.some((installment) => installment?.paid);
    if (hasPaid) return { label: 'Partial', tone: 'pending', icon: PieChart };

    return { label: 'Pending', tone: 'neutral', icon: Clock };
  }

  if ((order?.remainingAmount || 0) > 0) {
    return { label: 'Pending', tone: 'neutral', icon: Clock };
  }

  return { label: 'Paid', tone: 'success', icon: CheckCircle };
};

// The tone names above are Badge's, not colours. They used to map to
// `bg-emerald-50 text-emerald-700` and friends here — a light tint that is an
// opaque patch on the dark themes, and the exact pairing the badge tokens exist
// to make unwritable.
const PaymentStatusChip = ({ order }) => {
  const status = getPaymentStatus(order);

  return (
    <Badge tone={status.tone} icon={status.icon}>
      {status.label}
    </Badge>
  );
};

export default PaymentStatusChip;
