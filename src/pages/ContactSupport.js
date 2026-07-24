import React, { useState, useContext } from 'react';
import { Phone, Mail, MessageSquare, HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Context from '../context';
import CreateTicket from '../components/CreateTicket';
import TicketsList from '../components/TicketsList';
import DashboardLayout from '../components/DashboardLayout';

const ContactSupportPage = () => {
  const { userDetails } = useContext(Context);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [user, setUser] = useState(null);
  
  // Common FAQs
  const faqs = [
    {
      question: 'How do I create a new support ticket?',
      answer: 'Click on the "Create New Ticket" button, select a category related to your issue, provide a clear subject, and describe your problem in detail. Our support team will review your ticket as soon as possible.'
    },
    {
      question: 'How long will it take to get a response?',
      answer: "We aim to respond to all tickets within 24 hours. Complex issues may take longer to resolve, but we'll keep you updated on the progress throughout the process."
    },
    {
      question: 'Can I have multiple tickets open at once?',
      answer: 'No, you can only have one active ticket at a time. This helps us focus on resolving your current issue effectively before addressing new concerns.'
    },
    {
      question: 'How do I know when my ticket status changes?',
      answer: "You can check your ticket status in the 'My Tickets' section. The status will change from Pending to Open when our team starts working on it, and to Closed when it's resolved."
    },
    {
      question: 'How do I provide more information for my ticket?',
      answer: "Simply open your existing ticket and use the reply section at the bottom to add more information or respond to our team's questions."
    }
  ];

  return (
    <DashboardLayout user={user}>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_50%,_#f8fafc_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="rounded-t-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold uppercase text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Support
            </div>
            <h1 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-white">
              How Can We Help You?
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-6 text-white">
              Our dedicated support team is here to assist you with any questions or issues you might encounter.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {/* Contact Options */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-black">Support Ticket</h3>
                  <p className="mb-6 text-base text-black">
                    Create a support ticket for any issues or questions you have.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    Create New Ticket
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-black">Call Us</h3>
                  <p className="mb-6 text-base text-black">
                    For urgent matters, feel free to call our support team directly.
                  </p>
                  <p className="text-lg font-semibold text-blue-600">+91 92565 37003</p>
                  <p className="mt-1 text-sm text-black">
                    Monday-Friday: 9AM-6PM IST
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-black">Email Us</h3>
                  <p className="mb-6 text-base text-black">
                    You can also reach our support team via email for general inquiries.
                  </p>
                  <p className="text-lg font-semibold text-blue-600">info@vacomputers.com</p>
                  <p className="mt-1 text-sm text-black">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div className="mt-12">
              <h2 className="mb-6 text-xl font-bold text-black">My Support Tickets</h2>
              <TicketsList />
            </div>

            {/* FAQs */}
            <div className="mt-12">
              <div className="mb-6 flex items-center">
                <HelpCircle className="mr-2 h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-black">Frequently Asked Questions</h2>
              </div>

              <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {faqs.map((faq, index) => (
                  <div key={index} className="hover:bg-slate-50">
                    <button
                      className="w-full px-6 py-4 text-left focus:outline-none"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium text-black">{faq.question}</h3>
                        {openFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-4">
                        <p className="text-base text-black">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <CreateTicket
          show={showCreateForm}
          handleClose={() => setShowCreateForm(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default ContactSupportPage;