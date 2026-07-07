import React, { useState } from 'react';
import GuestSlidesForm from './GuestSlidesForm';
import AdminDeleteWelcomeContent from './AdminDeleteWelcomeContent';
import SummaryApi from '../common';
import { toast } from 'sonner';

const truncateText = (text, maxWords = 4) => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
};

const GuestSlidesTableRow = ({ data, index, fetchData, userRole }) => {
  const [expanded, setExpanded] = useState(false);
  const [editContent, setEditContent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleIsActive = async (e) => {
    e.stopPropagation();
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedData = { ...data, isActive: !data.isActive };
      const url = `${SummaryApi.updateGuestSlides.url}/${data._id}`;
      const method = SummaryApi.updateGuestSlides.method;

      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ isActive: updatedData.isActive })
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast.success(`Slide marked as ${updatedData.isActive ? 'Active' : 'Inactive'}`);
        fetchData();
      } else {
        toast.error(responseData.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating slide status:', error);
      toast.error('Error updating slide status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <tr
        className="hover:bg-gray-100 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-6 py-4 whitespace-nowrap border-b">
             <div className='w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-red-600 text-white'>
                {index + 1}
                </div>
            </td>
        <td className="px-6 py-4 whitespace-nowrap border-b max-w-xs truncate">{truncateText(data.title)}</td>
        <td className="px-6 py-4 whitespace-nowrap border-b max-w-xs truncate">{truncateText(data.description)}</td>
        <td className="px-6 py-4 whitespace-nowrap border-b">{data.ctaButtons?.[0]?.text || ''}</td>
        <td className="px-6 py-4 whitespace-nowrap border-b">
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
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan="5" className="py-2 px-4 border-b border-gray-300">
            <div className="flex space-x-4">
             
                  <button
                    className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditContent(true);
                    }}
                  >
                    Edit
                  </button>
                   {userRole === 'admin' && (
                <>
                  <button
                    className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
      {editContent && (
        <GuestSlidesForm
          data={data}
          onClose={() => setEditContent(false)}
          fetchData={fetchData}
          isEditing={true}
        />
      )}
      {showDeleteModal && (
        <AdminDeleteWelcomeContent
          contentId={data._id}
          contentType="guestSlide"
          onClose={() => setShowDeleteModal(false)}
          fetchData={fetchData}
        />
      )}
    </>
  );
};

export default GuestSlidesTableRow;
