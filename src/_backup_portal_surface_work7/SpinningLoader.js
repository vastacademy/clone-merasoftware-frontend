import React from 'react';

const SpinningLoader = ({ totalFiles }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 flex-col">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
        
        <h3 className="text-xl font-semibold mb-4 text-center">Uploading Files</h3>
        
        {/* Status information */}
        <div className="text-center mb-4">
          <p className="text-gray-700">
            {totalFiles} file{totalFiles !== 1 ? 's' : ''} being uploaded
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while your files are being uploaded to our secure server.
          </p>
        </div>
        
        {/* Warning message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Do not refresh or close this page</strong> until the upload is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpinningLoader;