import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({ label, icon: Icon, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-md bg-primary px-4 py-3 text-left text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
      >
        {Icon ? <Icon size={20} /> : null}
        <span className="flex-1">{label}</span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-border bg-white py-1 shadow-lg"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

const ITEM_CLASS = 'block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-surface hover:text-primary';

export function DropdownItem({ to, href, onClick, children }) {
  if (to) {
    return (
      <Link role="menuitem" to={to} className={ITEM_CLASS}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a role="menuitem" href={href} target="_blank" rel="noopener noreferrer" className={ITEM_CLASS}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" role="menuitem" onClick={onClick} className={ITEM_CLASS}>
      {children}
    </button>
  );
}
