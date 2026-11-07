import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

const CURRENCIES = [
  { symbol: '₹', name: '₹ Indian Rupee (INR)' },
  { symbol: '$', name: '$ US Dollar (USD)' },
  { symbol: '€', name: '€ Euro (EUR)' },
  { symbol: '£', name: '£ British Pound (GBP)' },
  { symbol: '¥', name: '¥ Japanese Yen (JPY)' }
];

export const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();

  // Profile update
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || '₹');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password update
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  // Logout modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Delete account modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setSavingProfile(true);

    try {
      const res = await api.updateProfile({
        full_name: fullName.trim(),
        currency: selectedCurrency
      });
      updateUser(res.user);
      setCurrency(res.user.currency);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingPw(true);
    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await api.deleteAccount({ password: deletePassword });
      setShowDeleteConfirm(false);
      await logout();
      navigate('/register');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Check password.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{user?.full_name}</h3>
            <p className="text-xs text-neutral-500">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="px-4 py-2 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Information & Currency */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-neutral-200 shadow-subtle space-y-5">
        <div>
          <h4 className="text-base font-bold text-neutral-950">Profile Information</h4>
          <p className="text-xs text-neutral-500">Update your account name and standard currency</p>
        </div>

        {profileMsg.text && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              profileMsg.type === 'success'
                ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                : 'bg-neutral-100 text-neutral-900 border border-neutral-400'
            }`}
          >
            {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-black" /> : <AlertTriangle className="w-4 h-4 text-black" />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Email Address (Verified)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg text-sm text-neutral-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Currency Preference
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-900 focus:outline-none focus:border-black"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Account Created
              </label>
              <div className="px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-neutral-200 shadow-subtle space-y-5">
        <div>
          <h4 className="text-base font-bold text-neutral-950">Security & Password</h4>
          <p className="text-xs text-neutral-500">Update your account login password</p>
        </div>

        {pwMsg.text && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              pwMsg.type === 'success'
                ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                : 'bg-neutral-100 text-neutral-900 border border-neutral-400'
            }`}
          >
            {pwMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-black" /> : <AlertTriangle className="w-4 h-4 text-black" />}
            <span>{pwMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPw}
              className="px-5 py-2.5 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Deletion */}
      <div className="p-6 md:p-8 rounded-2xl bg-neutral-50 border border-neutral-300 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-neutral-950">Delete Account & Ledger</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-lg leading-relaxed">
              Permanently delete your profile and all associated income, expense, and budget records. This action cannot be reversed.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4 text-neutral-700" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white border border-neutral-200 shadow-modal space-y-4">
            <h4 className="text-base font-bold text-neutral-950">Confirm Sign Out</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to end your current session?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-neutral-800 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-neutral-300 shadow-modal space-y-4">
            <h4 className="text-base font-bold text-neutral-950">Permanently Delete Account?</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Please enter your password to confirm permanent deletion of your account and financial ledger.
            </p>

            {deleteError && (
              <div className="p-2.5 text-xs font-semibold text-neutral-900 bg-neutral-100 border border-neutral-300 rounded-lg">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password to verify"
                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-neutral-800 rounded-lg disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
