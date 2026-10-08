import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { adminApi } from '../adminApi';
import { useListaPaginada } from '../useListaPaginada';
import { useSesionAdmin } from '../SesionAdmin';
import BarraDeFiltros from '../componentes/BarraDeFiltros';
import FormularioDeTesis from '../componentes/FormularioDeTesis';
import ImportarCatalogoModal from '../componentes/ImportarCatalogoModal';
import ModalConfirmar from '../componentes/ModalConfirmar';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { TIPOS_DOCUMENTO } from '../../catalog/tiposDocumento';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Paginacion from '../../../shared/components/Paginacion';

// Catálogo de tesis: el personal agrega, corrige y retira registros, o importa de una vez la hoja de cálculo del catálogo.
// El documento digital y el código QR de cada tesis se gestionan en sus propias secciones.
export default function CatalogoPage() {
  const { sesion } = useSesionAdmin();
  const esAdministrador = sesion.rol === 'administrador';
  const lista = useListaPaginada(adminApi.catalogo, { porPagina: 25 });
  const [formulario, setFormulario] = useState(null); // null | { tesis } (tesis ausente = agregar)
  const [vecesAgregando, setVecesAgregando] = useState(0); // cambia para empezar un formulario nuevo con "Agregar otra tesis"
  const [importando, setImportando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorDeEliminar, setErrorDeEliminar] = useState('');
  const [aviso, setAviso] = useState('');

  // Al corregir una tesis se cierra el formulario. Al agregar una, se queda abierto y devuelve la tesis guardada para que muestre
  // su código QR (generado con la URL de la tesis), listo para imprimir.
  async function guardar(datos) {
    let respuesta;
    try {
      if (formulario.tesis) {
        respuesta = await adminApi.actualizarTesis(formulario.tesis.id, datos);
        setAviso(`Se guardaron los cambios de ${formulario.tesis.id}.`);
      } else {
        respuesta = await adminApi.crearTesis(datos);
        setAviso(`Se agregó la tesis ${datos.id} al catálogo.`);
      }
    } catch (err) {
      throw new Error(getErrorMessage(err, 'No se pudo guardar la tesis'));
    }
    lista.recargar();
    if (formulario.tesis) {
      setFormulario(null);
      return undefined;
    }
    return respuesta.data.data;
  }

  async function eliminar() {
    setEliminando(true);
    setErrorDeEliminar('');
    try {
      await adminApi.eliminarTesis(aEliminar.id);
      setAviso(`Se eliminó la tesis ${aEliminar.id}.`);
      setAEliminar(null);
      lista.recargar();
    } catch (err) {
      setErrorDeEliminar(getErrorMessage(err, 'No se pudo eliminar la tesis'));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <PaginaAdmin
      descripcion="Las tesis que se ven en el catálogo público. Al agregar una escribes sus datos y la URL de la tesis, y con esa URL se genera su código QR; también puedes corregir una o importar toda la hoja de cálculo del catálogo. El código de una tesis no se cambia: está impreso en el QR de su etiqueta."
      acciones={
        <>
          <Button variant="secondary" icon={Upload} onClick={() => setImportando(true)}>
            Importar
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setFormulario({ tesis: null })}>
            Agregar tesis
          </Button>
        </>
      }
    >
      <AlertBanner>{lista.error}</AlertBanner>
      {aviso ? (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {aviso}
        </p>
      ) : null}

      <BarraDeFiltros
        busqueda={lista.texto}
        onBusqueda={lista.setTexto}
        placeholder="Código, título, autor o signatura"
        filtros={[
          {
            etiqueta: 'Con y sin documento',
            valor: lista.documento,
            onCambio: lista.cambiarDocumento,
            opciones: [
              ['con', 'Con documento digital'],
              ['sin', 'Sin documento digital'],
            ],
          },
        ]}
        resumen={lista.primeraCarga ? '' : `${lista.total.toLocaleString('es-GT')} tesis`}
      />

      <div className={`overflow-x-auto rounded-xl border border-border bg-white transition-opacity ${lista.cargando && !lista.primeraCarga ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Código', 'Título y autor', 'Año', 'Tipo', 'Documento', 'Acciones'].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.primeraCarga ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  <Loader2 className="mr-2 inline animate-spin" size={16} />
                  Cargando el catálogo...
                </td>
              </tr>
            ) : lista.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  {lista.texto || lista.documento ? 'Ninguna tesis coincide con la búsqueda.' : 'El catálogo está vacío. Agrega una tesis o importa la hoja de cálculo.'}
                </td>
              </tr>
            ) : (
              lista.items.map((t) => (
                <tr key={t.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-600">{t.id}</td>
                  <td className="px-3 py-3">
                    <p className="max-w-md font-semibold leading-snug text-slate-900">{t.titulo}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{t.autor}</p>
                  </td>
                  <td className="px-3 py-3">{t.anio}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{TIPOS_DOCUMENTO[t.tipoDocumento] ?? t.modalidad}</td>
                  <td className="px-3 py-3">
                    <Badge tone={t.documentoDigital.disponible ? 'status' : 'neutral'} dot>
                      {t.documentoDigital.disponible ? 'Digital' : 'Solo impreso'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                      <button type="button" onClick={() => setFormulario({ tesis: t })} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Pencil size={12} />
                        Editar
                      </button>
                      <Link to={`/tesis/${encodeURIComponent(t.id)}`} target="_blank" className="text-slate-600 hover:underline">
                        Ver ficha
                      </Link>
                      {esAdministrador ? (
                        <button type="button" onClick={() => { setErrorDeEliminar(''); setAEliminar(t); }} className="inline-flex items-center gap-1 text-secondary hover:underline">
                          <Trash2 size={12} />
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={lista.pagina} paginas={lista.paginas} onCambiar={lista.irAPagina} />

      {formulario ? (
        <FormularioDeTesis
          key={formulario.tesis?.id ?? `nueva-${vecesAgregando}`}
          abierto
          tesis={formulario.tesis}
          onCerrar={() => setFormulario(null)}
          onGuardar={guardar}
          onOtra={() => setVecesAgregando((n) => n + 1)}
        />
      ) : null}
      {importando ? <ImportarCatalogoModal esAdministrador={esAdministrador} onCerrar={() => setImportando(false)} onTerminada={lista.recargar} /> : null}

      <ModalConfirmar
        abierto={Boolean(aEliminar)}
        titulo="Eliminar tesis"
        peligro
        textoConfirmar="Eliminar"
        trabajando={eliminando}
        error={errorDeEliminar}
        onConfirmar={eliminar}
        onCancelar={() => setAEliminar(null)}
      >
        {aEliminar ? (
          <>
            <p>
              ¿Eliminar <b>{aEliminar.titulo}</b> ({aEliminar.id}) del catálogo?
            </p>
            <p>Se perderán también su documento digital y su código QR. El código QR impreso en la etiqueta dejará de funcionar. No se puede deshacer.</p>
          </>
        ) : null}
      </ModalConfirmar>
    </PaginaAdmin>
  );
}
