import React, { useState } from 'react';
import { Shield, Globe, Code, Smartphone, Users, CheckCircle, Star, Clock, Headphones, Zap, Settings, Database, Monitor, Tablet, ArrowRight, Check, AlertTriangle, Heart, Award } from 'lucide-react';

const FeatureUpgradesService = () => {
  const [selectedService, setSelectedService] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const supportServiceCategories = [
    {
      name: "Static Website Support",
      icon: <Globe className="w-8 h-8" />,
      color: "teal",
      description: "Ideal for basic, non-changing websites like portfolios or landing pages.",
      potentialPlans: [
        "Basic Maintenance Plan",
        "Standard Security Plan",
        "Advanced Performance Plan"
      ],
      link: "/static-website-support" // Placeholder link
    },
    {
      name: "Dynamic Website Support",
      icon: <Code className="w-8 h-8" />,
      color: "cyan",
      description: "For websites with regularly changing content and user interactions, such as e-commerce or blogs.",
      potentialPlans: [
        "Content Management Plan",
        "Database Optimization Plan",
        "User Interaction Support"
      ],
      link: "/dynamic-website-support" // Placeholder link
    },
    {
      name: "Web Software Support",
      icon: <Database className="w-8 h-8" />,
      color: "cyan",
      description: "For custom web applications with complex functionality like CRMs or dashboards.",
      potentialPlans: [
        "Bug Resolution Plan",
        "Feature Enhancement Plan",
        "API Integration Support"
      ],
      link: "/web-software-support" // Placeholder link
    },
    {
      name: "Mobile App Support",
      icon: <Smartphone className="w-8 h-8" />,
      color: "teal",
      description: "For Android, iOS, or cross-platform applications, ensuring smooth user experience.",
      potentialPlans: [
        "OS Compatibility Plan",
        "App Store Management",
        "Performance & Analytics"
      ],
      link: "/mobile-app-support" // Placeholder link
    }
  ];

  const getColorClasses = (color, type) => {
    const colorMap = {
      teal: {
        bg: 'bg-teal-600',
        bgLight: 'bg-teal-50',
        bgHover: 'bg-teal-700',
        text: 'text-teal-600',
        textDark: 'text-teal-700',
        border: 'border-teal-200',
        gradient: 'from-teal-600 to-cyan-600'
      },
      cyan: {
        bg: 'bg-cyan-600',
        bgLight: 'bg-cyan-50',
        bgHover: 'bg-cyan-700',
        text: 'text-cyan-600',
        textDark: 'text-cyan-700',
        border: 'border-cyan-200',
        gradient: 'from-cyan-600 to-teal-600'
      },
      blue: { // Added for static website updates
        bg: 'bg-blue-600',
        bgLight: 'bg-blue-100',
        bgHover: 'bg-blue-700',
        text: 'text-blue-600',
        textDark: 'text-blue-700',
        border: 'border-blue-200',
        gradient: 'from-blue-600 to-blue-700'
      },
      purple: { // Added for dynamic website updates
        bg: 'bg-purple-600',
        bgLight: 'bg-purple-100',
        bgHover: 'bg-purple-700',
        text: 'text-purple-600',
        textDark: 'text-purple-700',
        border: 'border-purple-200',
        gradient: 'from-purple-600 to-purple-700'
      },
      green: { // Added for Cloud Software Update Plans
        bg: 'bg-green-600',
        bgLight: 'bg-green-100',
        bgHover: 'bg-green-700',
        text: 'text-green-600',
        textDark: 'text-green-700',
        border: 'border-green-200',
        gradient: 'from-green-600 to-green-700'
      },
      orange: { // Added for Mobile App Update Plans
        bg: 'bg-orange-600',
        bgLight: 'bg-orange-100',
        bgHover: 'bg-orange-700',
        text: 'text-orange-600',
        textDark: 'text-orange-700',
        border: 'border-orange-200',
        gradient: 'from-orange-600 to-orange-700'
      }
    };

    return colorMap[color][type] || '';
  };

  const handleServiceSelect = (serviceName) => {
    setSelectedService(serviceName);
  };

  // Data for Static Website Update Plans
  const staticWebsiteUpdatePlans = [
    {
      name: "Basic Maintenance Plan",
      icon: <Globe className="w-8 h-8" />,
      color: "blue",
      startingPrice: "2,500",
      specs: [
        "Monthly Security Scans",
        "Minor Content Updates (2/month)",
        "Broken Link Checks",
        "Basic Performance Monitoring"
      ]
    },
    {
      name: "Standard Security Plan",
      icon: <Shield className="w-8 h-8" />,
      color: "blue",
      startingPrice: "3,500",
      specs: [
        "Weekly Security Scans",
        "Firewall Management",
        "SSL Certificate Renewal",
        "Malware Removal (if needed)",
        "Regular Backups"
      ]
    },
    {
      name: "Advanced Performance Plan",
      icon: <Zap className="w-8 h-8" />,
      color: "blue",
      startingPrice: "4,500",
      specs: [
        "CDN Integration",
        "Image Optimization",
        "Code Minification",
        "Browser Caching Setup",
        "Monthly Performance Reports"
      ]
    }
  ];

  // Data for Dynamic Website Update Plans
  const dynamicWebsiteUpdatePlans = [
    {
      name: "Content Management Plan",
      icon: <Code className="w-8 h-8" />,
      color: "purple",
      startingPrice: "4,500",
      specs: [
        "CMS Core Updates",
        "Plugin/Theme Updates",
        "Content Migration Support",
        "User Role Management"
      ]
    },
    {
      name: "Database Optimization Plan",
      icon: <Database className="w-8 h-8" />,
      color: "purple",
      startingPrice: "6,000",
      specs: [
        "Monthly Database Cleanup",
        "Query Optimization",
        "Database Backup & Restore",
        "Performance Tuning"
      ]
    },
    {
      name: "User Interaction Support",
      icon: <Users className="w-8 h-8" />,
      color: "purple",
      startingPrice: "7,500",
      specs: [
        "Form Functionality Checks",
        "User Account Management",
        "E-commerce Feature Support",
        "Payment Gateway Monitoring"
      ]
    }
  ];

  // Data for Cloud Software Update Plans
  const cloudSoftwareUpdatePlans = [
    {
      name: "Bug Resolution Plan",
      icon: <AlertTriangle className="w-8 h-8" />,
      color: "green",
      startingPrice: "7,500",
      specs: [
        "Priority Bug Fixing",
        "Error Log Monitoring",
        "Code Debugging",
        "Hotfix Deployments"
      ]
    },
    {
      name: "Feature Enhancement Plan",
      icon: <Star className="w-8 h-8" />,
      color: "green",
      startingPrice: "10,000",
      specs: [
        "Minor Feature Development (X hours/month)",
        "UI/UX Improvements",
        "New Module Integration",
        "User Feedback Implementation"
      ]
    },
    {
      name: "API Integration Support",
      icon: <Settings className="w-8 h-8" />,
      color: "green",
      startingPrice: "12,000",
      specs: [
        "Third-Party API Maintenance",
        "New API Integrations",
        "API Performance Monitoring",
        "Data Sync Troubleshooting"
      ]
    }
  ];

  // Data for Mobile App Update Plans
  const mobileAppUpdatePlans = [
    {
      name: "OS Compatibility Plan",
      icon: <Smartphone className="w-8 h-8" />,
      color: "orange",
      startingPrice: "6,500",
      specs: [
        "iOS Version Updates",
        "Android Version Updates",
        "Device Compatibility Testing",
        "Bug Fixes for OS Changes"
      ]
    },
    {
      name: "App Store Management",
      icon: <Monitor className="w-8 h-8" />,
      color: "orange",
      startingPrice: "8,000",
      specs: [
        "App Store Listing Updates",
        "Screenshot & Video Updates",
        "Review & Rating Monitoring",
        "Submission & Approval Support"
      ]
    },
    {
      name: "Performance & Analytics",
      icon: <Clock className="w-8 h-8" />,
      color: "orange",
      startingPrice: "10,000",
      specs: [
        "App Performance Monitoring",
        "Crash Reporting & Analysis",
        "Analytics Integration & Reporting",
        "Battery Usage Optimization"
      ]
    }
  ];

  const getIcon = (name, color) => {
    switch (name) {
      case "Basic Maintenance Plan": return <Globe className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "Standard Security Plan": return <Shield className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "Advanced Performance Plan": return <Zap className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "Content Management Plan": return <Code className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "Database Optimization Plan": return <Database className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "User Interaction Support": return <Users className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "Bug Resolution Plan": return <AlertTriangle className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "Feature Enhancement Plan": return <Star className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "API Integration Support": return <Settings className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "OS Compatibility Plan": return <Smartphone className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "App Store Management": return <Monitor className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      case "Performance & Analytics": return <Clock className={`w-8 h-8 ${getColorClasses(color, 'text')}`} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50">
      {/* Hero Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Client Support Services</h1>
            <p className="text-xl text-gray-600">Exclusive support for our existing clients - We stand with you long after delivery</p>
          </div>

          {/* Main Introduction */}
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-xl">
                <div className="w-full h-32 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">Ongoing Partnership</h3>
                  <p className="text-white/90 text-sm">Not just a sale, but a lasting relationship</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">Client-Only Support Services</h2>
              <p className="text-lg text-gray-600 font-medium">Exclusive support designed for our existing clients</p>
              <p className="text-gray-600 leading-relaxed">
                Our focus is to stand with you long after your project is delivered—not just make a sale and disappear.
                These services are exclusively for our existing clients, ensuring your software, website, or mobile app
                always stays updated, secure, and performing at its best.
              </p>
              <div className="flex items-center text-teal-600">
                <Heart className="w-5 h-5 mr-2" />
                <span className="font-semibold">Long-term Partnership Commitment</span>
              </div>
            </div>
          </div>

          {/* Why Choose Our Support */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Why Our Client Support is Different</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-teal-100 p-3 rounded-xl">
                  <Award className="text-teal-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Client-Only Access</h3>
                <p className="text-gray-600 text-md">
                  Exclusive services available only to our existing project clients - no outsiders.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-cyan-100 p-3 rounded-xl">
                  <Clock className="text-cyan-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Priority Response</h3>
                <p className="text-gray-600 text-md">
                  Fast response times because we know your project inside and out.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-teal-100 p-3 rounded-xl">
                  <Headphones className="text-teal-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Dedicated Support</h3>
                <p className="text-gray-600 text-md">
                  Personal attention from developers who built your original project.
                </p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-teal-50 border-l-4 border-teal-600 text-teal-800 p-4 mb-6 rounded-lg" role="alert">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <p className="font-bold">For Existing Clients Only</p>
              </div>
              <p className="mt-2">These support services are exclusively available for clients who have previously completed projects with us. This ensures we can provide the best possible support based on our deep understanding of your system.</p>
            </div>
          </div>

          {/* 1) Static Website Update Plans */}
          <section id="static-updates" className="py-12 bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Static Website Update Plans – Keep Your Simple Site Fresh & Secure</h2>
                <p className="text-gray-600 text-xl">Ensure your static website remains secure, fast, and up-to-date with our tailored update plans.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {staticWebsiteUpdatePlans.map((plan, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-2xl shadow-lg border ${getColorClasses(plan.color, 'border')} p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:${getColorClasses(plan.color, 'border')} flex flex-col items-start text-left md:text-left md:block`}
                    onClick={() => console.log(`Clicked on ${plan.name}`)}
                  >
                    <div className={`w-6 h-6 md:w-16 md:h-16 ${getColorClasses(plan.color, 'bgLight')} rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0`}>
                      {getIcon(plan.name, plan.color)}
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{plan.name}</h3>

                    <div className="mb-2 md:mb-4">
                      <div className="grid grid-cols-1 gap-y-1 mb-1">
                        {plan.specs.map((spec, specIndex) => (
                          <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                            <Check className={`w-3 h-3 ${getColorClasses(plan.color, 'text')} mr-1 md:mr-2 flex-shrink-0`} />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between w-full">
                      <div className="flex items-baseline mb-1 md:mb-0">
                        <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                        <span className="text-base md:text-2xl font-bold ${getColorClasses(plan.color, 'textDark')} ml-1 md:ml-2">₹{plan.startingPrice}</span>
                      </div>
                      <button className={`${getColorClasses(plan.color, 'bg')} hover:${getColorClasses(plan.color, 'bgHover')} text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors mt-2 md:mt-0`}>
                        Learn More
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 2) Dynamic Website Update Plans */}
          <section id="dynamic-updates" className="py-12 bg-gray-50 rounded-2xl shadow-lg p-8 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Dynamic Website Update Plans – Keep Your Interactive Site Running Smoothly</h2>
                <p className="text-gray-600 text-xl">Maintain peak performance and security for your dynamic website with our comprehensive update plans.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {dynamicWebsiteUpdatePlans.map((plan, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-2xl shadow-lg border ${getColorClasses(plan.color, 'border')} p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:${getColorClasses(plan.color, 'border')} flex flex-col items-start text-left md:text-left md:block`}
                    onClick={() => console.log(`Clicked on ${plan.name}`)}
                  >
                    <div className={`w-6 h-6 md:w-16 md:h-16 ${getColorClasses(plan.color, 'bgLight')} rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0`}>
                      {getIcon(plan.name, plan.color)}
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{plan.name}</h3>

                    <div className="mb-2 md:mb-4">
                      <div className="grid grid-cols-1 gap-y-1 mb-1">
                        {plan.specs.map((spec, specIndex) => (
                          <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                            <Check className={`w-3 h-3 ${getColorClasses(plan.color, 'text')} mr-1 md:mr-2 flex-shrink-0`} />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between w-full">
                      <div className="flex items-baseline mb-1 md:mb-0">
                        <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                        <span className="text-base md:text-2xl font-bold ${getColorClasses(plan.color, 'textDark')} ml-1 md:ml-2">₹{plan.startingPrice}</span>
                      </div>
                      <button className={`${getColorClasses(plan.color, 'bg')} hover:${getColorClasses(plan.color, 'bgHover')} text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors mt-2 md:mt-0`}>
                        Learn More
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3) Cloud Software Update Plans */}
          <section id="cloud-software-updates" className="py-12 bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Cloud Software Update Plans – Keep Your Applications Cutting-Edge</h2>
                <p className="text-gray-600 text-xl">Ensure your custom cloud software is always optimized, secure, and evolving with our dedicated update plans.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {cloudSoftwareUpdatePlans.map((plan, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-2xl shadow-lg border ${getColorClasses(plan.color, 'border')} p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:${getColorClasses(plan.color, 'border')} flex flex-col items-start text-left md:text-left md:block`}
                    onClick={() => console.log(`Clicked on ${plan.name}`)}
                  >
                    <div className={`w-6 h-6 md:w-16 md:h-16 ${getColorClasses(plan.color, 'bgLight')} rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0`}>
                      {getIcon(plan.name, plan.color)}
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{plan.name}</h3>

                    <div className="mb-2 md:mb-4">
                      <div className="grid grid-cols-1 gap-y-1 mb-1">
                        {plan.specs.map((spec, specIndex) => (
                          <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                            <Check className={`w-3 h-3 ${getColorClasses(plan.color, 'text')} mr-1 md:mr-2 flex-shrink-0`} />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between w-full">
                      <div className="flex items-baseline mb-1 md:mb-0">
                        <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                        <span className="text-base md:text-2xl font-bold ${getColorClasses(plan.color, 'textDark')} ml-1 md:ml-2">₹{plan.startingPrice}</span>
                      </div>
                      <button className={`${getColorClasses(plan.color, 'bg')} hover:${getColorClasses(plan.color, 'bgHover')} text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors mt-2 md:mt-0`}>
                        Learn More
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4) Mobile App Update Plans */}
          <section id="mobile-app-updates" className="py-12 bg-gray-50 rounded-2xl shadow-lg p-8 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Mobile App Update Plans – Keep Your App Compatible & Performing</h2>
                <p className="text-gray-600 text-xl">Ensure your mobile application stays compatible with new OS versions and performs flawlessly with our update plans.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {mobileAppUpdatePlans.map((plan, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-2xl shadow-lg border ${getColorClasses(plan.color, 'border')} p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:${getColorClasses(plan.color, 'border')} flex flex-col items-start text-left md:text-left md:block`}
                    onClick={() => console.log(`Clicked on ${plan.name}`)}
                  >
                    <div className={`w-6 h-6 md:w-16 md:h-16 ${getColorClasses(plan.color, 'bgLight')} rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0`}>
                      {getIcon(plan.name, plan.color)}
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{plan.name}</h3>

                    <div className="mb-2 md:mb-4">
                      <div className="grid grid-cols-1 gap-y-1 mb-1">
                        {plan.specs.map((spec, specIndex) => (
                          <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                            <Check className={`w-3 h-3 ${getColorClasses(plan.color, 'text')} mr-1 md:mr-2 flex-shrink-0`} />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between w-full">
                      <div className="flex items-baseline mb-1 md:mb-0">
                        <span className="text-xs md:text-sm text-gray-500 text-left">Starts</span>
                        <span className="text-base md:text-2xl font-bold ${getColorClasses(plan.color, 'textDark')} ml-1 md:ml-2">₹{plan.startingPrice}</span>
                      </div>
                      <button className={`${getColorClasses(plan.color, 'bg')} hover:${getColorClasses(plan.color, 'bgHover')} text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors mt-2 md:mt-0`}>
                        Learn More
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Service Comparison - Modified to show Price Estimate Range */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 text-gray-800 mb-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Support Service Price Estimates</h2>
              <p className="text-gray-600 text-lg">
                Understand the general price range for different types of support services.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Service Type</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-teal-700">Static Website</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-cyan-700">Dynamic Website</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-cyan-700">Web Software</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-teal-700">Mobile App</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Estimated Monthly Range</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">₹2,500 - ₹5,000+</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">₹4,500 - ₹8,000+</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">₹7,500 - ₹15,000+</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">₹6,500 - ₹12,000+</td>
                  </tr>
                  <tr className="bg-gray-25">
                    <td className="px-6 py-4 text-sm text-gray-900">Complexity Level</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">Low</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">Medium</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">High</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">Medium-High</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Typical Scope</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">Content, Security</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">Database, CMS</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">Bugs, Features, API</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">OS, Store, Performance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Secure Your Project's Future?</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Don't let your investment become outdated. Choose the right support service to keep your project running smoothly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
                <Headphones className="w-5 h-5 mr-2" />
                Contact Support Team
              </button>
              <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
                <Star className="w-5 h-5 mr-2" />
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeatureUpgradesService;
