import React, { useState } from 'react';
import { Check, ArrowRight, Globe, Smartphone, Code, Users, ShoppingCart, Briefcase } from 'lucide-react';

const LocalBusinessWebsite = () => {
  const [activeCard, setActiveCard] = useState(null);

  const optimizationPlans = [
    {
      title: "1 Year Optimization",
      price: "₹24,999",
      originalPrice: "₹35,000",
      discount: "29% OFF",
      features: [
        "Google My Business Setup",
        "Local Keywords Optimization",
        "Website Development",
        "Monthly SEO Reports",
        "Social Media Integration"
      ]
    },
    {
      title: "2 Years Optimization",
      price: "₹42,999",
      originalPrice: "₹65,000",
      discount: "34% OFF",
      features: [
        "Everything in 1 Year Plan",
        "Advanced Analytics Setup",
        "Customer Review Management",
        "Competitor Analysis",
        "Priority Support"
      ],
      popular: true
    }
  ];

  const websitePackages = [
    {
      title: "Basic Business Website",
      price: "₹15,999",
      originalPrice: "₹25,000",
      features: ["5 Pages", "Mobile Responsive", "Contact Forms", "Basic SEO"],
      icon: <Globe className="w-8 h-8" />
    },
    {
      title: "E-commerce Website",
      price: "₹35,999",
      originalPrice: "₹55,000",
      features: ["Product Catalog", "Payment Gateway", "Inventory Management", "Admin Panel"],
      icon: <ShoppingCart className="w-8 h-8" />
    },
    {
      title: "Professional Portfolio",
      price: "₹22,999",
      originalPrice: "₹35,000",
      features: ["Custom Design", "Gallery", "Blog Section", "SEO Optimized"],
      icon: <Briefcase className="w-8 h-8" />
    }
  ];

  const softwareServices = [
    {
      title: "CRM System",
      description: "Customer relationship management for better business growth",
      price: "₹18,999",
      icon: <Users className="w-8 h-8" />
    },
    {
      title: "Inventory Management",
      description: "Track and manage your products efficiently",
      price: "₹25,999",
      icon: <Code className="w-8 h-8" />
    },
    {
      title: "Booking System",
      description: "Online appointment and booking management",
      price: "₹20,999",
      icon: <Globe className="w-8 h-8" />
    }
  ];

  const mobileApps = [
    {
      title: "Business Mobile App",
      description: "Custom mobile application for your business",
      price: "₹45,999",
      features: ["iOS & Android", "Push Notifications", "Offline Support"]
    },
    {
      title: "E-commerce App",
      description: "Mobile shopping experience for your customers",
      price: "₹65,999",
      features: ["Payment Integration", "Order Tracking", "Customer Reviews"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Photo Frame */}
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="w-full h-80 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <Globe className="w-20 h-20 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-2xl font-bold mb-2">Your Business</h3>
                    <p className="text-lg opacity-90">Going Digital</p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Local Business Online Setup
            </h1>
            
            <h2 className="text-2xl font-semibold text-gray-800">
              How do we bring your business online?
            </h2>

            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We follow strategic steps to bring your business online, starting with Google local keywords optimization and creating a professional website for your business presence. When customers search for services related to your business in your area, your business details will appear at the top, helping your business grow online.
              </p>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Is this setup too difficult? Do you need extensive knowledge?
                </h3>
                <p className="text-lg font-medium text-green-600">
                  NO! Our company handles everything. You just need to choose our business promotion plans according to your needs, and we'll take care of the rest.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Local Setup Pricing Plans */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Local Setup Pricing Plans</h2>
            <p className="text-xl text-gray-600">Choose the perfect plan to establish your online presence</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {optimizationPlans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-white rounded-3xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300 ${
                  plan.popular ? 'ring-4 ring-purple-500 ring-opacity-50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.title}</h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-purple-600">{plan.price}</span>
                    <span className="text-lg text-gray-400 line-through">{plan.originalPrice}</span>
                  </div>
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {plan.discount}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Websites for Local Business */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Websites for Local Business</h2>
            <p className="text-xl text-gray-600">Professional websites tailored for your business needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {websitePackages.map((pkg, index) => (
              <div 
                key={index}
                className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                onMouseEnter={() => setActiveCard(`website-${index}`)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-2xl mb-4 transition-all duration-300 ${
                    activeCard === `website-${index}` 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {pkg.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.title}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">{pkg.price}</span>
                    <span className="text-sm text-gray-400 line-through">{pkg.originalPrice}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300">
                  Choose Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Web Software Services */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Web Software for Local Business</h2>
            <p className="text-xl text-gray-600">Powerful software solutions to streamline your operations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {softwareServices.map((service, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="bg-gradient-to-br from-green-500 to-teal-500 text-white p-4 rounded-2xl inline-flex mb-6">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">{service.price}</span>
                  <button className="bg-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Apps */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Mobile Apps for Local Services</h2>
            <p className="text-xl text-gray-600">Custom mobile applications to reach your customers anywhere</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {mobileApps.map((app, index) => (
              <div 
                key={index}
                className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-2xl">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{app.title}</h3>
                    <span className="text-2xl font-bold text-purple-600">{app.price}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">{app.description}</p>
                
                <div className="space-y-2 mb-6">
                  {app.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                  Start Development
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Take Your Business Online?</h2>
          <p className="text-xl mb-8 opacity-90">Let's discuss your requirements and create the perfect digital solution for your business</p>
          <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            Get Free Consultation
          </button>
        </div>
      </section>
    </div>
  );
};

export default LocalBusinessWebsite;