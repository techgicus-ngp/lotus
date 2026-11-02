import { IconClose, IconLogout, IconSearch } from '../icons';

export function Spinner({ color = '#4F46E5', size = 36 }) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size, borderColor: `${color}33`, borderTopColor: color }}
    />
  );
}

export function CenterSpinner() {
  return (
    <div className="center-fill">
      <Spinner />
    </div>
  );
}

/** Search box used on the Maps and Quotations tabs. */
export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="searchbar">
      <IconSearch size={22} color="#4F46E5" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && (
        <button className="searchbar-clear" onClick={() => onChange('')} aria-label="Clear search">
          <IconClose size={16} />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

/** Bottom sheet / centred dialog. */
export function Modal({ open, onClose, children, sheet = true }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={sheet ? 'modal-sheet' : 'modal-dialog'} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel} sheet={false}>
      <h3 className="dlg-title">{title}</h3>
      <p className="dlg-text">{message}</p>
      <div className="dlg-actions">
        <button className="btn btn-text" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function PageHeader({ eyebrow, title, subtitle, onLogout, children }) {
  return (
    <header className="app-header">
      <div className="app-header-orb orb-a" />
      <div className="app-header-orb orb-b" />
      <div className="app-header-inner">
        <div className="app-header-row">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            <div className="subtitle">{subtitle}</div>
          </div>
          <button className="icon-btn-glass" onClick={onLogout} aria-label="Log out" title="Log out">
            <IconLogout size={20} />
          </button>
        </div>
        {children}
      </div>
    </header>
  );
}
