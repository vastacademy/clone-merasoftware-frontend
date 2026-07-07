import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Send, Clock, User, Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import Context from '../context';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import { useSelector } from 'react-redux';

const TicketDetail = ({ isAdmin = false }) => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  // const { userDetails } = useContext(Context);
  // Context के बजाय Redux का उपयोग करें
  const userDetails = useSelector((state) => state.user.user);
  const isInitialized = useSelector((state) => state.user.initialized);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch ticket details
  const fetchTicketDetails = async () => {
    if (!ticketId || !userDetails?._id) {
      console.log("No user ID or ticket ID available");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${SummaryApi.getTicketDetails.url}/${ticketId}`, {
        method: SummaryApi.getTicketDetails.method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTicket(result.data);
      } else {
        setError(result.message || 'Failed to load ticket details');
        toast.error(result.message || 'Failed to load ticket details');
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError('Failed to load ticket details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reply submission
  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    setSendingReply(true);
    
    try {
      const response = await fetch(`${SummaryApi.replyTicket.url}/${ticketId}`, {
        method: SummaryApi.replyTicket.method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          message: replyMessage
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setReplyMessage('');
        fetchTicketDetails(); // Refresh ticket details
        toast.success('Reply sent successfully');
      } else {
        toast.error(result.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle close ticket (admin only)
  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket?')) {
      return;
    }
    
    setClosingTicket(true);
    
    try {
      const response = await fetch(`${SummaryApi.closeTicket.url}/${ticketId}`, {
        method: SummaryApi.closeTicket.method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchTicketDetails(); // Refresh ticket details
        toast.success('Ticket closed successfully');
      } else {
        toast.error(result.message || 'Failed to close ticket');
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setClosingTicket(false);
    }
  };

  // Format date helper
  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status badge with proper styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <User className="h-4 w-4 mr-1" />
            Open
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <Check className="h-4 w-4 mr-1" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  // Scroll to bottom of messages when ticket updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages]);

  // Load ticket details on component mount
  useEffect(() => {
    if (isInitialized && userDetails?._id) {
      console.log("Fetching ticket details for:", ticketId);
      fetchTicketDetails();
    }
  }, [ticketId, userDetails, isInitialized]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <TriangleMazeLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center flex-col text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ticket</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={fetchTicketDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center flex-col text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Found</h3>
          <p className="text-gray-500 mb-4">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Ticket Header */}
      <div className="border-b p-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="flex items-center text-xl font-semibold text-gray-900">
                Ticket: {ticket.ticketId} 
                <span className="ml-3">{getStatusBadge(ticket.status)}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Created on {formatDateTime(ticket.createdAt)}
              </p>
            </div>
          </div>
          {isAdmin && ticket.status !== 'closed' && (
            <button
              onClick={handleCloseTicket}
              disabled={closingTicket}
              className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center ${
                closingTicket ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {closingTicket ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Closing...</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  <span>Close Ticket</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Ticket Details */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Subject</h2>
            <p className="font-semibold text-gray-900">{ticket.subject}</p>
            
            <h2 className="text-sm font-medium text-gray-500 mt-4 mb-2">Category</h2>
            <p className="font-semibold text-gray-900">{ticket.category}</p>
          </div>
          
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Customer</h2>
            <p className="font-semibold text-gray-900">{ticket.userId?.name || 'Unknown'}</p>
            
            <h2 className="text-sm font-medium text-gray-500 mt-4 mb-2">Email</h2>
            <p className="font-semibold text-gray-900">{ticket.userId?.email || 'Unknown'}</p>
          </div>
        </div>
        
        {/* Status History Timeline */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Status History</h2>
          
          <div className="relative">
            {/* Line that connects all the timeline events */}
            <div className="absolute h-full w-0.5 bg-gray-200 left-2.5 top-0"></div>
            
            {/* Timeline events */}
            <div className="space-y-6 relative">
              {ticket.statusHistory?.map((status, index) => (
                <div key={index} className="flex items-start">
                  <div className={`
                    w-5 h-5 rounded-full flex-shrink-0 z-10
                    ${status.status === 'pending' ? 'bg-yellow-500' : ''}
                    ${status.status === 'open' ? 'bg-blue-500' : ''}
                    ${status.status === 'closed' ? 'bg-gray-500' : ''}
                  `}></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {status.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(status.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Conversation */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Conversation</h2>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {ticket.userId?.name || 'Customer'} - <span className="text-gray-500 text-sm font-normal">Original Request</span>
                  </p>
                  <div className="mt-1 text-gray-700 whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Message list with scrollable container */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {ticket.messages?.map((msg, index) => {
                // Skip the first message (it's the original request)
                if (index === 0) return null;
                
                const isAdmin = msg.sender === 'admin';
                
                return (
                  <div key={index} className={`flex items-start gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isAdmin ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {isAdmin ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <User className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    
                    <div className={`max-w-[80%] ${isAdmin ? 'text-right' : ''}`}>
                      <p className="font-medium text-gray-900">
                        {isAdmin ? 'Support Team' : (ticket.userId?.name || 'Customer')}
                      </p>
                      <div className={`mt-1 p-3 rounded-lg whitespace-pre-wrap ${
                        isAdmin ? 'bg-amber-50 text-gray-700' : 'bg-blue-50 text-gray-700'
                      }`}>
                        {msg.message}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Reply form */}
            {ticket.status !== 'closed' ? (
              <div className="p-4 border-t">
                <form onSubmit={handleReply}>
                  <div className="flex items-start gap-2">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                      className="flex-grow rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    ></textarea>
                    <button
                      type="submit"
                      disabled={sendingReply || !replyMessage.trim()}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                        sendingReply || !replyMessage.trim() ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {sendingReply ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Send className="h-4 w-4 mr-1" />
                          <span>Send</span>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-center text-gray-500">
                  <Check className="h-5 w-5 mr-2" />
                  <span>This ticket is closed. If you have further questions, please create a new ticket.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;