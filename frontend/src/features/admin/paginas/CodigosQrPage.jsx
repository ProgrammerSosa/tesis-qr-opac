import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Printer, ScanLine } from 'lucide-react';
import { adminApi } from '../adminApi';
import ThesisQr, { enlaceCanonico } from '../../catalog/ThesisQr';
import ThesisLabel from '../../catalog/ThesisLabel';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { fechaLegible } from '../estados';

const RESULTADO = {
  ok: { tone: 'status', label: 'Enlace correcto' },
  solo_ficha: { tone: 'neutral', label: 'Lleva a la ficha' },
  enlace_roto: { tone: 'danger', label: 'Enlace roto' },
};

// Códigos QR de las tesis (propuesta, secciones 4.3 y 4.5.6): cuáles están activos, comprobar que sus enlaces
// respondan e imprimir las etiquetas de contraportada.
export default function CodigosQrPage() {
  const [tesis, setTesis] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(() => new Set());
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [paraImprimir, setParaImprimir] = useState([]);

  useEffect(() => {
    adminApi
      .codigosQr()
      .then((res) => setTesis(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar los códigos QR')))
      .finally(() => setCargando(false));
  }, []);

  // Las etiquetas se dibujan solo mientras se imprimen; `afterprint` avisa cuando termina o se cancela.
  useEffect(() => {
    if (paraImprimir.length === 0) return undefined;
    document.body.classList.add('imprimiendo-etiquetas');
    const terminar = () => setParaImprimir([]);
    window.addEventListener('afterprint', terminar, { once: true });
    window.print();
    return () => {
      window.removeEventListener('afterprint', terminar);
      document.body.classList.remove('imprimiendo-etiquetas');
    };
  }, [paraImprimir]);

  function reemplazar(actualizada) {
    setTesis((lista) => lista.map((t) => (t.id === actualizada.id ? actualizada : t)));
  }

  async function cambiarActivo(t) {
    try {
      const res = await adminApi.actualizarQr(t.id, !t.qr.activo);
      reemplazar(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cambiar el estado del código'));
    }
  }

  async function verificar(ids) {
    setVerificando((previos) => new Set([...previos, ...ids]));
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await adminApi.verificarQr(id);
          reemplazar(res.data.data);
        } catch (err) {
          setError(getErrorMessage(err, `No se pudo verificar el código de ${id}`));
        } finally {
          setVerificando((previos) => {
            const siguientes = new Set(previos);
            siguientes.delete(id);
            return siguientes;
          });
        }
      })
    );
  }

  function alternarSeleccion(id) {
    setSeleccion((previa) => {
      const siguiente = new Set(previa);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  const todasSeleccionadas = tesis.length > 0 && seleccion.size === tesis.length;

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando códigos QR...
      </div>
    );
  }

  return (
    <PaginaAdmin
      descripcion={
        <>
          Cada código QR lleva a la ficha de su tesis, una dirección que no cambia aunque cambie el archivo digital. Un código{' '}
          <b>desactivado</b> avisa a quien lo escanea y deja de contarse en las estadísticas. <b>Verificar</b> comprueba que el
          enlace responda.
        </>
      }
    >
      <AlertBanner>{error}</AlertBanner>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" icon={ScanLine} onClick={() => verificar(tesis.map((t) => t.id))} disabled={verificando.size > 0}>
          Verificar todos
        </Button>
        <Button
          variant="brand"
          icon={Printer}
          disabled={seleccion.size === 0}
          onClick={() => setParaImprimir(tesis.filter((t) => seleccion.has(t.id)))}
        >
          Imprimir etiquetas ({seleccion.size})
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas las etiquetas"
                  checked={todasSeleccionadas}
                  onChange={() => setSeleccion(todasSeleccionadas ? new Set() : new Set(tesis.map((t) => t.id)))}
                  className="h-4 w-4 accent-primary"
                />
              </th>
              {['Código', 'Tesis', 'Enlace', 'Estado', 'Última verificación', 'Acciones'].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tesis.map((t) => {
              const resultado = RESULTADO[t.qr.resultado];
              const enVerificacion = verificando.has(t.id);
              return (
                <tr key={t.id} className="align-middle">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar la etiqueta de ${t.id}`}
                      checked={seleccion.has(t.id)}
                      onChange={() => alternarSeleccion(t.id)}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <ThesisQr id={t.id} size={48} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="max-w-[16rem] font-semibold leading-snug text-slate-900">{t.titulo}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{t.id}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-600">{enlaceCanonico(t.id)}</td>
                  <td className="px-3 py-3">
                    <Badge tone={t.qr.activo ? 'status' : 'danger'} dot>
                      {t.qr.activo ? 'Activo' : 'Desactivado'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {t.qr.verificadoEn ? (
                      <>
                        {resultado ? <Badge tone={resultado.tone}>{resultado.label}</Badge> : null}
                        <span className="mt-1 block text-slate-500">{fechaLegible(t.qr.verificadoEn)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Sin verificar</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => verificar([t.id])}
                        disabled={enVerificacion}
                        className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                      >
                        {enVerificacion ? <Loader2 size={12} className="animate-spin" /> : null}
                        Verificar
                      </button>
                      <button type="button" onClick={() => cambiarActivo(t)} className="text-slate-700 hover:underline">
                        {t.qr.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button type="button" onClick={() => setParaImprimir([t])} className="text-primary hover:underline">
                        Imprimir etiqueta
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {paraImprimir.length > 0
        ? createPortal(
            <div id="etiquetas-impresion">
              {paraImprimir.map((t) => (
                <ThesisLabel key={t.id} tesis={t} />
              ))}
            </div>,
            document.body
          )
        : null}
    </PaginaAdmin>
  );
}
