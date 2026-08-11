import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IoCheckmarkCircleSharp } from "react-icons/io5";

const Success = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    // Redirect after 3 seconds
    const redirect = setTimeout(() => {
      navigate('/');
    }, 3000);

    // Cleanup
    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='bg-white max-w-md w-full mx-auto flex items-center justify-center flex-col p-8 m-2 rounded-lg shadow-lg'>
        <div className='mb-4 text-green-500'>
          <IoCheckmarkCircleSharp size={80} />
        </div>
        
        <p className='text-green-600 font-bold text-2xl mb-2'>Payment Successful!</p>
        <p className='text-gray-500 mb-4'>Redirecting in {countdown} seconds...</p>
        
        <div className='flex gap-3'>
          <Link 
            to={"/order"} 
            className='p-2 px-4 border-2 text-green-600 border-green-600 rounded-full font-semibold hover:bg-green-600 hover:text-white transition-colors'
          >
            See Order
          </Link>
          
          <Link 
            to={"/"} 
            className='p-2 px-4 border-2 text-blue-600 border-blue-600 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition-colors'
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Success