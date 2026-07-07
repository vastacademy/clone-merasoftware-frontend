import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const TermsAndConditionsPage = () => {
  // Reference to the content we want to download as PDF
  const contentRef = React.useRef(null);
  
  // Function to generate and download PDF
  const downloadPDF = async () => {
    const content = contentRef.current;
    if (!content) return;
    
    try {
      // Show a loading state or notification to the user
      const button = document.getElementById('download-btn');
      const originalText = button.textContent;
      button.textContent = 'Generating PDF...';
      button.disabled = true;
      
      // Use html2canvas to capture the content as an image
      const canvas = await html2canvas(content, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        letterRendering: true,
      });
      
      // Calculate dimensions for the PDF (A4 format)
      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add the image to the PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      // If content is longer than one page, handle multiple pages
      let position = 0;
      const pageHeight = pdf.internal.pageSize.height;
      
      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      // Save the PDF
      pdf.save('Terms_and_Conditions.pdf');
      
      // Reset button state
      button.textContent = originalText;
      button.disabled = false;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      
      // Reset button state in case of error
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
          <div className="bg-indigo-700 py-6 px-8">
            <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
            <p className="mt-2 text-indigo-100">Please read these terms carefully before using our services</p>
          </div>
          
          {/* Content */}
          <div className="py-8 px-8">
            <div className="space-y-10">
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">1</span>
                  Payment Terms
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <p>We offer two payment options:</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h3 className="font-medium text-indigo-800">Full Payment (Advance)</h3>
                      <p className="mt-2 text-sm">Customer pays 100% of the amount in advance before starting the project.</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h3 className="font-medium text-indigo-800">Partial Payment (Three Installments)</h3>
                      <ul className="mt-2 text-sm space-y-1">
                        <li>• 30% in advance before project begins</li>
                        <li>• 30% at 50% project completion</li>
                        <li>• 40% at 90% project completion</li>
                      </ul>
                    </div>
                  </div>
                  <p className="mt-3">Our automated system updates the progress according to the payment received, ensuring transparency for the client.</p>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">2</span>
                  Pricing Note
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <p>The pricing structure is based on the complexity of the project:</p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex">
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2">Basic functionalities do not affect the pricing</span>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2">Complex customizations will adjust the pricing accordingly</span>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2">Optional features can be added to customized plans with adjusted pricing</span>
                    </li>
                  </ul>
                  <p className="mt-3">Non-standard features will be discussed separately regarding additional costs and integration feasibility.</p>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">3</span>
                  Project Initiation & Agreement
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <p>Every project starts only after:</p>
                  <ul className="mt-3 space-y-1">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2">Completing proper documentation</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2">Conducting necessary meetings</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2">Receiving customer approval</span>
                    </li>
                  </ul>
                  <p className="mt-3">Since projects start only after full customer approval, refunds cannot be claimed based on misunderstandings or errors from the customer's side.</p>
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">4</span>
                  Project Changes & Modifications
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                    <p className="text-amber-700">Once development has started, no further changes will be accepted in the initial project scope.</p>
                  </div>
                  <p className="mt-4">If modifications are desired:</p>
                  <ol className="mt-2 space-y-2 list-decimal pl-5">
                    <li>The project must first be completed as per the agreed documentation</li>
                    <li>Changes or additional features will be considered as separate customization requests</li>
                    <li>Modifications will be handled after the initial project completion</li>
                  </ol>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">5</span>
                  Project Completion Time
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <p>Before beginning the project, we provide an estimated completion time in writing.</p>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700 italic">We will not be liable for exceeding the estimated timeline if there are delays in receiving required data or payments from the customer.</p>
                  </div>
                  <p className="mt-3">Customers must ensure timely cooperation in providing necessary details and payments to avoid any delays.</p>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">6</span>
                  Cancellation & Refund Policy
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-800">Partial Payment System</h3>
                      <p className="mt-2 text-sm">No refunds will be issued for payments already made if a customer decides to cancel the project.</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-800">Full Payment System</h3>
                      <p className="mt-2 text-sm">Refund will be provided after deducting the cost of completed work, based on mutual discussion and agreement.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">7</span>
                  Dispute Resolution
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <p>Any disputes arising between the customer and our company will be addressed through:</p>
                  <ol className="mt-2 space-y-1 list-decimal pl-5">
                    <li>Discussion and mutual understanding initially</li>
                    <li>Legal means as per applicable laws if a resolution is not reached</li>
                  </ol>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">8</span>
                  Acknowledgement
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <p>By starting a project with us, the customer acknowledges that they have read, understood, and agreed to all the terms mentioned in our documentation.</p>
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-indigo-800 font-medium">Important</p>
                    <p className="mt-1 text-indigo-700 text-sm">Customers must sign the agreement before we proceed with any work, ensuring clarity and mutual consent.</p>
                  </div>
                </div>
              </section>
              
              {/* Section 9 - New Tax Deduction section */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">9</span>
                  Tax Deduction at Source (TDS) & Payment Compliance
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <p>At Mera Software, we operate under two categories as per the Income Tax Act: Technical Services (Section 194J) and Contractual Work (Section 194C). The applicable TDS rate for both types of work is 2%, ensuring compliance with Indian tax regulations.</p>
                  
                  <div className="mt-4 space-y-4">
                    {/* 9.1 Technical Services */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h3 className="font-medium text-indigo-800">9.1 Technical Services (Section 194J - 2% TDS)</h3>
                      <ul className="mt-2 text-sm space-y-1">
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">We provide technical and IT services, including software development, IT consulting, and technical support.</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">As per Section 194J, a 2% TDS will be deducted on payments made for technical services.</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">TDS applies when the total payment exceeds ₹30,000 in a financial year.</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* 9.2 Contractual Work */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h3 className="font-medium text-indigo-800">9.2 Contractual Work (Section 194C - 2% TDS)</h3>
                      <ul className="mt-2 text-sm space-y-1">
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">We undertake contract-based projects, including website/app development, software project delivery, and outsourced development.</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">As per Section 194C, a 2% TDS will be deducted on payments for contract work.</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">TDS applies to payments exceeding ₹30,000 in a single transaction or ₹1,00,000 annually.</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* 9.3 General TDS Compliance */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h3 className="font-medium text-indigo-800">9.3 General TDS Compliance</h3>
                      <ul className="mt-2 text-sm space-y-1">
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">TDS will be deducted at the time of payment or when the amount is credited, whichever is earlier.</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">Proper invoices and tax documentation will be provided for all transactions.</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">Clients must ensure timely TDS deduction and deposit with the government.</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 mt-1">
                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-2">Any disputes regarding tax deductions shall be addressed as per applicable laws and agreement terms.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mr-3">10</span>
                  Data Submission & Processing
                </h2>
                <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                  <p>When you submit data to our platform, we will process and update it based on the clarity and accuracy of the information provided. If the submitted data lacks complete clarity, we will process and update it based on the best possible interpretation within the available clarity. However, we do not guarantee the accuracy of incomplete or unclear submissions. It is the client's responsibility to provide precise and complete information to ensure the best possible outcome.</p>
                  
                  <div className="mt-4 space-y-4">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h3 className="font-medium text-indigo-800">10.1 Processing Unclear Data</h3>
                      <p className="mt-2 text-sm">If any updates are consumed while processing unclear data, the client will need to correct any remaining issues in their next update. We do not provide additional revisions for incomplete data beyond the consumed update.</p>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <h3 className="font-medium text-indigo-800">10.2 Errors on Our End</h3>
                      <p className="mt-2 text-sm">However, if an issue arises due to an error on our end, the client may raise a support ticket through our support page. In such cases, our support team will resolve the issue with full responsibility at no additional cost, without consuming the client's update.</p>
                    </div>
                  </div>
                  </div>
                  </section>

            </div>

            {/* Last updated date only */}
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
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
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

export default TermsAndConditionsPage;