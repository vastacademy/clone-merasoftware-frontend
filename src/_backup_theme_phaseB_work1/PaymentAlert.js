import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentAlert = ({
  installmentNumber,
  amount,
  projectId,
  progress,
  paymentStatus,
  onClick
}) => {
  const navigate = useNavigate();
 
  const handleMakePayment = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/installment-payment/${projectId}/${installmentNumber}`);
    }
  };

  // Helper function to determine installment name
  const getInstallmentName = (number) => {
    switch(parseInt(number)) {
      case 1: return 'First Installment (30%)';
      case 2: return 'Second Installment (30%)';
      case 3: return 'Final Installment (40%)';
      default: return `Installment #${number}`;
    }
  };
  
  // If payment is pending approval, show different message
  if (paymentStatus === 'pending-approval') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Payment Verification Pending
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your {getInstallmentName(installmentNumber)} payment is being verified. This process usually takes 1-4 hours.
                Project development will continue once your payment is approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {getInstallmentName(installmentNumber)} Payment Due
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              Your project has reached {Math.round(progress)}% completion. Further progress requires payment of ₹{amount.toLocaleString()}.
              Please make the payment to continue development.
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={handleMakePayment}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Make Payment Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAlert;