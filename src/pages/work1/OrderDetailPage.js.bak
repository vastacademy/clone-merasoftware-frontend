import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import SummaryApi from '../common';
import DashboardLayout from '../components/DashboardLayout';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import { isOrderApproved } from '../helpers/orderVisibility';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
    // Get user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SummaryApi.orderDetails.url}/${orderId}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  const getOrderStatus = (order) => {
    if (!order) return {};
    
    // Check for rejected status first
    if (order.orderVisibility === 'payment-rejected') {
      return { text: 'Rejected', className: 'bg-red-500 text-white' };
    }
    
    // Check for pending approval (Processing)
    if (order.orderVisibility === 'pending-approval') {
      return { text: 'Processing', className: 'bg-gray-500 text-white' };
    }
    
    // Check for completed
    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      return { text: 'Completed', className: 'bg-green-500 text-white' };
    }
    
    // If not rejected, pending approval, or completed, then it's in progress
    if (isOrderApproved(order)) {
      return { text: 'In Progress', className: 'bg-blue-500 text-white' };
    }
    
    // Fallback (shouldn't reach here often)
    return { text: 'Processing', className: 'bg-gray-500 text-white' };
  };

  const handleDownloadInvoice = async () => {
    try {
      // Only proceed if order is approved or completed
      if (!isOrderApproved(order) && 
          !(order.projectProgress >= 100 || order.currentPhase === 'completed')) {
        return;
      }
      
      // Download invoice API call
      const response = await fetch(`${SummaryApi.downloadInvoice.url}/${orderId}`, {
        method: SummaryApi.downloadInvoice.method,
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  const handleTrackProject = () => {
    navigate(`/project-details/${orderId}`);
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <TriangleMazeLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <h2 className="text-xl font-bold text-red-600 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/order')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const status = getOrderStatus(order);
  const orderNumber = `ORD-${order._id.substr(-4)}`;
  
  // Calculate totals
  const subtotal = order.orderItems ? 
    order.orderItems.reduce((sum, item) => sum + (item.originalPrice * (item.quantity || 1)), 0) : 0;
  
  const discount = order.discountAmount || 0;
  const total = order.price || 0;
  const paidAmount = order.paidAmount || 0;
  const balanceAmount = Math.max(0, total - paidAmount);

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        {/* Header Section */}
        <div className="bg-blue-600 text-white p-6 mb-6 rounded-t-lg flex justify-between items-center">
          <h1 className="text-2xl font-bold">Order Summary</h1>
          <span className={`px-4 py-2 rounded-md text-sm font-medium ${status.className}`}>
            {status.text}
          </span>
        </div>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/order')}
          className="flex items-center text-blue-600 mb-6 hover:underline"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Orders
        </button>
        
        {/* Order Info and Actions Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Order Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="border-b p-6">
                <h2 className="text-xl font-bold">Order #{orderNumber}</h2>
                <p className="text-sm text-gray-500">Purchase Date: {formatDate(order.createdAt)}</p>
                
                <div className="mt-2">
                  <p className="font-medium">{order.productId?.serviceName || 'Product'}</p>
                  <p className="text-gray-600">Category: {order.productId?.category?.split('_').join(' ') || 'General'}</p>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="p-6">
                <h3 className="font-bold text-lg mb-4">Price:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {order.couponApplied ? `(${order.couponApplied})` : ''}:</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Method Details */}
            <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
              <h3 className="font-bold text-lg mb-4">Payment Method</h3>
              
              <p className="mb-4">{order.isPartialPayment ? 'Installment Payment (3 installments)' : 'Full Payment'}</p>
              
              {order.isPartialPayment && order.installments && (
                <div className="space-y-3 mt-4">
                  {order.installments.map((installment, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg ${installment.paid ? 'bg-blue-50' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{index + 1}st Installment </span>
                          {installment.paid && (
                            <span className="text-sm text-gray-500">
                              - Paid ({formatDate(installment.paidDate)})
                            </span>
                          )}
                          {!installment.paid && installment.dueDate && (
                            <span className="text-sm text-gray-500">
                              - Due ({formatDate(installment.dueDate)})
                            </span>
                          )}
                        </div>
                        <span className="font-semibold">₹{installment.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Payment Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span>Paid:</span>
                  <span className="text-green-600 font-medium">₹{paidAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Balance:</span>
                  <span className={`font-medium ${balanceAmount > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                    ₹{balanceAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Actions and Progress */}
          <div className="lg:col-span-1">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <button
                onClick={handleDownloadInvoice}
                disabled={!isOrderApproved(order) && 
                       !(order.projectProgress >= 100 || order.currentPhase === 'completed')}
                className={`w-full py-3 rounded-lg font-medium mb-4 transition-colors ${
                  isOrderApproved(order) || 
                  order.projectProgress >= 100 || 
                  order.currentPhase === 'completed'
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Download Invoice
              </button>
              
              <button
                onClick={handleTrackProject}
                className="w-full py-3 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors mb-4"
              >
                Track Project
              </button>
              
              {/* Show Pay Now button for remaining installments */}
              {order.isPartialPayment && 
              order.installments && 
              order.installments.some(i => !i.paid) && 
              isOrderApproved(order) && (
                <button
                  onClick={() => {
                    // Find next unpaid installment
                    const nextInstallment = order.installments.find(i => !i.paid);
                    if (nextInstallment) {
                      navigate(`/direct-payment`, {
                        state: {
                          installmentPayment: true,
                          orderId: order._id,
                          installmentNumber: nextInstallment.installmentNumber,
                          installmentAmount: nextInstallment.amount,
                          productName: order.productId?.serviceName || 'Product'
                        }
                      });
                    }
                  }}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Pay Next Installment
                </button>
              )}
              
              {/* Retry Payment button for rejected orders */}
              {order.orderVisibility === 'payment-rejected' && (
                <button
                  onClick={() => navigate(`/direct-payment`, {
                    state: { 
                      retryPaymentId: order._id,
                      productId: order.productId?._id,
                      paymentData: {
                        product: order.productId,
                        selectedFeatures: order.orderItems?.filter(item => item.type === 'feature').map(item => ({
                          id: item.id,
                          name: item.name,
                          quantity: item.quantity || 1,
                          sellingPrice: item.originalPrice || 0,
                          totalPrice: item.finalPrice || 0
                        })) || [],
                        totalPrice: order.price,
                        originalTotalPrice: order.originalPrice || order.price
                      }
                    }
                  })}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Retry Payment
                </button>
              )}
            </div>
            
            {/* Order Progress */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-lg mb-6">Order Progress</h3>
              
              <div className="relative flex justify-between mb-6">
                <div className="w-full absolute top-1/2 h-1 bg-gray-200 -translate-y-1/2"></div>
                
                {['Processing', 'Approved', 'In Progress', 'Completed'].map((step, i) => {
                  let active = false;
                  
                  if (status.text === 'Processing' && i === 0) active = true;
                  else if (status.text === 'Rejected' && i === 0) active = true;
                  else if (status.text === 'In Progress' && i <= 2) active = true;
                  else if (status.text === 'Approved' && i <= 1) active = true;
                  else if (status.text === 'Completed' && i <= 3) active = true;
                  
                  // Special handling for rejected orders
                  const isRejected = status.text === 'Rejected';
                  
                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        active 
                          ? (isRejected && i === 0 ? 'bg-red-500' : i === 3 ? 'bg-green-500' : 'bg-blue-500') 
                          : 'bg-gray-200'
                      }`}>
                        {active && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className={`text-xs mt-1 ${active ? 'font-medium' : 'text-gray-500'}`}>
                        {isRejected && i === 0 ? 'Rejected' : step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

};

export default OrderDetailPage;
