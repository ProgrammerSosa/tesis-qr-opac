import { useEffect, useRef, useState } from 'react';
import { CalendarClock, ClipboardCheck, Send } from 'lucide-react';
import { solvenciaApi } from './solvenciaApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import AlertBanner from '../../shared/components/AlertBanner';
import Button from '../../shared/components/Button';
import Comprobante from '../../shared/components/Comprobante';
import EnlaceExterno from '../../shared/components/EnlaceExterno';
import Nota from '../../shared/components/Nota';
import Page from '../../shared/components/Page';
import Pasos from '../../shared/components/Pasos';
import { Checkbox, Input, Select } from '../../shared/components/FormField';
import { ENLACES_EXTERNOS, LIBRARY } from '../../shared/config/library';
import { diaDeLaSemana, fechaLarga, hoyISO, sumarDias } from '../../shared/utils/fechas';
import { correoValido, hayErrores, soloDigitos, textoEntre } from '../../shared/utils/validaciones';

const CAMPOS_INICIALES = {
  solicitante: '',
  identificacion: '',
  cui: '',
  programa: '',
  motivo: '',
  correo: '',
  ordenDePago: '',
  fechaPapeleria: '',
  esEstudiante: false,
  revise: false,
};

const PROGRAMAS = [
  'Licenciatura en Ciencias Jurídicas y Sociales, Abogado y Notario',
  'Maestría en Derecho',
  'Doctorado en Derecho',
];

// Cuándo se entrega la solvencia según la hora a la que se envíe la solicitud (horarios que publica la biblioteca).
const ENTREGAS = [
  { envio: 'De 08:00 a 13:00 horas', entrega: 'Ese mismo día, a las 15:00 horas' },
  { envio: 'De 13:01 a 17:00 horas', entrega: 'Ese mismo día, a las 18:00 horas' },
  { envio: 'De 17:01 a 07:59 horas', entrega: 'A las 14:00 horas del siguiente día hábil' },
];

function validar(form, diasMaximos) {
  const hoy = hoyISO();
  const errores = {};
  if (!textoEntre(form.solicitante, 3, 80)) errores.solicitante = 'Escribe tu nombre completo.';
  if (!/^[0-9A-Za-z-]{5,15}$/.test(form.identificacion.trim())) errores.identificacion = 'Escribe tu carné (de 5 a 15 letras o números).';
  if (soloDigitos(form.cui).length !== 13) errores.cui = 'El CUI (el número de tu DPI) tiene 13 números.';
  if (!textoEntre(form.programa, 3, 120)) errores.programa = 'Escribe tu carrera o programa académico.';
  if (!form.motivo) errores.motivo = 'Elige el motivo de la solvencia.';
  if (!correoValido(form.correo)) errores.correo = 'Escribe un correo válido: ahí recibirás la confirmación y tu solvencia.';
  if (!/^[0-9A-Za-z-]{4,20}$/.test(form.ordenDePago.trim())) errores.ordenDePago = 'Escribe el número de tu orden de pago.';
  if (!form.fechaPapeleria) {
    errores.fechaPapeleria = 'Indica la fecha en la que presentarás tu papelería.';
  } else if (form.fechaPapeleria <= hoy) {
    errores.fechaPapeleria = 'Debe ser, como mínimo, mañana: la solicitud se envía con 24 horas de anticipación.';
  } else if (form.fechaPapeleria > sumarDias(hoy, diasMaximos)) {
    errores.fechaPapeleria = `Solo puedes pedir la solvencia con un máximo de ${diasMaximos} días de anticipación.`;
  } else if ([0, 6].includes(diaDeLaSemana(form.fechaPapeleria))) {
    errores.fechaPapeleria = 'Las solvencias se entregan de lunes a viernes: elige un día hábil.';
  }
  if (!form.esEstudiante) errores.esEstudiante = 'Este servicio es solo para estudiantes de la Facultad del Campus Central.';
  if (!form.revise) errores.revise = 'Confirma que revisaste tus datos antes de enviar.';
  return errores;
}

export default function SolvenciaPage() {
  const { kiosco } = useKiosco();
  const [reglas, setReglas] = useState(null);
  const [form, setForm] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const formulario = useRef(null);

  useEffect(() => {
    solvenciaApi
      .reglas()
      .then((res) => setReglas(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar la información del servicio')));
  }, []);

  const diasMaximos = reglas?.diasMaximosDeAnticipacion ?? 7;
  const hoy = hoyISO();

  function cambiar(campo, valor) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    if (errores[campo]) setErrores((previo) => ({ ...previo, [campo]: '' }));
  }

  async function enviar(e) {
    e.preventDefault();
    const encontrados = validar(form, diasMaximos);
    setErrores(encontrados);
    if (hayErrores(encontrados)) {
      setError('Revisa los campos marcados.');
      formulario.current?.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const { revise, ...datos } = form;
      const res = await solvenciaApi.solicitar({ ...datos, cui: soloDigitos(form.cui), kiosco });
      setComprobante(res.data.data);
      setForm(CAMPOS_INICIALES); // el formulario se limpia al terminar: no queda nada para la persona siguiente
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar la solicitud'));
    } finally {
      setEnviando(false);
    }
  }

  const pasos = [
    {
      titulo: 'Genera la orden de pago',
      texto: 'En el sistema SIIF de la USAC, con el concepto de solvencia de biblioteca de tu unidad académica.',
      extra: (
        <EnlaceExterno href={ENLACES_EXTERNOS.siif} className="text-sm font-bold text-primary hover:underline">
          Ir a SIIF USAC
        </EnlaceExterno>
      ),
    },
    { titulo: 'Cancela la orden de pago', texto: 'En una agencia de Bantrab, Banrural o G&T Continental.' },
    { titulo: 'Verifica el número de orden', texto: 'Debe ser el mismo que aparece en tu boleta de depósito bancario.' },
    { titulo: 'Llena esta solicitud', texto: `Con por lo menos 24 horas de anticipación y máximo ${diasMaximos} días antes de presentar tu papelería.` },
    { titulo: 'Confirma en tu correo', texto: 'Te enviamos una confirmación con los datos que registraste. Si no llega en 5 minutos, repite la solicitud.' },
    { titulo: 'Recibe tu solvencia', texto: 'La enviamos en PDF a tu correo para que la imprimas, en los horarios de entrega.' },
  ];

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Solvencia de biblioteca' }]}
      title="Solicitud de solvencia"
      subtitle="Paz y salvo bibliotecario, en formato electrónico. Sigue los pasos, llena tus datos y recibe la solvencia en tu correo."
    >
      {comprobante ? (
        <div className="mx-auto max-w-3xl">
          <Comprobante tipo="solvencia" registro={comprobante} textoNueva="Hacer otra solicitud" onNueva={() => setComprobante(null)} />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
          <section className="lg:col-start-2 lg:row-start-1" aria-labelledby="pasos-titulo">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 id="pasos-titulo" className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
                <ClipboardCheck size={22} className="text-action" aria-hidden="true" />
                Antes de empezar
              </h2>
              <Pasos pasos={pasos} />
            </div>
          </section>

          <form
            ref={formulario}
            onSubmit={enviar}
            noValidate
            className="campos-grandes flex flex-col gap-7 rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8 lg:col-start-1 lg:row-span-2 lg:row-start-1"
          >
            <Nota tono="aviso" titulo="Solo para estudiantes de la Facultad">
              Nuestro servicio de solvencias aplica únicamente a estudiantes de la {LIBRARY.facultad} del Campus Central.
            </Nota>

            <AlertBanner>{error}</AlertBanner>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 font-display text-lg font-semibold text-slate-900">Tus datos</legend>
              <Input
                label="Nombre completo"
                required
                hint="Escríbelo tal como aparece en tu documento: si la solvencia sale con un error en el nombre no hay reposición."
                value={form.solicitante}
                error={errores.solicitante}
                autoComplete="name"
                onChange={(e) => cambiar('solicitante', e.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Carné"
                  required
                  value={form.identificacion}
                  error={errores.identificacion}
                  hint="Tu número de carné universitario."
                  onChange={(e) => cambiar('identificacion', e.target.value)}
                />
                <Input
                  label="CUI (número de DPI)"
                  required
                  inputMode="numeric"
                  maxLength={17}
                  value={form.cui}
                  error={errores.cui}
                  hint={`13 números${form.cui ? ` · llevas ${soloDigitos(form.cui).length}` : ''}`}
                  onChange={(e) => cambiar('cui', e.target.value)}
                />
              </div>
              <Input
                label="Carrera o programa académico"
                required
                list="programas"
                value={form.programa}
                error={errores.programa}
                onChange={(e) => cambiar('programa', e.target.value)}
              />
              <datalist id="programas">
                {PROGRAMAS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <Input
                label="Correo electrónico"
                required
                type="email"
                autoComplete="email"
                value={form.correo}
                error={errores.correo}
                hint="Ahí recibirás la confirmación y tu solvencia en PDF. Escríbelo con cuidado: la biblioteca no se hace responsable por un correo mal escrito."
                onChange={(e) => cambiar('correo', e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 font-display text-lg font-semibold text-slate-900">Tu pago y tu trámite</legend>
              <Select
                label="Motivo de la solvencia"
                required
                value={form.motivo}
                error={errores.motivo}
                onChange={(e) => cambiar('motivo', e.target.value)}
              >
                <option value="">Selecciona un motivo</option>
                {(reglas?.motivos ?? []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Número de orden de pago"
                  required
                  value={form.ordenDePago}
                  error={errores.ordenDePago}
                  hint="El mismo de tu boleta de depósito bancario."
                  onChange={(e) => cambiar('ordenDePago', e.target.value)}
                />
                <Input
                  label="Fecha en que presentarás tu papelería"
                  required
                  type="date"
                  min={sumarDias(hoy, 1)}
                  max={sumarDias(hoy, diasMaximos)}
                  value={form.fechaPapeleria}
                  error={errores.fechaPapeleria}
                  hint={`Entre mañana y ${diasMaximos} días adelante, de lunes a viernes.`}
                  onChange={(e) => cambiar('fechaPapeleria', e.target.value)}
                />
              </div>
              {form.fechaPapeleria && !errores.fechaPapeleria ? (
                <p className="-mt-2 text-sm text-slate-600">Presentarás tu papelería el {fechaLarga(form.fechaPapeleria)}.</p>
              ) : null}
            </fieldset>

            <fieldset className="flex flex-col gap-3.5">
              <legend className="mb-1 font-display text-lg font-semibold text-slate-900">Confirmaciones</legend>
              <Checkbox checked={form.esEstudiante} error={errores.esEstudiante} onChange={(e) => cambiar('esEstudiante', e.target.checked)}>
                Soy estudiante de la {LIBRARY.facultad} del Campus Central.
              </Checkbox>
              <Checkbox checked={form.revise} error={errores.revise} onChange={(e) => cambiar('revise', e.target.checked)}>
                Revisé mis datos. Sé que si la solvencia se emite con errores en el nombre, el CUI, el carné o la fecha de papelería no habrá reposición
                y tendré que pagar y tramitarla de nuevo.
              </Checkbox>
            </fieldset>

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                Solo se guardan los datos necesarios para tu solicitud. Al terminar, la pantalla se limpia para proteger tu privacidad.
              </p>
              <Button type="submit" variant="primary" icon={Send} disabled={enviando} className="px-8 py-3.5 text-base">
                {enviando ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </div>
          </form>

          <section className="lg:col-start-2 lg:row-start-2" aria-labelledby="entrega-titulo">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 id="entrega-titulo" className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
                <CalendarClock size={22} className="text-action" aria-hidden="true" />
                ¿Cuándo recibo mi solvencia?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Las solvencias se emiten y se entregan de lunes a viernes. En días festivos o de asueto no hay entrega.
              </p>
              <table className="mt-4 w-full text-left text-sm">
                <caption className="sr-only">Horario de entrega de la solvencia según la hora de envío</caption>
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="py-2 pr-3 font-bold">
                      Si la envías
                    </th>
                    <th scope="col" className="py-2 font-bold">
                      Entrega
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ENTREGAS.map((e) => (
                    <tr key={e.envio} className="border-b border-border/60 align-top last:border-0">
                      <th scope="row" className="py-2.5 pr-3 font-semibold text-slate-800">
                        {e.envio}
                      </th>
                      <td className="py-2.5 text-slate-700">{e.entrega}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reglas?.entregaSiEnviasAhora ? (
                <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-950">
                  Si envías tu solicitud <b>ahora</b>, la entrega sería el <b>{fechaLarga(reglas.entregaSiEnviasAhora.fecha)}</b> a las{' '}
                  <b>{reglas.entregaSiEnviasAhora.hora}</b> horas.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}
