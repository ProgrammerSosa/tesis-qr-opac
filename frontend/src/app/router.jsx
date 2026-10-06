import { createBrowserRouter } from 'react-router-dom';
import Layout from '../shared/components/Layout';
import KioskHomePage from '../features/kiosk/KioskHomePage';
import OpacSearchPage from '../features/catalog/OpacSearchPage';
import ThesisDetailPage from '../features/catalog/ThesisDetailPage';
import ReservationPage from '../features/reservas/ReservationPage';
import SolvenciaPage from '../features/solvencia/SolvenciaPage';
import AdminDashboardPage from '../features/admin/AdminDashboardPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <KioskHomePage /> },
      { path: '/catalogo', element: <OpacSearchPage /> },
      { path: '/tesis/:id', element: <ThesisDetailPage /> },
      { path: '/cubiculos', element: <ReservationPage tipo="cubiculo" /> },
      { path: '/espacios-estudio', element: <ReservationPage tipo="espacio_estudio" /> },
      { path: '/solvencia', element: <SolvenciaPage /> },
      { path: '/admin', element: <AdminDashboardPage /> },
    ],
  },
]);
