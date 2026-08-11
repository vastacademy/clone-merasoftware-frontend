// src/hooks/useDataFetching.js
import { useState, useEffect } from 'react';
import SummaryApi from '../common';

export const useDataFetching = () => {
  const [homeData, setHomeData] = useState({
    categories: [],
    banners: [],
    products: {
      standard_websites: [],
      dynamic_websites: [],
      web_applications: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to safely fetch and parse JSON
  const safeFetch = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text(); // First get text
      try {
        const data = JSON.parse(text); // Then try to parse it
        return data;
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error('Invalid JSON response');
      }
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Categories
      const categoriesData = await safeFetch(SummaryApi.allCategory.url);
      if (categoriesData?.success) {
        setHomeData(prev => ({
          ...prev,
          categories: categoriesData.data || []
        }));
      }

      // Banners
      const bannersData = await safeFetch(SummaryApi.allBanner.url);
      if (bannersData?.success) {
        setHomeData(prev => ({
          ...prev,
          banners: bannersData.data || []
        }));
      }

      // Products
      const productTypes = ['standard_websites', 'dynamic_websites', 'web_applications'];
      
      for (const type of productTypes) {
        try {
          const productData = await safeFetch(
            `${SummaryApi.categoryWiseProduct.url}?category=${type}`
          );
          
          if (productData?.success) {
            setHomeData(prev => ({
              ...prev,
              products: {
                ...prev.products,
                [type]: productData.data || []
              }
            }));
          }
        } catch (productError) {
          console.error(`Error fetching ${type} products:`, productError);
          // Continue with other requests even if one fails
        }
      }

    } catch (err) {
      console.error('Error in fetchAllData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Add a debug log to check the actual API URLs
  useEffect(() => {
    console.log('API URLs:', {
      categories: SummaryApi.allCategory.url,
      banners: SummaryApi.allBanner.url,
      products: SummaryApi.categoryWiseProduct.url
    });
  }, []);

  return { 
    homeData, 
    loading, 
    error, 
    refetch: fetchAllData 
  };
};