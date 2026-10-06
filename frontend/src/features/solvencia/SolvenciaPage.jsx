import { useEffect, useState } from 'react';
import { solvenciaApi } from './solvenciaApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import Button from '../../shared/components/Button';
import AlertBanner from '../../shared/components/AlertBanner';
import Comprobante from '../../shared/components/Comprobante';
import PageHeader from '../../shared/components/PageHeader';
import { Input, Select } from '../../shared/components/FormField';

const CAMPOS_INICIALES = { solicitante: '', identificacion: '', programa: '', motivo: '', correo: '' };

export default function SolvenciaPage() {
  const { kiosco } = useKiosco();
  const [motivos, setMotivos] = useState([]);
  const [form, setForm] = useState(CAMPOS_INICIALES);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState(null);

  useEffect(() => {
    solvenciaApi
      .motivos()
      .then((res) => setMotivos(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar los motivos')));
  }, []);

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  // Antes de enviar se comprueba aquí lo básico; el servidor repite las comprobaciones.
  function validar() {
    if (!form.solicitante.trim() || !form.identificacion.trim() || !form.programa.trim() || !form.motivo) {
      return 'Completa tu nombre, tu carné o documento, tu programa y el motivo.';
    }
    if (form.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
      return 'El correo no parece válido. Revísalo o déjalo en blanco.';
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const res = await solvenciaApi.solicitar({ ...form, kiosco });
      setComprobante(res.data.data);
      setForm(CAMPOS_INICIALES); // el formulario se limpia al terminar: no queda nada para la persona siguiente
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar la solicitud'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ label: 'Inicio', to: '/' }, { label: 'Solicitud de solvencia' }]}
        title="Solicitud de solvencia"
        subtitle="Paz y salvo bibliotecario. Sigue los pasos: completa tus datos, revisa y envía. Al terminar recibes un comprobante y el personal revisa tu solicitud."
      />

      <AlertBanner>{error}</AlertBanner>

      {comprobante ? (
        <Comprobante
          tipo="solvencia"
          registro={comprobante}
          textoNueva="Hacer otra solicitud"
          onNueva={() => setComprobante(null)}
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4 rounded-xl border border-border bg-white p-5">
          <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
            <li className="text-primary">1. Datos</li>
            <li>2. Validación</li>
            <li>3. Envío</li>
            <li>4. Confirmación</li>
          </ol>
          <Input
            label="Nombre completo"
            required
            hint="Escríbelo como aparece en tu documento."
            value={form.solicitante}
            onChange={(e) => handleChange('solicitante', e.target.value)}
          />
          <Input
            label="Carné o número de documento"
            required
            hint="Con este dato la biblioteca encuentra tu registro."
            value={form.identificacion}
            onChange={(e) => handleChange('identificacion', e.target.value)}
          />
          <Input
            label="Programa académico"
            required
            hint="Por ejemplo, la carrera o el posgrado que cursas."
            value={form.programa}
            onChange={(e) => handleChange('programa', e.target.value)}
          />
          <Select
            label="Motivo"
            required
            hint="Para qué necesitas la solvencia."
            value={form.motivo}
            onChange={(e) => handleChange('motivo', e.target.value)}
          >
            <option value="">Selecciona un motivo</option>
            {motivos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input
            label="Correo electrónico (opcional)"
            type="email"
            hint="Si lo escribes, podrás enviarte el comprobante al terminar."
            value={form.correo}
            onChange={(e) => handleChange('correo', e.target.value)}
            placeholder="correo@ejemplo.com"
          />
          <p className="text-xs text-slate-500">
            Solo se guardan los datos necesarios para tu solicitud. Al terminar, la pantalla se limpia para proteger tu
            privacidad.
          </p>
          <Button type="submit" variant="primary" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Revisar y enviar solicitud'}
          </Button>
        </form>
      )}
    </div>
  );
}
