import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import UploadDeveloper from '../components/UploadDeveloper';
import EditDeveloper from '../components/EditDeveloper';
import SummaryApi from '../common';

const AllDevelopers = () => {
  const [developers, setDevelopers] = useState([]);
  const [openUploadDeveloper, setOpenUploadDeveloper] = useState(false);
  const [openEditDeveloper, setOpenEditDeveloper] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);

  const fetchDevelopers = async () => {
    try {
      const response = await fetch(SummaryApi.allDevelopers.url, {
        credentials: 'include' // Add this to include cookies for authentication
    });
      const data = await response.json();
      if (data.success) {
        setDevelopers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching developers:', error);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  return (
    <div>
      <div className="bg-white px-2 py-2 flex justify-between items-center">
        <h2 className="font-bold text-lg">All Developers</h2>
        <div className="text-sm text-gray-600">
            To add a new developer, change a user's role to DEVELOPER in the All Users section.
        </div>
        {/* <button 
          className="border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all py-1 px-3 rounded-full"
          onClick={() => setOpenUploadDeveloper(true)}
        >
          Add New Developer
        </button> */}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {developers.map((developer, index) => (
              <tr key={developer._id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {developer.avatar && (
                      <img
                        className="h-8 w-8 rounded-full mr-2"
                        src={developer.avatar}
                        alt={developer.name}
                      />
                    )}
                    {developer.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{developer.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{developer.department}</td>
                <td className="px-6 py-4 whitespace-nowrap">{developer.designation}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    developer.status === 'Available' ? 'bg-green-100 text-green-800' :
                    developer.status === 'Working' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {developer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(developer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-green-600 cursor-pointer">
                  <FaEdit onClick={() => {
                    setSelectedDeveloper(developer);
                    setOpenEditDeveloper(true);
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openUploadDeveloper && (
        <UploadDeveloper 
          onClose={() => setOpenUploadDeveloper(false)} 
          fetchData={fetchDevelopers}
        />
      )}
      
      {openEditDeveloper && selectedDeveloper && (
        <EditDeveloper
          onClose={() => {
            setOpenEditDeveloper(false);
            setSelectedDeveloper(null);
          }}
          fetchData={fetchDevelopers}
          developerData={selectedDeveloper}
        />
      )}
    </div>
  );
};

export default AllDevelopers;