#!/bin/sh
# Punto de entrada del contenedor.
# Algunas plataformas (Railway, Fly.io...) montan el volumen de datos a nombre de root. Si el contenedor arranca como root,
# deja la carpeta de datos a nombre del usuario "node" y sigue como ese usuario: el servidor nunca corre como root.
set -e

DATOS="${DATA_DIR:-/data}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATOS"
  chown -R node:node "$DATOS" || echo "Aviso: no se pudo dar la carpeta $DATOS al usuario node; si el servidor no puede guardar datos, revisa los permisos del volumen." >&2
  if command -v setpriv >/dev/null 2>&1; then
    exec setpriv --reuid=node --regid=node --init-groups "$@"
  fi
  echo "Aviso: no se encontró setpriv; el servidor seguirá como root." >&2
fi

exec "$@"
