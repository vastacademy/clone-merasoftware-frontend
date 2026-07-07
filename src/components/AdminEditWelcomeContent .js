import React, { useState } from 'react';
import { CgClose } from "react-icons/cg";
import { MdDelete, MdAdd } from "react-icons/md";
import SummaryApi from '../common';
import { toast } from 'sonner';
import RichTextEditor from '../helpers/richTextEditor';

const AdminEditWelcomeContent = ({
    contentData,
    onClose,
    fetchData
}) => {
    const [data, setData] = useState(contentData);

    const handleOnChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGuestSlideChange = (index, field, value) => {
        const newSlides = [...data.guestSlides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setData(prev => ({ ...prev, guestSlides: newSlides }));
    };

    const handleCtaButtonChange = (slideIndex, field, value) => {
        const newSlides = [...data.guestSlides];
        newSlides[slideIndex].ctaButtons[0] = { 
            ...newSlides[slideIndex].ctaButtons[0], 
            [field]: value 
        };
        setData(prev => ({ ...prev, guestSlides: newSlides }));
    };

    const handleUserWelcomeChange = (field, value) => {
        setData(prev => ({
            ...prev,
            userWelcome: { ...prev.userWelcome, [field]: value }
        }));
    };

    // Add new guest slide
    const handleAddGuestSlide = () => {
        if (data.guestSlides.length < 2) {
            setData(prev => ({
                ...prev,
                guestSlides: [...prev.guestSlides, {
                    title: '',
                    subtitle: '',
                    description: '',
                    ctaButtons: [{ text: '', link: '', type: 'primary' }]
                }]
            }));
        } else {
            toast.warning('Maximum 2 slides allowed');
        }
    };

    // Remove guest slide
    const handleRemoveGuestSlide = (index) => {
        if (data.guestSlides.length > 1) {
            const newSlides = [...data.guestSlides];
            newSlides.splice(index, 1);
            setData(prev => ({ ...prev, guestSlides: newSlides }));
        } else {
            toast.warning('At least one slide is required');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!data.guestSlides[0].title || !data.userWelcome.title) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch(`${SummaryApi.updateWelcomeContent.url}/${data._id}`, {
                method: SummaryApi.updateWelcomeContent.method,
                credentials: 'include',
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if(responseData.success){
                toast.success(responseData?.message);
                onClose();
                fetchData();
            } else {
                toast.error(responseData?.message);
            }
        } catch (error) {
            console.error("Error updating welcome content:", error);
            toast.error("Failed to update welcome content");
        }
    };

    return (
        <div className='fixed w-full h-full bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center'>
            <div className='bg-white p-4 rounded w-full max-w-2xl h-full max-h-[75%] overflow-hidden'>
                <div className='flex justify-between items-center pb-3'>
                    <h2 className='font-bold text-lg'>Edit Welcome Content</h2>
                    <div className='text-2xl hover:text-red-600 cursor-pointer' onClick={onClose}>
                        <CgClose />
                    </div>
                </div>

                <form className='grid p-4 gap-2 overflow-y-scroll h-full pb-5' onSubmit={handleSubmit}>
                    {/* Guest Slides Section */}
                    <div className="border-b pb-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-lg">Guest Slides</h3>
                            {data.guestSlides.length < 2 && (
                                <button
                                    type="button"
                                    onClick={handleAddGuestSlide}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                >
                                    Add Slide <MdAdd />
                                </button>
                            )}
                        </div>

                        {data.guestSlides.map((slide, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded mb-4 relative">
                                {data.guestSlides.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveGuestSlide(index)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <MdDelete size={16} />
                                    </button>
                                )}

                                <div className="grid gap-3">
                                    <input
                                        type="text"
                                        placeholder="Title *"
                                        value={slide.title}
                                        onChange={(e) => handleGuestSlideChange(index, 'title', e.target.value)}
                                        className="p-2 bg-white border rounded"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Subtitle"
                                        value={slide.subtitle}
                                        onChange={(e) => handleGuestSlideChange(index, 'subtitle', e.target.value)}
                                        className="p-2 bg-white border rounded"
                                    />
                                    <textarea
                                        placeholder="Description"
                                        value={slide.description}
                                        onChange={(e) => handleGuestSlideChange(index, 'description', e.target.value)}
                                        className="p-2 bg-white border rounded h-20"
                                    />

                                    {/* CTA Button Fields */}
                                    <div className="grid gap-2">
                                        <input
                                            type="text"
                                            placeholder="Button Text"
                                            value={slide.ctaButtons[0].text}
                                            onChange={(e) => handleCtaButtonChange(index, 'text', e.target.value)}
                                            className="p-2 bg-white border rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Button Link"
                                            value={slide.ctaButtons[0].link}
                                            onChange={(e) => handleCtaButtonChange(index, 'link', e.target.value)}
                                            className="p-2 bg-white border rounded"
                                        />
                                        <select
                                            value={slide.ctaButtons[0].type}
                                            onChange={(e) => handleCtaButtonChange(index, 'type', e.target.value)}
                                            className="p-2 bg-white border rounded"
                                        >
                                            <option value="primary">Primary</option>
                                            <option value="secondary">Secondary</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* User Welcome Section */}
                    <div className="border-b pb-4">
                        <h3 className="font-semibold text-lg mb-3">User Welcome</h3>
                        <div className="grid gap-3">
                            <input
                                type="text"
                                placeholder="Title *"
                                value={data.userWelcome.title}
                                onChange={(e) => handleUserWelcomeChange('title', e.target.value)}
                                className="p-2 bg-slate-100 border rounded"
                                required
                            />
                            <RichTextEditor
                                value={data.userWelcome.description}
                                onChange={(content) => handleUserWelcomeChange('description', content)}
                                placeholder="Description..."
                            />
                            <input
                                type="text"
                                placeholder="CTA Text"
                                value={data.userWelcome.cta.text}
                                onChange={(e) => handleUserWelcomeChange('cta', { ...data.userWelcome.cta, text: e.target.value })}
                                className="p-2 bg-slate-100 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="CTA Link"
                                value={data.userWelcome.cta.link}
                                onChange={(e) => handleUserWelcomeChange('cta', { ...data.userWelcome.cta, link: e.target.value })}
                                className="p-2 bg-slate-100 border rounded"
                            />
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={data.isActive}
                            onChange={handleOnChange}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isActive">Active Content</label>
                    </div>

                    {/* Display Order */}
                    <div>
                        <label htmlFor="displayOrder" className="block mb-1">Display Order:</label>
                        <input
                            type="number"
                            id="displayOrder"
                            name="displayOrder"
                            value={data.displayOrder}
                            onChange={handleOnChange}
                            className="p-2 bg-slate-100 border rounded w-full"
                            min="0"
                        />
                    </div>

                    {/* Submit Button */}
                    <button className='px-3 py-2 bg-red-600 text-white mt-4 hover:bg-red-700'>
                        Update Welcome Content
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminEditWelcomeContent;