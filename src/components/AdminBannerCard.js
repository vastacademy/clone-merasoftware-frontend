import React, { useState } from 'react';
import { MdModeEditOutline, MdDelete } from "react-icons/md";
import AdminEditBanner from './AdminEditBanner';
import AdminDeleteBanner from './AdminDeleteBanner';
import SummaryApi from '../common';
import { toast } from 'sonner';

const AdminBannerCard = ({ data, index, fetchData, userRole, isExpanded, onRowClick }) => {
    const [editBanner, setEditBanner] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const formatPosition = (position) => {
        return position?.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const toggleIsActive = async (e) => {
        e.stopPropagation();
        if (isUpdating) return;

        setIsUpdating(true);
        try {
            const updatedData = { ...data, isActive: !data.isActive };
            const url = `${SummaryApi.updateBanner.url}/${data._id}`;
            const method = SummaryApi.updateBanner.method;

            // Send full data with updated isActive to satisfy backend validation
            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(updatedData)
            });

            const responseData = await response.json();

            if (responseData.success) {
                toast.success(`Banner marked as ${updatedData.isActive ? 'Active' : 'Inactive'}`);
                fetchData();
            } else {
                toast.error(responseData.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating banner status:', error);
            toast.error('Error updating banner status');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <>
            <tr
                className={`cursor-pointer hover:bg-gray-100 ${isExpanded ? 'bg-blue-100' : ''}`}
                 onClick={onRowClick}
            >
                <td className="py-2 px-3 border-b border-gray-300">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                    </div>
                    </td>
                <td className="py-2 px-3 border-b border-gray-300">{formatPosition(data.position)}</td>
                <td className="py-2 px-3 border-b border-gray-300">
                    {data?.images && data.images.length > 0 ? (
                        <img
                            src={data.images[0]}
                            alt={`Banner ${index + 1}`}
                            className="w-20 h-12 object-cover rounded"
                        />
                    ) : (
                        <span className="text-gray-400">No Image</span>
                    )}
                </td>
                <td className="py-2 px-3 border-b border-gray-300">
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
                    <td colSpan="4" className="py-2 px-4 border-b border-gray-300">
                        <div className="flex space-x-4">
                            <button
                                className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditBanner(true);
                                }}
                            >
                                <MdModeEditOutline className="mr-1" />
                                Edit
                            </button>
                            {userRole === 'admin' && (
                                <button
                                    className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteModal(true);
                                    }}
                                >
                                    <MdDelete className="mr-1" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
            )}
            {editBanner && (
                <AdminEditBanner
                    bannerData={data}
                    onClose={() => setEditBanner(false)}
                    fetchData={fetchData}
                />
            )}
            {showDeleteModal && (
                <AdminDeleteBanner
                    bannerId={data?._id}
                    onClose={() => setShowDeleteModal(false)}
                    fetchData={fetchData}
                />
            )}
        </>
    );
};

export default AdminBannerCard;
