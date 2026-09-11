import React, { useState } from 'react';

const ImagePopup = ({ images, selectedIndex, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-end p-4">
        <button 
          onClick={onClose}
          className="text-gray-600 text-lg font-medium"
        >
          CANCEL
        </button>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <img
          src={images[currentIndex]}
          alt={`Product view ${currentIndex + 1}`}
          className="max-h-full w-full object-contain"
        />
      </div>

      {/* Thumbnails */}
      <div className="p-4 border-t">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 ${
                index === currentIndex ? 'border-black' : 'border-transparent'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImagePopup;