
import React, { useState } from 'react';
import {
  Smartphone,
  Code,
  Zap,
  Shield,
  Clock,
  Cloud,
  Rocket,
  RefreshCw,
  Globe,
  Tool,
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
  Layers,
  PenTool,
  TrendingUp,
  AppWindow, // New icon for app development
  Puzzle, // New icon for integration
  Database, // New icon for backend
  Palette, // New icon for UI/UX
  Bug, // New icon for testing
  CloudCog, // New icon for cloud integration
  Phone
} from 'lucide-react';

const MobileAppDevelopmentPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);

  // 🔄 FORM STATE
  const [appCategory, setAppCategory] = useState('');
  const [appType, setAppType] = useState(''); // sub-category
  const [updatePlan, setUpdatePlan] = useState('');     // 'one-time' | 'occasional' | 'mostly'
  const [whoUpdates, setWhoUpdates] = useState('');     // 'self' | 'us'
  const [budgetRange, setBudgetRange] = useState('');
  const [contactPreference, setContactPreference] = useState(''); // 'callback' | 'chat' | 'meeting'

  // ✅ NEW: hard limits (UI safety, even if data grows later)
  const CATEGORIES_LIMIT = 5;
  const SUBCATEGORIES_LIMIT = 9;

  // ✅ UPDATED: Only 5 app categories, each with 5–9 sub-categories that typically need a mobile app
  const appTypes = [
    {
      category: "Business & Productivity",
      types: [
        "CRM App",
        "ERP App",
        "Project Management App",
        "Internal Communication App",
        "Field Service App",
        "Inventory Management App",
        "Sales Tracking App",
        "Expense Tracker",
        "HR Management App"
      ]
    },
    {
      category: "E-commerce & Retail",
      types: [
        "Shopping App",
        "Delivery App",
        "Loyalty Program App",
        "Catalog App",
        "Point of Sale (POS) App",
        "Fashion Retail App",
        "Grocery Delivery App",
        "Restaurant Ordering App"
      ]
    },
    {
      category: "Health & Fitness",
      types: [
        "Fitness Tracker",
        "Meditation App",
        "Telemedicine App",
        "Diet & Nutrition App",
        "Mental Wellness App",
        "Workout Planner",
        "Health Record App",
        "Pharmacy App"
      ]
    },
    {
      category: "Education & Learning",
      types: [
        "E-learning App",
        "Language Learning App",
        "Quiz App",
        "Educational Games",
        "Tutoring App",
        "School Management App",
        "Skill Development App"
      ]
    },
    {
      category: "On-Demand & Services",
      types: [
        "Taxi Booking App",
        "Home Services App",
        "Beauty Services App",
        "Food Delivery App",
        "Event Booking App",
        "Rental Service App",
        "Freelance Service App",
        "Logistics App",
        "Car Rental App"
      ]
    }
  ];

  // (unchanged) cards data used above on the page
  const nativeApps = [
    {
      name: "iOS App Development",
      startingPrice: "45,999",
      specs: ["Swift/Objective-C", "Optimized Performance", "Native UI/UX", "App Store Submission", "Device Specific Features"]
    },
    {
      name: "Android App Development",
      startingPrice: "40,999",
      specs: ["Kotlin/Java", "Wide Device Compatibility", "Material Design", "Google Play Submission", "Backend Integration"]
    },
    {
      name: "Single Feature App",
      startingPrice: "25,999",
      specs: ["Focused Functionality", "Fast Development", "Cost-Effective", "Specific Use Case", "Scalable"]
    },
    {
      name: "Utility App",
      startingPrice: "30,999",
      specs: ["Tool-based", "User-friendly Interface", "Offline Capabilities", "Quick Access", "Lightweight"]
    },
    {
      name: "Content Display App",
      startingPrice: "35,999",
      specs: ["News/Blog App", "Rich Media Support", "Push Notifications", "User Engagement", "CMS Integration"]
    }
  ];

  const hybridApps = [
    {
      name: "React Native App",
      startingPrice: "35,999",
      specs: ["Cross-Platform", "Code Reusability", "Faster Development", "Hot Reloading", "Community Support"]
    },
    {
      name: "Flutter App",
      startingPrice: "38,999",
      specs: ["Cross-Platform", "Expressive UI", "Single Codebase", "High Performance", "Google Support"]
    },
    {
      name: "PWA (Progressive Web App)",
      startingPrice: "20,999",
      specs: ["Web-based App", "Offline Access", "Installable", "No App Store Needed", "SEO Friendly"]
    },
    {
      name: "Hybrid E-commerce App",
      startingPrice: "40,999",
      specs: ["Product Listings", "Payment Gateway", "User Accounts", "Order Tracking", "Cross-Platform Sales"]
    },
    {
      name: "Social Media App",
      startingPrice: "50,999",
      specs: ["User Profiles", "Feeds & Posts", "Chat Functionality", "Notifications", "Content Sharing"]
    }
  ];

  const getNativeAppIcon = (name) => {
    switch (name) {
      case "iOS App Development": return <Smartphone className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />;
      case "Android App Development": return <AppWindow className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />;
      case "Single Feature App": return <Zap className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />;
      case "Utility App": return <Phone className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />;
      case "Content Display App": return <Layout className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />;
      default: return <Code className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />;
    }
  };

  const getHybridAppIcon = (name) => {
    switch (name) {
      case "React Native App": return <Layers className="w-4 h-4 md:w-6 md:h-6 text-purple-800" />;
      case "Flutter App": return <Palette className="w-4 h-4 md:w-6 md:h-6 text-purple-800" />;
      case "PWA (Progressive Web App)": return <Globe className="w-4 h-4 md:w-6 md:h-6 text-purple-800" />;
      case "Hybrid E-commerce App": return <ShoppingCart className="w-4 h-4 md:w-6 md:h-6 text-purple-800" />;
      case "Social Media App": return <MessageCircle className="w-4 h-4 md:w-6 md:h-6 text-purple-800" />;
      default: return <Code className="w-4 h-4 md:w-6 md:h-6 text-purple-800" />;
    }
  };

  const handleFormSubmit = () => {
    setFormSubmitted(true);
  };

  // 🔢 Budget options
  const budgetOptionsSmall = [
    { value: '10000-30000', label: '₹10,000 – ₹30,000' },
    { value: '30000-60000', label: '₹30,000 – ₹60,000' },
    { value: '60000-100000', label: '₹60,000 – ₹1,00,000' },
    { value: '100000+', label: '₹1,00,000+' }
  ];
  const budgetOptionsSelfUpdates = [
    { value: '50000-100000', label: '₹50,000 – ₹1,00,000' },
    { value: '100000-200000', label: '₹1,00,000 – ₹2,00,000' },
    { value: '200000-500000', label: '₹2,00,000 – ₹5,00,000' },
    { value: '500000+', label: '₹5,00,000+' }
  ];

  // Helper: find subcategories for a chosen category (sliced to limit)
  const subTypesForSelectedCategory =
    (appTypes.find((c) => c.category === appCategory)?.types || []).slice(0, SUBCATEGORIES_LIMIT);

  return (
    <div className="min-h-screen bg-white">{/* base set to white; per-section colors tell the story */}
      {/* 1) Header / Intro */}
      <section id="intro" className="py-12 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-10">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Mobile App Development</h1>
      <p className="text-lg md:text-xl text-gray-600">
        Crafting Innovative and High-Performance Mobile Applications
      </p>
    </div>

    <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
      {/* Left visual card (unchanged height) */}
      <div className="relative">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl">
          <div className="w-full h-72 bg-white/20 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
            <img
              src="https://www.apptunix.com/blog/wp-content/uploads/sites/3/2023/07/Mobile-App-Development-Process.jpg"
              alt="Custom Mobile App Development"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold mb-0.5">Custom App Solutions</h3>
            <p className="text-white/90 text-xs">Native & Hybrid Development</p>
          </div>
        </div>
      </div>

      {/* Right content (compacted) */}
      <div className="flex flex-col">
        {/* Intro claim */}
        <div className="mb-4">
          <p className="text-gray-900  md:text-lg leading-relaxed">
          <span className="font-semibold">We specialize in building robust and user-friendly mobile applications</span> for both iOS and Android platforms.
            From native performance to cross-platform efficiency, we cover all your needs.
          </p>
        </div>

        {/* Why custom app development */}
        <div className="mb-4">
          <p className="text-lg font-semibold">Why Custom Mobile Apps?</p>
          <p className="text-gray-600 text-base leading-relaxed">
            Off-the-shelf solutions often lack the unique features and scalability your business demands.
            Custom apps provide tailored functionality, better performance, and enhanced security.
          </p>
        </div>

        {/* Myth vs Reality as compact cards */}
        <div className="mb-3">
          <p className="text-lg font-semibold">Native vs Hybrid</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 items-stretch">
            {/* Card 1 */}
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white h-full">
              <p className="text-gray-900 font-semibold text-md mb-1">
                Native Apps: Best Performance?
              </p>
              <p className="text-gray-900 text-md leading-relaxed">
              <span className="font-semibold">Yes,</span> native apps offer superior performance and access to device features, ideal for complex apps.
              </p>
            </div>

            {/* Card 2 */}
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white h-full">
              <p className="text-gray-900 font-semibold text-md mb-1">
                Hybrid Apps: Cost-Effective?
              </p>
              <p className="text-gray-900 text-md leading-relaxed">
              <span className="font-semibold">Absolutely,</span> hybrid apps (React Native, Flutter) save time and cost by using a single codebase for both platforms.
              </p>
            </div>
          </div>

          {/* Click here line */}
          <p className="text-gray-600 mt-3 text-sm">
            More about our app development process —{" "}
            <a href="#process" className="text-purple-600 underline">Click here</a>.
          </p>

          {/* Connector line */}
          <p className="text-gray-900 mt-1 font-medium text-sm md:text-base">
            {/* Our purpose of work itself explains the way we work. */}
          </p>
        </div>
      </div>
    </div>
  </div>
</section>


  {/* 2) Our Working Strategy – 4 Steps (Left) + Client Plans & Upgrades (Right) */}
<section id="guidance" className="py-16 bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <h1 className="text-5xl text-center font-bold text-gray-900 mb-12">Our App Development Process</h1>    
    <div className="grid md:grid-cols-2 gap-12">

      {/* LEFT: 4-Step Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 mb-6" aria-hidden="true" />
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Development Workflow</h2>
      <p className="text-md mb-8">
        <span className="font-semibold">Structured and collaborative — </span>
        ensuring your vision comes to life.
      </p>
      
      <div className="relative">
        <div className="absolute left-6 top-0 w-px bg-gradient-to-b from-purple-200 via-indigo-200 to-blue-200" style={{height: 'calc(100% - 2rem)'}} />
        
        <ul className="space-y-8">
          {/* 1 */}
          <li className="relative pl-14">
            <span className="absolute left-2 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-700 font-semibold ring-2 ring-purple-100">1</span>
            <h3 className="text-gray-900 font-semibold">Discovery & Planning</h3>
            <p className="text-sm text-gray-600">Understanding your idea, target audience, and core features.</p>
          </li>
          
          {/* 2 */}
          <li className="relative pl-14">
            <span className="absolute left-2 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-semibold ring-2 ring-indigo-100">2</span>
            <h3 className="text-gray-900 font-semibold">UI/UX Design & Prototyping</h3>
            <p className="text-sm text-gray-600">Creating intuitive interfaces and interactive prototypes for your approval.</p>
          </li>
          
          {/* 3 */}
          <li className="relative pl-14">
            <span className="absolute left-2 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold ring-2 ring-blue-100">3</span>
            <h3 className="text-gray-900 font-semibold">Development & Testing</h3>
            <p className="text-sm text-gray-600">Building the app with clean code and rigorous testing for quality assurance.</p>
          </li>
          
          {/* 4 */}
          <li className="relative pl-14">
            <span className="absolute left-2 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-semibold ring-2 ring-emerald-100">4</span>
            <h3 className="text-gray-900 font-semibold">Deployment & Support</h3>
            <p className="text-sm text-gray-600">Launching your app on app stores and providing ongoing maintenance.</p>
          </li>
        </ul>
      </div>
      
      <div className="mt-3 pt-6 border-t border-gray-100">
        <p className="text-purple-700 text-sm text-center">
          Explore our app portfolio and get an estimate for your mobile project.
        </p>
      </div>
    </div>

      {/* RIGHT: Always With You – Trust & After-Service Focus */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
  <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-6" aria-hidden="true" />
  <h2 className="text-3xl font-bold text-gray-900 mb-2">Post-Launch App Support</h2>
  <p className="text-gray-900 mb-6">
  <p className="text-md "><span className='font-semibold'>Our commitment extends beyond launch —</span> ensuring your app stays relevant and functional. </p>
     
  </p>

  <div className="grid sm:grid-cols-2 gap-5">
    <div className="p-5 rounded-xl border border-gray-100">
      <h3 className="font-semibold text-gray-900">Bug Fixes & Maintenance</h3>
      <p className="text-sm text-gray-600 mt-1">Prompt resolution of issues and regular health checks.</p>
    </div>
    <div className="p-5 rounded-xl border border-gray-100">
      <h3 className="font-semibold text-gray-900">Feature Enhancements</h3>
      <p className="text-sm text-gray-600 mt-1">Adding new functionalities to keep your app competitive.</p>
    </div>
    <div className="p-5 rounded-xl border border-gray-100">
      <h3 className="font-semibold text-gray-900">OS Updates Compatibility</h3>
      <p className="text-sm text-gray-600 mt-1">Ensuring your app works seamlessly with new iOS/Android versions.</p>
    </div>
    <div className="p-5 rounded-xl border border-gray-100">
      <h3 className="font-semibold text-gray-900">Performance Optimization</h3>
      <p className="text-sm text-gray-600 mt-1">Continuous improvements for speed and user experience.</p>
    </div>
  </div>

  {/* CTA */}
  <div className="mt-4">
    <a
      href="/app-maintenance" /* replace with your actual route */
      className="group inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-5 py-3 text-sm font-medium hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
    >
      See App Maintenance Plans
      <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 10H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"/>
      </svg>
    </a>
    <p className="text-sm text-blue-700 mt-4">
      Discover our comprehensive plans for app updates, security, and performance.
    </p>
  </div>
</div>

    </div>
  </div>
</section>




      {/* 3) Native App Development */}
      <section id="native-apps" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Native App Development – Unmatched Performance & User Experience</h2>
            <p className="text-gray-600 text-xl">Build platform-specific apps for the best performance and access to device features.</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {nativeApps.slice(0,2).map((app, index) => (
              <React.Fragment key={index}>
                <div
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-200 flex flex-col items-start text-left md:text-left md:block"
                  onClick={() => console.log(`Clicked on ${app.name}`)}
                >
                  <div className="w-6 h-6 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
                    {getNativeAppIcon(app.name)}
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{app.name}</h3>

                  <div className="hidden md:block mb-2 md:mb-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-1">
                      {app.specs.slice(0, 3).map((spec, specIndex) => (
                        <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                          <Check className="w-3 h-3 text-blue-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                      {app.specs.length > 3 && (
                        <div className="flex items-center text-blue-600 text-xs md:text-sm font-medium cursor-pointer hover:underline">
                          <Check className="w-3 h-3 text-blue-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>Click for more...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between w-full">
                    <div className="flex items-baseline mb-1 md:mb-0 md:hidden">
                      <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                      <span className="text-base md:text-2xl font-bold text-blue-600 ml-1 md:ml-2">₹{app.startingPrice}</span>
                    </div>
                    <div className="hidden md:flex md:items-end md:justify-between w-full">
                      <div className="text-left">
                        <span className="text-sm text-gray-500 block">Starts</span>
                        <span className="text-2xl font-bold text-blue-600">₹{app.startingPrice}</span>
                      </div>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}

            <div className="flex flex-col items-center justify-center text-center p-3 md:p-6 cursor-pointer transition-all duration-300 hover:scale-105">
              <h3 className="text-base md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Explore More</h3>
              <p className="text-sm md:text-gray-600 mb-4 md:mb-6">View all our native app options</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm md:font-medium transition-colors">
                Explore More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4) Hybrid App Development */}
      <section id="hybrid-apps" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Hybrid App Development – Reach Wider Audiences with Efficiency</h2>
            <p className="text-gray-600 text-xl">Develop cross-platform apps with a single codebase for iOS and Android.</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {hybridApps.slice(0,2).map((app, index) => (
              <React.Fragment key={index}>
                <div
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-purple-200 flex flex-col items-start text-left md:text-left md:block"
                  onClick={() => console.log(`Clicked on ${app.name}`)}
                >
                  <div className="w-6 h-6 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
                    {getHybridAppIcon(app.name)}
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{app.name}</h3>

                  <div className="hidden md:block mb-2 md:mb-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-1">
                      {app.specs.slice(0, 3).map((spec, specIndex) => (
                        <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                          <Check className="w-3 h-3 text-purple-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                      {app.specs.length > 3 && (
                        <div className="flex items-center text-purple-600 text-xs md:text-sm font-medium cursor-pointer hover:underline">
                          <Check className="w-3 h-3 text-purple-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>Click for more...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between w-full">
                    <div className="flex items-baseline mb-1 md:mb-0 md:hidden">
                      <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                      <span className="text-base md:text-2xl font-bold text-purple-800 ml-1 md:ml-2">₹{app.startingPrice}</span>
                    </div>
                    <div className="hidden md:flex md:items-end md:justify-between w-full">
                      <div className="text-left">
                        <span className="text-sm text-gray-500 block">Starts</span>
                        <span className="text-2xl font-bold text-purple-800">₹{app.startingPrice}</span>
                      </div>
                      <button className="bg-purple-600 hover:bg-purple-800 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}

            <div className="flex flex-col items-center justify-center text-center p-3 md:p-6 cursor-pointer transition-all duration-300 hover:scale-105">
              <h3 className="text-base md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Explore More</h3>
              <p className="text-sm md:text-gray-600 mb-4 md:mb-6">View all our hybrid app options</p>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm md:font-medium transition-colors">
                Explore More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5) Client Support */}
      <section id="support" className="py-10 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 md:p-7">
      <div className="grid md:grid-cols-2 gap-6 items-center">

        {/* Left Side - Short Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Headset className="w-6 h-6 text-purple-700" />
            <h2 className="text-2xl font-bold text-gray-900">Dedicated App Support</h2>
          </div>

          <p className="text-gray-700 leading-relaxed text-sm">
            Get immediate assistance for your mobile app.  
            Our team is ready to help with any issues or updates you need.
          </p>

          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <Check className="w-4 h-4 text-purple-700 mt-0.5 mr-2" />
              Direct communication with app developers
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-purple-700 mt-0.5 mr-2" />
              Fast bug fixes and performance tuning
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-purple-700 mt-0.5 mr-2" />
              Guidance for app store policies
            </li>
          </ul>

          <p className="text-xs text-gray-500">
            Available after app deployment.
          </p>
        </div>

        {/* Right Side - Compact Chat Example */}
        <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">App Project Manager</p>
                <p className="text-xs text-gray-500">Online • Replies in minutes</p>
              </div>
            </div>
            <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Instant</span>
          </div>

          <div className="space-y-2">
            <div className="max-w-[85%] rounded-lg bg-gray-50 border border-gray-100 p-2">
              <p className="text-xs text-gray-800">
                Hi! My app is crashing on iOS 17.
              </p>
              <p className="text-[10px] text-gray-500 mt-1">You • just now</p>
            </div>
            <div className="ml-auto max-w-[85%] rounded-lg bg-purple-50 border border-purple-100 p-2">
              <p className="text-xs text-gray-900">
                Understood. We're investigating the crash logs now.
              </p>
              <p className="text-[10px] text-gray-500 mt-1">Dev • typing…</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <LifeBuoy className="w-3.5 h-3.5 text-indigo-700" />
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
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Explore Our Related Services</h2>
      <p className="text-gray-600">Comprehensive digital solutions for your business</p>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
      
      {/* Web App Development */}
      <a href="/cloud-software-service" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-purple-200">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
          <Cloud className="w-6 h-6 text-purple-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Web App Development</h3>
        <p className="text-gray-600 text-sm mb-3">Scalable SaaS, cloud apps & integrations</p>
        <span className="inline-flex items-center text-purple-600 group-hover:text-purple-800 font-medium">
          See Details <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </a>

      {/* Software Solutions */}
      <a href="/software-solutions" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-purple-200">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
          <Layers className="w-6 h-6 text-purple-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Custom Software Solutions</h3>
        <p className="text-gray-600 text-sm mb-3">ERP, CRM, dashboards & automation</p>
        <span className="inline-flex items-center text-purple-600 group-hover:text-purple-800 font-medium">
          Explore More <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </a>

      {/* Website Development */}
      <a href="/website-development-service" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-purple-200">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
          <Globe className="w-6 h-6 text-purple-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Website Development</h3>
        <p className="text-gray-600 text-sm mb-3">Pure coding based static & dynamic websites</p>
        <span className="inline-flex items-center text-purple-600 group-hover:text-purple-800 font-medium">
          Learn More <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </a>

      {/* Website / Software Updates */}
      <a href="/feature-upgrades-service" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-purple-200">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-purple-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">App / Software Updates</h3>
        <p className="text-gray-600 text-sm mb-3">Regular updates, fixes & feature upgrades</p>
        <span className="inline-flex items-center text-purple-600 group-hover:text-purple-800 font-medium">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Need a custom mobile app?</h2>
            <p className="text-gray-600 text-xl">
              Tell us your idea, and we'll build a unique app tailored to your needs.
            </p>
          </div>

          {!formSubmitted ? (
            <div className="bg-gradient-to-br from-purple-300 to-indigo-200 rounded-2xl p-8 shadow-lg">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                    <div className="flex">
                      <select
                        className="px-4 py-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Company Name (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>

                {/* STEP 1: App Category (max 5 in UI) */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">App Category</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={appCategory}
                    onChange={(e) => {
                      setAppCategory(e.target.value);
                      setAppType('');
                      setUpdatePlan('');
                      setWhoUpdates('');
                      setBudgetRange('');
                      setContactPreference('');
                    }}
                  >
                    <option value="">Select your app category</option>
                    {appTypes.slice(0, CATEGORIES_LIMIT).map((c, i) => (
                      <option key={i} value={c.category}>{c.category}</option>
                    ))}
                  </select>
                </div>

                {/* STEP 2: Sub Category (5–9 in UI) */}
                {appCategory && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">App Sub-Category</label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={appType}
                      onChange={(e) => {
                        setAppType(e.target.value);
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

                {/* STEP 3: App Update Plan */}
                {appType && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">App Plan — Updates</label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={updatePlan}
                      onChange={(e) => {
                        setUpdatePlan(e.target.value);
                        setWhoUpdates('');
                        setBudgetRange('');
                        setContactPreference('');
                      }}
                    >
                      <option value="">How will you update the app?</option>
                      <option value="one-time">One-time app development</option>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  <label className="block text-gray-700 font-medium mb-2">Describe your app requirements</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your app requirements..."
                  ></textarea>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleFormSubmit}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center mx-auto"
                    disabled={
                      !appCategory ||
                      !appType ||
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
                Your app requirements have been submitted. Our team will contact you within 24 hours.
              </p>
              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setAppCategory('');
                  setAppType('');
                  setUpdatePlan('');
                  setWhoUpdates('');
                  setBudgetRange('');
                  setContactPreference('');
                }}
                className="text-purple-600 hover:text-purple-800 font-medium"
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

export default MobileAppDevelopmentPage;
