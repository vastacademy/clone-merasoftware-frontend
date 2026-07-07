import React, { useState, useEffect } from 'react';
import SummaryApi from '../common'; 
import StorageService from '../utils/storageService';
import {
  Cloud,
  Server,
  Database,
  Shield,
  Zap,
  Code,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Check,
  Headset,
  Smartphone,
  Layers,
  RefreshCw,
  TrendingUp,
  Globe,
  Settings,
  Lock,
  Scale,
  Cpu,
  Link,
  Move,
  Phone
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const CloudSoftwareDevelopmentPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);

   // State for Cloud Service Offerings (web_applications)
  const [cloudOfferingsData, setCloudOfferingsData] = useState([]);
  const [loadingCloudOfferings, setLoadingCloudOfferings] = useState(true);

  // 🔄 FORM STATE (reusing from WebsiteDevelopmentService for consistency)
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessType, setBusinessType] = useState(''); // sub-category
  const [updatePlan, setUpdatePlan] = useState('');     // 'one-time' | 'occasional' | 'mostly'
  const [whoUpdates, setWhoUpdates] = useState('');     // 'self' | 'us'
  const [budgetRange, setBudgetRange] = useState('');
  const [contactPreference, setContactPreference] = useState(''); // 'callback' | 'chat' | 'meeting'

  // ✅ NEW: hard limits (UI safety, even if data grows later)
  const CATEGORIES_LIMIT = 5;
  const SUBCATEGORIES_LIMIT = 9;

  // ✅ UPDATED: Business categories tailored for Cloud Software
  const businessTypes = [
    {
      category: "Enterprise Solutions",
      types: [
        "CRM Systems",
        "ERP Solutions",
        "Supply Chain Management",
        "HR Management Systems",
        "Project Management Tools",
        "Data Analytics Platforms",
        "Financial Software",
        "Compliance & Risk Management"
      ]
    },
    {
      category: "SaaS Products",
      types: [
        "Subscription Management",
        "Marketing Automation",
        "Customer Support Tools",
        "E-learning Platforms",
        "Healthcare Management",
        "Fintech Applications",
        "Real Estate Software",
        "Logistics & Fleet Management"
      ]
    },
    {
      category: "Data & AI Solutions",
      types: [
        "Big Data Platforms",
        "Machine Learning Models",
        "AI-powered Analytics",
        "Predictive Maintenance",
        "Natural Language Processing",
        "Computer Vision Systems",
        "Data Warehousing",
        "Business Intelligence Dashboards"
      ]
    },
    {
      category: "IoT & Edge Computing",
      types: [
        "Smart Home Systems",
        "Industrial IoT Solutions",
        "Connected Devices Platforms",
        "Real-time Data Processing",
        "Remote Monitoring Systems",
        "Asset Tracking",
        "Smart City Applications"
      ]
    },
    {
      category: "DevOps & Infrastructure",
      types: [
        "Cloud Migration Services",
        "Infrastructure as Code",
        "Containerization (Docker/Kubernetes)",
        "CI/CD Pipelines",
        "Cloud Security Solutions",
        "Performance Monitoring",
        "Disaster Recovery Solutions"
      ]
    }
  ];

  // const cloudServiceOfferings = [
  //   {
  //     name: "SaaS Product Development",
  //     startingPrice: "50,000",
  //     specs: ["Multi-tenant Architecture", "Subscription Billing", "User Management", "Scalable Infrastructure", "API Integrations", "Analytics Dashboard"],
  //     icon: <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
  //   },
  //   {
  //     name: "Custom Cloud Applications",
  //     startingPrice: "75,000",
  //     specs: ["Tailored Workflows", "Database Design", "Microservices Architecture", "Secure Authentication", "Real-time Processing", "Third-party Integrations"],
  //     icon: <Settings className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
  //   },
  //   {
  //     name: "Cloud Integration Services",
  //     startingPrice: "30,000",
  //     specs: ["API Development", "System Connectors", "Data Synchronization", "Workflow Automation", "Legacy System Integration", "Middleware Solutions"],
  //     icon: <Link className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
  //   },
  //   {
  //     name: "Cloud Migration & Modernization",
  //     startingPrice: "40,000",
  //     specs: ["Lift & Shift", "Re-platforming", "Re-architecting", "Data Migration", "Application Modernization", "Cost Optimization"],
  //     icon: <Move className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
  //   },
  //   {
  //     name: "Cloud Security & Compliance",
  //     startingPrice: "20,000",
  //     specs: ["Identity & Access Management", "Data Encryption", "Vulnerability Assessments", "Compliance Audits (GDPR, HIPAA)", "Threat Detection", "Security Monitoring"],
  //     icon: <Lock className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
  //   }
  // ];

  // MultipleFiles/WebSoftwareService.js

useEffect(() => {
    const fetchCloudOfferings = async () => {
        const categoryKey = 'cloud_software_development'; // Define the category key for cloud offerings

        try {
            setLoadingCloudOfferings(true);

            // Try to get data from localStorage first
            const cachedData = StorageService.getProductsData(categoryKey);
            if (cachedData && cachedData.length > 0) {
                // Filter out hidden products and sort cached data to get the two lowest priced
                const sortedCachedData = [...cachedData].filter(product => !product.isHidden).sort((a, b) => a.sellingPrice - b.sellingPrice);
                setCloudOfferingsData(sortedCachedData.slice(0, 2));
                setLoadingCloudOfferings(false);

                // Optionally, refresh data in background after a short delay
                setTimeout(() => fetchFreshDataInBackground(categoryKey, setCloudOfferingsData), 1000);
                return;
            }

            // If no cached data, fetch from API
            const response = await fetch(SummaryApi.filterProduct.url, {
                method: SummaryApi.filterProduct.method,
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    category: [categoryKey] // Pass the category as an array
                })
            });

            const dataResponse = await response.json();
            if (dataResponse.success && dataResponse.data) {
                // Filter out hidden products
                const visibleProducts = dataResponse.data.filter(product => !product.isHidden);
                // Sort by sellingPrice ascending and take the first 2
                const sortedData = visibleProducts.sort((a, b) => a.sellingPrice - b.sellingPrice).slice(0, 2);
                setCloudOfferingsData(sortedData);

                // Store fetched data in localStorage
                if (visibleProducts.length > 0) {
                    StorageService.setProductsData(categoryKey, visibleProducts);
                    StorageService.updateCacheTimestamp(categoryKey);
                }
            } else {
                console.error('Failed to fetch cloud offerings:', dataResponse.message);
            }
        } catch (error) {
            console.error('Error fetching cloud offerings:', error);
        } finally {
            setLoadingCloudOfferings(false);
        }
    };

    // Background refresh function (similar to WebsiteDevelopmentService.js)
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

    fetchCloudOfferings();
}, []); // Empty dependency array means this runs once on mount

const getCloudOfferingFirstLetter = (serviceName) => {
    if (!serviceName) return null;
    const firstLetter = serviceName.charAt(0).toUpperCase();
    return (
        <div className="w-6 h-6 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0">
            <span className="text-blue-700 font-bold text-sm md:text-2xl">{firstLetter}</span>
        </div>
    );
};

  const handleFormSubmit = () => {
    setFormSubmitted(true);
  };

  // 🔢 Budget options (reusing from WebsiteDevelopmentService for consistency)
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
    (businessTypes.find((c) => c.category === businessCategory)?.types || []).slice(0, SUBCATEGORIES_LIMIT);

  return (
    <div className="min-h-screen bg-white">
      {/* 1) Header / Intro */}
      <section id="intro" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Cloud Software Development</h1>
            <p className="text-lg md:text-xl text-gray-600">
              Scalable, Secure, and High-Performance Cloud Solutions for Your Business
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
            {/* Left visual card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl">
                <div className="w-full h-72 bg-white/20 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                  <img
                    src="https://www.bdtask.com/blog/uploads/cloud-computing-development.jpg"
                    alt="Cloud Software Development"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-0.5">Future-Proof Your Business</h3>
                  <p className="text-white/90 text-xs">Scalable & Resilient Cloud Solutions</p>
                </div>
              </div>
            </div>

            {/* Right content */}
            <div className="flex flex-col">
              {/* Intro claim */}
              <div className="mb-4">
                <p className="text-gray-900 md:text-lg leading-relaxed">
                  <span className="font-semibold">Unlock the full potential of the cloud</span> with custom-built software designed for scalability, security, and efficiency.
                  We leverage leading cloud platforms to deliver robust solutions.
                </p>
              </div>

              {/* Why Cloud-based */}
              <div className="mb-4">
                <p className="text-lg font-semibold">Why Cloud-Based Software?</p>
                <p className="text-gray-600 text-base leading-relaxed">
                  Cloud software offers unparalleled flexibility, cost-efficiency, and global accessibility,
                  allowing your business to innovate faster and operate more smoothly.
                </p>
              </div>

              {/* Key Benefits as compact cards */}
              <div className="mb-3">
                <p className="text-lg font-semibold">Key Benefits</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 items-stretch">
                  {/* Card 1 */}
                  <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white h-full">
                    <p className="text-gray-900 font-semibold text-md mb-1">
                      Scalability & Flexibility
                    </p>
                    <p className="text-gray-900 text-md leading-relaxed">
                      <span className="font-semibold">Grow effortlessly</span> with infrastructure that scales with your demand.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white h-full">
                    <p className="text-gray-900 font-semibold text-md mb-1">
                      Cost Efficiency
                    </p>
                    <p className="text-gray-900 text-md leading-relaxed">
                      <span className="font-semibold">Pay-as-you-go</span> models reduce upfront investment and operational costs.
                    </p>
                  </div>
                </div>

                {/* Click here line */}
                <p className="text-gray-600 mt-3 text-sm">
                  Discover more advantages of cloud development —{" "}
                  <a href="#benefits" className="text-purple-600 underline">Click here</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2) Our Working Strategy – 4 Steps (Left) + Client Plans & Upgrades (Right) - Reusing from WebsiteDevelopmentService */}
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
                <div className="absolute left-6 top-0 w-px bg-gradient-to-b from-blue-200 via-purple-200 to-emerald-200" style={{ height: 'calc(100% - 2rem)' }} />

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
                <p className="text-md "><span className='font-semibold'>We’re not here for a one-time job —</span> but to keep you always updated </p>

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
                    <path d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 10H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z" />
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


      {/* 3) Cloud Service Offerings */}
      <section id="offerings" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Cloud Software Offerings</h2>
            <p className="text-gray-600 text-xl">
              Explore our specialized cloud development services to find the perfect fit for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {loadingCloudOfferings ? (
              // Loading skeleton for 2 cards
              <>
                {[...Array(2)].map((_, index) => (
                  <div key={`loading-cloud-${index}`} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 animate-pulse flex flex-col items-start text-left">
                    <div className="w-6 h-6 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0">
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
              cloudOfferingsData.map((service) => (
                <div
                  key={service._id} // Use unique ID from fetched data
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-200 flex flex-col items-start text-left"
                  // onClick={() => console.log(`Clicked on ${service.serviceName}`)} // You can remove this if not needed
                >
                  {getCloudOfferingFirstLetter(service.serviceName)} {/* Pass serviceName for first letter */}
                  <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{service.serviceName}</h3>

                  <div className="hidden md:block mb-2 md:mb-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-1">
                      {/* Display first 3 features from packageIncludes */}
                      {(service.packageIncludes || []).slice(0, 3).map((spec, specIndex) => (
                        <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                          <Check className="w-3 h-3 text-blue-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                      {(service.packageIncludes || []).length > 3 && (
                        <RouterLink to={`/product/${service._id}`} className="flex items-center text-blue-600 text-xs md:text-sm font-medium cursor-pointer hover:underline">
                          <Check className="w-3 h-3 text-blue-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>Click for more...</span>
                        </RouterLink>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between w-full">
                    <div className="flex items-baseline mb-1 md:mb-0 md:hidden">
                      <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                      <span className="text-base md:text-2xl font-bold text-blue-600 ml-1 md:ml-2">₹{(service.sellingPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="hidden md:flex md:items-end md:justify-between w-full">
                      <div className="text-left">
                        <span className="text-sm text-gray-500 block">Starts</span>
                        <span className="text-2xl font-bold text-blue-600">₹{(service.sellingPrice || 0).toLocaleString()}</span>
                      </div>
                      <RouterLink to={`/product/${service._id}`} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors">
                        Learn More
                      </RouterLink>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="flex flex-col items-center justify-center text-center p-3 md:p-6 cursor-pointer transition-all duration-300 hover:scale-105">
              <h3 className="text-base md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Explore More</h3>
              <p className="text-sm md:text-gray-600 mb-4 md:mb-6">View all our cloud software options</p>
              <RouterLink to="/product-category?category=web_applications" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm md:font-medium transition-colors">
                Explore All
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      {/* 4) Technology Stack */}
      <section id="tech-stack" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Core Cloud Technology Stack</h2>
            <p className="text-gray-600 text-xl">
              Leveraging industry-leading platforms and tools for robust and scalable solutions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* AWS */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col items-center justify-center">
              <Cloud className="w-12 h-12 text-orange-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">AWS</h3>
              <p className="text-sm text-gray-600">Amazon Web Services</p>
            </div>
            {/* Azure */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col items-center justify-center">
              <Cloud className="w-12 h-12 text-blue-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Azure</h3>
              <p className="text-sm text-gray-600">Microsoft Azure</p>
            </div>
            {/* GCP */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col items-center justify-center">
              <Cloud className="w-12 h-12 text-green-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">GCP</h3>
              <p className="text-sm text-gray-600">Google Cloud Platform</p>
            </div>
            {/* Kubernetes */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col items-center justify-center">
              <Cpu className="w-12 h-12 text-purple-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Kubernetes</h3>
              <p className="text-sm text-gray-600">Container Orchestration</p>
            </div>
            {/* Docker */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col items-center justify-center">
              <Server className="w-12 h-12 text-cyan-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Docker</h3>
              <p className="text-sm text-gray-600">Containerization</p>
            </div>
            {/* PostgreSQL */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col items-center justify-center">
              <Database className="w-12 h-12 text-indigo-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">PostgreSQL</h3>
              <p className="text-sm text-gray-600">Relational Database</p>
            </div>
            {/* MongoDB */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col items-center justify-center">
              <Database className="w-12 h-12 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">MongoDB</h3>
              <p className="text-sm text-gray-600">NoSQL Database</p>
            </div>
            {/* Python/Node.js */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center flex flex-col items-center justify-center">
              <Code className="w-12 h-12 text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Python/Node.js</h3>
              <p className="text-sm text-gray-600">Backend Languages</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5) Client Support - Reusing from WebsiteDevelopmentService */}
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
                  <Phone className="w-3.5 h-3.5 text-purple-700" />
                  Priority Response Guarantee
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 6) Other Services - Reusing from WebsiteDevelopmentService */}
      <section id="others" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Explore Our Other Services</h2>
            <p className="text-gray-600">One team for complete end-to-end digital solutions</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

            {/* Cloud Software Development (Self-referential, but good for navigation) */}
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

      {/* 7) Custom Development Form - Reusing from WebsiteDevelopmentService with minor text changes */}
      <section id="custom-form" className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Couldn't find a suitable cloud solution?</h2>
            <p className="text-gray-600 text-xl">
              Don't worry! We'll build you a custom cloud software from scratch.
            </p>
          </div>

          {!formSubmitted ? (
            <div className="bg-gradient-to-br from-blue-300 to-purple-200 rounded-2xl p-8 shadow-lg">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                    <div className="flex">
                      <select
                        className="px-4 py-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="+91">🇮🇳 +91 (India)</option>
                        <option value="+61">🇦🇺 +61 (Australia)</option>
                        <option value="+1">🇺🇸 +1 (America)</option>
                        <option value="+44">🇬🇧 +44 (U.K.)</option>
                        <option value="+1">🇨🇦 +1 (Canada)</option>
                      </select>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Company Name (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>

                {/* STEP 1: Business Category (max 5 in UI) */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Business Category</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={businessCategory}
                    onChange={(e) => {
                      setBusinessCategory(e.target.value);
                      setBusinessType('');
                      setUpdatePlan('');
                      setWhoUpdates('');
                      setBudgetRange('');
                      setContactPreference('');
                    }}
                  >
                    <option value="">Select your business category</option>
                    {businessTypes.slice(0, CATEGORIES_LIMIT).map((c, i) => (
                      <option key={i} value={c.category}>{c.category}</option>
                    ))}
                  </select>
                </div>

                {/* STEP 2: Sub Category (5–9 in UI) */}
                {businessCategory && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Business Sub-Category</label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={businessType}
                      onChange={(e) => {
                        setBusinessType(e.target.value);
                        setUpdatePlan('');
                        setWhoUpdates('');
                        setBudgetRange('');
                        setContactPreference('');
                      }}
                    >
                      <option value="">Select a sub-category</option>
                      {subTypesForSelectedCategory.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* STEP 3: Software Update Plan */}
                {businessType && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Software Plan — Updates</label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={updatePlan}
                      onChange={(e) => {
                        setUpdatePlan(e.target.value);
                        setWhoUpdates('');
                        setBudgetRange('');
                        setContactPreference('');
                      }}
                    >
                      <option value="">How will you update the software?</option>
                      <option value="one-time">One-time software development</option>
                      <option value="occasional">Occasional updates</option>
                      <option value="mostly">Mostly updated (frequent updates)</option>
                    </select>
                  </div>
                )}

                {/* STEP 4A: If One-time → Budget (small) */}
                {updatePlan === 'one-time' && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Budget Range</label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                    >
                      <option value="">Select budget range</option>
                      {budgetOptionsSmall.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* STEP 4B: If Occasional or Mostly → who updates + budget */}
                {(updatePlan === 'occasional' || updatePlan === 'mostly') && (
                  <>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Who will do the updates?
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={whoUpdates}
                        onChange={(e) => {
                          setWhoUpdates(e.target.value);
                          setBudgetRange('');
                        }}
                      >
                        <option value="">Select an option</option>
                        <option value="self">I will update myself</option>
                        <option value="us">You/Developer will update</option>
                      </select>
                    </div>

                    {whoUpdates && (
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Budget Range</label>
                        <select
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={budgetRange}
                          onChange={(e) => setBudgetRange(e.target.value)}
                        >
                          <option value="">Select budget range</option>
                          {(whoUpdates === 'self' ? budgetOptionsSelfUpdates : budgetOptionsSmall).map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* STEP 5: Contact Preference */}
                {(updatePlan === 'one-time' ? budgetRange : whoUpdates ? budgetRange : false) && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">How should we contact you?</label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={contactPreference}
                      onChange={(e) => setContactPreference(e.target.value)}
                    >
                      <option value="">Choose a contact method</option>
                      <option value="callback">Call back</option>
                      <option value="chat">Chat (WhatsApp/Message)</option>
                      <option value="meeting">In-person meeting</option>
                    </select>
                  </div>
                )}

                {/* Requirements textarea */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Describe your cloud software requirements</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your cloud software requirements..."
                  ></textarea>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleFormSubmit}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center mx-auto"
                    disabled={
                      !businessCategory ||
                      !businessType ||
                      !updatePlan ||
                      (updatePlan !== 'one-time' && !whoUpdates) ||
                      !budgetRange ||
                      !contactPreference
                    }
                    title="Please complete all steps before submitting"
                  >
                    Submit Requirements
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
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
                  setBusinessCategory('');
                  setBusinessType('');
                  setUpdatePlan('');
                  setWhoUpdates('');
                  setBudgetRange('');
                  setContactPreference('');
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

export default CloudSoftwareDevelopmentPage;
