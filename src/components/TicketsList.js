import React, { useState, useEffect, useContext } from 'react';
// import { format } from 'date-fns';
import { Ticket, Plus, ArrowRight, Filter } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import Context from '../context';
import CreateTicket from './CreateTicket';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import { useSelector } from 'react-redux';

const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  // const { userDetails } = useContext(Context);
  const userDetails = useSelector((state) => state.user.user);
  const isInitialized = useSelector((state) => state.user.initialized);
  
  // Fetch tickets from API
  const fetchTickets = async () => {
    if (!userDetails?._id) {
      // console.log("No user ID available, skipping fetch");
      return;
    }
    
    setLoading(true);
    try {
      let url = `${SummaryApi.getUserTickets.url}?page=${currentPage}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      // console.log("Fetching tickets with URL:", url);

      const response = await fetch(url, {
        method: SummaryApi.getUserTickets.method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      
      const result = await response.json();
      // console.log("API Response:", result);
      
      if (result.success) {
        // console.log("Setting tickets:", result.data.tickets);
        setTickets(result.data.tickets);
        setTotalPages(result.data.pagination.pages);
      } else {
        setError('Failed to load tickets');
        toast.error(result.message || 'Failed to load tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Open
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };
  
  // Pagination handler
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Format date helper
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('en-IN', options);
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Pagination UI
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    
    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
          currentPage === 1 
            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
        }`}
      >
        <span className="sr-only">Previous</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 border ${
            i === currentPage
              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
          currentPage === totalPages
            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
        }`}
      >
        <span className="sr-only">Next</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
    
    return (
      <div className="flex items-center justify-center mt-5">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          {pages}
        </nav>
      </div>
    );
  };
  
  // Effect to load tickets on component mount and when dependencies change
  useEffect(() => {
    if (isInitialized && userDetails?._id) {
      // console.log("Fetching tickets for user:", userDetails._id);
      fetchTickets();
    }
  }, [currentPage, statusFilter, userDetails, isInitialized]);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center p-4 sm:px-6 border-b">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Ticket className="h-5 w-5 mr-2" />
          My Support Tickets
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Tickets</option>
              <option value="pending">Pending</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <Filter className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Create Ticket</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <TriangleMazeLoader />
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchTickets}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Try Again
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <Ticket className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No tickets found</h3>
          <p className="text-gray-500 mb-6">You haven't created any support tickets yet.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.ticketId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ticket.ticketId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[200px]">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <a
                        href={`/support-tickets/${ticket.ticketId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-end gap-1"
                      >
                        View <ArrowRight className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {renderPagination()}
        </>
      )}
      
      {/* Create Ticket Modal */}
      {showCreateForm && (
        <CreateTicket
          show={showCreateForm}
          handleClose={() => setShowCreateForm(false)}
          refreshTickets={fetchTickets}
        />
      )}
    </div>
  );
};

export default TicketsList;