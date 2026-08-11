import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {  Check } from 'lucide-react';
import packageOptions from '../helpers/packageOptions';
import perfectForOptions from '../helpers/perfectForOptions';
import { resolvePerfectForIcon } from '../helpers/perfectForIconSet';
import SummaryApi from '../common';
import Context from '../context';
import CartPopup from '../components/CartPopup';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import VerticalCardProduct from '../components/VerticalCardProduct';
import addToCart from '../helpers/addToCart';
import { toast } from 'sonner';
import { 
  cacheProductDetails, 
  getCachedProduct, 
  isCacheStale,
  clearOldCache 
} from '../helpers/productDB';
import LoginPopup from '../components/LoginPopup';
import { useSelector } from 'react-redux';

// Alert Modal Component
const AlertModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Notice</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductDetails = () => {
  const [data, setData] = useState({
    serviceName: "",
    category: "",
    packageIncludes: [],
    perfectFor: [],
    serviceImage: [],
    price: "",
    sellingPrice: "",
    additionalFeatures: [],
    formattedDescriptions: []
  });

  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [additionalFeaturesData, setAdditionalFeaturesData] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [paymentOption, setPaymentOption] = useState('full');
  const [showLoginContactForm, setShowLoginContactForm] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

   // New states for coupon functionality
   const [couponCode, setCouponCode] = useState('');
   const [couponLoading, setCouponLoading] = useState(false);
   const [couponData, setCouponData] = useState(null);
   const [couponError, setCouponError] = useState('');

  // Get user authentication status
  const userDetails = useSelector((state) => state.user.user);
const isAuthenticated = !!userDetails?._id;
const isInitialized = useSelector((state) => state.user.initialized);

  const navigate = useNavigate();
  const params = useParams();

  // Calculate base price (without coupon discount)
  const calculateBasePrice = () => {
    const basePrice = data.sellingPrice;
    const featuresPrice = selectedFeatures.reduce((sum, featureId) => {
      const feature = additionalFeaturesData.find(f => f._id === featureId);
      if (!feature) return sum;
  
      // सिर्फ Add New Page के लिए क्वांटिटी हिसाब से प्राइस कैलकुलेट करें
      if (feature.serviceName.toLowerCase().includes('add new page')) {
        const quantity = quantities[featureId] || data.totalPages;
        const additionalQuantity = Math.max(0, quantity - data.totalPages);
        return sum + (additionalQuantity * feature.sellingPrice);
      }
  
      // अन्य फीचर्स के लिए सिंगल प्राइस
      return sum + feature.sellingPrice;
    }, 0);
  
    return basePrice + featuresPrice;
  };

   // Calculate total price (with coupon discount applied if available)
  const calculateTotalPrice = () => {
    const basePrice = calculateBasePrice();
    
    if (couponData && couponData.success) {
      return couponData.data.finalPrice;
    }
    
    return basePrice;
  };

  // Handle coupon validation
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    
    try {
      const response = await fetch(SummaryApi.validateCoupon.url, {
        method: SummaryApi.validateCoupon.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: couponCode,
          productId: data._id,
          amount: calculateBasePrice()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCouponData(result);
        toast.success(`Coupon applied! You saved ₹${result.data.discountAmount.toLocaleString()}`);
      } else {
        setCouponError(result.message || 'Invalid coupon code');
        setCouponData(null);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Something went wrong. Please try again.');
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  //Clear coupon
  const clearCoupon = () => {
    setCouponCode('');
    setCouponData(null);
    setCouponError('');
  };

  // Get icon from packageOptions
  const getIconForFeature = (featureName) => {
    const option = packageOptions.find(opt => 
      opt.value.toLowerCase() === featureName.toLowerCase() ||
      opt.label.toLowerCase() === featureName.toLowerCase()
    );
    return option?.icon || packageOptions[0].icon;
  };

  // Get icon for a perfectFor entry. New projects store { text, icon } directly (icon resolved
  // via the fixed icon-set); legacy projects still store plain strings, looked up in the old
  // perfectForOptions.js dictionary as before.
  const getPerfectForIcon = (item) => {
    if (item && typeof item === 'object') {
      return resolvePerfectForIcon(item.icon);
    }
    const option = perfectForOptions.find(opt =>
      opt.value.toLowerCase() === item.toLowerCase() ||
      opt.label.toLowerCase() === item.toLowerCase()
    );
    return option?.icon;
  };

  const getPerfectForText = (item) => (item && typeof item === 'object' ? item.text : item);

  const handleFeatureToggle = (featureId) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFeatures.length === additionalFeaturesData.length) {
      setSelectedFeatures([]);
    } else {
      setSelectedFeatures(additionalFeaturesData.map(f => f._id));
    }
  };

  // const handleAddToCart = async (e) => {
  //   try {
  //     setAddToCartLoading(true);
  //     const result = await addToCart(
  //       e, 
  //       data?._id, 
  //       1, 
  //       couponData ? {
  //         couponCode: couponData.data.couponCode,
  //         discountAmount: couponData.data.discountAmount,
  //         finalPrice: couponData.data.finalPrice
  //       } : null
  //     );
      
  //     if (selectedFeatures.length > 0) {
  //       await Promise.all(selectedFeatures.map(featureId => {
  //         const quantity = quantities[featureId] || data.totalPages;
  //         return addToCart(e, featureId, quantity);
  //       }));
  //     }

  //     await fetchUserAddToCart();
  //     setAddToCartLoading(false);
  //     setShowCartPopup(true);
  //   } catch (error) {
  //     console.error("Error adding to cart:", error);
  //     setAddToCartLoading(false);
  //   }
  // };

  const handleGetStarted = async (e) => {
    console.log("Authentication check:", { 
      userDetails, 
      isAuthenticated: !!userDetails?._id, 
      userId: userDetails?._id,
      isInitialized
    });
  
    // Wait until user state is initialized
    if (isInitialized && !userDetails) {
      console.log("User not authenticated, showing login form");
      setShowLoginContactForm(true);
      return;
    }

    if (data.category === 'website_updates') {
      // First check if user already has an active update plan
      try {
        const response = await fetch(SummaryApi.validateUpdatePlan.url, {
          method: SummaryApi.validateUpdatePlan.method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productId: data._id
          })
        });
        
        const result = await response.json();
        if (!result.success) {
          setAlertMessage(result.message);
          setShowAlert(true);
          return;
        }
      } catch (error) {
        console.error('Error:', error);
        setAlertMessage('Something went wrong');
        setShowAlert(true);
        return;
      }
    }
  
    // Calculate total price
    const totalPrice = calculateTotalPrice();
    
    // Calculate payment amounts based on selected option
    let currentPaymentAmount = totalPrice;
    let remainingPayments = [];
    
    if (paymentOption === 'partial') {
      // For partial payment: Calculate 30% of total
      const firstInstallment = Math.round(totalPrice * 0.3);
      const secondInstallment = Math.round(totalPrice * 0.3);
      const thirdInstallment = totalPrice - (firstInstallment + secondInstallment);
      currentPaymentAmount = firstInstallment;
      
      // Calculate remaining installments
      remainingPayments = [
        {
          installmentNumber: 2,
          percentage: 30,
          amount: secondInstallment
        },
        {
          installmentNumber: 3,
          percentage: 40,
          amount: thirdInstallment
        }
      ];
    }
  
    // Structure the selected features data with proper error handling
    const selectedFeaturesData = [];
    
    for (const featureId of selectedFeatures) {
      // Find the feature in additionalFeaturesData
      const feature = additionalFeaturesData.find(f => f._id === featureId);
      
      // Skip if feature not found
      if (!feature) {
        console.warn(`Feature with ID ${featureId} not found in additionalFeaturesData`);
        continue;
      }
      
      // Skip if feature doesn't have a serviceName
      if (!feature.serviceName) {
        console.warn(`Feature with ID ${featureId} doesn't have a serviceName property`, feature);
        continue;
      }
      
      // Get the quantity for this feature (default to 1 if not set)
      const quantity = quantities[featureId] || 1;
      
      // Check if this is an "Add New Page" feature (with null check)
      const featureNameLower = feature.serviceName.toLowerCase();
      const isAddNewPage = featureNameLower.includes('add new page');
      
      // For "Add New Page" features, calculate additional pages beyond what's included
      let additionalQuantity = 0;
      if (isAddNewPage) {
        additionalQuantity = Math.max(0, quantity - data.totalPages);
      }
      
      // Calculate feature total price based on type
      let featureTotalPrice = 0;
      if (isAddNewPage) {
        featureTotalPrice = feature.sellingPrice * additionalQuantity;
      } else {
        featureTotalPrice = feature.sellingPrice * quantity;
      }
      
      // Add to selectedFeaturesData
      selectedFeaturesData.push({
        id: feature._id,
        name: feature.serviceName,
        quantity: quantity,
        additionalQuantity: additionalQuantity,
        sellingPrice: feature.sellingPrice,
        totalPrice: featureTotalPrice
      });
    }
    
    // Calculate original total price (before any discounts)
    const originalTotalPrice = data.sellingPrice + 
      selectedFeaturesData.reduce((sum, feature) => sum + feature.totalPrice, 0);
  
    // Create a proper structured object for payment data
    const paymentData = {
      product: {
        ...data,
        // If coupon is applied, include the discounted base price
        finalPrice: couponData ? couponData.data.finalPrice : data.sellingPrice
      },
      selectedFeatures: selectedFeaturesData,
      couponData: couponData,
      totalPrice: totalPrice,
      currentPaymentAmount: currentPaymentAmount,
      originalTotalPrice: calculateBasePrice(), // Total before coupon
      paymentOption: paymentOption,
      remainingPayments: remainingPayments
    };
  
    console.log("Payment data prepared:", paymentData); // Log for debugging
  
    // Store user selections in sessionStorage
    const userSelections = {
      productId: data._id,
      selectedFeatures,
      quantities,
      couponCode,
      couponData,
      paymentOption
    };
  
    // Save to sessionStorage
    sessionStorage.setItem('userProductSelections', JSON.stringify(userSelections));
    
    // Navigate to direct payment page with data
    navigate('/direct-payment', { state: { paymentData } });
  };
   

  // Reset coupon when selected features change
  useEffect(() => {
    if (couponData) {
      clearCoupon();
    }
  }, [selectedFeatures, quantities]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setInitialLoading(true);
        
        // Try to get cached data first
        const cachedData = await getCachedProduct(params?.id);
        
        if (cachedData && !isCacheStale(cachedData.lastUpdated)) {
          setData(cachedData);
          setInitialLoading(false);
          setLoading(false);
          
          if (cachedData.additionalFeaturesData) {
            setAdditionalFeaturesData(cachedData.additionalFeaturesData);
            
            // Check if there are saved selections in sessionStorage
            const savedSelectionsStr = sessionStorage.getItem('userProductSelections');
            
            if (savedSelectionsStr) {
              try {
                const savedSelections = JSON.parse(savedSelectionsStr);
                
                // Only restore if it's for the same product
                if (savedSelections.productId === params?.id) {
                  // Restore selected features
                  if (savedSelections.selectedFeatures) {
                    setSelectedFeatures(savedSelections.selectedFeatures);
                  } else {
                    // Use empty array if no saved selections
                    setSelectedFeatures([]);
                  }
                  
                  // Restore quantities
                  if (savedSelections.quantities) {
                    setQuantities(savedSelections.quantities);
                  } else {
                    // Initialize quantities with default values
                    const initialQuantities = {};
                    cachedData.additionalFeaturesData.forEach(feature => {
                      // Only set DEFAULT quantity, don't auto-select
                      initialQuantities[feature._id] = feature.baseQuantity || cachedData.totalPages;
                    });
                    setQuantities(initialQuantities);
                  }
                  
                  // Restore coupon related data
                  if (savedSelections.couponCode) {
                    setCouponCode(savedSelections.couponCode);
                  }
                  
                  if (savedSelections.couponData) {
                    setCouponData(savedSelections.couponData);
                  }
                  
                  // Restore payment option
                  if (savedSelections.paymentOption) {
                    setPaymentOption(savedSelections.paymentOption);
                  }
                } else {
                  // Different product, use original initialization (without auto-select)
                  initializeWithoutAutoSelect(cachedData);
                }
              } catch (error) {
                console.error("Error parsing saved selections:", error);
                // Fallback to original initialization
                initializeWithoutAutoSelect(cachedData);
              }
            } else {
              // No saved selections, use original initialization (without auto-select)
              initializeWithoutAutoSelect(cachedData);
            }
          }
          
          // Still fetch fresh data in background
          fetchFreshData();
        } else {
          await fetchFreshData();
        }
        
        clearOldCache().catch(console.error);
        
      } catch (error) {
        console.error("Error in product details:", error);
        setInitialLoading(false);
        setLoading(false);
      }
    };
  
    // Initialize without auto-selecting any features (original behavior)
    const initializeWithoutAutoSelect = (productData) => {
      const initialQuantities = {};
      const initialSelectedFeatures = [];
  
      productData.additionalFeaturesData.forEach(feature => {
        if (feature.upgradeType === 'component') {
          initialQuantities[feature._id] = feature.baseQuantity || productData.totalPages;
          // Do NOT add to initialSelectedFeatures to avoid auto-select
        }
      });
  
      setQuantities(initialQuantities);
      setSelectedFeatures(initialSelectedFeatures); // Empty array, no auto-select
    };
  
    const fetchFreshData = async () => {
      try {
        const response = await fetch(SummaryApi.productDetails.url, {
          method: SummaryApi.productDetails.method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ productId: params?.id })
        });
        
        const dataResponse = await response.json();
        const productData = dataResponse?.data;
        setData(productData);
        
        // Check if the product has additional features and category
        if (productData?.additionalFeatures?.length > 0 && productData.category) {
          // Fetch additional features with category filter
          const featuresPromises = productData.additionalFeatures.map(featureId =>
            fetch(SummaryApi.productDetails.url, {
              method: SummaryApi.productDetails.method,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ 
                productId: featureId,
                category: productData.category
              })
            }).then(res => res.json())
          );
  
          const featuresData = await Promise.all(featuresPromises);
          const featuresWithData = featuresData
          .map(fd => fd.data)
          .filter(feature => {
            // Check if feature is compatible with current product category
            const isCompatible = feature.compatibleWith && 
              feature.compatibleWith.includes(productData.category);
            
            // Add New Page केवल standard_websites कैटेगरी में दिखाएं
            if (feature.serviceName.toLowerCase().includes('add new page')) {
              return productData.category === 'standard_websites' && isCompatible;
            }
            
            // बाकी सभी फीचर्स के लिए कंपैटिबिलिटी चेक करें
            return isCompatible;
          });
        
        // नई सॉर्टिंग लॉजिक - Add New Page सबसे पहले, फिर पेज-संबंधित, फिर बाकी
        const sortedFeatures = featuresWithData.sort((a, b) => {
          // Add New Page को सबसे पहले रखें
          if (a.serviceName.toLowerCase().includes('add new page')) return -1;
          if (b.serviceName.toLowerCase().includes('add new page')) return 1;
          
          // फिर अन्य पेज-संबंधित फीचर्स
          const aIsPage = a.serviceName.toLowerCase().includes('page');
          const bIsPage = b.serviceName.toLowerCase().includes('page');
          if (aIsPage && !bIsPage) return -1;
          if (!aIsPage && bIsPage) return 1;
          
          // यदि दोनों पेज या दोनों गैर-पेज हैं, तो अल्फाबेटिकल सॉर्ट करें
          return a.serviceName.localeCompare(b.serviceName);
        });
        
        setAdditionalFeaturesData(sortedFeatures);
  
          // Cache the complete data
          await cacheProductDetails(params?.id, {
            ...productData,
            additionalFeaturesData: sortedFeatures
          });
  
          // Check if there are saved selections in sessionStorage
          const savedSelectionsStr = sessionStorage.getItem('userProductSelections');
          
          if (savedSelectionsStr) {
            try {
              const savedSelections = JSON.parse(savedSelectionsStr);
              
              // Only restore if it's for the same product
              if (savedSelections.productId === params?.id) {
                setSelectedFeatures(savedSelections.selectedFeatures || []);
                setQuantities(savedSelections.quantities || {});
                
                // Initialize any missing quantities
                const updatedQuantities = {...(savedSelections.quantities || {})};
                sortedFeatures.forEach(feature => {
                  if (!(feature._id in updatedQuantities)) {
                    updatedQuantities[feature._id] = feature.upgradeType === 'component' ? 
                      (feature.baseQuantity || productData.totalPages) : 1;
                  }
                });
                
                setQuantities(updatedQuantities);
              } else {
                // Different product, initialize without auto-select
                initializeFreshWithoutAutoSelect(sortedFeatures, productData);
              }
            } catch (error) {
              console.error("Error parsing saved selections:", error);
              // Fallback to initialization without auto-select
              initializeFreshWithoutAutoSelect(sortedFeatures, productData);
            }
          } else {
            // No saved selections, initialize without auto-select
            initializeFreshWithoutAutoSelect(sortedFeatures, productData);
          }
        }
  
        setInitialLoading(false);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching fresh data:", error);
        throw error;
      }
    };
  
    // Initialize fresh data without auto-selecting any features
    const initializeFreshWithoutAutoSelect = (sortedFeatures, productData) => {
      const initialQuantities = {};
      // Empty array for selected features - nothing auto-selected
      const initialSelectedFeatures = [];
  
      sortedFeatures.forEach(feature => {
        // सिर्फ पेज संबंधित फीचर्स के लिए क्वांटिटी सेट करें
        if (feature.serviceName.toLowerCase().includes('page')) {
          initialQuantities[feature._id] = productData.totalPages;
        } else {
          initialQuantities[feature._id] = 1;
        }
      });
    
      setQuantities(initialQuantities);
      setSelectedFeatures(initialSelectedFeatures); // कुछ भी auto-select नहीं
    };
  
    fetchProductDetails();
  }, [params]);

  // Category बेस्ड rendering के लिए helper function
  const shouldShowSection = (category, sectionType) => {
    if (!category) return true;
    
    // Feature upgrades और website updates के लिए कुछ sections को hide करें
    const specialCategories = ['website_updates', 'feature_upgrades'];
    
    if (specialCategories.includes(category) && 
        (sectionType === 'perfectFor' || sectionType === 'packageIncludes')) {
      return false;
    }
    
    return true;
  };

  const customStyles = `
  .description-content.prose hr {
    margin-top: 14px !important;
    margin-bottom: 14px !important;
    height: 1px !important;
  }

  .description-content.prose p {
    margin-bottom: 0.5rem !important;
  }
`;

  const shouldShowCustomizePlan = (productData) => {
    // केवल तभी दिखाएं जब additional features हों
    return productData.additionalFeatures && 
           productData.additionalFeatures.length > 0 && 
           additionalFeaturesData.length > 0;
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
        <div className="rounded-lg p-8">
          <TriangleMazeLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    {addToCartLoading && (
      <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
        <div className="rounded-lg p-8">
          <TriangleMazeLoader />
        </div>
      </div>
    )}
  
    {/* Hero Section with Background Image */}
    <section className="relative">
      <div 
        className="h-96 bg-center bg-cover"
        style={{backgroundImage: data.serviceImage && data.serviceImage[0] ? `url(${data.serviceImage[0]})` : 'none'}}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>
      <div className="container mx-auto px-12 absolute inset-0 flex items-center">
        <div className="max-w-xl text-white z-10">
          <h1 className="text-5xl font-bold mb-4 leading-tight">{data.serviceName}</h1>
          <p className="text-lg opacity-90 mb-8 capitalize">
            {data.category?.split('_').join(' ')}
          </p>
          <button 
            onClick={handleGetStarted}
            className="inline-block bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 hover:bg-amber-600 hover:-translate-y-1 hover:shadow-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  
    {/* Main Content Container */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Main content */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* Two sections in a responsive layout */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Who is it for? Section (smaller) */}
            {shouldShowSection(data.category, 'perfectFor') && data.perfectFor?.length > 0 && (
              <div className="w-full md:w-2/5 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Who is it for?</h2>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {data.perfectFor?.map((item, index) => {
                      const Icon = getPerfectForIcon(item);
                      return (
                        <button key={index} className="flex items-center gap-2 border border-gray-200 hover:border-blue-400 rounded-lg p-2.5 text-sm hover:bg-blue-50 transition-colors">
                          {Icon && React.createElement(Icon, { 
                            className: "w-5 h-5 text-blue-600"
                          })}
                          <span className="capitalize">{getPerfectForText(item)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* What's Included Section (larger) */}
            {shouldShowSection(data.category, 'packageIncludes') && data.packageIncludes?.length > 0 && (
              <div className="w-full md:w-3/5 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">What's Included</h2>
                  
                  <div className="space-y-6">
                    {data.packageIncludes?.map((feature, index) => {
                      const Icon = getIconForFeature(feature);
                      const packageOption = packageOptions.find(opt => 
                        opt.value.toLowerCase() === feature.toLowerCase() ||
                        opt.label.toLowerCase() === feature.toLowerCase()
                      );
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                            {React.createElement(Icon, { 
                              className: "text-blue-500"
                            })}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 capitalize">{feature}</h3>
                            <p className="text-gray-600 text-sm">
                              {packageOption?.description || "Exclusive feature included with your purchase"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Description Sections */}
          {data.formattedDescriptions?.map((desc, index) => (
            <div key={index} className="bg-white rounded-lg p-5 shadow-md">
              <style>{customStyles}</style>
              <div 
                className="prose prose-sm max-w-none description-content"
                dangerouslySetInnerHTML={{ __html: desc.content }}
              />
            </div>
          ))}
        </div>
        
        {/* Right Column - Sticky Customize Plan */}
        <div className="w-full lg:w-1/3 relative">
          <div className="lg:sticky lg:top-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold py-4 px-5 bg-blue-600 text-white rounded-t-lg">Customize Your Plan</h2>
            
            <div className="space-y-4 p-5">
              {/* Base Product Display */}
              <div className="flex items-center justify-between p-3 border-b hover:bg-blue-50 transition-colors rounded">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{data.serviceName}</h3>
                    <p className="text-xs text-gray-500 capitalize">{data.category?.split('_').join(' ')}</p>
                  </div>
                </div>
                <div className="text-blue-600 font-semibold">₹{data.sellingPrice?.toLocaleString()}</div>
              </div>
  
              {/* Additional Features Section */}
              {additionalFeaturesData.map(feature => {
  const isSelected = selectedFeatures.includes(feature._id);
  const iconChar = feature.serviceName.charAt(0).toUpperCase();
  // चेक करें कि क्या यह Add New Page फीचर है
  const isAddNewPage = feature.serviceName.toLowerCase().includes('add new page');
   
  return (
    <div key={feature._id} className="flex items-center justify-between p-3 border-b hover:bg-blue-50 transition-colors rounded">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600">{iconChar}</span>
        </div>
        <div>
          <h3 className="font-medium text-gray-800">{feature.serviceName}</h3>
          {isAddNewPage && (
            <p className="text-xs text-gray-500">₹{feature.sellingPrice?.toLocaleString()} Per Additional Unit</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-blue-600 font-semibold">₹{feature.sellingPrice?.toLocaleString()}</div>
        <div className="relative">
          <input
            type="checkbox"
            id={`feature-${feature._id}`}
            className="h-5 w-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
            checked={isSelected}
            onChange={() => handleFeatureToggle(feature._id)}
          />
        </div>
      </div>
    </div>
  );
})}
              
              {/* Show quantity selector for selected component type features */}
              {selectedFeatures.map(featureId => {
  const feature = additionalFeaturesData.find(f => f._id === featureId);
  if (feature && feature.serviceName.toLowerCase().includes('add new page')) {
    return (
      <div key={`quantity-${featureId}`} className="flex items-center border border-gray-200 rounded-md overflow-hidden ml-14 w-32">
        <button 
          className="w-8 h-8 bg-gray-50 flex items-center justify-center text-base hover:bg-gray-200 transition-colors"
          onClick={() => {
            if (quantities[featureId] > data.totalPages) {
              setQuantities({
                ...quantities,
                [featureId]: quantities[featureId] - 1
              });
            }
          }}
        >-</button>
        <input 
          type="text" 
          className="w-16 h-8 border-none text-center font-semibold text-sm" 
          value={quantities[featureId] || data.totalPages}
          readOnly 
        />
        <button 
          className="w-8 h-8 bg-gray-50 flex items-center justify-center text-base hover:bg-gray-200 transition-colors"
          onClick={() => {
            setQuantities({
              ...quantities,
              [featureId]: (quantities[featureId] || data.totalPages) + 1
            });
          }}
        >+</button>
      </div>
    );
  }
  return null;
})}
  
              {/* Coupon Code Section */}
              <div className="pt-5 border-t mt-6 pb-4">
                <h3 className="font-medium mb-3 text-gray-800">Apply Coupon</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text"
                    className="border rounded p-2.5 flex-grow focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={couponLoading}
                  />
                  
                  {couponData ? (
                    <button
                      onClick={clearCoupon}
                      className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  ) : (
                    <button
                      onClick={validateCoupon}
                      className={`px-5 py-2.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors ${
                        couponLoading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      disabled={couponLoading}
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  )}
                </div>
                
                {couponError && (
                  <p className="mt-1 text-xs text-red-600">{couponError}</p>
                )}
                
                {couponData && couponData.success && (
                  <div className="mt-2 text-sm bg-green-50 border border-green-200 rounded-md p-2">
                    <div className="flex items-center text-green-700">
                      <Check className="w-4 h-4 mr-1" />
                      <span>Coupon applied!</span>
                    </div>
                    <p className="text-gray-600">
                      You saved ₹{couponData.data.discountAmount.toLocaleString()}
                      {couponData.data.discountType === 'percentage' && 
                        ` (${parseFloat(couponData.data.discountValue).toFixed(2)}% off)`}
                    </p>
                  </div>
                )}
              </div>
  
              {/* Payment Option Section */}
              <div className="pt-5 border-t">
                <h3 className="text-base font-semibold mb-4">Select Payment Option</h3>
                <div className="space-y-4">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${paymentOption === 'full' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => setPaymentOption('full')}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-4 h-4 rounded-full mr-2 ${paymentOption === 'full' ? 'bg-blue-600' : 'border border-gray-400'}`}></div>
                      <span className="font-medium">Full Payment</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">Pay the entire amount at once</p>
                  </div>
                 
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${paymentOption === 'partial' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => setPaymentOption('partial')}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-4 h-4 rounded-full mr-2 ${paymentOption === 'partial' ? 'bg-blue-600' : 'border border-gray-400'}`}></div>
                      <span className="font-medium">Partial Payment</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">Pay in 3 installments (30% - 30% - 40%)</p>
                  </div>
                </div>
                
                {/* Show payment breakdown for partial payment */}
                {paymentOption === 'partial' && (
                  <div className="bg-gray-50 p-3 rounded-lg mt-4 mb-4">
                    <h4 className="text-sm font-medium mb-2">Payment Schedule:</h4>
                    <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>First Payment (30%):</span>
                  <span className="font-medium">₹{(() => {
                    const total = calculateTotalPrice();
                    const first = Math.round(total * 0.3);
                    return first.toLocaleString();
                  })()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Second Payment (30%):</span>
                  <span className="font-medium">₹{(() => {
                    const total = calculateTotalPrice();
                    const second = Math.round(total * 0.3);
                    return second.toLocaleString();
                  })()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Final Payment (40%):</span>
                  <span className="font-medium">₹{(() => {
                    const total = calculateTotalPrice();
                    const first = Math.round(total * 0.3);
                    const second = Math.round(total * 0.3);
                    const third = total - (first + second);
                    return third.toLocaleString();
                  })()}</span>
                </div>
                    </div>
                  </div>
                )}
              </div>
  
              {/* Price Summary */}
              <div className="flex flex-col gap-2 pt-6 mt-5 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Base Price:</span>
                  <span className="text-base font-medium text-gray-900">₹{calculateBasePrice().toLocaleString()}</span>
                </div>
                
                {couponData && couponData.success && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Discount:</span>
                    <span className="text-base font-medium text-green-600">-₹{couponData.data.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-lg font-semibold text-gray-900">Total Price:</span>
                  <span className="text-2xl font-bold text-blue-600">₹{calculateTotalPrice().toLocaleString()}</span>
                </div>
              </div>
              
              {/* Get Started Button */}
              <div className="mt-6">
                 <button 
        onClick={handleGetStarted}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        {isAuthenticated ? 
          (paymentOption === 'full' ? 'Proceed to Payment' : 'Pay First Installment') : 
          'Proceed & Continue'}
      </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  
    {/* Recommended Products Section */}
    {data.category && (
      <div className="container mx-auto px-4 lg:px-8 pb-12">
        <VerticalCardProduct 
          category={data.category} 
          heading="Recommended Products"
        />
      </div>
    )}
  
    {/* Cart Popup */}
    <CartPopup 
      isOpen={showCartPopup}
      onClose={() => setShowCartPopup(false)}
      product={data}
      className="z-[55]"
    />
  
    {/* Alert Modal */}
    <AlertModal 
      isOpen={showAlert}
      message={alertMessage}
      onClose={() => setShowAlert(false)}
    />

    <LoginPopup 
       isOpen={showLoginContactForm}
       onClose={() => setShowLoginContactForm(false)}
       productId={params?.id}
       />
  </div>
  );
};

export default ProductDetails;