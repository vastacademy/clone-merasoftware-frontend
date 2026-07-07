import React, { useEffect, useState } from 'react'
import UploadBanner from '../components/UploadBanner'
import SummaryApi from '../common'
import AdminBannerCard from '../components/AdminBannerCard'
import { useSelector } from 'react-redux';

const AllAds = () => {
  const [openUploadBanner, setOpenUploadBanner] = useState(false)
  const [allBanners, setAllBanners] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIndex, setExpandedIndex] = useState(null)

  const userRole = useSelector(state => state?.user?.user?.role);

  const fetchAllBanners = async() => {
    const response = await fetch(SummaryApi.allBanner.url)
    const dataResponse = await response.json()
    setAllBanners(dataResponse?.data || [])
  }

  useEffect(() => {
    fetchAllBanners()
  }, [])

  // Filter banners by position based on search term (case insensitive)
  const filteredBanners = allBanners.filter(banner =>
    banner.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

   const handleRowClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index) // Toggle the expanded index
  }

  return (
    <div>
      <div className='bg-white px-4 py-3 flex justify-between items-center'>
        <h2 className='font-bold text-lg'>Banner Management</h2>
        <button 
          className='border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all py-1 px-3 rounded-full' 
          onClick={() => setOpenUploadBanner(true)}
        >
          Upload New Banner
        </button>
      </div>

      {/* Search Bar */}
      <div className='my-3 px-4'>
        <input
          type="text"
          placeholder="Search position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {/* Banner Table */}
      <div className="overflow-x-auto px-4">
        <table className="min-w-full border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-2 px-3 border-b text-sm uppercase text-gray-500 border-gray-300">S.No</th>
              <th className="text-left py-2 px-3 border-b text-sm uppercase text-gray-500 border-gray-300">Position</th>
              <th className="text-left py-2 px-3 border-b text-sm uppercase text-gray-500 border-gray-300">Image</th>
              <th className="text-left py-2 px-3 border-b text-sm uppercase text-gray-500 border-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBanners.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">No banners found.</td>
              </tr>
            ) : (
              filteredBanners.map((banner, index) => (
                <AdminBannerCard
                  key={banner._id}
                  data={banner}
                  index={index}
                  fetchData={fetchAllBanners}
                  userRole={userRole}
                  isExpanded={expandedIndex === index} // Pass the expanded state
                  onRowClick={() => handleRowClick(index)} // Pass the click handler
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Banner Modal */}
      {openUploadBanner && (
        <UploadBanner 
          onClose={() => setOpenUploadBanner(false)} 
          fetchData={fetchAllBanners} 
        />
      )}
    </div>
  )
}

export default AllAds
