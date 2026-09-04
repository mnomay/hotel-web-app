import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import PublicLayout from './components/layout/PublicLayout';
import PlaceholderPage from './components/PlaceholderPage';
import BookPage from './pages/BookPage';
import ManagePage from './pages/ManagePage';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<BookPage />} />
            <Route path="manage" element={<ManagePage />} />
            <Route
              path="review"
              element={
                <PlaceholderPage
                  title="Leave a review"
                  body="Coming soon — share feedback after your stay ends."
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
