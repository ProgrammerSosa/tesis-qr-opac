import { createContext, useContext } from 'react';

// La sesión del personal y sus acciones, para las pantallas del panel. La entrega el diseño del panel (AdminLayout).
const SesionAdminContext = createContext(null);

export const ProveedorDeSesion = SesionAdminContext.Provider;

export function useSesionAdmin() {
  const valor = useContext(SesionAdminContext);
  if (!valor) {
    throw new Error('useSesionAdmin solo se puede usar dentro del panel del personal');
  }
  return valor;
}
