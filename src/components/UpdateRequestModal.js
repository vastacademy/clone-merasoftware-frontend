import React, { useState, useRef } from 'react';
import { X, Upload, Send, FileText, Image } from 'lucide-react';
import SummaryApi from '../common';
import { toast } from 'sonner';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import imageCompression from 'browser-image-compression'; // You'll need to install this package
import SpinningLoader from './SpinningLoader';

const UpdateRequestModal = ({ plan, onClose, onSubmitSuccess }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  // File upload handling
  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
    const maxFileCount = 20; // Maximum 20 files allowed

    // Check if adding these files would exceed the limit
    if (files.length + uploadedFiles.length > maxFileCount) {
      toast.error(`Maximum ${maxFileCount} files allowed. You already have ${files.length} file${files.length !== 1 ? 's' : ''} uploaded.`);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Validate file types and sizes
    const validFiles = [];
    const invalidFiles = [];
    
    uploadedFiles.forEach(file => {
      // Check file size first
      if (file.size > maxFileSize) {
        invalidFiles.push({ name: file.name, reason: 'size' });
        return;
      }
      
      // Check file type
      const isValidImage = file.type.startsWith('image/jpeg') || file.type.startsWith('image/jpg');
      const isValidDocument = file.type === 'text/plain' || 
                              file.type === 'application/rtf' || 
                              file.type === 'application/pdf' || 
                              file.type === 'application/msword' || 
                              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (isValidImage || isValidDocument) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ name: file.name, reason: 'type' });
      }
    });
    
    // Show error messages for invalid files
    if (invalidFiles.length > 0) {
      const sizeErrors = invalidFiles.filter(file => file.reason === 'size');
      const typeErrors = invalidFiles.filter(file => file.reason === 'type');
      
      if (sizeErrors.length > 0) {
        toast.error(`${sizeErrors.length > 1 ? 'Some files exceed' : 'File exceeds'} the 5MB size limit`);
      }
      
      if (typeErrors.length > 0) {
        toast.error('Only JPG, PDF, DOC, RTF and TXT files are supported');
      }
    }
    
    // Process and add valid files
    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        // If it's an image, compress it
        if (file.type.startsWith('image/')) {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true
            };
            
            const compressedFile = await imageCompression(file, options);
            
            return {
              file: compressedFile,
              name: file.name,
              type: file.type,
              size: compressedFile.size,
              preview: URL.createObjectURL(compressedFile)
            };
          } catch (error) {
            console.error('Error compressing image:', error);
            toast.error(`Failed to compress ${file.name}`);
            return null;
          }
        }
        
        // For documents, just add them
        return {
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          preview: null
        };
      })
    );
    
    // Filter out any null values (failed processing)
    const successfullyProcessed = processedFiles.filter(file => file !== null);
    
    setFiles(prevFiles => [...prevFiles, ...successfullyProcessed]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeFile = (index) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  // Message handling
  const sendMessage = () => {
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, { 
      text: message.trim(),
      timestamp: new Date()
    }]);
    
    setMessage('');
    
    // Focus back on input after sending
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };
  
  // Final submission
  // Modified submitUpdateRequest function for UpdateRequestModal.js
  const submitUpdateRequest = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setIsUploading(true);
      
      // Create form data for the files
      const formData = new FormData();
      formData.append('planId', plan._id);
      
      // Add all instructions as a JSON string
      formData.append('instructions', JSON.stringify(messages));
      
      // Add each file separately with the same field name 'files'
      files.forEach((fileObj) => {
        formData.append('files', fileObj.file, fileObj.name);
      });
      
      console.log("Submitting update request...");
      
      // Submit the request
      try {
        const response = await fetch(SummaryApi.requestUpdate.url, {
          method: SummaryApi.requestUpdate.method,
          credentials: 'include',
          body: formData
        });
        
        // First check if response is ok
        if (!response.ok) {
          let errorMsg = `Server returned ${response.status}: ${response.statusText}`;
          
          try {
            // Try to parse the error response as JSON
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            // If we can't parse the error as JSON, try to get the text
            try {
              const errorText = await response.text();
              errorMsg = errorText || errorMsg;
            } catch (textError) {
              // Fall back to the default error message
            }
          }
          
          throw new Error(errorMsg);
        }
        
        // Now parse the successful response
        const data = await response.json();
        
        if (data.success) {
          toast.success('Update request submitted successfully');
          onSubmitSuccess?.();
          onClose();
        } else {
          toast.error(data.message || 'Failed to submit update request');
          setShowConfirmation(false);
        }
      } catch (error) {
        console.error('Error submitting update request:', error);
        toast.error(error.message || 'Failed to submit update request');
        setShowConfirmation(false);
      } finally {
        setIsUploading(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error preparing update request:', error);
      toast.error(error.message || 'Failed to submit update request');
      setShowConfirmation(false);
      setIsUploading(false);
      setLoading(false);
    }
  };
  
// Update the file icons to handle new file types
const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) {
    return <Image className="w-10 h-10 text-gray-400 mr-3" />;
  } else if (fileType === 'application/pdf') {
    return <FileText className="w-10 h-10 text-red-400 mr-3" />;
  } else if (fileType === 'application/msword' || 
             fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return <FileText className="w-10 h-10 text-blue-400 mr-3" />;
  } else {
    return <FileText className="w-10 h-10 text-gray-400 mr-3" />;
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-4 py-3 flex justify-between items-center">
          <h3 className="font-semibold text-lg">Request Website Update</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {loading && (
  <>
    {isUploading ? (
      <SpinningLoader totalFiles={files.length} />
    ) : (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <TriangleMazeLoader />
      </div>
    )}
  </>
)}
        
        {showConfirmation ? (
          /* Confirmation Screen */
          <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
            <div className="text-center mb-6">
              <h4 className="text-xl font-semibold mb-2">Confirm Update Request</h4>
              <p className="text-gray-600">
                You're about to use 1 of your available monthly updates. This action cannot be undone.
              </p>
            </div>
            
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
              <h5 className="font-medium mb-2">Summary</h5>
              <p><span className="text-gray-600">Plan:</span> {plan.productId?.serviceName}</p>
              <p><span className="text-gray-600">Files:</span> {files.length} files uploaded</p>
              <p><span className="text-gray-600">Instructions:</span> {messages.length} messages</p>
            </div>
            
            <div className="flex gap-4 mt-auto">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={submitUpdateRequest}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                disabled={loading}
              >
                Confirm and Submit
              </button>
            </div>
          </div>
        ) : (
          /* Main Update Request Form */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Content */}
            <div className="p-4 flex-1 overflow-auto">
              <div className="mb-6">
                <h4 className="font-medium mb-3">Upload Files</h4>
                <p className="text-sm text-gray-600 mb-4">
                Only JPG images, PDF, DOC, TXT and RTF documents are supported. Max file size: 5MB. Maximum 20 files allowed. Images will be automatically compressed.
                </p>

                {/* File upload button */}
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className={`border-2 border-dashed rounded-lg w-full p-6 flex flex-col items-center justify-center cursor-pointer ${
                      files.length >= 20
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className={`w-10 h-10 mb-2 ${files.length >= 20 ? 'text-gray-300' : 'text-gray-400'}`} />
                    <p className={`text-sm ${files.length >= 20 ? 'text-gray-400' : 'text-gray-600'}`}>
                      {files.length >= 20 ? 'Maximum files reached (20/20)' : `Click to upload or drag and drop (${files.length}/20)`}
                    </p>
                    <input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.txt,.rtf,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={files.length >= 20}
                    />
                  </label>
                </div>
                
                {/* File previews */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h5 className="font-medium text-sm">Uploaded Files</h5>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center bg-gray-50 p-3 rounded-lg">
                        {file.type.startsWith('image/') ? (
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded overflow-hidden mr-3">
                            <img 
                              src={file.preview} 
                              alt={file.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : getFileIcon(file.type)}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Instructions</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide clear instructions for your website update.
                </p>
                
                {/* Previous messages */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No instructions added yet. Use the form below to add instructions.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Message input */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={messageInputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your instructions here..."
                      className="w-full border rounded-lg p-3 min-h-[80px] focus:outline-none focus:border-blue-500 resize-none"
                    ></textarea>
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {message.length} characters
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className={`px-3 py-3 rounded-lg ${
                      !message.trim() 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  // Agar message field mein kuch hai to pehle usse send kar do
                if (message.trim()) {
                  setMessages(prev => [...prev, { 
                    text: message.trim(),
                    timestamp: new Date()
                  }]);
                  setMessage(''); // Clear the message field
                }
                // Phir confirmation screen pe jao
                 setShowConfirmation(true);
                }}
                disabled={files.length === 0 && messages.length === 0}
                className={`w-full py-2 rounded-lg font-medium ${
                  files.length === 0 && messages.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Proceed to Confirmation
              </button>
              
              {files.length === 0 && messages.length === 0 && (
                <p className="text-orange-500 text-xs mt-2 text-center">
                  Please upload files or add instructions to proceed
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateRequestModal;
