import React, { useState, useEffect } from 'react';
import SummaryApi from '../common'; 
import StorageService from '../utils/storageService';
import {
  Code,
  Zap,
  Shield,
  Clock,
  Cloud,
  Rocket,
  RefreshCw,
  Globe,
  Layout,
  ShoppingCart,
  Building,
  User,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Check,
  Headset,
  PhoneCall,
  MessageCircle,
  LifeBuoy,
  Smartphone,
  Layers,
  PenTool,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2'; // PhoneInput इम्पोर्ट करें
import 'react-phone-input-2/lib/style.css'; // PhoneInput स्टाइल इम्पोर्ट करें
import { toast } from 'sonner'; 

const WebsiteDevelopmentPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
   // State for Standard Websites
  const [standardWebsitesData, setStandardWebsitesData] = useState([]);
  const [loadingStandardWebsites, setLoadingStandardWebsites] = useState(true);
  // State for Dynamic Websites
  const [dynamicWebsitesData, setDynamicWebsitesData] = useState([]);
  const [loadingDynamicWebsites, setLoadingDynamicWebsites] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔄 FORM STATE
  // const [businessCategory, setBusinessCategory] = useState('');
  // const [businessType, setBusinessType] = useState(''); 
  // const [updatePlan, setUpdatePlan] = useState('');     
  // const [whoUpdates, setWhoUpdates] = useState('');     
  // const [budgetRange, setBudgetRange] = useState('');
  // const [contactPreference, setContactPreference] = useState(''); 

   // 🔄 FORM STATE
      const [formData, setFormData] = useState({
        fullName: '',
        emailAddress: '',
        phoneNumber: '',
        companyName: '',
        businessCategory: '',
        businessType: '',
        updatePlan: '',
        whoUpdates: '',
        budgetRange: '',
        contactPreference: '',
        requirements: ''
      });

       // PhoneInput के लिए सक्रिय इनपुट स्थिति
    const [activeInput, setActiveInput] = useState(null);

   // Get user's country code based on location for phone input
      useEffect(() => {
        fetch('https://ipapi.co/json/')
          .then(response => response.json())
          .then(data => {
            setFormData(prev => ({
              ...prev,
              phoneNumber: data.country_calling_code ? data.country_calling_code.replace('+', '') : '91'
            }));
          })
          .catch(error => {
            console.error('Error fetching location data:', error);
            setFormData(prev => ({
              ...prev,
              phoneNumber: '91' // Default to India
            }));
          });
      }, []);

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
          phoneNumber: value
        }));
      };

      const handleInputFocus = (name) => {
        setActiveInput(name);
      };
      const handleInputBlur = () => {
        setActiveInput(null);
      };

  // ✅ UPDATED: Only 5 business categories, each with 5–9 sub-categories that typically need a website/software
  const businessTypes = [
    {
      category: "Professional Services",
      types: [
        "Law Firm",
        "Accounting Firm",
        "Consulting Firm",
        "Marketing Agency",
        "Real Estate Agent",
        "Insurance Agency",
        "Architect",
        "Photographer",
        "IT Services"
      ]
    },
    {
      category: "Retail & E-commerce",
      types: [
        "Clothing Store",
        "Electronics Store",
        "Jewelry Store",
        "Furniture Store",
        "Pharmacy",
        "Online Retailer (E-commerce)",
        "Sporting Goods Store",
        "Hardware Store"
      ]
    },
    {
      category: "Health & Wellness",
      types: [
        "Dentist",
        "Medical Clinic",
        "Therapist/Counselor",
        "Gym / Fitness Center",
        "Yoga Studio",
        "Spa",
        "Salon",
        "Optometrist"
      ]
    },
    {
      category: "Education & Training",
      types: [
        "School",
        "Tutoring Service",
        "Online Course Provider",
        "Coaching Center",
        "Language School",
        "Music School",
        "Training Institute"
      ]
    },
    {
      category: "Hospitality & Travel",
      types: [
        "Hotel",
        "Travel Agency",
        "Tour Operator",
        "Vacation Rental",
        "Restaurant",
        "Cafe",
        "Catering Service",
        "Event Venue",
        "Resort"
      ]
    }
  ];

   // ✅ NEW: hard limits (UI safety, even if data grows later)
  const CATEGORIES_LIMIT = 5;
  const SUBCATEGORIES_LIMIT = 9;

  // (unchanged) cards data used above on the page
  // const staticWebsites = [
  //   {
  //     name: "Portfolio Website",
  //     startingPrice: "6,999",
  //     specs: ["Responsive Design", "Contact Forms", "Personal Branding", "SEO Friendly", "Fast Loading"]
  //   },
  //   {
  //     name: "Business Website",
  //     startingPrice: "12,999",
  //     specs: ["Multi-page Layout", "Service Showcase", "About Us Page", "Contact Page", "Google Maps Integration", "Blog Integration"]
  //   },
  //   {
  //     name: "Landing Page",
  //     startingPrice: "4,999",
  //     specs: ["Single Page Design", "Strong Call-to-Action", "Lead Capture Form", "Fast Loading Speed", "Conversion Optimized"]
  //   },
  //   {
  //     name: "Restaurant Website",
  //     startingPrice: "8,999",
  //     specs: ["Menu Display", "Online Ordering Link", "Gallery", "Location Map", "Reservation Form", "Customer Reviews"]
  //   },
  //   {
  //     name: "Photography Website",
  //     startingPrice: "7,999",
  //     specs: ["High-Res Gallery", "Client Portal", "About Photographer", "Contact Form", "Watermarking Options", "Print Shop Integration"]
  //   }
  // ];

  // const dynamicWebsites = [
  //   {
  //     name: "E-commerce Platform",
  //     startingPrice: "25,999",
  //     specs: ["Payment Integration", "Inventory Management", "User Accounts", "Product Listings", "Order Tracking", "Analytics Dashboard"]
  //   },
  //   {
  //     name: "Web Application",
  //     startingPrice: "35,999",
  //     specs: ["User Dashboard", "Database Integration", "API Connectivity", "Custom Logic", "Real-time Updates", "Secure Authentication"]
  //   },
  //   {
  //     name: "CMS Platform",
  //     startingPrice: "20,999",
  //     specs: ["Admin Panel", "Content Editor", "User Roles", "SEO Tools", "Version Control", "Multi-language Support"]
  //   },
  //   {
  //     name: "Booking System",
  //     startingPrice: "18,999",
  //     specs: ["Online Booking", "Calendar Integration", "Availability Management", "Notifications", "Payment Gateway", "Automated Reminders"]
  //   },
  //   {
  //     name: "Learning Platform",
  //     startingPrice: "30,999",
  //     specs: ["Course Management", "Student Progress Tracking", "Quizzes & Assignments", "User Forums", "Certificate Generation", "Instructor Dashboard"]
  //   }
  // ];

const fetchFreshDataInBackground = async (categoryKey, setDataFunction) => {
    try {
        const response = await fetch(SummaryApi.filterProduct.url, {
            method: SummaryApi.filterProduct.method,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ category: [categoryKey] })
        });
        const dataResponse = await response.json();
        const freshData = dataResponse?.data || [];

        if (freshData.length > 0) {
            const visibleProducts = freshData.filter(product => !product.isHidden);
            const sortedFreshData = visibleProducts.sort((a, b) => a.sellingPrice - b.sellingPrice).slice(0, 2);

            // Only update if data is different
            setDataFunction(prevData => {
                if (JSON.stringify(sortedFreshData) !== JSON.stringify(prevData)) {
                    StorageService.setProductsData(categoryKey, visibleProducts); // Store full visible data
                    return sortedFreshData;
                }
                return prevData;
            });
        }
    } catch (error) {
        console.error(`Error refreshing ${categoryKey} in background:`, error);
    }
};


useEffect(() => {
    const fetchStandardWebsites = async () => {
        const categoryKey = 'standard_websites';

        try {
            setLoadingStandardWebsites(true);
            const cachedData = StorageService.getProductsData(categoryKey);

            if (cachedData && cachedData.length > 0) {
                const sortedCachedData = [...cachedData].filter(product => !product.isHidden).sort((a, b) => a.sellingPrice - b.sellingPrice);
                setStandardWebsitesData(sortedCachedData.slice(0, 2));
                setLoadingStandardWebsites(false);
                setTimeout(() => fetchFreshDataInBackground(categoryKey, setStandardWebsitesData), 1000);
                return;
            }

            const response = await fetch(SummaryApi.filterProduct.url, {
                method: SummaryApi.filterProduct.method,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ category: [categoryKey] })
            });
            const dataResponse = await response.json();

            if (dataResponse.success && dataResponse.data) {
                const visibleProducts = dataResponse.data.filter(product => !product.isHidden);
                const sortedData = visibleProducts.sort((a, b) => a.sellingPrice - b.sellingPrice).slice(0, 2);
                setStandardWebsitesData(sortedData);
                if (visibleProducts.length > 0) {
                    StorageService.setProductsData(categoryKey, visibleProducts);
                    StorageService.updateCacheTimestamp(categoryKey);
                }
            } else {
                console.error('Failed to fetch standard websites:', dataResponse.message);
            }
        } catch (error) {
            console.error('Error fetching standard websites:', error);
        } finally {
            setLoadingStandardWebsites(false);
        }
    };

    fetchStandardWebsites();
}, []); // Empty dependency array means this runs once on mount


useEffect(() => {
    const fetchDynamicWebsites = async () => {
        const categoryKey = 'dynamic_websites';

        try {
            setLoadingDynamicWebsites(true);
            const cachedData = StorageService.getProductsData(categoryKey);

            if (cachedData && cachedData.length > 0) {
                const sortedCachedData = [...cachedData].filter(product => !product.isHidden).sort((a, b) => a.sellingPrice - b.sellingPrice);
                setDynamicWebsitesData(sortedCachedData.slice(0, 2));
                setLoadingDynamicWebsites(false);
                setTimeout(() => fetchFreshDataInBackground(categoryKey, setDynamicWebsitesData), 1000);
                return;
            }

            const response = await fetch(SummaryApi.filterProduct.url, {
                method: SummaryApi.filterProduct.method,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ category: [categoryKey] })
            });
            const dataResponse = await response.json();

            if (dataResponse.success && dataResponse.data) {
                const visibleProducts = dataResponse.data.filter(product => !product.isHidden);
                const sortedData = visibleProducts.sort((a, b) => a.sellingPrice - b.sellingPrice).slice(0, 2);
                setDynamicWebsitesData(sortedData);
                if (visibleProducts.length > 0) {
                    StorageService.setProductsData(categoryKey, visibleProducts);
                    StorageService.updateCacheTimestamp(categoryKey);
                }
            } else {
                console.error('Failed to fetch dynamic websites:', dataResponse.message);
            }
        } catch (error) {
            console.error('Error fetching dynamic websites:', error);
        } finally {
            setLoadingDynamicWebsites(false);
        }
    };

    fetchDynamicWebsites();
}, []); // Empty dependency array means this runs once on mount


const getStaticWebsiteIcon = (serviceName) => {
    if (!serviceName) return null; // या एक डिफ़ॉल्ट प्लेसहोल्डर
    const firstLetter = serviceName.charAt(0).toUpperCase();
    return (
        <div className="w-6 h-6 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
            <span className="text-blue-700 font-bold text-sm md:text-2xl">{firstLetter}</span>
        </div>
    );
};
// getDynamicWebsiteIcon फंक्शन को अपडेट करें
const getDynamicWebsiteIcon = (serviceName) => {
    if (!serviceName) return null; // या एक डिफ़ॉल्ट प्लेसहोल्डर
    const firstLetter = serviceName.charAt(0).toUpperCase();
    return (
        <div className="w-6 h-6 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
            <span className="text-purple-800 font-bold text-sm md:text-2xl">{firstLetter}</span>
        </div>
    );
  };

  const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Basic validation
        if (!formData.fullName.trim()) {
          toast.error('Please enter your full name');
          setIsSubmitting(false);
          return;
        }
        if (!formData.emailAddress.trim() || !/^\S+@\S+\.\S+$/.test(formData.emailAddress)) {
          toast.error('Please enter a valid email address');
          setIsSubmitting(false);
          return;
        }
        if (!formData.phoneNumber || formData.phoneNumber.length < 8) {
          toast.error('Please enter a valid phone number');
          setIsSubmitting(false);
          return;
        }
        if (!formData.businessCategory) {
          toast.error('Please select a business category');
          setIsSubmitting(false);
          return;
        }
        if (!formData.businessType) {
          toast.error('Please select a business sub-category');
          setIsSubmitting(false);
          return;
        }

        if (!formData.updatePlan) {
          toast.error('Please select a website plan');
          setIsSubmitting(false);
          return;
        }
        if ((formData.updatePlan === 'occasional' || formData.updatePlan === 'mostly') && !formData.whoUpdates) {
          toast.error('Please specify who will do the updates');
          setIsSubmitting(false);
          return;
        }
        if (!formData.budgetRange) {
          toast.error('Please select a budget range');
          setIsSubmitting(false);
          return;
        }
        if (!formData.contactPreference) {
          toast.error('Please choose a contact method');
          setIsSubmitting(false);
          return;
        }
        if (!formData.requirements.trim()) {
          toast.error('Please describe your website requirements');
          setIsSubmitting(false);
          return;
        }

         try {
          const response = await fetch(SummaryApi.submitWebsiteRequirement.url, {
            method: SummaryApi.submitWebsiteRequirement.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const result = await response.json();
          if (result.success) {
            setFormSubmitted(true);
            toast.success(result.message);
            // Reset form data after successful submission
            setFormData({
              fullName: '',
              emailAddress: '',
              phoneNumber: '',
              companyName: '',
              businessCategory: '',
              businessType: '',
              updatePlan: '',
              whoUpdates: '',
              budgetRange: '',
              contactPreference: '',
              requirements: ''
            });
          } else {
            toast.error(result.message || 'Failed to submit requirements.');
          }
          } catch (error) {
          console.error('Error submitting website requirements:', error);
          toast.error('An error occurred. Please try again later.');
        } finally {
          setIsSubmitting(false);
        }
      };

  // 🔢 Budget options
  const budgetOptionsSmall = [
    { value: '500-1500', label: '₹500 – ₹1,500' },
    { value: '1500-3000', label: '₹1,500 – ₹3,000' },
    { value: '3000-5000', label: '₹3,000 – ₹5,000' },
    { value: '5000+', label: '₹5,000+' }
  ];
  const budgetOptionsSelfUpdates = [
    { value: '25000-40000', label: '₹25,000 – ₹40,000' },
    { value: '40000-80000', label: '₹40,000 – ₹80,000' },
    { value: '80000-200000', label: '₹80,000 – ₹2,00,000' },
    { value: '200000+', label: '₹2,00,000+' }
  ];

  // Helper: find subcategories for a chosen category (sliced to limit)
  const subTypesForSelectedCategory =
    (businessTypes.find((c) => c.category === formData.businessCategory)?.types || []).slice(0, SUBCATEGORIES_LIMIT);

  return (
    <div className="min-h-screen bg-white">{/* base set to white; per-section colors tell the story */}
      {/* 1) Header / Intro */}
      <section id="intro" className="py-12 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-10">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Website Development</h1>
      <p className="text-lg md:text-xl text-gray-600">
        Professional and Affordable Pure Coding Based Software Development for Everyone
      </p>
    </div>

    <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
      {/* Left visual card (unchanged height) */}
      <div className="relative">
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-5 text-white shadow-xl">
          <div className="w-full h-72 bg-white/20 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
            <img
              src="https://www.bdtask.com/blog/uploads/website-development-life-cycle.jpg"
              alt="Pure Coding Development"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold mb-0.5">Pure Coding Based</h3>
            <p className="text-white/90 text-xs">100% Custom Development</p>
          </div>
        </div>
      </div>

      {/* Right content (compacted) */}
      <div className="flex flex-col">
        {/* Intro claim */}
        <div className="mb-4">
          <p className="text-gray-900  md:text-lg leading-relaxed">
          <span className="font-semibold">We are the only company in our town</span> that develops 100% coding-based websites and software.
            We do not use shortcuts like WordPress or Shopify website builders.
          </p>
        </div>

        {/* Why coding-based */}
        <div className="mb-4">
          <p className="text-lg font-semibold">Why 100% Coding Based</p>
          <p className="text-gray-600 text-base leading-relaxed">
            We don’t want to limit your features or functionality, as website builders impose restrictions that
            can hinder automation and scalability.
          </p>
        </div>

        {/* Myth vs Reality as compact cards */}
        <div className="mb-3">
          <p className="text-lg font-semibold">Myth vs Reality</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 items-stretch">
            {/* Card 1 */}
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white h-full">
              <p className="text-gray-900 font-semibold text-md mb-1">
                Do coding-based websites cost more?
              </p>
              <p className="text-gray-900 text-md leading-relaxed">
              <span className="font-semibold">No</span> they are often cheaper because they follow a “pay as you need” model.
              </p>
            </div>

            {/* Card 2 */}
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white h-full">
              <p className="text-gray-900 font-semibold text-md mb-1">
                Why aren’t they popular?
              </p>
              <p className="text-gray-900 text-md leading-relaxed">
              <span className="font-semibold">Because</span> they require highly skilled developers, whereas builders let anyone create a site without coding.
              </p>
            </div>
          </div>

          {/* Click here line */}
          <p className="text-gray-600 mt-3 text-sm">
            More benefits of coding-based development —{" "}
            <a href="/coding-based-website-development" className="text-cyan-600 underline">Click here</a>.
          </p>

          {/* Connector line */}
          <p className="text-gray-900 mt-1 font-medium text-sm md:text-base">
            {/* Our purpose of work itself explains the way we work. */}
          </p>
        </div>

        {/* Badge kept subtle to save height */}
        {/* <div className="flex items-center text-cyan-600 mt-2">
          <Shield className="w-4 h-4 mr-2" />
          <span className="font-semibold text-sm">100% Custom Code Guarantee</span>
        </div> */}
      </div>
    </div>
  </div>
  </section>


  {/* 2) Our Working Strategy – 4 Steps (Left) + Client Plans & Upgrades (Right) */}
      <section id="guidance" className="py-16 bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <h1 className="text-5xl text-center font-bold text-gray-900 mb-12">Our purpose of work itself explains the way we work</h1>    
    <div className="grid md:grid-cols-2 gap-12">

      {/* LEFT: 4-Step Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 mb-6" aria-hidden="true" />
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Working Strategy</h2>
      <p className="text-md mb-8">
        <span className="font-semibold">Simple and transparent — </span>
        you approve before we start.
      </p>
      
      <div className="relative">
        <div className="absolute left-6 top-0 w-px bg-gradient-to-b from-blue-200 via-purple-200 to-emerald-200" style={{height: 'calc(100% - 2rem)'}} />
        
        <ul className="space-y-8">
          {/* 1 */}
          <li className="relative pl-14">
            <span className="absolute left-2 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold ring-2 ring-blue-100">1</span>
            <h3 className="text-gray-900 font-semibold">Connect & Understand</h3>
            <p className="text-sm text-gray-600">We listen to your needs, goals, and vision.</p>
          </li>
          
          {/* 2 */}
          <li className="relative pl-14">
            <span className="absolute left-2 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-50 text-cyan-700 font-semibold ring-2 ring-cyan-100">2</span>
            <h3 className="text-gray-900 font-semibold">Study Your Work & Expectations</h3>
            <p className="text-sm text-gray-600">We map how you work and the outcomes you expect.</p>
          </li>
          
          {/* 3 */}
          <li className="relative pl-14">
            <span className="absolute left-2 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-semibold ring-2 ring-indigo-100">3</span>
            <h3 className="text-gray-900 font-semibold">Portal Access + Prototype & Requirements</h3>
            <p className="text-sm text-gray-600">You get portal login, a prototype preview, and a clear requirements doc.</p>
          </li>
          
          {/* 4 */}
          <li className="relative pl-14">
            <span className="absolute left-2 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-semibold ring-2 ring-emerald-100">4</span>
            <h3 className="text-gray-900 font-semibold">Quotation & Project Start (With Trust)</h3>
            <p className="text-sm text-gray-600">Itemized quote with milestones — we begin after your approval.</p>
          </li>
        </ul>
      </div>
      
      <div className="mt-3 pt-6 border-t border-gray-100">
        <p className="text-blue-700 text-sm text-center">
          View our recent work below and discover your possible project estimate.
        </p>
      </div>
    </div>

      {/* RIGHT: Always With You – Trust & After-Service Focus */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
  <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 mb-6" aria-hidden="true" />
  <h2 className="text-3xl font-bold text-gray-900 mb-2">Support That Never Stops</h2>
  <p className="text-gray-900 mb-6">
  <span className="text-md "><span className='font-semibold'>We’re not here for a one-time job —</span> but to keep you always updated </span>
</p>

  <div className="grid sm:grid-cols-2 gap-5">
    <div className="p-5 rounded-xl border border-gray-100">
      <h3 className="font-semibold text-gray-900">Ongoing Updates</h3>
      <p className="text-sm text-gray-600 mt-1">Keep your site fresh with regular content & design updates.</p>
    </div>
    <div className="p-5 rounded-xl border border-gray-100">
      <h3 className="font-semibold text-gray-900">Feature Enhancements</h3>
      <p className="text-sm text-gray-600 mt-1">Add new tools and functions as your business grows.</p>
    </div>
    <div className="p-5 rounded-xl border border-gray-100">
      <h3 className="font-semibold text-gray-900">New Components</h3>
      <p className="text-sm text-gray-600 mt-1">Install ready-made sections like forms, galleries, and more.</p>
    </div>
    <div className="p-5 rounded-xl border border-gray-100">
      <h3 className="font-semibold text-gray-900">Hassle-Free Requests</h3>
      <p className="text-sm text-gray-600 mt-1">Send change requests easily via your client portal.</p>
    </div>
  </div>

  {/* CTA */}
  <div className="mt-4">
    <a
      href="/feature-upgrades-service" 
      className="group inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-5 py-3 text-sm font-medium hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
    >
      See After-Service & Updates
      <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 10H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"/>
      </svg>
    </a>
    <p className="text-sm text-purple-700 mt-4">
      Discover our hassle-free website updates, feature upgrades, and components.
    </p>
  </div>
</div>

    </div>
  </div>
  </section>

      {/* 3) Static Websites */}
      <section id="static" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Static Websites – Simple Solutions for a Strong Presence</h2>
            <p className="text-gray-600 text-xl">View our popular standard website options to guide your own budget and project scope.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {loadingStandardWebsites ? (
              // Loading skeleton for 2 cards
              <>
                {[...Array(2)].map((_, index) => (
                  <div key={`loading-static-${index}`} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 animate-pulse flex flex-col items-start text-left md:text-left md:block">
                    <div className="w-6 h-6 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
                      <div className="w-4 h-4 md:w-8 md:h-8 bg-blue-200 rounded-full"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-1 md:mb-3"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded mb-2 md:mb-4"></div>
                    <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                    <div className="h-8 w-full bg-blue-200 rounded-lg mt-4"></div>
                  </div>
                ))}
              </>
            ) : (
              // Render fetched data
              standardWebsitesData.map((website) => (
                <div
                  key={website._id} // Use unique ID from fetched data
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-200 flex flex-col items-start text-left md:text-left md:block"
                  // onClick={() => console.log(`Clicked on ${website.serviceName}`)} // You can remove this if not needed
                >
                  <div className="w-6 h-6 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
                    {getStaticWebsiteIcon(website.serviceName)} {/* Pass category for icon */}
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{website.serviceName}</h3>

                  <div className="hidden md:block mb-2 md:mb-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-1">
                      {/* Display first 3 features from packageIncludes */}
                      {(website.packageIncludes || []).slice(0, 3).map((spec, specIndex) => (
                        <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                          <Check className="w-3 h-3 text-blue-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                      {(website.packageIncludes || []).length > 3 && (
                        <Link to={`/product/${website._id}`} className="flex items-center text-blue-600 text-xs md:text-sm font-medium cursor-pointer hover:underline">
                          <Check className="w-3 h-3 text-blue-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>Click for more...</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between w-full">
                    <div className="flex items-baseline mb-1 md:mb-0 md:hidden">
                      <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                      <span className="text-base md:text-2xl font-bold text-blue-600 ml-1 md:ml-2">₹{(website.sellingPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="hidden md:flex md:items-end md:justify-between w-full">
                      <div className="text-left">
                        <span className="text-sm text-gray-500 block">Starts</span>
                        <span className="text-2xl font-bold text-blue-600">₹{(website.sellingPrice || 0).toLocaleString()}</span>
                      </div>
                      <Link to={`/product/${website._id}`} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors">
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* "Explore More" card remains */}
            <div className="flex flex-col items-center justify-center text-center p-3 md:p-6 cursor-pointer transition-all duration-300 hover:scale-105">
              <h3 className="text-base md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Explore More</h3>
              <p className="text-sm md:text-gray-600 mb-4 md:mb-6">View all our standard website options</p>
              <Link to="/static-websites" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm md:font-medium transition-colors">
                Explore More
              </Link>
            </div>
          </div>
        </div>
      </section>

     
      {/* 4) Dynamic Websites */}
      <section id="dynamic" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Dynamic Websites – Business Automation with Easy Content Management</h2>
            <p className="text-gray-600 text-xl">Update and control your website from one panel. Browse our recent dynamic websites to estimate your cost.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {loadingDynamicWebsites ? (
              // Loading skeleton for 2 cards
              <>
                {[...Array(2)].map((_, index) => (
                  <div key={`loading-dynamic-${index}`} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 animate-pulse flex flex-col items-start text-left md:text-left md:block">
                    <div className="w-6 h-6 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
                      <div className="w-4 h-4 md:w-8 md:h-8 bg-purple-200 rounded-full"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-1 md:mb-3"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded mb-2 md:mb-4"></div>
                    <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                    <div className="h-8 w-full bg-purple-200 rounded-lg mt-4"></div>
                  </div>
                ))}
              </>
            ) : (
              // Render fetched data
              dynamicWebsitesData.map((website) => (
                <div
                  key={website._id} // Use unique ID from fetched data
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-purple-200 flex flex-col items-start text-left md:text-left md:block"
                  // onClick={() => console.log(`Clicked on ${website.serviceName}`)} // You can remove this if not needed
                >
                  <div className="w-6 h-6 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
                    {getDynamicWebsiteIcon(website.serviceName)} {/* Pass category for icon */}
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{website.serviceName}</h3>

                  <div className="hidden md:block mb-2 md:mb-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-1">
                      {/* Display first 3 features from packageIncludes */}
                      {(website.packageIncludes || []).slice(0, 3).map((spec, specIndex) => (
                        <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                          <Check className="w-3 h-3 text-purple-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                      {(website.packageIncludes || []).length > 3 && (
                        <Link to={`/product/${website._id}`} className="flex items-center text-purple-600 text-xs md:text-sm font-medium cursor-pointer hover:underline">
                          <Check className="w-3 h-3 text-purple-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>Click for more...</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between w-full">
                    <div className="flex items-baseline mb-1 md:mb-0 md:hidden">
                      <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                      <span className="text-base md:text-2xl font-bold text-purple-800 ml-1 md:ml-2">₹{(website.sellingPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="hidden md:flex md:items-end md:justify-between w-full">
                      <div className="text-left">
                        <span className="text-sm text-gray-500 block">Starts</span>
                        <span className="text-2xl font-bold text-purple-800">₹{(website.sellingPrice || 0).toLocaleString()}</span>
                      </div>
                      <Link to={`/product/${website._id}`} className="bg-purple-600 hover:bg-purple-800 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors">
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="flex flex-col items-center justify-center text-center p-3 md:p-6 cursor-pointer transition-all duration-300 hover:scale-105">
              <h3 className="text-base md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Explore More</h3>
              <p className="text-sm md:text-gray-600 mb-4 md:mb-6">View all our dynamic website options</p>
              <Link to="/dynamic-websites" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm md:font-medium transition-colors">
                Explore More
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* 5) Client Support */}
      <section id="support" className="py-10 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-6 md:p-7">
      <div className="grid md:grid-cols-2 gap-6 items-center">

        {/* Left Side - Short Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Headset className="w-6 h-6 text-blue-700" />
            <h2 className="text-2xl font-bold text-gray-900">Instant Client Support</h2>
          </div>

          <p className="text-gray-700 leading-relaxed text-sm">
            Get help instantly inside your client portal.  
            Share issues anytime and talk directly with your developer or project manager — no waiting.
          </p>

          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <Check className="w-4 h-4 text-blue-700 mt-0.5 mr-2" />
              Real-time chat inside your secure portal
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-blue-700 mt-0.5 mr-2" />
              Direct contact with your project team
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-blue-700 mt-0.5 mr-2" />
              Instant updates & faster resolutions
            </li>
          </ul>

          <p className="text-xs text-gray-500">
            Available after login in your client portal.
          </p>
        </div>

        {/* Right Side - Compact Chat Example */}
        <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Project Support</p>
                <p className="text-xs text-gray-500">Online • Replies in minutes</p>
              </div>
            </div>
            <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Instant</span>
          </div>

          <div className="space-y-2">
            <div className="max-w-[85%] rounded-lg bg-gray-50 border border-gray-100 p-2">
              <p className="text-xs text-gray-800">
                Hi! My banner isn’t loading on mobile.
              </p>
              <p className="text-[10px] text-gray-500 mt-1">You • just now</p>
            </div>
            <div className="ml-auto max-w-[85%] rounded-lg bg-blue-50 border border-blue-100 p-2">
              <p className="text-xs text-gray-900">
                Got it — checking your deploy. Will update in minutes.
              </p>
              <p className="text-[10px] text-gray-500 mt-1">Dev • typing…</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <LifeBuoy className="w-3.5 h-3.5 text-purple-700" />
            Priority Response Guarantee
          </div>
        </div>

      </div>
    </div>
  </div>
  </section>


      {/* 6) Other Services */}
      <section id="others" className="py-12 bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    {/* Heading */}
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Explore Our Other Services</h2>
      <p className="text-gray-600">One team for complete end-to-end digital solutions</p>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
      
      {/* Cloud Software Development */}
      <a href="/cloud-software-service" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-200">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
          <Cloud className="w-6 h-6 text-blue-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Web App Development</h3>
        <p className="text-gray-600 text-sm mb-3">Scalable SaaS, cloud apps & integrations</p>
        <span className="inline-flex items-center text-blue-600 group-hover:text-blue-800 font-medium">
          See Details <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </a>

      {/* Software Solutions */}
      <a href="/software-solutions" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-200">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
          <Layers className="w-6 h-6 text-blue-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Software Solutions</h3>
        <p className="text-gray-600 text-sm mb-3">ERP, CRM, dashboards & automation</p>
        <span className="inline-flex items-center text-blue-600 group-hover:text-blue-800 font-medium">
          Explore More <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </a>

      {/* Mobile App Development */}
      <a href="/mobile-app-development-service" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-200">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
          <Smartphone className="w-6 h-6 text-blue-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Mobile App Development</h3>
        <p className="text-gray-600 text-sm mb-3">React Native / Flutter / Native Apps</p>
        <span className="inline-flex items-center text-blue-600 group-hover:text-blue-800 font-medium">
          Learn More <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </a>

      {/* Website / Software Updates */}
      <a href="/feature-upgrades-service" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-200">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-blue-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Website / Software Updates</h3>
        <p className="text-gray-600 text-sm mb-3">Regular updates, fixes & feature upgrades</p>
        <span className="inline-flex items-center text-blue-600 group-hover:text-blue-800 font-medium">
          Get Started <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </a>

    </div>
  </div>
    </section>

      {/* 7) Custom Development Form */}
       <section id="custom-form" className="py-12 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Couldn't find a suitable website type?</h2>
                <p className="text-gray-600 text-xl">
                  Don't worry! We'll build you a custom website from scratch.
                </p>
              </div>

              {!formSubmitted ? (
                <form onSubmit={handleFormSubmit} className="bg-gradient-to-br from-blue-300 to-purple-200 rounded-2xl p-8 shadow-lg">
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          onFocus={() => handleInputFocus('fullName')}
                          onBlur={handleInputBlur}
                          className={`peer block w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 ${activeInput === 'fullName' ? 'border-transparent ring-2 ring-blue-500' : ''}`}
                          placeholder=" "
                          required
                        />
                        <label
                          htmlFor="fullName"
                          className={`absolute ${formData.fullName ? 'text-xs -top-2 left-2 bg-white px-1' : activeInput === 'fullName' ? 'text-xs -top-2 left-2 bg-white px-1' : 'text-sm top-3.5 left-4 text-gray-500'} transition-all duration-200`}
                        >
                          Full Name
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          id="emailAddress"
                          name="emailAddress"
                          value={formData.emailAddress}
                          onChange={handleInputChange}
                          onFocus={() => handleInputFocus('emailAddress')}
                          onBlur={handleInputBlur}
                          className={`peer block w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 ${activeInput === 'emailAddress' ? 'border-transparent ring-2 ring-blue-500' : ''}`}
                          placeholder=" "
                          required
                        />
                        <label
                          htmlFor="emailAddress"
                          className={`absolute ${formData.emailAddress ? 'text-xs -top-2 left-2 bg-white px-1' : activeInput === 'emailAddress' ? 'text-xs -top-2 left-2 bg-white px-1' : 'text-sm top-3.5 left-4 text-gray-500'} transition-all duration-200`}
                        >
                          Email Address
                        </label>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <div className={`mt-1 ${activeInput === 'phoneNumber' ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}>
                          <PhoneInput
                            country={'in'}
                            value={formData.phoneNumber}
                            onChange={handlePhoneChange}
                            inputProps={{
                              id: 'phoneNumber',
                              name: 'phoneNumber',
                              required: true,
                              className: 'w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200',
                              onFocus: () => handleInputFocus('phoneNumber'),
                              onBlur: handleInputBlur,
                            }}
                            containerClass="phone-input-container"
                            buttonClass="phone-input-button"
                            dropdownClass="phone-input-dropdown"
                          />
                        </div>
                        <label
                          htmlFor="phoneNumber"
                          className={`absolute ${formData.phoneNumber ? 'text-xs -top-2 left-2 bg-white px-1 z-10' : activeInput === 'phoneNumber' ? 'text-xs -top-2 left-2 bg-white px-1 z-10' : 'text-sm top-3.5 left-12 text-gray-500 z-10'} transition-all duration-200`}
                        >
                          Phone Number
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          onFocus={() => handleInputFocus('companyName')}
                          onBlur={handleInputBlur}
                          className={`peer block w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 ${activeInput === 'companyName' ? 'border-transparent ring-2 ring-blue-500' : ''}`}
                          placeholder=" "
                        />
                        <label
                          htmlFor="companyName"
                          className={`absolute ${formData.companyName ? 'text-xs -top-2 left-2 bg-white px-1' : activeInput === 'companyName' ? 'text-xs -top-2 left-2 bg-white px-1' : 'text-sm top-3.5 left-4 text-gray-500'} transition-all duration-200`}
                        >
                          Company Name (Optional)
                        </label>
                      </div>
                    </div>

                    {/* STEP 1: Business Category (max 5 in UI) */}
                    <div>
                      <label htmlFor="businessCategory" className="block text-gray-700 font-medium mb-2">Business Category</label>
                      <select
                        id="businessCategory"
                        name="businessCategory"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.businessCategory}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            businessCategory: e.target.value,
                            businessType: '', // Reset sub-category
                            updatePlan: '',
                            whoUpdates: '',
                            budgetRange: '',
                            contactPreference: ''
                          }));
                        }}
                      >
                        <option value="">Select your business category</option>
                        {businessTypes.slice(0, CATEGORIES_LIMIT).map((c, i) => (
                          <option key={i} value={c.category}>{c.category}</option>
                        ))}
                      </select>
                    </div>

                    {/* STEP 2: Sub Category (5–9 in UI) */}
                    {formData.businessCategory && (
                      <div>
                        <label htmlFor="businessType" className="block text-gray-700 font-medium mb-2">Business Sub-Category</label>
                        <select
                          id="businessType"
                          name="businessType"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.businessType}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              businessType: e.target.value,
                              updatePlan: '',
                              whoUpdates: '',
                              budgetRange: '',
                              contactPreference: ''
                            }));
                          }}
                        >
                          <option value="">Select a sub-category</option>
                          {subTypesForSelectedCategory.map((t, idx) => (
                            <option key={idx} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* STEP 3: Website Update Plan */}
                    {formData.businessType && (
                      <div>
                        <label htmlFor="updatePlan" className="block text-gray-700 font-medium mb-2">Website Plan — Updates</label>
                        <select
                          id="updatePlan"
                          name="updatePlan"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.updatePlan}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              updatePlan: e.target.value,
                              whoUpdates: '',
                              budgetRange: '',
                              contactPreference: ''
                            }));
                          }}
                        >
                          <option value="">How will you update the website?</option>
                          <option value="one-time">One-time website development</option>
                          <option value="occasional">Occasional updates</option>
                          <option value="mostly">Mostly updated (frequent updates)</option>
                        </select>
                      </div>
                    )}

                    {/* STEP 4A: If One-time → Budget (small) */}
                    {formData.updatePlan === 'one-time' && (
                      <div>
                        <label htmlFor="budgetRange" className="block text-gray-700 font-medium mb-2">Budget Range</label>
                        <select
                          id="budgetRange"
                          name="budgetRange"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.budgetRange}
                          onChange={handleInputChange}
                        >
                          <option value="">Select budget range</option>
                          {budgetOptionsSmall.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* STEP 4B: If Occasional or Mostly → who updates + budget */}
                    {(formData.updatePlan === 'occasional' || formData.updatePlan === 'mostly') && (
                      <>
                        <div>
                          <label htmlFor="whoUpdates" className="block text-gray-700 font-medium mb-2">
                            Who will do the updates?
                          </label>
                          <select
                            id="whoUpdates"
                            name="whoUpdates"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.whoUpdates}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                whoUpdates: e.target.value,
                                budgetRange: ''
                              }));
                            }}
                          >
                            <option value="">Select an option</option>
                            <option value="self">I will update myself</option>
                            <option value="us">You/Developer will update</option>
                          </select>
                        </div>

                        {formData.whoUpdates && (
                          <div>
                            <label htmlFor="budgetRange" className="block text-gray-700 font-medium mb-2">Budget Range</label>
                            <select
                              id="budgetRange"
                              name="budgetRange"
                              required
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={formData.budgetRange}
                              onChange={handleInputChange}
                            >
                              <option value="">Select budget range</option>
                              {(formData.whoUpdates === 'self' ? budgetOptionsSelfUpdates : budgetOptionsSmall).map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {/* STEP 5: Contact Preference */}
                    {(formData.updatePlan === 'one-time' ? formData.budgetRange : formData.whoUpdates && formData.budgetRange) && (
                      <div>
                        <label htmlFor="contactPreference" className="block text-gray-700 font-medium mb-2">How should we contact you?</label>
                        <select
                          id="contactPreference"
                          name="contactPreference"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.contactPreference}
                          onChange={handleInputChange}
                        >
                          <option value="">Choose a contact method</option>
                          <option value="callback">Call back</option>
                          <option value="chat">Chat (WhatsApp/Message)</option>
                          <option value="meeting">In-person meeting</option>
                        </select>
                      </div>
                    )}

                    {/* Requirements textarea */}
                    <div className="relative">
                      <textarea
                        id="requirements"
                        name="requirements"
                        rows="4"
                        value={formData.requirements}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus('requirements')}
                        onBlur={handleInputBlur}
                        className={`peer block w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 ${activeInput === 'requirements' ? 'border-transparent ring-2 ring-blue-500' : ''}`}
                        placeholder=" "
                        required
                      ></textarea>
                      <label
                        htmlFor="requirements"
                        className={`absolute ${formData.requirements ? 'text-xs -top-2 left-2 bg-white px-1' : activeInput === 'requirements' ? 'text-xs -top-2 left-2 bg-white px-1' : 'text-sm top-3.5 left-4 text-gray-500'} transition-all duration-200`}
                      >
                        Describe your website requirements
                      </label>
                    </div>

                    <div className="text-center">
                      <button
                        type="submit"
                        className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center mx-auto ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting ||
                          !formData.businessCategory ||
                          !formData.businessType ||
                          !formData.updatePlan ||
                          (formData.updatePlan !== 'one-time' && !formData.whoUpdates) ||
                          !formData.budgetRange ||
                          !formData.contactPreference ||
                          !formData.fullName.trim() ||
                          !formData.emailAddress.trim() ||
                          !formData.phoneNumber.trim() ||
                          !formData.requirements.trim()
                        }
                        title={isSubmitting ? "Submitting..." : "Please complete all steps before submitting"}
                      >
                        {isSubmitting ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <>
                            Submit Requirements
                            <ChevronRight className="ml-2 w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center shadow-lg">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h3>
                  <p className="text-gray-600 mb-6">
                    Your requirements have been submitted. Our team will contact you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ // Reset all form fields
                        fullName: '',
                        emailAddress: '',
                        phoneNumber: '',
                        companyName: '',
                        businessCategory: '',
                        businessType: '',
                        updatePlan: '',
                        whoUpdates: '',
                        budgetRange: '',
                        contactPreference: '',
                        requirements: ''
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Submit Another Request
                  </button>
                </div>
              )}
            </div>
    </section>
    </div>
  );
};

export default WebsiteDevelopmentPage;
