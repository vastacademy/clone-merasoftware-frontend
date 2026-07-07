import React, { useState } from 'react';
import { Check, ArrowUpDown } from 'lucide-react';

const StaticWebsitesPage = () => {
  const staticWebsites = [
    {
      name: "Basic Business Website",
      specs: ["5 Pages", "Mobile Responsive", "Contact Form", "SEO Basics", "Social Media Links"],
      startingPrice: "15,000"
    },
    {
      name: "Portfolio Website",
      specs: ["Gallery Section", "Project Showcase", "Client Testimonials", "Mobile Responsive", "Contact Form"],
      startingPrice: "18,000"
    },
    {
      name: "Landing Page",
      specs: ["Single Page Design", "Call-to-Action", "Lead Capture Form", "Mobile Responsive", "Analytics Setup"],
      startingPrice: "10,000"
    },
    {
      name: "Restaurant Website",
      specs: ["Menu Display", "Location Map", "Reservation Form", "Mobile Responsive", "Photo Gallery"],
      startingPrice: "20,000"
    },
    {
      name: "Real Estate Website",
      specs: ["Property Listings", "Photo Galleries", "Contact Forms", "Mobile Responsive", "Location Maps"],
      startingPrice: "25,000"
    },
    {
      name: "Nonprofit Website",
      specs: ["Donation Integration", "Event Calendar", "Volunteer Section", "Mobile Responsive", "Newsletter Signup"],
      startingPrice: "22,000"
    },
    {
      name: "Personal Blog",
      specs: ["Blog Posts", "Categories", "About Page", "Mobile Responsive", "Social Sharing"],
      startingPrice: "12,000"
    },
    {
      name: "Small Shop Website",
      specs: ["Product Display", "Contact Form", "About Page", "Mobile Responsive", "Social Media Links"],
      startingPrice: "16,000"
    }
  ];

  const [sortedWebsites, setSortedWebsites] = useState([...staticWebsites]);
  const [sortOrder, setSortOrder] = useState('default');

  const handleSort = (type) => {
    let sorted = [...staticWebsites];
    
    if (type === 'price') {
      if (sortOrder === 'price-asc') {
        sorted.sort((a, b) => parseInt(b.startingPrice.replace(',', '')) - parseInt(a.startingPrice.replace(',', '')));
        setSortOrder('price-desc');
      } else {
        sorted.sort((a, b) => parseInt(a.startingPrice.replace(',', '')) - parseInt(b.startingPrice.replace(',', '')));
        setSortOrder('price-asc');
      }
    } else if (type === 'name') {
      if (sortOrder === 'name-asc') {
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        setSortOrder('name-desc');
      } else {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        setSortOrder('name-asc');
      }
    } else {
      // Default order (reset)
      sorted = [...staticWebsites];
      setSortOrder('default');
    }
    
    setSortedWebsites(sorted);
  };

  const getStaticWebsiteIcon = (name) => {
    // Simple function to return an icon based on website name
    // In a real implementation, you would use actual icons
    return <div className="text-blue-500 text-lg font-bold">{name.charAt(0)}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Static Websites</h1>
        </div>
      </header>

      <main>
        <section id="static" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Static Websites – Simple Solutions for a Strong Presence</h2>
              <p className="text-gray-600 text-xl">View our popular static website options to guide your own budget and project scope.</p>
            </div>

            <div className="flex justify-end mb-4">
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleSort('default')} 
                  className={`px-3 py-1 text-sm rounded-md ${sortOrder === 'default' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  Default
                </button>
                <button 
                  onClick={() => handleSort('name')} 
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${sortOrder.includes('name') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  Name <ArrowUpDown className="ml-1 h-3 w-3" />
                </button>
                <button 
                  onClick={() => handleSort('price')} 
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${sortOrder.includes('price') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  Price <ArrowUpDown className="ml-1 h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              {sortedWebsites.map((website, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-200 flex flex-col items-start text-left md:text-left md:block"
                  onClick={() => console.log(`Clicked on ${website.name}`)}
                >
                  <div className="w-6 h-6 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2 md:mb-4 mx-0 md:mx-0">
                    {getStaticWebsiteIcon(website.name)}
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{website.name}</h3>

                  <div className="hidden md:block mb-2 md:mb-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-1">
                      {website.specs.slice(0, 3).map((spec, specIndex) => (
                        <div key={specIndex} className="flex items-center text-gray-600 text-xs md:text-sm">
                          <Check className="w-3 h-3 text-blue-500 mr-1 md:mr-2 flex-shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                      {website.specs.length > 3 && (
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
                      <span className="text-base md:text-2xl font-bold text-blue-600 ml-1 md:ml-2">₹{website.startingPrice}</span>
                    </div>
                    <div className="hidden md:flex md:items-end md:justify-between w-full">
                      <div className="text-left">
                        <span className="text-sm text-gray-500 block">Starts</span>
                        <span className="text-2xl font-bold text-blue-600">₹{website.startingPrice}</span>
                      </div>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StaticWebsitesPage;
