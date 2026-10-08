// Dirección del panel del personal (la consola de administración): el primer tramo de la dirección, sin barra al final.
// Debe ser la misma que RUTA_DEL_PANEL en frontend/src/shared/config/rutas.js, que es la que usa el sitio al dibujar y al enlazar el panel.
// El servidor la usa para negar el panel a los kioscos (KIOSCOS_IP) y para que no se indexe.
// La API del panel sigue en /api/admin: no se ve en la barra de direcciones.
module.exports = { RUTA_DEL_PANEL: '/privateAccess' };
