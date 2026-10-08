import { Printer } from 'lucide-react';
import BotonDescargarQr from './BotonDescargarQr';
import ThesisQr, { destinoDelQrDe } from '../../catalog/ThesisQr';
import Button from '../../../shared/components/Button';
import Nota from '../../../shared/components/Nota';

// Lo que se muestra al terminar de agregar una tesis: su código QR ya generado, listo para imprimir la etiqueta o bajar la imagen.
export default function TesisAgregada({ tesis, onImprimir }) {
  const destino = destinoDelQrDe(tesis);
  const conUrl = Boolean(tesis.documentoDigital.urlExterna);

  return (
    <div className="flex flex-col gap-4">
      <Nota tono="ok" titulo={`Se agregó la tesis ${tesis.id}`}>
        {conUrl
          ? 'Quedó con su URL y su código QR, listo para imprimir.'
          : 'Quedó sin URL, así que su código QR lleva a la ficha. Cuando tenga URL, agrégala con «Editar» en el catálogo.'}
      </Nota>

      <div className="grid items-center gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="mx-auto rounded-lg border border-border bg-white">
          <ThesisQr id={tesis.id} size={156} enlace={destino.enlace} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="font-semibold leading-snug text-slate-900">{tesis.titulo}</p>
          <p className="text-xs text-slate-600">
            {tesis.autor} · {tesis.anio} · <span className="font-mono">{tesis.id}</span>
          </p>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">El código QR lleva a</p>
          <p className="break-all font-mono text-xs leading-snug text-slate-800" data-testid="destino-del-qr-guardado">
            {destino.visible}
          </p>
          <p className="text-xs text-slate-500">{destino.tipo === 'url' ? 'Directo a la URL de la tesis.' : 'A la ficha de la tesis en este sistema.'}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="brand" icon={Printer} onClick={() => onImprimir(tesis)}>
              Imprimir etiqueta
            </Button>
            <BotonDescargarQr valor={destino.enlace} nombreArchivo={`qr-${tesis.id}.png`} />
          </div>
        </div>
      </div>
    </div>
  );
}
