import React, { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import imageTobase64 from '../helpers/imageTobase64';
import uploadImage from '../helpers/uploadImage';
import { toast } from 'sonner';

const EditProfileModal = ({ user, onClose, onUpdate, loading, initialField }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        age: user?.age || '',
        profilePic: user?.profilePic || ''
    });
    const [imagePreview, setImagePreview] = useState(user?.profilePic || '');
    
    // Focus on the initial field when the modal opens
    useEffect(() => {
        if (initialField) {
            const inputElement = document.getElementById(`edit-${initialField}`);
            if (inputElement) {
                inputElement.focus();
            }
        }
    }, [initialField]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = async(e) => {
        const file = e.target.files[0];
        
        // Preview के लिए
        const base64Image = await imageTobase64(file);
        setImagePreview(base64Image);
        
        try {
            // Cloudinary पर upload
            const imageData = await uploadImage(file);
            if (imageData.url) {
                setFormData(prev => ({
                    ...prev,
                    profilePic: imageData.url
                }));
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (initialField === 'name' && !formData.name.trim()) {
            return toast.error('Name is required');
        }
        
        if (initialField === 'email' && !formData.email.trim()) {
            return toast.error('Email is required');
        }
        
        // Prepare update data based on which field is being edited
        const updateData = {};
        
        switch(initialField) {
            case 'name':
                updateData.name = formData.name;
                break;
            case 'email':
                updateData.email = formData.email;
                break;
            case 'phone':
                updateData.phone = formData.phone;
                break;
            case 'age':
                updateData.age = formData.age;
                break;
            default:
                // If no specific field, update all fields
                updateData.name = formData.name;
                updateData.email = formData.email;
                updateData.phone = formData.phone;
                updateData.age = formData.age;
                updateData.profilePic = formData.profilePic;
        }
        
        onUpdate(updateData);
    };

    // Function to get the field label based on initialField
    const getFieldLabel = () => {
        switch(initialField) {
            case 'name': return 'Name';
            case 'email': return 'Email';
            case 'phone': return 'Phone Number';
            case 'age': return 'Age';
            default: return 'Profile Information';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden shadow-xl">
                <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Edit {getFieldLabel()}</h3>
                    <button 
                        onClick={onClose}
                        className="text-white hover:text-blue-100"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Profile Image - Only show if editing full profile or no specific field */}
                    {!initialField && (
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md">
                                    {imagePreview ? (
                                        <img 
                                            src={imagePreview}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-3xl font-semibold">
                                            {formData.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer shadow-lg hover:bg-blue-600 transition-colors">
                                    <Camera size={16} className="text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Show only the relevant field based on initialField */}
                        {(!initialField || initialField === 'name') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    id="edit-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        )}
                        
                        {(!initialField || initialField === 'email') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    id="edit-email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        )}
                        
                        {(!initialField || initialField === 'phone') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    id="edit-phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Enter your phone number"
                                    required
                                />
                            </div>
                        )}
                        
                        {(!initialField || initialField === 'age') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Age
                                </label>
                                <input
                                    id="edit-age"
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Enter your age"
                                    min="1"
                                    max="120"
                                    required
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;