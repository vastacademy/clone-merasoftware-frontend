import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bell, MessageCircle, X, ArrowLeft, ChevronRight, 
  Send, Clock, Check, ChevronUp, ChevronDown, List, Upload,
  CheckCircle, ExternalLink
} from 'lucide-react';
import SummaryApi from '../common';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
import UpdateRequestModal from '../components/UpdateRequestModal';
import PaymentAlert from '../components/PaymentAlert';

const ProjectDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const timelineRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldShowPaymentAlert, setShouldShowPaymentAlert] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState(null);
  const [user, setUser] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [isProjectPaused, setIsProjectPaused] = useState(false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    // Fetch user from local storage or state management
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [orderId]);

  // Add polling mechanism
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrderDetails();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      // First fetch order data
      const orderResponse = await fetch(`${SummaryApi.orderDetails.url}/${orderId}`, {
        credentials: 'include',
      });
      const orderData = await orderResponse.json();
      
      if (orderData.success) {
        const order = orderData.data;
        
        // Check if this order is visible to the user
        if (order.orderVisibility === 'pending-approval') {
          setOrder({
            ...order,
            isPendingApproval: true,
            pendingMessage: "Your payment is being processed. Project details will be available after admin approval."
          });
          setLoading(false);
          return;
        }
        
        if (order.orderVisibility === 'payment-rejected') {
          setOrder({
            ...order,
            isPaymentRejected: true,
            rejectionReason: order.rejectionReason || "Your payment was rejected. Please retry payment to access this project."
          });
          setLoading(false);
          return;
        }
        
        setOrder(order);

        if (order.messages && order.messages.length > 0) {
          console.log("Message structure check:");
          console.log(order.messages[0]); // Look at the first message
          
          if (order.checkpoints && order.checkpoints.length > 0) {
            console.log("Checkpoint structure check:");
            console.log(order.checkpoints[0]); // Look at the first checkpoint
          }
        }

        if (order.messages && order.messages.length > 0) {
          // Keep these logs for debugging
          console.log("FIRST MESSAGE:", order.messages[0]);
          
          order.messages = order.messages.map((message) => {
            // If the message already has a checkpointName, use it
            if (message.checkpointName) {
              return message;
            }
            
            // If the message has checkpointId, try to find the matching checkpoint
            if (message.checkpointId) {
              const matchedCheckpoint = order.checkpoints.find(cp => 
                cp.checkpointId === message.checkpointId
              );
              
              if (matchedCheckpoint) {
                return {
                  ...message,
                  checkpointName: matchedCheckpoint.name
                };
              }
            }
            
            // Short-term solution: For existing messages, fall back to checkpoint sequence
            // This will gradually be replaced as new messages come in with proper checkpointId
            const index = order.messages.indexOf(message);
            const checkpointIndex = Math.min(index, order.checkpoints.length - 1);
            
            return {
              ...message,
              checkpointName: order.checkpoints[checkpointIndex].name
            };
          });
        }

        // Check if this is a partial payment order and if we should show payment alert
        if (order.isPartialPayment) {
          checkPaymentStatus(order);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };


  const checkPaymentStatus = async (order) => {
    // If project is already completed, don't show payment alert
    if (order.projectProgress >= 100 || order.currentPhase === 'completed') {
      setShouldShowPaymentAlert(false);
      setIsProjectPaused(false);
      return;
    }

    try {
      // Check if there are any pending transactions for this order first
      const pendingTransResponse = await fetch(`${SummaryApi.checkPendingOrderTransactions.url}/${order._id}`, {
        credentials: 'include',
      });
      
      const pendingTransData = await pendingTransResponse.json();
      const hasPendingTransaction = pendingTransData.success && pendingTransData.data.hasPending;
      
      // If there's a pending transaction, show the pending approval alert
      if (hasPendingTransaction) {
        // Get the installment number from the transaction
        const installmentNumber = pendingTransData.data.installmentNumber || 1;
        
        // Find the corresponding installment or create one if it doesn't exist
        let relevantInstallment = order.installments && order.installments.find(
          inst => inst.installmentNumber === installmentNumber
        );

        // If we can't find a relevant installment, create a placeholder
        if (!relevantInstallment) {
          relevantInstallment = {
            installmentNumber: installmentNumber || 1,
            amount: pendingTransData.data.amount || 0,
          };
        }
        
        // Set the current installment with pending-approval status
        setShouldShowPaymentAlert(true);
        setIsProjectPaused(false); // Not paused while payment is being verified
        setCurrentInstallment({
          ...relevantInstallment,
          paymentStatus: 'pending-approval'
        });
        return;
      }
    } catch (error) {
      console.error('Error checking pending transactions:', error);
    }

    // Regular installment check flow
    if (order.installments && order.installments.length > 0) {
      const nextUnpaidInstallment = order.installments.find(inst => !inst.paid);
      
      if (nextUnpaidInstallment) {
        // Check if there's a pending approval for this installment in the order record
        const isPendingApproval = nextUnpaidInstallment.paymentStatus === 'pending-approval';
        
        // If payment is awaiting verification based on order status, show the pending alert
        if (isPendingApproval) {
          setShouldShowPaymentAlert(true);
          setIsProjectPaused(false); // Not paused while payment is being verified
          setCurrentInstallment({
            ...nextUnpaidInstallment,
            paymentStatus: 'pending-approval'
          });
          return;
        }
        
        // Determine if we should show the alert based on progress
        const shouldPause = 
          (nextUnpaidInstallment.installmentNumber === 2 && Math.round(order.projectProgress) >= 40) ||
          (nextUnpaidInstallment.installmentNumber === 3 && Math.round(order.projectProgress) >= 75);
        
        setShouldShowPaymentAlert(shouldPause);
        setIsProjectPaused(shouldPause);
        setCurrentInstallment(nextUnpaidInstallment);
      } else {
        // All installments paid, no alert needed
        setShouldShowPaymentAlert(false);
        setIsProjectPaused(false);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (date) => {
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  const handleMakePayment = () => {
    if (currentInstallment) {
      navigate(`/installment-payment/${orderId}/${currentInstallment.installmentNumber}`);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': 
        return <Check className="w-5 h-5 text-green-500" />;
      case 'in-progress': 
        return <Clock className="w-5 h-5 text-blue-500" />;
      default: 
        return <div className="w-3 h-3 rounded-full bg-gray-300"></div>;
    }
  };

  // Scroll to center active node when timeline expands
  useEffect(() => {
    if (timelineRef.current && order) {
      const container = timelineRef.current;
      const activeNode = container.querySelector('[data-status="in-progress"]');
      
      if (activeNode) {
        // Give DOM time to render and then scroll
        setTimeout(() => {
          activeNode.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    }
  }, [timelineExpanded, order]);

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="rounded-lg p-8">
            <TriangleMazeLoader />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Special rendering for pending approval
  if (order && order.isPendingApproval) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-800">Payment Processing</h3>
                <div className="mt-2 text-blue-700">
                  <p>{order.pendingMessage}</p>
                  <p className="mt-2">This process usually takes 1-4 hours. You'll receive a notification once your payment is approved.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Special rendering for rejected payments
  if (order && order.isPaymentRejected) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Payment Rejected</h3>
                <div className="mt-2 text-red-700">
                  <p>Your payment for this project was rejected.</p>
                  <p className="mt-2 font-medium">Reason: {order.rejectionReason || "Payment verification failed"}</p>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Back to Dashboard
                  </button>
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
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Retry Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <h2 className="text-xl font-bold text-red-600 mb-2">Project Not Found</h2>
            <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Calculate progress percentage
  const completedNodes = order.checkpoints ? 
    order.checkpoints.filter(checkpoint => checkpoint.completed).length : 0;
  const inProgressNodes = order.checkpoints ? 
    order.checkpoints.filter(checkpoint => !checkpoint.completed && checkpoint === order.checkpoints.find(cp => !cp.completed)).length : 0;
  const progressPercentage = Math.round(order.projectProgress);
  
  // Sort checkpoints in original order
  const sortedCheckpoints = order.checkpoints ? 
    [...order.checkpoints].sort((a, b) => {
      // If names include numbers, try to sort by those numbers
      const aMatch = a.name.match(/(\d+)/);
      const bMatch = b.name.match(/(\d+)/);
      if (aMatch && bMatch) {
        return parseInt(aMatch[0]) - parseInt(bMatch[0]);
      }
      return 0; // Keep original order if no numbers found
    }) : [];

  // Get the current in-progress checkpoint
  const inProgressCheckpoint = sortedCheckpoints.find(checkpoint => !checkpoint.completed);
  
  // Get the next upcoming checkpoint (only one)
  const nextUpcomingCheckpoint = inProgressCheckpoint ? 
    sortedCheckpoints.find(checkpoint => 
      !checkpoint.completed && checkpoint !== inProgressCheckpoint
    ) : null;
  
  // Define visible nodes for the timeline - completed + in-progress + next upcoming
  const visibleCheckpoints = [
    ...sortedCheckpoints.filter(checkpoint => checkpoint.completed),
    inProgressCheckpoint,
    nextUpcomingCheckpoint
  ].filter(Boolean); // Remove undefined values

  return (
    <DashboardLayout user={user}>
      <div className="w-full max-w-4xl mx-auto p-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl">
          {/* Header with blue background */}
          <div className="bg-blue-600 p-6 border-b border-blue-700">
            <h1 className="text-2xl font-bold text-white">{order.productId?.serviceName}</h1>
            <p className="text-blue-100 text-sm mt-1">Type: {order.productId?.category?.split('_').join(' ')}</p>
          </div>
          
          {/* Payment Alert Banner */}
          {shouldShowPaymentAlert && currentInstallment && (
            <PaymentAlert 
              installmentNumber={currentInstallment.installmentNumber}
              amount={currentInstallment.amount}
              projectId={orderId}
              progress={Math.round(order.projectProgress)}
              paymentStatus={currentInstallment.paymentStatus || 'none'}
              onClick={handleMakePayment}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
            {/* Circular Progress Meter */}
            <div className="md:col-span-1 flex flex-col items-center justify-start">
              <div className="relative w-40 h-40">
                {/* Background circle */}
                <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
                
                {/* Progress circle */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke={isProjectPaused ? "#EF4444" : "#2563EB"}
                    strokeWidth="8"
                    strokeDasharray={`${progressPercentage * 2.89} 1000`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-blue-700">{progressPercentage}%</span>
                  <span className="text-sm text-gray-500">Complete</span>
                  {isProjectPaused && (
                    <span className="text-xs font-semibold text-red-500 mt-1">PAUSED</span>
                  )}
                </div>
              </div>
              
              {/* Current Stage */}
              <div className="mt-6 text-center w-full">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Current Stage</h3>
                <div className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer transform hover:scale-105">
                  <button
                    onClick={() => setUpdateModalOpen(true)}
                    className="w-full flex items-center justify-center"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    <span className="font-medium">Request Update</span>
                  </button>
                </div>

                 {/* View Project Button - Only show if projectLink exists */}
          {order.projectLink && order.projectLink.trim() !== '' && (
            <div className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer transform hover:scale-105">
              <a
                href={order.projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                <span className="font-medium">View Project</span>
              </a>
            </div>
          )}
              </div>
            </div>
            
            {/* Timeline with Snap Scrolling - Desktop Version */}
            <div className="hidden md:flex md:col-span-2 md:flex-col">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Progress Timeline</h2>
              <div 
                ref={timelineRef}
                className="relative overflow-y-auto pr-2 rounded-lg bg-gray-50" 
                style={{ 
                  height: "320px", 
                  scrollSnapType: "y proximity",
                  scrollBehavior: "smooth"
                }}
              >
                {/* Timeline nodes with simplified layout */}
                <div className="relative p-4">
                  {/* Vertical line running through all nodes */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                  
                  <div className="space-y-3">
                    {visibleCheckpoints.map((checkpoint) => {
                      const isCompleted = checkpoint.completed;
                      const isInProgress = !isCompleted && checkpoint === inProgressCheckpoint;
                      const status = isCompleted ? 'completed' : (isInProgress ? 'in-progress' : 'pending');
                      
                      return (
                        <div 
                          key={checkpoint.checkpointId}
                          data-status={status}
                          className={`relative flex rounded-lg transition-all duration-300 ${
                            isInProgress ? 'bg-blue-50 p-4 shadow-sm border-l-4 border-blue-500' : 
                            isCompleted ? 'p-4 hover:bg-blue-50' : 'p-4'
                          }`}
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          {/* Node dot */}
                          <div 
                            className={`z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isCompleted ? 'border-2 border-green-500' :
                              isInProgress ? 'border-2 border-blue-500' :
                              'border-2 border-gray-300 '
                            }`}
                            style={{ marginLeft: "0.5px" }}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : isInProgress ? (
                              <Clock className="w-4 h-4 text-blue-500" />
                            ) : (
                              <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                            )}
                          </div>
                          
                          {/* Content - Left side */}
                          <div className="ml-4 flex-1">
                            <h3 className="text-md font-medium text-gray-800">{checkpoint.name}</h3>
                            <p className={`text-sm ${
                              isCompleted ? 'text-green-600' : 
                              isInProgress ? 'text-blue-600' : 
                              'text-gray-600'
                            }`}>
                              {isCompleted ? 'Completed' : 
                              isInProgress ? 'In Progress' : 'Upcoming'}
                            </p>
                            
                            {/* Show related messages if any */}
                            {order.messages && order.messages.filter(msg => msg.checkpointId === checkpoint.checkpointId).length > 0 && (
                              <div className="mt-1">
                                <span className="text-sm text-blue-500">
                                  {order.messages.filter(msg => msg.checkpointId === checkpoint.checkpointId).length} updates
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Right side - date */}
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500">
                              {checkpoint.completedAt ? formatDate(checkpoint.completedAt) : 'Upcoming'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Timeline Section - Collapsed by default */}
            <div className="md:hidden w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Progress Timeline</h2>
                <button 
                  onClick={() => setTimelineExpanded(!timelineExpanded)}
                  className="flex items-center justify-center bg-blue-50 text-blue-500 p-2 rounded-md transition-colors hover:bg-blue-100"
                >
                  {timelineExpanded ? (
                    <><X className="w-4 h-4 mr-1" /> Close</>
                  ) : (
                    <><List className="w-4 h-4 mr-1" /> View</>
                  )}
                </button>
              </div>
              
              {/* Current progress summary for mobile - always visible */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100 shadow-sm">
                <div className="flex items-center">
                  {getStatusIcon(inProgressCheckpoint ? 'in-progress' : 'completed')}
                  <div className="ml-3">
                    <p className="font-medium text-blue-800">
                      {inProgressCheckpoint ? inProgressCheckpoint.name : 'All Tasks Completed'}
                    </p>
                    <p className="text-sm text-blue-600">
                      {completedNodes} of {sortedCheckpoints.length} phases completed ({progressPercentage}%)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Expanded timeline for mobile */}
              {timelineExpanded && (
                <div 
                  ref={timelineRef}
                  className="bg-white border border-gray-200 rounded-lg p-4 mb-4 relative overflow-y-auto shadow-md" 
                  style={{ 
                    maxHeight: "300px",
                    scrollSnapType: "y proximity",
                    scrollBehavior: "smooth"
                  }}
                >
                  {/* Timeline with simplified layout for mobile */}
                  <div className="relative">
                    {/* Vertical line running from top to active node */}
                    <div className="absolute left-4 top-0 bg-blue-500 w-0.5" 
                        style={{ 
                          height: `${visibleCheckpoints.findIndex(checkpoint => 
                            checkpoint === inProgressCheckpoint) * 88 + 88}px`
                        }}></div>
                    
                    <div className="space-y-8">
                      {visibleCheckpoints.map((checkpoint) => {
                        const isCompleted = checkpoint.completed;
                        const isInProgress = !isCompleted && checkpoint === inProgressCheckpoint;
                        const status = isCompleted ? 'completed' : (isInProgress ? 'in-progress' : 'pending');
                        
                        return (
                          <div 
                            key={checkpoint.checkpointId}
                            data-status={status}
                            className={`relative flex rounded-lg transition-all duration-300 ${
                              isInProgress ? 'bg-blue-50 p-4 border-l-4 border-blue-500' : 
                              isCompleted ? 'p-4 hover:bg-blue-50' : 'p-4'
                            }`}
                            style={{ scrollSnapAlign: 'start' }}
                          >
                            {/* Node dot */}
                            <div 
                              className={`z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? 'border-2 border-green-500 bg-green-50' :
                                isInProgress ? 'border-2 border-blue-500 bg-blue-50 shadow-md' :
                                'border-2 border-gray-300 bg-white'
                              }`}
                              style={{ marginLeft: "0.5px" }}
                            >
                              {isCompleted ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : isInProgress ? (
                                <Clock className="w-4 h-4 text-blue-500" />
                              ) : (
                                <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                              )}
                            </div>
                            
                            {/* Content - Left side with status directly underneath title */}
                            <div className="ml-4 flex-1">
                              <h3 className="text-md font-medium text-gray-800">{checkpoint.name}</h3>
                              <div className="flex flex-col">
                                <span className={`text-sm ${
                                  isCompleted ? 'text-green-600' : 
                                  isInProgress ? 'text-blue-600' : 
                                  'text-gray-600'
                                }`} style={{ lineHeight: '1.2' }}>
                                  {isCompleted ? 'Completed' : 
                                  isInProgress ? 'In Progress' : 'Upcoming'}
                                </span>
                                
                                {/* Show related messages if any */}
                                {order.messages && order.messages.filter(msg => msg.checkpointId === checkpoint.checkpointId).length > 0 && (
                                  <span className="text-sm text-blue-500 mt-1">
                                    {order.messages.filter(msg => msg.checkpointId === checkpoint.checkpointId).length} updates
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Right side - date */}
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500">
                                {checkpoint.completedAt ? formatDate(checkpoint.completedAt) : 'Upcoming'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Notifications Section */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
          {!expandedNotification ? (
  // Collapsed notification view (list of updates)
  <>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <Bell className="w-5 h-5 text-blue-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-700">Recent Updates</h2>
      </div>
      {order.messages && order.messages.length > 3 && (
        <button 
          className="text-blue-500 text-sm font-medium flex items-center"
          onClick={() => setShowAllUpdates(!showAllUpdates)}
        >
          <span>View All</span> 
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      )}
    </div>
    
    {order.messages && order.messages.length > 0 ? (
  <div className="space-y-2">
    {(showAllUpdates ? order.messages : order.messages.slice(0, 3)).map((message, index) => {
      console.log("Rendering message:", message, "checkpointName:", message.checkpointName);
      return (
        <div 
          key={message.id || index}
          className="p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => setExpandedNotification({
            ...message,
            nodeName: message.checkpointName || 'Project Update',
            fullContent: message.message
          })}
        >
          <div className="flex justify-between">
            <span className="font-medium">{message.checkpointName || 'Project Update'}</span>
            <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{message.message}</p>
          <div className="flex justify-end">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      );
    })}
  </div>
) : (
  <p className="text-gray-500 text-center py-4 bg-white rounded-md border border-gray-200">No updates yet</p>
)}
  </>
) : (
  // Expanded notification view (inline, not modal)
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center border-b border-gray-200 p-4 mb-4">
      <button 
        onClick={() => setExpandedNotification(null)}
        className="mr-3 hover:bg-gray-100 p-1 rounded"
      >
        <ArrowLeft className="w-5 h-5 text-blue-500" />
      </button>
      <h2 className="text-lg font-semibold text-gray-700">Update Details</h2>
    </div>
    
    <div className='p-4'>
      <div className="mb-4 border-b border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-gray-800">{expandedNotification.nodeName}</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">Date: {formatDate(expandedNotification.timestamp)}</span>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-2">Details</h4>
        <p className="text-gray-600 whitespace-pre-line">{expandedNotification.fullContent}</p>
      </div>
    </div>
  </div>
)}
          </div>
        </div>
        
        {/* Update Request Modal */}
        {updateModalOpen && (
          <UpdateRequestModal 
            plan={order}
            onClose={() => setUpdateModalOpen(false)}
            onSubmitSuccess={() => {
              setUpdateModalOpen(false);
              // Optionally refresh order data
              fetchOrderDetails();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetails;