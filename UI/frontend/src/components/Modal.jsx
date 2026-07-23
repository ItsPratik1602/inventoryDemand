function Modal({ open, title, onClose, children, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="app-card w-full max-w-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-button app-button-ghost rounded-xl px-3 py-2"
          >
            Close
          </button>
        </div>

        <div className="mt-5">{children}</div>

        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export default Modal;
