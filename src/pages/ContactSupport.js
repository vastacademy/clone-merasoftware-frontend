import React, { useState, useContext } from 'react';
import { Phone, Mail, MessageSquare, HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Context from '../context';
import CreateTicket from '../components/CreateTicket';
import TicketsList from '../components/TicketsList';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';

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
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Support
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              How can we help you?
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
              Our dedicated support team is here to assist you with any questions or issues you might encounter.
            </p>
          </div>

          {/* Contact Options */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/60 hover:bg-white/[0.16] hover:shadow-[0_24px_48px_rgba(16,185,129,0.28)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <MessageSquare className="h-7 w-7 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="relative mt-5 text-xl font-semibold text-white">Support Ticket</h3>
              <p className="relative mt-2 text-base leading-relaxed text-slate-300">
                Create a support ticket for any issues or questions you have.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-base font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-emerald-500/35"
              >
                Create New Ticket
              </button>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <Phone className="h-7 w-7 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="relative mt-5 text-xl font-semibold text-white">Call Us</h3>
              <p className="relative mt-2 text-base leading-relaxed text-slate-300">
                For urgent matters, feel free to call our support team directly.
              </p>
              <p className="relative mt-4 text-lg font-semibold text-emerald-400">+91 92565 37003</p>
              <p className="relative mt-1 text-sm text-slate-400">Monday-Friday: 9AM-6PM IST</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <Mail className="h-7 w-7 text-white" strokeWidth={1.75} />
              </div>
              <h3 className="relative mt-5 text-xl font-semibold text-white">Email Us</h3>
              <p className="relative mt-2 text-base leading-relaxed text-slate-300">
                You can also reach our support team via email for general inquiries.
              </p>
              <p className="relative mt-4 text-lg font-semibold text-emerald-400">info@vacomputers.com</p>
              <p className="relative mt-1 text-sm text-slate-400">We typically respond within 24 hours</p>
            </div>
          </div>

          {/* Tickets List */}
          <div className="mt-12">
            <TicketsList />
          </div>

          {/* FAQs */}
          <div className="mt-12">
            <div className="mb-6 flex items-center">
              <HelpCircle className="mr-2 h-6 w-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
            </div>

            <div className="divide-y divide-white/15 overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-150">
              {faqs.map((faq, index) => (
                <div key={index} className="hover:bg-white/[0.06]">
                  <button
                    className="w-full px-6 py-4 text-left focus:outline-none"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-white">{faq.question}</h3>
                      {openFaq === index ? (
                        <ChevronUp className="h-5 w-5 text-slate-300" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-base text-slate-300">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
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