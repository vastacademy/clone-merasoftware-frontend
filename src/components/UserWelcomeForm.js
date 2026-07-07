import React, { useState, useEffect } from 'react'
import { CgClose } from "react-icons/cg";
import SummaryApi from '../common';
import { toast } from 'sonner';
import RichTextEditor from '../helpers/richTextEditor';

const UserWelcomeForm = ({ onClose, fetchData, data = null, isEditing = false }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        cta: {
            text: '',
            link: ''
        },
        isActive: true
    });

    // If editing, populate form with existing data
    useEffect(() => {
        if (isEditing && data) {
            setFormData({
                title: data.title || '',
                description: data.description || '',
                cta: {
                    text: data.cta?.text || '',
                    link: data.cta?.link || ''
                },
                isActive: data.isActive !== undefined ? data.isActive : true
            });
            
            // Add a small delay to ensure the RichTextEditor is mounted
            setTimeout(() => {
                if (data.description) {
                    // Force update the rich text editor content
                    const editorEvent = new Event('editor-update');
                    document.dispatchEvent(editorEvent);
                }
            }, 100);
        }
    }, [isEditing, data]);

    const handleOnChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCtaChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            cta: { ...prev.cta, [field]: value }
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
                ? `${SummaryApi.updateUserWelcome.url}/${data._id}`
                : SummaryApi.uploadUserWelcome.url;
                
            const method = isEditing
                ? SummaryApi.updateUserWelcome.method
                : SummaryApi.uploadUserWelcome.method;

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
            toast.error(`Error ${isEditing ? 'updating' : 'uploading'} user welcome`);
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
        className='fixed w-full h-full bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center z-50'
        onClick={handleBackgroundClick}>
            <div className='bg-white p-4 rounded w-full max-w-2xl h-full max-h-[75%] overflow-hidden'>
                <div className='flex justify-between items-center pb-3'>
                    <h2 className='font-bold text-lg'>
                        {isEditing ? 'Update User Welcome' : 'Upload User Welcome'}
                    </h2>
                    <div className='text-2xl hover:text-red-600 cursor-pointer' onClick={onClose}>
                        <CgClose />
                    </div>
                </div>

                <form className='grid p-4 gap-2 overflow-y-scroll h-full pb-5' onSubmit={handleSubmit}>
                    <div className="grid gap-3">
                        <input
                            type="text"
                            placeholder="Title *"
                            name="title"
                            value={formData.title}
                            onChange={handleOnChange}
                            className="p-2 bg-slate-100 border rounded"
                            required
                        />
                        <RichTextEditor
                            value={formData.description}
                            onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                            placeholder="Description..."
                            initialContent={isEditing ? data?.description : ''}
                        />
                        <input
                            type="text"
                            placeholder="CTA Text"
                            value={formData.cta.text}
                            onChange={(e) => handleCtaChange('text', e.target.value)}
                            className="p-2 bg-slate-100 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="CTA Link"
                            value={formData.cta.link}
                            onChange={(e) => handleCtaChange('link', e.target.value)}
                            className="p-2 bg-slate-100 border rounded"
                        />
                    </div>

                    {/* Active Status */}
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

                    <button className='px-3 py-2 bg-red-600 text-white mt-4 hover:bg-red-700'>
                        {isEditing ? 'Update User Welcome' : 'Upload User Welcome'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserWelcomeForm;