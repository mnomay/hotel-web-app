import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './admin/AdminAuthContext';
import { ToastProvider } from './components/ToastProvider';
import PublicLayout from './components/layout/PublicLayout';
import BookPage from './pages/BookPage';
import ManagePage from './pages/ManagePage';
import ReviewPage from './pages/ReviewPage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminBookingDetailPage from './pages/admin/AdminBookingDetailPage';
import AdminDinnersPage from './pages/admin/AdminDinnersPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminShell from './pages/admin/AdminShell';

function GuestOnlyLayout() {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-gray-500 sm:px-6">
        Loading…
      </main>
    );
  }

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  return <PublicLayout />;
}

function FallbackRoute() {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return null;
  }

  return <Navigate to={admin ? '/admin' : '/'} replace />;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AdminAuthProvider>
          <Routes>
            <Route element={<GuestOnlyLayout />}>
              <Route index element={<BookPage />} />
              <Route path="manage" element={<ManagePage />} />
              <Route path="review" element={<ReviewPage />} />
            </Route>

            <Route path="/admin">
              <Route path="login" element={<AdminLoginPage />} />
              <Route element={<AdminShell />}>
                <Route index element={<AdminHomePage />} />
                <Route
                  path="bookings/:confirmationCode"
                  element={<AdminBookingDetailPage />}
                />
                <Route path="dinners" element={<AdminDinnersPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<FallbackRoute />} />
          </Routes>
        </AdminAuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
