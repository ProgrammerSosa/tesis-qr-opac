import { createBrowserRouter } from 'react-router-dom';
import Layout from '../shared/components/Layout';
import KioskHomePage from '../features/kiosk/KioskHomePage';
import OpacSearchPage from '../features/catalog/OpacSearchPage';
import ThesisDetailPage from '../features/catalog/ThesisDetailPage';
import StudyRoomPage from '../features/reservas/StudyRoomPage';
import SolvenciaPage from '../features/solvencia/SolvenciaPage';
import AdminDashboardPage from '../features/admin/AdminDashboardPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <KioskHomePage /> },
      { path: '/catalogo', element: <OpacSearchPage /> },
      { path: '/tesis/:id', element: <ThesisDetailPage /> },
      { path: '/sala-de-estudio', element: <StudyRoomPage /> },
      { path: '/solvencia', element: <SolvenciaPage /> },
      { path: '/admin', element: <AdminDashboardPage /> },
    ],
  },
]);
