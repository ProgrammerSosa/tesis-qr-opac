import { QrCode } from 'lucide-react';
import BotonDescargarQr from './BotonDescargarQr';
import ThesisQr from '../../catalog/ThesisQr';
import { ACCESOS } from '../../catalog/tiposDocumento';
import { Input, Select } from '../../../shared/components/FormField';

function OpcionDeDestino({ valor, elegido, onElegir, deshabilitada, titulo, children }) {
  return (
    <label
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        deshabilitada ? 'cursor-not-allowed border-border bg-slate-50 opacity-60' : elegido ? 'cursor-pointer border-primary bg-blue-50' : 'cursor-pointer border-border bg-white hover:border-slate-400'
      }`}
    >
      <input
        type="radio"
        name="destino-qr"
        value={valor}
        checked={elegido}
        disabled={deshabilitada}
        onChange={() => onElegir(valor)}
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
      />
      <span className="min-w-0">
        <span className="block font-semibold text-slate-900">{titulo}</span>
        <span className="block text-xs leading-snug text-slate-600">{children}</span>
      </span>
    </label>
  );
}

// Parte del formulario de una tesis donde el personal escribe la URL de la tesis (el enlace de su documento digital) y ve,
// al instante, el código QR que se genera con ella (propuesta, secciones 4.3 y 4.5.6). `calculo` viene de calcularDocumentoYQr.
export default function SeccionDeDocumentoYQr({ id, urlTesis, onUrl, calculo, onAcceso, destinoQr, onDestino }) {
  const { revision, acceso, puedeUsarUrl, destino, sinCodigo } = calculo;
  const llevaAlDocumento = destino.tipo !== 'ficha';

  return (
    <section aria-labelledby="seccion-documento-qr" className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div>
        <h3 id="seccion-documento-qr" className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <QrCode size={16} className="text-primary" aria-hidden="true" />
          URL de la tesis y código QR
        </h3>
        <p className="mt-0.5 text-xs leading-snug text-slate-600">
          Escribe la URL de la tesis y el código QR de su etiqueta se genera con ella. Puedes dejarla vacía y agregarla después.
        </p>
      </div>

      <Input
        label="URL de la tesis"
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://"
        value={urlTesis}
        onChange={onUrl}
        error={revision.error}
        hint="El enlace donde está su versión digital: un PDF o una página."
      />

      <Select
        label="Acceso al documento"
        value={acceso}
        onChange={onAcceso}
        hint={revision.url || acceso !== 'sin_acceso' ? ACCESOS[acceso].detalle : 'Sin URL, la tesis queda solo como ejemplar físico.'}
      >
        {Object.entries(ACCESOS).map(([valor, { etiqueta }]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </Select>

      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-2">
          {sinCodigo ? (
            <div className="flex h-[156px] w-[156px] items-center justify-center rounded-lg border border-dashed border-border bg-white p-3 text-center text-xs text-slate-500">
              Escribe el código de la tesis o su URL para ver el QR
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-white">
              <ThesisQr id={id} size={144} enlace={destino.enlace} />
            </div>
          )}
          <BotonDescargarQr valor={sinCodigo ? '' : destino.enlace} nombreArchivo={`qr-${String(id).trim() || 'tesis'}.png`} />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">El código QR lleva a</p>
            {sinCodigo ? (
              <p className="text-sm text-slate-500">—</p>
            ) : (
              <>
                <p className="break-all font-mono text-xs leading-snug text-slate-800" data-testid="destino-del-qr">
                  {destino.visible}
                </p>
                {destino.tipo === 'enlace' ? (
                  <p className="mt-1 break-all text-xs leading-snug text-slate-500" data-testid="destino-del-qr-abre">
                    que abre <span className="font-mono">{destino.abre}</span>
                  </p>
                ) : null}
              </>
            )}
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">A dónde lleva el código QR</legend>
            <OpcionDeDestino valor="enlace" elegido={destino.tipo === 'enlace'} onElegir={onDestino} deshabilitada={!puedeUsarUrl} titulo="El documento, con el enlace corto de la biblioteca (recomendado)">
              Abre directamente el documento. Si la URL cambia, la etiqueta ya impresa sigue sirviendo, y se cuentan los escaneos. Necesita que este
              sitio esté en línea.
            </OpcionDeDestino>
            <OpcionDeDestino valor="url" elegido={destino.tipo === 'url'} onElegir={onDestino} deshabilitada={!puedeUsarUrl} titulo="El documento, con su URL tal cual">
              El código lleva escrita la URL: sirve aunque este sitio no esté en línea, pero si la URL cambia hay que reimprimir la etiqueta y no se
              cuentan los escaneos.
            </OpcionDeDestino>
            <OpcionDeDestino valor="ficha" elegido={destino.tipo === 'ficha'} onElegir={onDestino} titulo="La ficha de la tesis en este sistema">
              Dirección estable: si cambia el archivo, el código sigue sirviendo; se cuentan los escaneos y el sistema controla el acceso.
            </OpcionDeDestino>
          </fieldset>

          {!puedeUsarUrl && destinoQr !== 'ficha' ? (
            <p className="text-xs leading-snug text-slate-500">
              {revision.url
                ? 'Con «Sin acceso digital» el documento no se ofrece al público, por eso el código lleva a la ficha.'
                : 'Mientras no haya una URL válida, el código lleva a la ficha de la tesis.'}
            </p>
          ) : destino.tipo === 'url' && destino.enlace.length > 200 ? (
            <p className="text-xs leading-snug text-amber-800">
              La URL es muy larga: el código QR saldrá muy denso y será difícil de leer al imprimirlo. Usa el enlace corto de la biblioteca, que
              siempre da un código pequeño.
            </p>
          ) : llevaAlDocumento && acceso === 'consulta' ? (
            <p className="text-xs leading-snug text-amber-800">
              Al abrir el documento directamente, el sitio donde está decide si el archivo se puede descargar. Para que la biblioteca controle el
              acceso, haz que el código lleve a la ficha.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
