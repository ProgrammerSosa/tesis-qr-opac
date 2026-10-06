import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { adminApi } from './adminApi';
import { ACCESOS } from '../catalog/tiposDocumento';
import { getErrorMessage } from '../../shared/api/axiosClient';
import AlertBanner from '../../shared/components/AlertBanner';
import Badge from '../../shared/components/Badge';
import { fechaLegible } from './estados';

// Una fila por tesis, con un borrador propio: los cambios solo se guardan al pulsar "Guardar".
function FilaTesis({ tesis, onGuardada }) {
  const doc = tesis.documentoDigital;
  const [acceso, setAcceso] = useState(doc.acceso);
  const [activo, setActivo] = useState(doc.activo);
  const [urlExterna, setUrlExterna] = useState(doc.urlExterna || '');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const hayCambios = acceso !== doc.acceso || activo !== doc.activo || urlExterna.trim() !== (doc.urlExterna || '');

  // Al volver a tocar un campo, el aviso del guardado anterior ya no corresponde.
  function editar(setter) {
    return (valor) => {
      setter(valor);
      setMensaje({ tipo: '', texto: '' });
    };
  }

  async function guardar() {
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const res = await adminApi.actualizarDocumento(tesis.id, { acceso, activo, urlExterna: urlExterna.trim() });
      onGuardada(res.data.data);
      setMensaje({ tipo: 'ok', texto: 'Guardado' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: getErrorMessage(err, 'No se pudo guardar') });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <tr className="align-top">
      <td className="px-3 py-3">
        <p className="max-w-[18rem] font-semibold leading-snug text-slate-900">{tesis.titulo}</p>
        <p className="mt-0.5 text-xs text-slate-500">{tesis.autor}</p>
        <p className="mt-0.5 font-mono text-xs text-slate-500">{tesis.id}</p>
      </td>
      <td className="px-3 py-3">
        <select
          aria-label={`Nivel de acceso de ${tesis.id}`}
          value={acceso}
          onChange={(e) => editar(setAcceso)(e.target.value)}
          className="w-44 rounded-md border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
        >
          {Object.entries(ACCESOS).map(([valor, { etiqueta }]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => editar(setActivo)(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Documento activo
        </label>
      </td>
      <td className="px-3 py-3">
        <input
          type="url"
          aria-label={`Enlace del documento de ${tesis.id}`}
          value={urlExterna}
          onChange={(e) => editar(setUrlExterna)(e.target.value)}
          placeholder="Vacío: usa el documento de ejemplo"
          className="w-64 rounded-md border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-slate-500">Actualizado: {fechaLegible(doc.actualizadoEn)}</p>
      </td>
      <td className="px-3 py-3">
        <Badge tone={doc.disponible ? 'status' : 'neutral'} dot>
          {doc.disponible ? 'Disponible' : 'No disponible'}
        </Badge>
        {doc.disponible ? (
          <Link to={`/tesis/${tesis.id}/documento`} className="mt-1.5 block text-xs font-medium text-primary hover:underline">
            Ver documento
          </Link>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={guardar}
          disabled={!hayCambios || guardando}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Guardar
        </button>
        {mensaje.texto ? (
          <p className={`mt-1 text-xs ${mensaje.tipo === 'ok' ? 'text-primary' : 'text-secondary'}`}>{mensaje.texto}</p>
        ) : null}
      </td>
    </tr>
  );
}

// Documentos digitales de las tesis (propuesta, sección 4.5.6): nivel de acceso, activación y enlace de cada una.
export default function TesisDigitalesPanel({ onCambio }) {
  const [tesis, setTesis] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .tesis()
      .then((res) => setTesis(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar las tesis')))
      .finally(() => setCargando(false));
  }, []);

  function reemplazar(actualizada) {
    setTesis((lista) => lista.map((t) => (t.id === actualizada.id ? actualizada : t)));
    onCambio?.(); // el resumen de arriba cuenta las tesis con documento digital
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando tesis...
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <AlertBanner>{error}</AlertBanner>
      <p className="max-w-3xl text-sm text-slate-500">
        El nivel de acceso decide qué ve el público: <b>Acceso y descarga</b> permite ver y bajar el documento,{' '}
        <b>Consulta digital</b> solo permite verlo en línea y <b>Sin acceso digital</b> deja únicamente el ejemplar físico. Si
        escribes un enlace, el documento se toma de ahí; si lo dejas vacío, se usa el documento de ejemplo.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Tesis', 'Acceso', 'Enlace del documento', 'Estado', ''].map((h) => (
                <th key={h || 'acciones'} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tesis.map((t) => (
              <FilaTesis key={t.id} tesis={t} onGuardada={reemplazar} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
