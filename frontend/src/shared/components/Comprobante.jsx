import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Mail, Printer } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import AlertBanner from './AlertBanner';
import { Input } from './FormField';
import { LIBRARY } from '../config/library';
import { comprobantesApi } from '../api/comprobantesApi';
import { getErrorMessage } from '../api/axiosClient';
import { useKiosco } from '../kiosco/KioscoContext';

// Constancia de una operación (propuesta, sección 4.5.5): se ve en pantalla, se puede imprimir como ticket
// (impresora térmica del kiosco) y se puede enviar por correo. Sirve para reservas y para solicitudes de solvencia.

const TITULOS = { reserva: 'Confirmación de reserva', solvencia: 'Solicitud de solvencia' };

function fechaYHora(iso) {
  const d = new Date(iso);
  const dos = (n) => String(n).padStart(2, '0');
  return {
    fecha: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`,
    hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`,
  };
}

function filasDe(tipo, r) {
  if (tipo === 'reserva') {
    return [
      ['Número de reserva', r.id],
      ['Código de confirmación', r.codigoConfirmacion],
      ['Espacio', r.recursoNombre],
      ...(r.modalidadNombre ? [['Tipo de reserva', r.modalidadNombre]] : []),
      ['Horario de uso', `${r.fecha} · ${r.hora} a ${r.horaFin}${r.duracion > 1 ? ` (${r.duracion} horas)` : ''}`],
      ['A nombre de', r.solicitante],
    ];
  }
  return [
    ['Número de solicitud', r.id],
    ['Código de confirmación', r.codigoConfirmacion],
    ['Motivo', r.motivo],
    ['Solicitante', r.solicitante],
    ['Programa', r.programa],
  ];
}

function instruccionesDe(tipo, toleranciaMinutos) {
  if (tipo === 'reserva') {
    return `Presenta el número de reserva o el código de confirmación en el mostrador.${
      toleranciaMinutos ? ` Si no te presentas dentro de ${toleranciaMinutos} minutos del inicio, la reserva se libera.` : ''
    }`;
  }
  return 'Tu solicitud será revisada por el personal de la biblioteca. Guarda el número de solicitud para darle seguimiento.';
}

// Lo que sale por la impresora: va aparte de la pantalla, en un ticket angosto de 80 mm.
function Ticket({ titulo, operacion, filas, instrucciones }) {
  return (
    <div style={{ width: '72mm', fontFamily: 'monospace', fontSize: '11px', lineHeight: 1.45, color: '#000' }}>
      <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>{LIBRARY.nombre}</p>
      <p style={{ textAlign: 'center' }}>{LIBRARY.facultad}</p>
      <hr style={{ border: 0, borderTop: '1px dashed #000', margin: '6px 0' }} />
      <p style={{ textAlign: 'center', fontWeight: 700 }}>{titulo.toUpperCase()}</p>
      <p style={{ textAlign: 'center' }}>
        Fecha: {operacion.fecha}  Hora: {operacion.hora}
      </p>
      <hr style={{ border: 0, borderTop: '1px dashed #000', margin: '6px 0' }} />
      {filas.map(([etiqueta, valor]) => (
        <p key={etiqueta}>
          <b>{etiqueta}:</b> {valor}
        </p>
      ))}
      <hr style={{ border: 0, borderTop: '1px dashed #000', margin: '6px 0' }} />
      <p>{instrucciones}</p>
      <p style={{ textAlign: 'center', marginTop: '8px' }}>{LIBRARY.lema}</p>
    </div>
  );
}

export default function Comprobante({ tipo, registro, toleranciaMinutos, textoNueva, onNueva }) {
  const { kiosco, registrarEvento } = useKiosco();
  const [imprimiendo, setImprimiendo] = useState(false);
  const [correo, setCorreo] = useState(registro.correo || '');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState('');
  const [error, setError] = useState('');

  const titulo = TITULOS[tipo];
  const operacion = fechaYHora(registro.creadoEn);
  const filas = filasDe(tipo, registro);
  const instrucciones = instruccionesDe(tipo, toleranciaMinutos);

  // El ticket se dibuja solo mientras se imprime; `afterprint` avisa cuando termina o se cancela.
  useEffect(() => {
    if (!imprimiendo) return undefined;
    document.body.classList.add('imprimiendo-ticket');
    const terminar = () => setImprimiendo(false);
    window.addEventListener('afterprint', terminar, { once: true });
    window.print();
    return () => {
      window.removeEventListener('afterprint', terminar);
      document.body.classList.remove('imprimiendo-ticket');
    };
  }, [imprimiendo]);

  function imprimir() {
    registrarEvento('comprobante_impreso');
    setImprimiendo(true);
  }

  async function enviarPorCorreo(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    setEnviado('');
    try {
      const res = await comprobantesApi.enviar({
        tipo,
        id: registro.id,
        codigo: registro.codigoConfirmacion,
        correo,
        kiosco,
      });
      setEnviado(res.data.data.para);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo enviar el comprobante'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-blue-50 p-5">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <CheckCircle2 size={18} />
        <span className="text-base font-bold">{titulo}</span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-slate-500">Fecha de la operación</dt>
        <dd>
          {operacion.fecha} · {operacion.hora}
        </dd>
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="contents">
            <dt className="text-slate-500">{etiqueta}</dt>
            <dd className={etiqueta.startsWith('Código') || etiqueta.startsWith('Número') ? 'font-mono font-semibold' : ''}>{valor}</dd>
          </div>
        ))}
        <dt className="text-slate-500">Estado</dt>
        <dd>
          <Badge tone={tipo === 'reserva' ? 'status' : 'warning'} dot>
            {tipo === 'reserva' ? 'Reservado' : 'Pendiente de revisión'}
          </Badge>
        </dd>
      </dl>

      <p className="mt-3 text-xs text-slate-600">{instrucciones}</p>

      <div className="mt-4 flex flex-col gap-3 border-t border-primary/20 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="brand" icon={Printer} onClick={imprimir}>
            Imprimir comprobante
          </Button>
          {onNueva ? (
            <button type="button" onClick={onNueva} className="text-sm font-semibold text-primary hover:underline">
              {textoNueva}
            </button>
          ) : null}
        </div>

        <form onSubmit={enviarPorCorreo} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="sm:w-72">
            <Input
              label="Enviar el comprobante a mi correo"
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <Button type="submit" variant="secondary" icon={Mail} disabled={enviando || !correo.trim()}>
            {enviando ? 'Enviando...' : 'Enviar por correo'}
          </Button>
        </form>
        <AlertBanner>{error}</AlertBanner>
        {enviado ? (
          <p className="text-sm text-slate-700">
            Comprobante enviado a <b>{enviado}</b>. En este prototipo el envío es simulado: no sale un correo real hasta
            conectar el servidor de correo de la Facultad.
          </p>
        ) : null}
      </div>

      {imprimiendo
        ? createPortal(
            <div id="ticket-impresion">
              <Ticket titulo={titulo} operacion={operacion} filas={filas} instrucciones={instrucciones} />
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
