import React, { useState, useContext } from 'react';
import { toast } from 'sonner';
import { Check, AlertCircle } from 'lucide-react';
import Context from '../context';
import SummaryApi from '../common';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import { useSelector } from 'react-redux';

const CreateTicket = ({ show, handleClose, refreshTickets }) => {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasOpenTicket, setHasOpenTicket] = useState(false);
  const [openTicketId, setOpenTicketId] = useState('');
  // const { userDetails } = useContext(Context);
  const userDetails = useSelector((state) => state.user.user);

  // Check if user has any open tickets
  const checkOpenTickets = async () => {
    if (!userDetails?._id) return;
    
    try {
      const response = await fetch(SummaryApi.getUserTickets.url, {
        method: SummaryApi.getUserTickets.method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        const openTickets = result.data.tickets.filter(
          ticket => ticket.status === 'pending' || ticket.status === 'open'
        );
        
        if (openTickets.length > 0) {
          setHasOpenTicket(true);
          setOpenTicketId(openTickets[0].ticketId);
        } else {
          setHasOpenTicket(false);
          setOpenTicketId('');
        }
      }
    } catch (error) {
      console.error('Error checking open tickets:', error);
    }
  };

  // Handle ticket creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!category || !subject || !description) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(SummaryApi.createTicket.url, {
        method: SummaryApi.createTicket.method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          category,
          subject,
          description
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Ticket created successfully!');
        setCategory('');
        setSubject('');
        setDescription('');
        
        if (refreshTickets) {
          refreshTickets();
        }
        
        handleClose();
      } else {
        if (result.ticketId) {
          setHasOpenTicket(true);
          setOpenTicketId(result.ticketId);
        }
        toast.error(result.message || 'Error creating ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setCategory('');
    setSubject('');
    setDescription('');
  };

  // Effect to check for open tickets when the modal shows
  React.useEffect(() => {
    if (show && userDetails?._id) {
      checkOpenTickets();
    }
  }, [show, userDetails]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create New Support Ticket</h2>
          <button 
            onClick={() => {
              resetForm();
              handleClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {hasOpenTicket ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-yellow-700 font-medium">You already have an open ticket</p>
              </div>
              <p className="text-sm text-yellow-600 mt-1">Please wait for resolution before creating a new one.</p>
              <button 
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                onClick={() => {
                  handleClose();
                  window.location.href = `/support-tickets/${openTicketId}`;
                }}
              >
                View Existing Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="Billing">Billing Issue</option>
                  <option value="Technical">Technical Problem</option>
                  <option value="Product">Product Question</option>
                  <option value="Account">Account Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject*</label>
                <input
                  type="text"
                  placeholder="Brief summary of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <textarea
                  rows={4}
                  placeholder="Please describe your issue in detail"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    handleClose();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : 'Submit Ticket'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="rounded-lg p-8">
            <TriangleMazeLoader />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTicket;