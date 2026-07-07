import React, { useState, useEffect } from 'react'
import { CgClose } from "react-icons/cg";
import SummaryApi from '../common';
import { toast } from 'sonner';

const GuestSlidesForm = ({ onClose, fetchData, data, isEditing }) => {
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        ctaButtons: [
            {
                text: '',
                link: '',
                type: 'primary'
            }
        ],
        isActive: true,
        displayOrder: 0
    });

    useEffect(() => {
        if (isEditing && data) {
            setFormData(data);
        }
    }, [isEditing, data]);

    const handleOnChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGuestSlideChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCtaButtonChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            ctaButtons: [{ ...prev.ctaButtons[0], [field]: value }]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const url = isEditing 
                ? `${SummaryApi.updateGuestSlides.url}/${data._id}`
                : SummaryApi.uploadGuestSlides.url;
            
            const method = isEditing 
                ? SummaryApi.updateGuestSlides.method
                : SummaryApi.uploadGuestSlides.method;

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const responseData = await response.json();

            if (responseData.success) {
                toast.success(responseData?.message);
                onClose();
                fetchData?.();
            } else {
                toast.error(responseData?.message);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`Error ${isEditing ? 'updating' : 'uploading'} guest slides`);
        }
    };

// Close popup on Esc key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Close popup on background click
    const handleBackgroundClick = (e) => {
        if (e.target.id === 'popup-background') {
            onClose();
        }
    };

    return (
        <div 
        id="popup-background"
        className='fixed w-full h-full z-50 bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center'
        onClick={handleBackgroundClick}
        >
            <div className='bg-white p-4 rounded w-full max-w-2xl h-full max-h-[75%] overflow-hidden'>
                <div className='flex justify-between items-center pb-3'>
                    <h2 className='font-bold text-lg'>{isEditing ? 'Edit' : 'Upload'} Guest Slide</h2>
                    <div className='text-2xl hover:text-red-600 cursor-pointer' onClick={onClose}>
                        <CgClose />
                    </div>
                </div>

                <form className='grid p-4 gap-2 overflow-y-scroll h-full pb-5' onSubmit={handleSubmit}>
                    <div className="bg-slate-50 p-4 rounded mb-4">
                        <div className="grid gap-3">
                            <input
                                type="text"
                                placeholder="Title *"
                                value={formData.title}
                                onChange={(e) => handleGuestSlideChange('title', e.target.value)}
                                className="p-2 bg-white border rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Subtitle"
                                value={formData.subtitle}
                                onChange={(e) => handleGuestSlideChange('subtitle', e.target.value)}
                                className="p-2 bg-white border rounded"
                            />
                            <textarea
                                placeholder="Description"
                                value={formData.description}
                                onChange={(e) => handleGuestSlideChange('description', e.target.value)}
                                className="p-2 bg-white border rounded h-20"
                            />

                            <div className="grid gap-2">
                                <input
                                    type="text"
                                    placeholder="Button Text"
                                    value={formData.ctaButtons[0].text}
                                    onChange={(e) => handleCtaButtonChange('text', e.target.value)}
                                    className="p-2 bg-white border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Button Link"
                                    value={formData.ctaButtons[0].link}
                                    onChange={(e) => handleCtaButtonChange('link', e.target.value)}
                                    className="p-2 bg-white border rounded"
                                />
                                <select
                                    value={formData.ctaButtons[0].type}
                                    onChange={(e) => handleCtaButtonChange('type', e.target.value)}
                                    className="p-2 bg-white border rounded"
                                >
                                    <option value="primary">Primary</option>
                                    <option value="secondary">Secondary</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleOnChange}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isActive">Active Content</label>
                    </div>

                    <div>
                        <label htmlFor="displayOrder" className="block mb-1">Display Order:</label>
                        <input
                            type="number"
                            id="displayOrder"
                            name="displayOrder"
                            value={formData.displayOrder}
                            onChange={handleOnChange}
                            className="p-2 bg-slate-100 border rounded w-full"
                            min="0"
                        />
                    </div>

                    <button className='px-3 py-2 bg-red-600 text-white mt-4 hover:bg-red-700'>
                        {isEditing ? 'Update' : 'Upload'} Guest Slide
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GuestSlidesForm;