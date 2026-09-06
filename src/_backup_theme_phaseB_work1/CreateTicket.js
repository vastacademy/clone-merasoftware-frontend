import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, MessageSquare, X } from 'lucide-react';
import SummaryApi from '../common';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { customerReturnState } from '../helpers/customerReturnNavigation';

const CreateTicket = ({ show, handleClose, refreshTickets }) => {
  const navigate = useNavigate();
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

  const closeModal = () => {
    resetForm();
    handleClose();
  };

  const openExistingTicket = () => {
    handleClose();
    navigate(`/support-tickets/${openTicketId}`, { state: customerReturnState('/support') });
  };

  const fieldClassName = 'w-full rounded-xl border border-white/20 bg-slate-950/70 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/40 transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="create-ticket-title" className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/20 bg-slate-900/95 text-white shadow-2xl backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-200"><MessageSquare className="h-5 w-5" /></span>
            <div><h2 id="create-ticket-title" className="text-xl font-bold">Create support ticket</h2><p className="mt-1 text-sm text-white/70">Describe the issue and our team will review it.</p></div>
          </div>
          <button type="button" onClick={closeModal} className="rounded-xl border border-white/15 bg-white/5 p-2 text-white transition hover:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {hasOpenTicket ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" />You already have an open ticket</div><p className="mt-2 text-sm text-amber-100/80">Please wait for resolution before creating a new ticket.</p><button type="button" onClick={openExistingTicket} className="mt-4 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400">View existing ticket</button></div>
          ) : (
            <form id="create-ticket-form" className="space-y-4" onSubmit={handleSubmit}>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-white/80">Category *</span><select value={category} onChange={(event) => setCategory(event.target.value)} required className={fieldClassName}><option value="">Select a category</option><option value="Billing">Billing issue</option><option value="Technical">Technical problem</option><option value="Product">Product question</option><option value="Account">Account management</option><option value="Other">Other</option></select></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-white/80">Subject *</span><input type="text" placeholder="Brief summary of your issue" value={subject} onChange={(event) => setSubject(event.target.value)} required className={fieldClassName} /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-white/80">Description *</span><textarea rows={5} placeholder="Please describe your issue in detail" value={description} onChange={(event) => setDescription(event.target.value)} required className={fieldClassName} /></label>
            </form>
          )}
        </div>

        {!hasOpenTicket && <div className="flex flex-col-reverse gap-2 border-t border-white/10 px-5 py-5 sm:flex-row sm:justify-end sm:px-6"><button type="button" onClick={closeModal} disabled={loading} className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-white/10 disabled:opacity-50">Cancel</button><button type="submit" form="create-ticket-form" disabled={loading} className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/15">{loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}{loading ? 'Submitting…' : 'Submit ticket'}</button></div>}
      </div>
    </div>
  );
};

export default CreateTicket;
