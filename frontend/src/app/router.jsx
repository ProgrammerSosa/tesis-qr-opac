import { createBrowserRouter } from 'react-router-dom';
import Layout from '../shared/components/Layout';
import NotFoundPage from './NotFoundPage';
import PantallaDeCarga from './PantallaDeCarga';
import HomePage from '../features/inicio/HomePage';

// Cada página se descarga cuando alguien entra a ella: así el primer acceso (que en un kiosco o en un celular pesa) solo
// trae el inicio y el diseño del sitio, no todo el código de la biblioteca.
const pagina = (cargar) => ({ lazy: async () => ({ Component: (await cargar()).default }) });

export const router = createBrowserRouter([
  // Sitio público y kioscos: usuarios de la biblioteca.
  {
    element: <Layout />,
    hydrateFallbackElement: <PantallaDeCarga />,
    children: [
      {
        // Si una página falla al cargar, el error se muestra dentro del diseño del sitio (con su menú y su pie).
        errorElement: <NotFoundPage />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/catalogo', ...pagina(() => import('../features/catalog/OpacSearchPage')) },
          { path: '/tesis/:id', ...pagina(() => import('../features/catalog/ThesisDetailPage')) },
          { path: '/tesis/:id/documento', ...pagina(() => import('../features/catalog/ThesisDocumentPage')) },
          { path: '/sala-de-estudio', ...pagina(() => import('../features/reservas/StudyRoomPage')) },
          { path: '/solvencia', ...pagina(() => import('../features/solvencia/SolvenciaPage')) },
          { path: '/tesis-digital', ...pagina(() => import('../features/tramites/TesisDigitalPage')) },
          { path: '/referencias', ...pagina(() => import('../features/tramites/ReferenciasPage')) },
          { path: '/servicios', ...pagina(() => import('../features/servicios/ServiciosPage')) },
          { path: '/horarios', ...pagina(() => import('../features/horarios/HorariosPage')) },
          { path: '/recursos', ...pagina(() => import('../features/recursos/RecursosPage')) },
          { path: '/quienes-somos', ...pagina(() => import('../features/institucional/QuienesSomosPage')) },
          { path: '/preguntas-frecuentes', ...pagina(() => import('../features/ayuda/PreguntasFrecuentesPage')) },
          { path: '/privacidad', ...pagina(() => import('../features/ayuda/PrivacidadPage')) },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  // Consola del personal: otra parte del sistema, sin el diseño público (encabezado, buscador, pie, modo kiosco).
  // Se descarga solo cuando alguien entra a /admin: el público y los kioscos no cargan ese código.
  {
    path: '/admin/*',
    ...pagina(() => import('../features/admin/AdminApp')),
    hydrateFallbackElement: <PantallaDeCarga />,
    errorElement: <NotFoundPage />,
  },
]);
