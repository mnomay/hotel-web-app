import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './admin/AdminAuthContext';
import { ToastProvider } from './components/ToastProvider';
import PublicLayout from './components/layout/PublicLayout';
import BookPage from './pages/BookPage';
import ManagePage from './pages/ManagePage';
import ReviewPage from './pages/ReviewPage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminBookingDetailPage from './pages/admin/AdminBookingDetailPage';
import AdminDinnersPage from './pages/admin/AdminDinnersPage';
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage';
import AdminShell from './pages/admin/AdminShell';

function AdminAuthLayout() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<BookPage />} />
            <Route path="manage" element={<ManagePage />} />
            <Route path="review" element={<ReviewPage />} />
          </Route>

          <Route path="/admin" element={<AdminAuthLayout />}>
            <Route path="login" element={<AdminLoginPage />} />
            <Route element={<AdminShell />}>
              <Route index element={<AdminHomePage />} />
              <Route path="bookings/:confirmationCode" element={<AdminBookingDetailPage />} />
              <Route path="dinners" element={<AdminDinnersPage />} />
              <Route
                path="reviews"
                element={
                  <AdminPlaceholderPage
                    title="Reviews"
                    body="Admin review filters come in a later step."
                  />
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
