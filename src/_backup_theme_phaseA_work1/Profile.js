import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, Mail, Phone, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import { setUserDetails } from '../store/userSlice';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
import backgroundImage from '../assets/BG.png';
import StorageService from '../utils/storageService';
import CookieManager from '../utils/cookieManager';
import uploadImage from '../helpers/uploadImage';
import { useOnlineStatus } from '../App';

const getFormData = (user) => ({
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  age: user?.age || '',
  profilePic: user?.profilePic || '',
});

const Profile = () => {
  const dispatch = useDispatch();
  const { isOnline } = useOnlineStatus();
  const user = useSelector((state) => state?.user?.user);
  const [formData, setFormData] = useState(() => getFormData(user));
  const [initialFormData, setInitialFormData] = useState(() => getFormData(user));
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    try {
      const cachedUser = StorageService.getUserDetails();
      if (cachedUser) {
        dispatch(setUserDetails(cachedUser));
        setFormData(getFormData(cachedUser));
        setInitialFormData(getFormData(cachedUser));
        setLoading(false);
      }

      if (!isOnline) return;
      const response = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        dispatch(setUserDetails(data.data));
        StorageService.setUserDetails(data.data);
        setFormData(getFormData(data.data));
        setInitialFormData(getFormData(data.data));
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, isOnline]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const isDirty = Boolean(selectedImage) || Object.keys(initialFormData).some((key) => formData[key] !== initialFormData[key]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'phone' || name === 'age' ? value.replace(/\D/g, '') : value;
    setFormData((current) => ({ ...current, [name]: nextValue }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setFormData((current) => ({ ...current, profilePic: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isDirty || saving) return;
    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    setSaving(true);
    try {
      let profilePic = formData.profilePic;
      if (selectedImage) {
        const imageData = await uploadImage(selectedImage);
        profilePic = imageData.url;
      }

      const response = await fetch(SummaryApi.updateProfile.url, {
        method: SummaryApi.updateProfile.method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          age: formData.age,
          profilePic,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to update profile');

      CookieManager.setUserDetails({
        _id: data.data._id,
        name: data.data.name,
        email: data.data.email,
        role: data.data.role,
      });
      StorageService.setUserDetails(data.data);
      dispatch(setUserDetails(data.data));
      setSelectedImage(null);
      setFormData(getFormData(data.data));
      setInitialFormData(getFormData(data.data));
      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout user={user} activeProject={null}>
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
        {(loading || saving) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm"><TriangleMazeLoader /></div>}

        <form onSubmit={handleSubmit} className="relative mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              Account
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Profile settings
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
              Update your personal information.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-2xl font-bold text-white backdrop-blur-md">
                  {formData.profilePic ? <img src={formData.profilePic} alt={formData.name || 'Profile'} className="h-full w-full object-cover" /> : (formData.name || 'U').trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <label htmlFor="profile-picture" className="inline-flex cursor-pointer items-center gap-2 text-base font-semibold text-emerald-400 hover:text-emerald-300"><Camera size={16} /> Change profile picture</label>
                  <input id="profile-picture" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <p className="mt-1 text-sm text-slate-300">JPG, PNG or WEBP</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />
              <div className="relative grid gap-6 sm:grid-cols-2">
                <label className="block"><span className="mb-2 flex items-center gap-2 text-base font-semibold text-white"><User size={16} className="text-slate-400" /> Full name</span><input name="name" value={formData.name} onChange={handleChange} required className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-2 text-base text-white outline-none transition focus:border-emerald-400 focus:ring-0" /></label>
                <label className="block"><span className="mb-2 flex items-center gap-2 text-base font-semibold text-white"><Mail size={16} className="text-slate-400" /> Email address</span><input name="email" value={formData.email} readOnly className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-2 text-base text-white outline-none" /></label>
                <label className="block"><span className="mb-2 flex items-center gap-2 text-base font-semibold text-white"><Phone size={16} className="text-slate-400" /> Phone number</span><input name="phone" type="tel" inputMode="numeric" pattern="[0-9]*" value={formData.phone} onChange={handleChange} className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-2 text-base text-white outline-none transition focus:border-emerald-400 focus:ring-0" /></label>
                <label className="block"><span className="mb-2 flex items-center gap-2 text-base font-semibold text-white"><Calendar size={16} className="text-slate-400" /> Age</span><input name="age" type="text" inputMode="numeric" pattern="[0-9]*" maxLength="3" value={formData.age} onChange={handleChange} className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-2 text-base text-white outline-none transition focus:border-emerald-400 focus:ring-0" /></label>
              </div>
            </div>

            <div className="flex justify-end"><button type="submit" disabled={!isDirty || saving} className={`rounded-xl border px-6 py-3 text-base font-semibold backdrop-blur-md transition ${isDirty && !saving ? 'border-emerald-400/40 bg-emerald-500/20 text-white hover:bg-emerald-500/35' : 'cursor-not-allowed border-white/10 bg-white/5 text-slate-400'}`}>{saving ? 'Saving...' : 'Save changes'}</button></div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
