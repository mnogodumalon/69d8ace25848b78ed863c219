import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ActionsProvider } from '@/context/ActionsContext';
import KategorienPage from '@/pages/KategorienPage';
import KontaktePage from '@/pages/KontaktePage';
import AdminPage from '@/pages/AdminPage';

export default function Dashboard() {
  return (
    <ActionsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/kategorien" replace />} />
            <Route path="/kategorien" element={<KategorienPage />} />
            <Route path="/kontakte" element={<KontaktePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/kategorien" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ActionsProvider>
  );
}
