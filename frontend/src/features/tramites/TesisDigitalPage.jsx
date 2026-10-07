import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleCheck, FileText, Search, Send, X } from 'lucide-react';
import { tramitesApi } from './tramitesApi';
import { catalogApi } from '../catalog/catalogApi';
import { TIPOS_DOCUMENTO } from '../catalog/tiposDocumento';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import AlertBanner from '../../shared/components/AlertBanner';
import Button from '../../shared/components/Button';
import Comprobante from '../../shared/components/Comprobante';
import Nota from '../../shared/components/Nota';
import Page from '../../shared/components/Page';
import Pasos from '../../shared/components/Pasos';
import { Input, Select } from '../../shared/components/FormField';
import { correoValido, hayErrores, textoEntre } from '../../shared/utils/validaciones';

const FORM_INICIAL = { tesisId: '', nivel: 'grado', clasificacion: '', autor: '', titulo: '', anio: '', solicitante: '', identificacion: '', correo: '' };

const nivelDe = (tesis) => (tesis.tipoDocumento === 'tesis_grado' ? 'grado' : 'posgrado');

// Busca en el catálogo mientras la persona escribe, para llenar los datos de la tesis sin tener que copiarlos a mano.
function BuscadorDeTesis({ onElegir }) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);

  useEffect(() => {
    const consulta = texto.trim();
    if (consulta.length < 3) {
      setResultados([]);
      return undefined;
    }
    setBuscando(true);
    const espera = setTimeout(async () => {
      try {
        const [porTitulo, porAutor] = await Promise.all([
          catalogApi.buscar({ titulo: consulta, porPagina: 6 }),
          catalogApi.buscar({ autor: consulta, porPagina: 6 }),
        ]);
        const vistos = new Map();
        [...porTitulo.data.data.items, ...porAutor.data.data.items].forEach((t) => vistos.set(t.id, t));
        setResultados([...vistos.values()].slice(0, 6));
        setAbierto(true);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => clearTimeout(espera);
  }, [texto]);

  useEffect(() => {
    const alPulsar = (e) => {
      if (caja.current && !caja.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', alPulsar);
    return () => document.removeEventListener('mousedown', alPulsar);
  }, []);

  return (
    <div ref={caja} className="relative">
      <Input
        label="Busca la tesis en el catálogo (opcional)"
        hint="Escribe parte del título o del autor y elige la tesis para llenar los datos automáticamente."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onFocus={() => resultados.length > 0 && setAbierto(true)}
        placeholder="Por ejemplo: conciliación extrajudicial"
        autoComplete="off"
      />
      {buscando ? <span className="pointer-events-none absolute right-4 top-[2.6rem] text-xs text-slate-400">Buscando…</span> : null}
      {abierto && resultados.length > 0 ? (
        <ul className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-lift">
          {resultados.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  onElegir(t);
                  setTexto('');
                  setAbierto(false);
                }}
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-surface"
              >
                <span className="text-sm font-semibold text-slate-900">{t.titulo}</span>
                <span className="text-xs text-slate-500">
                  {t.autor} · {t.anio} · {TIPOS_DOCUMENTO[t.tipoDocumento] ?? t.modalidad}
                  {t.documentoDigital?.disponible ? ' · ya tiene documento digital' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {abierto && !buscando && texto.trim().length >= 3 && resultados.length === 0 ? (
        <p className="mt-1.5 text-xs text-slate-500">No encontramos tesis con ese texto. Puedes llenar los datos a mano.</p>
      ) : null}
    </div>
  );
}

export default function TesisDigitalPage() {
  const { kiosco } = useKiosco();
  const [parametros] = useSearchParams();
  const [reglas, setReglas] = useState({ anioMinimoGrado: 2010, anioMinimoPosgrado: 2016 });
  const [form, setForm] = useState(FORM_INICIAL);
  const [elegida, setElegida] = useState(null); // la tesis del catálogo que se eligió, si hubo
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const formulario = useRef(null);

  useEffect(() => {
    tramitesApi
      .reglas()
      .then((res) => setReglas(res.data.data))
      .catch(() => {});
  }, []);

  function aplicarTesis(tesis) {
    setElegida(tesis);
    setForm((previo) => ({
      ...previo,
      tesisId: tesis.id,
      nivel: nivelDe(tesis),
      clasificacion: tesis.id,
      autor: tesis.autor,
      titulo: tesis.titulo,
      anio: tesis.anio,
    }));
    setErrores({});
    setError('');
  }

  // Si se llega desde la ficha de una tesis (/tesis-digital?tesis=CODIGO), los datos ya vienen llenos.
  const codigo = parametros.get('tesis');
  useEffect(() => {
    if (!codigo) return;
    catalogApi
      .getById(codigo)
      .then((res) => aplicarTesis(res.data.data))
      .catch(() => {});
  }, [codigo]);

  function cambiar(campo, valor) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    if (errores[campo]) setErrores((previo) => ({ ...previo, [campo]: '' }));
  }

  const minimo = form.nivel === 'grado' ? reglas.anioMinimoGrado : reglas.anioMinimoPosgrado;
  const yaDigital = Boolean(elegida?.documentoDigital?.disponible);

  function validar() {
    const encontrados = {};
    const anio = Number(form.anio);
    if (!textoEntre(form.clasificacion, 3, 30)) encontrados.clasificacion = 'Escribe la clasificación que ves en el catálogo (por ejemplo, T14119).';
    if (!textoEntre(form.autor, 3, 120)) encontrados.autor = 'Escribe el nombre del autor.';
    if (!textoEntre(form.titulo, 5, 400)) encontrados.titulo = 'Escribe el título de la tesis.';
    if (!/^\d{4}$/.test(String(form.anio).trim())) {
      encontrados.anio = 'Escribe el año con cuatro números.';
    } else if (anio < minimo) {
      encontrados.anio = `Solo se publican en digital las tesis de ${form.nivel} desde ${minimo}. Para una tesis anterior, consulta el ejemplar impreso en la biblioteca.`;
    }
    if (!textoEntre(form.solicitante, 3, 80)) encontrados.solicitante = 'Escribe tu nombre completo.';
    if (form.identificacion.trim() && !/^[0-9A-Za-z-]{5,20}$/.test(form.identificacion.trim())) {
      encontrados.identificacion = 'El carné o documento debe tener de 5 a 20 letras o números (o déjalo en blanco).';
    }
    if (!correoValido(form.correo)) encontrados.correo = 'Escribe un correo válido: ahí te avisaremos cuando la tesis esté disponible.';
    return encontrados;
  }

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validar();
    setErrores(encontrados);
    if (hayErrores(encontrados)) {
      setError('Revisa los campos marcados.');
      formulario.current?.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const res = await tramitesApi.solicitar('tesis_digital', { ...form, kiosco });
      setComprobante(res.data.data);
      setForm(FORM_INICIAL);
      setElegida(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar la solicitud'));
    } finally {
      setEnviando(false);
    }
  }

  const pasos = [
    {
      titulo: 'Encuentra la tesis',
      texto: 'Búscala en el catálogo y revisa que no tenga ya un documento digital.',
      extra: (
        <Link to="/catalogo" className="text-sm font-bold text-primary hover:underline">
          Ir al catálogo
        </Link>
      ),
    },
    { titulo: 'Llena la solicitud', texto: 'Con la clasificación, el autor y el título. Si la eliges del buscador, se llenan solos.' },
    { titulo: 'Espera tu aviso', texto: 'Cuando la tesis esté publicada en el repositorio, recibirás una notificación en tu correo para consultarla o descargarla.' },
  ];

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Tesis en formato digital' }]}
      title="Solicita una tesis en formato digital"
      subtitle="Pide que la biblioteca publique en su repositorio una tesis que todavía no está disponible para consulta o descarga."
    >
      {comprobante ? (
        <div className="mx-auto max-w-3xl">
          <Comprobante tipo="tesis_digital" registro={comprobante} textoNueva="Solicitar otra tesis" onNueva={() => setComprobante(null)} />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
          <form
            ref={formulario}
            onSubmit={enviar}
            noValidate
            className="campos-grandes flex flex-col gap-7 rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8"
          >
            <AlertBanner>{error}</AlertBanner>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 font-display text-lg font-semibold text-slate-900">La tesis</legend>
              <BuscadorDeTesis onElegir={aplicarTesis} />

              {elegida ? (
                <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-blue-50 p-4">
                  <CircleCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-bold text-slate-900">Tesis elegida del catálogo</p>
                    <p className="mt-0.5 text-slate-700">{elegida.titulo}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setElegida(null);
                      setForm((previo) => ({ ...previo, tesisId: '' }));
                    }}
                    aria-label="Quitar la tesis elegida"
                    className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-slate-900"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : null}

              {yaDigital ? (
                <Nota tono="ok" titulo="Esta tesis ya está disponible en digital">
                  No necesitas pedirla: puedes{' '}
                  <Link to={`/tesis/${elegida.id}/documento`} className="inline-flex items-center gap-1 font-bold text-emerald-900 underline">
                    <FileText size={14} aria-hidden="true" />
                    consultar el documento
                  </Link>{' '}
                  desde su ficha.
                </Nota>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Nivel" required value={form.nivel} onChange={(e) => cambiar('nivel', e.target.value)} hint={`Desde ${reglas.anioMinimoGrado} (grado) y ${reglas.anioMinimoPosgrado} (posgrado).`}>
                  <option value="grado">Tesis de grado</option>
                  <option value="posgrado">Tesis de posgrado</option>
                </Select>
                <Input
                  label="Año de la tesis"
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={form.anio}
                  error={errores.anio}
                  onChange={(e) => cambiar('anio', e.target.value.replace(/\D/g, ''))}
                  placeholder={String(minimo)}
                />
              </div>
              <Input
                label="Clasificación"
                required
                hint="La que aparece en el catálogo. Ejemplo: T14119"
                value={form.clasificacion}
                error={errores.clasificacion}
                onChange={(e) => cambiar('clasificacion', e.target.value)}
              />
              <Input
                label="Autor"
                required
                hint="Ejemplo: Mijangos Vásquez, Carlos Enrique"
                value={form.autor}
                error={errores.autor}
                onChange={(e) => cambiar('autor', e.target.value)}
              />
              <Input label="Título de la tesis" required value={form.titulo} error={errores.titulo} onChange={(e) => cambiar('titulo', e.target.value)} />
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 font-display text-lg font-semibold text-slate-900">Tus datos</legend>
              <Input
                label="Nombre completo"
                required
                autoComplete="name"
                value={form.solicitante}
                error={errores.solicitante}
                onChange={(e) => cambiar('solicitante', e.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Correo electrónico"
                  required
                  type="email"
                  autoComplete="email"
                  hint="Ahí recibirás el aviso."
                  value={form.correo}
                  error={errores.correo}
                  onChange={(e) => cambiar('correo', e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
                <Input
                  label="Carné o documento (opcional)"
                  value={form.identificacion}
                  error={errores.identificacion}
                  onChange={(e) => cambiar('identificacion', e.target.value)}
                />
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                Solo se guardan los datos necesarios para tu solicitud. Al terminar, la pantalla se limpia para proteger tu privacidad.
              </p>
              <Button type="submit" variant="primary" icon={Send} disabled={enviando || yaDigital} className="px-8 py-3.5 text-base">
                {enviando ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </div>
          </form>

          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
                <Search size={22} className="text-action" aria-hidden="true" />
                Cómo funciona
              </h2>
              <Pasos pasos={pasos} />
            </div>
            <Nota tono="info" titulo="¿De qué años?">
              La biblioteca puede publicar en digital las tesis de <b>grado desde {reglas.anioMinimoGrado}</b> y las de <b>posgrado desde {reglas.anioMinimoPosgrado}</b>. El repositorio crece
              por etapas hasta reunir toda la colección.
            </Nota>
          </aside>
        </div>
      )}
    </Page>
  );
}
