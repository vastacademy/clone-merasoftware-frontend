import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import SummaryApi from '../common';
import '../index.css'
import { toast } from 'sonner';
import Context from '../context';

const LoginContactForm = ({ isOpen, onClose, productId }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: 'I would like to create a new account to place an order.'
  });
  const formRef = useRef(null);
  const [activeInput, setActiveInput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const navigate = useNavigate();
  
  // For animation
  const [isClosing, setIsClosing] = useState(false);

  // Get user's country code based on location
  useEffect(() => {
    if (isOpen) {
      // Only fetch location when the popup is open
      fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
          setFormData(prev => ({
            ...prev,
            phone: data.country_calling_code ? data.country_calling_code.replace('+', '') : '91'
          }));
        })
        .catch(error => {
          console.error('Error fetching location data:', error);
          setFormData(prev => ({
            ...prev,
            phone: '91' // Default to India
          }));
        });
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (value) => {
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
  };

  const handleInputFocus = (name) => {
    setActiveInput(name);
  };

  const handleInputBlur = () => {
    setActiveInput(null);
  };

  const handleLogin = () => {
    // Save productId in session storage for redirect after login
    if (productId) {
      const userSelections = {
        productId,
      };
      sessionStorage.setItem('userProductSelections', JSON.stringify(userSelections));
    }
    
    // Redirect to login page
    navigate('/login');
    onClose();
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!formData.phone || formData.phone.length < 8) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    // Add form submission animation
    setIsSubmitting(true);
    
    try {
      // Send form data to API
      const response = await fetch(SummaryApi.contactUs.url, {
        method: SummaryApi.contactUs.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          requestType: 'account_creation',
          productId: productId // Include productId if available
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        toast.success('Your request has been submitted successfully!');
        
        // Reset form after successful submission
        setTimeout(() => {
          setSubmitSuccess(false);
          handleClose();
          
          // Reset form data
          setFormData({
            name: '',
            email: '',
            phone: '',
            message: 'I would like to create a new account to place an order.'
          });
        }, 2000);
      } else {
        setIsSubmitting(false);
        toast.error(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      toast.error('Failed to submit form. Please try again later.');
    }
  };

  const handleClose = () => {
    // Add closing animation
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleOutsideClick = (e) => {
    if (formRef.current && !formRef.current.contains(e.target)) {
      handleClose();
    }
  };

  useEffect(() => {
    // Add event listener for clicks outside the form
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      style={{
        animation: isClosing ? 'fadeOut 0.3s ease-in forwards' : 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        ref={formRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative transform transition-all duration-300"
        style={{
          animation: isClosing ? 'slideDown 0.3s ease-in forwards' : 'slideUp 0.4s ease-out',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none bg-white rounded-full p-1.5 transition-colors duration-200 hover:bg-gray-100"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-center text-gray-800 mb-3">Login Required</h2>
          
          <p className="text-sm text-gray-600 mb-5 text-center">
            Please login to proceed with the purchase. If you are a new customer, please contact us to create an account.
          </p>
          
          <div className="flex justify-center mb-6">
            <button 
              onClick={handleLogin}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-transform duration-200 hover:scale-105 shadow-md"
            >
              Login
            </button>
          </div>
          
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-gray-200 flex-grow"></div>
            <span className="px-3 bg-white text-gray-400 text-xs uppercase font-medium">OR</span>
            <div className="border-t border-gray-200 flex-grow"></div>
          </div>
          
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <h3 className="text-base font-medium text-gray-800 mb-3">Contact Us</h3>
            
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus('name')}
                onBlur={handleInputBlur}
                className={`peer block w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 ${activeInput === 'name' ? 'border-transparent ring-2 ring-blue-500' : ''}`}
                placeholder=" "
                required
              />
              <label 
                htmlFor="name" 
                className={`absolute ${formData.name ? 'text-xs -top-2 left-2 bg-white px-1' : activeInput === 'name' ? 'text-xs -top-2 left-2 bg-white px-1' : 'text-sm top-3.5 left-4 text-gray-500'} transition-all duration-200`}
              >
                Full Name
              </label>
            </div>
            
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus('email')}
                onBlur={handleInputBlur}
                className={`peer block w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 ${activeInput === 'email' ? 'border-transparent ring-2 ring-blue-500' : ''}`}
                placeholder=" "
                required
              />
              <label 
                htmlFor="email" 
                className={`absolute ${formData.email ? 'text-xs -top-2 left-2 bg-white px-1' : activeInput === 'email' ? 'text-xs -top-2 left-2 bg-white px-1' : 'text-sm top-3.5 left-4 text-gray-500'} transition-all duration-200`}
              >
                Email
              </label>
            </div>
            
            {/* Phone Input with Country Code */}
            <div className="relative">
              <div className={`mt-1 ${activeInput === 'phone' ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}>
                <PhoneInput
                  country={'in'} // Default to India, but will be changed by useEffect
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  inputProps={{
                    id: 'phone',
                    name: 'phone',
                    required: true,
                    className: 'w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200',
                    onFocus: () => handleInputFocus('phone'),
                    onBlur: handleInputBlur,
                  }}
                  containerClass="phone-input-container"
                  buttonClass="phone-input-button"
                  dropdownClass="phone-input-dropdown"
                />
              </div>
              <label 
                htmlFor="phone" 
                className={`absolute ${formData.phone ? 'text-xs -top-2 left-2 bg-white px-1 z-10' : activeInput === 'phone' ? 'text-xs -top-2 left-2 bg-white px-1 z-10' : 'text-sm top-3.5 left-12 text-gray-500 z-10'} transition-all duration-200`}
              >
                Phone Number
              </label>
            </div>
            
            <div className="relative">
              <textarea
                id="message"
                name="message"
                rows="3"
                value={formData.message}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus('message')}
                onBlur={handleInputBlur}
                className={`peer block w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 ${activeInput === 'message' ? 'border-transparent ring-2 ring-blue-500' : ''}`}
                placeholder=" "
                required
              ></textarea>
              <label 
                htmlFor="message" 
                className={`absolute ${formData.message ? 'text-xs -top-2 left-2 bg-white px-1' : activeInput === 'message' ? 'text-xs -top-2 left-2 bg-white px-1' : 'text-sm top-3.5 left-4 text-gray-500'} transition-all duration-200`}
              >
                Message
              </label>
            </div>
            
            <div className="mt-6">
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none transition-all duration-300 transform ${isSubmitting ? 'opacity-70' : submitSuccess ? 'bg-green-500 hover:bg-green-600' : ''} ${!isSubmitting && !submitSuccess ? 'hover:scale-105' : ''}`}
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                {isSubmitting ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : submitSuccess ? (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : null}
                {isSubmitting ? 'Submitting...' : submitSuccess ? 'Submitted Successfully!' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginContactForm;