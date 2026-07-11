const STORAGE_KEYS = {
  USER_DETAILS: 'userDetails',
  WALLET_BALANCE: 'walletBalance',
  CART_COUNT: 'cartCount',
  GUEST_SLIDES: 'guestSlides',
  USER_ORDERS: 'userOrders',
  USER_WELCOME: 'userWelcome',
  PRODUCTS_DATA: 'productsData',
  PRODUCT_BANNERS: 'productBanners',
  PRODUCT_CATEGORIES: 'productCategories',
  CACHE_TIMESTAMP: 'cacheTimestamp'
};

const CACHE_EXPIRY = {
  PRODUCTS: 30 * 60 * 1000, // 30 minutes
  BANNERS: 60 * 60 * 1000,  // 1 hour
  CATEGORIES: 24 * 60 * 60 * 1000 // 24 hours
};

const StorageService = {
  // User details ke liye
  setUserDetails: (details) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DETAILS, JSON.stringify(details));
    } catch (error) {
      console.error('Error storing user details:', error);
    }
  },

  getUserDetails: () => {
    try {
      const details = localStorage.getItem(STORAGE_KEYS.USER_DETAILS);
      return details ? JSON.parse(details) : null;
    } catch (error) {
      console.error('Error getting user details:', error);
      return null;
    }
  },

  // Wallet balance ke liye
   setWalletBalance(balance) {
    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_BALANCE, JSON.stringify({
        balance,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error storing wallet balance:', error);
    }
  },
  
   getWalletBalance() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WALLET_BALANCE);
      if (!data) return 0;
      
      const parsed = JSON.parse(data);
      // Check if data is fresh (less than 30 minutes old)
      if (new Date() - new Date(parsed.timestamp) > 30 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEYS.WALLET_BALANCE);
        return 0;
      }
      return parsed.balance;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  },

  // Cart count ke liye
  setCartCount: (count) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART_COUNT, count.toString());
    } catch (error) {
      console.error('Error storing cart count:', error);
    }
  },

  getCartCount: () => {
    try {
      const count = localStorage.getItem(STORAGE_KEYS.CART_COUNT);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  },

  clearUserData: () => {
    try {
      // First backup guest slides
      const guestSlides = StorageService.getGuestSlides();
      
      // Clear only user-specific data
      localStorage.removeItem(STORAGE_KEYS.USER_DETAILS);
      localStorage.removeItem(STORAGE_KEYS.WALLET_BALANCE);
      localStorage.removeItem(STORAGE_KEYS.CART_COUNT);
      
      // Clear all user orders by pattern matching
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`${STORAGE_KEYS.USER_ORDERS}_`)) {
          localStorage.removeItem(key);
        }
      });
      
      // Restore guest slides if they existed
      if (guestSlides && guestSlides.length > 0) {
        console.log('Restoring guest slides after user data clear');
        StorageService.setGuestSlides(guestSlides);
      }
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },

  // Logout ke time clear karne ke liye
  clearAll: () => {
    try {
      // First save guest slides
      const guestSlides = StorageService.getGuestSlides();
      const savedSlides = guestSlides ? {
        data: guestSlides,
        timestamp: new Date().toISOString()
      } : null;
  
      // Clear all localStorage items except theme/language
      const keysToKeep = ['theme', 'language'];
      Object.values(STORAGE_KEYS).forEach(key => {
        if (!keysToKeep.includes(key) && key !== STORAGE_KEYS.GUEST_SLIDES) {
          localStorage.removeItem(key);
        }
      });
  
      // Restore guest slides if they existed
      if (savedSlides) {
        localStorage.setItem(STORAGE_KEYS.GUEST_SLIDES, JSON.stringify(savedSlides));
        // Also keep in sessionStorage as backup
        sessionStorage.setItem(STORAGE_KEYS.GUEST_SLIDES, JSON.stringify(savedSlides));
      }
    } catch (error) {
      console.error('Error in clearAll:', error);
    }
  },

  // Guest Slides ke liye
  setGuestSlides: (slides) => {
    try {
      // Ensure slides is a plain array
      const slidesArray = Array.isArray(slides) ? slides : 
                        (slides.data && Array.isArray(slides.data) ? slides.data : null);
                        
      if (!slidesArray) {
        console.error('Invalid slides format for storage:', slides);
        return;
      }
      
      // Store consistently as plain array
      localStorage.setItem(STORAGE_KEYS.GUEST_SLIDES, JSON.stringify(slidesArray));
      
      // Also store in sessionStorage as backup with the same format
      sessionStorage.setItem(STORAGE_KEYS.GUEST_SLIDES, JSON.stringify(slidesArray));
    } catch (error) {
      console.error('Error storing guest slides:', error);
    }
  },

  getGuestSlides: () => {
    try {
      // First try localStorage
      let slides = localStorage.getItem(STORAGE_KEYS.GUEST_SLIDES);
      
      // If not in localStorage, try sessionStorage as fallback
      if (!slides) {
        slides = sessionStorage.getItem(STORAGE_KEYS.GUEST_SLIDES);
        // If found in sessionStorage, restore to localStorage
        if (slides) {
          localStorage.setItem(STORAGE_KEYS.GUEST_SLIDES, slides);
        }
      }
      
      if (slides) {
        const parsed = JSON.parse(slides);
        // Handle different possible formats
        if (Array.isArray(parsed)) {
          return parsed;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          return parsed.data;
        } else if (typeof parsed === 'object') {
          // Try to find an array in the object
          for (const key in parsed) {
            if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
              return parsed[key];
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting guest slides:', error);
      return null;
    }
  },

  // User Orders ke liye
  setUserOrders: (userId, orders) => {
    try {
      localStorage.setItem(`${STORAGE_KEYS.USER_ORDERS}_${userId}`, JSON.stringify(orders));
    } catch (error) {
      console.error('Error storing user orders:', error);
    }
  },

  getUserOrders: (userId) => {
    try {
      const orders = localStorage.getItem(`${STORAGE_KEYS.USER_ORDERS}_${userId}`);
      return orders ? JSON.parse(orders) : null;
    } catch (error) {
      console.error('Error getting user orders:', error);
      return null;
    }
  },

  clearUserOrders: (userId) => {
    try {
      if (!userId) return;
      localStorage.removeItem(`${STORAGE_KEYS.USER_ORDERS}_${userId}`);
    } catch (error) {
      console.error('Error clearing user orders:', error);
    }
  },

// User Welcome ke liye
setUserWelcome: (welcome) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_WELCOME, JSON.stringify(welcome));
  } catch (error) {
    console.error('Error storing user welcome:', error);
  }
},

getUserWelcome: () => {
  try {
    const welcome = localStorage.getItem(STORAGE_KEYS.USER_WELCOME);
    return welcome ? JSON.parse(welcome) : null;
  } catch (error) {
    console.error('Error getting user welcome:', error);
    return null;
  }
},

// Products Data ke liye
setProductsData: (category, products) => {
  try {
    const key = `${STORAGE_KEYS.PRODUCTS_DATA}_${category}`;
    const storageItem = {
      data: products,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(storageItem));
  } catch (error) {
    console.error(`Error storing products data for ${category}:`, error);
  }
},

getProductsData: (category) => {
  try {
    const key = `${STORAGE_KEYS.PRODUCTS_DATA}_${category}`;
    const item = localStorage.getItem(key);
    
    if (!item) return null;
    
    const parsedItem = JSON.parse(item);
    
    // Check if cache has expired
    if (Date.now() - parsedItem.timestamp > CACHE_EXPIRY.PRODUCTS) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsedItem.data;
  } catch (error) {
    console.error(`Error getting products data for ${category}:`, error);
    return null;
  }
},

// Product Banners ke liye
setProductBanners: (category, banners) => {
  try {
    const key = `${STORAGE_KEYS.PRODUCT_BANNERS}_${category}`;
    const storageItem = {
      data: banners,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(storageItem));
    
    // Also store in sessionStorage as backup
    sessionStorage.setItem(key, JSON.stringify(storageItem));
  } catch (error) {
    console.error(`Error storing product banners for ${category}:`, error);
  }
},

getProductBanners: (category) => {
  try {
    // Try localStorage first
    const key = `${STORAGE_KEYS.PRODUCT_BANNERS}_${category}`;
    let item = localStorage.getItem(key);
    
    // If not in localStorage, try sessionStorage
    if (!item) {
      item = sessionStorage.getItem(key);
      // If found in sessionStorage, restore to localStorage
      if (item) {
        localStorage.setItem(key, item);
      }
    }
    
    if (!item) return null;
    
    const parsedItem = JSON.parse(item);
    
    // Check if cache has expired
    if (Date.now() - parsedItem.timestamp > CACHE_EXPIRY.BANNERS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return null;
    }
    
    return parsedItem.data;
  } catch (error) {
    console.error(`Error getting product banners for ${category}:`, error);
    return null;
  }
},

// Cache utilities
isCacheValid: (key, maxAge = CACHE_EXPIRY.PRODUCTS) => {
  try {
    const timestampKey = `${key}_${STORAGE_KEYS.CACHE_TIMESTAMP}`;
    const timestamp = localStorage.getItem(timestampKey);
    if (!timestamp) return false;
    
    return (Date.now() - parseInt(timestamp)) < maxAge;
  } catch (error) {
    console.error(`Error checking cache validity for ${key}:`, error);
    return false;
  }
},
updateCacheTimestamp: (key) => {
  try {
    const timestampKey = `${key}_${STORAGE_KEYS.CACHE_TIMESTAMP}`;
    localStorage.setItem(timestampKey, Date.now().toString());
  } catch (error) {
    console.error(`Error updating cache timestamp for ${key}:`, error);
  }
},

clearProductCache: () => {
  try {
    // Clear all product-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${STORAGE_KEYS.PRODUCTS_DATA}_`) || 
          key.startsWith(`${STORAGE_KEYS.PRODUCT_BANNERS}_`) ||
          key.includes(STORAGE_KEYS.CACHE_TIMESTAMP)) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clear from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(`${STORAGE_KEYS.PRODUCT_BANNERS}_`)) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('Product cache cleared successfully');
  } catch (error) {
    console.error('Error clearing product cache:', error);
    }
  }
}
export default StorageService;
