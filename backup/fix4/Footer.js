import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PlusCircle, Home, UserCircle, Wallet, MessageSquare } from 'lucide-react';
import Context from '../context';
import SummaryApi from '../common';

const Footer = () => {
  const user = useSelector(state => state?.user?.user);
  const [menuDisplay, setMenuDisplay] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const context = useContext(Context);
  const navigate = useNavigate();
  const [activeProjectId, setActiveProjectId] = useState(null);

  useEffect(() => {
    // Fetch active project when user is logged in
    const fetchActiveProject = async () => {
      if (!user?._id) return;
      
      try {
        const response = await fetch(SummaryApi.ordersList.url, {
          method: SummaryApi.ordersList.method,
          credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
          // Get all orders
          const allOrders = data.data || [];
          
          // Filter website projects
          const websiteProjects = allOrders.filter(order => {
            const category = order.productId?.category?.toLowerCase();
            return ['standard_websites', 'dynamic_websites', 'web_applications', 'mobile_apps'].includes(category);
          });
          
          // Find active (in-progress) project
          const activeProj = websiteProjects.find(project => 
            project.projectProgress < 100 || project.currentPhase !== 'completed'
          );
          
          if (activeProj) {
            setActiveProjectId(activeProj._id);
          }
        }
      } catch (error) {
        console.error('Error fetching active project:', error);
      }
    };

    fetchActiveProject();
  }, [user?._id]);
  
  // Handle click on My Project button
  const handleMyProjectClick = (e) => {
    e.preventDefault();
    setActiveTab('project');
    
    if (activeProjectId) {
      navigate(`/project-details/${activeProjectId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      {/* Desktop Footer - Hidden on mobile */}
      <footer className="hidden md:block bg-gray-800 text-gray-300 py-10 mt-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="font-bold text-white">MeraSoftware</span>
              </div>
              <p className="text-sm">Your one-stop shop for all digital services. We help businesses build and enhance their online presence.</p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Categories</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Website Development</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App Development</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cloud Softwares</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features & Upgrades</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Terms & Policies</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms-and-conditions" className="hover:text-white transition-colors">Terms and Conditions</a></li>
                <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/cookies-policy" className="hover:text-white transition-colors">Cookies Policy</a></li>
                <li><a href="/refund-policy" className="hover:text-white transition-colors">Refund & Cancellation Policy</a></li>
                <li><a href="/delivery-policy" className="hover:text-white transition-colors">Delivery Policy</a></li>
                <li><a href="/disclaimers" className="hover:text-white transition-colors">User Guidelines and Disclaimer</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: vacomputers.com@gmail.com</li>
                <li>Phone: +91 93563 93094</li>
                <li>Address: VA Computers, Amritsar - 143601</li>
              </ul>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Footer Navigation - Hidden on desktop */}
      <div className="md:hidden mt-24">
        {/* Bottom Navigation */}
        <footer className="bg-white border-t fixed bottom-0 left-0 right-0 z-10">
          <div className="flex justify-between items-center px-2">
            <Link to={"/"}
              className={`flex flex-col items-center py-2 px-4 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('home')}
            >
              <Home size={20} />
              <span className="text-xs mt-1">Home</span>
            </Link>
            
            <Link to={user?._id ? "/wallet" : "/login"}
              className={`flex flex-col items-center py-2 px-4 ${activeTab === 'wallet' ? 'text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('wallet')}
            >
              <Wallet size={20} />
              {user?._id ? (
                <span className="text-xs mt-1">
                  ₹{context?.walletBalance || 0}
                </span>
              ) : (
                <span className="text-xs mt-1">Wallet</span>
              )}
            </Link>
            
            <Link to={"/start-new-project"} 
              className="flex flex-col items-center py-2 px-4"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center -mt-5 shadow-lg">
                <PlusCircle size={24} className="text-white" />
              </div>
              <span className="text-xs mt-1 text-blue-600">Explore</span>
            </Link>
            
            {/* My Project - Using onClick handler to navigate to active project */}
            <Link to={"/support"}
            className={`flex flex-col items-center py-2 px-4 ${activeTab === 'orders' ? 'text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('orders')}
          >
            <MessageSquare size={20} />
            <span className="text-xs mt-1">Support</span>
          </Link>
            
            {/* User Profile - Show profile image if logged in and image exists */}
            <Link to={user?._id ? "/profile" : "/login"}
              className={`flex flex-col items-center py-2 px-4 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('profile')}
            >
              {user?._id ? (
                <>
                  {user?.profilePic ? (
                    <img src={user.profilePic} className="w-6 h-6 rounded-full" alt={user?.name} />
                  ) : (
                    <UserCircle size={20} />
                  )}
                  <span className="text-xs mt-1">You</span>
                </>
              ) : (
                <>
                  <UserCircle size={20} />
                  <span className="text-xs mt-1">Login</span>
                </>
              )}
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Footer;