import { useRef, useState } from 'react';
import { CircleCheck, Download, FileUp } from 'lucide-react';
import { adminApi } from '../adminApi';
import { PLANTILLA_CSV, leerArchivoDelCatalogo } from '../catalogoCsv';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import Nota from '../../../shared/components/Nota';
import { Checkbox, Select } from '../../../shared/components/FormField';

const MAXIMO = 5000;

function descargarPlantilla() {
  const blob = new Blob(['﻿', PLANTILLA_CSV], { type: 'text/csv;charset=utf-8' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = 'plantilla-catalogo.csv';
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

// Importación masiva del catálogo desde una hoja de cálculo (CSV) o un JSON. Se muestra una vista previa antes de enviar y,
// al terminar, el resultado fila por fila de lo que no se pudo importar.
export default function ImportarCatalogoModal({ esAdministrador, onCerrar, onTerminada }) {
  const [archivo, setArchivo] = useState(null);
  const [lectura, setLectura] = useState(null);
  const [existentes, setExistentes] = useState('omitir');
  const [reemplazar, setReemplazar] = useState(false);
  const [entiendo, setEntiendo] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const entrada = useRef(null);

  async function elegir(e) {
    const elegido = e.target.files?.[0];
    if (!elegido) return;
    setArchivo(elegido);
    setLectura(null);
    setResultado(null);
    setError('');
    try {
      const leido = await leerArchivoDelCatalogo(elegido);
      if (leido.registros.length === 0) {
        setError('No se encontraron filas para importar. Revisa que el archivo tenga encabezados en la primera fila.');
      } else if (!leido.columnas.includes('id') || !leido.columnas.includes('titulo')) {
        setError('El archivo debe tener al menos las columnas «codigo» y «titulo». Descarga la plantilla para ver cómo se arma.');
      } else if (leido.registros.length > MAXIMO) {
        setError(`El archivo tiene ${leido.registros.length} filas: importa como máximo ${MAXIMO} por vez (divídelo en partes).`);
      } else {
        setLectura(leido);
      }
    } catch (err) {
      setError(err instanceof SyntaxError ? 'El archivo JSON no está bien formado.' : err.message || 'No se pudo leer el archivo');
    }
  }

  async function importar() {
    setTrabajando(true);
    setError('');
    try {
      const res = await adminApi.importarCatalogo({ filas: lectura.registros, existentes, reemplazar });
      setResultado(res.data.data);
      onTerminada();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo importar el catálogo'));
    } finally {
      setTrabajando(false);
    }
  }

  const puedeImportar = lectura && !trabajando && (!reemplazar || entiendo);

  return (
    <Modal
      open
      title="Importar tesis al catálogo"
      onClose={trabajando ? undefined : onCerrar}
      ancho="max-w-2xl"
      footer={
        resultado ? (
          <Button variant="brand" onClick={onCerrar}>
            Listo
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onCerrar} disabled={trabajando}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={importar} disabled={!puedeImportar}>
              {trabajando ? 'Importando...' : lectura ? `Importar ${lectura.registros.length} filas` : 'Importar'}
            </Button>
          </>
        )
      }
    >
      {resultado ? (
        <div className="flex flex-col gap-4 text-sm">
          <Nota tono={resultado.creadas + resultado.actualizadas > 0 ? 'ok' : 'aviso'} titulo="Importación terminada">
            {resultado.creadas} nuevas · {resultado.actualizadas} actualizadas · {resultado.omitidas} omitidas (ya existían) · {resultado.totalErrores} con errores.
          </Nota>
          {resultado.errores.length > 0 ? (
            <div>
              <p className="font-bold text-slate-900">Filas que no se importaron</p>
              <ul className="mt-2 max-h-52 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                {resultado.errores.map((e) => (
                  <li key={`${e.fila}-${e.motivo}`} className="px-3 py-2">
                    <span className="font-mono text-xs text-slate-500">Fila {e.fila + 1}</span> <span className="text-slate-800">{e.motivo}</span>
                  </li>
                ))}
              </ul>
              {resultado.totalErrores > resultado.errores.length ? (
                <p className="mt-1 text-xs text-slate-500">Se muestran las primeras {resultado.errores.length} de {resultado.totalErrores}.</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">El número de fila es el de la hoja de cálculo (la fila 1 son los encabezados).</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-sm text-slate-700">
          <AlertBanner>{error}</AlertBanner>

          <p className="leading-relaxed">
            Sube la hoja de cálculo del catálogo en formato <b>CSV</b> (puedes guardarla así desde Excel o Google Sheets) o un archivo <b>JSON</b>. La primera fila son
            los encabezados. Obligatorias: <b>codigo</b>, <b>titulo</b>, <b>autor</b> y <b>anio</b>; las demás columnas son opcionales. Con <b>url</b> (la URL de
            la tesis, de la que sale su código QR) y <b>acceso</b> (descarga, consulta o sin acceso) cada tesis queda con su documento digital.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <input ref={entrada} type="file" accept=".csv,.json,text/csv,application/json" onChange={elegir} className="sr-only" id="archivo-catalogo" />
            <Button variant="brand" icon={FileUp} onClick={() => entrada.current?.click()}>
              {archivo ? 'Elegir otro archivo' : 'Elegir archivo'}
            </Button>
            <Button variant="secondary" icon={Download} onClick={descargarPlantilla}>
              Descargar plantilla
            </Button>
            {archivo ? <span className="truncate text-xs text-slate-500">{archivo.name}</span> : null}
          </div>

          {lectura ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
              <p className="flex items-center gap-2 font-bold text-slate-900">
                <CircleCheck size={18} className="text-primary" aria-hidden="true" />
                {lectura.registros.length} filas listas para importar
              </p>
              <p className="text-xs text-slate-600">
                Columnas reconocidas: <span className="font-mono">{lectura.columnas.join(', ')}</span>
                {lectura.ignoradas.length > 0 ? (
                  <>
                    <br />
                    Se ignorarán: <span className="font-mono">{lectura.ignoradas.join(', ')}</span>
                  </>
                ) : null}
              </p>
              <ul className="divide-y divide-border rounded-lg border border-border bg-white text-xs">
                {lectura.registros.slice(0, 3).map((r, i) => (
                  <li key={i} className="px-3 py-2">
                    <span className="font-mono text-slate-500">{r.id ?? '—'}</span> <span className="font-semibold text-slate-900">{r.titulo ?? '(sin título)'}</span>
                    <span className="block text-slate-500">
                      {r.autor ?? '(sin autor)'} · {r.anio ?? '(sin año)'}
                    </span>
                  </li>
                ))}
              </ul>

              <Select label="Si el código ya existe en el catálogo" value={existentes} onChange={(e) => setExistentes(e.target.value)}>
                <option value="omitir">Dejar la tesis como está (omitir la fila)</option>
                <option value="actualizar">Actualizar sus datos con los del archivo</option>
              </Select>

              {esAdministrador ? (
                <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <Checkbox checked={reemplazar} onChange={(e) => { setReemplazar(e.target.checked); setEntiendo(false); }}>
                    <b>Reemplazar todo el catálogo</b> (borra las tesis actuales, incluidas las de ejemplo, y deja solo las del archivo).
                  </Checkbox>
                  {reemplazar ? (
                    <Checkbox checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)}>
                      Entiendo que se perderán las tesis que no estén en el archivo, con sus documentos digitales y códigos QR.
                    </Checkbox>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
