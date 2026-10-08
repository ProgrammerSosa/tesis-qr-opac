import { useState } from 'react';
import { Loader2, Printer, ScanLine } from 'lucide-react';
import { adminApi } from '../adminApi';
import { useListaPaginada } from '../useListaPaginada';
import ThesisQr, { destinoDelQrDe } from '../../catalog/ThesisQr';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Paginacion from '../../../shared/components/Paginacion';
import BarraDeFiltros from '../componentes/BarraDeFiltros';
import { useImpresionDeEtiquetas } from '../componentes/ImpresionDeEtiquetas';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { fechaLegible } from '../estados';

const RESULTADO = {
  ok: { tone: 'status', label: 'Enlace correcto' },
  solo_ficha: { tone: 'neutral', label: 'Lleva a la ficha' },
  enlace_roto: { tone: 'danger', label: 'Enlace roto' },
};

// Códigos QR de las tesis (propuesta, secciones 4.3 y 4.5.6): a dónde lleva cada uno (la URL de la tesis o su ficha), cuáles están
// activos, comprobar que sus enlaces respondan e imprimir las etiquetas de contraportada. La selección para imprimir se conserva
// al cambiar de página.
export default function CodigosQrPage() {
  const lista = useListaPaginada(adminApi.codigosQr, { porPagina: 15 });
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(() => new Set());
  const [seleccion, setSeleccion] = useState(() => new Map()); // código -> tesis
  const { imprimir, portal } = useImpresionDeEtiquetas();

  async function cambiar(t, cambios, mensajeDeError) {
    try {
      const res = await adminApi.actualizarQr(t.id, cambios);
      lista.reemplazar(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, mensajeDeError));
    }
  }

  const cambiarActivo = (t) => cambiar(t, { activo: !t.qr.activo }, 'No se pudo cambiar el estado del código');
  const cambiarDestino = (t, destino) => cambiar(t, { destino }, 'No se pudo cambiar a dónde lleva el código');

  async function verificar(ids) {
    setVerificando((previos) => new Set([...previos, ...ids]));
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await adminApi.verificarQr(id);
          lista.reemplazar(res.data.data);
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

  function alternar(t) {
    setSeleccion((previa) => {
      const siguiente = new Map(previa);
      if (siguiente.has(t.id)) siguiente.delete(t.id);
      else siguiente.set(t.id, t);
      return siguiente;
    });
  }

  const idsDeLaPagina = lista.items.map((t) => t.id);
  const paginaSeleccionada = idsDeLaPagina.length > 0 && idsDeLaPagina.every((id) => seleccion.has(id));

  function alternarPagina() {
    setSeleccion((previa) => {
      const siguiente = new Map(previa);
      if (paginaSeleccionada) idsDeLaPagina.forEach((id) => siguiente.delete(id));
      else lista.items.forEach((t) => siguiente.set(t.id, t));
      return siguiente;
    });
  }

  return (
    <PaginaAdmin
      descripcion={
        <>
          El código QR de cada tesis se genera con su <b>URL</b>. Si prefieres una dirección que no cambie aunque cambie el archivo, haz que
          lleve a la <b>ficha</b> de la tesis en este sistema: ahí se cuentan los escaneos. Un código <b>desactivado</b> avisa a quien lo
          escanea y deja de contarse. <b>Verificar</b> comprueba que el enlace responda.
        </>
      }
    >
      <AlertBanner>{error || lista.error}</AlertBanner>

      <BarraDeFiltros
        busqueda={lista.texto}
        onBusqueda={lista.setTexto}
        placeholder="Código, título o autor"
        resumen={lista.primeraCarga ? '' : `${lista.total.toLocaleString('es-GT')} tesis`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" icon={ScanLine} onClick={() => verificar(idsDeLaPagina)} disabled={verificando.size > 0 || idsDeLaPagina.length === 0}>
          Verificar los de esta página
        </Button>
        <Button variant="brand" icon={Printer} disabled={seleccion.size === 0} onClick={() => imprimir([...seleccion.values()])}>
          Imprimir etiquetas ({seleccion.size})
        </Button>
        {seleccion.size > 0 ? (
          <button type="button" onClick={() => setSeleccion(new Map())} className="text-sm font-semibold text-slate-500 hover:text-action">
            Limpiar la selección
          </button>
        ) : null}
      </div>

      <div className={`overflow-x-auto rounded-xl border border-border bg-white transition-opacity ${lista.cargando && !lista.primeraCarga ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Seleccionar las etiquetas de esta página"
                  checked={paginaSeleccionada}
                  onChange={alternarPagina}
                  className="h-4 w-4 accent-primary"
                />
              </th>
              {['Código', 'Tesis', 'Lleva a', 'Estado', 'Última verificación', 'Acciones'].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.primeraCarga ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  <Loader2 className="mr-2 inline animate-spin" size={16} />
                  Cargando códigos QR...
                </td>
              </tr>
            ) : lista.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  Ninguna tesis coincide con la búsqueda.
                </td>
              </tr>
            ) : (
              lista.items.map((t) => {
                const resultado = RESULTADO[t.qr.resultado];
                const enVerificacion = verificando.has(t.id);
                const destino = destinoDelQrDe(t);
                // Elegir entre la URL y la ficha solo tiene sentido si la tesis tiene una URL que se pueda ofrecer.
                const puedeElegir = Boolean(t.documentoDigital.urlExterna) && t.documentoDigital.disponible;
                return (
                  <tr key={t.id} className="align-middle">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar la etiqueta de ${t.id}`}
                        checked={seleccion.has(t.id)}
                        onChange={() => alternar(t)}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <ThesisQr id={t.id} size={48} enlace={destino.enlace} />
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-[16rem] font-semibold leading-snug text-slate-900">{t.titulo}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">{t.id}</p>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <Badge tone={destino.tipo === 'url' ? 'status' : 'neutral'}>{destino.tipo === 'url' ? 'URL de la tesis' : 'Ficha de la tesis'}</Badge>
                      <span className="mt-1 block max-w-[17rem] break-all font-mono text-slate-600">{destino.visible}</span>
                    </td>
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
                        <button type="button" onClick={() => imprimir([t])} className="text-primary hover:underline">
                          Imprimir etiqueta
                        </button>
                        {puedeElegir ? (
                          <button
                            type="button"
                            onClick={() => cambiarDestino(t, destino.tipo === 'url' ? 'ficha' : 'url')}
                            className="text-slate-700 hover:underline"
                          >
                            {destino.tipo === 'url' ? 'Que lleve a la ficha' : 'Que lleve a la URL'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={lista.pagina} paginas={lista.paginas} onCambiar={lista.irAPagina} />

      {portal}
    </PaginaAdmin>
  );
}
