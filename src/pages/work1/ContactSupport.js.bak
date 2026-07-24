import React, { useState, useContext } from 'react';
import { Phone, Mail, MessageSquare, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">How Can We Help You?</h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Our dedicated support team is here to assist you with any questions or issues you might encounter.
          </p>
        </div>
        
        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Support Ticket</h3>
              <p className="text-gray-500 mb-6">
                Create a support ticket for any issues or questions you have.
              </p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create New Ticket
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-500 mb-6">
                For urgent matters, feel free to call our support team directly.
              </p>
              <p className="text-xl font-semibold text-blue-600">+91 92565 37003</p>
              <p className="text-sm text-gray-500 mt-1">
                Monday-Friday: 9AM-6PM IST
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-500 mb-6">
                You can also reach our support team via email for general inquiries.
              </p>
              <p className="text-xl font-semibold text-blue-600">info@vacomputers.com</p>
              <p className="text-sm text-gray-500 mt-1">
                We typically respond within 24 hours
              </p>
            </div>
          </div>
        </div>
        
         {/* Tickets List */}
         <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Support Tickets</h2>
          <TicketsList />
        </div>
        
        {/* FAQs */}
        <div>
          <div className="flex items-center mb-6">
            <HelpCircle className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <div key={index} className="hover:bg-gray-50">
                <button
                  className="w-full px-6 py-4 text-left focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                    {openFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-500">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
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
    </div>
    </DashboardLayout>
  );
};

export default ContactSupportPage;