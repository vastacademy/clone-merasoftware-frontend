import React, { useEffect, useState } from 'react'
import UploadCategory from '../components/UploadCategory'
import SummaryApi from '../common'
import AdminCategoryCard from '../components/AdminCategoryCard'
import { useSelector } from 'react-redux'

const serviceTypeOrder = [
  'Websites Development',
  'Mobile Apps',
  'Cloud Softwares',
  'Feature Upgrades'
]

const AllCategory = () => {
  const [openUploadService, setOpenUploadService] = useState(false)
  const [allCategory, setAllCategory] = useState([])
  const [filteredCategory, setFilteredCategory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIndex, setExpandedIndex] = useState(null)

  const userRole = useSelector(state => state?.user?.user?.role)

  const fetchAllCategory = async () => {
    const response = await fetch(SummaryApi.allCategory.url)
    const dataResponse = await response.json()
    setAllCategory(dataResponse?.data || [])
  }

  useEffect(() => {
    fetchAllCategory()
  }, [])

  useEffect(() => {
    let filtered = [...allCategory]

    // Search filter by categoryName
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(category =>
        category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort by serviceType order
    filtered.sort((a, b) => {
      const indexA = serviceTypeOrder.indexOf(a.serviceType)
      const indexB = serviceTypeOrder.indexOf(b.serviceType)
      return indexA - indexB
    })

    setFilteredCategory(filtered)
  }, [allCategory, searchTerm])

   const handleRowClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index) // Toggle the expanded index
  }

  return (
    <div>
      <div className="bg-white px-4 py-3 flex justify-between items-center">
        <h2 className="font-bold text-xl">Services Management</h2>
        <button
          className="border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all py-1 px-3 rounded-full"
          onClick={() => setOpenUploadService(true)}
        >
          Upload New Service
        </button>
      </div>

      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <input
          type="text"
          placeholder="Search services..."
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">S.NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategory.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  No services found.
                </td>
              </tr>
            ) : (
              filteredCategory.map((category, index) => (
                <AdminCategoryCard
                  key={category._id}
                  data={category}
                  index={index}
                  fetchData={fetchAllCategory}
                  userRole={userRole}
                  isExpanded={expandedIndex === index} // Pass the expanded state
                  onRowClick={() => handleRowClick(index)} // Pass the click handler
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {openUploadService && (
        <UploadCategory
          onClose={() => setOpenUploadService(false)}
          fetchData={fetchAllCategory}
        />
      )}
    </div>
  )
}

export default AllCategory;
