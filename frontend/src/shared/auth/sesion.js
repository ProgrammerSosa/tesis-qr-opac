// Sesión del personal en este navegador. Se guarda en `sessionStorage`: se borra al cerrar la pestaña.
// Un kiosco no cierra su pestaña; allí la sesión se cierra por inactividad (ver KioscoContext).
const CLAVE = 'sesion_personal';

export function leerSesion() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE));
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch {
    // sin almacenamiento disponible: la sesión dura solo mientras no se recargue la página
  }
}

export function borrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // nada que borrar
  }
}
