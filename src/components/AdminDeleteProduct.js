import React from 'react'
import { toast } from 'sonner'
import SummaryApi from '../common'

const AdminDeleteProduct = ({ productId, onClose, fetchdata }) => {
  const handleDelete = async () => {
    try {
      const response = await fetch(SummaryApi.deleteProduct.url, {
        method: SummaryApi.deleteProduct.method,
        credentials: 'include',
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ _id: productId })
      })

      const responseData = await response.json()

      if (responseData.success) {
        toast.success(responseData.message)
        fetchdata()
        onClose()
      }

      if (responseData.error) {
        toast.error(responseData.message)
      }
    } catch (error) {
      toast.error("Something went wrong!")
    }
  }

  return (
    <div className='fixed w-full h-full bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center'>
      <div className='bg-white p-4 rounded w-full max-w-md'>
        <h2 className='font-bold text-lg mb-4'>Delete Service</h2>
        <p className='mb-4'>Are you sure you want to delete this service?</p>
        
        <div className='flex gap-4 justify-end'>
          <button 
            onClick={onClose}
            className='px-4 py-2 bg-gray-200 rounded hover:bg-gray-300'
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete}
            className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDeleteProduct