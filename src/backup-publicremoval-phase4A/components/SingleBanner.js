import React, { useEffect, useState, useCallback } from 'react';
import SummaryApi from '../common';

const SingleBanner = ({ serviceName = null, bannerType = null }) => {
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBanner = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch(SummaryApi.allBanner.url);
            const data = await response.json();
            if (data.success) {
                const filteredBanner = data.data.find(
                    banner => banner.serviceName === serviceName &&
                             banner.bannerType === bannerType &&
                             banner.isActive
                );
                setBanner(filteredBanner);
            }
        } catch (error) {
            console.error("Error fetching banner:", error);
            setError("Failed to load banner");
        } finally {
            setLoading(false);
        }
    }, [serviceName, bannerType]);

    const handleBannerClick = () => {
        if (banner?.targetUrl) {
            window.open(banner.targetUrl, '_blank', 'noopener,noreferrer');
        }
    };

    useEffect(() => {
        if (serviceName && bannerType) {
            fetchBanner();
        }
    }, [serviceName, bannerType, fetchBanner]);

    if (loading) {
        return (
            <div className='w-full rounded'>
                <div className='h-40 w-full bg-slate-200 animate-pulse'></div>
            </div>
        );
    }

    if (error) {
        return null; // Or show error message if needed
    }

    if (!banner) {
        return null;
    }

    return (
        <div className='w-full rounded'>
            <img
                src={banner.images[0]}
                className='w-full h-auto object-cover cursor-pointer rounded'
                alt={banner.serviceName}
                loading="lazy"
                onClick={handleBannerClick}
            />
        </div>
    );
};

export default SingleBanner;