import React, { useEffect, useState } from 'react'
import SummaryApi from '../common';

const HomeSecondBanner = () => {
    const [adImage, setAdImage] = useState("");

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const response = await fetch(SummaryApi.allBanner.url);
                const data = await response.json();
                if (data.success) {
                    // Filter for active advertisement banner
                    const adBanner = data.data.find(banner => 
                        banner.position === "home_second_banner" && banner.isActive
                    );
                    if (adBanner && adBanner.images.length > 0) {
                        setAdImage(adBanner.images[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching advertisement:", error);
            }
        };
        
        fetchAd();
    }, []);

    // Only render if there's an ad image
    if (!adImage) return null;

  return (
    <div className="container mx-auto px-4 py-6">
            <div className="w-full">
                <img 
                    src={adImage} 
                    alt="Advertisement"
                    className="w-full object-cover rounded-lg"
                />
            </div>
        </div>
  )
}

export default HomeSecondBanner
