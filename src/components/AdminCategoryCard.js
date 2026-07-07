import React, { useState } from 'react'
import { MdModeEditOutline } from "react-icons/md";
import AdminEditCategory from './AdminEditCategory';
import AdminDeleteCategory from './AdminDeleteCategory';
import { MdDelete } from "react-icons/md";
import SummaryApi from '../common';
import { toast } from 'sonner';

const serviceTypeOrder = [
  'Websites Development',
  'Mobile Apps',
  'Cloud Softwares',
  'Feature Upgrades'
]

const serviceTypeColors = {
  'Websites Development': 'bg-yellow-50 text-yellow-800',
  'Mobile Apps': 'bg-blue-50 text-blue-800',
  'Cloud Softwares': 'bg-pink-50 text-pink-800',
  'Feature Upgrades': 'bg-green-50 text-green-800',
  'default': 'bg-gray-100 text-gray-800'
}

const truncateText = (text, maxWords = 4) => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
};

const AdminCategoryCard = ({
  data,
  index,
  fetchData,
  userRole,
  isExpanded, // New prop
  onRowClick // New prop
}) => {
  const [editCategory, setEditCategory] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const getServiceTypeColor = (serviceType) => {
    return serviceTypeColors[serviceType] || serviceTypeColors['default']
  }

  const toggleIsActive = async (e) => {
    e.stopPropagation()
    if (isUpdating) return

    setIsUpdating(true)
    try {
      const updatedData = { ...data, isActive: !data.isActive }
      const url = `${SummaryApi.updateCategory.url}/${data._id}`
      const method = SummaryApi.updateCategory.method

      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(updatedData)
      })

      const responseData = await response.json()

      if (responseData.success) {
        toast.success(`Category marked as ${updatedData.isActive ? 'Active' : 'Inactive'}`)
        fetchData()
      } else {
        toast.error(responseData.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating category status:', error)
      toast.error('Error updating category status')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <tr
        className="hover:bg-gray-100 cursor-pointer"
        onClick={onRowClick}
      >
        <td className={`px-6 py-4 whitespace-nowrap border-b`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold  ${getServiceTypeColor(data?.serviceType)}`}>
            {index + 1}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-b text-sm text-gray-900">{data?.categoryName}</td>
        <td className="px-6 py-4 whitespace-nowrap border-b text-sm text-gray-900 max-w-xs truncate">{truncateText(data?.description)}</td>
        <td className="px-6 py-4 whitespace-nowrap border-b border-gray-300 w-36 max-w-34">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getServiceTypeColor(data?.serviceType)}`}>
            {data?.serviceType || 'Uncategorized'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-b border-gray-300">
          <label className="relative inline-flex items-center cursor-pointer" onClick={toggleIsActive}>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={data.isActive}
              readOnly
              disabled={isUpdating}
            />
            <div className="w-11 h-6 bg-red-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-300"></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${data.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </label>
          {isUpdating && <span className="ml-2 text-gray-500 text-sm">Updating...</span>}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan="5" className="py-2 px-4 border-b border-gray-300">
            <div className="flex space-x-4">
              <button
                className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditCategory(true)
                }}
              >
                Edit Service
              </button>
              {userRole === 'admin' && (
                <button
                  className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteModal(true)
                  }}
                >
                  Delete Service
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
      {editCategory && (
        <AdminEditCategory
          categoryData={data}
          onClose={() => setEditCategory(false)}
          fetchData={fetchData}
        />
      )}
      {showDeleteModal && (
        <AdminDeleteCategory
          categoryId={data?._id}
          onClose={() => setShowDeleteModal(false)}
          fetchData={fetchData}
        />
      )}
    </>
  )
}

export default AdminCategoryCard;