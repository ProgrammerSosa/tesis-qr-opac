import { useState } from 'react';
import { X } from 'lucide-react';
import AlertBanner from '../../../shared/components/AlertBanner';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import { Input, Select, Textarea } from '../../../shared/components/FormField';
import { TIPOS_DOCUMENTO } from '../../catalog/tiposDocumento';
import { calcularDocumentoYQr } from '../documentoYQr';
import { useImpresionDeEtiquetas } from './ImpresionDeEtiquetas';
import SeccionDeDocumentoYQr from './SeccionDeDocumentoYQr';
import TesisAgregada from './TesisAgregada';

const VACIA = {
  id: '',
  titulo: '',
  autor: '',
  anio: '',
  tipoDocumento: 'tesis_grado',
  programa: '',
  director: '',
  paginas: '',
  temas: [],
  resumen: '',
  signatura: '',
  institucion: '',
  facultad: '',
  coleccion: '',
  ubicacion: '',
  estado: '',
  modalidadAcceso: '',
  consultaFisica: '',
  urlTesis: '',
  acceso: 'sin_acceso',
  destinoQr: 'url',
};

// El borrador del formulario: vacío para una tesis nueva; con los datos de la tesis (y su URL, su acceso y el destino de su
// QR) cuando se edita.
function borradorDe(tesis) {
  if (!tesis) return VACIA;
  const { documentoDigital, qr, ...datos } = tesis;
  return {
    ...VACIA,
    ...datos,
    anio: tesis.anio ?? '',
    paginas: tesis.paginas ?? '',
    urlTesis: documentoDigital?.urlExterna ?? '',
    acceso: documentoDigital?.acceso ?? 'sin_acceso',
    destinoQr: qr?.destino ?? 'url',
  };
}

// Temas de la tesis como etiquetas: se escribe uno y se agrega con Enter o con coma.
function CampoDeTemas({ valor, onCambio }) {
  const [texto, setTexto] = useState('');

  function agregar() {
    const nuevos = texto
      .split(/[;,]/)
      .map((t) => t.trim())
      .filter((t) => t && !valor.includes(t));
    if (nuevos.length > 0) onCambio([...valor, ...nuevos].slice(0, 10));
    setTexto('');
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-slate-500">Temas</span>
        <span className="text-xs text-slate-500">Escribe un tema y pulsa Enter o coma para agregarlo (hasta 10).</span>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
              e.preventDefault();
              agregar();
            } else if (e.key === 'Backspace' && !texto && valor.length > 0) {
              onCambio(valor.slice(0, -1));
            }
          }}
          onBlur={agregar}
          placeholder="Derecho civil"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>
      {valor.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {valor.map((tema) => (
            <li key={tema} className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-primary">
              {tema}
              <button type="button" aria-label={`Quitar el tema ${tema}`} onClick={() => onCambio(valor.filter((t) => t !== tema))} className="rounded-full p-0.5 hover:bg-blue-100">
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// Alta y edición de una tesis del catálogo: sus datos, la URL de la tesis (de la que sale su código QR) y el nivel de acceso.
// En la edición el código no se cambia: ya está impreso en el QR de la etiqueta. Al agregar una tesis, `onGuardar` devuelve
// la tesis guardada y el formulario pasa a mostrar su código QR listo para imprimir; `onOtra` empieza una tesis nueva.
export default function FormularioDeTesis({ abierto, tesis, onCerrar, onGuardar, onOtra }) {
  const editando = Boolean(tesis);
  const [form, setForm] = useState(() => borradorDe(tesis));
  // Mientras no elija el nivel de acceso, se le propone uno según haya o no URL (ver calcularDocumentoYQr).
  const [accesoTocado, setAccesoTocado] = useState(
    () => Boolean(tesis && (tesis.documentoDigital?.acceso !== 'sin_acceso' || tesis.documentoDigital?.urlExterna))
  );
  const [masDatos, setMasDatos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [guardada, setGuardada] = useState(null);
  const { imprimir, portal } = useImpresionDeEtiquetas();

  const cambiar = (campo) => (e) => setForm((previo) => ({ ...previo, [campo]: e.target.value }));
  const calculo = calcularDocumentoYQr({
    id: form.id,
    urlTesis: form.urlTesis,
    accesoElegido: form.acceso,
    accesoTocado,
    destinoQr: form.destinoQr,
    activo: tesis?.documentoDigital?.activo ?? true,
  });

  async function enviar(e) {
    e.preventDefault();
    if (calculo.revision.error) {
      setError('Corrige la URL de la tesis antes de guardar.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const resultado = await onGuardar({
        ...form,
        anio: String(form.anio).trim(),
        paginas: form.paginas === '' ? '' : Number(form.paginas),
        urlTesis: calculo.revision.url,
        acceso: calculo.acceso,
        destinoQr: form.destinoQr,
      });
      if (resultado) setGuardada(resultado);
    } catch (err) {
      setError(err.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  const formulario = (
    <form id="form-tesis" onSubmit={enviar} className="flex flex-col gap-3">
      <AlertBanner>{error}</AlertBanner>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Input
          label="Código (clasificación)"
          required
          value={form.id}
          onChange={cambiar('id')}
          disabled={editando}
          hint={editando ? 'El código no se puede cambiar: está impreso en el QR de la etiqueta.' : 'Por ejemplo, T14119. Debe ser único.'}
        />
        <Input label="Año" required inputMode="numeric" maxLength={4} value={form.anio} onChange={cambiar('anio')} placeholder="2024" />
      </div>
      <Input label="Título" required value={form.titulo} onChange={cambiar('titulo')} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Autor" required value={form.autor} onChange={cambiar('autor')} hint="Apellidos, nombres" />
        <Select label="Tipo de documento" value={form.tipoDocumento} onChange={cambiar('tipoDocumento')}>
          {Object.entries(TIPOS_DOCUMENTO).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </Select>
      </div>
      <CampoDeTemas valor={form.temas} onCambio={(temas) => setForm((previo) => ({ ...previo, temas }))} />
      <Textarea label="Resumen" rows={4} value={form.resumen} onChange={cambiar('resumen')} />

      <SeccionDeDocumentoYQr
        id={form.id}
        urlTesis={form.urlTesis}
        onUrl={cambiar('urlTesis')}
        calculo={calculo}
        onAcceso={(e) => {
          setAccesoTocado(true);
          setForm((previo) => ({ ...previo, acceso: e.target.value }));
        }}
        destinoQr={form.destinoQr}
        onDestino={(destinoQr) => setForm((previo) => ({ ...previo, destinoQr }))}
      />

      <button type="button" onClick={() => setMasDatos((v) => !v)} aria-expanded={masDatos} className="self-start text-sm font-semibold text-primary hover:underline">
        {masDatos ? 'Ocultar los demás datos' : 'Más datos (programa, director, signatura, ubicación...)'}
      </button>

      {masDatos ? (
        <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
          <Input label="Programa" value={form.programa} onChange={cambiar('programa')} hint="Si lo dejas vacío se usa el del tipo de documento." />
          <Input label="Director(a)" value={form.director} onChange={cambiar('director')} />
          <Input label="Páginas" inputMode="numeric" value={form.paginas} onChange={cambiar('paginas')} />
          <Input label="Signatura topográfica" value={form.signatura} onChange={cambiar('signatura')} />
          <Input label="Institución" value={form.institucion} onChange={cambiar('institucion')} placeholder="Universidad de San Carlos de Guatemala" />
          <Input label="Facultad" value={form.facultad} onChange={cambiar('facultad')} />
          <Input label="Colección" value={form.coleccion} onChange={cambiar('coleccion')} />
          <Input label="Ubicación" value={form.ubicacion} onChange={cambiar('ubicacion')} placeholder="Colección de tesis" />
          <Input label="Estado" value={form.estado} onChange={cambiar('estado')} placeholder="Disponible" />
          <Input label="Modalidad de acceso" value={form.modalidadAcceso} onChange={cambiar('modalidadAcceso')} placeholder="Anaquel cerrado" />
          <Input label="Consulta física" value={form.consultaFisica} onChange={cambiar('consultaFisica')} placeholder="Préstamo interno" />
        </div>
      ) : null}
    </form>
  );

  return (
    <>
      <Modal
        open={abierto}
        title={guardada ? 'Tesis agregada' : editando ? 'Editar tesis' : 'Agregar una tesis al catálogo'}
        onClose={guardando ? undefined : onCerrar}
        ancho="max-w-2xl"
        footer={
          guardada ? (
            <>
              <Button variant="secondary" onClick={onOtra}>
                Agregar otra tesis
              </Button>
              <Button variant="brand" onClick={onCerrar}>
                Listo
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onCerrar} disabled={guardando}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" form="form-tesis" disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar tesis'}
              </Button>
            </>
          )
        }
      >
        {guardada ? <TesisAgregada tesis={guardada} onImprimir={(t) => imprimir([t])} /> : formulario}
      </Modal>
      {portal}
    </>
  );
}
