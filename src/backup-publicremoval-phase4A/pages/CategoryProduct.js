import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import VerticalCard from '../components/VerticalCard'
import SummaryApi from '../common'
import SingleBanner from '../components/SingleBanner'
import StorageService from '../utils/storageService'

const CategoryProduct = () => {
    const [data, setData] = useState([])
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const location = useLocation()
    const dataRef = useRef([]);
    const urlSearch = new URLSearchParams(location.search)
    const urlCategoryListinArray = urlSearch.getAll("category")
    const urlCategoryListObject = {}
    urlCategoryListinArray.forEach(el =>{
      urlCategoryListObject[el] = true
    })
    const [selectCategory, setSelectCategory] = useState(urlCategoryListObject)
    const [filterCategoryList, setFilterCategoryList] = useState([])
    const [sortBy, setSortBy] = useState("")
    const [isDataFromCache, setIsDataFromCache] = useState(false)
    
    // Helper function to get category key for storage
    const getCategoryKey = (categories) => {
      return categories.sort().join('_');
    };
    
    // Background refresh of data
    const fetchFreshDataInBackground = async (categoryKey) => {
      if (filterCategoryList.length === 0) return;
      
      try {
        const response = await fetch(SummaryApi.filterProduct.url, {
          method: SummaryApi.filterProduct.method,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            category: filterCategoryList
          })
        });
        const dataResponse = await response.json();
        const freshData = dataResponse?.data || [];
        
        // Only update if data is different
        if (JSON.stringify(freshData) !== JSON.stringify(data) && freshData.length > 0) {
          // console.log('Updating data from background fetch');
          
          // Apply current sort if any
          if(sortBy === 'asc') {
            freshData.sort((a, b) => a.sellingPrice - b.sellingPrice);
          } else if(sortBy === 'dsc') {
            freshData.sort((a, b) => b.sellingPrice - a.sellingPrice);
          }
          dataRef.current = freshData; 
          setData(freshData);
          
          // Store the fresh data in localStorage
          StorageService.setProductsData(categoryKey, freshData);
        }
      } catch (error) {
        console.error('Error refreshing data in background:', error);
      }
    };

    // Update ref when data changes
useEffect(() => {
  dataRef.current = data;
}, [data]);

    useEffect(() => {
      let isSubscribed = true;
      
      const fetchData = async () => {
        if (filterCategoryList.length === 0) return;
        
        const categoryKey = getCategoryKey(filterCategoryList);
        
        try {
          setLoading(true);
          
          // First try to get data from localStorage
          const cachedData = StorageService.getProductsData(categoryKey);
          
          if (cachedData && cachedData.length > 0) {
            // console.log('Using cached product data');
            
            // Apply current sort
            let sortedData = [...cachedData];
            if(sortBy === 'asc') {
              sortedData.sort((a, b) => a.sellingPrice - b.sellingPrice);
            } else if(sortBy === 'dsc') {
              sortedData.sort((a, b) => b.sellingPrice - a.sellingPrice);
            }
            
            if (isSubscribed) {
              setData(sortedData);
              setIsDataFromCache(true);
              setLoading(false);
            }
            
            // Refresh data in background after a short delay
            setTimeout(() => {
              fetchFreshDataInBackground(categoryKey);
            }, 1000);
            
            return;
          }
          
          // If no cached data or cache invalid, fetch from API
          const response = await fetch(SummaryApi.filterProduct.url, {
            method: SummaryApi.filterProduct.method,
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              category: filterCategoryList
            })
          });
    
          const dataResponse = await response.json();
            if (isSubscribed) {
            let responseData = dataResponse?.data || [];
            
            // Filter out hidden products
            responseData = responseData.filter(product => !product.isHidden);
            
            // Apply sort if needed
            if(sortBy === 'asc') {
              responseData.sort((a, b) => a.sellingPrice - b.sellingPrice);
            } else if(sortBy === 'dsc') {
              responseData.sort((a, b) => b.sellingPrice - a.sellingPrice);
            }
            
            setData(responseData);
            
            // Store fetched data in localStorage
            if (responseData.length > 0) {
              StorageService.setProductsData(categoryKey, responseData);
              // Update cache timestamp
              StorageService.updateCacheTimestamp(categoryKey);
            }
            
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching product data:', error);
          if (isSubscribed) {
            setLoading(false);
          }
        }
      };
    
      fetchData();
    
      return () => {
        isSubscribed = false;
      };
    }, [filterCategoryList, sortBy]);

    const handleSelectCategory = (e) => {
      const { value, checked } = e.target

      setSelectCategory((prev) => {
        return {
          ...prev,
          [value]: checked
        }
      })
    }

    useEffect(() => {
      const arrayOfCategory = Object.keys(selectCategory).map(categoryKeyName => {
        if(selectCategory[categoryKeyName]) {
          return categoryKeyName
        }
        return null
      }).filter(el => el)

      setFilterCategoryList(arrayOfCategory)

      // Format for url change when change on the checkbox
      const urlFormat = arrayOfCategory.map((el, index) => {
        if((arrayOfCategory.length - 1) === index) {
          return `category=${el}`
        }
        return `category=${el}&&`
      })
      navigate("/product-category?" + urlFormat.join(""), {replace: true})
    }, [selectCategory, navigate])
    
    const handleOnChangeSortBy = (e) => {
      const { value } = e.target;
      setSortBy(value);
      
      let sortedData = [...data];
      if(value === 'asc') {
        sortedData.sort((a,b) => a.sellingPrice - b.sellingPrice);
      } else if(value === 'dsc') {
        sortedData.sort((a,b) => b.sellingPrice - a.sellingPrice);
      }
      
      setData(sortedData);
      
      // If we got data from cache, also update the cache with sorted data
      if (isDataFromCache && filterCategoryList.length > 0) {
        const categoryKey = getCategoryKey(filterCategoryList);
        StorageService.setProductsData(categoryKey, sortedData); // Use sortedData, not data
      }
    }

    const generateServiceName = () => {
      // Check for each category and return the corresponding service name
      if (selectCategory["static_websites"]) {
        return "static_websites";
      }
      if (selectCategory["standard_websites"]) {
        return "standard_websites";
      }
      if (selectCategory["dynamic_websites"]) {
        return "dynamic_websites";
      }
      if (selectCategory["website_updates"]) {
        return "website_updates";
      }
      if (selectCategory["mobile_apps"]) {
        return "mobile_apps";
      }
      if (selectCategory["web_applications"]) {
        return "web_applications";
      }
      if (selectCategory["app_update"]) {
        return "app_update";
      }
      if (selectCategory["feature_upgrades"]) {
        return "feature_upgrades";
      }
    
      // Default case if no category is selected
      return "";
    }
    
    return (
      <div className='container mx-auto px-4'>
        {generateServiceName() ? (
  <SingleBanner
    serviceName={generateServiceName()}
    bannerType="top"
  />
) : null}
          
        <div>
          <div>
            {/* 
              Render VerticalCard even when data is empty but loading
              This allows VerticalCard to show loading state or cached data
            */}
            <VerticalCard 
              data={data} 
              loading={loading} 
              currentCategory={generateServiceName()}
            />
          </div>
        </div>
      </div>
    )
}

export default CategoryProduct  