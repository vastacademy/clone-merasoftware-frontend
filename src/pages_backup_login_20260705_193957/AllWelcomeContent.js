import React, { useEffect, useState } from 'react'
import GuestSlidesForm from '../components/GuestSlidesForm'
import UserWelcomeForm from '../components/UserWelcomeForm'
import SummaryApi from '../common'
import { useSelector } from 'react-redux'
import GuestSlidesTableRow from '../components/GuestSlidesTableRow'
import UserWelcomeTableRow from '../components/UserWelcomeTableRow'

const AllWelcomeContent = () => {
  const [openGuestSlidesForm, setOpenGuestSlidesForm] = useState(false)
  const [openUserWelcomeForm, setOpenUserWelcomeForm] = useState(false)
  const [guestSlides, setGuestSlides] = useState([])
  const [userWelcome, setUserWelcome] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const userRole = useSelector(state => state?.user?.user?.role)

  const fetchGuestSlides = async () => {
    try {
      const response = await fetch(SummaryApi.guestSlides.url)
      const dataResponse = await response.json()
      if (dataResponse?.success) {
        setGuestSlides(dataResponse.data || [])
      } else {
        setGuestSlides([])
      }
    } catch (error) {
      setGuestSlides([])
    }
  }

  const fetchUserWelcome = async () => {
    try {
      const response = await fetch(SummaryApi.userWelcome.url)
      const dataResponse = await response.json()
      if (dataResponse?.success) {
        setUserWelcome(dataResponse.data)
      } else {
        setUserWelcome(null)
      }
    } catch (error) {
      setUserWelcome(null)
    }
  }

  const fetchAllContent = async () => {
    setIsLoading(true)
    await Promise.all([fetchGuestSlides(), fetchUserWelcome()])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAllContent()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white px-2 py-2">
        <h2 className="font-bold text-lg">Welcome Content Management</h2>
        <div className="mt-4">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white px-2 py-2 flex justify-between items-center">
        <h2 className="font-bold text-lg">Welcome Content Management</h2>
        {/* <div className="flex gap-3">
          <button
            className="border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all py-1 px-3 rounded-full"
            onClick={() => setOpenGuestSlidesForm(true)}
          >
            Add Guest Slide
          </button>
          <button
            className="border-2 border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white transition-all py-1 px-3 rounded-full"
            onClick={() => setOpenUserWelcomeForm(true)}
          >
            Add User Welcome
          </button>
        </div> */}
      </div>

      <div className="py-4 overflow-y-scroll max-h-[calc(100vh-190px)]">
        {/* Guest Slides Section */}
        <div className="mb-8">
          <div className='flex justify-between'>
          <h3 className="font-semibold text-lg mb-3 mt-2">Guest Slides</h3>
           <button
            className="border-2 mb-3 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all py-1 px-3 rounded-full"
            onClick={() => setOpenGuestSlidesForm(true)}
          >
            Add Guest Slide
          </button>
          </div>
          {guestSlides.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">S.NO</th>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">Title</th>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">Description</th>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">Button Text</th>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {guestSlides.map((slide, index) => (
                    <GuestSlidesTableRow
                      key={slide._id}
                      data={slide}
                      index={index}
                      fetchData={fetchGuestSlides}
                      userRole={userRole}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 bg-white rounded">
              No guest slides found
            </div>
          )}
        </div>

        {/* User Welcome Section */}
        <div>
          <div className='flex justify-between'>
          <h3 className="font-semibold text-lg mb-3 mt-2">User Welcome</h3>
           <button
            className="border-2 mb-3 border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white transition-all py-1 px-3 rounded-full"
            onClick={() => setOpenUserWelcomeForm(true)}
          >
            Add User Welcome
          </button>
          </div>
          {userWelcome ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">S.NO</th>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">Title</th>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">Description</th>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">Button Text</th>
                    <th className="px-6 py-3 text-left text-sm uppercase font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <UserWelcomeTableRow
                    data={userWelcome}
                    index={0}
                    fetchData={fetchUserWelcome}
                    userRole={userRole}
                  />
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 bg-white rounded">
              No user welcome message found
            </div>
          )}
        </div>
      </div>

      {/* Upload Forms */}
      {openGuestSlidesForm && (
        <GuestSlidesForm
          onClose={() => setOpenGuestSlidesForm(false)}
          fetchData={fetchGuestSlides}
        />
      )}
      {openUserWelcomeForm && (
        <UserWelcomeForm
          onClose={() => setOpenUserWelcomeForm(false)}
          fetchData={fetchUserWelcome}
        />
      )}
    </div>
  )
}

export default AllWelcomeContent
