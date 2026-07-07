import React, { useState, useEffect } from 'react';
import { CgClose } from "react-icons/cg";
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import uploadImage from '../helpers/uploadImage';
import DisplayImage from './DisplayImage';
import SummaryApi from '../common';
import { toast } from 'sonner';

const AdminEditBanner = ({
    onClose,
    bannerData,
    fetchData
}) => {
    // Initialize state with bannerData
    const [data, setData] = useState(bannerData || {
        images: [],
        displayOrder: 0,
        isActive: true,
        serviceName: '',
        position: '',
        duration: 5,
        targetUrl: ''
    });

    const [existingOrders, setExistingOrders] = useState([]);

    // Fetch existing orders for the current position
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch(SummaryApi.allBanner.url);
                const responseData = await response.json();
                if (responseData.success && responseData.data) {
                    const orders = responseData.data
                        .filter(banner => 
                            banner.position === data.position && 
                            banner._id !== data._id
                        )
                        .map(banner => banner.displayOrder);
                    setExistingOrders(orders);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };

        if (data.position) {
            fetchOrders();
        }
    }, [data.position, data._id]);

    // Update state if bannerData changes
    useEffect(() => {
        if (bannerData) {
            setData(bannerData);
        }
    }, [bannerData]);

    const [openFullScreenImage, setOpenFullScreenImage] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState("");

    const handleOnChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                    type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleUploadImage = async (e) => {
        const file = e.target.files[0];
        try {
            const uploadImageCloudinary = await uploadImage(file);
            setData((prev) => ({
                ...prev,
                images: [...prev.images, uploadImageCloudinary.url]
            }));
        } catch (error) {
            toast.error("Error uploading image");
            console.error("Error uploading image:", error);
        }
    };

    const handleDeleteImage = (index) => {
        setData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!data._id) {
            toast.error("Banner ID not found");
            return;
        }

        if (!data.serviceName.trim()) {
            toast.error("Service name is required");
            return;
        }

        if (!data.position) {
            toast.error("Position is required");
            return;
        }

        if (existingOrders.includes(data.displayOrder)) {
            toast.error("This display order is already taken for the selected position");
            return;
        }

         // Validate URL if provided
         if (data.targetUrl && !isValidUrl(data.targetUrl)) {
            toast.error("Please enter a valid URL");
            return;
        }

        try {
            const response = await fetch(`${SummaryApi.updateBanner.url}/${data._id}`, {
                method: SummaryApi.updateBanner.method,
                credentials: 'include',
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    ...data,
                    order: undefined,  // Remove old order field
                    duration: data.position === 'home' ? data.duration : undefined,
                    targetUrl: data.targetUrl?.trim() 
                })
            });

            const responseData = await response.json();

            if (responseData.success) {
                toast.success(responseData.message);
                onClose();
                if (typeof fetchData === 'function') {
                    await fetchData();
                }
                return;
            }

            toast.error(responseData.message || "Failed to update banner");

        } catch (error) {
            console.error("API Error:", error);
            toast.error("Something went wrong!");
        }
    };

    // URL validation helper
    const isValidUrl = (url) => {
        if (!url) return true; // Empty URL is valid (optional field)
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

     // Close popup on Esc key press
        useEffect(() => {
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }, [onClose]);
    
        // Close popup on background click
        const handleBackgroundClick = (e) => {
            if (e.target.id === 'popup-background') {
                onClose();
            }
        };

    return (
        <div 
        id="popup-background"
        className='fixed w-full h-full z-50 bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center'
         onClick={handleBackgroundClick}>
            <div className='bg-white p-4 rounded w-full max-w-2xl h-full max-h-[75%] overflow-hidden'>
                <div className='flex justify-between items-center pb-3'>
                    <h2 className='font-bold text-lg'>Edit Banner</h2>
                    <div className='text-2xl hover:text-red-600 cursor-pointer' onClick={onClose}>
                        <CgClose />
                    </div>
                </div>

                <form className='grid p-4 gap-4 overflow-y-scroll h-full pb-5' onSubmit={handleSubmit}>

                {/* Service Name Input */}
                <div>
                        <label htmlFor='serviceName'>Service Name:</label>
                        <input
                            type='text'
                            id='serviceName'
                            name='serviceName'
                            value={data.serviceName || ''}
                            onChange={handleOnChange}
                            className='w-full p-2 bg-slate-100 border rounded'
                            placeholder="Enter service name"
                        />
                    </div>

                     {/* Position Selection */}
                     <div>
                        <label htmlFor='position'>Position:</label>
                        <select
                            id='position'
                            name='position'
                            value={data.position || ''}
                            onChange={handleOnChange}
                            className='w-full p-2 bg-slate-100 border rounded'
                        >
                            <option value="">Select Position</option>
                            <option value="home">Home Page</option>
                            <option value="static_websites">Static Websites</option>
                            <option value="standard_websites">Standard Websites</option>
                            <option value="dynamic_websites">Dynamic Websites</option>
                            <option value="website_updates">Website Updates</option>
                            <option value="mobile_apps">Mobile Apps</option>
                            <option value="web_applications">Web Applications</option>
                            <option value="app_update">App Update</option>
                            <option value="feature_upgrades">Feature Upgrades</option>
                        </select>
                    </div>

                        {/* Duration Input - Only for home page */}
                        {data.position === 'home' && (
                            <div>
                                <label htmlFor="duration">Slide Duration (seconds):</label>
                                <input
                                    type="number"
                                    id="duration"
                                    name="duration"
                                    value={data.duration || 5}
                                    onChange={handleOnChange}
                                    className="w-full p-2 bg-slate-100 border rounded"
                                    min="1"
                                    max="30"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Set how long each banner should display (in seconds)
                                </p>
                            </div>
                        )}

                     {/* Display Order Input */}
                    <div>
                        <label htmlFor='displayOrder'>Display Order:</label>
                        <input
                            type='number'
                            id='displayOrder'
                            name='displayOrder'
                            value={data.displayOrder || 0}
                            onChange={handleOnChange}
                            className='w-full p-2 bg-slate-100 border rounded'
                            min="0"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Enter 0 for top banner, or number (1, 2, 3...) to show after that many cards
                        </p>
                        {existingOrders.length > 0 && (
                            <p className="text-sm text-red-500 mt-1">
                                Already used orders: {existingOrders.sort((a,b) => a-b).join(', ')}
                            </p>
                        )}
                    </div>

                    {/* Active Status */}
                    <div className='flex items-center gap-2'>
                        <input
                            type='checkbox'
                            id='isActive'
                            name='isActive'
                            checked={data.isActive}
                            onChange={handleOnChange}
                            className='w-4 h-4'
                        />
                        <label htmlFor='isActive'>Active Banner</label>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className='block mb-2'>Banner Images:</label>
                        <label htmlFor="uploadImageInput">
                        <div className='p-2 bg-slate-100 border rounded h-32 w-full flex justify-center items-center cursor-pointer'>
                            <div className='text-slate-500 flex justify-center items-center flex-col gap-2'>
                                <span className='text-4xl'><FaCloudUploadAlt /></span>
                                <p className='text-sm'>Upload Banner Image</p>
                                <input type='file' id='uploadImageInput' className='hidden'
                                 onChange={handleUploadImage} />
                            </div>
                        </div>
                        </label>

                        {/* Image Preview */}
                        <div className='mt-2'>
                            {data.images.length > 0 ? (
                                <div className='flex flex-wrap gap-2'>
                                    {data.images.map((image, index) => (
                                        <div key={index} className='relative group'>
                                            <img
                                                src={image}
                                                alt={`Banner ${index + 1}`}
                                                className='w-20 h-20 object-cover border cursor-pointer'
                                                onClick={() => {
                                                    setFullScreenImage(image);
                                                    setOpenFullScreenImage(true);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className='absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hidden group-hover:block'
                                                onClick={() => handleDeleteImage(index)}
                                            >
                                                <MdDelete size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-red-500 text-sm mt-1'>* Please upload at least one banner image</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="targetUrl" className="block mb-2">Target URL (Optional):</label>
                        <input
                            type="url"
                            id="targetUrl"
                            name="targetUrl"
                            value={data.targetUrl || ''}
                            onChange={handleOnChange}
                            placeholder="https://example.com"
                            className="w-full p-2 bg-slate-100 border rounded"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Enter the URL where users should be directed when clicking the banner
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={data.images.length === 0}
                        className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 mt-4'
                    >
                        Update Banner
                    </button>
                </form>
            </div>

            {/* Full Screen Image Preview */}
            {openFullScreenImage && (
                <DisplayImage 
                    onClose={() => setOpenFullScreenImage(false)} 
                    imgUrl={fullScreenImage}
                />
            )}
        </div>
    );
};

export default AdminEditBanner;