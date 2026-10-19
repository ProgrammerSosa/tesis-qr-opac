import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EQUIPO_POR_TIPO } from '../../reservas/equipoDeLosLugares';
import { LIBRARY } from '../../../shared/config/library';
import { fechaYHora, nombreDelDia } from '../../../shared/utils/fechas';

// Boletas de uso de los espacios de estudio: las mismas hojas que la biblioteca imprime en el mostrador, pero con los datos de la
// reserva ya llenos (nombre, carné, lugar, fecha y horario). Lo que el sistema no sabe (celular, llave, documento que se deja, horas
// reales) queda en blanco para llenarlo a mano. Hay dos formatos, como en papel:
//   - cubículos: hoja carta «Reserva de Cubículo», con el equipo, las normas, las firmas y el horario que pidió la persona;
//   - estaciones y sala de lectura: media carta, con los accesorios, las condiciones de uso y las firmas.

const fechaEscrita = (iso) => {
  const [anio, mes, dia] = String(iso).split('-');
  return `${dia}/${mes}/${anio}`;
};
const numeroDelLugar = (reserva) => (reserva.tipo === 'sala_lectura' ? reserva.recursoNombre : String(reserva.recursoId).split('-').pop());
// "Lunes 19/10/2026"
const diaDeLaReserva = (reserva) => {
  const nombre = nombreDelDia(reserva.fecha);
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${fechaEscrita(reserva.fecha)}`;
};
const horasDeLaReserva = (reserva) => `${reserva.hora} – ${reserva.horaFin}${reserva.duracion > 1 ? ` (${reserva.duracion} horas)` : ' (1 hora)'}`;

function Escudo({ className = '' }) {
  return <img src={LIBRARY.logo} alt="" className={`w-auto ${className}`} />;
}

// Un dato escrito sobre una línea, como en el formulario: lo que el sistema sabe va lleno; lo demás, en blanco para escribir a mano.
function Linea({ etiqueta, valor, className = '' }) {
  return (
    <span className={`flex min-w-0 items-end gap-1.5 ${className}`}>
      <span className="shrink-0">{etiqueta}</span>
      <span className="min-h-[1.25em] min-w-0 flex-1 truncate border-b border-slate-700 px-1 font-semibold leading-tight">{valor ?? ''}</span>
    </span>
  );
}

function Referencia({ reserva, impresaEn }) {
  const impresa = fechaYHora(impresaEn);
  return (
    <span className="font-mono">
      Reserva {reserva.id} · Código {reserva.codigoConfirmacion} · Impresa {impresa.fecha} {impresa.hora}
    </span>
  );
}

// --- Cubículos: hoja carta -------------------------------------------------------------------------------------------

function FormatoCubiculo({ reserva, toleranciaMinutos, horasDePenalizacion, atendidoPor, impresaEn }) {
  const equipo = EQUIPO_POR_TIPO.cubiculo;
  return (
    <article className="flex flex-col gap-2.5 bg-white text-[10pt] leading-snug text-slate-900">
      <div className="h-1.5 bg-slate-500" />
      <header className="flex items-center gap-3">
        <Escudo className="h-12" />
        <div className="min-w-0 flex-1 text-[8.5pt] leading-tight text-slate-700">
          <p className="font-bold text-slate-900">{LIBRARY.nombre}</p>
          <p>{LIBRARY.facultad}</p>
          <p>{LIBRARY.universidad}</p>
        </div>
        <p className="flex shrink-0 items-end gap-1.5 text-[13pt]">
          Reserva de Cubículo <span className="min-w-[2.5rem] border-b border-slate-700 text-center font-bold">{numeroDelLugar(reserva)}</span>
          <span className="ml-3 text-[11pt]">Jornada</span>
          <span className="inline-block w-24 border-b border-slate-700" />
        </p>
      </header>

      <div className="grid grid-cols-[1fr_16rem] gap-x-6 gap-y-2">
        <Linea etiqueta="Nombre" valor={reserva.solicitante} />
        <Linea etiqueta="Carné" valor={reserva.identificacion} />
        <Linea etiqueta="No. Celular" />
        <Linea etiqueta="Llave No." />
      </div>

      <p>Por este medio es grato confirmarle que hemos aprobado su Solicitud de Reserva de un Cubículo de Estudio.</p>
      <p>Estos son los datos de su reserva:</p>
      <div className="grid grid-cols-3 gap-6">
        <Linea etiqueta="Fecha:" valor={fechaEscrita(reserva.fecha)} />
        <Linea etiqueta="Hora entrada" valor={reserva.hora} />
        <Linea etiqueta="Hora de salida" valor={reserva.horaFin} />
      </div>

      <table className="w-full table-fixed border-collapse text-center text-[8pt]">
        <thead>
          <tr>
            <th className="w-[4.5rem] border border-slate-600" />
            {equipo.map((elemento) => (
              <th key={elemento} className="border border-slate-600 px-0.5 py-1 font-semibold leading-tight">
                {elemento}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {['Buen estado', 'Mal estado'].map((fila) => (
            <tr key={fila}>
              <th className="border border-slate-600 px-1 py-1.5 text-left font-semibold">{fila}</th>
              {equipo.map((elemento) => (
                <td key={elemento} className="border border-slate-600" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <section className="text-[9pt]">
        <p className="font-semibold">Normas para el Uso de Cubículos</p>
        <ol className="mt-1 flex list-decimal flex-col gap-1 pl-6">
          <li>
            Conducta:
            <ul className="list-disc pl-6">
              <li>Uso exclusivo para actividades académicas.</li>
              <li>Prohibido escuchar música.</li>
              <li>Mantener orden y comportamiento adecuado.</li>
              <li>No se permiten besos, abrazos u otros actos afectivos.</li>
              <li>Cualquier incumplimiento puede resultar en la cancelación del préstamo.</li>
            </ul>
          </li>
          <li>
            Responsabilidad y Sanciones:
            <ul className="list-disc pl-6">
              <li>Cualquier daño (pizarrón, mobiliario, etc.) debe ser reparado de inmediato.</li>
              <li>
                De no solventarse el daño el mismo día, se suspenderán todos los servicios al grupo responsable hasta la resolución del problema.
                Se informará a la Autoridad Superior para posibles sanciones adicionales.
              </li>
            </ul>
          </li>
          <li>
            Política de Cancelación:
            <ul className="list-disc pl-6">
              <li>De existir atraso para llegar a la reserva, el titular podrá dar aviso para considerar su reserva y no cancelarla.</li>
              <li>
                De no haber dado aviso y no llegar en los {toleranciaMinutos || 30} minutos posteriores a la hora reservada, la reserva será
                cancelada, para el aprovechamiento del recurso.
              </li>
              {horasDePenalizacion > 0 ? <li>Quien no se presente a su reserva no podrá reservar durante {horasDePenalizacion} horas.</li> : null}
            </ul>
          </li>
        </ol>
      </section>

      <section>
        <p className="text-[9pt]">Firmas responsables de la reserva:</p>
        <table className="w-full table-fixed border-collapse text-[9pt]">
          <thead>
            <tr>
              <th className="w-[48%] border border-slate-600 px-2 py-0.5 text-left font-normal">Nombre del Estudiante Titular</th>
              <th className="border border-slate-600 px-2 py-0.5 text-left font-normal">Carné</th>
              <th className="border border-slate-600 px-2 py-0.5 text-left font-normal">No. De Celular</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-8">
              <td className="border border-slate-600 px-2 font-semibold">{reserva.solicitante}</td>
              <td className="border border-slate-600 px-2 font-mono font-semibold">{reserva.identificacion}</td>
              <td className="border border-slate-600" />
            </tr>
            <tr className="h-8">
              <td className="border border-slate-600" />
              <td className="border border-slate-600" />
              <td className="border border-slate-600" />
            </tr>
          </tbody>
        </table>
      </section>

      <Linea etiqueta="USO:" />
      <div className="grid grid-cols-[1fr_1fr] gap-6">
        <Linea etiqueta="Firma del Bibliotecario que recibe" />
        <Linea etiqueta="Nombre:" valor={atendidoPor} />
      </div>

      <table className="w-full table-fixed border-collapse text-[8.5pt]">
        <thead>
          <tr>
            {['DPI Vigente', 'Carné Vigente', 'Licencia Vigente', 'Otros Especifique'].map((t) => (
              <th key={t} className="border border-slate-600 px-1.5 py-0.5 text-left font-semibold">
                {t}
              </th>
            ))}
            <th className="w-[30%] border border-slate-600 px-1.5 py-0.5 text-left font-semibold">Firma de recibido por el estudiante</th>
          </tr>
        </thead>
        <tbody>
          <tr className="h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <td key={i} className="border border-slate-600" />
            ))}
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-[8pt]">
        <thead>
          <tr className="bg-slate-100">
            <th className="w-[22%] border border-slate-600 px-1.5 py-0.5 text-left font-semibold">Día</th>
            <th className="w-[38%] border border-slate-600 px-1.5 py-0.5 text-left font-semibold">Horario reservado</th>
            <th className="border border-slate-600 px-1.5 py-0.5 text-left font-semibold">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-600 px-1.5 py-1 font-semibold">{diaDeLaReserva(reserva)}</td>
            <td className="border border-slate-600 px-1.5 py-1 font-semibold">{horasDeLaReserva(reserva)}</td>
            <td className="border border-slate-600 px-1.5 py-1 align-top">
              En caso de no existir reservas electrónicas, se asignan de forma presencial. Para dudas, consultar directamente a la Jefatura.
            </td>
          </tr>
        </tbody>
      </table>

      <div className="h-1.5 bg-slate-500" />
      <footer className="flex justify-between gap-3 text-[7.5pt] text-slate-500">
        <span>{LIBRARY.nombre}</span>
        <Referencia reserva={reserva} impresaEn={impresaEn} />
      </footer>
    </article>
  );
}

// --- Estaciones y sala de lectura: media carta -----------------------------------------------------------------------

function FormatoEstacion({ reserva, horasDePenalizacion, atendidoPor, impresaEn }) {
  const equipo = EQUIPO_POR_TIPO[reserva.tipo] ?? EQUIPO_POR_TIPO.estacion;
  const esSala = reserva.tipo === 'sala_lectura';
  return (
    <article className="flex flex-col gap-2.5 rounded-[10px] border-2 border-slate-800 bg-white px-4 py-3 text-[9.5pt] leading-snug text-slate-900">
      <header className="flex items-start gap-2">
        <Escudo className="h-12" />
        <div className="min-w-0 flex-1 text-[8pt] leading-tight">
          <p className="font-bold">Biblioteca: {LIBRARY.nombreCorto.replace(/^Biblioteca /, '')}</p>
          <p>{LIBRARY.facultad}</p>
          <p>{LIBRARY.universidad}</p>
        </div>
        <div className="shrink-0 text-center">
          <p className="text-[8.5pt]">{esSala ? 'Mesa y silla' : 'No. de Estación'}</p>
          <p className={`mt-0.5 min-w-[5.5rem] rounded-md border-2 border-slate-800 px-2 py-1 font-bold leading-none ${esSala ? 'text-[10pt]' : 'text-[15pt]'}`}>
            {numeroDelLugar(reserva)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-x-3">
        <Linea etiqueta="Fecha:" valor={fechaEscrita(reserva.fecha)} />
        <Linea etiqueta="Semestre:" />
        <Linea etiqueta="Llave:" />
      </div>
      <Linea etiqueta="Nombre:" valor={reserva.solicitante} />
      <div className="grid grid-cols-2 gap-x-3">
        <Linea etiqueta="No. de Celular:" />
        <Linea etiqueta="Carné:" valor={reserva.identificacion} />
      </div>

      <table className="w-full table-fixed border-collapse text-[8.5pt]">
        <thead>
          <tr>
            <th className="w-[34%] border border-slate-700 px-1.5 py-0.5 font-semibold">Accesorios</th>
            <th className="w-[13%] border border-slate-700 px-1 py-0.5 font-semibold leading-tight">Buen estado</th>
            <th className="w-[13%] border border-slate-700 px-1 py-0.5 font-semibold leading-tight">Mal estado</th>
            <th className="border border-slate-700 px-1.5 py-0.5 font-semibold">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {equipo.map((elemento) => (
            <tr key={elemento} className="h-6">
              <td className="border border-slate-700 px-1.5 font-semibold">{elemento}</td>
              <td className="border border-slate-700" />
              <td className="border border-slate-700" />
              <td className="border border-slate-700" />
            </tr>
          ))}
        </tbody>
      </table>

      <p className="flex flex-wrap items-end gap-x-2">
        Documentos de préstamo: DPI <span className="inline-block w-8 border-b border-slate-700" /> Carné <span className="inline-block w-8 border-b border-slate-700" /> Licencia{' '}
        <span className="inline-block w-8 border-b border-slate-700" /> Otro <span className="inline-block min-w-[3rem] flex-1 border-b border-slate-700" />
      </p>
      <p className="text-[8.5pt] text-slate-600">
        Horario reservado:{' '}
        <b className="text-slate-900">
          {reserva.hora} a {reserva.horaFin}
        </b>
      </p>
      <div className="grid grid-cols-2 gap-x-4">
        <Linea etiqueta="Hora de entrada" />
        <Linea etiqueta="Hora de salida" />
      </div>

      <div className="mt-3 text-center">
        <Linea etiqueta={`Recibí conforme ${esSala ? 'el lugar' : 'Estación'}`} />
        <p className="mt-0.5 text-[8.5pt]">Firma del Estudiante</p>
      </div>

      <ol className="list-decimal rounded-lg border border-slate-800 py-1.5 pl-7 pr-2 text-[8.5pt]">
        <li>El estudiante ha recibido de conformidad {esSala ? 'el lugar de estudio' : 'la Estación de Estudio'};</li>
        <li>El uso es intransferible;</li>
        <li>El uso de casillero es exclusivo en el momento de préstamo {esSala ? 'del lugar' : 'de la estación'};</li>
        <li>Deberá entregar a la Biblioteca {esSala ? 'el lugar' : 'la estación'} antes de retirarse y recoger el documento que validó el préstamo;</li>
        <li>La Biblioteca no es responsable por objetos olvidados.</li>
        {horasDePenalizacion > 0 ? <li>Quien no se presente a su reserva no podrá reservar durante {horasDePenalizacion} horas.</li> : null}
      </ol>

      <div className="mt-3 text-center">
        <Linea etiqueta="Recibí conforme devolución del Documento" />
        <p className="mt-0.5 text-[8.5pt]">Firma del Estudiante</p>
      </div>
      <div className="ml-auto mt-4 w-1/2 text-center">
        <div className="border-b border-slate-700 pb-0.5 text-[8.5pt] font-semibold">{atendidoPor}</div>
        <p className="mt-0.5 text-[8.5pt]">Bibliotecario</p>
      </div>

      <footer className="text-center text-[7pt] text-slate-500">
        <Referencia reserva={reserva} impresaEn={impresaEn} />
      </footer>
    </article>
  );
}

export function BoletaDeReserva(props) {
  return props.reserva.tipo === 'cubiculo' ? <FormatoCubiculo {...props} /> : <FormatoEstacion {...props} />;
}

// Imprimir la boleta de una reserva: `imprimir(reserva)` abre el cuadro de impresión con solo la boleta (hoja carta para los
// cubículos, media carta para lo demás); `portal` va dentro del JSX de quien lo usa. La boleta se dibuja únicamente mientras se
// imprime; `afterprint` avisa cuando termina o se cancela. Los estilos de impresión están en theme.css.
export function useImpresionDeBoleta({ toleranciaMinutos, horasDePenalizacion = 0, atendidoPor }) {
  const [reserva, setReserva] = useState(null);
  const [impresaEn, setImpresaEn] = useState(null);

  useEffect(() => {
    if (!reserva) return undefined;
    document.body.classList.add('imprimiendo-boleta');
    const terminar = () => setReserva(null);
    window.addEventListener('afterprint', terminar, { once: true });
    window.print();
    return () => {
      window.removeEventListener('afterprint', terminar);
      document.body.classList.remove('imprimiendo-boleta');
    };
  }, [reserva]);

  const portal = reserva
    ? createPortal(
        <div id="boleta-impresion" className={reserva.tipo === 'cubiculo' ? 'carta' : 'media-carta'}>
          <BoletaDeReserva
            reserva={reserva}
            toleranciaMinutos={toleranciaMinutos}
            horasDePenalizacion={horasDePenalizacion}
            atendidoPor={atendidoPor}
            impresaEn={impresaEn}
          />
        </div>,
        document.body
      )
    : null;

  const imprimir = (nueva) => {
    setImpresaEn(new Date().toISOString());
    setReserva(nueva);
  };

  return { imprimir, portal };
}
