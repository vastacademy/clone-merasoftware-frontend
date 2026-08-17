import React, { useEffect, useState, useRef } from 'react';
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
  const [uploadServices, setUploadServices] = useState(plan?.isServicePlan ? [plan] : []);
  const [selectedServiceId, setSelectedServiceId] = useState(plan?.isServicePlan ? plan._id : '');
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (plan?.isServicePlan) return;
    fetch(SummaryApi.ordersList.url, { credentials: 'include' }).then((response) => response.json()).then((result) => {
      const services = (result.data || []).filter((order) => order.isServicePlan && order.servicePlanStatus === 'active' && (order.servicePlanSnapshot?.capability === 'upload_data' || order.servicePlanSnapshot?.serviceBehavior === 'portal_access_control'));
      setUploadServices(services);
      setSelectedServiceId(services[0]?._id || '');
    }).catch(() => toast.error('Could not load upload services.'));
  }, [plan]);
  const selectedService = uploadServices.find((service) => service._id === selectedServiceId) || null;

  // File upload handling
  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
    const maxFileCount = Number(selectedService?.servicePlanSnapshot?.filesLimit || 20);

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
      formData.append('planId', selectedService?._id || plan._id);
      if (selectedService) formData.append('serviceOrderId', selectedService._id);
      
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
  const chip = 'w-10 h-10 p-2 mr-3 rounded-lg border border-white/15 bg-white/10 flex-shrink-0';
  if (fileType.startsWith('image/')) {
    return <Image className={`${chip} text-white/70`} />;
  } else if (fileType === 'application/pdf') {
    return <FileText className={`${chip} text-rose-300`} />;
  } else if (fileType === 'application/msword' ||
             fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return <FileText className={`${chip} text-sky-300`} />;
  } else {
    return <FileText className={`${chip} text-white/70`} />;
  }
};


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      {/* Outer frame — the GREEN gradient scene the modal floats on (matches the mockup's .scene) */}
      <div className="w-full max-w-2xl max-h-[90vh] flex rounded-[1.5rem] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.06] bg-[radial-gradient(120%_120%_at_15%_0%,#1f6d54_0%,#143b3a_45%,#0d1b26_100%)]">
      {/* Inner modal — dark neutral glass floating on the green frame (matches .modal.glass) */}
      <div className="relative w-full flex flex-col rounded-[1.4rem] border border-white/[0.18] text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden bg-[rgba(20,26,32,0.55)] backdrop-blur-xl backdrop-saturate-150">
        {/* Top sheen, matching the page's glass cards */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.10] to-transparent" />
        {/* Header */}
        <div className="relative border-b border-white/15 px-5 py-4 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white">Upload Data</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
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
          <div className="relative flex-1 overflow-auto p-6 flex flex-col items-center">
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold mb-2 text-white">Confirm Update Request</h4>
              <p className="text-white/70">
                You're about to use 1 of your available monthly updates. This action cannot be undone.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-4 mb-6">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-3">Summary</h5>
              <div className="divide-y divide-white/10">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/70">Plan</span>
                  <span className="text-sm font-semibold text-white">{plan.productId?.serviceName}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/70">Files</span>
                  <span className="text-sm font-semibold tabular-nums text-white">{files.length} files uploaded</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/70">Instructions</span>
                  <span className="text-sm font-semibold tabular-nums text-white">{messages.length} messages</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-auto">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 bg-white/10 font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={submitUpdateRequest}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700 flex items-center disabled:opacity-50"
                disabled={loading}
              >
                Confirm and Submit
              </button>
            </div>
          </div>
        ) : (
          /* Main Update Request Form */
          <div className="relative flex-1 flex flex-col overflow-hidden">
            {/* Content */}
            <div className="p-4 flex-1 overflow-auto">
              <div className="mb-6">
                {uploadServices.length > 0 && <label className="mb-4 block"><span className="mb-1 block text-sm font-semibold text-white/80">Upload service</span><select className="w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2.5 text-sm text-white" value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)}>{uploadServices.map((service) => <option key={service._id} value={service._id}>{service.productId?.serviceName || service.orderItems?.[0]?.name} · {Math.max(0, Number(service.servicePlanSnapshot?.portalAccessCount || 0) - Number(service.serviceAccessUsedInCycle || 0))} attempts left</option>)}</select></label>}
                <h4 className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">Upload Files</h4>
                <p className="text-sm text-white/55 mb-4">
                Only JPG images, PDF, DOC, TXT and RTF documents are supported. Max file size: 5MB. Maximum 20 files allowed. Images will be automatically compressed.
                </p>

                {/* File upload button */}
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className={`border-2 border-dashed rounded-2xl w-full p-6 flex flex-col items-center justify-center cursor-pointer transition ${
                      files.length >= 20
                        ? 'border-white/15 bg-white/[0.04] cursor-not-allowed'
                        : 'border-white/25 bg-white/[0.06] hover:bg-white/10'
                    }`}
                  >
                    <Upload className={`w-10 h-10 mb-2 ${files.length >= 20 ? 'text-white/30' : 'text-emerald-400'}`} />
                    <p className={`text-sm ${files.length >= 20 ? 'text-white/40' : 'text-white/70'}`}>
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
                  <div className="mt-4">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">Uploaded Files</h5>
                    <div className="divide-y divide-white/10 border-t border-white/10">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center py-3">
                        {file.type.startsWith('image/') ? (
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden mr-3 border border-white/15">
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : getFileIcon(file.type)}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-white">{file.name}</p>
                          <p className="text-xs text-white/50 tabular-nums">
                            {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFile(index)}
                          className="ml-2 text-white/50 hover:text-rose-400 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">Instructions</h4>
                <p className="text-sm text-white/55 mb-4">
                  Please provide clear instructions for your website update.
                </p>

                {/* Previous messages */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 mb-4 max-h-48 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-4">
                      No instructions added yet. Use the form below to add instructions.
                    </p>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {messages.map((msg, index) => (
                        <div key={index} className="py-3 first:pt-0 last:pb-0">
                          <p className="text-sm text-white">{msg.text}</p>
                          <p className="text-xs text-white/50 mt-1 tabular-nums">
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
                      onKeyDown={(e) => {
                        // Enter sends the message; Shift+Enter inserts a new line.
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your instructions here... (Enter to add, Shift+Enter for new line)"
                      className="w-full rounded-xl border border-white/16 bg-white/[0.08] p-3 min-h-[80px] text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400/60 resize-none"
                    ></textarea>
                    <div className="absolute bottom-2 right-2 text-xs text-white/40 tabular-nums">
                      {message.length} characters
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className={`px-3 py-3 rounded-xl transition ${
                      !message.trim()
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-white/15">
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
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  files.length === 0 && messages.length === 0
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                Proceed to Confirmation
              </button>

              {files.length === 0 && messages.length === 0 && (
                <p className="text-amber-300 text-xs mt-2 text-center">
                  Please upload files or add instructions to proceed
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default UpdateRequestModal;
