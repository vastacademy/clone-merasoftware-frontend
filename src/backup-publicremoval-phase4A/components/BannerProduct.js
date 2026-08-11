import React, { useEffect, useState} from 'react';
import { FaAngleRight, FaAngleLeft } from "react-icons/fa6";
import SummaryApi from '../common';
import { useOnlineStatus } from '../App';
import StorageService from '../utils/storageService';

const BannerProduct = ({ serviceName = "home" }) => {
    const [currentImage, setCurrentImage] = useState(0);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const { isOnline, isInitialized } = useOnlineStatus();
    
    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    useEffect(() => {
        const loadBanners = async () => {
            if (!isInitialized) return;

            try {
                setLoading(true);
                
                // First check localStorage
                const cachedBanners = StorageService.getProductBanners(serviceName);
                if (cachedBanners) {
                    const filteredBanners = cachedBanners.filter(banner => 
                        banner.position === serviceName && banner.isActive
                    );
                    setBanners(filteredBanners.sort((a, b) => a.order - b.order));
                    setLoading(false);
                }

                // If online, fetch fresh data
                if (isOnline) {
                    const response = await fetch(SummaryApi.allBanner.url);
                    const data = await response.json();
                    
                    if (data.success) {
                        // Store in localStorage
                        StorageService.setProductBanners(serviceName, data.data);
                        
                        const filteredBanners = data.data.filter(banner => 
                            banner.position === serviceName && banner.isActive
                        );
                        setBanners(filteredBanners.sort((a, b) => a.order - b.order));
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBanners();
    }, [serviceName, isInitialized, isOnline]);

    // useEffect(() => {
    //     fetchBanners();
    // }, [serviceName]);

    const nextImage = () => {
        if (banners.length - 1 > currentImage) {
            setCurrentImage(prev => prev + 1);
        }
    };

    const prevImage = () => {
        if (currentImage !== 0) {
            setCurrentImage(prev => prev - 1);
        }
    };

    // Touch event handlers
    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentImage < banners.length - 1) {
            nextImage();
        } else if (isRightSwipe && currentImage > 0) {
            prevImage();
        }
    };

    // Auto slide effect
    useEffect(() => {
        if (banners.length === 0) return;

        const currentBanner = banners[currentImage];
        const slideDuration = (currentBanner?.duration || 5) * 1000;
    
        const interval = setInterval(() => {
            if (banners.length - 1 > currentImage) {
                setCurrentImage(prev => prev + 1);
            } else {
                setCurrentImage(0);
            }
        }, slideDuration);
        
        return () => clearInterval(interval);
    }, [currentImage, banners]);

    if (loading) {
        return (
            <div className='container mx-auto px-4 md:mt-5 rounded'>
                <div className='h-40 md:h-[400px] w-full bg-slate-200 animate-pulse'></div>
            </div>
        );
    }

    if (banners.length === 0) {
        return null;
    }
    const handleBannerClick = (banner) => {
        console.log('Banner clicked:', banner);
        if (banner.targetUrl) {
            window.open(banner.targetUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className='container mx-auto md:px-14 px-4 md:mt-5 rounded'>
            <div className='h-40 md:h-auto w-full bg-slate-200 relative rounded-lg shadow-lg'>
                <div className='absolute z-10 h-full w-full md:flex items-center hidden'>
                    {/* <div className='flex justify-between w-full text-2xl'>
                        <button onClick={prevImage} className='bg-white shadow-md rounded-full p-1'><FaAngleLeft /></button>
                        <button onClick={nextImage} className='bg-white shadow-md rounded-full p-1'><FaAngleRight /></button>
                    </div> */}
                </div>
                {/* desktop and tablet version */}
                <div className='hidden md:flex h-full w-full overflow-hidden'>
                    {banners.map((banner) => (
                        <div className='w-full h-full min-h-full min-w-full cursor-pointer transition-all' 
                             key={banner._id} 
                             onClick={() => handleBannerClick(banner)}
                             style={{ transform: `translateX(-${currentImage * 100}%)` }}>
                            <img src={banner.images[0]} className='w-full h-full object-cover' alt="Banner" />
                        </div>
                    ))}
                </div>
                {/* mobile version with touch events */}
                <div 
                    className='flex h-full w-full overflow-hidden md:hidden rounded-lg'
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {banners.map((banner) => (
                        <div className='w-full h-full min-h-full min-w-full cursor-pointer transition-all' 
                             key={banner._id} 
                             onClick={() => handleBannerClick(banner)}
                             style={{ transform: `translateX(-${currentImage * 100}%)` }}>
                            <img src={banner.images[0]} className='rounded-2xl w-full h-full object-cover' alt="Banner" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Slider Indicators */}
            <div className="flex justify-center mt-3 gap-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            currentImage === index ? 'bg-blue-500 w-4' : 'bg-gray-300'
                        }`}
                        onClick={() => setCurrentImage(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default BannerProduct;