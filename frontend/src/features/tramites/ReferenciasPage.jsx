import { useRef, useState } from 'react';
import { Quote, Send } from 'lucide-react';
import { tramitesApi } from './tramitesApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import AlertBanner from '../../shared/components/AlertBanner';
import Button from '../../shared/components/Button';
import Comprobante from '../../shared/components/Comprobante';
import Nota from '../../shared/components/Nota';
import Page from '../../shared/components/Page';
import Pasos from '../../shared/components/Pasos';
import { Input, Textarea } from '../../shared/components/FormField';
import { correoValido, hayErrores, textoEntre } from '../../shared/utils/validaciones';

const FORM_INICIAL = { tema: '', fuente: '', solicitante: '', identificacion: '', correo: '' };

const PASOS = [
  { titulo: 'Llena el formulario', texto: 'Indica el tema y la fuente de la que necesitas la referencia.' },
  { titulo: 'Recibe un correo', texto: 'Las bibliotecólogas te responden con tu referencia en un plazo de 24 horas, en días y horas hábiles.' },
];

export default function ReferenciasPage() {
  const { kiosco } = useKiosco();
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const formulario = useRef(null);

  function cambiar(campo, valor) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    if (errores[campo]) setErrores((previo) => ({ ...previo, [campo]: '' }));
  }

  function validar() {
    const encontrados = {};
    if (!textoEntre(form.tema, 5, 400)) encontrados.tema = 'Cuéntanos el tema (de 5 a 400 caracteres).';
    if (!textoEntre(form.fuente, 3, 400)) encontrados.fuente = 'Indica la fuente de la que necesitas la referencia.';
    if (!textoEntre(form.solicitante, 3, 80)) encontrados.solicitante = 'Escribe tu nombre completo.';
    if (form.identificacion.trim() && !/^[0-9A-Za-z-]{5,20}$/.test(form.identificacion.trim())) {
      encontrados.identificacion = 'El carné o documento debe tener de 5 a 20 letras o números (o déjalo en blanco).';
    }
    if (!correoValido(form.correo)) encontrados.correo = 'Escribe un correo válido: ahí recibirás la referencia.';
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
      const res = await tramitesApi.solicitar('referencias', { ...form, kiosco });
      setComprobante(res.data.data);
      setForm(FORM_INICIAL);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar la solicitud'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Referencias bibliográficas' }]}
      title="Referencias bibliográficas"
      subtitle="Pide apoyo a nuestras bibliotecólogas para tus procesos de investigación: te respondemos por correo."
    >
      {comprobante ? (
        <div className="mx-auto max-w-3xl">
          <Comprobante tipo="referencias" registro={comprobante} textoNueva="Hacer otra solicitud" onNueva={() => setComprobante(null)} />
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
              <legend className="mb-1 font-display text-lg font-semibold text-slate-900">Qué necesitas</legend>
              <Textarea
                label="Tema"
                required
                rows={3}
                hint="Describe el tema de tu investigación o la referencia que necesitas."
                value={form.tema}
                error={errores.tema}
                onChange={(e) => cambiar('tema', e.target.value)}
              />
              <Textarea
                label="Fuente"
                required
                rows={3}
                hint="El libro, la ley, el artículo o la página de la que necesitas la referencia."
                value={form.fuente}
                error={errores.fuente}
                onChange={(e) => cambiar('fuente', e.target.value)}
              />
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
                  hint="Ahí recibirás la referencia."
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
              <Button type="submit" variant="primary" icon={Send} disabled={enviando} className="px-8 py-3.5 text-base">
                {enviando ? 'Enviando...' : 'Solicitar referencia'}
              </Button>
            </div>
          </form>

          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
                <Quote size={22} className="text-action" aria-hidden="true" />
                Cómo funciona
              </h2>
              <Pasos pasos={PASOS} />
            </div>
            <Nota tono="info" titulo="Días y horas hábiles">
              El plazo de 24 horas se cuenta en días y horas hábiles: si envías tu solicitud fuera del horario de atención o en un día de asueto, la
              respuesta puede tardar un poco más.
            </Nota>
          </aside>
        </div>
      )}
    </Page>
  );
}
