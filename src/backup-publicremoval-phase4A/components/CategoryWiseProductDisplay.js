import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Context from '../context';
import displayINRCurrency from '../helpers/displayCurrency';
import addToCart from '../helpers/addToCart';
import scrollTop from '../helpers/scrollTop';
import fetchCategoryWiseProduct from '../helpers/fetchCategoryWiseProduct';

const CategoryWiseProductDisplay = ({category, heading}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadingList = new Array(8).fill(null);
    const { fetchUserAddToCart } = useContext(Context);

    const handleAddToCart = async (e, id) => {
        await addToCart(e, id);
        fetchUserAddToCart();
    };

    const fetchData = async() => {
        setLoading(true);
        const categoryProduct = await fetchCategoryWiseProduct(category);
        setLoading(false);
        setData(categoryProduct?.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    loadingList.map((_, index) => (
                        <div key={`loading-${index}`} className="bg-white rounded-lg shadow-md p-4">
                            <div className="h-48 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-8 bg-gray-200 rounded animate-pulse mt-4"></div>
                            </div>
                        </div>
                    ))
                ) : (
                    data.map((product) => (
                        <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <Link to={"/product/"+product?._id} onClick={scrollTop}>
                                <div className="p-4">
                                    <div className="h-48 bg-gray-50 rounded-lg p-4 mb-4 overflow-hidden">
                                        <img 
                                            src={product?.serviceImage[0]} 
                                            className="w-full h-[200%] object-cover object-top mix-blend-multiply"
                                            alt={product?.serviceName}
                                        />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2 line-clamp-1">
                                        {product?.serviceName}
                                    </h3>
                                    
                                    <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                    {displayINRCurrency(product?.sellingPrice)}
                                </span>
                                <div className="ml-1 flex items-center gap-2">
                                    <span className="text-gray-400 text-sm line-through">
                                        {displayINRCurrency(product?.price)}
                                    </span>
                                    <span className="text-green-600 text-sm">
                                    {Math.round(((product.price - product.sellingPrice) / product.price) * 100)}% OFF
                                    </span>
                                </div>
                            </div>
                                        
                                        <div className="space-y-1">
                                            <ul className="space-y-1 text-xs">
                                            {product?.packageIncludes?.slice(0, 2).map((detail, idx) => (
                                                <li key={idx} className="flex items-center gap-2 capitalize line-clamp-1 overflow-hidden">
                                                    <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0"></span>
                                                    <span className="truncate">{detail}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            
                            <div className="p-4 pt-0">
                                <button 
                                    onClick={(e) => handleAddToCart(e, product?._id)}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CategoryWiseProductDisplay;