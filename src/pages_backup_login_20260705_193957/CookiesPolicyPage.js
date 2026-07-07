import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const CookiesPolicyPage = () => {
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
      pdf.save('Cookies_Policy.pdf');
      
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
          <div className="bg-blue-700 py-6 px-8">
            <h1 className="text-3xl font-bold text-white">Cookies Policy</h1>
            <p className="mt-2 text-blue-100">Last updated: March 14, 2025</p>
          </div>
          
          {/* Content */}
          <div className="py-8 px-8">
            {/* Introduction section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 mr-3">1</span>
                What Are Cookies
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  Our website uses cookies to improve user experience and service efficiency. Cookies are small files stored on a user's device that help track interactions and preferences.
                </p>
                <div className="mt-4 flex items-center">
                  <div className="w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"></path>
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    </svg>
                  </div>
                  <div className="ml-4 bg-blue-50 p-3 rounded-lg flex-grow">
                    <p className="text-sm text-blue-800">
                      <strong>What is a cookie?</strong> A cookie is a small text file that a website saves on your computer or mobile device when you visit the site. It enables the website to remember your actions and preferences over a period of time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* How We Use Cookies section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 mr-3">2</span>
                How We Use Cookies
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  We use cookies to analyze user behavior, store site preferences, and enhance security, particularly for authentication processes. These cookies allow us to ensure a smoother browsing experience and improve system functionality.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-blue-600 mb-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-800">Analytics</h3>
                    <p className="mt-1 text-sm text-gray-600">Track user behavior to improve our services</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-blue-600 mb-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-800">Preferences</h3>
                    <p className="mt-1 text-sm text-gray-600">Remember your site settings and options</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-blue-600 mb-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-800">Security</h3>
                    <p className="mt-1 text-sm text-gray-600">Enhance security for authentication processes</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cookie Management section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 mr-3">3</span>
                Managing Cookies
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  Users have the option to manage, control, or disable cookies through their browser settings. However, disabling cookies may impact the functionality and usability of certain website features.
                </p>
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Important:</strong> Disabling cookies may impact the functionality and usability of certain website features.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium text-gray-700 mb-2">How to manage cookies in your browser:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Chrome: Settings → Privacy and Security → Cookies and other site data</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Firefox: Options → Privacy & Security → Cookies and Site Data</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Safari: Preferences → Privacy → Cookies and website data</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Edge: Settings → Cookies and site permissions</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Third-Party Cookies section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 mr-3">4</span>
                Third-Party Cookies
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  We do not use cookies to collect personal information or share data with third parties. Some third-party services integrated into our website may use their own cookies, and users are advised to check their respective policies for further details.
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700 italic">
                    Third-party services may include analytics tools, social media sharing buttons, or embedded content from other domains.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Consent section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 mr-3">5</span>
                Your Consent
              </h2>
              <div className="mt-4 pl-11 text-gray-600 leading-relaxed">
                <p>
                  By using our website and services, users agree to our Privacy Policy and Cookies Policy.
                </p>
                <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-800">
                    <strong>Note:</strong> You can review our full <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a> for more information about how we handle your data.
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
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
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

export default CookiesPolicyPage;