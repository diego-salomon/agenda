import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './layout/Layout';
import { BookPage } from './pages/BookPage';
import { AgendaPage } from './pages/AgendaPage';
import { MyBookingPage } from './pages/MyBookingPage';
import { AdminPage } from './pages/AdminPage';
import { CentroPage } from './pages/CentroPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<BookPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/mi-turno" element={<MyBookingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/centro" element={<CentroPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
