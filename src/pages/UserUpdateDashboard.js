import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import SummaryApi from '../common';
import { Clock, RefreshCw, Sparkles } from 'lucide-react';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
import UpdateRequestModal from '../components/UpdateRequestModal'

const UserUpdateDashboard = () => {
  const user = useSelector((state) => state?.user?.user);
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
      <DashboardLayout user={user}>
        <div className="fixed inset-0 flex items-center justify-center">
          <TriangleMazeLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_50%,_#f8fafc_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="rounded-t-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold uppercase text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              My Updates
            </div>
            <h1 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-white">
              My Website Update Plans
            </h1>
          </div>

          <div className="p-5 sm:p-6">
            {updatePlans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-base text-black mb-4">You don't have any active update plans.</p>
                <button
                  onClick={() => window.location.href = '/website-updates'}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-blue-700"
                >
                  Browse Update Plans
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {updatePlans.map(plan => (
                  <div key={plan._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                    <h3 className="text-lg font-semibold text-black mb-2">{plan.productId?.serviceName}</h3>

                    <div className="space-y-4 mb-4">
                      {/* Updates Remaining */}
                      <div>
                        <div className="flex justify-between text-sm text-black mb-1">
                          <span>Updates Remaining</span>
                          <span className="text-base font-medium text-black">
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
                        <div className="flex justify-between text-sm text-black mb-1">
                          <span>Validity Period</span>
                          <span className="text-base font-medium text-black flex items-center">
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
                        className={`w-full py-2 rounded-lg text-base font-medium flex items-center justify-center ${
                          (plan.updatesUsed || 0) >= plan.productId?.updateCount || calculateRemainingDays(plan) <= 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Request Website Update
                      </button>

                      {(plan.updatesUsed || 0) >= plan.productId?.updateCount && (
                        <p className="text-orange-600 text-sm mt-2 text-center">
                          You've used all your updates. Please purchase a new plan.
                        </p>
                      )}

                      {calculateRemainingDays(plan) <= 0 && (
                        <p className="text-orange-600 text-sm mt-2 text-center">
                          Your update plan has expired. Please purchase a new plan.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

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
    </DashboardLayout>
  );
};

export default UserUpdateDashboard;