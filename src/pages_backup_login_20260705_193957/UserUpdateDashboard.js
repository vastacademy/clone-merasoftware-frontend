import React, { useState, useEffect } from 'react';
import SummaryApi from '../common';
import { Clock, RefreshCw } from 'lucide-react';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import UpdateRequestModal from '../components/UpdateRequestModal'

const UserUpdateDashboard = () => {
  const [updatePlans, setUpdatePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Fetch user's orders using your existing getUserOrders API
  const fetchUserUpdatePlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.ordersList.url, {
        method: SummaryApi.ordersList.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        // Filter for website update plans by category
        const userUpdatePlans = data.data.filter(order => 
          order.productId?.category === 'website_updates' && order.isActive
        );
        setUpdatePlans(userUpdatePlans || []);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching update plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserUpdatePlans();
  }, []);

  // Calculate remaining days
  const calculateRemainingDays = (plan) => {
    if (!plan.createdAt || !plan.productId?.validityPeriod) return 0;
    
    const validityInDays = plan.productId.validityPeriod;
    
    const startDate = new Date(plan.createdAt);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + validityInDays);
    
    const today = new Date();
    const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, remainingDays);
  };

  const handleRequestUpdate = (plan) => {
    setSelectedPlan(plan);
    setShowRequestModal(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <TriangleMazeLoader />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-xl font-bold mb-6">My Website Update Plans</h2>
      
      {updatePlans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600 mb-4">You don't have any active update plans.</p>
          <button 
            onClick={() => window.location.href = '/website-updates'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Update Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {updatePlans.map(plan => (
            <div key={plan._id} className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-lg mb-2">{plan.productId?.serviceName}</h3>
              
              <div className="space-y-4 mb-4">
                {/* Updates Remaining */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Updates Remaining</span>
                    <span className="font-medium">
                      {plan.productId?.updateCount - (plan.updatesUsed || 0)} of {plan.productId?.updateCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${((plan.productId?.updateCount - (plan.updatesUsed || 0)) / plan.productId?.updateCount) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Validity Period */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Validity Period</span>
                    <span className="font-medium flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {calculateRemainingDays(plan)} days left
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(calculateRemainingDays(plan) / plan.productId?.validityPeriod) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => handleRequestUpdate(plan)}
                  disabled={(plan.updatesUsed || 0) >= plan.productId?.updateCount || calculateRemainingDays(plan) <= 0}
                  className={`w-full py-2 rounded-lg font-medium flex items-center justify-center ${
                    (plan.updatesUsed || 0) >= plan.productId?.updateCount || calculateRemainingDays(plan) <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Website Update
                </button>
                
                {(plan.updatesUsed || 0) >= plan.productId?.updateCount && (
                  <p className="text-orange-600 text-xs mt-2 text-center">
                    You've used all your updates. Please purchase a new plan.
                  </p>
                )}
                
                {calculateRemainingDays(plan) <= 0 && (
                  <p className="text-orange-600 text-xs mt-2 text-center">
                    Your update plan has expired. Please purchase a new plan.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showRequestModal && selectedPlan && (
        <UpdateRequestModal 
          plan={selectedPlan} 
          onClose={() => {
            setShowRequestModal(false);
            setSelectedPlan(null);
          }}
          onSubmitSuccess={fetchUserUpdatePlans}
        />
      )}
    </div>
  );
};

export default UserUpdateDashboard;