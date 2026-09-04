import { useState } from 'react';
import { changeAdminPassword } from '../../api/client';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import PasswordField from '../../components/PasswordField';
import { useToast } from '../../components/ToastProvider';

function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setSaving(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated');
    } catch (err) {
      showToast(err.message || 'Could not update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Account details for your admin login.</p>

      <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-md space-y-4">
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

          <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-gray-900">Change password</h2>

            <PasswordField
              label="Current password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <PasswordField
              label="New password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button type="submit" disabled={saving} className="btn-primary sm:w-auto sm:min-w-[180px]">
              {saving ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default AdminSettingsPage;
