import { createBrowserRouter } from 'react-router-dom';
import Layout from '../shared/components/Layout';
import KioskHomePage from '../features/kiosk/KioskHomePage';
import OpacSearchPage from '../features/catalog/OpacSearchPage';
import ThesisDetailPage from '../features/catalog/ThesisDetailPage';
import ThesisDocumentPage from '../features/catalog/ThesisDocumentPage';
import StudyRoomPage from '../features/reservas/StudyRoomPage';
import SolvenciaPage from '../features/solvencia/SolvenciaPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <KioskHomePage /> },
      { path: '/catalogo', element: <OpacSearchPage /> },
      { path: '/tesis/:id', element: <ThesisDetailPage /> },
      { path: '/tesis/:id/documento', element: <ThesisDocumentPage /> },
      { path: '/sala-de-estudio', element: <StudyRoomPage /> },
      { path: '/solvencia', element: <SolvenciaPage /> },
      // El panel del personal se descarga solo cuando alguien entra a /admin: el público y los kioscos no cargan ese código.
      { path: '/admin', lazy: async () => ({ Component: (await import('../features/admin/AdminDashboardPage')).default }) },
    ],
  },
]);
