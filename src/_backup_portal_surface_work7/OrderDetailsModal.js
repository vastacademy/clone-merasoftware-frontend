
import React, { useState } from 'react';
import { toast } from 'sonner';

const OrderDetailsModal = ({ isOpen, order, onClose, onApprove, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  
  if (!isOpen || !order) return null;
  
  // Calculate order totals
const originalTotal = order.orderItems.reduce((sum, item) => 
  sum + (item.originalPrice * item.quantity), 0);

// Use the order's final price directly, not sum of item prices  
const finalTotal = order.price;

// Get the total discount amount
const totalDiscount = order.discountAmount || (originalTotal - finalTotal);
  
  // Handle rejection submit
  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    onReject(order._id, rejectionReason);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Order Details</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Customer Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><span className="font-medium">Name:</span> {order.userId?.name || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {order.userId?.email || 'N/A'}</p>
              <p><span className="font-medium">Order Date:</span> {new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
          
          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Order Items</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-right py-2">Original Price</th>
                    <th className="text-right py-2">Final Price</th>
                  </tr>
                </thead>
              {/* Order Items - Display original prices without individual discounts */}
              <tbody>
                {order.orderItems && order.orderItems.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.type === 'main' ? 'Main Product' : 'Additional Feature'}</div>
                      {item.additionalQuantity > 0 && (
                        <div className="text-xs text-gray-500">
                          Additional pages: {item.additionalQuantity}
                        </div>
                      )}
                    </td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">₹{item.originalPrice.toLocaleString()}</td>
                    <td className="text-right py-2">₹{item.originalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Subtotal - Original total without discount */}
                <tr className="border-t">
                  <td colSpan="2" className="py-2 font-medium">Subtotal</td>
                  <td className="text-right py-2 font-medium">₹{originalTotal.toLocaleString()}</td>
                  <td></td>
                </tr>
                
                {/* Show discount at order level only, not individual items */}
                {totalDiscount > 0 && (
                  <tr>
                    <td colSpan="2" className="py-2 font-medium text-green-600">
                      Discount {order.couponApplied ? `(${order.couponApplied})` : ''}
                    </td>
                    <td></td>
                    <td className="text-right py-2 font-medium text-green-600">
                      -₹{totalDiscount.toLocaleString()}
                    </td>
                  </tr>
                )}
                
                {/* Final total after discount */}
                <tr className="font-bold">
                  <td colSpan="2" className="py-2">Total</td>
                  <td></td>
                  <td className="text-right py-2">₹{finalTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
              </table>
            </div>
          </div>
          
          {/* Payment Information */}
          <div className="mb-6">
  <h3 className="text-lg font-medium mb-2">Payment Information</h3>
  <div className="bg-gray-50 p-4 rounded-lg">
    <p>
      <span className="font-medium">Payment Method:</span> 
      {order.paymentMethod === 'wallet' ? 'Wallet Payment' : 
       order.paymentMethod === 'upi' ? 'UPI Payment' : 
       order.paymentMethod === 'combined' ? 'Wallet + UPI' :
       order.paymentMethod === 'combined-pending' ? 'Wallet + UPI (Pending)' :
       order.paymentMethod || 'Unknown'}
    </p>
    
    {order.isPartialPayment && (
      <>
        <p className="mt-2 font-medium">Installment Plan:</p>
        <div className="ml-4">
          <p>Current Installment: #{order.currentInstallment}</p>
          <p>Amount Paid: ₹{order.paidAmount?.toLocaleString() || '0'}</p>
          <p>Remaining Balance: ₹{order.remainingAmount?.toLocaleString() || '0'}</p>
        </div>
      </>
    )}
  </div>
</div>
          
          {/* Approval Controls */}
          <div className="border-t pt-6 mt-6">
            {!isRejecting ? (
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setIsRejecting(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reject Order
                </button>
                <button
                  onClick={() => onApprove(order._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve Order
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium">Provide reason for rejection:</h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                  placeholder="Please provide the reason for rejecting this order..."
                ></textarea>
                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setIsRejecting(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectSubmit}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;