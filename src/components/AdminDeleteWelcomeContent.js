import React from 'react';
import { CgClose } from "react-icons/cg";
import SummaryApi from '../common';
import { toast } from 'sonner';

const AdminDeleteWelcomeContent = ({ contentId, contentType, onClose, fetchData }) => {
    const handleDelete = async () => {
        try {
            // Choose the appropriate API endpoint based on content type
            let url;
            if (contentType === 'guestSlide') {
                url = `${SummaryApi.deleteGuestSlides.url}/${contentId}`;
            } else if (contentType === 'userWelcome') {
                url = `${SummaryApi.deleteUserWelcome.url}/${contentId}`;
            } else {
                toast.error('Invalid content type');
                return;
            }

            const response = await fetch(url, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    "content-type": "application/json"
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Content deleted successfully');
                onClose();
                fetchData?.();
            } else {
                toast.error(data.message || 'Failed to delete content');
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            toast.error('An error occurred while deleting content');
        }
    };

    return (
        <div className='fixed w-full h-full bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center z-50'>
            <div className='bg-white p-6 rounded-lg w-full max-w-md shadow-lg'>
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='font-bold text-lg'>Confirm Deletion</h2>
                    <div className='text-2xl hover:text-red-600 cursor-pointer' onClick={onClose}>
                        <CgClose />
                    </div>
                </div>

                <div className='mb-6'>
                    <p className='text-gray-700'>
                        Are you sure you want to delete this {contentType === 'guestSlide' ? 'guest slide' : 'user welcome content'}?
                    </p>
                    <p className='text-red-600 mt-2 text-sm'>
                        This action cannot be undone.
                    </p>
                </div>

                <div className='flex justify-end gap-3'>
                    <button 
                        className='px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400'
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDeleteWelcomeContent;