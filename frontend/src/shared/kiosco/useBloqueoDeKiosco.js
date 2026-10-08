import { useCallback, useEffect, useRef, useState } from 'react';

// "Candado de pantalla" de los kioscos. Una página web no puede impedir por sí sola que alguien cambie de ventana: eso lo
// hace el navegador en modo kiosco y el sistema operativo (ver el README). Lo que sí hace la página, mientras es un kiosco:
//   - pide la pantalla completa y, si la persona sale de ella, la tapa con un aviso hasta que vuelva a entrar;
//   - captura las teclas que el navegador reserva (cambiar de pestaña, cerrar, abrir ventanas, herramientas...) cuando
//     la pantalla completa lo permite (Keyboard Lock API de Chrome);
//   - bloquea el menú contextual, la selección de texto, arrastrar, el zoom y los atajos de las herramientas del navegador;
//   - no deja abrir enlaces a otros sitios ni ventanas nuevas;
//   - si la pestaña queda oculta o pierde el foco un buen rato, al volver borra la sesión y regresa al inicio.

// Teclas físicas que el navegador reserva y que se piden capturar en pantalla completa.
const TECLAS_RESERVADAS = [
  'Escape', 'F11', 'F12', 'Tab', 'KeyT', 'KeyW', 'KeyN', 'KeyL', 'KeyD', 'KeyP', 'KeyU', 'KeyS', 'KeyO', 'KeyJ', 'KeyI', 'KeyC',
  'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'ArrowLeft', 'ArrowRight',
];

// Segundos de ausencia que se toleran antes de borrar la sesión: la pestaña oculta (cambió de pestaña o minimizó) casi no
// se tolera; perder solo el foco (el diálogo de impresión, por ejemplo) se tolera más.
const MS_AUSENTE_OCULTA = 2000;
const MS_AUSENTE_SIN_FOCO = 30000;

function teclaProhibida(e) {
  const ctrl = e.ctrlKey || e.metaKey;
  const tecla = String(e.key).toLowerCase();
  if (['f11', 'f12', 'f3', 'f6', 'f7'].includes(tecla)) return true;
  if (e.altKey && ['arrowleft', 'arrowright', 'home'].includes(tecla)) return true;
  if (!ctrl) return false;
  if (['+', '-', '=', '0', 'tab'].includes(tecla)) return true; // zoom y cambio de pestaña
  if (e.shiftKey && ['i', 'j', 'c'].includes(tecla)) return true; // herramientas de desarrollo
  return ['u', 's', 'p', 'o', 'l', 'd', 'h', 'j', 'k', 'e', 'g', 'n', 't', 'w', 'b'].includes(tecla);
}

function bloquearTeclado() {
  try {
    Promise.resolve(navigator.keyboard?.lock?.(TECLAS_RESERVADAS)).catch(() => {});
  } catch {
    // el navegador no lo permite: queda el bloqueo de teclas de la página
  }
}

function desbloquearTeclado() {
  try {
    navigator.keyboard?.unlock?.();
  } catch {
    // nada que desbloquear
  }
}

// `alReiniciar` borra la sesión y vuelve al inicio (la misma acción que la inactividad).
export function useBloqueoDeKiosco(activo, alReiniciar) {
  const soportaPantallaCompleta = typeof document !== 'undefined' && Boolean(document.fullscreenEnabled);
  const [esperandoToque, setEsperandoToque] = useState(false);
  const entroUnaVez = useRef(false);
  const ausente = useRef(null);
  const reiniciar = useRef(alReiniciar);
  reiniciar.current = alReiniciar;

  // Estilos del modo kiosco (sin selección, sin zoom con los dedos, sin "tirar para recargar").
  useEffect(() => {
    if (!activo) return undefined;
    document.documentElement.classList.add('modo-kiosco');
    return () => document.documentElement.classList.remove('modo-kiosco');
  }, [activo]);

  // Pantalla completa
  useEffect(() => {
    if (!activo || !soportaPantallaCompleta) return undefined;
    // Al empezar, el kiosco muestra su pantalla de bienvenida hasta que alguien la toca (y así entra en pantalla completa).
    if (!document.fullscreenElement && !entroUnaVez.current) setEsperandoToque(true);
    const alCambiar = () => {
      if (document.fullscreenElement) {
        entroUnaVez.current = true;
        setEsperandoToque(false);
        bloquearTeclado();
      } else {
        desbloquearTeclado();
        if (entroUnaVez.current) setEsperandoToque(true);
      }
    };
    document.addEventListener('fullscreenchange', alCambiar);
    return () => {
      document.removeEventListener('fullscreenchange', alCambiar);
      desbloquearTeclado();
    };
  }, [activo, soportaPantallaCompleta]);

  // Entradas bloqueadas, enlaces externos y ausencia de la pestaña
  useEffect(() => {
    if (!activo) return undefined;

    const enUnCampo = (e) => e.target instanceof Element && Boolean(e.target.closest('input, textarea, select, [contenteditable="true"]'));
    const evitar = (e) => e.preventDefault();
    const alSeleccionar = (e) => {
      if (!enUnCampo(e)) e.preventDefault();
    };
    const alTeclear = (e) => {
      if (teclaProhibida(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const alRodar = (e) => {
      if (e.ctrlKey) e.preventDefault(); // zoom con Ctrl + rueda
    };
    const alHacerClic = (e) => {
      const enlace = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!enlace) return;
      const destino = new URL(enlace.href, window.location.href);
      if (destino.origin !== window.location.origin || enlace.target === '_blank') e.preventDefault();
    };

    const alOcultar = () => {
      ausente.current = { desde: ausente.current?.desde ?? Date.now(), oculta: true };
    };
    const alPerderElFoco = () => {
      if (!ausente.current) ausente.current = { desde: Date.now(), oculta: false };
    };
    const alVolver = () => {
      const fuera = ausente.current;
      ausente.current = null;
      if (fuera && Date.now() - fuera.desde > (fuera.oculta ? MS_AUSENTE_OCULTA : MS_AUSENTE_SIN_FOCO)) reiniciar.current();
    };
    const alCambiarVisibilidad = () => (document.visibilityState === 'hidden' ? alOcultar() : alVolver());

    document.addEventListener('contextmenu', evitar);
    document.addEventListener('selectstart', alSeleccionar);
    document.addEventListener('dragstart', evitar);
    document.addEventListener('keydown', alTeclear, true);
    document.addEventListener('wheel', alRodar, { passive: false });
    document.addEventListener('gesturestart', evitar);
    document.addEventListener('click', alHacerClic, true);
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('blur', alPerderElFoco);
    window.addEventListener('focus', alVolver);

    const abrirOriginal = window.open;
    window.open = () => null; // ninguna ventana nueva

    return () => {
      document.removeEventListener('contextmenu', evitar);
      document.removeEventListener('selectstart', alSeleccionar);
      document.removeEventListener('dragstart', evitar);
      document.removeEventListener('keydown', alTeclear, true);
      document.removeEventListener('wheel', alRodar);
      document.removeEventListener('gesturestart', evitar);
      document.removeEventListener('click', alHacerClic, true);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('blur', alPerderElFoco);
      window.removeEventListener('focus', alVolver);
      window.open = abrirOriginal;
    };
  }, [activo]);

  // Se llama con el toque de la persona (el navegador exige un gesto para entrar en pantalla completa).
  const entrarEnPantallaCompleta = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      // sin pantalla completa (el navegador la negó): el kiosco sigue funcionando
    }
    setEsperandoToque(false);
  }, []);

  return { esperandoToque: activo && esperandoToque, entrarEnPantallaCompleta };
}
