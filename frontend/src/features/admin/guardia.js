import { redirect } from 'react-router-dom';
import { authApi } from './authApi';
import { SECCIONES, puedeVer } from './secciones';
import { borrarSesion, leerSesion } from '../../shared/auth/sesion';
import { RUTA_DEL_PANEL } from '../../shared/config/rutas';

// Guardia de las rutas del panel del personal: corre antes de dibujar cualquier página del panel (ver router.jsx).
//  1. Sin sesión, al inicio de sesión, que recuerda a dónde se quería ir.
//  2. Con una sesión que el servidor ya no reconoce (venció o el servidor se reinició), se borra y se vuelve a pedir el acceso. El servidor
//     la confirma una vez por carga de la página (y otra vez si entra otra persona), no en cada cambio de sección.
//  3. Con una sección que el rol no puede ver, al resumen, con un aviso.
// El servidor repite todo esto en cada petición: la guardia evita mostrar pantallas del panel a quien no corresponde.

let fichaConfirmada = null; // la ficha de acceso que el servidor ya reconoció en esta carga de la página

function haciaElAcceso(url, aviso) {
  const parametros = new URLSearchParams();
  const desde = `${url.pathname}${url.search}`;
  if (desde !== RUTA_DEL_PANEL && desde !== `${RUTA_DEL_PANEL}/`) parametros.set('desde', desde);
  if (aviso) parametros.set('aviso', aviso);
  const consulta = parametros.toString();
  return redirect(`${RUTA_DEL_PANEL}/acceso${consulta ? `?${consulta}` : ''}`);
}

export async function guardarRutaDelPanel({ request }) {
  const url = new URL(request.url);
  const [, clave = ''] = url.pathname.split('/').filter(Boolean); // /privateAccess/qr -> "qr"
  const sesion = leerSesion();
  // La pantalla de acceso solo es para quien no tiene sesión: quien ya la tiene va al panel (que confirma si sigue vigente).
  if (clave === 'acceso') return sesion?.token ? redirect(RUTA_DEL_PANEL) : null;

  if (!sesion?.token) throw haciaElAcceso(url);

  if (fichaConfirmada !== sesion.token) {
    try {
      await authApi.me();
      fichaConfirmada = sesion.token;
    } catch (error) {
      if (error.response?.status === 401) {
        borrarSesion();
        throw haciaElAcceso(url, 'terminada');
      }
      // Sin respuesta del servidor (por ejemplo, la red cayó): se deja pasar y el panel mostrará sus propios errores.
    }
  }

  if (SECCIONES.some((s) => s.clave === clave) && !puedeVer(sesion.rol, clave)) {
    throw redirect(`${RUTA_DEL_PANEL}/resumen?sinpermiso=${encodeURIComponent(clave)}`);
  }
  return null;
}
