import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCheckmarkCircleSharp } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import SummaryApi from '../common';

const CartPopup = ({ isOpen, onClose, product }) => {
  const navigate = useNavigate();
  const [cartProducts, setCartProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCartProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.addToCartProductView.url, {
        method: SummaryApi.addToCartProductView.method,
        credentials: 'include',
        headers: {
          "content-type": 'application/json'
        }
      });
     
      const data = await response.json();
      if (data.success && data.data) {
        setCartProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching cart products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCartProducts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoToCart = () => {
    navigate('/cart');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[55]"> {/* Changed to full screen fixed with higher z-index */}
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
     
      {/* Popup Content */}
      <div className="fixed bottom-[140px] left-0 right-0 bg-white rounded-t-lg mx-auto max-w-md"> {/* Positioned above buttons */}
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
        >
          <IoMdClose size={24} />
        </button>

        {/* Success Message */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <IoCheckmarkCircleSharp className="text-green-500 text-2xl" />
            <span className="font-medium text-green-600">
              Hooray! 1 item added to the cart
            </span>
          </div>
        </div>

        {/* Products List */}
        <div className="max-h-64 overflow-y-auto">
          {/* Latest added product first */}
          {product && (
            <div className="p-4 flex items-center gap-3 border-b bg-blue-50">
              <img
                src={product.serviceImage[0]}
                alt={product.serviceName}
                className="w-16 h-16 object-contain bg-gray-50 rounded"
              />
              <div>
                <p className="font-medium text-sm">{product.serviceName}</p>
                <p className="text-gray-700 mt-1">₹{product.sellingPrice?.toLocaleString()}</p>
              </div>
            </div>
          )}
         
          {/* Other cart products */}
          {!loading && cartProducts
            .filter(item => item.productId._id !== product?._id)
            .map((item) => (
              <div
                key={item._id}
                className="p-4 flex items-center gap-3 border-b"
              >
                <img
                  src={item.productId.serviceImage[0]}
                  alt={item.productId.serviceName}
                  className="w-16 h-16 object-contain bg-gray-50 rounded"
                />
                <div>
                  <p className="font-medium text-sm">{item.productId.serviceName}</p>
                  <p className="text-gray-700 mt-1">₹{item.productId.sellingPrice?.toLocaleString()}</p>
                </div>
              </div>
            ))}
        </div>

        {/* Go to Cart Button */}
        <div className="p-4">
          <button
            onClick={handleGoToCart}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
          >
            Go to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPopup;