import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api/client';
import PasswordField from '../../components/PasswordField';
import { useToast } from '../../components/ToastProvider';
import { useAdminAuth } from '../../admin/AdminAuthContext';

function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { admin, loading, setAdmin } = useAdminAuth();
  const [email, setEmail] = useState('admin@hotel.local');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && admin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await adminLogin(email, password);
      setAdmin(data);
      showToast('Signed in');
      navigate('/admin', { replace: true });
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:h-16 sm:px-6">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[#ff385c] sm:text-xl"
          >
            Willow House
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-search sm:p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Admin sign in</h1>
          <p className="mt-2 text-sm text-gray-500">
            Staff access for Willow House operations.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </span>
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-900 focus:bg-white"
              />
            </label>
            <PasswordField
              label="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/" className="font-medium text-gray-900 hover:underline">
              Back to guest site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminLoginPage;
