import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import PlaceholderPage from './components/PlaceholderPage';
import BookPage from './pages/BookPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<BookPage />} />
          <Route
            path="manage"
            element={
              <PlaceholderPage
                title="Manage booking"
                body="Coming in the next steps — look up your stay with a confirmation code."
              />
            }
          />
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
  );
}

export default App;
