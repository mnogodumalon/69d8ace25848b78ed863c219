import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import KategorienPage from '@/pages/KategorienPage';
import KontaktePage from '@/pages/KontaktePage';
import PublicFormKategorien from '@/pages/public/PublicForm_Kategorien';
import PublicFormKontakte from '@/pages/public/PublicForm_Kontakte';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route path="public/69d8acd057d46e9b115574a9" element={<PublicFormKategorien />} />
            <Route path="public/69d8acd3f729704245583814" element={<PublicFormKontakte />} />
            <Route element={<Layout />}>
              <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
              <Route path="kategorien" element={<KategorienPage />} />
              <Route path="kontakte" element={<KontaktePage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
