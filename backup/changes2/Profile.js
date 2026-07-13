import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Bell,
  Camera,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  Pencil,
  Phone,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import SummaryApi from '../common';
import { setUserDetails, logout } from '../store/userSlice';
import EditProfileModal from '../components/EditProfileModal';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import CookieManager from '../utils/cookieManager';
import StorageService from '../utils/storageService';
import { useOnlineStatus } from '../App';
import DashboardLayout from '../components/DashboardLayout';
import { isOrderApproved } from '../helpers/orderVisibility';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const user = useSelector((state) => state?.user?.user);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeProject, setActiveProject] = useState(null);

  const fetchActiveProject = useCallback(async () => {
    try {
      if (!isOnline) return;
      const response = await fetch(SummaryApi.ordersList.url, {
        method: SummaryApi.ordersList.method,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        const active = (data.data || []).find((order) => {
          const category = order.productId?.category?.toLowerCase();
          const isProject = ['standard_websites', 'dynamic_websites', 'cloud_software_development', 'app_development'].includes(category);
          return isProject && isOrderApproved(order) && order.orderVisibility !== 'payment-rejected' && (order.projectProgress < 100 || order.currentPhase !== 'completed');
        });
        setActiveProject(active || null);
      }
    } catch (error) {
      console.error('Error fetching active project:', error);
    }
  }, [isOnline]);

  const fetchUserDetails = useCallback(async () => {
    setLoading(true);
    try {
      const cachedUser = StorageService.getUserDetails();
      if (cachedUser) {
        dispatch(setUserDetails(cachedUser));
        setLoading(false);
      }
      if (isOnline) {
        const response = await fetch(SummaryApi.current_user.url, {
          method: SummaryApi.current_user.method,
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          dispatch(setUserDetails(data.data));
          StorageService.setUserDetails(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, isOnline]);

  useEffect(() => {
    fetchUserDetails();
    fetchActiveProject();
  }, [fetchActiveProject, fetchUserDetails]);

  const handleLogout = async () => {
    try {
      const guestSlides = StorageService.getGuestSlides();
      if (guestSlides?.length > 0) {
        sessionStorage.setItem('sessionGuestSlides', JSON.stringify(guestSlides));
        localStorage.setItem('preservedGuestSlides', JSON.stringify(guestSlides));
      }
      if (isOnline) {
        const response = await fetch(SummaryApi.logout_user.url, {
          method: SummaryApi.logout_user.method,
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) toast.success(data.message);
      }
      CookieManager.clearAll();
      StorageService.clearUserData();
      dispatch(logout());
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    setUpdateLoading(true);
    try {
      if (!isOnline) {
        toast.error('You are offline. Please check your internet connection.');
        return;
      }
      const response = await fetch(SummaryApi.updateProfile.url, {
        method: SummaryApi.updateProfile.method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to update profile');
        return;
      }
      CookieManager.setUserDetails({
        _id: data.data._id,
        name: data.data.name,
        email: data.data.email,
        role: data.data.role,
      });
      StorageService.setUserDetails(data.data);
      dispatch(setUserDetails(data.data));
      setShowEditModal(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleFeatureUnavailable = () => toast.info('This feature is currently unavailable');
  const profileFields = [
    { label: 'Full name', value: user?.name || 'Not set', icon: User },
    { label: 'Email address', value: user?.email || 'Not set', icon: Mail },
    { label: 'Phone number', value: user?.phone || 'Not set', icon: Phone },
    { label: 'Age', value: user?.age || 'Not set', icon: Calendar },
  ];

  return (
    <DashboardLayout user={user} activeProject={activeProject}>
      <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        {(loading || updateLoading) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm"><TriangleMazeLoader /></div>}
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Account</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Profile settings</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">Manage your personal information and account preferences from one place.</p>
            </div>
            <button onClick={() => setShowEditModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"><Pencil size={16} /> Edit profile</button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
              <div className="flex flex-col items-center text-center">
                <button onClick={() => setShowEditModal(true)} className="group relative" aria-label="Edit profile photo">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-emerald-500/15 text-4xl font-bold text-emerald-300 ring-1 ring-emerald-400/30">{user?.profilePic ? <img src={user.profilePic} alt={user?.name || 'Profile'} className="h-full w-full object-cover" /> : (user?.name || 'U').trim().charAt(0).toUpperCase()}</div>
                  <span className="absolute -bottom-2 -right-2 rounded-xl bg-emerald-500 p-2 text-slate-950 shadow-lg transition group-hover:bg-emerald-400"><Camera size={16} /></span>
                </button>
                <h2 className="mt-5 text-lg font-semibold">{user?.name || 'User'}</h2>
                <p className="mt-1 max-w-full truncate text-sm text-slate-400">{user?.email || 'No email added'}</p>
                <div className="mt-6 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"><CheckCircle2 size={14} /> Active account</div>
              </div>
              <div className="mt-8 space-y-2 border-t border-white/10 pt-5">
                <Link to="/order" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><span className="flex items-center gap-3"><Package size={17} /> Your orders</span><ChevronRight size={16} /></Link>
                <Link to="/support" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><span className="flex items-center gap-3"><MessageSquare size={17} /> Contact support</span><ChevronRight size={16} /></Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"><LogOut size={17} /> Sign out</button>
              </div>
            </aside>

            <main className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center"><div><p className="flex items-center gap-2 text-lg font-semibold text-slate-950"><User size={19} className="text-emerald-600" /> Personal information</p><p className="mt-1 text-sm text-slate-500">Your basic profile details.</p></div><button onClick={() => setShowEditModal(true)} className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"><Pencil size={15} /> Edit details</button></div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">{profileFields.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><Icon size={18} className="mt-0.5 text-slate-400" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p></div></div>)}</div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="border-b border-slate-100 pb-5"><p className="flex items-center gap-2 text-lg font-semibold text-slate-950"><ShieldCheck size={19} className="text-emerald-600" /> Account & security</p><p className="mt-1 text-sm text-slate-500">Review the areas connected to your account.</p></div>
                <div className="mt-5 divide-y divide-slate-100">
                  <Link to="/privacy-policy" className="flex items-center justify-between py-4"><span className="flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-2 text-violet-600"><Lock size={16} /></span><span><span className="block text-sm font-semibold text-slate-800">Privacy & security</span><span className="block text-xs text-slate-500">Review our privacy information</span></span></span><ChevronRight size={17} className="text-slate-400" /></Link>
                  <button onClick={handleFeatureUnavailable} className="flex w-full items-center justify-between py-4 text-left"><span className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><Bell size={16} /></span><span><span className="block text-sm font-semibold text-slate-800">Notification preferences</span><span className="block text-xs text-slate-500">Notification controls will be available soon</span></span></span><ChevronRight size={17} className="text-slate-400" /></button>
                  <button onClick={handleFeatureUnavailable} className="flex w-full items-center justify-between py-4 text-left"><span className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-2 text-blue-600"><Settings size={16} /></span><span><span className="block text-sm font-semibold text-slate-800">Account preferences</span><span className="block text-xs text-slate-500">Personalize your portal experience</span></span></span><ChevronRight size={17} className="text-slate-400" /></button>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
      {showEditModal && <EditProfileModal user={user} onClose={() => setShowEditModal(false)} onUpdate={handleProfileUpdate} loading={updateLoading} />}
    </DashboardLayout>
  );
};

export default Profile;
