import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, Mail, Phone, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import SummaryApi from '../common';
import { setUserDetails } from '../store/userSlice';
import TriangleMazeLoader from '../components/TriangleMazeLoader';
import DashboardLayout from '../components/DashboardLayout';
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
    setFormData((current) => ({ ...current, [name]: value }));
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
      <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        {(loading || saving) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm"><TriangleMazeLoader /></div>}
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-3xl bg-white px-6 py-8 shadow-sm sm:px-10">
          <div className="border-b border-slate-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Account</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Profile settings</h1>
            <p className="mt-2 text-sm text-slate-500">Update your personal information.</p>
          </div>

          <div className="flex items-center gap-4 border-b border-slate-200 py-6">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-2xl font-bold text-slate-500">
              {formData.profilePic ? <img src={formData.profilePic} alt={formData.name || 'Profile'} className="h-full w-full object-cover" /> : (formData.name || 'U').trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <label htmlFor="profile-picture" className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"><Camera size={16} /> Change profile picture</label>
              <input id="profile-picture" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <p className="mt-1 text-xs text-slate-500">JPG, PNG or WEBP</p>
            </div>
          </div>

          <div className="space-y-6 py-7">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><User size={16} className="text-slate-400" /> Full name</span><input name="name" value={formData.name} onChange={handleChange} required className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-0" /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Mail size={16} className="text-slate-400" /> Email address</span><input name="email" value={formData.email} readOnly className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-2 text-sm text-slate-400 outline-none" /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Phone size={16} className="text-slate-400" /> Phone number</span><input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-0" /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Calendar size={16} className="text-slate-400" /> Age</span><input name="age" type="number" min="1" max="120" value={formData.age} onChange={handleChange} className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-0" /></label>
            </div>
          </div>

          {isDirty && <div className="flex justify-end border-t border-slate-200 pt-6"><button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button></div>}
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
