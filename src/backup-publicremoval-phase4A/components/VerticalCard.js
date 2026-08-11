import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SummaryApi from '../common';
import StorageService from '../utils/storageService';

const VerticalCard = ({ loading: initialLoading, data: initialData = [], currentCategory = '' }) => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    
    const loadingList = new Array(6).fill(null);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(initialLoading);
    const [data, setData] = useState([]);
    const [isDataFromCache, setIsDataFromCache] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortOption, setSortOption] = useState('price-low-high');
    // Store the current search string to detect changes
    const [currentSearch, setCurrentSearch] = useState(location.search);
    const [error, setError] = useState(null);

    // Format category name from URL format to display format
    const formatCategoryName = useCallback((categoryValue) => {
        return categoryValue.split('_').join(' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }, []);

    // Get unique categories from URL
    const uniqueCategories = useMemo(() => {
        const categoriesFromURL = queryParams.getAll('category');
        if (categoriesFromURL.length > 0) {
            const formattedCategories = categoriesFromURL.map(cat => formatCategoryName(cat));
            return ['All', ...formattedCategories];
        }
        return ['All'];
    }, [queryParams, formatCategoryName]);

    // Check if search params have changed
    useEffect(() => {
        // Only update if the search parameters have actually changed
        if (currentSearch !== location.search) {
            setCurrentSearch(location.search);
            setLoading(true);
            setActiveFilter('All'); // Reset filter on category change
            setError(null); // Clear any previous errors
            
            // Fetch products for the new category
            const fetchNewProducts = async () => {
                const categoriesFromURL = queryParams.getAll('category');
                if (!categoriesFromURL || categoriesFromURL.length === 0) {
                    setData([]);
                    setLoading(false);
                    return;
                }
                
                // Check cache first for the first category
                const firstCategory = categoriesFromURL[0];
                const cachedProducts = StorageService.getProductsData(firstCategory);
                
                if (cachedProducts && cachedProducts.length > 0) {
                    // console.log('Using cached product data for:', firstCategory);
                    setData(cachedProducts);
                    setIsDataFromCache(true);
                    setLoading(false);
                    return;
                }
                
                // Otherwise fetch from API
                try {
                    // Use the correct endpoint from SummaryApi
                    // Instead of looking for product_by_category, use categoryProduct
                    const apiUrl = SummaryApi.categoryProduct.url;
                    
                    // Format the query parameters
                    const queryString = categoriesFromURL.map(cat => `category=${cat}`).join('&');
                    
                    // console.log('Fetching products from:', `${apiUrl}?${queryString}`);
                    const response = await fetch(`${apiUrl}?${queryString}`);
                    const responseData = await response.json();
                    
            if (responseData.success && responseData.data) {
                // Filter out hidden products
                const visibleProducts = responseData.data.filter(product => !product.isHidden);
                StorageService.setProductsData(firstCategory, visibleProducts);
                setData(visibleProducts);
                setIsDataFromCache(false);
            } else {
                // Handle API success: false response
                setError(responseData.message || 'Failed to fetch products from server');
            }
                } catch (error) {
                    console.error("Error fetching products:", error);
                    setError('Failed to fetch products. Please try refreshing the page.');
                } finally {
                    setLoading(false);
                }
            };
            
            fetchNewProducts();
            
            // Also update banners for the new category
            const fetchNewBanners = async () => {
                const categoriesFromURL = queryParams.getAll('category');
                const currentUrlCategory = categoriesFromURL.length > 0 ? categoriesFromURL[0] : currentCategory;
                
                const cachedBanners = StorageService.getProductBanners(currentUrlCategory);
                
                if (cachedBanners) {
                    // console.log('Using cached banners data');
                    setBanners(cachedBanners);
                    return;
                }
                
                try {
                    // Use the correct banner endpoint
                    const response = await fetch(SummaryApi.allBanner.url);
                    const responseData = await response.json();
                    if (responseData.success && responseData.data) {
                        const categoryBanners = responseData.data.filter(banner => 
                            banner.isActive && 
                            banner.position === currentUrlCategory
                        );
                        
                        const groupedBanners = {};
                        categoryBanners.forEach(banner => {
                            if (!groupedBanners[banner.displayOrder]) {
                                groupedBanners[banner.displayOrder] = [];
                            }
                            groupedBanners[banner.displayOrder].push(banner);
                        });
                        
                        // Shuffle banners in groups where there are multiple banners
                        Object.keys(groupedBanners).forEach(order => {
                            if (groupedBanners[order].length > 1) {
                                const newArray = [...groupedBanners[order]];
                                for (let i = newArray.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
                                }
                                groupedBanners[order] = newArray;
                            }
                        });

                        setBanners(groupedBanners);
                        StorageService.setProductBanners(currentUrlCategory, groupedBanners);
                    }
                } catch (error) {
                    console.error("Error fetching banners:", error);
                }
            };
            
            fetchNewBanners();
        }
    }, [location.search, queryParams, currentCategory, currentSearch]);

    // Load initial data - only runs once on mount
    useEffect(() => {
        if (initialData && initialData.length > 0) {
            setData(initialData);
            setLoading(false);
        } else if (!data.length && !loading) {
            // Only fetch if we don't already have data and we're not already loading
            const categoriesFromURL = queryParams.getAll('category');
            if (categoriesFromURL.length > 0) {
                const firstCategory = categoriesFromURL[0];
                const cachedProducts = StorageService.getProductsData(firstCategory);
                
                if (cachedProducts && cachedProducts.length > 0) {
                    // console.log('Using cached products data');
                    setData(cachedProducts);
                    setIsDataFromCache(true);
                    setLoading(false);
                }
            }
        }
    }, [initialData]); // Only run on mount or initialData change

    // Setup banner rotation - only run once on mount
    useEffect(() => {
        // Set up banner rotation interval
        const intervalId = setInterval(() => {
            setBanners(prevBanners => {
                const newBanners = { ...prevBanners };
                Object.keys(newBanners).forEach(order => {
                    if (newBanners[order] && newBanners[order].length > 1) {
                        const newArray = [...newBanners[order]];
                        for (let i = newArray.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
                        }
                        newBanners[order] = newArray;
                    }
                });
                return newBanners;
            });
        }, 5000);

        return () => clearInterval(intervalId);
    }, []); // Only run once on mount

    // Apply filter and sort
    const filteredAndSortedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        let result = [...data];
        
        // First apply the category filter
        if (activeFilter !== 'All') {
            // Convert activeFilter back to URL format for comparison
            const activeFilterURLFormat = activeFilter.toLowerCase().split(' ').join('_');
            
            result = result.filter(product => 
                product.category && product.category.toLowerCase() === activeFilterURLFormat
            );
        }
        
        // Then apply sorting
        switch (sortOption) {
            case 'price-low-high':
                result.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
                break;
            case 'price-high-low':
                result.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
                break;
            case 'name-a-z':
                result.sort((a, b) => (a.serviceName || '').localeCompare(b.serviceName || ''));
                break;
            case 'name-z-a':
                result.sort((a, b) => (b.serviceName || '').localeCompare(a.serviceName || ''));
                break;
            default:
                // Keep default order
                break;
        }
        
        return result;
    }, [data, activeFilter, sortOption]);

    const getBannerForPosition = useCallback((index) => {
        if (index === -1 && banners['0'] && banners['0'].length > 0) {
            const randomImageIndex = Math.floor(Math.random() * banners['0'][0].images.length);
            return {
                ...banners['0'][0],
                currentImage: banners['0'][0].images[randomImageIndex]
            };
        }

        const orderKey = (index + 1).toString();
        if (banners[orderKey] && banners[orderKey].length > 0) {
            const randomImageIndex = Math.floor(Math.random() * banners[orderKey][0].images.length);
            return {
                ...banners[orderKey][0],
                currentImage: banners[orderKey][0].images[randomImageIndex]
            };
        }

        return null;
    }, [banners]);

    // Filter Button Component
    const FilterButton = ({ title, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${
                isActive 
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
        >
            {title}
        </button>
    );

    const getIconColor = (category) => {
        if (!category) return 'text-blue-500';
        
        const categoryLower = category.toLowerCase();
        if (categoryLower.includes('standard')) {
          return 'text-blue-500'; 
        } else if (categoryLower.includes('dynamic')) {
          return 'text-emerald-600'; 
        } else if (categoryLower.includes('app')) {
          return 'text-green-500'; 
        } else if (categoryLower.includes('update') || categoryLower.includes('upgrade')) {
          return 'text-amber-500'; 
        }
        return 'text-blue-500';
    };

    // Loading state
    if (loading && (!data || data.length === 0) && !isDataFromCache) {
        return (
            <div className="px-2 pb-4 mb-28">
                {/* Header and filter skeleton */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 animate-pulse">
                    <div className="flex space-x-2 mb-4 md:mb-0">
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        <div className="h-8 w-40 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-8 w-40 bg-gray-200 rounded"></div>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {loadingList.map((_, index) => (
                        <div key={index} className='w-full bg-white rounded-lg shadow-sm p-0 border border-gray-200'>
                            <div className='flex flex-col sm:flex-row'>
                                <div className='sm:w-2/5 bg-slate-200 h-40 animate-pulse'></div>
                                <div className='p-4 sm:w-3/5'>
                                    <div className='animate-pulse rounded-full bg-slate-200 h-6 w-3/4 mb-2'></div>
                                    <div className='animate-pulse rounded-full bg-slate-200 h-4 w-1/2 mb-4'></div>
                                    <div className='space-y-2'>
                                        <div className='animate-pulse rounded-full bg-slate-200 h-4 w-full'></div>
                                        <div className='animate-pulse rounded-full bg-slate-200 h-4 w-full'></div>
                                    </div>
                                    <div className='animate-pulse rounded-lg bg-slate-200 h-10 w-full mt-4'></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="px-2 pb-4 mb-28 mt-8">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                                <p className="mt-2">
                                    <button 
                                        onClick={() => window.location.reload()} 
                                        className="text-red-600 hover:text-red-800 font-medium underline"
                                    >
                                        Try refreshing the page
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Show filter UI even in error state */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div className="flex space-x-2 flex-wrap mb-4 md:mb-0">
                        {uniqueCategories.map(category => (
                            <FilterButton 
                                key={category}
                                title={category} 
                                isActive={activeFilter === category}
                                onClick={() => setActiveFilter(category)}
                            />
                        ))}
                    </div>
                    <div className="relative inline-block">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="default">Sort By</option>
                            <option value="price-low-high">Price: Low to High</option>
                            <option value="price-high-low">Price: High to Low</option>
                            <option value="name-a-z">Name: A to Z</option>
                            <option value="name-z-a">Name: Z to A</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Product card component - Horizontal style
    const ProductCard = ({ product }) => {
        // Display only first 4 features
        const displayFeatures = product?.packageIncludes?.slice(0, 4) || [];
        const hasMoreFeatures = product?.packageIncludes?.length > 4;
        
        const discount = product.price && product.sellingPrice 
            ? Math.round(((product.price - product.sellingPrice) / product.price) * 100)
            : 0;
        
        return (
            <Link to={"/product/"+product?._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-blue-200 flex flex-col sm:flex-row h-full">
                {/* Left Section */}
                <div className="px-4 py-4 pt-6 sm:w-[200px] bg-blue-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{product?.serviceName}</h3>
                    <p className="text-sm text-gray-500 mb-4 capitalize">{product?.category?.split('_').join(' ')}</p>
                    
                    {/* Price Section */}
                    <div className="mb-4">
                        <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-900">₹{(product?.sellingPrice || 15999).toLocaleString()}</span>
                            <span className="ml-2 text-sm text-gray-500 line-through">
                                ₹{(product?.price || 34000).toLocaleString()}
                            </span>
                        </div>
                        
                        {discount > 0 && (
                            <div className="mt-1">
                                <span className="text-sm font-medium text-green-600">
                                    Save {discount}% today
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Right Section */}
                <div className="px-4 pt-6 py-4 border-t sm:border-t-0 sm:border-l border-gray-200 sm:w-3/5">
                    <p className="text-sm font-medium text-gray-700 mb-3">Package Features:</p>
                    <ul className="text-sm space-y-2 mb-4">
                        {displayFeatures.map((feature, index) => (
                            <li key={index} className="flex items-center">
                                <svg className={`h-4 w-4 ${getIconColor(product?.category)} mr-2 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-600 capitalize">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    
                    {/* Show More button that redirects to product page */}
                    {hasMoreFeatures && (
                        <p className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors cursor-pointer">
                            Show More
                        </p>
                    )}
                </div>
            </Link>
        );
    };

    return (
        <div className="px-2 pb-4 mb-28 mt-8">
            {/* Header with filter buttons and sorting options */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                {/* Filter Buttons */}
                <div className="flex space-x-2 flex-wrap mb-4 md:mb-0">
                    {uniqueCategories.map(category => (
                        <FilterButton 
                            key={category}
                            title={category} 
                            isActive={activeFilter === category}
                            onClick={() => setActiveFilter(category)}
                        />
                    ))}
                </div>

                {/* Sorting Dropdown */}
                <div className="relative inline-block">
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="default">Sort By</option>
                        <option value="price-low-high">Price: Low to High</option>
                        <option value="price-high-low">Price: High to Low</option>
                        <option value="name-a-z">Name: A to Z</option>
                        <option value="name-z-a">Name: Z to A</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Show top banner */}
            {getBannerForPosition(-1) && getBannerForPosition(-1).currentImage ? (
                <div 
                    className={`h-auto w-full bg-slate-200 relative rounded-lg mb-6 ${getBannerForPosition(-1).targetUrl ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                        const banner = getBannerForPosition(-1);
                        if (banner.targetUrl) {
                            window.open(banner.targetUrl, '_blank', 'noopener,noreferrer');
                        }
                    }}
                >
                    <div className="hidden md:flex h-full w-full overflow-hidden">
                        <div className='w-full h-full min-h-full min-w-full'>
                            <img 
                                src={getBannerForPosition(-1).currentImage}
                                alt="Top Banner"
                                className="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="flex h-full w-full overflow-hidden md:hidden rounded-lg">
                        <div className='w-full h-full min-h-full min-w-full transition-all'>
                            <img 
                                src={getBannerForPosition(-1).currentImage}
                                alt="Top Banner"
                                className="w-full h-full object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            ) : null}

            {/* No results message */}
            {filteredAndSortedData.length === 0 && !loading && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No packages found for the selected filter.</p>
                </div>
            )}

            {/* Responsive grid for cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedData.map((product, index) => (
                    <React.Fragment key={product._id || index}>
                        <ProductCard product={product} />
                        
                        {/* Show banner after card if exists */}
                        {getBannerForPosition(index) && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <div 
                                    className={`h-auto w-full bg-slate-200 relative rounded-lg ${getBannerForPosition(index).targetUrl ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                        const banner = getBannerForPosition(index);
                                        if (banner.targetUrl) {
                                            window.open(banner.targetUrl, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                >
                                    {/* desktop version */}
                                    <div className="hidden md:flex h-full w-full overflow-hidden">
                                        <div className='w-full h-full min-h-full min-w-full'>
                                            <img 
                                                src={getBannerForPosition(index).currentImage}
                                                alt={`Banner after card ${index + 1}`}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    {/* mobile version */}
                                    <div className="flex h-full w-full overflow-hidden md:hidden rounded-lg">
                                        <div className='w-full h-full min-h-full min-w-full transition-all'>
                                            <img 
                                                src={getBannerForPosition(index).currentImage}
                                                alt={`Banner after card ${index + 1}`}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default VerticalCard;