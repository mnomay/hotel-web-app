import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import PublicLayout from './components/layout/PublicLayout';
import BookPage from './pages/BookPage';
import ManagePage from './pages/ManagePage';
import ReviewPage from './pages/ReviewPage';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<BookPage />} />
            <Route path="manage" element={<ManagePage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
