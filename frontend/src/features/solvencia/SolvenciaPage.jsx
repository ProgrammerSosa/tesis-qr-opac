import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { solvenciaApi } from './solvenciaApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import Button from '../../shared/components/Button';
import AlertBanner from '../../shared/components/AlertBanner';
import Badge from '../../shared/components/Badge';
import { Input, Select } from '../../shared/components/FormField';

const CAMPOS_INICIALES = { solicitante: '', identificacion: '', programa: '', motivo: '' };

export default function SolvenciaPage() {
  const [motivos, setMotivos] = useState([]);
  const [form, setForm] = useState(CAMPOS_INICIALES);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState(null);

  useEffect(() => {
    solvenciaApi.motivos().then((res) => setMotivos(res.data.data));
  }, []);

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const res = await solvenciaApi.solicitar(form);
      setComprobante(res.data.data);
      setForm(CAMPOS_INICIALES);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar la solicitud'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Trámites</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-primary-dark">Solicitud de solvencia</h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">
          Paz y salvo bibliotecario. Diligencia el formulario y recibe un número de radicado para hacer seguimiento,
          sin necesidad de pedirlo en el mostrador.
        </p>
      </div>

      <AlertBanner>{error}</AlertBanner>

      {comprobante ? (
        <div className="rounded-xl border border-accent/40 bg-accent-light p-5">
          <div className="mb-3 flex items-center gap-2 text-accent">
            <CheckCircle2 size={18} />
            <span className="font-serif text-base font-semibold">Solicitud radicada</span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-slate-500">Radicado</dt>
            <dd className="font-mono font-semibold">{comprobante.id}</dd>
            <dt className="text-slate-500">Solicitante</dt>
            <dd>{comprobante.solicitante}</dd>
            <dt className="text-slate-500">Motivo</dt>
            <dd>{comprobante.motivo}</dd>
            <dt className="text-slate-500">Estado</dt>
            <dd>
              <Badge tone="warning">Pendiente de revisión</Badge>
            </dd>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Guarda el radicado {comprobante.id}: con él puedes consultar el estado en el mostrador o en el panel
            administrativo.
          </p>
          <button onClick={() => setComprobante(null)} className="mt-3 text-xs font-medium text-accent hover:underline">
            Hacer otra solicitud
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3 rounded-xl border border-border bg-white p-5">
          <Input
            label="Nombre completo"
            required
            value={form.solicitante}
            onChange={(e) => handleChange('solicitante', e.target.value)}
          />
          <Input
            label="Número de identificación"
            required
            value={form.identificacion}
            onChange={(e) => handleChange('identificacion', e.target.value)}
          />
          <Input label="Programa académico" required value={form.programa} onChange={(e) => handleChange('programa', e.target.value)} />
          <Select label="Motivo" required value={form.motivo} onChange={(e) => handleChange('motivo', e.target.value)}>
            <option value="">Selecciona un motivo</option>
            {motivos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="primary" className="mt-1" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Radicar solicitud'}
          </Button>
        </form>
      )}
    </div>
  );
}
