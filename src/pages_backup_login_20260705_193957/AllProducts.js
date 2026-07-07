import React, { useEffect, useState } from 'react'
import UploadProduct from '../components/UploadProduct'
import SummaryApi from '../common'
import AdminProductCard from '../components/AdminProductCard'
import { useSelector } from 'react-redux'

const serviceTypes = [
  'Websites Development',
  'Mobile Apps',
  'Cloud Softwares',
  'Feature Upgrades'
]

const serviceTypeColors = {
  'Websites Development': { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-400 text-yellow-900 border-yellow-400' },
  'Mobile Apps': { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-600 text-blue-100 border-blue-600' },
  'Cloud Softwares': { light: 'bg-pink-100 text-pink-800', dark: 'bg-pink-400 text-pink-900 border-pink-400' },
  'Feature Upgrades': { light: 'bg-green-100 text-green-800', dark: 'bg-green-400 text-green-900 border-green-400' },
  'All': { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-600 text-white border-gray-600' }
}

const sortOptions = [
  { label: 'A to Z', value: 'az' },
  { label: 'Z to A', value: 'za' },
  { label: 'High to Low', value: 'highlow' },
  { label: 'Low to High', value: 'lowhigh' }
]

const AllProducts = () => {
  const [openUploadProduct, setOpenUploadProduct] = useState(false)
  const [allProduct, setAllProduct] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedServiceType, setSelectedServiceType] = useState('All')
  const [sortBy, setSortBy] = useState('az')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIndex, setExpandedIndex] = useState(null)
  
  const userRole = useSelector(state => state?.user?.user?.role)

  const fetchAllProduct = async () => {
    const response = await fetch(SummaryApi.allProduct.url)
    const dataResponse = await response.json()
    setAllProduct(dataResponse?.data || [])
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(SummaryApi.allCategory.url)
      const dataResponse = await response.json()
      if (dataResponse.success) {
        setCategories(dataResponse.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchAllProduct()
    fetchCategories()
  }, [])

  // Helper to get category name by categoryValue
  const getCategoryName = (categoryValue) => {
    const category = categories.find(cat => cat.categoryValue === categoryValue)
    return category ? category.categoryName : ''
  }

  // Helper to get serviceType by categoryValue
  const getServiceTypeByCategory = (categoryValue) => {
    const category = categories.find(cat => cat.categoryValue === categoryValue)
    return category ? category.serviceType : ''
  }

  useEffect(() => {
    let filtered = [...allProduct]

    // Filter by service type using category's serviceType
    if (selectedServiceType !== 'All') {
      filtered = filtered.filter(
        product => getServiceTypeByCategory(product.category) === selectedServiceType
      )
    }

    // Search by product name
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(product =>
        product.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    switch (sortBy) {
      case 'az':
        filtered.sort((a, b) =>
          a.serviceName.localeCompare(b.serviceName)
        )
        break
      case 'za':
        filtered.sort((a, b) =>
          b.serviceName.localeCompare(a.serviceName)
        )
        break
      case 'highlow':
        filtered.sort((a, b) => b.sellingPrice - a.sellingPrice)
        break
      case 'lowhigh':
        filtered.sort((a, b) => a.sellingPrice - b.sellingPrice)
        break
      default:
        break
    }

    setFilteredProducts(filtered)
  }, [allProduct, categories, selectedServiceType, sortBy, searchTerm])

   const handleRowClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index) // Toggle the expanded index
  }

  return (
    <div>
      <div className="bg-white px-4 py-3 flex justify-between items-center">
        <h2 className="font-bold text-xl">Product Management</h2>
        <button
          className="border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all py-1 px-3 rounded-full"
          onClick={() => setOpenUploadProduct(true)}
        >
          Upload Product
        </button>
      </div>

      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-1 rounded-full text-sm ${
              selectedServiceType === 'All'
                ? serviceTypeColors['All'].dark
                : serviceTypeColors['All'].light
            }`}
            onClick={() => setSelectedServiceType('All')}
          >
            All
          </button>
          {serviceTypes.map(type => (
            <button
              key={type}
              className={`px-4 py-1 rounded-full text-sm ${
                selectedServiceType === type
                  ? serviceTypeColors[type].dark
                  : serviceTypeColors[type].light
              }`}
              onClick={() => setSelectedServiceType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="sortBy" className="font-medium text-sm">
            Sort by:
          </label>
          <select
            id="sortBy"
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
        <table className="min-w-full bg-white ">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">S.NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              {/* <th className="text-left py-2 px-4 border-b border-gray-300">Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  No products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, index) => (
                <AdminProductCard
                  key={product._id}
                  data={{ ...product, serviceCategoryName: getCategoryName(product.category) }}
                  index={index}
                  fetchdata={fetchAllProduct}
                  userRole={userRole}
                  isExpanded={expandedIndex === index} // Pass the expanded state
                  onRowClick={() => handleRowClick(index)} // Pass the click handler
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {openUploadProduct && (
        <UploadProduct
          onClose={() => setOpenUploadProduct(false)}
          fetchData={fetchAllProduct}
        />
      )}
    </div>
  )
}

export default AllProducts
