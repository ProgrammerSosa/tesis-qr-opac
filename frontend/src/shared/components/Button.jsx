const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-light',
  secondary: 'bg-white text-primary border border-border hover:border-primary',
  toggled: 'bg-surface text-primary border border-accent',
};

export default function Button({ variant = 'secondary', className = '', children, icon: Icon, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
