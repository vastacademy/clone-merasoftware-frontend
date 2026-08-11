// productDB.js
const initProductDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ProductDatabase", 1);
  
      request.onerror = (event) => {
        reject("Database error: " + event.target.error);
      };
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for products
        if (!db.objectStoreNames.contains("products")) {
          const productStore = db.createObjectStore("products", { keyPath: "id" });
          // Indexes for searching
          productStore.createIndex("category", "category", { unique: false });
          productStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
        }
      };
    });
  };
  
  // Cache product details
  const cacheProductDetails = async (productId, productData) => {
    const db = await initProductDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("products", "readwrite");
      const store = transaction.objectStore("products");
      
      const item = {
        id: productId,
        ...productData,
        lastUpdated: new Date().toISOString()
      };
  
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };
  
  // Get cached product details
  const getCachedProduct = async (productId) => {
    const db = await initProductDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("products", "readonly");
      const store = transaction.objectStore("products");
      const request = store.get(productId);
  
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };
  
  // Check if cache is stale (older than 1 hour)
  const isCacheStale = (lastUpdated) => {
    if (!lastUpdated) return true;
    const staleTime = 60 * 60 * 1000; // 1 hour in milliseconds
    const lastUpdateTime = new Date(lastUpdated).getTime();
    return Date.now() - lastUpdateTime > staleTime;
  };
  
  // Clear old cache entries
  const clearOldCache = async () => {
    const db = await initProductDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("products", "readwrite");
      const store = transaction.objectStore("products");
      const index = store.index("lastUpdated");
      
      const hour24Ago = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const range = IDBKeyRange.upperBound(hour24Ago);
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  };
  
  export { 
    initProductDB, 
    cacheProductDetails, 
    getCachedProduct, 
    isCacheStale,
    clearOldCache 
  };