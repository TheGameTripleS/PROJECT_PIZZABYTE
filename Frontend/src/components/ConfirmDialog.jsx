import React, { useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * ConfirmDialog Component
 * Reusable modal for confirmation dialogs
 * Usage: Create ref → call openConfirm() → handle onConfirm callback
 */
export const ConfirmDialog = React.forwardRef((props, ref) => {
  const dialogRef = useRef(null);
  const [state, setState] = React.useState({
    title: 'Confirm Action',
    message: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
    onConfirm: () => {},
  });

  const openConfirm = (config) => {
    setState({
      title: config.title || 'Confirm Action',
      message: config.message || 'Are you sure?',
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      isDangerous: config.isDangerous || false,
      onConfirm: config.onConfirm || (() => {}),
    });
    dialogRef.current?.showModal();
  };

  const handleConfirm = async () => {
    try {
      await state.onConfirm();
      dialogRef.current?.close();
    } catch (error) {
      console.error('Error in confirmation:', error);
      toast.error('An error occurred');
    }
  };

  const handleCancel = () => {
    dialogRef.current?.close();
  };

  React.useImperativeHandle(ref, () => ({
    openConfirm,
  }));

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{state.title}</h3>
        <p className="py-4 text-sm text-base-content/70">{state.message}</p>
        <div className="modal-action">
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleCancel}
          >
            {state.cancelText}
          </button>
          <button
            className={`btn btn-sm ${
              state.isDangerous
                ? 'btn-error text-white'
                : 'btn-primary'
            }`}
            onClick={handleConfirm}
          >
            {state.confirmText}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleCancel}>Close</button>
      </form>
    </dialog>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
