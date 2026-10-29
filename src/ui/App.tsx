import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './layout/Layout';
import { BookPage } from './pages/BookPage';
import { LandingPage } from './pages/LandingPage';
import { AgendaPage } from './pages/AgendaPage';
import { MyBookingPage } from './pages/MyBookingPage';
import { AdminPage } from './pages/AdminPage';
import { CentroPage } from './pages/CentroPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Strip the trailing slash so React Router's basename is happy ('' for root,
// '/agenda' under a Pages project path). Vite fills BASE_URL from `base`.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Layout>
        <Routes>
          <Route path="/" element={<BookPage />} />
          <Route path="/plantilla" element={<LandingPage />} />
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
