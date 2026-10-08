// Qué kiosco es este navegador. Un kiosco se abre con la dirección `/?kiosco=1` (o 2, 3...): el número se recuerda mientras
// la pestaña siga abierta (sessionStorage). Con `/?kiosco=salir` el personal sale del modo kiosco en esa pestaña.
const CLAVE = 'kiosco_id';

export const FORMATO_DE_KIOSCO = /^[0-9A-Za-z_-]{1,10}$/;

export function leerKiosco() {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function guardarKiosco(id) {
  try {
    sessionStorage.setItem(CLAVE, id);
  } catch {
    // sin almacenamiento: el kiosco se reconoce solo mientras no se recargue la página
  }
}

export function borrarKiosco() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // nada que borrar
  }
}

// ¿Esta pestaña es un kiosco? (por lo guardado o porque la dirección trae `?kiosco=`). El panel del personal se cierra con esto.
export function hayKiosco(direccion = window.location.href) {
  const delParametro = new URL(direccion).searchParams.get('kiosco');
  return Boolean(leerKiosco()) || (FORMATO_DE_KIOSCO.test(delParametro ?? '') && delParametro !== 'salir');
}
