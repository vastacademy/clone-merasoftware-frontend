import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Send, Clock, User, Check, X, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import Context from '../context';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
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
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-400/40 bg-amber-500/20 text-sm font-medium text-amber-300 backdrop-blur-md">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/25 bg-white/15 text-sm font-medium text-white backdrop-blur-md">
            <User className="h-4 w-4 mr-1" />
            Open
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 text-sm font-medium text-emerald-300 backdrop-blur-md">
            <Check className="h-4 w-4 mr-1" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/15 bg-white/10 text-sm font-medium text-slate-300 backdrop-blur-md">
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
      <DashboardLayout user={userDetails}>
        <div className="flex justify-center items-center p-12">
          <TriangleMazeLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={userDetails}>
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}>
          <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
          <div className="relative mx-auto max-w-3xl rounded-[1.75rem] border border-white/20 bg-white/10 p-8 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-center flex-col text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Error Loading Ticket</h3>
              <p className="text-base text-slate-300 mb-4">{error}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-xl border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07] transition-colors text-base font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={fetchTicketDetails}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-base font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout user={userDetails}>
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}>
          <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
          <div className="relative mx-auto max-w-3xl rounded-[1.75rem] border border-white/20 bg-white/10 p-8 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-center flex-col text-center">
              <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Ticket Not Found</h3>
              <p className="text-base text-slate-300 mb-4">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-base font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={userDetails}>
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}>
    <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* Ticket Header */}
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-0 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="text-center">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ticket: {ticket.ticketId}
            {getStatusBadge(ticket.status)}
          </h1>
          <p className="mt-1 text-base text-slate-300">
            Created on {formatDateTime(ticket.createdAt)}
          </p>
        </div>
      </div>

      {isAdmin && ticket.status !== 'closed' && (
        <div className="flex justify-center">
          <button
            onClick={handleCloseTicket}
            disabled={closingTicket}
            className={`px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center text-base font-medium ${
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
        </div>
      )}

      {/* Ticket Details */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-2">Subject</h2>
            <p className="text-base font-semibold text-white">{ticket.subject}</p>

            <h2 className="text-sm font-medium text-slate-400 mt-4 mb-2">Category</h2>
            <p className="text-base font-semibold text-white">{ticket.category}</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-2">Customer</h2>
            <p className="text-base font-semibold text-white">{ticket.userId?.name || 'Unknown'}</p>

            <h2 className="text-sm font-medium text-slate-400 mt-4 mb-2">Email</h2>
            <p className="text-base font-semibold text-white">{ticket.userId?.email || 'Unknown'}</p>
          </div>
        </div>

        {/* Status History Timeline */}
        <div className="relative mb-8">
          <h2 className="text-sm font-medium text-slate-400 mb-4">Status History</h2>

          <div className="relative">
            {/* Line that connects all the timeline events */}
            <div className="absolute h-full w-0.5 bg-white/15 left-2.5 top-0"></div>

            {/* Timeline events */}
            <div className="space-y-6 relative">
              {ticket.statusHistory?.map((status, index) => (
                <div key={index} className="flex items-start">
                  <div className={`
                    w-5 h-5 rounded-full flex-shrink-0 z-10 border
                    ${status.status === 'pending' ? 'border-amber-400/40 bg-amber-500/60' : ''}
                    ${status.status === 'open' ? 'border-white/40 bg-white/60' : ''}
                    ${status.status === 'closed' ? 'border-emerald-400/40 bg-emerald-500/60' : ''}
                  `}></div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-white capitalize">
                      {status.status}
                    </p>
                    <p className="text-sm text-slate-300">
                      {formatDateTime(status.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="relative mb-2">
          <h2 className="text-sm font-medium text-slate-400 mb-4">Conversation</h2>

          <div className="rounded-2xl border border-white/15 bg-white/[0.03] overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-base font-medium text-white">
                    {ticket.userId?.name || 'Customer'} - <span className="text-slate-300 text-sm font-normal">Original Request</span>
                  </p>
                  <div className="mt-1 text-base text-slate-200 whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
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
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      isAdmin ? 'border-amber-400/40 bg-amber-500/20' : 'border-white/20 bg-white/10'
                    }`}>
                      {isAdmin ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>

                    <div className={`max-w-[80%] ${isAdmin ? 'text-right' : ''}`}>
                      <p className="text-base font-medium text-white">
                        {isAdmin ? 'Support Team' : (ticket.userId?.name || 'Customer')}
                      </p>
                      <div className={`mt-1 p-3 rounded-lg whitespace-pre-wrap text-base border ${
                        isAdmin ? 'border-amber-400/30 bg-amber-500/10 text-white' : 'border-white/15 bg-white/[0.05] text-white'
                      }`}>
                        {msg.message}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
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
              <div className="p-4 border-t border-white/10">
                <form onSubmit={handleReply}>
                  <div className="flex items-start gap-2">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                      className="flex-grow rounded-xl border border-white/15 bg-white/[0.03] p-2 text-base text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                      rows={3}
                    ></textarea>
                    <button
                      type="submit"
                      disabled={sendingReply || !replyMessage.trim()}
                      className={`px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-base font-medium ${
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
              <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="flex items-center justify-center text-slate-300 text-base">
                  <Check className="h-5 w-5 mr-2 text-emerald-400" />
                  <span>This ticket is closed. If you have further questions, please create a new ticket.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
    </DashboardLayout>
  );
};

export default TicketDetail;