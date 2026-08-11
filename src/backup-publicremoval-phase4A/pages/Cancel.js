import React from 'react'
import { Link } from 'react-router-dom'

const Cancel = () => {
  return (
    <div className='bg-slate-200 max-w-md w-full mx-auto flex items-center justify-center flex-col p-4 m-2 rounded'>
    {/* <img 
      src=''
     width={150} 
     height={150}/> */}
    <p className='text-red-600 font-bold text-xl'>Payment Cancel</p>
    <Link to={"/cart"} className='p-2 px-3 mt-5 border-2 text-red-600 border-red-600 rounded font-semibold hover:bg-red-600 hover:text-white'>Go To Cart</Link>
  </div>
  )
}

export default Cancel
