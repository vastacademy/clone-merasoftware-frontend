import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const PrivacyPolicyPage = () => {
  // Reference to the content for PDF export
  const contentRef = React.useRef(null);
  
  // Function to generate and download PDF
  const downloadPDF = async () => {
    const content = contentRef.current;
    if (!content) return;
    
    try {
      // Show loading state
      const button = document.getElementById('download-btn');
      const originalText = button.textContent;
      button.textContent = 'Generating PDF...';
      button.disabled = true;
      
      // Use html2canvas to capture the content
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      });
      
      // Calculate dimensions for A4 format
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Handle multiple pages if needed
      if (imgHeight > pdf.internal.pageSize.height) {
        let heightLeft = imgHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.height;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      // Save the PDF
      pdf.save('Privacy_Policy.pdf');
      
      // Reset button state
      button.textContent = originalText;
      button.disabled = false;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      
      // Reset button on error
      const button = document.getElementById('download-btn');
      if (button) {
        button.textContent = 'Download PDF Copy';
        button.disabled = false;
      }
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Main content container with reference for PDF export */}
        <div ref={contentRef} className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-teal-700 py-6 px-8">
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="mt-2 text-teal-100">Last updated: March 14, 2025</p>
          </div>
          
          {/* Content */}
          <div className="py-8 px-8">
            {/* Introduction */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-800 mr-3">1</span>
                Overview
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  This Privacy Policy outlines how we collect, use, and protect user data. We are committed to maintaining the privacy and security of all personal information shared with us.
                </p>
              </div>
            </div>
            
            {/* Data Collection section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-800 mr-3">2</span>
                Data Collection
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  We collect user data solely for authentication and project execution purposes. The data collected includes, but is not limited to:
                </p>
                <ul className="mt-3 space-y-2 list-disc pl-5">
                  <li>Names</li>
                  <li>Email addresses</li>
                  <li>Contact details</li>
                  <li>Other relevant information required for project completion</li>
                </ul>
                <div className="mt-4 p-4 bg-teal-50 border-l-4 border-teal-500 rounded">
                  <p className="text-teal-700">
                    <strong>Important:</strong> All information is kept confidential and is never sold, shared, or disclosed to any third parties.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Third-Party Services section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-800 mr-3">3</span>
                Third-Party Services
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  If our website integrates third-party services, we only facilitate their implementation for our clients. Users who interact with these third-party services should refer to their respective privacy policies to understand how their data is handled.
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-gray-700 italic">
                    We do not take responsibility for how third parties manage user data.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Data Security section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-800 mr-3">4</span>
                Data Security
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="ml-4 font-medium text-gray-700">
                    To ensure the security of transactions, all payments are processed through trusted payment gateways.
                  </p>
                </div>
                <p>
                  We do not store sensitive financial data such as:
                </p>
                <ul className="mt-2 space-y-1 list-disc pl-5">
                  <li>Credit card details</li>
                  <li>Banking information</li>
                </ul>
                <p className="mt-4">
                  Clients can request data deletion after project completion, provided it does not conflict with legal or record-keeping requirements.
                </p>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-800 mr-3">5</span>
                Contact Us
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
              <p>
                If you have any questions about our Privacy Policy, please contact us:
              </p>
              <div className="mt-4 bg-gray-50 p-4 rounded-lg inline-flex items-center">
                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">info@vacomputers.com</span>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        {/* PDF Download button outside the main content */}
        <div className="flex justify-center">
          <button 
            id="download-btn"
            onClick={downloadPDF}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF Copy
          </button>
        </div>
      </div>
    </div>
    
  );
};

export default PrivacyPolicyPage;