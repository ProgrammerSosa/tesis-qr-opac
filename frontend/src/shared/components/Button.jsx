const VARIANTS = {
  primary: 'bg-action text-white shadow-sm hover:bg-action-dark',
  brand: 'bg-primary text-white shadow-sm hover:bg-primary-dark',
  secondary: 'bg-white text-primary border border-border hover:border-primary',
  toggled: 'bg-blue-50 text-primary border border-primary',
};

export default function Button({ variant = 'secondary', className = '', children, icon: Icon, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
