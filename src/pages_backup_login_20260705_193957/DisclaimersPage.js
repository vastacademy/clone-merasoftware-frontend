import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const DisclaimersPage = () => {
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
      pdf.save('Disclaimers.pdf');
      
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
          <div className="bg-green-700 py-6 px-8">
            <h1 className="text-3xl font-bold text-white">User Guidelines and Disclaimer</h1>
            <p className="mt-2 text-green-100">Last updated: March 24, 2025</p>
          </div>
          
          {/* Introduction */}
          <div className="py-8 px-8">
            <div className="text-gray-600 leading-relaxed mb-8">
              <p className="font-medium text-lg text-gray-800 mb-4">
                At Mera Software, we are committed to providing transparent, efficient, and high-quality services. 
                Our goal is to deliver exceptional software solutions while maintaining clear communication and 
                well-defined responsibilities. Below is an overview of our working process, responsibilities, and limitations.
              </p>
            </div>
            
            {/* Section 1 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">1</span>
                Our Working Process
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  To ensure a smooth project experience, we follow a structured process:
                </p>
              </div>
            </div>
            
            {/* Section 2 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">2</span>
                Service Selection
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <ul className="space-y-2 list-disc pl-5">
                  <li>Choose a service that best fits your needs.</li>
                  <li>After selecting a service, go to the product page and click on 'Proceed.' A popup will appear with options to log in or contact us.</li>
                  <li>Provide your basic details (name, phone number, and email ID) and submit the form.</li>
                  <li>Our team will reach out within 12 hours to create your login credentials (username and password).</li>
                  <li>Once you receive your credentials, log in to your dashboard and complete the payment to start your project.</li>
                </ul>
              </div>
            </div>
            
            {/* Section 3 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">3</span>
                Project Assessment and Customization
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <ul className="space-y-2 list-disc pl-5">
                  <li>After selecting a project, our team will review your requirements.</li>
                  <li>If we have a suitable plan, we will guide you through the payment process.</li>
                  <li>If none of our existing plans match your needs, we will create a plan based on your requirements.</li>
                  <li>A contract agreement will be signed, and our agent will assist you with the payment process.</li>
                  <li>Once the payment is completed, we will begin the development process.</li>
                </ul>
              </div>
            </div>
            
            {/* Section 4 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">4</span>
                Development and Support
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <ul className="space-y-2 list-disc pl-5">
                  <li>Our team manually manages the entire process to ensure smooth execution.</li>
                  <li>A dedicated developer will be assigned to your project and will oversee its completion.</li>
                </ul>
              </div>
            </div>
            
            {/* Section 5 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">5</span>
                Complaints and Feedback
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <ul className="space-y-2 list-disc pl-5">
                  <li>For any complaints, you can contact our support team and raise a ticket.</li>
                  <li>If you have suggestions or feedback, you can submit them through our feedback section.</li>
                </ul>
              </div>
            </div>
            
            {/* Section 6 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">6</span>
                Responsibilities and Limitations
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed space-y-6">
                <div className="bg-gray-50 rounded-lg p-5 border-l-4 border-green-600">
                  <h3 className="font-medium text-gray-800 mb-2">1. Client Cooperation and Timely Input</h3>
                  <p>We rely on timely inputs from clients. Any delays in providing necessary content, assets, or approvals may extend project timelines. Payment delays will also impact project progress.</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 border-l-4 border-green-600">
                  <h3 className="font-medium text-gray-800 mb-2">2. Documentation of Agreements</h3>
                  <p>All project agreements, including scope, timelines, and payment schedules, are documented before starting. Any changes must be agreed upon in writing by both parties.</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 border-l-4 border-green-600">
                  <h3 className="font-medium text-gray-800 mb-2">3. Third-Party Services</h3>
                  <p>We provide support for third-party integrations but are not responsible for issues caused by external API changes, plugin updates, or hosting service problems.</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 border-l-4 border-green-600">
                  <h3 className="font-medium text-gray-800 mb-2">4. Maintenance and Support</h3>
                  <p>Our support covers bug fixes within our codebase and technical assistance during agreed business hours. Additional feature requests or major updates will be charged separately.</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 border-l-4 border-green-600">
                  <h3 className="font-medium text-gray-800 mb-2">5. Transparency and Fairness</h3>
                  <p>We maintain transparency throughout the project. Our communication channels ensure that clients are always informed and involved in decision-making.</p>
                </div>
              </div>
            </div>
            
            {/* Conclusion */}
            <div className="mt-8 mb-4 p-5 bg-green-50 rounded-lg border border-green-100">
              <p className="text-gray-700">
                By proceeding with our services, you acknowledge and agree to the terms outlined in this disclaimer. For further clarification, please contact our support team.
              </p>
              <p className="text-gray-700 font-medium mt-4">
                Thank you for choosing Mera Software!
              </p>
            </div>
            
            {/* Last updated date */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="text-gray-500 text-sm">
                Last updated: March 24, 2025
              </div>
            </div>
          </div>
        </div>
        
        {/* PDF Download button outside the main content */}
        <div className="flex justify-center">
          <button 
            id="download-btn"
            onClick={downloadPDF}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
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

export default DisclaimersPage;