import { useState } from 'react';
import { changeAdminPassword } from '../../api/client';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import FormError from '../../components/FormError';
import PasswordField from '../../components/PasswordField';
import { useToast } from '../../components/ToastProvider';

function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentPassword) {
      setFormError('Enter your current password');
      return;
    }

    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }

    setFormError('');
    setSaving(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated');
    } catch (err) {
      setFormError(err.message || 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Account details for your admin login.
        </p>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </span>
              <input
                type="email"
                value={admin?.email || ''}
                readOnly
                className="w-full cursor-default rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none"
              />
              <span className="mt-1.5 block text-xs text-gray-400">Email cannot be changed.</span>
            </label>

            <form
              noValidate
              onSubmit={handleSubmit}
              className="space-y-4 border-t border-gray-100 pt-6"
            >
              <FormError message={formError} />
              <h2 className="text-sm font-semibold text-gray-900">Change password</h2>

              <PasswordField
                label="Current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (formError) setFormError('');
                }}
              />

              <PasswordField
                label="New password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (formError) setFormError('');
                }}
              />

              <PasswordField
                label="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formError) setFormError('');
                }}
              />

              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminSettingsPage;
