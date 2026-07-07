import React, { useEffect, useState } from 'react';
import { CgClose } from "react-icons/cg";
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import uploadImage from '../helpers/uploadImage';
import DisplayImage from './DisplayImage';
import SummaryApi from '../common';
import { toast } from 'sonner';

const UploadBanner = ({ onClose, fetchData }) => {
    const [data, setData] = useState({
        serviceName: '', 
        position: '',
        images: [],
        isActive: true,
        displayOrder: 0,
        duration: 5,
        targetUrl: '',
    });

    const [availableOrders, setAvailableOrders] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [openFullScreenImage, setOpenFullScreenImage] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState("");

    // Fetch existing orders for selected position
    useEffect(() => {
        if (data.position) {
            fetchExistingOrders();
        }
    }, [data.position]);

    const fetchExistingOrders = async () => {
        try {
            const response = await fetch(SummaryApi.allBanner.url);
            const responseData = await response.json();
            if (responseData.success && responseData.data) {
                const existingOrders = responseData.data
                    .filter(banner => banner.position === data.position)
                    .map(banner => banner.displayOrder);
                setAvailableOrders(existingOrders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const handleOnChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                    type === 'number' ? Number(value) || 0 : value
        }));
    };

    const handleUploadBanner = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size should not exceed 2MB.");
            return;
        }

        setUploading(true);

        try {
            const uploadImageCloudinary = await uploadImage(file);
            setData((prev) => ({
                ...prev,
                images: [...prev.images, uploadImageCloudinary.url],
            }));
            toast.success("Image uploaded successfully.");
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Error uploading image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBannerImage = (index) => {
        const newImages = [...data.images];
        newImages.splice(index, 1);
        setData((prev) => ({
            ...prev,
            images: newImages,
        }));
        toast.info("Image removed.");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (data.images.length === 0) {
            toast.error("Please upload at least one banner image.");
            return;
        }
        if (!data.serviceName.trim()) {    // Validate serviceName
            toast.error("Service name is required.");
            return;
        }
        if (!data.position) {
            toast.error("Position is required.");
            return;
        }
        if (availableOrders.includes(data.displayOrder)) {
            toast.error("This display order is already taken for the selected position.");
            return;
        }
        if (data.targetUrl && !isValidUrl(data.targetUrl)) {
            toast.error("Please enter a valid URL");
            return;
        }
    
        try {
            const bannerData = {
                images: data.images,
                serviceName: data.serviceName,   // Include serviceName in API request
                position: data.position,
                displayOrder: data.displayOrder,
                isActive: data.isActive,
                duration: data.serviceName === 'home' ? data.duration : undefined,
                targetUrl: data.targetUrl.trim()
            };
    
            const response = await fetch(SummaryApi.uploadBanner.url, {
                method: SummaryApi.uploadBanner.method,
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bannerData),
            });
            
            const responseData = await response.json();
            if (responseData.success) {
                toast.success(responseData.message);
                onClose();
                fetchData?.();
            } else {
                toast.error(responseData.message || "Error uploading banner.");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error uploading banner. Please try again.");
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
        className="fixed w-full h-full z-50 bg-slate-200 bg-opacity-40 top-0 left-0 flex justify-center items-center"
        onClick={handleBackgroundClick}
        >
            <div className="bg-white p-4 rounded w-full max-w-2xl h-full max-h-[75%] overflow-hidden">
                <div className="flex justify-between items-center pb-3">
                    <h2 className="font-bold text-lg">Upload Banner</h2>
                    <div className="text-2xl hover:text-red-600 cursor-pointer" onClick={onClose}>
                        <CgClose />
                    </div>
                </div>

                <form
                    className="grid p-4 gap-4 overflow-y-scroll h-full pb-5"
                    onSubmit={handleSubmit}
                >
                    {/* Service Name Input */}
                    <div>
                        <label htmlFor="serviceName" className="block mb-2">Service Name:</label>
                        <select
                            id="serviceName"
                            name="serviceName"
                            value={data.serviceName}
                            onChange={handleOnChange}
                            className="w-full p-2 border rounded bg-slate-50"
                        >
                         <option value="">Select Service Name</option>
                            <option value="home">Home Page</option>
                            <option value="home_second_banner">Home Page Second Banner</option>
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

                     {/* Position Selection */}
                     <div>
                        <label htmlFor="position" className="block mb-2">Position:</label>
                        <select
                            id="position"
                            name="position"
                            value={data.position}
                            onChange={handleOnChange}
                            className="w-full p-2 border rounded bg-slate-50"
                        >
                            <option value="">Select Position</option>
                            <option value="home">Home Page</option>
                            <option value="home_second_banner">Home Page Second Banner</option>
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
                    

                     {/* Duration Input - Only show for home page service */}
                     {data.serviceName === 'home' && (
                            <div>
                                <label htmlFor="duration" className="block mb-2">
                                    Slide Duration (seconds):
                                </label>
                                <input
                                    type="number"
                                    id="duration"
                                    name="duration"
                                    value={data.duration || 5}  // Default 8 seconds
                                    onChange={handleOnChange}
                                    className="w-full p-2 border rounded bg-slate-50"
                                    min="1"
                                    max="30"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Enter duration in seconds for how long each banner should display
                                </p>
                            </div>
                        )}

                     {/* Display Order Input */}
                     <div>
                        <label htmlFor="displayOrder" className="block mb-2">
                            Display Order:
                        </label>
                        <input
                            type="number"
                            id="displayOrder"
                            name="displayOrder"
                            value={data.displayOrder}
                            onChange={handleOnChange}
                            className="w-full p-2 border rounded bg-slate-50"
                            min="0"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Enter 0 for top banner, or number (1, 2, 3...) to show after that many cards
                        </p>
                        {availableOrders.length > 0 && (
                            <p className="text-sm text-red-500 mt-1">
                                Already used orders: {availableOrders.sort((a,b) => a-b).join(', ')}
                            </p>
                        )}
                    </div>

                    {/* Banner Images Upload */}
                    <div>
                        <label className="block mb-2">Banner Images:</label>
                        <label htmlFor="uploadImageInput">
                            <div
                                className={`p-2 bg-slate-100 border rounded h-32 w-full flex justify-center items-center cursor-pointer ${
                                    uploading && "opacity-50 pointer-events-none"
                                }`}
                            >
                                <div className="text-slate-500 flex justify-center items-center flex-col gap-2">
                                    <span className="text-4xl">
                                        <FaCloudUploadAlt />
                                    </span>
                                    <p className="text-sm">
                                        {uploading ? "Uploading..." : "Upload Banner Images"}
                                    </p>
                                    <input
                                        type="file"
                                        id="uploadImageInput"
                                        className="hidden"
                                        onChange={handleUploadBanner}
                                        disabled={uploading}
                                    />
                                </div>
                            </div>
                        </label>

                        {/* Preview Images */}
                        <div className="mt-2">
                            {data.images.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {data.images.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={image}
                                                alt={`Banner ${index + 1}`}
                                                className="w-20 h-20 object-cover border cursor-pointer"
                                                onClick={() => {
                                                    setFullScreenImage(image);
                                                    setOpenFullScreenImage(true);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hidden group-hover:block"
                                                onClick={() => handleDeleteBannerImage(index)}
                                            >
                                                <MdDelete size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-red-500 text-sm mt-1">
                                    * Please upload at least one banner image
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                    <label htmlFor="targetUrl" className="block mb-2">Target URL (Optional):</label>
                    <input
                        type="url"
                        id="targetUrl"
                        name="targetUrl"
                        value={data.targetUrl}
                        onChange={handleOnChange}
                        placeholder="https://example.com"
                        className="w-full p-2 border rounded bg-slate-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Enter the URL where users should be directed when clicking the banner
                    </p>
                </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={data.isActive}
                            onChange={handleOnChange}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isActive">Active Banner</label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={data.images.length === 0 || uploading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                        Upload Banner
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

export default UploadBanner;
