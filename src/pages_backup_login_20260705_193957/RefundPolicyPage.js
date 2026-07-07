import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const RefundPolicyPage = () => {
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
      pdf.save('Refund_and_Cancellation_Policy.pdf');
      
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
    <div className="bg-purple-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Main content container with reference for PDF export */}
        <div ref={contentRef} className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-purple-700 py-6 px-8">
            <h1 className="text-3xl font-bold text-white">Refund and Cancellation Policy</h1>
            <p className="mt-2 text-purple-100">Last updated: March 14, 2025</p>
          </div>
          
          {/* Introduction */}
          <div className="py-8 px-8">
            <div className="text-gray-600 leading-relaxed mb-8">
              <p>
                We follow a transparent and well-defined refund and cancellation policy to ensure clarity between us and our clients. Our policies are based on the agreed terms before starting the project, and all aspects are documented for mutual understanding.
              </p>
            </div>
            
            {/* Section 1 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 mr-3">1</span>
                Payment Terms and Refund Eligibility
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  We offer two types of payment options:
                </p>
                
                <div className="mt-4">
                  <h3 className="font-medium text-gray-800">
                    (a) Full Payment System
                  </h3>
                  <div className="mt-2 pl-5 border-l-2 border-purple-200">
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 mt-1">
                          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="ml-2">If a client chooses to make the full payment upfront, it will be considered an advance payment.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 mt-1">
                          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="ml-2">In case the client decides to cancel the project, the refund will be processed based on the completed work. The amount for the completed work will be deducted, and the remaining balance will be refunded.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 mt-1">
                          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="ml-2">The refund will be issued only after a complete understanding of the work progress and mutual agreement.</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium text-gray-800">
                    (b) Partial Payment System (3 Installments)
                  </h3>
                  <div className="mt-2 pl-5 border-l-2 border-purple-200">
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 mt-1">
                          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="ml-2">The client must pay 30% of the total amount in advance before starting the project.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 mt-1">
                          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="ml-2">The second installment of 30% must be paid when 40% of the project is completed.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 mt-1">
                          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="ml-2">The final 40% payment must be made when 70% of the project is completed.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 mt-1">
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="ml-2 font-medium">In this payment method, no refund will be issued at any stage if the client chooses to cancel the project.</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-3">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-700">Full Payment</h4>
                      <p className="text-sm text-purple-600">Partial refund possible after deducting completed work costs</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-3">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-700">Partial Payment</h4>
                      <p className="text-sm text-purple-600">No refunds available at any stage if cancelled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 2 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 mr-3">2</span>
                Project Confirmation and Cancellation
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2">The project is started only after all requirements are finalized, documented, and approved by the client.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2">Before beginning development, we conduct detailed discussions and meetings to ensure the client's complete understanding of the project scope.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2">Once the development process starts, the client cannot request a refund by claiming any misunderstanding, as all terms and details are finalized beforehand.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2">If the client wishes to discontinue the project, no refund will be provided in the partial payment system, while in the full payment system, only the remaining amount after deducting completed work costs will be refunded.</span>
                  </li>
                </ul>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-700 italic">
                      All project requirements and terms are documented and signed off by the client before development begins.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 3 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 mr-3">3</span>
                Changes in Requirements After Development Begins
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Important:</strong> Once the documentation process is completed and the project enters the development stage, no changes will be allowed.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-4">
                  If the client wants modifications, they must wait until the current project is fully completed. After completion, customizations can be added separately.
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="max-w-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-lg font-medium text-gray-800">Original Project</h4>
                        <div className="mt-1 flex items-center">
                          <div className="mr-2 w-16 h-1 bg-purple-500 rounded"></div>
                          <span className="text-sm text-gray-600">Complete first</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-6 border-l-2 border-dashed border-purple-300 ml-6"></div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-lg font-medium text-gray-800">Modifications</h4>
                        <div className="mt-1 flex items-center">
                          <div className="mr-2 w-16 h-1 bg-purple-500 rounded"></div>
                          <span className="text-sm text-gray-600">Added after completion</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 4 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 mr-3">4</span>
                Delays and Responsibilities
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <div className="flex items-center mb-4">
                  <svg className="w-8 h-8 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p>We provide an estimated completion time in writing before starting the project.</p>
                  </div>
                </div>
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                  <p className="text-red-700">
                    If the project is delayed due to the client's late submission of data or delayed payments, we will not be held responsible for the extended timeline.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Section 5 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 mr-3">5</span>
                Pricing and Customization Terms
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="ml-2">Our pricing is based on predefined plans, and all deliverables will be clearly mentioned in written documentation.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="ml-2">Each feature and functionality will be discussed and finalized with the client before starting the work.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="ml-2">If the client requires any additional customizations, the pricing may vary depending on the complexity of the modifications.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="ml-2">Basic functionality additions may not affect the pricing significantly, but complex customizations can increase costs.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="ml-2">We also offer optional pre-built features that clients can choose to add, and the price adjustments will be visible accordingly.</span>
                  </li>
                </ul>
                
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        All pricing details and customization options will be clearly mentioned in the project documentation and agreed upon before project commencement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 6 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 mr-3">6</span>
                Dispute Resolution
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <div className="bg-gray-50 rounded-lg p-4 flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="mb-2">If any dispute arises, we will first try to resolve it through mutual understanding and discussion.</p>
                    <p>If the issue cannot be resolved amicably, it will be handled through legal channels.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 7 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 mr-3">7</span>
                Agreement and Acceptance
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="mb-3">
                    Starting a project with us means that the client has read and agreed to all terms mentioned in our documentation.
                  </p>
                  <p>
                    <strong>The client must acknowledge that they have reviewed and signed the agreement before the project begins.</strong>
                  </p>
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm">
                    <svg className="h-8 w-8 text-purple-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-gray-800 font-medium">
                      By following this policy, we ensure a clear, professional, and fair working relationship with our clients.
                    </p>
                  </div>
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
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
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

export default RefundPolicyPage;