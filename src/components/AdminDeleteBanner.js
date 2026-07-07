import React from 'react';
import { toast } from 'sonner';
import SummaryApi from '../common';

const AdminDeleteBanner = ({ bannerId, onClose, fetchData }) => {
    const handleDelete = async () => {
        try {
            const response = await fetch(SummaryApi.deleteBanner.url, {
                method: SummaryApi.deleteBanner.method,
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ _id: bannerId })
            });

            const responseData = await response.json();

            if (responseData.success) {
                toast.success(responseData.message);
                fetchData();
                onClose();
            }
            if (responseData.error) {
                toast.error(responseData.message);
            }
        } catch (error) {
            console.error("Delete banner error:", error);
            toast.error("Something went wrong!");
        }
    };

    return (
        <div className='fixed w-full h-full bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center z-50'>
            <div className='bg-white p-4 rounded w-full max-w-md shadow-lg'>
                <h2 className='font-bold text-lg mb-4'>Delete Banner</h2>
                <p className='mb-4 text-gray-600'>Are you sure you want to delete this banner? This action cannot be undone.</p>

                <div className='flex gap-4 justify-end'>
                    <button
                        onClick={onClose}
                        className='px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDeleteBanner;