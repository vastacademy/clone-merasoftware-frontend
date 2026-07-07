// components/Profile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Camera, LogOut, Edit, ChevronRight, Settings, 
  Mail, Phone, Calendar, ShoppingCart, Wallet, Lock, Bell, Package, MessageSquare
} from 'lucide-react';
import SummaryApi from '../common';
import { setUserDetails, logout } from '../store/userSlice';
import EditProfileModal from '../components/EditProfileModal';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import Context from '../context';
import CookieManager from '../utils/cookieManager';
import StorageService from '../utils/storageService';
import { useOnlineStatus } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { isOrderApproved } from '../helpers/orderVisibility';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isOnline } = useOnlineStatus();
    const user = useSelector(state => state?.user?.user);
    const context = useContext(Context);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [editField, setEditField] = useState(null);
    const [activeProject, setActiveProject] = useState(null);

    useEffect(() => {
        fetchUserDetails();
        fetchActiveProject(); 
    }, []);

    const fetchActiveProject = async () => {
        try {
            if (!isOnline) return;
            
            const response = await fetch(SummaryApi.ordersList.url, {
                method: SummaryApi.ordersList.method,
                credentials: 'include'
            });
            
            const data = await response.json();
            if (data.success) {
                // Find active (in-progress) project
                const allOrders = data.data || [];
                const activeProj = allOrders.find(order => {
                    const category = order.productId?.category?.toLowerCase();
                    if (!category) return false;
                    
                    // Only consider website projects, not update plans
                    if (['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(category)) {
                        if (!isOrderApproved(order) || order.orderVisibility === 'payment-rejected') {
                            return false; // Don't show as active if pending approval or rejected
                        }
    
                        return order.projectProgress < 100 || order.currentPhase !== 'completed';
                    }
                    return false;
                });
                
                setActiveProject(activeProj || null);
            }
        } catch (error) {
            console.error("Error fetching active project:", error);
        }
    };

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            // First check localStorage
            const cachedUser = StorageService.getUserDetails();
            if (cachedUser) {
                dispatch(setUserDetails(cachedUser));
                setLoading(false);
            }

            // If online, fetch fresh data
            if (isOnline) {
                const response = await fetch(SummaryApi.current_user.url, {
                    method: SummaryApi.current_user.method,
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    // Update both Redux and localStorage
                    dispatch(setUserDetails(data.data));
                    StorageService.setUserDetails(data.data);
                }
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // 1. Preserve guest slides
            const guestSlides = StorageService.getGuestSlides();
            if (guestSlides?.length > 0) {
                sessionStorage.setItem('sessionGuestSlides', JSON.stringify(guestSlides));
                localStorage.setItem('preservedGuestSlides', JSON.stringify(guestSlides));
                localStorage.setItem('lastLogoutTimestamp', Date.now().toString());
            }

            // 2. Call logout API if online
            if (isOnline) {
                const response = await fetch(SummaryApi.logout_user.url, {
                    method: SummaryApi.logout_user.method,
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    toast.success(data.message);
                }
            }

            // 3. Clear user data
            CookieManager.clearAll();
            StorageService.clearUserData();

            // 4. Restore guest slides if needed
            const preserved = localStorage.getItem('preservedGuestSlides');
            const sessionBackup = sessionStorage.getItem('sessionGuestSlides');
            
            if (!localStorage.getItem('guestSlides') && (preserved || sessionBackup)) {
                localStorage.setItem('guestSlides', preserved || sessionBackup);
            }

            // 5. Dispatch logout and navigate
            dispatch(logout());
            navigate("/");

        } catch (error) {
            console.error("Error during logout:", error);
            toast.error("Logout failed. Please try again.");
        }
    };

    const handleProfileUpdate = async (updatedData) => {
        setUpdateLoading(true);
        try {
            if (!isOnline) {
                toast.error("You are offline. Please check your internet connection.");
                return;
            }

            const response = await fetch(SummaryApi.updateProfile.url, {
                method: SummaryApi.updateProfile.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Update both cookies and localStorage
                CookieManager.setUserDetails({
                    _id: data.data._id,
                    name: data.data.name,
                    email: data.data.email,
                    role: data.data.role
                });
                StorageService.setUserDetails(data.data);
                
                dispatch(setUserDetails(data.data));
                setShowEditModal(false);
                setEditField(null);
                toast.success("Profile updated successfully");
            } else {
                toast.error(data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleFeatureUnavailable = () => {
        toast.info("This feature is currently unavailable");
    };

    return (
        <DashboardLayout user={user}
        activeProject={activeProject}>
            <div className="bg-gray-50 min-h-screen">
                {(loading || updateLoading) && (
                    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
                        <div className="rounded-lg p-8">
                            <TriangleMazeLoader />
                        </div>
                    </div>
                )}

                <div className="container mx-auto p-4">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Header with title */}
                        <div className="bg-blue-600 px-6 py-4">
                            <h1 className="text-xl md:text-2xl font-bold text-white">Profile Settings</h1>
                        </div>
                        
                        <div className="md:flex">
                            {/* Left sidebar with profile picture */}
                            <div className="md:w-1/3 bg-gray-50 p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-200">
                                <div className="relative group">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                                        {user?.profilePic ? (
                                            <img 
                                                src={user.profilePic} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-4xl font-semibold">
                                                {user?.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <label 
                                        htmlFor="profile-pic-upload" 
                                        className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-3 cursor-pointer shadow-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <Camera size={20} className="text-white" />
                                        <input 
                                            type="file" 
                                            id="profile-pic-upload" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                // Implement profile pic change functionality here
                                                toast.info("Profile picture upload will be available soon");
                                            }}
                                        />
                                    </label>
                                </div>
                                
                                <h2 className="mt-4 text-xl font-semibold text-gray-800">{user?.name}</h2>
                                <p className="text-gray-500 mb-6">{user?.email}</p>

                                 {/* Quick Links Section */}
          <div className="mt-6 w-full">
            <h3 className="text-lg font-medium mb-3">Quick Links</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {/* Your Orders Quick Link */}
              <Link to={"/order"}>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors p-2 rounded">
                <div className="flex items-center">
                  <Package size={18} className="text-blue-500 mr-2" />
                  <span className='text-sm font-medium text-gray-800'>Your Orders</span>
                </div>
                <span className="text-gray-400">›</span>
              </div>
              </Link>

              {/* Contact Support Quick Link */}
              <Link to={"/support"}>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors p-2 rounded">
                <div className="flex items-center">
                  <MessageSquare size={18} className="text-blue-500 mr-2" />
                  <span className='text-sm font-medium text-gray-800'>Contact Support</span>
                </div>
                <span className="text-gray-400">›</span>
              </div>
              </Link>
            </div>
          </div>
                                
                                {/* Logout button in sidebar */}
                                <button 
                                    onClick={handleLogout}
                                    className="mt-auto w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                >
                                    <LogOut size={18} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                            
                            {/* Right content area */}
                            <div className="md:w-2/3 p-6">
                                <div className="space-y-6">
                                    {/* Personal Information Section */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                                            <User size={20} className="text-blue-500" />
                                            Personal Information
                                        </h3>
                                        
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <User className="text-gray-400" size={20} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                                                        <p className="text-xs text-gray-500">Full Name</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                                                    onClick={() => setEditField('name')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="text-gray-400" size={20} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                                                        <p className="text-xs text-gray-500">Email Address</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                                                    onClick={() => setEditField('email')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="text-gray-400" size={20} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{user?.phone || 'Not set'}</p>
                                                        <p className="text-xs text-gray-500">Phone Number</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                                                    onClick={() => setEditField('phone')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="text-gray-400" size={20} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{user?.age || 'Not set'}</p>
                                                        <p className="text-xs text-gray-500">Age</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                                                    onClick={() => setEditField('age')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Account Settings Section */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                                            <Settings size={20} className="text-blue-500" />
                                            Account Settings
                                        </h3>
                                        
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <button 
                                                className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 text-left"
                                                onClick={handleFeatureUnavailable}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-full">
                                                        <Settings size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium">Account Preferences</span>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-400" />
                                            </button>
                                            
                                            <Link 
                                                to="/privacy-policy"
                                                className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-50 text-purple-500 rounded-full">
                                                        <Lock size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium">Privacy & Security</span>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-400" />
                                            </Link>
                                            
                                            <button 
                                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                                                onClick={handleFeatureUnavailable}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-50 text-green-500 rounded-full">
                                                        <Bell size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium">Notification Settings</span>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Links */}
                                    {/* <div>
                                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                                            <ShoppingCart size={20} className="text-blue-500" />
                                            Quick Links
                                        </h3>
                                        
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <Link 
                                                to="/order"
                                                className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-full">
                                                        <ShoppingCart size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium">Your Orders</span>
                                                        <p className="text-xs text-gray-500">Track, return, or buy things again</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-400" />
                                            </Link>
                                            
                                            <Link 
                                                to="/cart"
                                                className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-full relative">
                                                        <ShoppingCart size={16} />
                                                        {context?.cartProductCount > 0 && (
                                                            <div className="absolute -top-2 -right-2 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-xs">
                                                                {context?.cartProductCount}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium">Your Cart</span>
                                                        <p className="text-xs text-gray-500">
                                                            {context?.cartProductCount || 0} items in cart
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-400" />
                                            </Link>
                                            
                                            <Link 
                                                to="/wallet"
                                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-full">
                                                        <Wallet size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium">Your Wallet</span>
                                                        <p className="text-xs text-gray-500">
                                                            Balance: ₹{context?.walletBalance || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-400" />
                                            </Link>
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal - Show based on which field is being edited */}
            {editField && (
                <EditProfileModal
                    user={user}
                    onClose={() => setEditField(null)}
                    onUpdate={handleProfileUpdate}
                    loading={updateLoading}
                    initialField={editField}
                />
            )}
        </DashboardLayout>
    );
};

export default Profile;
