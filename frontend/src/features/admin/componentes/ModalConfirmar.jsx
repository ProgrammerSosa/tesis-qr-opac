import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import AlertBanner from '../../../shared/components/AlertBanner';

// Pide confirmar una acción que no se puede deshacer (eliminar, reemplazar...). `peligro` pinta el botón de rojo.
export default function ModalConfirmar({ abierto, titulo, children, textoConfirmar = 'Confirmar', peligro = false, trabajando = false, error = '', onConfirmar, onCancelar }) {
  return (
    <Modal
      open={abierto}
      title={titulo}
      onClose={trabajando ? undefined : onCancelar}
      footer={
        <>
          <Button variant="secondary" onClick={onCancelar} disabled={trabajando}>
            Cancelar
          </Button>
          <Button variant={peligro ? 'primary' : 'brand'} onClick={onConfirmar} disabled={trabajando}>
            {trabajando ? 'Un momento...' : textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-slate-700">
        <AlertBanner>{error}</AlertBanner>
        {children}
      </div>
    </Modal>
  );
}
