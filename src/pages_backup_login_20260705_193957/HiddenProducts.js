import React, { useEffect, useState } from 'react'
import AdminProductCard from '../components/AdminProductCard'
import SummaryApi from '../common'

const HiddenProducts = () => {
  const [hiddenProducts, setHiddenProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const fetchHiddenProducts = async () => {
    try {
      const response = await fetch(SummaryApi.getHiddenProducts.url, {
        credentials: 'include'
      })
      const dataResponse = await response.json()
      if (dataResponse.success) {
        setHiddenProducts(dataResponse.data || [])
      } else {
        alert(dataResponse.message || 'Failed to fetch hidden products')
      }
    } catch (error) {
      alert('Error fetching hidden products')
    }
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
    fetchHiddenProducts()
    fetchCategories()
  }, [])

  // Helper to get serviceType by categoryValue
  const getServiceTypeByCategory = (categoryValue) => {
    const category = categories.find(cat => cat.categoryValue === categoryValue)
    return category ? category.serviceType : ''
  }

  useEffect(() => {
    let filtered = [...hiddenProducts]

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(product =>
        product.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    filtered = filtered.map(product => ({
      ...product,
      serviceCategoryName: getServiceTypeByCategory(product.category) || '-'
    }))

    setFilteredProducts(filtered)
  }, [hiddenProducts, searchTerm, categories])

  return (
    <div>
      <div className="bg-white px-4 py-3">
        <h2 className="font-bold text-xl mb-3">Hidden Products</h2>
        <input
          type="text"
          placeholder="Search hidden products..."
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto mt-4">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">S.NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  No hidden products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, index) => (
                <AdminProductCard
                  key={product._id}
                  data={product}
                  index={index}
                  fetchdata={fetchHiddenProducts}
                  isHiddenSection={true}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default HiddenProducts
