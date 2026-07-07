import React, { useState } from 'react';
import { FaCloudUploadAlt } from "react-icons/fa";
import { CgClose } from "react-icons/cg";
import { toast } from 'sonner';
import Select from 'react-select';
import uploadImage from '../helpers/uploadImage';
import SummaryApi from '../common';

const designationOptions = [
  { value: 'Junior Developer', label: 'Junior Developer' },
  { value: 'Senior Developer', label: 'Senior Developer' },
  { value: 'Team Lead', label: 'Team Lead' },
  { value: 'Project Manager', label: 'Project Manager' }
];

const departmentOptions = [
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Backend', label: 'Backend' },
  { value: 'Full Stack', label: 'Full Stack' },
  { value: 'Mobile Development', label: 'Mobile Development' }
];

const expertiseLevelOptions = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Expert', label: 'Expert' }
];

const UploadDeveloper = ({ onClose, fetchData }) => {
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    employeeId: '',
    expertise: [],
    experience: {
      totalYears: 0,
      previousCompanies: []
    },
    workload: {
      maxProjects: 3,
      maxUpdatesPerDay: 2
    },
    availability: {
      timeZone: 'UTC+5:30',
      workingHours: {
        start: '09:00',
        end: '18:00'
      }
    },
    avatar: ''
  });

  const [avatarPreview, setAvatarPreview] = useState('');
  const [expertise, setExpertise] = useState([]);
  const [newCompany, setNewCompany] = useState({
    companyName: '',
    position: '',
    duration: ''
  });

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExpertiseChange = () => {
    setData(prev => ({
      ...prev,
      expertise
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    const uploadedImage = await uploadImage(file);
    setAvatarPreview(URL.createObjectURL(file));
    setData(prev => ({
      ...prev,
      avatar: uploadedImage.url
    }));
  };

  const addPreviousCompany = () => {
    setData(prev => ({
      ...prev,
      experience: {
        ...prev.experience,
        previousCompanies: [...prev.experience.previousCompanies, newCompany]
      }
    }));
    setNewCompany({ companyName: '', position: '', duration: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(SummaryApi.uploadDeveloper.url, {
        method: SummaryApi.uploadDeveloper.method,
        credentials : 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result?.message);
        onClose();
        fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error creating developer');
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed w-full h-full bg-slate-200 bg-opacity-40 top-0 left-0 right-0 bottom-0 flex justify-center items-center">
      <div className="bg-white p-4 rounded w-full max-w-2xl h-full max-h-[75%] overflow-hidden">
        <div className="flex justify-between items-center pb-3">
          <h2 className="font-bold text-lg">Add New Developer</h2>
          <div className="text-2xl hover:text-red-600 cursor-pointer" onClick={onClose}>
            <CgClose/>
          </div>
        </div>

        <form className="grid p-4 gap-2 overflow-y-scroll h-full pb-5" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                Profile Picture
              </label>
              <div className="mt-1 flex items-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded-full"
                  />
                ) : (
                  <label htmlFor="avatarInput" className="cursor-pointer">
                    <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                      <FaCloudUploadAlt className="h-8 w-8 text-gray-400" />
                    </div>
                    <input
                      type="file"
                      id="avatarInput"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      accept="image/*"
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={data.name}
                onChange={handleOnChange}
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={data.email}
                  onChange={handleOnChange}
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  value={data.phone}
                  onChange={handleOnChange}
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                  Designation
                </label>
                <Select
                  options={designationOptions}
                  value={designationOptions.find(option => option.value === data.designation)}
                  onChange={(option) => setData(prev => ({
                    ...prev,
                    designation: option.value
                  }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <Select
                  options={departmentOptions}
                  value={departmentOptions.find(option => option.value === data.department)}
                  onChange={(option) => setData(prev => ({
                    ...prev,
                    department: option.value
                  }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                id="employeeId"
                required
                value={data.employeeId}
                onChange={handleOnChange}
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Developer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDeveloper;