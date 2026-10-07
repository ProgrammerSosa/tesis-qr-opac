import { useCallback, useEffect, useState } from 'react';
import { CircleCheck, Loader2, Mail, RefreshCw, TriangleAlert } from 'lucide-react';
import { adminApi } from '../adminApi';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { fechaLegible } from '../estados';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Nota from '../../../shared/components/Nota';

// Los últimos correos que mandó el sistema (confirmaciones, avisos de solvencia, tesis publicadas, referencias...). Sirve
// para comprobar que los avisos salen bien y, si el correo no está configurado, para ver qué se habría enviado.
export default function CorreosPage() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await adminApi.correos();
      setDatos(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar los correos'));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!datos) {
    return error ? (
      <AlertBanner>{error}</AlertBanner>
    ) : (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando correos...
      </div>
    );
  }

  return (
    <PaginaAdmin
      descripcion="Los últimos 50 correos que el sistema envió o intentó enviar a los usuarios. Solo se muestran mientras el servidor siga encendido."
      acciones={
        <Button variant="secondary" icon={RefreshCw} onClick={cargar}>
          Actualizar
        </Button>
      }
    >
      <AlertBanner>{error}</AlertBanner>
      {datos.configurado ? (
        <Nota tono="ok" titulo="El correo está configurado">
          Los correos salen por el servidor SMTP definido en el servidor de la biblioteca.
        </Nota>
      ) : (
        <Nota tono="aviso" titulo="El correo todavía no está configurado">
          Los avisos no se envían: aquí solo se guardan para que veas qué se habría mandado. Para activarlos, completa las variables <span className="font-mono">SMTP_HOST</span>,{' '}
          <span className="font-mono">SMTP_USER</span>, <span className="font-mono">SMTP_PASS</span> y <span className="font-mono">SMTP_FROM</span> en el archivo{' '}
          <span className="font-mono">backend/.env</span> y reinicia el servidor.
        </Nota>
      )}

      {datos.correos.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <Mail size={30} className="text-slate-300" />
          <p className="mt-3 font-bold text-slate-900">Todavía no se envió ningún correo</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Aparecerán aquí cuando alguien haga una reserva o una solicitud dejando su correo.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
          {datos.correos.map((c, i) => {
            const clave = c.enviadoEn + "-" + i;
            const expandido = abierto === clave;
            return (
              <li key={clave}>
                <button
                  type="button"
                  onClick={() => setAbierto(expandido ? null : clave)}
                  aria-expanded={expandido}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{c.asunto}</span>
                    <span className="block truncate text-xs text-slate-500">
                      Para {c.para} · {fechaLegible(c.enviadoEn)}
                    </span>
                  </span>
                  {c.error ? (
                    <Badge tone="danger">
                      <TriangleAlert size={12} />
                      Falló
                    </Badge>
                  ) : c.simulado ? (
                    <Badge tone="warning">Simulado</Badge>
                  ) : (
                    <Badge tone="status">
                      <CircleCheck size={12} />
                      Enviado
                    </Badge>
                  )}
                </button>
                {expandido ? (
                  <div className="border-t border-border bg-surface px-4 py-3">
                    {c.error ? <p className="mb-2 text-xs font-semibold text-secondary">Error: {c.error}</p> : null}
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-700">{c.cuerpo}</pre>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </PaginaAdmin>
  );
}
