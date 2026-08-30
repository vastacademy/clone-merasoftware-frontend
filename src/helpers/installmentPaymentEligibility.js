// Customer installment-payment eligibility has one frontend rule: the order's
// currentInstallment is the only payable item. The backend advances it only
// after the preceding installment settles.
export const getInstallmentPaymentEligibility = (order, installmentNumber) => {
  const requestedNumber = Number(installmentNumber);
  const installments = Array.isArray(order?.installments) ? order.installments : [];
  const installment = installments.find(
    (item) => Number(item.installmentNumber) === requestedNumber
  );

  if (!installment) {
    return { canPay: false, reason: 'This installment is not available.' };
  }

  if (installment.paid) {
    return { canPay: false, reason: 'This installment has already been paid.' };
  }

  if (installment.paymentStatus === 'pending-approval') {
    return { canPay: false, reason: 'This payment is waiting for verification.' };
  }

  if (requestedNumber !== Number(order?.currentInstallment)) {
    return { canPay: false, reason: 'Complete the previous installment first.' };
  }

  return { canPay: true, reason: '' };
};
