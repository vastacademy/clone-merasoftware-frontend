import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const DeliveryPolicyPage = () => {
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
      pdf.save('Delivery_Policy.pdf');
      
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
            <h1 className="text-3xl font-bold text-white">Delivery Policy</h1>
            <p className="mt-2 text-green-100">Last updated: March 14, 2025</p>
          </div>
          
          {/* Introduction */}
          <div className="py-8 px-8">
            <div className="text-gray-600 leading-relaxed mb-8">
              <p>
                We follow a structured and transparent process for delivering software, websites, and mobile applications to ensure a smooth experience for our clients. Below are the key aspects of our delivery policy:
              </p>
            </div>
            
            {/* Section 1 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">1</span>
                Project Completion and Deployment
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  Before handing over the project, we ensure that the software is 100% complete and fully tested. The final deployment is done as per the agreed terms, ensuring the system is functional and ready for use. The deployment may include:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2">Hosting the website or application on the client's preferred server.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2">Configuring the necessary settings to ensure optimal performance.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2">Providing live access to the system for the client.</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Section 2 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">2</span>
                Handover of Credentials and Assets
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  Once the project is successfully deployed, we provide the client with all essential credentials and assets, including:
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center">
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="text-sm text-center font-medium">Source Code</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center">
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="text-sm text-center font-medium">Server Logins</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center">
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-sm text-center font-medium">Domain Details</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center">
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    <span className="text-sm text-center font-medium">Database Access</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center">
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-center font-medium">Documentation</span>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-green-800">
                    <strong>Note:</strong> If the project uses shared storage, we do not provide access to shared storage due to security and privacy reasons. If the client uses their own storage, third-party service, or hosting provider, we will handover all data to them accordingly. Otherwise, all other project-related assets will be handed over as per the agreement. At this stage, the client gets full ownership of the delivered product.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Section 3 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">3</span>
                Post-Delivery Modifications and Updates
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  After the project is delivered, if the client wants any updates, feature additions, or modifications in the future, we proceed based on the new requirements. Key points regarding future modifications:
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      1
                    </div>
                    <p className="ml-3">We only work on new modifications based on the data provided by the client at that time.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      2
                    </div>
                    <p className="ml-3">We do not store or retain any user data after project handover.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      3
                    </div>
                    <p className="ml-3">Clients are free to get modifications done from us or any other service provider of their choice.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      4
                    </div>
                    <p className="ml-3">There is no binding agreement forcing the client to work only with us after delivery.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 4 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">4</span>
                Client's Independence and Freedom
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  Our delivery policy ensures that the client has complete freedom to manage their project after deployment. They are not restricted to work with us for future updates, and we provide all necessary access to help them maintain their software independently.
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="py-6 px-6 bg-gray-50 rounded-xl max-w-lg">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <p className="text-center text-gray-700 font-medium">
                      By following this structured delivery process, we ensure complete transparency and client satisfaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* New Section 5 - Software Usage Rights */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">5</span>
                Software Usage Rights
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  After delivering the software to the client, they have full rights to use and sell the software according to the terms defined in the contract. The client becomes the owner of the specific software functionality they have received.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      1
                    </div>
                    <p className="ml-3">Clients can use the delivered software to automate their business processes as intended.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      2
                    </div>
                    <p className="ml-3">Clients have the right to sell the software to any third party if they wish to do so.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* New Section 6 - Intellectual Property */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">6</span>
                Intellectual Property and System Implementation
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  Our development approach focuses on creating automated systems that make users' tasks easier and more efficient. While we deliver full functionality to our clients, certain aspects of our development methodology remain our intellectual property.
                </p>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-green-800">
                    <strong>Important:</strong> The system understanding, techniques, and implementation methodologies used in our software development process remain our intellectual property. When we provide source code to a client, it does not mean we have transferred our understanding of the work systems or the copyrights to the implementation techniques.
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      1
                    </div>
                    <p className="ml-3">The client only owns the specific functionality of their software that was delivered to them.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      2
                    </div>
                    <p className="ml-3">The client cannot challenge us for using similar systems or methodologies in our other software or SaaS products.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      3
                    </div>
                    <p className="ml-3">The software is developed keeping in mind the client's requirements with a focus on automation and efficiency.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* New Section 7 - System Reuse and Intellectual Property Rights */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 mr-3">7</span>
                System Reuse and Intellectual Property Rights
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  We believe in clarifying the distinction between the delivered software and our underlying methodologies to ensure transparency in our business relationships.
                </p>
                
                <div className="mt-4 space-y-3">
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      1
                    </div>
                    <p className="ml-3"><strong>System vs. Implementation Clarification:</strong> While we provide source code and credentials to the client, the system design, architecture, and implementation methodology remain our intellectual property.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      2
                    </div>
                    <p className="ml-3"><strong>Pre-existing Work:</strong> Systems and methodologies developed by us prior to or during the project are considered our pre-existing work, over which we retain full rights.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      3
                    </div>
                    <p className="ml-3"><strong>Right to Create Similar Products:</strong> We explicitly retain the right to create software or SaaS products with similar functionality, using the same architecture, workflow, or system design.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      4
                    </div>
                    <p className="ml-3"><strong>Fairness Clause:</strong> The software delivered to the client is limited to that specific implementation and does not extend to the underlying system design or methodology.</p>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-medium text-sm">
                      5
                    </div>
                    <p className="ml-3"><strong>Right to Reuse:</strong> We may reuse system components, portions of code, or system architecture in future projects. This includes the right to develop and launch similar SaaS products even after delivering a custom software solution to a client.</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-green-800">
                    <strong>Declaration:</strong> Even when we have delivered all credentials and source code to the client, and we no longer possess any of their data, the client cannot challenge our right to use the same base working or system architecture in our own SaaS products or other client projects. Our understanding of the system and implementation methods remains our exclusive intellectual property.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Last updated date */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="text-gray-500 text-sm">
                Last updated: March 14, 2025
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

export default DeliveryPolicyPage;