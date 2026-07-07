import React, { useState, useEffect } from 'react';
import { CgClose } from "react-icons/cg";
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import uploadImage from '../helpers/uploadImage';
import DisplayImage from './DisplayImage';
import SummaryApi from '../common';
import { toast } from 'sonner';

const AdminEditCategory = ({
    onClose,
    categoryData,
    fetchData
}) => {
    // Simplified state initialization
    const [data, setData] = useState(categoryData || {
        categoryId: '',
        categoryName: '',
        categoryValue: '',
        serviceType: '',
        description: '',
        imageUrl: '',
        order: 0,
        isActive: true
    });

    // Add useEffect to update state if categoryData changes
    useEffect(() => {
        if (categoryData) {
            setData(categoryData);
        }
    }, [categoryData]);

    const [openFullScreenImage, setOpenFullScreenImage] = useState(false);

    const handleOnChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleUploadImage = async (e) => {
        const file = e.target.files[0];
        try {
            const uploadImageCloudinary = await uploadImage(file);
            setData((prev) => ({
                ...prev,
                imageUrl: uploadImageCloudinary.url
            }));
        } catch (error) {
            toast.error("Error uploading image");
            console.error("Error uploading image:", error);
        }
    };

    const handleDeleteImage = () => {
        setData((prev) => ({
            ...prev,
            imageUrl: ""
        }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
  
      if (!data._id) {
          toast.error("Category ID not found");
          return;
      }
  
      try {
          const response = await fetch(`${SummaryApi.updateCategory.url}/${data._id}`, {
              method: SummaryApi.updateCategory.method,
              credentials: 'include',
              headers: {
                  "content-type": "application/json"
              },
              body: JSON.stringify(data)
          });
  
          const responseData = await response.json();
  
          if (responseData.success) {
              localStorage.removeItem('categories_data');
              toast.success(responseData.message);
              onClose();
              // fetchData को if condition के साथ call करें
              if (typeof fetchData === 'function') {
                  await fetchData();
              } else {
                  console.error("fetchData is not a function:", fetchData);
              }
              return;
          }
          
          toast.error(responseData.message || "Failed to update category");
  
      } catch (error) {
          console.error("API Error:", error);
          toast.error("Something went wrong!");
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
        className='fixed w-full z-50 h-full bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center'
        onClick={handleBackgroundClick}>
            <div className='bg-white p-4 rounded w-full max-w-2xl h-full max-h-[75%] overflow-hidden'>
                <div className='flex justify-between items-center pb-3'>
                    <h2 className='font-bold text-lg'>Edit Service</h2>
                    <div className='text-2xl hover:text-red-600 cursor-pointer' onClick={onClose}>
                        <CgClose />
                    </div>
                </div>

                <form className='grid p-4 gap-2 overflow-y-scroll h-full pb-5' onSubmit={handleSubmit}>
                    <label htmlFor='categoryId'>Category ID:</label>
                    <input
                        type='text'
                        id='categoryId'
                        name='categoryId'
                        value={data.categoryId || ''}
                        onChange={handleOnChange}
                        className='p-2 bg-slate-100 border rounded'
                        disabled
                    />

                    <label htmlFor='categoryName'>Category Name:</label>
                    <input
                        type='text'
                        id='categoryName'
                        placeholder='Enter category name'
                        name='categoryName'
                        value={data.categoryName || ''}
                        onChange={handleOnChange}
                        className='p-2 bg-slate-100 border rounded'
                        required
                    />

                    <label htmlFor='categoryValue'>Category Value:</label>
                    <input
                        type='text'
                        id='categoryValue'
                        placeholder='Enter category value (e.g., static_websites)'
                        name='categoryValue'
                        value={data.categoryValue || ''}
                        onChange={handleOnChange}
                        className='p-2 bg-slate-100 border rounded'
                        required
                    />

                    <label htmlFor='serviceType' className='mt-3'>Service Type:</label>
                    <select
                        id='serviceType'
                        name="serviceType"
                        value={data.serviceType || ''}
                        onChange={handleOnChange}
                        className='p-2 bg-slate-100 border rounded'
                        required
                    >
                        <option value="">Select Service Type</option>
                        <option value="Websites Development">Websites Development</option>
                        <option value="Mobile Apps">Mobile Apps</option>
                        <option value="Cloud Softwares">Cloud Softwares</option>
                        <option value="Feature Upgrades">Feature Upgrades</option>
                    </select>
                    
                    <label htmlFor='description' className='mt-3'>Description:</label>
                    <textarea
                        id='description'
                        placeholder='Enter category description'
                        name='description'
                        value={data.description || ''}
                        onChange={handleOnChange}
                        className='p-2 bg-slate-100 border rounded min-h-[100px]'
                    />

                    <label htmlFor='order'>Display Order:</label>
                    <input
                        type='number'
                        id='order'
                        placeholder='Enter display order'
                        name='order'
                        value={data.order || 0}
                        onChange={handleOnChange}
                        className='p-2 bg-slate-100 border rounded'
                    />

                    <div className='mt-2'>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                id='isActive'
                                name='isActive'
                                checked={data.isActive || false}
                                onChange={handleOnChange}
                            />
                            Active
                        </label>
                    </div>

                    <label htmlFor='imageUrl' className='mt-3'>Service Image:</label>
                    <label htmlFor='uploadImageInput'>
                        <div className='p-2 bg-slate-100 border rounded h-32 w-full flex justify-center items-center cursor-pointer'>
                            <div className='text-slate-500 flex justify-center items-center flex-col gap-2'>
                                <span className='text-4xl'><FaCloudUploadAlt /></span>
                                <p className='text-sm'>Upload Service Image</p>
                                <input type='file' id='uploadImageInput' className='hidden' onChange={handleUploadImage} />
                            </div>
                        </div>
                    </label>

                    <div>
                        {data.imageUrl ? (
                            <div className='relative group w-fit'>
                                <img
                                    src={data.imageUrl}
                                    alt="Category"
                                    width={80}
                                    height={80}
                                    className='bg-slate-100 border cursor-pointer'
                                    onClick={() => setOpenFullScreenImage(true)}
                                />
                                <div
                                    className='absolute bottom-0 right-0 p-1 text-white bg-red-600 rounded-full hidden group-hover:block cursor-pointer'
                                    onClick={handleDeleteImage}
                                >
                                    <MdDelete />
                                </div>
                            </div>
                        ) : (
                            <p className='text-red-600 text-xs'>* Please Upload Service Image</p>
                        )}
                    </div>

                    <button className='px-3 py-2 bg-red-600 text-white mt-4 mb-10 hover:bg-red-700'>
                        Update Service
                    </button>
                </form>
            </div>

            {openFullScreenImage && (
                <DisplayImage onClose={() => setOpenFullScreenImage(false)} imgUrl={data.imageUrl} />
            )}
        </div>
    );
};

export default AdminEditCategory;